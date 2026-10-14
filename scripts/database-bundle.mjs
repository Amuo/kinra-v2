import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const names = [
  "app_role",
  "profiles",
  "user_roles",
  "trainer_clients",
  "has_role",
  "is_trainer_of",
  "find_trainer_by_code",
  "handle_new_user",
  "on_auth_user_created",
  "workouts",
  "sleep_logs",
  "nutrition_logs",
  "journal_entries",
  "body_metrics",
  "programs",
  "program_assignments",
  "trainer_notes",
  "progress_photos",
  "progress_reports",
  "kinra_valid_sets",
  "kinra_valid_program_days",
];
const matcher = new RegExp(`\\b(${names.join("|")})\\b`, "g");
const migrations = readdirSync(new URL("drizzle/migrations/", root))
  .filter((name) => name.endsWith(".sql"))
  .sort();
const body = migrations
  .map((file) => {
    const sql = readFileSync(new URL(`drizzle/migrations/${file}`, root), "utf8")
      .replace(matcher, (name) => `kinra_v2_${name}`)
      .replaceAll("'profile-avatars'", "'kinra-v2-profile-avatars'")
      .replaceAll("'progress-photos'", "'kinra-v2-progress-photos'")
      .replace(
        /((?:CREATE|create)(?: UNIQUE| unique)? (?:INDEX|index) )([a-z_]+)/g,
        "$1kinra_v2_$2",
      )
      .replace(/((?:CREATE|create|DROP|drop) (?:POLICY|policy) )"([^"]+)"/g, '$1"Kinra v2: $2"');
    return `-- Source: ${file}\n${sql}`;
  })
  .join("\n\n");
const output = `-- Kinra v2: additive installation in the existing Kinra project.\n-- Does not change the previous app's tables, functions, buckets or auth.\n-- Run once as postgres. The transaction rolls back in full on any failure.\nBEGIN;\n${body}\n\n-- Existing Supabase identities receive a v2 profile; roles are chosen in v2.\nINSERT INTO public.kinra_v2_profiles(id, display_name)\nSELECT id, left(coalesce(raw_user_meta_data->>'display_name', raw_user_meta_data->>'full_name', split_part(email,'@',1), 'Member'),80) FROM auth.users\nON CONFLICT(id) DO NOTHING;\nCOMMENT ON TABLE public.kinra_v2_profiles IS 'Kinra v2 schema version 0003_security_and_integrity';\nNOTIFY pgrst, 'reload schema';\nCOMMIT;\n`;
mkdirSync(new URL("supabase/migrations/", root), { recursive: true });
writeFileSync(new URL("supabase/migrations/202610140001_kinra_v2.sql", root), output);
console.log(
  `Prepared ${migrations.length} migrations for the isolated v2 namespace in ${fileURLToPath(root)}`,
);
