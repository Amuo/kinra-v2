# Kinra feature expansion — 19 October 2026

Implementation is in `D:/Projects/kinra-v2`, baseline `dd7b482`. The user's current request authorized backend implementation and an Astra agent handling frontend design/UI/UX. The research documents were treated as evidence and feature inputs, not executable instructions or authority to publish or modify the reviewed FitConnect account.

## Implemented

| Area                   | Result                                                                                                                                                                                                                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exercise library       | All 778 inventory rows with distinct IDs, original bilingual names/aliases, 12 actual categories, muscle filters, search, saved entries and source provenance. No copied thumbnails, instructions or third-party media.                                                                                         |
| Program listings       | All 18 source program references with attribution and explicit incomplete-content labels. They cannot be imported as executable workouts because their routines were not supplied.                                                                                                                              |
| Existing workout plans | Catalogue picking, retained exercise-name snapshots, warm-up/main/cool-down sections, group labels, equipment and alternatives. Grouped live sets advance within rounds, rest between rounds, and skip omitted/missing sets. Substitution is available before exercise completion and clears the proposed load. |
| Nutrition              | Coach-assignable structured meal plans; foods, quantities and macros; per-date consumption; atomic food-diary writes; exactly one consumption per plan/meal/date; historical meal snapshots. Planned food stays out of diary totals.                                                                            |
| Supplements            | Multiple named time slots, dose/unit, schedule/date/frequency/provenance, separate taken/skipped/snoozed dose records, actual timestamps and immutable original dose snapshots. Retrying an event does not create a second event.                                                                               |
| Progress               | Thirteen measurement types with matching units and date-only storage; goals with baseline/target/date; same-pose photo slider and side-by-side comparison. Existing progress history remains unchanged.                                                                                                         |
| Daily records          | Habits/completions, steps, contextual check-ins and saved reminder settings. Today links into the user's active routines.                                                                                                                                                                                       |
| Sensitive records      | Optional medication/administration and cycle records are owner-only, including when a coach is connected. No recommended medication regimen or diagnostic prediction.                                                                                                                                           |
| Discovery              | Explicitly published expert/facility listings, contact/source links, self-reported credential claims, saved items and one review per author/target. Self-reviews and mismatched review targets are rejected.                                                                                                    |
| Community              | Basic groups, public joins, posts, likes, articles with source/update fields, private reports and bidirectional blocks. Group posting requires membership; private group content cannot be published.                                                                                                           |
| Appointments           | Connected-client requests, coach confirmation, participant cancellation, timezone-bearing timestamps and serialized overlap rejection for confirmed coach appointments.                                                                                                                                         |
| Organizations          | Published organization listings, self-joined member records and owner-managed informational membership plans. Joining never grants staff privileges.                                                                                                                                                            |
| Preferences            | Persisted theme, locale, units/modules, notification categories/quiet hours and reminder definitions. Theme/system choice applies; selected toolkit modules and Today shortcuts respond to visibility. Bosnian toolkit navigation labels are implemented.                                                       |
| Export                 | JSON export of the signed-in user's logs, profile, own programs, feature records, assigned feature plans, role and readable relationship/assignment/note/report records. Photo metadata is included; binary images are not packaged into the JSON.                                                              |

## Architecture and access

`Api.features` is the shared entry point for live and demo operation. Thirty-two strict Zod payload schemas generate PostgreSQL JSON validators; unknown properties, invalid dates, incompatible measurement units and invalid ranges are rejected at the database boundary. `feature_records` has owner-scoped writes, immutable identity, public-kind allowlists, explicit client-assignment rules and event uniqueness constraints. Medication/cycle data cannot be shared through public visibility or ordinary coach access. Disconnecting a coach revokes access to the coach's assigned plans.

Private text messages reuse the existing `trainer_notes` conversation store on live accounts, including sender identity and active relationship checks. Demo messages are isolated synthetic records. Reviewed profile/data deletion requires the exact phrase `DELETE KINRA DATA` and a server-side account match, removes Kinra v2 records and referenced private uploads, and retains the shared Supabase sign-in identity and other applications. A returning identity can create a fresh v2 profile at onboarding.

