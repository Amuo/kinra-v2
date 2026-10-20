import { readFileSync, writeFileSync } from "node:fs";
let validation = readFileSync("drizzle/migrations/0015_optional_questionnaire.sql", "utf8");
validation = validation
  .replace("'city','limitations'", "'city','limitations','workspace'")
  .replace("'clients','dashboard'", "'clients','dashboard','organization','membership','community'")
  .replace(
    "coalesce(CASE v->>'role'",
    "coalesce(CASE WHEN v->>'workspace'='organization' THEN v->>'first_action' IN ('organization','membership','community') ELSE CASE v->>'role'",
  )
  .replace("ELSE false END,false)", "ELSE false END END,false)")
  .replace(
    "  RETURN true;",
    () => `  IF v ? 'workspace' AND v->'workspace'<>'null'::jsonb THEN
    IF jsonb_typeof(v->'workspace')<>'string' OR v->>'workspace' NOT IN ('solo','client','trainer','specialist','organization') THEN RETURN false; END IF;
    IF v->>'role' IS NOT NULL AND (CASE v->>'workspace' WHEN 'specialist' THEN 'trainer' WHEN 'organization' THEN 'solo' ELSE v->>'workspace' END) IS DISTINCT FROM v->>'role' THEN RETURN false; END IF;
  END IF;
  RETURN true;`,
  );
let save = readFileSync("drizzle/migrations/0011_onboarding_measurements.sql", "utf8");
save = save.slice(save.indexOf("CREATE OR REPLACE FUNCTION public.kinra_save_onboarding"));
save = save.replace(
  "    UPDATE public.profiles SET",
  () => `    -- Only initial completion selects a workspace. Retaking setup cannot
    -- unexpectedly switch the current account context or grant staff access.
    IF existing IS NULL THEN
      INSERT INTO public.account_roles(owner_id,role) VALUES(actor,chosen::text) ON CONFLICT DO NOTHING;
      INSERT INTO public.account_roles(owner_id,role) VALUES(actor,coalesce(data->>'workspace',chosen::text)) ON CONFLICT DO NOTHING;
      INSERT INTO public.account_context(owner_id,active_role) VALUES(actor,coalesce(data->>'workspace',chosen::text)) ON CONFLICT(owner_id) DO NOTHING;
    END IF;
    UPDATE public.profiles SET`,
);
writeFileSync(
  "drizzle/migrations/0020_onboarding_workspaces.sql",
  `-- Five onboarding paths share the same private profile and original role.\n${validation}\n${save}`,
);
