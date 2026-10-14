# Kinra v2 repairs — 14 October 2026

- Account drafts and query caches are scoped by API mode and authenticated identity. Identity changes cancel and clear requests, remount the account shell and reject stale-account writes. Unscoped legacy drafts are ignored.
- Database policies prevent forged avatar references and cross-coach program assignments. Helper RPCs reject anonymous calls. Private photo/avatar buckets enforce MIME and size limits; disconnecting a trainer revokes access.
- Workout saving uses stable IDs for retry safety and an atomic update for edits. Fractional nutrition values survive database decoding. Input validation and database constraints cover health ranges, workout sets and program structures.
- Log pagination loads complete history. Reports use local dates and half-open timestamp ranges, wait for metrics and surface failed queries. Paused time is clipped correctly when workouts end at the last set.
- Coach-list invalidation is shared, all trainer connections are visible and removable, failed uploads are cleaned up, and deletion has a keyboard-accessible button.
- Production preview runs the compiled worker. Vercel receives native Build Output API functions/static assets instead of a Next.js or Cloudflare artifact.
- Existing authentication, canonical domain and Resend SMTP configuration are reused. Confirmation/recovery callbacks are implemented; unavailable Google authentication is hidden.
- Source formatting and lint errors are repaired. Generated integration files remain generated. Dependency overrides address all advisories reported by Bun audit on the locked dependency graph.

Validation before release: 63 tests across 15 files passed; TypeScript passed; ESLint had zero errors (44 development Fast Refresh export warnings); Cloudflare and Vercel production builds passed; Bun audit reported zero advisories. PostgreSQL tests execute the full migration and an additional namespaced production installation against legacy-table fixtures.

Live database verification uses `supabase/verify.sql` and rolls back synthetic data. Email provider/domain/SMTP/callback configuration can be verified without sending a message; a fresh inbox-delivery and account-recovery run is not included in those checks. Demo browser checks do not substitute for authenticated browser tests with real account credentials.

The original app uses its own legacy schema. Replacing the website does not automatically convert historical v1 records into the different v2 data model.

Production verification: the live database has 13 v2 tables with row security enabled, private storage buckets, and anonymous helper execution blocked. Owner/cross-account probes completed and rolled back their synthetic writes. The Vercel production build served HTTP 200; the staged browser saved a 70 kg × 5 workout (350 kg), updated the dashboard and rendered nutrition, recovery, progress, coach overview, client detail and reports without captured warnings/errors. The canonical domain serves v2 and `www.kinra.fit` redirects to it with HTTP 308. The private GitHub repository is connected to the existing Vercel project; future Vercel builds run `bun run check` before release.
