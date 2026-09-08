# CMS Frontend

Next.js frontend for the ACM CMS. The implementation follows the backend at
`eec9ff33e7487c5bec71ce671214d243e5f01e3b`.

## Development

```text
bun install
bun run dev
```

Next uses its default development port unless you set `PORT` or pass a port
to the Next CLI. Set `BACKEND_ORIGIN` in `.env.local` to the backend's actual
origin before using the API proxy (for example,
`http://127.0.0.1:<backend-port>`).

Copy `.env.example` to `.env.local`. The supported deployment shape is a
same-origin reverse proxy: the browser calls `/auth`, `/members`, and the
other backend paths on the frontend origin, while the proxy forwards them to
the backend. Direct cross-origin development requires HTTPS plus an explicit
backend CORS/cookie configuration; the backend refresh cookie is HTTP-only,
secure, and `SameSite=Lax`.

Useful checks:

```text
bun run lint
bun run test
bun run build
```
