# Cardio and additional program UI — 2026-10-20

This is an implementation and component-test handoff, not a claim of complete FitConnect parity or production verification.

## Implemented

- Program builder supports strength or cardio tracking; cardio targets use seconds, metres, km/h and percent. Planned targets are visibly separate from actual activity.
- Live sessions have an Add cardio entry and named activity picker. Each interval starts blank, preserves zero speed/incline and negative incline, and requires valid actual duration or distance before completion. No strength progression/load suggestion or strength PR is generated for cardio. Actual metrics appear in review and workout history; the existing draft/edit/save lifecycle remains authoritative.
- Supplements and Video plans are separate Program library tabs, with search/context filters, private editors, own/assigned labels and connected-client assignment. New supplements require entered doses; there are no recommended dose presets.
- Supplement activation requires explicit review and start date. Copy/snapshot and retry semantics are explained. Assigned-plan owners can edit/review but cannot activate or record completion for the recipient.
- Video links open externally without autoplay. Completion/skipping is manual, date-specific and retained in an activity list. NHS starter watchlists identify the English media language and original source; only Kinra metadata is translated. Private copies are editable, keep provenance, and display unchanged original fields in the current locale without rewriting authored edits.
- Failed plan saves retain inputs and reuse the same record identifier on retry. All operations use Api/useAct.

## Evidence and checks

Read the full broader vault notes `Knowledge/Research/Mobile health design/Workout planning logging timers and recovery.md` and `Components interaction states and accessibility.md`; QMD exact-title search returned workout note #d547be. Applied their actual-versus-target distinction, separate timed-work fields, recoverable drafts, named units, explicit completion and 48px input/action targets. Reviewed the installed React best-practices skill after the TSX changes.

Seven tests in `cardio-ui.test.tsx` and `extra-programs-ui.test.tsx` pass: EN/BS/DE numeric labels, blank/zero/signed incline, invalid fractional seconds, target-to-actual separation, completed cardio payload without PR, failed assigned video draft retry, explicit supplement activation, and assigned-owner activation denial (three locales share one parameterized case). TypeScript passes. Targeted ESLint: zero errors, 13 existing mixed-export warnings. Locale scanner: 2,040 entries, including new dynamic field/context/frequency labels and cardio validation messages.

Parent owns authenticated HTTP, browser/device QA, full test run, migration and deployment. This agent has not verified these changes in a browser; the earlier agent CUA runtime exposed no browser surfaces. Mobile wrapping and native numeric keyboards still require parent/device checks. External videos remain publisher-hosted English content; no translated media, watch telemetry, medical assessment or supplement recommendation is claimed.

## Files

New: `src/components/strata/cardio-fields.tsx`, `extra-programs.tsx`, `src/test/cardio-ui.test.tsx`, `extra-programs-ui.test.tsx`.

Updated UI: `program-builder.tsx`, `program-summary.tsx`, `program-library.tsx`, `session.tsx`, `client-overview.tsx`, `feature-fields.tsx`, `src/routes/app.train.tsx`; translation catalogue and locale scanner. Parent owns accompanying types/API/lifecycle/content/migrations.