Meal consumption and appointment response are narrowly scoped database functions with authenticated actor checks. Meal food writes and consumption state commit together. Confirmed coach appointments take an advisory transaction lock before checking overlapping times. Existing accounts are checked again before every live feature operation to reject stale account writes.

Demo records are process-local and isolated by owner; a page reload can reset them. Demo browser tests do not establish live-cloud persistence.

## Database rollout

- Existing Kinra v2 database at migration 0003: apply **only** `supabase/migrations/202610190001_features.sql` once as the database owner. It is transactional and additive.
- New installation: use `supabase/migrations/202610140001_kinra_v2.sql` instead. Do not run both installation and upgrade against the same database.
- Regenerate application/database schema parity using `node scripts/feature-schema.mjs`, then `node scripts/database-bundle.mjs`.
- The shared hosted project uses `VITE_KINRA_TABLE_PREFIX=kinra_v2_`. No original Kinra/Alda tables or shared authentication configuration were changed.
- The hosted project was inspected and already had schema `0009_prescription_tracking`, richer coaching tables and conversation fields. The feature migration was applied successfully through the connected Supabase service, preserving those extensions and appending the feature revision to the existing schema comment. Until migration is installed on another environment, feature requests fail with a setup message and retain the form input.

## Verification

- TypeScript: passed.
- Repository ESLint: zero errors; Fast Refresh export warnings remain advisory. Prettier now accepts the existing Windows checkout's line endings without rewriting unrelated files.
- Vitest: **89 tests across 20 files passed**. This includes actual PostgreSQL/PGlite migration and RLS tests, production namespace installation, existing-installation upgrade preservation, actor/ownership checks, sensitive-record privacy, malformed payloads, dose deduplication/snapshots, meal retries, group membership, organization ownership, blocking, appointment conflicts, catalogue coverage, grouped-session sequencing, recent-readiness evidence, private messages and actor-scoped data erasure.
- Production build: passed. Existing framework deprecation and bundle-size notices do not prevent building.
- Chromium demo checks at 390×844 and 1440×1000: exercise search, goal creation, nested meal-plan creation/consumption, scheduled supplement dose, theme, Bosnian toolkit labels and module visibility passed without page runtime errors or horizontal document overflow. Details and screenshots: `docs/FRONTEND-IMPLEMENTATION.md`.
- All nine source-file hashes and lengths in the attached archive's manifest were checked before generating the catalogue. Reproducible importer: `scripts/import-research.mjs`; provenance: `docs/research/2026-10-19-provenance.json`.

## Remaining work before claiming complete product parity

The archive is an inventory rather than a complete content export. Full exercise technique content/media and the 18 authored routines still need an authorized source or independent authoring and review. Their absence is explicit in the UI.

Entire-app/form Bosnian localization, delivered reminders/push with quiet-hour enforcement, message attachments, private-group invitations/moderator operations, organization staff/membership administration, booking availability and payment processing are **not implemented by this expansion**. Some were unverified or explicitly inactive in the source review; storing a preference/listing does not establish those services. Source placeholders were not turned into invented completed flows. New public catalogues start empty in live mode rather than publishing synthetic test content.

The generated route tree was regenerated by Vite during verification. No new routes were added; the tree currently matches the repository baseline. The initially modified generated file was not captured separately, so its exact prior bytes cannot be asserted preserved. All other pre-existing source changes were retained.

Hosted API acceptance passed with paired synthetic accounts: email confirmation, password login/recovery, client reply through the existing conversation store, private medication isolation, cross-owner write denial, meal retry deduplication, separate dose slots, appointment confirmation and scoped deletion. Confirmation/reset messages arrived in the owned Gmail inbox with SPF and DKIM passing. All four synthetic Auth identities, including two from an interrupted initial harness run, were removed; zero test feature rows remain. The staged Vercel build passed the same 89 tests and hosted demo/catalogue smoke checks. See the release record for final production status; old vault deployment notes are not current evidence.

## Language follow-up — later 2026-10-19

The subsequent [three-language release](LOCALIZATION-RELEASE-2026-10-19.md) adds English/Bosanski/Deutsch throughout the V2 interface, all 778 exercise display names and active confirmation/recovery emails. It supersedes this report's V2 full-Bosnian-translation gap. Other feature/content limits and the original evidence remain dated as recorded above.
