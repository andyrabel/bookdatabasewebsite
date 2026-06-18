# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running locally

There is no build step. Serve the static files with any local HTTP server (required because `fetch()` is blocked on `file://` URLs):

```
python3 -m http.server 8080      # http://localhost:8080
npx serve .                      # http://localhost:3000
```

## Architecture

This is a fully static, zero-dependency site. There is no framework, no bundler, and no backend.

**Data source:** Book records are loaded at runtime from a published Google Sheets CSV (`CSV_URL` at the top of `app.js`). All filtering, sorting, and rendering happens entirely in the browser against this in-memory data.

**`app.js` — all logic**

- `parseCSV` — RFC 4180-compliant parser; the sheet's first row is treated as headers, producing an array of plain objects keyed by column name.
- `populateFilters` — builds the category and age-range `<select>` options dynamically from the loaded data.
- `applyFilters` — reads all four controls (search, category, age, sort) and re-renders the filtered+sorted subset. "Newest first" reverses CSV row order; "No Age Range" matches books with an empty `Age Range` field.
- `renderCard` / `renderBooks` — pure HTML-string rendering; cards are injected via `innerHTML`.
- `openModal` / `closeModal` — a single shared modal overlay is reused for every book detail view.
- `driveThumbUrl` — converts Google Drive share URLs to `drive.google.com/thumbnail` URLs (CORS-safe).
- `applyPlaceholder` — fallback when a cover image fails to load; shows the book's first letter.

**Column names** (from the Google Sheet header row): `Title`, `Subtitle`, `Author`, `Illustrator`, `Age Range`, `Categories`, `Blurb`, `Book Cover Image`, `Paperback ISBN (or ASIN)`, `Hardback ISBN (or ASIN)`, `eBook ISBN (or ASIN)`, `LCCN`. These are used as object keys throughout `app.js` — spelling and capitalisation must match the sheet exactly.

**`style.css`** — single stylesheet using CSS custom properties (`--rose`, `--forest`, `--sage`, etc.) defined on `:root`. No preprocessor.

# Domain Registration: thywordmedia.org

## Registrar
- **Provider:** Cloudflare Registrar (https://dash.cloudflare.com)
- **Domain:** thywordmedia.org
- **Status:** Active
- **Renewal:** At-cost pricing (~$9–10/year); auto-renewal recommended

## DNS Records (Cloudflare DNS)
All records set to **DNS only (grey cloud)** — NOT proxied.
Proxying must remain OFF so GitHub Pages can verify ownership and issue SSL.

| Type  | Name | Value                  |
|-------|------|------------------------|
| A     | @    | 185.199.108.153        |
| A     | @    | 185.199.109.153        |
| A     | @    | 185.199.110.153        |
| A     | @    | 185.199.111.153        |
| CNAME | www  | andyrabel.github.io    |

## GitHub Pages Configuration
- **Repository:** https://github.com/andyrabel/bookdatabasewebsite
- **Custom domain set in:** Repository → Settings → Pages → Custom domain
- **Value:** `thywordmedia.org`
- **CNAME file:** Present in repo root (auto-created by GitHub)
- **Enforce HTTPS:** Enabled (SSL cert provisioned by GitHub via Let's Encrypt)

## How GitHub Routes the Domain
GitHub's servers receive traffic for thywordmedia.org via the A records above.
They identify the correct repository by matching the domain against the CNAME
file present in `andyrabel/bookdatabasewebsite`. Only one repo should ever have
this domain set as its custom domain.

After setting the custom domain, https://andyrabel.github.io/bookdatabasewebsite/
automatically redirects to https://thywordmedia.org/

## Email Routing
- Not yet configured. Cloudflare Email Routing is available if needed.
- Pattern for other domains (e.g. cmsbayarea.org) uses Cloudflare → forward to Gmail.

## Troubleshooting Notes
- If GitHub DNS check fails: verify A records are grey cloud (DNS only) in Cloudflare
- If HTTPS is unavailable: wait for DNS propagation, then re-check Pages settings
- DNS propagation checker: https://dnschecker.org/#A/thywordmedia.org
- Cloudflare warning "Proxying required for security features" can be safely ignored
  for GitHub Pages — GitHub provides its own CDN and SSL.

# Zapier Automation

## Zap: "Post new Google Sheets rows to Facebook page"

**Status:** Published and active

**Trigger:** New row in Google Sheets
- **Spreadsheet:** "Books Database Entry Form (Responses)"
- **Worksheet:** Form Responses 1
- Fires when a new book submission arrives via the Google Form

**Action:** Create a post on Facebook
- **Page:** Thy Word Media
- **Post text:** Book title and author, followed by the blurb
  - Format: `<Title> by <Author>` + book description
  - Example: `Dwelling With The Word by Jessica Painter` + description
- **Image:** Book cover URL from the `Book Cover Image` column (column L)

**Data flow:**
1. Author submits book via Google Form
2. Submission appears as a new row in the spreadsheet
3. Zapier detects the new row
4. A post is automatically created on the Thy Word Media Facebook page with the cover image and book details

**Managed at:** https://zapier.com (login required)
