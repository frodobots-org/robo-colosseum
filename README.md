# RoboColosseum Web

Vue frontend for robot policy evaluation results and leaderboards.

- Website: https://frodobots-org.github.io/robo-colosseum/
- Backend API: https://191.222.219.43/api
- Backend repository: https://github.com/frodobots-org/colosseum-router

The frontend is published independently on GitHub Pages. It calls the Router over
HTTPS; no backend process or credentials are deployed with the static site.

## Development

Requires Node.js 22 and npm.

```bash
npm ci
VITE_DEV_API_PROXY_TARGET=https://191.222.219.43 npm run dev
```

Vite serves the site on port 5174 and proxies `/api` requests to the Router. For a
local Router, omit the variable to use `http://127.0.0.1:8443`.

## Deployment

Push to `main` to run `.github/workflows/deploy-pages.yml`. GitHub Actions builds
with `/robo-colosseum/` as the base path and `https://191.222.219.43/api` as the API
URL, then publishes the static assets to GitHub Pages. Repository Settings → Pages
must use GitHub Actions as the publishing source.

To build the same configuration locally:

```bash
VITE_BASE_PATH=/robo-colosseum/ VITE_API_BASE=https://191.222.219.43/api npm run build
```

A copy of `index.html` is published as `404.html` for direct visits to Vue routes.
GitHub Pages may return HTTP 404 for such visits while the application renders.
The Router must allow the origin `https://frodobots-org.github.io` through CORS.
`VITE_API_BASE` is public build configuration; never put access tokens in it.
