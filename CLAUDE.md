# IlluPia — Claude Code Instructions

## Security Requirements (apply to every task)

Before completing any implementation, review and harden:

1. **Rate limiting** — IP + user-based on all public endpoints. Sensible defaults. Graceful 429 responses with `Retry-After` header.

2. **Input validation & sanitization** — Schema-based, type checks, length limits, reject unexpected fields on all user inputs.

3. **Secure API key handling** — No hard-coded keys. All secrets in environment variables. Nothing sensitive exposed client-side. Follow OWASP best practices. Include clear comments. Do not break existing functionality.

## Project Notes

- Stack: React 18 + Vite, Tailwind CSS, Vercel (static + Edge Functions)
- `GOOGLE_API_KEY` is server-only — never in the client bundle
- `VITE_SPOTIFY_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` are safe to expose (PKCE, no secret needed)
- `.env` is gitignored — only `.env.example` with empty keys is committed
- Spec: `docs/superpowers/specs/2026-03-28-illupia-design.md`
