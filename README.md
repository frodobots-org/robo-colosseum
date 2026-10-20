# RoboColosseum Web

Vue frontend for robot policy evaluation results and leaderboards.

- Netlify website: https://robocolosseum.netlify.app/
- Custom domain: https://robocolosseum.ai/ (DNS cutover pending)
- Previous website: https://frodobots-org.github.io/robo-colosseum/
- Backend API: https://robocolosseum-api.onrender.com/api
- Backend repository: https://github.com/frodobots-org/colosseum-router

The frontend is hosted in the **FrodoBots Pro** Netlify team. Netlify proxies
`/api/*` to the existing production Router over HTTPS; no backend process or
credentials are deployed with the static site. The backend API is hosted on Render.

## Development

Requires Node.js 22 and npm.

```bash
npm ci
VITE_DEV_API_PROXY_TARGET=https://robocolosseum-api.onrender.com npm run dev
```

Vite serves the site on port 5174 and proxies `/api` requests to the Router. For a
local Router, omit the variable to use `http://127.0.0.1:8443`.

## Netlify deployment

The `robocolosseum` project builds this repository's `main` branch. Its settings
are versioned in `netlify.toml`:

- Build command: `npm run build`; publish directory: `dist`; Node.js: 22.
- `VITE_BASE_PATH=/` and `VITE_API_BASE=/api`.
- `/api/*` is proxied to `https://robocolosseum-api.onrender.com/api/:splat` before the app fallback.
- Other application routes serve `index.html` with HTTP 200, so direct links and
  refreshes work with Vue Router.

The same-origin API route works on the Netlify URL, deployment previews, and the
custom domain without adding each frontend origin to the Router's CORS settings.
Robot clients continue connecting directly to the Router. Netlify proxies have a
26-second timeout; this route is for frontend requests, not robot sessions or
long-running uploads. The proxy destination is configured in `netlify.toml`.

To build the Netlify frontend locally:

```bash
VITE_BASE_PATH=/ VITE_API_BASE=/api npm run build
```

Deploy through the connected repository, or use `netlify deploy --prod` from a
checkout linked to project `27e01154-2427-42ba-90b4-09ade672a65c`. The `.netlify`
directory is local configuration and must not be committed.

### Custom domain

`robocolosseum.ai` is registered with GoDaddy. Keep DNS there and point the web
records to Netlify: apex `A` record `@` to `75.2.60.5`, and `CNAME` record `www`
to `robocolosseum.netlify.app`. Replace conflicting web records, preserving mail,
verification, and other unrelated records. Complete DNS verification and HTTPS
provisioning in Netlify before treating the domain as live.

See [Netlify's external DNS instructions](https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/).

## Previous GitHub Pages deployment

The existing Pages site remains available as a fallback. Its workflow is now
manual-only; pushes to `main` deploy through Netlify. Manually run
`.github/workflows/deploy-pages.yml` if a Pages rebuild is needed. GitHub Actions builds
with `/robo-colosseum/` as the base path and `https://robocolosseum-api.onrender.com/api` as the API
URL, then publishes the static assets to GitHub Pages. Repository Settings → Pages
must use GitHub Actions as the publishing source.

To build the same configuration locally:

```bash
VITE_BASE_PATH=/robo-colosseum/ VITE_API_BASE=https://robocolosseum-api.onrender.com/api npm run build
```

A copy of `index.html` is published as `404.html` for direct visits to Vue routes.
GitHub Pages may return HTTP 404 for such visits while the application renders.
The Router must allow the origin `https://frodobots-org.github.io` through CORS.
`VITE_API_BASE` is public build configuration; never put access tokens in it.
