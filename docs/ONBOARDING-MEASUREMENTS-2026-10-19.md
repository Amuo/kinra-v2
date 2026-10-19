# Optional measurements and wheel input — 19 October 2026

The five-step setup adds **Your starting point** between name/goal and the first useful action. All supported roles can optionally enter gender, height, weight and training experience, or continue with these fields blank. No measurement, gender or experience is inferred from the fictional preview or automatically selected.

Height and weight open a barrel-style wheel: a highlighted center row, faded and curved neighbors, touch/mouse scrolling and snapping, keyboard arrows/Home/End, and direct decimal entry. The input accepts a decimal dot or comma and explains invalid ranges. **Use value** confirms a draft; **Cancel** retains the original; **Leave blank** explicitly clears it. Initial/programmatic positioning does not create a selection. A stable element-mount callback positions the wheel after the drawer portal mounts.

Metric and imperial labels convert from canonical centimeters/kilograms. Changing units or confirming an untouched existing value preserves the exact stored measurement. Unit choice saves to the existing account preference on completion, retaining its ID, modules and timezone. Gender is an optional identity choice, not biological input to a clinical or calorie calculation. No BMI, medical assessment or automatic food targets are generated.

The optional facts remain in the owner-only setup row, including after completion. Reopening setup restores them while using current profile name/goal and preferences. They are not copied to coach-visible profile fields or dated body logs. Existing export and app-profile erasure include this row. Earlier four-step drafts map to the same task; cached older clients cannot erase newer optional facts when they save.

## Design basis

Parent backend and user-requested Astra UI work used the broader vault research: `Navigation onboarding and account flows.md`, `Components interaction states and accessibility.md`, `Visual styles typography color and motion.md`, and `Privacy consent and ethical engagement.md` in `D:/Dokta's Vault/Knowledge/Research/Mobile health design/`. Optionality, private audience, reviewed changes and a non-drag alternative follow those proposals. [Apple's picker guidance](https://developer.apple.com/design/human-interface-guidelines/pickers) informed the wheel metaphor and ordered numeric values; this is a web implementation, not a native UIKit control.

## Verification

- 120 tests across 25 files passed, with TypeScript, translation coverage (1,504 entries), ESLint (existing warnings) and production build checks. The additional regression protects an existing imperial preference when reopening a draft that predates unit choice.
- Component tests exercise keyboard selection, no silent default, cancel, explicit clearing, range/decimal validation, exact canonical preservation and unit toggling. Role flows include skipping the optional step; old drafts receive safe null defaults and compatible step mapping.
- PostgreSQL tests verify optional facts/ranges, connected-coach isolation, no automatic body log, cached-client preservation and deliberate clearing, alongside existing actor/transaction/idempotence/erasure coverage. Both generated production-namespace bundles pass installation/upgrade tests.
- The additive namespaced migration was applied to Kinra Supabase. A rolled-back authenticated transaction confirmed exact facts through repeated completion and a legacy payload, rejected connected-coach reads, and created no body log. No QA identities from that transaction remain. Advisors reported no new measurement/onboarding findings; inherited project findings remain outside this change.
- Local browser checks used fictional client data: actual wheel scrolling and confirmation, comma-decimal input, metric/imperial display, German/Bosnian switching, review, completion and reopening with retained facts. A 320px CSS iframe checked the narrow Bosnian wheel layout. The browser identified and verified the portal-position fix. This does not establish physical iPhone touch behavior or assistive-technology certification.

## Production release

Final application source `ce416fd347c639e4629e2da3f9ffdba8328bf8ad` follows the main measurement implementation `b300aa2a1690af276122fc3909a8f1524c626eac`. Deployment `dpl_DirrqysCk6L5hqVZZJ58tqC5n1cn` was verified READY with matching Git metadata and aliases including `kinra.fit` and `www.kinra.fit`. Vercel ran the complete check/build before publication. The earlier in-progress build was canceled so the accepted release includes legacy-unit preservation.

Canonical-domain browser smoke used a separate fictional client demo. The German five-step flow opened from Profile, optional facts initially remained blank, the height wheel initialized at its expected center, actual scrolling selected 170 cm, and Cancel retained the blank measurement. Browser demo smoke and authenticated database acceptance are separate evidence; no real personal measurements were entered.

Screenshots: `D:/Projects/output/kinra-height-wheel-live-2026-10-19.png`, `D:/Projects/output/kinra-height-wheel-localhost-2026-10-19.png`, and `D:/Projects/output/kinra-wheel-narrow-2026-10-19.png`. The temporary narrow fixture was removed before publication. The localhost wheel is left open for the user with no measurement confirmed. This release retains existing Supabase Auth/Resend configuration.

This final verification record is a subsequent documentation-only commit.
