# Rapid Fire Website

Static first version for the Rapid Fire improv team site. The public site lives in `docs/` so GitHub Pages can publish it without a build step.

## Edit The Site From The Hidden Admin Page

The public site reads page copy from `docs/data/content.json` and upcoming shows from `docs/data/shows.json`. The hidden admin page at `docs/admin.html` lets teammates edit copy, add shows, preview changes, and publish without touching code.

The admin page is intentionally not linked from the public navigation. Type `/admin.html` after the site URL to open it.

To publish from the admin page, use a GitHub fine-grained personal access token with read/write `Contents` permission for this repository only. Paste that token into the "GitHub save key" field, edit copy or shows, then click the matching publish button. The token is not committed to the repository. "Remember on this device" stores it only in that browser.

Show fields:

| field | example |
| --- | --- |
| `date` | `2026-08-16` |
| `time` | `7:30 PM` |
| `title` | `Sunday Night Rapid Fire` |
| `venue` | `The Lantern Room` |
| `address` | `123 Main St` |
| `ticket_url` | `https://tickets.example.com/show` or `#booking` |
| `description` | `A high-speed short-form set with guest players.` |
| `status` | `On sale`, `Details soon`, or `hidden` |
| `featured` | Checked for a highlighted card |

Do not put passwords, private notes, or unreleased internal details in public site files. A hidden URL keeps the page out of normal browsing, but the site is still static and public.

## Local Preview

Run a simple local server from `docs/`, then open the printed URL in a browser. The JSON show feed uses `fetch`, so a local server is better than opening the HTML file directly.

```powershell
cd docs
py -m http.server 8000
```

Public preview: `http://localhost:8000/`

Hidden admin preview: `http://localhost:8000/admin.html`

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
