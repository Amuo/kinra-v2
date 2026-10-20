import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const templates = JSON.parse(readFileSync("src/data/program-templates.json", "utf8"));
const quote = (v) => "'" + String(v).replaceAll("'", "''") + "'";
const rows = templates.map((locales) => {
  const t = locales.en;
  const payload = Object.fromEntries(
    ["en", "bs", "de"].map((lang) => {
      const p = locales[lang];
      return [
        lang,
        p.type === "training"
          ? {
              name: p.title,
              description: [p.summary, p.progression, p.considerations].join("\n\n"),
              weeks: p.weeks,
              days: p.days,
            }
          : p.nutrition,
      ];
    }),
  );
  return `(${quote(t.id)},${quote(t.type)},1,${quote(JSON.stringify(payload))}::jsonb)`;
});
const sql = `-- Original Kinra templates: private editable copies; no competitor routine content.\n-- Source JSON SHA256: ${createHash("sha256").update(readFileSync("src/data/program-templates.json")).digest("hex")}\nINSERT INTO public.template_catalogue(id,kind,content_version,payload) VALUES\n${rows.join(",\n")}\nON CONFLICT(id) DO UPDATE SET kind=excluded.kind,content_version=excluded.content_version,payload=excluded.payload,updated_at=now();\n`;
writeFileSync("drizzle/migrations/0013_template_content.sql", sql);
console.log(`Prepared ${rows.length} original localized templates.`);
