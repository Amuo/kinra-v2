# Kinra account email design

The production signup confirmation and password recovery emails use the same Kinra identity as the app. The redesign uses a graphite frame, a warm white reading surface, large athletic typography, a volt action button and a three-part Train / Fuel / Recover footer. Dark-mode rules provide a graphite reading surface where supported. All essential text and actions remain HTML; the small decorative mark is the only image.

## Research and decisions

- [React Email's Linear login example](https://demo.react.email/preview/Community/magic-links/linear-login-code): generous spacing and one obvious action. Kinra keeps the task focused and makes the fallback link secondary.
- [React Email's Nike receipt example](https://demo.react.email/preview/Community/receipts/nike-receipt): bold typography and restrained hierarchy. Kinra uses its own mark, colors and copy, with no third-party brand assets.
- [Outdoorsy's password reset on Really Good Emails](https://reallygoodemails.com/emails/reset-your-password-with-outdoorsy): recognizable branding and a friendly introduction within a functional security email.
- [Resend's accessibility guidance](https://resend.com/blog/6-tips-for-accessible-emails): language/direction attributes, presentational tables, semantic heading, descriptive links, live text and readable contrast.

The raw token URL is no longer printed across the HTML card. A second descriptive link uses the same Supabase verification URL; recipients can copy its address if needed. Plain-text companion files retain the full URL. These companion files are editorial/provider fallbacks, not additional hosted Supabase fields.

## Editing and release

Edit `scripts/brand-emails.mjs`, then run `node scripts/brand-emails.mjs`. It generates all six templates, local preview files and the hosted publication bundle. Only confirmation and recovery are active flows in this release; prepared designs do not enable other authentication methods.

The live templates are configured in Supabase project `ztbwycesqodjvseqhygh`, under Authentication → Emails. Subjects are **Confirm your email for Kinra** and **Reset your Kinra password**. Preserve `{{ .ConfirmationURL }}` in the action and fallback links, and the existing callback configuration. Template changes do not require changing SMTP credentials, redirect allowlists or account security settings.

Original hosted subjects and bodies were backed up locally before replacement. Public assets were deployed and checked before activating the templates. Local previews use inactive sample links. The generator's native table layout was visually reviewed at desktop and 320px embedded widths in light and dark styles. This is not a claim of testing every email client.

Actual inbox verification for this revision is recorded below after delivery testing.
