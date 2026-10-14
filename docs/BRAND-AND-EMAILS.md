# Kinra identity and account emails

The v2 identity uses a three-piece K: a stable vertical stem and two forward-cut arms. The outlined uppercase wordmark echoes Archivo's wide, athletic shapes without requiring a font download. Volt marks the action; pulse cyan labels information. Graphite cards and the app's 20px corner treatment connect inbox and app.

## Assets and previews

- `public/brand/kinra-logo.svg`: editable vector lockup for dark backgrounds; all letters are paths.
- `public/brand/kinra-logo-ink.svg`: single-color version for light backgrounds.
- `public/brand/kinra-mark.svg` and `.png`: transparent mark; PNG is 192px for email use at 40px.
- `public/brand/kinra-icon.svg` and `.png`: rounded graphite app icon, PNG at 512px.
- `public/brand/kinra-logo.png`: transparent 1008 × 256 lockup preview.
- `public/brand/apple-touch-icon.png`: 180px touch icon; `public/favicon.ico`: 32px PNG-backed ICO.
- `docs/brand-preview/index.html`: local gallery of the identity and six complete email previews. Open it directly in a browser. Each email also has its own preview HTML. Sample links use `example.invalid`; the sample code is `123456`.

The shared React logo is used on the landing page, sign-in and account-confirmation screen. Keep at least one stem-width of clear space around the mark. Use the icon for small square placements; do not compress the full wordmark into a favicon. The light-background ink logo is monochrome by design.

## Email files

`supabase/templates/` contains confirmation, recovery, magic link, account invitation, email change and reauthentication designs. Each has HTML and a plain-text companion. `scripts/brand-emails.mjs` is the editable source for the vector assets, email copy, layout, preview gallery and publication bundle:

```sh
node scripts/brand-emails.mjs
```

PNG and ICO exports are checked in. If vector geometry changes, re-export the vectors at the dimensions above using an SVG renderer; the generator does not require or install a raster tool.

Templates use inline colors and table layout, a hidden preheader, system-font fallbacks, an Outlook fixed-width wrapper, mobile spacing and full-width action buttons. A text wordmark remains readable when images are blocked. The HTML fallback uses a descriptive secure link; plain-text companions retain the full URL. The latest layout, research, publication and Gmail mobile color fixes are documented in [EMAIL-DESIGN.md](EMAIL-DESIGN.md).

No OTP code appears in the five link-based emails because v2's current screens do not offer code entry. The reauthentication template is a prepared design for an optional future flow; it does not enable that flow. The account invitation template describes account access, not coach access. These are English templates matching the v2 UI; they do not replace the legacy app's localized email renderer.

## Publication procedure

1. Deploy the v2 application and `public/brand` assets through the normal release process. Verify `https://kinra.fit/brand/kinra-mark.png` returns the new PNG. Email images use `{{ .SiteURL }}/brand/kinra-mark.png`, so the configured Site URL must identify this deployed app. Do not activate templates before the image is available.
2. Export the existing hosted Supabase Auth template settings as a rollback copy. This project shares Auth infrastructure with the legacy app, so a hosted template update affects every app using those settings. Coordinate that switch with the v2 release and preserve existing localization if legacy users still require it.
3. In Supabase Authentication → Email Templates, copy each HTML file into its matching template and use the subject in `config.example.toml`. Alternatively, `hosted-auth-templates.json` is a ready-to-review Management API PATCH body for `/v1/projects/ztbwycesqodjvseqhygh/config/auth`. It contains only the twelve subject/content fields, with no credentials, URLs, SMTP or auth-behavior settings. Update only the templates being released; confirmation and recovery are the active v2 flows.
4. The `.txt` companions are editorial/provider fallbacks, not additional Supabase configuration keys. Supabase's template configuration accepts the HTML body. For local Supabase development, merge the selected sections from `config.example.toml` into `supabase/config.toml`; this alone does not update hosted Auth.
5. Preserve `{{ .ConfirmationURL }}` in both the CTA and fallback link. Supabase generates its verification endpoint and redirect; do not replace it with a hardcoded login URL. Keep the existing `/auth/confirm` redirect configuration, including the recovery flow. Keep `{{ .Token }}` only in the reauthentication template.
6. After release authorization, verify confirmation and recovery using a designated test account, then review actual Gmail and Outlook messages at desktop and phone sizes, light/dark mode, images blocked and an expired link. Verify the recovery link reaches password reset. Do not enable magic link, invitations or reauthentication merely to preview their design.

Source for hosted template fields and variables: [Supabase Auth email templates](https://supabase.com/docs/guides/auth/auth-email-templates).

## Validation performed

TypeScript and the production build pass. Changed-file lint is clean; full-project lint has zero errors and 44 existing Fast Refresh warnings. All 68 tests across 17 files pass. Static validation checks all six HTML documents, action/fallback links, token placement and the twelve-field publication bundle. Logo PNGs were visually inspected. The templates were subsequently reviewed through a localhost preview at desktop and 320px embedded widths, then published to hosted Supabase Auth for confirmation and recovery. Fresh messages using the redesigned layout arrived in the owner's Gmail inbox with SPF and DKIM passing. Signup verification and password reset through Auth were checked on synthetic QA accounts. See [EMAIL-DESIGN.md](EMAIL-DESIGN.md) for the client-specific limitations and current evidence.
