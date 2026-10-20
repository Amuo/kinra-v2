# Kinra Business UI — 20 October 2026

## Scope and architecture

`/business` is a client-only workspace with its own account/demo guard and `ApiProvider`. It does not wrap the consumer app in a desktop shell or change account authority. All business data and mutations go through `api.business`; staff invitations reuse `api.organizations`. The authoritative snapshot role controls financial/admin actions. Selecting a workspace never grants permissions.

The desktop shell has a persistent 248 px sidebar; smaller screens use a horizontally scrollable labeled navigation row. The selected business, role, demo state and language remain visible. Snapshots refresh every 15 seconds while the document is visible and after successful writes. Limited snapshot arrays display a warning; summary counts are supplied by the backend, not inferred from the displayed rows.

## Supported flows

- Landing: Business demo entry on desktop and mobile. Profile and Organization tools link to the business workspace.
- Setup: create a business, including when another business already exists; select facility type, timezone and currency. Only owners can update business settings. The selector refreshes after settings changes.
- Overview: active members, recorded occupancy, visits today, expiring memberships, upcoming sessions, and manager/owner financial totals.
- Reception: choose an active location; scan a QR using an explicitly started camera, use a keyboard/USB scanner, or select a member for manual entry. The server decides eligibility. Show allowed, denied and duplicate/already-inside results, meaningful denial reasons and remaining visits. Check out an open visit. Occupancy is recorded attendance, not a physical sensor reading.
- Members: search and select members; managers/owners create or edit contact/group/admin status; record/edit membership dates and status; choose a plan for a new membership; display saved visit and location entitlements. Existing membership identity remains fixed. Create a private account-link invitation and show its expiry.
- Plans: create/edit duration, price, visit quota and eligible locations; deactivate plans without implying existing membership entitlements change.
- Locations/resources: create/edit branches, capacities and availability; configure pitches, courts, swimming lanes, studios, mats, tracks, rooms or other resources.
- Schedule: create/edit/cancel class, team and resource sessions; view and manage bookings. `datetime-local` values are converted using the business timezone, independently of the device timezone; nonexistent spring-forward times are rejected. The server enforces conflicts and capacity.
- Ledger: managers/owners create immutable invoices, void eligible invoices and append manually recorded payments/refunds; show payment history. Amounts use minor units and the business currency. No card charge or bank transfer is performed.
- Staff/settings: existing staff/invitation controls retain owner/manager permissions. Business JSON export is available to managers/owners and uses the backend's role-scoped export response.
- Member Profile: link a facility invitation after reviewing member/business identity; view memberships; generate an opaque short-lived one-use QR; see its expiry and generate a fresh code; book/cancel eligible upcoming sessions. Expired QR pixels are removed from view.

Supported facility labels cover gyms, pools/swimming, football, MMA/combat sports, sports complexes, athletics, basketball, handball, volleyball, tennis, padel, dance, yoga/Pilates, gymnastics, climbing, water sports, winter sports, wellness and configurable other sports facilities.

## Localization, accessibility and scope disclosure

All new UI messages, form labels, navigation, facility/resource labels, access reasons and backend errors have English/Bosnian/German coverage. Member-entered names and other user content remain unchanged. `scripts/check-locales.mjs` checks dynamic labels, status values and SQL exception messages in addition to explicit translated strings.

Controls use text labels, generally 44–48 px minimum action heights, wrapping layouts, visible keyboard focus and a skip link. Forms group label/input/error and disable submission while saving. QR check-in results use live status text; errors use alerts. Camera capture is loaded on demand and stopped on exit/unmount. Keyboard/manual entry remains available if camera capture fails. Status meaning is conveyed by text as well as color.

Linking explains that the facility manages its contact/membership records and receives no personal health logs through this link. The deletion dialog warns that owned businesses and their records are deleted, while other facilities' records remain with those facilities after account unlinking. These describe implemented data scope, not a legal retention determination.

## Design research used

Local research was retrieved from the user's existing vault through the QMD workflow and relevant full notes, including broad category research rather than only Kinra project history:

- `D:/Dokta's Vault/Knowledge/Research/Mobile health design/Coach client and clinical experiences.md` — identity/period context, task-oriented worklists, explicit review/access boundaries.
- `D:/Dokta's Vault/Knowledge/Research/Mobile health design/Navigation onboarding and account flows.md` — stable destinations, account/job separation and contextual setup.
- `D:/Dokta's Vault/Knowledge/Research/Mobile health design/Screen layout patterns and annotated wireframes.md` — desktop roster/detail layout, progressive disclosure, reflow and input context. QMD document `#ee6b3f`.
- `D:/Dokta's Vault/Knowledge/Research/Mobile health design/Components interaction states and accessibility.md` — independent pending/error/empty/permission states; keyboard/manual alternatives and focus/target considerations.
- `D:/Dokta's Vault/Knowledge/Research/Mobile health design/Privacy consent and ethical engagement.md` — purpose-specific access, recipient disclosure and minimized health-data sharing.
- `D:/Dokta's Vault/Knowledge/Research/Mobile health design/Source register.md` and the research hub preserve external-source attribution and evidence limits. These library recommendations and wireframes are research proposals, not user tests of this business UI.

Repository `AGENTS.md` informed the API boundary and separate shell; the installed React best-practices skill was reviewed after TSX edits. No competitor artwork was copied into this workspace.

## Verification and remaining limits

Observed locally on 20 October 2026:

- `node node_modules/vitest/vitest.mjs run src/test/business-ui.test.tsx`: **6 tests passed**. Covers Sarajevo wall-time conversion, nonexistent DST time rejection, keyboard-scanner submission in EN/BS/DE, and disabled duplicate submission while an entry is pending.
- TypeScript check passed during frontend integration; locale coverage passed. Targeted ESLint had zero errors and eight Fast Refresh warnings for mixed helper/component exports.
- Parent agent owns integrated browser, database/RLS, deployment and full-suite evidence. This note does not claim those outcomes.

Remaining verification: physical camera permissions/capture and printed/displayed QR decoding on actual devices; USB scanner behavior on the deployed reception workstation; assistive-technology, zoom and field usability checks; user acceptance with real facility workflows. No physical door, turnstile, scanner hardware or payment processor integration is claimed. Device orientation, glare, camera autofocus and QR viewing distance have not been validated by the six component tests.

Backend snapshot caps still bound the visible record set; this UI is not an uncapped historical reporting browser. The session editor rejects DST gaps but does not offer an explicit choice between the two occurrences of an ambiguous autumn clock-change time.

### Bosnian date regression correction

Integrated browser QA found an ICU locale fallback rendering October as `M10`. Business dates now render Bosnian as numeric `dd.MM.yyyy`, and business date/time displays add 24-hour `HH:mm` using the selected business timezone. English and German retain their existing locale formatting. Two added tests cover all twelve Bosnian months without `M` placeholders and timezone-driven day rollover; the targeted UI suite now has **8 passing tests**. Locale coverage still passes.
