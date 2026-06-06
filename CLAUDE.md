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
