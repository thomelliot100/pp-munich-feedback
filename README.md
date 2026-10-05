# Pizza Pilgrims München — Feedback

Internal feedback app for the Munich openings. Site leads, the opening team and leadership answer a few quick questions, then add anything else as text, a voice note or photos. It works in any phone browser; add it to the home screen and it behaves like an app.

- **App:** hosted on GitHub Pages
- **Data:** a Google Sheet (one tab per group), with voice notes and photos in a Google Drive folder

## What's in the repo
| Path | What it is |
|---|---|
| `index.html` | The whole app. Questions, sites and settings are in `CONFIG` near the top of the script. |
| `google/Code.gs` | The Google Apps Script that receives feedback and writes it to the Sheet and Drive. |
| `fonts/` | PizzaPilgrims (headlines) and Chelsea Light/Bold, as web fonts. |
| `assets/` | Logo (transparent PNGs from the master artwork) and home-screen icons. |
| `manifest.json` | Home-screen install. |

## Setup (about 20 minutes)
Use a Pizza Pilgrims Google account, not a personal one, so the data stays with the company.

1. **Sheet:** create a blank Google Sheet called "Munich feedback". Copy its ID from the URL (`/spreadsheets/d/<ID>/edit`).
2. **Folder:** create a Drive folder called "Munich feedback media". Copy its ID from the URL (`/folders/<ID>`).
3. **Script:** in the Sheet, open Extensions → Apps Script. Paste in `google/Code.gs`. Fill in `SHEET_ID`, `FOLDER_ID` and `ACCESS_CODE`.
4. Run `testSetup` once from the editor and approve the permissions.
5. **Deploy → New deployment → Web app.** Execute as: **Me**. Who has access: **Anyone**. Copy the URL ending `/exec`.
6. In `index.html`, paste that URL into `CONFIG.scriptUrl` and the Sheet link into `CONFIG.sheetUrl`.
7. **GitHub:** push the repo → Settings → Pages → Deploy from branch → `main` / root.

"Anyone" access only means the app can post to the script without a Google login. Nobody can read the Sheet or folder unless you share them. The team code stops strangers posting.

**If you edit `Code.gs` later:** Deploy → Manage deployments → edit → Version: New version. That keeps the same URL.

## Links and QR codes
- Site leads: `…/?site=muc-1&role=sitelead`
- Opening team / head office: `…/?role=support`
- Leadership: `…/?role=leadership`

## Changing questions
Edit `CONFIG.roles` in `index.html` and push. Types: `rating` (1–5), `nps` (0–10), `choice`, `multi`. Every label has `en` and `de`. New questions get a new column in the Sheet automatically. Rewording a question also creates a new column, so make small fixes in the Sheet header as well.

## Changing the team code
Edit `ACCESS_CODE` in Apps Script and deploy a new version. People re-enter the code once.

## Analysis
Filter, sort and pivot in the Sheet. For deeper analysis, point Claude at the Sheet or export it as CSV.

## Housekeeping
- **Retention:** decide how long to keep voice notes and photos, and clear the folder on a schedule.
- **Fonts:** Chelsea is a licensed Red Rooster typeface. Check the web-font licence covers use on a website.
- **Limits:** Apps Script handles this volume easily. Each submission is capped at 2-minute voice notes and 4 compressed photos.
