# Public Kinra Business landing — 20 October 2026

## Design and supported paths

The public `/business` page introduces the facility team's work. It is separate from the authenticated `/business/dashboard`, while the main personal Kinra homepage gains visible Business navigation and a substantial dedicated section.

`src/components/strata/business-landing.tsx` exports `BusinessLanding` and `BusinessHomeSection`. Both share an original HTML/CSS operations preview. Its reception/schedule buttons actually switch the illustrative view; the preview is labeled “Illustrative demo data.” Its counts, member and sessions are examples, not customers, revenue, live facility activity or performance claims. The QR icon is decorative, not a usable pass.

The reading sequence is:

1. Explicit audience and offer, with a strong typographic hero and workspace/demo actions.
2. Concrete reception preview, including recorded attendance and a membership decision.
3. Four operational tasks: member record → access plan → entry → scheduled session.
4. QR/pass and ledger features, with relevant hardware/payment boundaries nearby.
5. Facility variety: gyms, swimming, football/team sports, MMA, athletics and sports complexes, plus configurable other resources.
6. Personal Kinra versus Business responsibilities and the health-data access boundary.
7. A repeated workspace/demo action.

The main homepage section summarizes membership/location access, QR attendance and scheduling, with the same preview and a link to the full Business page. It is a product introduction rather than a directory-only card.

Workspace links target `/business/dashboard`; the parent route/auth work owns sign-in continuity. Demo buttons set the existing session-scoped demo flag to `client` and navigate to `/business/dashboard`. They create no account. There are no invented prices, testimonials, customer logos, lead forms or sales/contact destinations.

## Research used

The broad local design map and relevant notes informed this page separately from earlier Kinra implementation notes:

- `D:/Dokta's Vault/Knowledge/Maps/Design for online business.md`: broad routes for typography, hierarchy, localization and navigation.
- `D:/Dokta's Vault/Knowledge/Frameworks/Responsive typography spacing and layout.md`: offer → support → action → concrete illustration; different density for a public introduction and a repeated-use operations screen; natural-height controls and content-driven stacking.
- `D:/Dokta's Vault/Knowledge/Frameworks/Visual hierarchy motion and attention.md`: static task hierarchy first; persistent meaning rather than decorative moving emphasis; visual polish is not evidence of business outcomes.
- `D:/Dokta's Vault/Knowledge/Frameworks/Localization direction and resilient content.md`: translate complete messages, allow German text growth and preserve data meaning separately from presentation.
- `D:/Dokta's Vault/Knowledge/Frameworks/Navigation labels location and wayfinding.md`: audience/location cues, real links versus buttons, consistent routes and keyboard semantics.
- Earlier full notes in `Knowledge/Research/Mobile health design/` on coach/client worklists, screen layouts, interaction states and privacy informed the truthful product representation.

These are design research and proposals, not user testing of this page. No reference artwork or competitor screenshot was copied. The preview is composed from the actual product's task vocabulary and visual tokens.

## Responsive, localization and interaction contract

English, Bosnian and German messages include the page body, preview, navigation/actions and route SEO copy. Dynamic facility, workflow, preview-session and homepage-benefit strings are included in `scripts/check-locales.mjs`.

The page uses semantic headings/sections, an ordered workflow, a named figure, labeled preview controls with `aria-pressed`, decorative icons hidden from assistive technology and a skip link. No automatic animation is needed to understand the content. Primary controls have a 48 px minimum height and wrap; header items wrap; preview grids collapse; no fixed-height prose cards or fixed-width desktop canvas are used at 320 px. German labels remain full text rather than ellipses. The header distinguishes personal Kinra and the business workspace.

## Verification and limits

During implementation: TypeScript passed; targeted ESLint for the new component, homepage and locale checker had no errors; locale coverage was checked including dynamic labels. Parent owns final browser screenshots, 320 px/German/keyboard acceptance, auth routing, full regression suite and deployment evidence. The structural choices above do not independently establish full accessibility or real-user comprehension.

Marketing scope is bounded to implemented business operations. Attendance recording does not imply door/turnstile control. Manually recorded financial entries do not charge a card or move funds. Membership linking does not share personal health/coaching logs. No conversion or operational-efficiency improvement is claimed as measured.

## Route migration and authentication continuity

The previous `/business` dashboard address is now the public product introduction; workspace links in Profile/organization tools and all demo actions now target `/business/dashboard`. The dashboard retains its authenticated/demo guard, API provider, noindex metadata and server-side data authority. The public route is server-rendered, has canonical/Open Graph metadata, and does not request facility/account data. Route matching keeps the dashboard beside the marketing route rather than nesting it inside the public page layout.

A signed-out workspace visit redirects to `/auth?next=%2Fbusiness%2Fdashboard`. Only `/app` and `/business/dashboard` are accepted destinations; URLs and arbitrary paths are rejected. Password sign-in returns to Business, and an optional one-hour session-scoped hint preserves the destination for same-tab email confirmation or recovery. Missing, expired or unavailable storage falls back to `/app`, where Profile still links to Business. The callback URL, email templates, provider configuration and database are unchanged. Cross-device/new-tab email continuation is not guaranteed to preserve the hint.

Parent regression tests cover allowlisted destinations, malicious/invalid hints, expiration/storage failures, successful sign-in and same-tab callback routing, personal login preservation, and public/dashboard route separation. Browser QA verified public-to-auth destination, demo-to-dashboard, the interactive preview, the main-page section link, EN/BS/DE rendering and 320px German reflow without horizontal overflow. Exact final check counts, source/deployment and production browser evidence remain in `D:/Projects/output/Kinra-Business-landing-release-2026-10-20.md`.

Auth redirect reference: [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls). Only local destination routing changed; no additional redirect domains were permitted.

Final local candidate checks on 20 October: `bun run check` passed **245 tests in 52 files**, TypeScript, 2,359-entry locale coverage, ESLint zero errors/81 existing warnings and the production build. New route-title localization was included in the final build. Browser acceptance covered keyboard preview switching, the main-homepage Business section, public/workspace destination boundaries and EN/BS/DE controls; German 320px pages had no horizontal body overflow. No schema or cloud auth/email configuration changed in this release.
