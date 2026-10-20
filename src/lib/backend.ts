import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// A shared production Supabase project keeps v2 records and policies separate
// from the earlier Kinra application. Standalone installations can omit this.
const isolated = import.meta.env["VITE_KINRA_TABLE_PREFIX"] === "kinra_v2_";
type Table = keyof Database["public"]["Tables"];
export const from = <T extends Table>(table: T) =>
  supabase.from((isolated ? `kinra_v2_${table}` : table) as T);
export const trainerByCode = (code: string) =>
  supabase.rpc(
    (isolated ? "kinra_v2_find_trainer_by_code" : "find_trainer_by_code") as "find_trainer_by_code",
    { _code: code },
  );
export const bucket = (
  name: "profile-avatars" | "progress-photos" | "message-attachments" | "expert-materials",
) => supabase.storage.from(isolated ? `kinra-v2-${name}` : name);
type FeatureRpcName =
  | "kinra_activate_supplement_plan"
  | "kinra_template_origins"
  | "kinra_community_admin"
  | "kinra_community_redeem"
  | "kinra_org_admin"
  | "kinra_org_redeem"
  | "kinra_availability"
  | "kinra_save_availability"
  | "kinra_available_slots"
  | "kinra_consume_meal"
  | "kinra_respond_appointment"
  | "kinra_erase_data"
  | "kinra_send_message"
  | "kinra_send_attachment"
  | "kinra_adopt_template"
  | "kinra_account_workspaces"
  | "kinra_set_workspace"
  | "kinra_save_onboarding";
export const featureRpc = <N extends FeatureRpcName>(
  name: N,
  args: Database["public"]["Functions"][N]["Args"],
) => supabase.rpc((isolated ? `kinra_v2_${name}` : name) as N, args as never);
