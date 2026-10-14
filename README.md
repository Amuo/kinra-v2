# Kinra v2

Training, nutrition, recovery and coach/client tracking built with React 19, TanStack Start, TypeScript, Supabase and Tailwind CSS. Demo and authenticated screens share the same typed API.

## Run locally

Use Node 24 and Bun 1.4.3 or newer. Copy `.env.example` to `.env` and provide the project's public Supabase URL and anon/publishable key. Never put a service-role key or Resend key in a `VITE_` variable.

```sh
bun install --frozen-lockfile
bun run dev
bun run check
bun run preview
```

`check` runs TypeScript, ESLint, the application and PostgreSQL authorization tests, and a production build. Preview runs the compiled Cloudflare worker locally through Wrangler. Build before preview; stop preview before rebuilding on Windows.

## Production

Repository: https://github.com/Amuo/kinra-v2 (private). Existing Vercel project: `amuos-projects/kinra`. Canonical URL: https://kinra.fit. Vercel builds the Nitro Vercel preset automatically; local builds retain the Cloudflare target.

Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_KINRA_TABLE_PREFIX=kinra_v2_` in Vercel. The existing Kinra Supabase project is `ztbwycesqodjvseqhygh`. The additive installation is generated with `node scripts/database-bundle.mjs`; run `supabase/migrations/202610140001_kinra_v2.sql` once as postgres. It installs v2 tables, helpers and private buckets in a separate namespace. Do not run the original unprefixed Drizzle migrations against a database containing another app.

Run `supabase/verify.sql` to test actual database owner access and cross-account rejection with rolled-back synthetic writes. Isolated PostgreSQL tests additionally cover coach grants, avatar references, assignment ownership, disconnects and data validation. Application access uses public keys and RLS; no service key is required.

## Account email

Supabase Auth uses the existing Resend SMTP integration (`smtp.resend.com:465`, sender `Kinra <hello@mail.kinra.fit>`). The sending domain is verified. Keep SMTP credentials in Supabase and the existing server-only Vercel Resend configuration. Account confirmation and password recovery use `/auth/confirm`; both callback URLs are allowed in Supabase. The callback handles implicit sessions, token hashes and PKCE codes. Google sign-in is shown only if `VITE_GOOGLE_AUTH_ENABLED=true` and the provider has been configured in Supabase.

## Brand and email design

See [docs/BRAND-AND-EMAILS.md](docs/BRAND-AND-EMAILS.md) for editable logo assets, the local email gallery, the Supabase template bundle and release instructions. Hosted email templates require a separate coordinated activation after the new brand assets are deployed.

Confirmation and password recovery match current app flows. Magic-link sign-in, account invitation, email-change and reauthentication designs are prepared templates only; this redesign does not add or enable those flows. No hosted templates or app deployment were published as part of this change.

## Repair verification

See [docs/REPAIRS.md](docs/REPAIRS.md) for the repair scope, evidence and remaining verification limits. Historical import/audit artifacts are retained locally under `audit/` and excluded from Git and deployment uploads.
