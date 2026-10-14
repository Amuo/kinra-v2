import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
async function save(path, content) {
  const url = new URL(path, root);
  await mkdir(new URL("./", url), { recursive: true });
  await writeFile(url, content);
}

// Three solid shapes; no fonts, strokes, filters or external dependencies.
const mark = '<path d="M14 12h10v40H14zM28 29 43 12h13L37 33H28zM28 35h11l17 17H42L28 38z"/>';
const letters =
  '<path d="M0 0h7v14L18 0h9L13 17l15 19h-9L7 20v16H0zM33 0h7v36h-7zM48 0h7l16 23V0h7v36h-7L55 13v23h-7z"/><path fill-rule="evenodd" d="M86 0h16c9 0 14 5 14 12 0 6-3 10-8 12l10 12h-9L98 24h-5v12h-7zm7 7v10h9c5 0 7-2 7-5s-2-5-7-5zM136 0h8l14 36h-8l-3-8h-14l-3 8h-8zm0 21h9l-4.5-12z"/>';
const svg = (viewBox, body, label) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${label}">${body}</svg>\n`;
await save(
  "public/brand/kinra-mark.svg",
  svg("0 0 64 64", `<g fill="#c4f65b">${mark}</g>`, "Kinra mark"),
);
await save(
  "public/brand/kinra-icon.svg",
  svg(
    "0 0 64 64",
    `<rect width="64" height="64" rx="16" fill="#0f1013"/><g fill="#c4f65b">${mark}</g>`,
    "Kinra",
  ),
);
await save(
  "public/brand/kinra-logo.svg",
  svg(
    "0 0 252 64",
    `<g fill="#c4f65b">${mark}</g><g transform="translate(78 14)" fill="#f5f6f8">${letters}</g><rect x="244" y="43" width="7" height="7" fill="#c4f65b"/>`,
    "Kinra",
  ),
);
await save(
  "public/brand/kinra-logo-ink.svg",
  svg(
    "0 0 252 64",
    `<g fill="#0f1013">${mark}<g transform="translate(78 14)">${letters}</g><rect x="244" y="43" width="7" height="7"/></g>`,
    "Kinra",
  ),
);

const emails = [
  {
    id: "confirmation",
    subject: "Confirm your email for Kinra",
    label: "MAKE IT YOURS",
    title: "Your next chapter.<br>One step away.",
    intro:
      "Confirm your email to finish setting up Kinra. Your space for training, nutrition and recovery starts here.",
    action: "Confirm email",
    note: "This link works once. If it has expired, return to Kinra and request a new confirmation email.",
    footer: "If you didn’t create a Kinra account, you can ignore this email.",
  },
  {
    id: "recovery",
    subject: "Reset your Kinra password",
    label: "ACCOUNT RECOVERY",
    title: "Get back<br>to your rhythm.",
    intro:
      "You requested a password reset. Follow the link below to choose a new password and get back into your account.",
    action: "Reset password",
    note: "This link works once. If it has expired, request another reset from the Kinra sign-in screen.",
    footer: "If you didn’t request this, ignore this email. Your password will stay the same.",
  },
  {
    id: "magic_link",
    subject: "Your Kinra sign-in link",
    label: "YOUR WAY BACK IN",
    title: "Ready when<br>you are.",
    intro: "Use this secure link to sign in to your Kinra account and pick up where you left off.",
    action: "Sign in to Kinra",
    note: "This link works once. Open it on the device where you want to use Kinra.",
    footer: "If you didn’t request a sign-in link, you can ignore this email.",
  },
  {
    id: "invite",
    subject: "You’re invited to Kinra",
    label: "A PLACE FOR YOUR PROGRESS",
    title: "Your invitation<br>starts here.",
    intro:
      "You’ve been invited to create a Kinra account. Open your invitation to get started with training, nutrition and recovery in one place.",
    action: "Accept invitation",
    note: "This invitation creates account access. It does not grant a coach permission to view your records.",
    footer: "If you weren’t expecting this invitation, you can ignore this email.",
  },
  {
    id: "email_change",
    subject: "Confirm your email change for Kinra",
    label: "ACCOUNT DETAILS",
    title: "A new address.<br>The same you.",
    intro:
      "You requested an email address change for your Kinra account. Confirm this address to continue. You may need to confirm the change from both inboxes.",
    action: "Confirm email change",
    note: "Only confirm if you requested this change. This link works once.",
    footer:
      "If you didn’t request this change, don’t use this link. Review your account security in Kinra.",
  },
  {
    id: "reauthentication",
    subject: "Your Kinra verification code",
    label: "QUICK SECURITY CHECK",
    title: "One check.<br>Then you’re set.",
    intro:
      "Enter this code in the Kinra verification screen to confirm it’s you before continuing with your requested account change.",
    code: true,
    note: "Use this code only in the verification screen you opened. Never share it with anyone.",
    footer: "If you didn’t request this code, you can ignore this email.",
  },
];

