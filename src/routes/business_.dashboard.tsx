import { t } from "@/lib/i18n";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ApiProvider, type Mode } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_CLIENT_ID, DEMO_TRAINER_ID } from "@/lib/demo-data";
import { useAuthIdentity } from "@/lib/account-state";
import { SkeletonPage } from "@/components/strata/ui";
import { BusinessWorkspace } from "@/components/strata/business-workspace";

export const Route = createFileRoute("/business_/dashboard")({
  ssr: false,
  beforeLoad: async () => {
    const demo = sessionStorage.getItem("strata-demo");
    if (demo === "client" || demo === "trainer")
      return {
        mode: `demo-${demo}` as Mode,
        ownerId: demo === "client" ? DEMO_CLIENT_ID : DEMO_TRAINER_ID,
      };
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { next: "/business/dashboard" } });
    return { mode: "live" as Mode, ownerId: data.user.id };
  },
  head: () => ({
    meta: [{ title: t("Business dashboard — Kinra") }, { name: "robots", content: "noindex" }],
  }),
  component: BusinessRoute,
});

function BusinessRoute() {
  const { mode, ownerId } = Route.useRouteContext();
  const identity = useAuthIdentity();
  if (mode === "live" && identity !== ownerId) return <SkeletonPage />;
  return (
    <ApiProvider key={`${mode}:${ownerId}`} mode={mode} ownerId={ownerId}>
      <BusinessWorkspace />
    </ApiProvider>
  );
}
