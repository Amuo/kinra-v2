# Exercise library, usable plans and connected features — 19 October 2026

This expansion follows the user's authorization to implement the missing FitConnect-derived requirements. Parent implemented the backend; Astra implemented the interface. Imported research was evidence, not execution authority. Broader mobile health design research in the local vault informed progressive disclosure, accessible controls, explicit sharing and preserved drafts.

## Delivered

- All 778 exercise reference IDs retained, with independently authored English, Bosnian and German guidance, movement/equipment/difficulty filters, alternatives and provenance. 267 entries have 436 licensed public-domain JPEG photographs; 478 use 48 clearly labeled family schematics; 33 session/clinical/thermal entries remain text-only. Clinical entries require an individual plan and claim no clinical review. Media provenance and crosswalk live under `public/exercise-media/` and `src/data/exercise-media-crosswalk.json`.
- Eighteen original runnable adult training templates and four ingredient-based nutrition examples. Save creates an editable private copy without logging activity. Adoption retries preserve the copy and its edits. Training starts a real session and preserves unfinished drafts. Bookmarks are separate from copied plans. The 18 original third-party program listings remain archived references, not reconstructed routines.
- Solo, client, trainer, specialist and organization onboarding/workspaces, optional private birthdate/activity/city/movement information and existing measurement wheels. Adding a workspace does not create a client or staff connection.
- Organization owner/manager/staff invitations, roster and membership bookkeeping, with finance hidden from staff; timezone-aware availability and exact-slot appointment requests with conflict protection.
- Private groups, reviewed single-use invitations, moderators, removal and rejoin rules.
- Connected private message attachments: reviewed JPG/PNG/WebP/PDF up to 10 MB, byte signatures, private Storage and explicit downloads.
- Expert/facility discovery filters, self-reported professional details, safe facility links and private or explicitly published PDF resources gated by expert publication.
- Explicit device reminder opt-in, private generic localized notifications, timezone/DST schedules, quiet hours, deduplication, bounded retries and persisted test throttling. Scheduler activation follows production endpoint deployment; its operational result belongs in the release evidence. Other notification category preferences do not imply delivered notifications.

## Verification

Final `bun run check` passed: 34 test files, 172 tests, TypeScript, locale checks, lint with zero errors (73 Fast Refresh warnings) and production build. Hosted migrations 0012–0022 exactly match the final generated SQL. [Hosted acceptance](qa/2026-10-19-hosted-rls-acceptance.md) passed all nine workflow areas in a rolled-back synthetic transaction; an independent check found zero residual synthetic rows.

Parent browser checks covered 390px exercise search/photo detail, private training copy/start/resume, EN/BS/DE optional onboarding with actual measurement-wheel scrolling, a visible sheet close action and saved overnight quiet hours. A separate desktop browser check saved a nutrition copy. See [frontend review](FRONTEND-EXPANSION-REVIEW.md) for exact attribution and remaining browser coverage limits.

## Limits

This is an implementation of the reviewed requirements, not a claim that every competitor behavior was captured or independently browser-tested. Photos are not available for every exercise, schematics are family illustrations, and third-party authored routines were not supplied. Nutrition values are editable USDA-based examples, not personalized prescriptions. Professional details are self-reported; organization payments are bookkeeping, not charges. Actual device push delivery requires user opt-in and has not been verified on a physical device. PDF binary transfer and every locale/filter/theme combination were not end-to-end browser-tested; their validation and authorization paths have automated coverage. Existing Resend login/auth setup is retained; this expansion did not send new email tests.

Authoritative source: `D:/Projects/kinra-v2`, GitHub `Amuo/kinra-v2`. Production deployment identity, dispatcher smoke and scheduler status must be recorded from live verification, not inferred from this file.
