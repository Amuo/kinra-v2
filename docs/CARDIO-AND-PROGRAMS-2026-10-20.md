# Cardio tracking and additional programs — 20 October 2026

This release implements the user's first requested priorities following the [FitConnect comparison](FITCONNECT-VERIFICATION-2026-10-19.md): actual cardio measurements and usable supplement/video program types. It also includes the comparison pass's translation, bookmark, file-access and sign-out fixes. It does not claim every remaining competitor difference is complete.

## Delivered behavior

- Training prescriptions may specify cardio duration, distance, speed and incline. Live intervals start with blank actuals, show targets separately, and require an explicitly entered duration or distance before completion. Actual seconds, metres, km/h and percent survive drafts, pause/reload, save and history editing. Zero speed/incline and negative incline are preserved; no calorie estimate, strength progression or strength PR is fabricated.
- Cardio history shows actual measurements in Today and Train. Bodyweight work is no longer classified as cardio merely because lifted volume is zero. Pure cardio uses general effort wording rather than repetitions-in-reserve hints.
- The Program library now has Supplements and Video tabs, private editable plans, search/context filters and connected-client assignment. Assigned-plan owners can review/edit; recipients perform their own activation/completion actions.
- Supplement programs organize a person's existing chosen products, entered doses, times and frequency. Explicit activation copies reviewed schedules with a chosen start date and end date derived from plan weeks. An atomic owner-scoped receipt prevents duplicate schedules under concurrent retries. The API checks the exact revision shown in review; changes require reloading, reviewing and explicitly activating again. Existing schedules and dose history are not rewritten by later source-plan edits.
- Video programs contain ordered HTTPS links with optional duration and instructions. Opening a link and recording completion are separate actions. Completed/skipped events are date-specific, idempotent and retain source-title snapshots. Unrelated users and disconnected clients cannot create events for unavailable plans.
- Two editable starter watchlists link to [NHS home-workout videos](https://www.nhs.uk/better-health/get-active/home-workout-videos/) and [NHS strength/flexibility demonstrations](https://www.nhs.uk/live-well/exercise/strength-and-flex-exercise-plan-how-to-videos/), checked on 20 October 2026. These are publisher-hosted English videos, clearly attributed; only original Kinra watchlist metadata is translated. They are not downloaded, rehosted, dubbed or represented as Kinra-owned footage.

## Language and design

English, Bosnian and German cover controls, units, errors, context/frequency choices, review/reload states and original starter metadata. Unchanged saved starter fields follow the selected locale without rewriting custom text. Existing original training/nutrition content has the same display behavior; user-authored text and completed history retain their authored language.

Parent implemented schema/API/persistence and user-requested Astra implemented UI/UX. Both consulted the vault's broader `Workout planning logging timers and recovery` and `Components interaction states and accessibility` research, in addition to Kinra notes. The implementation separates targets from actuals, gives units explicit labels, preserves interrupted drafts, uses large numeric controls and keeps completion deliberate. See [Astra's component-level handoff](FRONTEND-CARDIO-PROGRAMS-2026-10-20.md).

## Database and access

The changes are additive in the existing `kinra_v2_` Supabase namespace. Strict application/database validation covers new feature kinds and cardio fields. New activation receipts have RLS and owner-only reads; writes occur only through the guarded activation transaction. Public/anonymous execution is revoked. Activation checks the current actor, source audience, active connection, blocks and reviewed revision before creating records. Export includes activation receipts; app-scoped erasure removes them through existing cascades while retaining the shared Auth identity.

Live testing discovered an older hosted `kinra_valid_tracking` constraint, absent from the earlier standalone schema, that rejected the new discriminator. Compatibility migration 0026 extends that validator while preserving its existing checks and historical formats. No existing workout was rewritten. A stale review uses a non-retryable validation error, avoiding transaction-conflict retry behavior.

Fresh installation and upgrade tests cover namespaced/standalone operation and preservation of historical records. Official CLI migration files accompany the source migrations; exact applied versions and deployed source are recorded in the external release manifest after publication.

## Verification and release evidence

Local policy/behavior and UI tests cover actual/target separation, malformed direct writes, draft/save/edit round trips, private/assigned access, duplicate/concurrent activation, stale review rejection, immutable snapshots, interrupted authentication and all three languages. Hosted HTTP tests use real synthetic password sessions and the public client, not service-role bypasses. The browser pass uses isolated synthetic accounts; no real user data or email recipients are involved.

Final full-check count, authenticated HTTP outcomes, browser outcomes, fixture cleanup and the published commit/deployment are added to the external release manifest. Physical-device sensor integration, GPS, watch telemetry and translated third-party video media are not implemented or claimed.

## Remaining FitConnect differences

This batch supersedes the comparison's cardio and missing-program-type gaps for the delivered scope. It does not add a public supplement marketplace, video hosting, complete per-exercise demonstration video coverage, a weekly workout calendar, per-exercise prescription-change history, named meal/workout-relative supplement scheduling, broader medication scheduling, DOC resources or expert transformation/social pages. Privacy-only competitor descriptions and inactive competitor payments/AI/push must remain distinct from verified working features. The earlier comparison retains those evidence limits and the next implementation queue.
