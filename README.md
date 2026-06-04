# bookdatabasewebsite
Book Database Website

## Running locally

Serve the project from its directory using any static file server. Two easy options:

**Python 3** (no install needed):
```
python3 -m http.server 8080
```

**Node / npx** (no install needed):
```
npx serve .
```

Then open [http://localhost:8080](http://localhost:8080) (Python) or [http://localhost:3000](http://localhost:3000) (npx serve) in your browser.

> A local server is required because the app fetches data via `fetch()`, which browsers block on `file://` URLs.
