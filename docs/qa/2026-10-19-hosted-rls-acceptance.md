# Hosted PostgreSQL acceptance — 19 October 2026

All assertions passed on Supabase project `ztbwycesqodjvseqhygh`, isolated `kinra_v2_` namespace, after migrations 0012–0022. The exact test source ran in one `BEGIN … ROLLBACK` transaction with seven fresh synthetic actors. A separate read-only check at **2026-10-19 23:57:24.982669 UTC** confirmed zero remaining synthetic rows in every inspected domain.

Validated workflows:

- All 22 templates are present; training/nutrition copies are privately editable, training adoption retries return the same copy, and cross-owner adoption/read is denied.
- Initial specialist and organization onboarding selects the correct workspace without creating staff or client connections.
- A primary Solo account can explicitly add Coach, be found by the existing safe code lookup, and accept an explicit client connection. Source and hosted policies already use `has_role`; no workspace-connection patch was needed.
- Owners issue staff invitations; preview does not join; managers cannot grant staff. Managers can record memberships, while read-only staff cannot read finance directly or through the roster RPC.
- Private group content is hidden until invitation acceptance and becomes inaccessible immediately after removal. A kicked member cannot reuse the consumed invitation.
- Published availability requires an exact slot and rejects overlapping pending requests. Another connected client sees free slot timestamps without the requesting client's identity or notes.
- Attachment metadata and Storage paths are readable only by the connected sender/recipient, not another client of the same coach.
- Published resource metadata and its Storage path become inaccessible when its expert parent is unpublished.
- Device test claims enforce the one-minute throttle. Direct timestamp resets and forged dispatcher calls from authenticated and anonymous roles are denied.

The independent post-rollback proof found **0** matching rows in auth users, profiles, feature records, programs, template adoptions, connections, organization staff, organization memberships, community members, availability, message attachments, devices and Storage objects.

This acceptance checks PostgreSQL authorization and Storage **metadata** policies. It did not upload binaries, perform HTTP delivery, send email or deliver push notifications. No real account data was targeted or changed.

Evidence:

- [Executed SQL source](2026-10-19-hosted-rls-acceptance.sql), source-file SHA-256 `159b1b598caf58eeb2ba64effba2bb990f829e16c370704235f4fee1fdc5be9d`.
- [Returned result and independent residual proof](2026-10-19-hosted-rls-acceptance-result.json).
- [Local rehearsal runner](verify-hosted-acceptance-locally.mjs), which uses PGlite only and never connects to Supabase.
