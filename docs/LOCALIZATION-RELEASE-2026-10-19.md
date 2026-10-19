# Kinra V2 language release — 2026-10-19

## Scope

Kinra supports English (`en`), Bosnian (`bs`) and German (`de`). Public landing and authentication pages, confirmation/recovery screens, onboarding, client/solo/coach navigation, tracking forms, feature tools, confirmations/errors and profile settings use explicit complete-message translations. Date, relative-time, numeric and plural formatting follow the selected locale. The selector uses native language names: English, Bosanski, Deutsch.

Language changes update the current screen without remounting its form. A guest's explicit selection survives sign-in. Signed-in preferences are private and account/mode scoped, saved through the existing Api, preserving theme, module visibility, units and timezone. Namespaced Supabase Auth metadata `kinra_language` selects account-email copy; it is not an authorization signal. Existing accounts without it retain the English email fallback.

All 778 exercise IDs have complete display names in all three languages, and search accepts those names plus original aliases. Program/session labels tied to a catalogue ID follow the UI language when still a recognized catalogue label. Custom names, notes, coach messages, supplied source records and recorded workout values retain their exact content. See [EXERCISE-LOCALIZATION.md](EXERCISE-LOCALIZATION.md) for provenance and translation limits.

## Design

The Astra UI agent consulted vault design/typography/localization evidence and adjusted the language selector, touch targets, navigation wrapping, dialog actions, session titles and feature headers. Narrow cards stack the readiness ring above its content so long German headings and numeric stats remain readable. Parent browser checks inspected actual 320px and 390px iframe app viewports and the ordinary desktop view. These are representative checks in the available browser, not a claim of exhaustive device or assistive-technology coverage.

## Database and mail

Applied the additive `kinra_v2_languages_20261019` migration to the existing Kinra Supabase project (`ztbwycesqodjvseqhygh`). Readback confirmed the preferences schema accepts exactly en/bs/de. The versioned local migration is `drizzle/migrations/0009_languages.sql`; generated namespaced installation/upgrade bundles include it. Existing tables, legacy extensions and permissions were preserved.

The existing Resend SMTP integration remains the mail transport. Confirmation and recovery subjects and HTML bodies now choose en/bs/de with Supabase Go-template conditionals. These two active hosted templates were published and tested. The other four email designs have localized source/previews but their application flows remain inactive. Plain `.txt` files are editorial English companions, not the active hosted delivery templates.

Three owned synthetic accounts exercised actual confirmation and recovery delivery. For each language, both messages arrived in the inbox with the expected subject, HTML language and body; SPF and DKIM passed. Confirmation, password sign-in, private preference writes/readback, cross-owner rejection, recovery-link verification and sign-out passed. Existing preferences retained dark theme, module flags, metric units and Europe/Sarajevo timezone. All synthetic identities and preferences were then deleted with exact fixture guards; readback found zero remaining. No raw messages, one-time links, credentials or identity ledgers are committed.

The security advisor still reports existing shared-project notices: 24 policy-less RLS tables outside the V2 namespace, existing callable security-definer RPCs, and disabled leaked-password protection. The changed schema function added no new grants or policies. The authenticated V2 RPC notices include existing role/grant checks and guarded actions; this localization release is not a full audit or remediation of the shared legacy project. References: [database linter](https://supabase.com/docs/guides/database/database-linter) and [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Verification

- Translation checker: complete Bosnian/German coverage of explicit render messages and feature-schema field labels (1,403 catalogue messages).
- TypeScript: passed. ESLint: zero errors; existing Fast Refresh/dependency warnings remain.
- Vitest: 98 tests passed, including full PostgreSQL authorization tests, all three preference values, unsupported-language rejection, preserved preference fields, guest-choice precedence, reactive draft retention, server/client hydration with saved locale, formatting/plurals/errors and exercise coverage/search.
- Production build: passed. CI `check` now includes translation coverage before type/lint/tests/build.
- Browser: English/Bosnian/German selection, localized document titles/navigation, retained open profile draft, numeric/relative dates and German narrow readiness/profile layouts inspected.

## Limits retained from the feature release

This adds language support to the delivered V2 app; it does not create missing exercise instructions, instructional media, executable routines or advanced product flows described in the prior feature release. Source translations were authored and checked for coverage but have not received an independent professional linguistic review. User-authored content is intentionally not machine translated.

## Publication

Production publication and source identifiers are recorded below after the release is ready and the live domain is checked.
