# Curious World — free website starter

A responsive, no-paid-tier website with 10 categories, a daily fact, searchable story cards, category preferences and a free email subscription flow.

## What is included

- `index.html` — the public website. It works as a local preview immediately.
- `apps-script/Code.gs` — a free Google Apps Script backend that:
  - fetches public RSS feeds once a day,
  - classifies stories into the 10 categories,
  - serves the latest story feed to the website,
  - stores subscriber preferences in a Google Sheet,
  - emails each subscriber a daily digest and fact of the day,
  - provides an unsubscribe link.
- `README.md` — setup guide.

## Free setup

### 1. Publish the website for free

1. Create a GitHub account and a new public repository named `curious-world`.
2. Upload `index.html` to the repository root.
3. In the repository, open **Settings → Pages**.
4. Choose **Deploy from a branch**, select `main` and `/ (root)`, then Save.
5. GitHub Pages will show your public website address after it builds.

### 2. Turn on daily stories and email

1. Sign in to a Google account and open [Google Apps Script](https://script.google.com/).
2. Create a new project and replace the contents of `Code.gs` with `apps-script/Code.gs`.
3. In **Project Settings**, set the timezone you want daily emails to follow.
4. Click **Deploy → New deployment → Web app**.
5. Set **Execute as: Me** and **Who has access: Anyone**, then deploy and authorise the requested permissions.
6. Copy the deployed Web App URL. It ends in `/exec`.
7. In `index.html`, find this line near the end of the `<script>` section:
   `window.CURIOUS_WORLD_ENDPOINT||""`
   Add this line immediately before the other JavaScript:
   `window.CURIOUS_WORLD_ENDPOINT = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";`
8. Upload the updated `index.html` to GitHub.
9. In Apps Script, choose `setupDailyTrigger` from the function dropdown and click **Run** once. Approve permissions. This creates the daily trigger and performs the first feed refresh.

### 3. Check it

- Open the public website and subscribe using your own email address.
- The first digest is sent on the next scheduled run (the trigger is configured for around 7am in the Apps Script project timezone).
- Apps Script → **Executions** shows feed and email errors.
- The first successful run creates a Google Sheet named `Curious World subscribers` in your Drive.

## Free-tier and editorial notes

- GitHub Pages and Google Apps Script have free usage allowances, but Google applies daily email and URL-fetch quotas. This is suitable for a small, free community; it is not unlimited or a guaranteed commercial email platform.
- The included RSS sources and keyword rules are a starter configuration. Feeds can change, be unavailable, or have reuse restrictions. Review each source's terms and replace/add feeds you have permission to use.
- Story cards link to original publishers. The site does not republish full articles.
- Category classification is automated and can be imperfect. In particular, **Supernatural** is presented as folklore, legends and unexplained claims, not as verified evidence of paranormal events.
- The sample cards in the first-run preview are illustrative starter summaries. They are replaced by stories returned by the live RSS backend once it is configured.
- This starter does not use paid APIs, paid hosting or a paid subscription tier. You remain responsible for privacy notices, lawful email consent, unsubscribe handling and compliance with applicable email/privacy rules (including UK GDPR and PECR if operating in the UK).

## Customisation

Edit the `CATEGORIES`, `FEEDS`, `FACTS` and `classify()` sections in `Code.gs` to change sources, daily facts and classification. Keep source links visible and check source terms before using any feed.
