/**
 * CURIOUS WORLD — free Google Apps Script backend
 * 1. Create a Google Sheet, then Extensions > Apps Script.
 * 2. Paste this file into Code.gs.
 * 3. Deploy as a Web app: Execute as Me; access Anyone.
 * 4. Copy the web app URL into index.html as CURIOUS_WORLD_ENDPOINT.
 * 5. Run setupDailyTrigger() once and approve permissions.
 */
const CATEGORIES = ["Science","History","Nature & Wildlife","Space & Astronomy","Culture & Traditions","Technology","Mysteries","Extraordinary People","Amazing Places","Supernatural"];
const FEEDS = [
  ["https://feeds.bbci.co.uk/news/world/rss.xml","World"],
  ["https://feeds.bbci.co.uk/news/science_and_environment/rss.xml","Science"],
  ["https://feeds.bbci.co.uk/news/technology/rss.xml","Technology"],
  ["https://www.nasa.gov/rss/dyn/breaking_news.rss","Space & Astronomy"],
  ["https://www.smithsonianmag.com/rss/latest_articles/","History"],
  ["https://www.nationalgeographic.com/content/dam/ngdotcom/rights-exempt/rss/index.xml","Nature & Wildlife"]
];
const FACTS = [
 ["A day on Venus is longer than its year.","Venus takes about 243 Earth days to rotate once, but about 225 Earth days to orbit the Sun."],
 ["Sharks are older than trees.","Shark ancestors appeared more than 400 million years ago; the earliest known trees came later."],
 ["A group of flamingos is called a flamboyance.","The collective noun is wonderfully apt for these vividly coloured birds."],
 ["Wombats produce cube-shaped poo.","Their unusual intestine structure shapes the droppings into cubes."],
 ["The Eiffel Tower can grow taller in summer.","Heat makes the iron expand, changing the tower's height slightly."],
 ["Some turtles can breathe through their backsides.","Certain freshwater turtles can absorb oxygen through specialised tissues near the cloaca."],
 ["Neutron stars are extraordinarily dense.","They pack more mass than the Sun into a sphere roughly the size of a city."],
 ["The Anglo-Zanzibar War lasted less than an hour.","It is commonly cited as lasting around 38 to 45 minutes."],
 ["There are more possible chess games than atoms in the observable universe.","The number of possible game variations is astronomically large."],
 ["Some fungi create vast underground networks.","Mycelium threads connect through soil and interact with plants."]
];
function doGet(e) {
  const p=e.parameter||{}, action=p.action||"stories", callback=(p.callback||"").replace(/[^\w$]/g,"");
  let result;
  if(action==="stories") result={ok:true,stories:getStories()};
  else if(action==="subscribe") result=subscribe(p);
  else if(action==="unsubscribe") result=unsubscribe(p.email,p.token);
  else result={ok:false,message:"Unknown action"};
  const body=callback?callback+"("+JSON.stringify(result)+");":JSON.stringify(result);
  return ContentService.createTextOutput(body).setMimeType(callback?ContentService.MimeType.JAVASCRIPT:ContentService.MimeType.JSON);
}
function setupDailyTrigger() {
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==="dailyUpdate").forEach(t=>ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("dailyUpdate").timeBased().everyDays(1).atHour(7).create();
  dailyUpdate();
}
function dailyUpdate() {
  const stories=fetchStories();
  PropertiesService.getScriptProperties().setProperty("stories",JSON.stringify(stories));
  sendDailyEmails(stories);
}
function fetchStories() {
  const found=[], seen={};
  FEEDS.forEach(feed=>{
    try {
      const xml=UrlFetchApp.fetch(feed[0],{muteHttpExceptions:true,followRedirects:true}).getContentText();
      const doc=XmlService.parse(xml), root=doc.getRootElement();
      const channel=root.getChild("channel");
      let items=channel?channel.getChildren("item"):[];
      if(!items.length){const ns=root.getNamespace();const entries=root.getChildren("entry",ns);items=entries;}
      items.slice(0,25).forEach(item=>{
        const title=childText(item,"title"), link=childText(item,"link")||attrValue(item,"link","href");
        const desc=stripHtml(childText(item,"description")||childText(item,"summary")||childText(item,"content")).slice(0,420);
        if(!title||!link||seen[link])return;seen[link]=true;
        const category=classify(title+" "+desc,feed[1]);
        found.push({title,summary:desc||"A new story from a trusted public source. Open the original article to explore the full report.",category,source:feed[1],url:link,symbol:iconFor(category)});
      });
    } catch(err) { console.log("Feed issue: "+feed[0]+" "+err); }
  });
  return found.sort((a,b)=>a.title.localeCompare(b.title)).slice(0,60);
}
function childText(el,name){const c=el.getChild(name);return c?c.getText():"";}
function attrValue(el,name,attr){const c=el.getChild(name);return c&&c.getAttribute(attr)?c.getAttribute(attr).getValue():"";}
function stripHtml(s){return String(s).replace(/<[^>]*>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g," ").trim();}
function classify(text,fallback){
 const t=text.toLowerCase(), rules=[
 ["Supernatural",/ghost|haunt|paranormal|folklore|witchcraft|supernatural|mythical/],
 ["Space & Astronomy",/space|planet|nasa|moon|mars|star|astronom|universe|telescope/],
 ["Nature & Wildlife",/animal|wildlife|species|ocean|forest|plant|bird|shark|whale|climate|nature/],
 ["Technology",/artificial intelligence|robot|computer|technology|chip|internet|cyber|invention/],
 ["Science",/scientist|research|study|physics|chemistry|biology|discovery|experiment/],
 ["History",/ancient|archaeolog|history|historical|empire|medieval|century|museum/],
 ["Culture & Traditions",/culture|tradition|festival|language|food|music|heritage/],
 ["Amazing Places",/island|mountain|cave|desert|village|city|landscape|travel/],
 ["Extraordinary People",/rescued|hero|pioneer|artist|explorer|record-breaking|extraordinary/],
 ["Mysteries",/mystery|mysterious|unexplained|puzzle|missing|enigma/]
 ];
 for(const r of rules)if(r[1].test(t))return r[0];
 return CATEGORIES.indexOf(fallback)>=0?fallback:"Mysteries";
}
function iconFor(c){return {"Science":"🧪","History":"🏛️","Nature & Wildlife":"🌿","Space & Astronomy":"🪐","Culture & Traditions":"🎭","Technology":"🤖","Mysteries":"🧩","Extraordinary People":"🧭","Amazing Places":"🌍","Supernatural":"🌙"}[c]||"✳";}
function getStories(){try{return JSON.parse(PropertiesService.getScriptProperties().getProperty("stories")||"[]");}catch(e){return [];}}
function getSheet(){const id=PropertiesService.getScriptProperties().getProperty("SHEET_ID");if(id)return SpreadsheetApp.openById(id);const ss=SpreadsheetApp.create("Curious World subscribers");PropertiesService.getScriptProperties().setProperty("SHEET_ID",ss.getId());const sh=ss.getActiveSheet();sh.setName("Subscribers");sh.appendRow(["Email","Categories","Token","Active","Subscribed"]);return ss;}
function subscribe(p){
 if(p.website)return {ok:false,message:"Unable to process signup."};
 const email=String(p.email||"").trim().toLowerCase(), cats=String(p.categories||"").split(",").filter(c=>CATEGORIES.includes(c));
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!cats.length||p.consent!=="yes")return {ok:false,message:"Please enter a valid email and choose at least one category."};
 const sh=getSheet().getSheetByName("Subscribers"), data=sh.getDataRange().getValues();
 const token=Utilities.getUuid();
 for(let i=1;i<data.length;i++){if(String(data[i][0]).toLowerCase()===email){sh.getRange(i+1,2,1,4).setValues([[cats.join(","),token,true,new Date()]]);return {ok:true};}}
 sh.appendRow([email,cats.join(","),token,true,new Date()]);return {ok:true};
}
function unsubscribe(email,token){
 const sh=getSheet().getSheetByName("Subscribers"),data=sh.getDataRange().getValues();
 for(let i=1;i<data.length;i++)if(data[i][0]===email&&data[i][2]===token){sh.getRange(i+1,4).setValue(false);return {ok:true};}
 return {ok:false,message:"Unsubscribe link is invalid or expired."};
}
function sendDailyEmails(stories){
 const sh=getSheet().getSheetByName("Subscribers"), rows=sh.getDataRange().getValues(), day=Math.floor(Date.now()/86400000), fact=FACTS[((day%FACTS.length)+FACTS.length)%FACTS.length];
 rows.slice(1).forEach(row=>{
  const email=row[0], cats=String(row[1]||"").split(","), token=row[2], active=row[3];
  if(!email||!active)return;
  const matches=stories.filter(s=>cats.includes(s.category)).slice(0,8);
  const html=buildEmail(matches,fact,email,token);
  try{GmailApp.sendEmail(email,"Your Curious World daily discoveries",plainText(matches,fact),{htmlBody:html,name:"Curious World"});}catch(e){console.log("Email failed for "+email+": "+e);}
 });
}
function buildEmail(stories,fact,email,token){
 const items=stories.length?stories.map(s=>`<li style="margin:0 0 18px"><b>${escapeHtml(s.title)}</b><br><span style="color:#5b6673">${escapeHtml(s.category)} · ${escapeHtml(s.summary)}</span><br><a href="${escapeAttr(s.url)}">Read the original story →</a></li>`).join(""):"<p>No new stories in your selected categories today. Your fact of the day is below — more discoveries tomorrow.</p>";
 const base=ScriptApp.getService().getUrl(),unsub=base+"?action=unsubscribe&email="+encodeURIComponent(email)+"&token="+encodeURIComponent(token);
 return `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#142236"><div style="background:#101c2b;color:white;padding:26px;border-radius:14px"><h1 style="margin:0;color:#d5f36a">✳ curious world</h1><p>Your daily dose of wonder</p></div><div style="padding:24px"><h2>Stories to spark your curiosity</h2><ul style="padding-left:20px">${items}</ul><div style="background:#e9f4d0;padding:20px;border-radius:12px"><small>FACT OF THE DAY</small><h3>${escapeHtml(fact[0])}</h3><p>${escapeHtml(fact[1])}</p></div><p style="font-size:12px;color:#68788b">You're receiving this because you subscribed to Curious World. <a href="${escapeAttr(unsub)}">Unsubscribe</a>.</p></div></div>`;
}
function plainText(stories,fact){return "CURIOUS WORLD\n\n"+stories.map(s=>s.title+"\n"+s.summary+"\n"+s.url).join("\n\n")+"\n\nFACT OF THE DAY\n"+fact.join("\n");}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function escapeAttr(s){return escapeHtml(s);}
