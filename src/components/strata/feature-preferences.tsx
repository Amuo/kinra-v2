import { useEffect } from "react";
import { useQ } from "@/lib/api";
import type { FeatureKind } from "@/lib/feature-types";
export function useFeaturePreferences() {
  const query = useQ(["features", "preferences"], (a) => a.features.list("preferences"));
  return query.data?.[0]?.payload;
}
export function FeaturePreferences() {
  const preferences = useFeaturePreferences();
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
