# Account email verification — 14 October 2026

The test uses a dedicated synthetic QA alias in the owner's connected Gmail inbox and the live Kinra Supabase project. No existing account's password is changed. Test credentials are generated and held in memory.

## Delivery evidence

- Signup was requested through the same Supabase Auth API/payload used by the live form, with `https://kinra.fit/auth/confirm` as the callback. It required email confirmation.
- Gmail received the signup message at 14:35:28 PDT, about three seconds after signup. It appeared in the inbox, and Gmail reported SPF and DKIM passing.
- The emailed link verified the account. Its callback opened live onboarding; selecting Solo entered the authenticated app. Password sign-in through Supabase Auth succeeded.
- Password recovery was requested using the live app's Forgot password button. Gmail received the reset message at 14:37:32 PDT, in the inbox, with SPF and DKIM passing.
- The reset link opened the password form on kinra.fit. Password rotation was completed through Supabase Auth; the original password was rejected and the replacement accepted. Credential entry/rotation is API-driven; it is not represented as a browser form submission.
- Resend's dashboard marked both messages delivered. Inbox receipt was checked independently of those provider statuses.

## Issue found and repaired

An already-used reset link was correctly rejected by Supabase, but the app ignored the returned error and reused an existing session. Callback parsing now rejects provider errors before checking the session. A valid recovery URL retains `flow=recover` after credentials are removed, preserving the recovery form on refresh. Regression tests cover expired links, query errors, recovery refresh, token types and PKCE callbacks.

These checks prove delivery to this owned Gmail inbox at the recorded times. They do not guarantee delivery to every recipient or mailbox provider.
