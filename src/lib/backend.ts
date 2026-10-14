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
export const bucket = (name: "profile-avatars" | "progress-photos") =>
  supabase.storage.from(isolated ? `kinra-v2-${name}` : name);
