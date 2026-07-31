# Rapid Fire Website

Static first version for the Rapid Fire improv team site. The public site lives in `docs/` so GitHub Pages can publish it without a build step.

## Edit The Site From Google Sheets

The site can use sample content from `docs/config.js` or read from published Google Sheet CSV tabs.

Use the templates in `docs/`:

| template | controls |
| --- | --- |
| `content-template.csv` | Page copy, headings, buttons, nav labels, meta text, hidden admin text |
| `shows-template.csv` | Upcoming show cards |
| `cast-template.csv` | Team/cast cards |

The content sheet columns are:

| column | purpose |
| --- | --- |
| `key` | The website text slot, such as `hero.tagline` |
| `value` | The text to show on the site |
| `where_it_appears` | Human-friendly note for editors |
| `status` | Use `active`; use `hidden` to ignore a row |
| `notes` | Optional editing notes |

The shows sheet columns are:

| column | example |
| --- | --- |
| `date` | `2026-08-16` |
| `time` | `7:30 PM` |
| `title` | `Sunday Night Rapid Fire` |
| `venue` | `The Lantern Room` |
| `address` | `123 Main St` |
| `ticket_url` | `https://tickets.example.com/show` |
| `description` | `A high-speed short-form set with guest players.` |
| `status` | `On sale` |
| `featured` | `true` |

The cast sheet columns are:

| column | example |
| --- | --- |
| `sort_order` | `1` |
| `name` | `The Rapid Fire Ensemble` |
| `role` | `Improv team` |
| `bio` | `Quick characters and sharper edits.` |
| `status` | `active` |

After publishing each Google Sheet tab as CSV, paste the public CSV URLs into `contentSheetCsvUrl`, `googleSheetCsvUrl`, and `castSheetCsvUrl` in `docs/config.js`. Paste the normal shared Google Sheet edit URL into `adminSheetUrl`; the hidden Team Edit page links there and Google handles teammate login.

Do not put passwords, API keys, private notes, or unreleased internal details in `docs/config.js` or the published sheet.

## Local Preview

Open `docs/index.html` in a browser. No install step is required.

## GitHub Pages

Publish the site directly from the `docs/` folder.

In GitHub:

1. Open the repository settings.
2. Go to Pages.
3. Under "Build and deployment", choose "Deploy from a branch".
4. Set the branch to `main` and the folder to `/docs`.
5. Save.

Typical first push from this computer:

```powershell
git add .gitignore docs README.md
git commit -m "Initial Rapid Fire static site"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-REPO.git
git push -u origin main
```
