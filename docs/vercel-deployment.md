# Vercel deployment

The frontend repository is the Vercel project root. Vercel builds the Vite app
to `dist`; its public base path is `/cms/`, so the site opens at `/cms/` and `/`
redirects there. The rewrites serve the SPA for client routes and map
`/cms/assets/*` and `/cms/fonts/*` to the generated files.

## Backend routing

Vercel proxies the eight API prefixes (`/auth`, `/members`, `/admin`,
`/learning`, `/documentation`, `/projects`, `/operations`, `/health`) to the
production Flask app at `https://aseam.acm.org/cms_backend`. The frontend API
client marks API calls with `X-CMS-API: 1`; the conditional rewrites use that
header so a browser opening a page such as `/admin` still receives the SPA.
Because the browser calls the Vercel origin, refresh cookies stay same-origin.

No Vercel environment variables are required for this proxy setup. Leave
`VITE_API_BASE_URL` unset so the client requests `/auth`, `/members`, and the
other prefixes on the Vercel domain. `VITE_BACKEND_ORIGIN` is only for the Vite
development proxy and has no effect on Vercel.

The Vercel project should use the repository root, the Vite framework preset,
`bun install --frozen-lockfile`, `bun run build`, and `dist` as the output
directory; these settings are also declared in `vercel.json`.

The `/admin` IP allowlist in `.htaccess` is host-specific and is not applied by
Vercel. Backend authorization still applies; enforce any network-level access
restrictions at the backend or another production access-control layer.
