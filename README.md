# RoboColosseum Web

Vue frontend for robot policy evaluation results and leaderboards.

- Netlify website: https://robocolosseum.netlify.app/
- Custom domain: https://robocolosseum.ai/
- Previous website: https://frodobots-org.github.io/robo-colosseum/
- Backend API: https://191.222.219.43/api
- Backend repository: https://github.com/frodobots-org/colosseum-router

The frontend is hosted in the **FrodoBots Pro** Netlify team. Netlify proxies
`/api/*` to the existing production Router over HTTPS; no backend process or
credentials are deployed with the static site. The backend remains on the old
production API until its separate Render migration is complete.

## Development

Requires Node.js 22 and npm.

```bash
npm ci
VITE_DEV_API_PROXY_TARGET=https://191.222.219.43 npm run dev
```

Vite serves the site on port 5174 and proxies `/api` requests to the Router. For a
local Router, omit the variable to use `http://127.0.0.1:8443`.

## Netlify deployment

The `robocolosseum` project builds this repository's `main` branch. Its settings
are versioned in `netlify.toml`:

- Build command: `npm run build`; publish directory: `dist`; Node.js: 22.
- `VITE_BASE_PATH=/` and `VITE_API_BASE=/api`.
- `/api/*` is proxied to `https://191.222.219.43/api/:splat` before the app fallback.
- Other application routes serve `index.html` with HTTP 200, so direct links and
  refreshes work with Vue Router.

The same-origin API route works on the Netlify URL, deployment previews, and the
custom domain without adding each frontend origin to the Router's CORS settings.
Robot clients continue connecting directly to the Router. Netlify proxies have a
26-second timeout; this route is for frontend requests, not robot sessions or
long-running uploads. When the backend cutover is approved, update the proxy
destination in `netlify.toml` and verify the new deployment.

To build the Netlify frontend locally:

```bash
VITE_BASE_PATH=/ VITE_API_BASE=/api npm run build
```

Deploy through the connected repository, or use `netlify deploy --prod` from a
checkout linked to project `27e01154-2427-42ba-90b4-09ade672a65c`. The `.netlify`
directory is local configuration and must not be committed.

### Custom domain

`robocolosseum.ai` is registered with GoDaddy. On 14 October 2026, its apex `A`
record `@` was connected to `75.2.60.5` (600-second TTL), and its `CNAME` record
`www` to `robocolosseum.netlify.app` (1-hour TTL). GoDaddy nameservers and other
records remain unchanged. HTTPS is active with an automatically renewed Let's
Encrypt certificate covering both names. `www.robocolosseum.ai` redirects to
the primary domain, `robocolosseum.ai`. Site-wide password protection remains
enabled; the app and live leaderboard data were verified on the custom domain.

See [Netlify's external DNS instructions](https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/).

## Previous GitHub Pages deployment

The existing Pages site remains available as a fallback. Its workflow is now
manual-only; pushes to `main` deploy through Netlify. Manually run
`.github/workflows/deploy-pages.yml` if a Pages rebuild is needed. GitHub Actions builds
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
