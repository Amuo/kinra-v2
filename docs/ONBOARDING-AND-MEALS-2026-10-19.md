# Role onboarding and readable meals — 19 October 2026

Kinra now guides solo members, clients and coaches through a four-step setup: account path, name and optional goal, first useful action, then review. New accounts enter setup automatically. Existing accounts can use **Profile → Personalize your setup** without changing account type.

Each path offers relevant next actions. Solo members can begin training, food or recovery; clients can open coach connection, assigned training or their overview; coaches can start a program, client connection or dashboard. Setup does not create a coach relationship or grant access to anyone's records. The review explains the existing sharing behavior before a separate connection action.

Continue and Back save private drafts. Failed saves retain current inputs and offer retry. Completion atomically writes the profile, role and language/appearance preferences, preserving existing units, timezone and module settings. Repeated completion is safe. Drafts are owner-only, included in account export and removed with the existing app-profile erasure flow. Existing account types remain locked.

Breakfast, lunch, dinner and snacks have separate titled sections, distinct icons and accent colors, tinted headers, entry counts and meal-specific accessible Add names. Headers and controls wrap on small screens, including German labels, with 44px minimum Add/copy targets. Food records, copy, delete and undo behavior are retained.

All setup and meal controls are available in English, Bosanski and Deutsch. User-authored names and goals retain their original language.

## Design basis

The parent and user-requested Astra UI agent consulted the broader local design library under `D:/Dokta's Vault/Knowledge/Research/Mobile health design/`, alongside Kinra guidance:

- `Navigation onboarding and account flows.md`: progressive setup, visible progress and a first useful action.
- `Screen layout patterns and annotated wireframes.md`: one primary action and clear hierarchy.
- `Coach client and clinical experiences.md` and `Privacy consent and ethical engagement.md`: explicit audience and separate connection choices; no mandatory health history or measurements.
- `Nutrition portions barcode and hydration.md`: recognizable meal groups and clear diary actions.
- `Visual styles typography color and motion.md` and `Components interaction states and accessibility.md`: icons and text alongside color, wrapping labels, touch targets and retry states.

These notes informed implementation choices; archived designs and research proposals are not independent authority or evidence of user testing.

## Verification

- 112 tests across 24 files passed, plus translation coverage (1,480 catalogue entries), TypeScript, ESLint (existing warnings) and a production build.
- PostgreSQL tests cover all three roles, private drafts, owner spoofing, cross-account and coach isolation, rollback on late failure, idempotence, role locking, preference preservation and erasure.
- The additive namespaced migration was applied to the existing Kinra Supabase project. A rolled-back hosted transaction exercised all three paths under the authenticated role, including forged-owner rejection, repeated completion and preservation of existing preferences. No QA identities or records from that transaction remain.
- Hosted inspection confirmed RLS, four owner policies and a SECURITY INVOKER completion function. Security advisors returned no new onboarding findings; inherited project findings remain outside this change.
- Local browser verification used fictional client data: existing-profile entry, German steps, draft save status, review/sharing copy and completion. A 320px CSS iframe exposed a German toolbar clipping issue, which Astra fixed and the browser confirmed. Meal cards were visually checked with German headings and functional accessible controls. Component/database tests cover new-account paths for all three roles; this is not physical-device or assistive-technology certification.

Production publication is recorded after the deployment is ready and the canonical domain is checked.
