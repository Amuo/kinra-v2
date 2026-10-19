import { useEffect, useRef } from "react";
import { useApi, useQ } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  currentLanguage,
  isLanguage,
  languageRevision,
  takePendingLanguage,
  registerLanguagePersistence,
  setLanguage,
  t as tr,
} from "@/lib/i18n";
import type { FeatureKind } from "@/lib/feature-types";
export function useFeaturePreferences() {
  const query = useQ(["features", "preferences"], (a) => a.features.list("preferences"));
  return query.data?.[0]?.payload;
}
export function FeaturePreferences() {
  const api = useApi();
  const qc = useQueryClient();
  const languageQuery = useQ(["features", "preferences"], (a) => a.features.list("preferences"));
  const mountedRevision = useRef(languageRevision());
  const hydrated = useRef(false);
  const previousRemote = useRef<string | undefined>(undefined);
  const recordRef = useRef(languageQuery.data?.[0]);
  recordRef.current = languageQuery.data?.[0];
  const preferences = useFeaturePreferences();
  useEffect(() => {
    const key = `kinra:language:${api.mode}:${api.ownerId}`;
    try {
      const saved = localStorage.getItem(key);
      if (isLanguage(saved)) setLanguage(saved, false);
    } catch {
      /* Restricted storage: use account preference when available. */
    }
    return () => {
      hydrated.current = false;
    };
  }, [api.mode, api.ownerId]);
  useEffect(() => {
    if (!languageQuery.isSuccess) return;
    const key = `kinra:language:${api.mode}:${api.ownerId}`;
    let disposed = false;
    let queue = Promise.resolve();
    const save = (next: "en" | "bs" | "de") => {
      try {
        localStorage.setItem(key, next);
      } catch {
        /* Per-tab preference remains. */
      }
      queue = queue
        .then(async () => {
          if (disposed) return;
          const previous = recordRef.current;
          const payload = previous?.payload ?? {
            language: next,
            theme: "system" as const,
            modules: {},
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          };
          const nextPayload = { ...payload, language: next };
          const id = await api.features.save(
            "preferences",
            nextPayload,
            previous ? { id: previous.id } : {},
          );
          recordRef.current = {
            ...previous,
            id,
            kind: "preferences",
            owner_id: api.ownerId,
            payload: nextPayload,
          } as NonNullable<typeof previous>;
          if (!disposed) await qc.invalidateQueries({ queryKey: [api.mode, api.ownerId] });
        })
        .catch(() => {
          if (!disposed)
            toast.error(
              tr("Language changed on this device. Could not sync it to your account. Try again."),
            );
        });
    };
    if (!hydrated.current) {
      hydrated.current = true;
      const remote = recordRef.current?.payload.language;
      const pending = takePendingLanguage();
      if (pending) {
        setLanguage(pending, false);
        save(pending);
      } else if (isLanguage(remote) && languageRevision() === mountedRevision.current)
        setLanguage(remote, false);
      else if (languageRevision() !== mountedRevision.current || !remote) save(currentLanguage());
    }
    const unregister = registerLanguagePersistence(save);
    return () => {
      disposed = true;
      unregister();
    };
  }, [api, languageQuery.isSuccess, qc]);
  useEffect(() => {
    const selected = preferences?.language;
    if (!isLanguage(selected)) return;
    const previous = previousRemote.current;
    previousRemote.current = selected;
    if (previous && previous !== selected) setLanguage(selected, false);
    if (api.mode !== "live") return;
    let disposed = false;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (
        disposed ||
        data.user?.id !== api.ownerId ||
        currentLanguage() !== selected ||
        data.user.user_metadata["kinra_language"] === selected
      )
        return;
      const result = await supabase.auth.updateUser({ data: { kinra_language: selected } });
      if (result.error && !disposed)
        toast.error(
          tr("Language changed on this device. Could not sync it to your account. Try again."),
        );
    })();
    return () => {
      disposed = true;
    };
  }, [preferences?.language, api.mode, api.ownerId]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const update = () => {
      document.documentElement.classList.toggle(
        "kinra-light",
        preferences?.theme === "light" || (preferences?.theme === "system" && media.matches),
      );
    };
    update();
    media.addEventListener("change", update);
    return () => {
      media.removeEventListener("change", update);
      document.documentElement.classList.remove("kinra-light");
    };
  }, [preferences?.theme]);
  return null;
}
const moduleFor: Partial<Record<FeatureKind, string>> = {
  nutrition_plan: "fuel",
  supplement: "supplements",
  medication: "medication",
  cycle: "cycle",
  measurement: "progress",
  goal: "progress",
  post: "community",
  group: "community",
  article: "community",
};
export function moduleVisible(kind: FeatureKind, modules: Record<string, boolean> = {}) {
  const module = moduleFor[kind];
  return !module || modules[module] !== false;
}
export const bsFeatureNames: Partial<Record<FeatureKind, string>> = {
  nutrition_plan: "Planovi prehrane",
  supplement: "Suplementi",
  habit: "Navike",
  steps: "Koraci",
  check_in: "Dnevna prijava",
  reminder: "Podsjetnici",
  goal: "Ciljevi",
  measurement: "Mjerenja",
  medication: "Lijekovi",
  cycle: "Dnevnik ciklusa",
  expert: "Stručnjaci",
  facility: "Objekti",
  saved: "Sačuvano",
  review: "Recenzije",
  group: "Grupe",
  post: "Objave",
  article: "Edukacija",
  report: "Prijave",
  block: "Blokirani računi",
  appointment: "Termini",
  organization: "Organizacije",
  membership_plan: "Članarine",
  preferences: "Postavke aplikacije",
  notification_preferences: "Tiho vrijeme",
};
