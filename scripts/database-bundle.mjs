import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const names = [
  "kinra_safe_external_url",
  "kinra_guard_expert_resource",
  "kinra_expert_published",
  "community_removals",
  "community_members",
  "community_moderators",
  "community_invites",
  "kinra_community_role",
  "kinra_guard_community_post",
  "kinra_community_name",
  "kinra_community_redeem",
  "kinra_community_admin",
  "device_subscriptions",
  "push_dispatch_config",
  "push_deliveries",
  "kinra_push_authorized",
  "kinra_push_due",
  "kinra_push_ack",
  "kinra_push_clock",
  "kinra_claim_push_test",
  "organization_staff",
  "organization_invites",
  "organization_memberships",
  "organization_membership_finance",
  "kinra_org_role",
  "kinra_org_name",
  "kinra_guard_membership",
  "kinra_org_redeem",
  "kinra_org_admin",
  "kinra_valid_availability",
  "coach_availability",
  "kinra_availability",
  "kinra_save_availability",
  "kinra_schedule_slots",
  "kinra_available_slots",
  "kinra_guard_appointment_slot",
  "message_attachments",
  "kinra_send_attachment",
  "template_catalogue",
  "template_adoptions",
  "kinra_adopt_template",
  "account_roles",
  "account_context",
  "kinra_account_workspaces",
  "kinra_set_workspace",
  "onboarding_state",
  "onboarding_state_version_check",
  "onboarding_state_step_check",
  "kinra_valid_onboarding",
  "kinra_save_onboarding",
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
  "feature_records",
  "kinra_feature_schemas",
  "kinra_json_matches",
  "kinra_feature_blocked",
  "kinra_feature_visible",
  "kinra_group_visible",
  "kinra_guard_feature",
  "kinra_consume_meal",
  "kinra_respond_appointment",
  "kinra_valid_program_metadata",
  "kinra_erase_data",
  "kinra_send_message",
  "kinra_guard_message_sender",
  "check_ins",
  "check_in_schedules",
  "calendar_events",
  "coach_branding",
  "habit_completions",
  "habits",
  "message_receipts",
  "push_subscriptions",
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
      .replaceAll("'message-attachments'", "'kinra-v2-message-attachments'")
      .replaceAll("'expert-materials'", "'kinra-v2-expert-materials'")
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
writeFileSync(
  new URL("supabase/migrations/202610140001_kinra_v2.sql", root),
  output.replace(
    "schema version 0003_security_and_integrity",
    "schema version 0022_notification_test_throttle",
  ),
);
const upgradeBody = body.slice(body.indexOf("-- Source: 0004_feature_schemas.sql"));
writeFileSync(
  new URL("supabase/migrations/202610190001_features.sql", root),
  `-- Existing Kinra v2 installation: additive feature expansion, 2026-10-19.\n-- Retains previously installed extensions and their schema-version history.\nBEGIN;\n${upgradeBody}\nDO $version$ BEGIN EXECUTE format('COMMENT ON TABLE public.kinra_v2_profiles IS %L', coalesce(obj_description('public.kinra_v2_profiles'::regclass), 'Kinra v2') || '; feature expansion 20261019'); END $version$;\nNOTIFY pgrst, 'reload schema';\nCOMMIT;\n`,
);
console.log(
  `Prepared ${migrations.length} migrations for the isolated v2 namespace in ${fileURLToPath(root)}`,
);
