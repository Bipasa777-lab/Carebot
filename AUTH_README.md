Auth setup (moved to App Router)
================================

What I changed
--------------
- `src/lib/auth.ts` now holds `authOptions` (NextAuth configuration).
- `src/app/api/auth/[...nextauth]/route.ts` only exports the NextAuth handler (GET/POST).
- Added TypeScript augmentation in `src/types/next-auth.d.ts` so `session.user.id` and `jwt.id` types exist.

Required environment variables
------------------------------
- `NEXTAUTH_SECRET` — a long random secret (use `openssl rand -hex 32`).
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` — if using Google OAuth provider.

Checklist before deploy
------------------------
1. Set env vars in Vercel (Production + Preview): `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `MONGODB_URI`, `GOOGLE_GENERATIVE_AI_API_KEY`.
2. Confirm `src/app/api/auth/[...nextauth]/route.ts` does NOT export `authOptions`.
3. Confirm there are no Pages Router auth files under `src/pages/api/auth/`.
4. Locally test: `npm run build` — ensure it passes.

Generate a secure NEXTAUTH_SECRET (macOS / zsh)
------------------------------------------------
Run this locally and copy the output into Vercel or `.env.local`:

```bash
openssl rand -hex 32
```

If you want me to also add GitHub/GitLab providers or a `.env.production` template for Vercel, tell me and I will add them.