function document(email, preview = false) {
  const url = preview ? "https://example.invalid/kinra-preview-only" : "{{ .ConfirmationURL }}";
  const asset = preview
    ? "../../public/brand/kinra-mark.png"
    : "{{ .SiteURL }}/brand/kinra-mark.png";
  const code = preview ? "123456" : "{{ .Token }}";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"><title>${email.subject}</title>
<style>body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0;mso-table-rspace:0}table{border-collapse:collapse}img{border:0;outline:none}a{overflow-wrap:anywhere}a:focus-visible{outline:2px solid #79d5e7;outline-offset:4px}@media(max-width:480px){.outer{padding:20px 12px!important}.pad{padding-left:24px!important;padding-right:24px!important}.headline{font-size:34px!important}.action{display:block!important;text-align:center!important}}@media(prefers-color-scheme:dark){.canvas{background:#0f1013!important}.card{background:#1a1c20!important}.copy{color:#f5f6f8!important}.muted{color:#c6c9d0!important}.cta{background:#c4f65b!important;color:#18200e!important}}</style></head>
<body class="canvas" bgcolor="#0f1013" style="margin:0;padding:0;background:#0f1013;color:#f5f6f8;font-family:Arial,Helvetica,sans-serif">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all">${email.intro}</div>
<table role="presentation" width="100%" class="canvas" bgcolor="#0f1013"><tr><td class="outer" align="center" style="padding:48px 16px">
<!--[if mso]><table role="presentation" width="560"><tr><td><![endif]-->
<table role="presentation" width="100%" style="max-width:560px">
<tr><td class="pad" style="padding:0 36px 26px"><table role="presentation"><tr><td width="48"><img src="${asset}" width="40" height="40" alt="" style="display:block;width:40px;height:40px"></td><td style="font-size:25px;font-weight:900;letter-spacing:1px;color:#f5f6f8">KINRA<span style="color:#c4f65b">.</span></td></tr></table></td></tr>
<tr><td class="card pad" bgcolor="#1a1c20" style="padding:36px 36px 0;background:#1a1c20;border-top:3px solid #c4f65b;border-radius:20px 20px 0 0">
<p style="margin:0 0 18px;font-family:'Courier New',monospace;font-size:11px;font-weight:bold;line-height:18px;letter-spacing:2px;color:#79d5e7">${email.label}</p>
<h1 class="headline copy" style="margin:0;font-size:40px;font-weight:900;line-height:1.08;letter-spacing:-1.5px;color:#f5f6f8">${email.title}</h1>
<p class="muted" style="margin:24px 0 28px;font-size:16px;line-height:26px;color:#c6c9d0">${email.intro}</p>
${email.code ? `<p style="margin:0 0 28px;padding:20px 16px;background:#25282e;border:1px solid #3c4149;border-radius:12px;color:#c4f65b;font-family:'Courier New',monospace;font-size:32px;font-weight:bold;letter-spacing:7px;text-align:center">${code}</p>` : `<table role="presentation" width="100%" style="margin:0 0 28px"><tr><td class="cta" align="center" bgcolor="#c4f65b" style="background:#c4f65b;border-radius:12px;mso-padding-alt:18px 24px"><a class="cta action" href="${url}" style="display:block;padding:18px 24px;border:1px solid #c4f65b;border-radius:12px;font-size:16px;line-height:20px;font-weight:bold;color:#18200e;background:#c4f65b;text-decoration:none">${email.action} &nbsp; &#8594;</a></td></tr></table>`}
<p class="muted" style="margin:0 0 28px;padding-left:16px;border-left:2px solid #79d5e7;font-size:13px;line-height:21px;color:#c6c9d0">${email.note}</p>
</td></tr>
<tr><td class="card pad" bgcolor="#1a1c20" style="padding:0 36px 32px;background:#1a1c20;border-radius:0 0 20px 20px">
${email.code ? "" : `<div style="border-top:1px solid #363a42;padding-top:22px"><p class="muted" style="margin:0 0 8px;font-size:12px;line-height:20px;color:#c6c9d0">Button not working? Copy this link into your browser:</p><a href="${url}" style="display:block;font-size:12px;line-height:20px;color:#c4f65b;word-break:break-all;overflow-wrap:anywhere;text-decoration:underline">${url}</a></div>`}
</td></tr>
<tr><td class="pad muted" style="padding:24px 36px 0;font-size:12px;line-height:20px;color:#a9aeb8"><p style="margin:0 0 24px">${email.footer}${email.code ? "" : " Keep this link private."}</p><p style="margin:0;color:#c6c9d0;font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px">TRAIN. FUEL. RECOVER.</p><p style="margin:8px 0 0">Your progress, in one place.</p></td></tr>
</table><!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>\n`;
}

const config = ["# Versioned local email templates. Hosted templates are configured separately."];
const hosted = {};
for (const email of emails) {
  hosted[`mailer_subjects_${email.id}`] = email.subject;
  hosted[`mailer_templates_${email.id}_content`] = document(email);
  await save(`supabase/templates/${email.id}.html`, document(email));
  await save(
    `supabase/templates/${email.id}.txt`,
    `${email.subject}\n\n${email.intro}\n\n${email.code ? "Verification code: {{ .Token }}" : `${email.action}: {{ .ConfirmationURL }}`}\n\n${email.note}\n\n${email.footer}\n\nKINRA — Train. Fuel. Recover.\n`,
  );
  await save(`docs/brand-preview/${email.id}.html`, document(email, true));
  config.push(
    `[auth.email.template.${email.id}]`,
    `subject = ${JSON.stringify(email.subject)}`,
    `content_path = "./supabase/templates/${email.id}.html"`,
    "",
  );
}
await save("supabase/templates/config.example.toml", `${config.join("\n").trimEnd()}\n`);
await save("supabase/templates/hosted-auth-templates.json", `${JSON.stringify(hosted, null, 2)}\n`);
await save(
  "docs/brand-preview/index.html",
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kinra — Brand & email preview</title><style>*{box-sizing:border-box}body{margin:0;padding:48px;background:#0f1013;color:#f5f6f8;font:16px/1.5 Arial,sans-serif}main{max-width:1200px;margin:auto}.eyebrow{color:#79d5e7;letter-spacing:3px;font:12px monospace}h1{font-size:clamp(36px,5vw,64px);line-height:1.05;letter-spacing:-2px;margin:18px 0}p{color:#c6c9d0}.brand{display:flex;flex-wrap:wrap;gap:24px;margin:40px 0}.tile{display:flex;justify-content:center;align-items:center;min-height:170px;padding:32px;border-radius:20px;background:#1a1c20;border:1px solid #363a42;flex:1}.tile img{max-width:100%}.light{background:#f5f6f8}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}.email{min-width:0;border:1px solid #363a42;border-radius:20px;overflow:hidden}.label{padding:16px 24px;background:#25282e}.label a{color:#c4f65b}iframe{display:block;border:0;width:100%;height:840px;background:#0f1013}.swatches{display:flex;flex-wrap:wrap;gap:12px}.swatches span{border:1px solid #363a42;border-radius:999px;padding:9px 15px;font:12px monospace}@media(max-width:700px){body{padding:24px 16px}.grid{grid-template-columns:1fr}iframe{height:930px}}</style></head><body><main><div class="eyebrow">KINRA / IDENTITY SYSTEM</div><h1>Built for your<br>next chapter.</h1><p>A forward-cut K. Graphite, volt and pulse. One identity from app to inbox.</p><div class="brand"><div class="tile"><img src="../../public/brand/kinra-logo.svg" width="315" height="80" alt="Kinra logo on graphite"></div><div class="tile light"><img src="../../public/brand/kinra-logo-ink.svg" width="315" height="80" alt="Kinra ink logo on white"></div><div class="tile"><img src="../../public/brand/kinra-icon.svg" width="96" height="96" alt="Kinra app icon"></div></div><div class="swatches"><span>GRAPHITE #0F1013</span><span style="color:#c4f65b">VOLT #C4F65B</span><span style="color:#79d5e7">PULSE #79D5E7</span></div><h2 style="margin-top:56px">Account emails</h2><p>Local previews use inactive sample links and a sample verification code.</p><div class="grid">${emails.map((e) => `<section class="email"><div class="label"><a href="${e.id}.html">${e.subject}</a></div><iframe title="${e.subject}" src="${e.id}.html" loading="lazy"></iframe></section>`).join("")}</div></main></body></html>\n`,
);
console.log(
  `Generated Kinra vector assets, six email templates and previews in ${fileURLToPath(root)}`,
);
