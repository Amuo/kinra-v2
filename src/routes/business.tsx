import { createFileRoute } from "@tanstack/react-router";
import { BusinessLanding } from "@/components/strata/business-landing";
import { t } from "@/lib/i18n";
export const Route = createFileRoute("/business")({
  head: () => ({
    meta: [
      { title: t("Kinra Business — Memberships, reception & scheduling") },
      {
        name: "description",
        content: t(
          "Run memberships, QR attendance, staff and facility bookings in one workspace. For gyms, pools, clubs and sports complexes.",
        ),
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: t("Kinra Business — Memberships, reception & scheduling") },
      {
        property: "og:description",
        content: t(
          "Run memberships, QR attendance, staff and facility bookings in one workspace. For gyms, pools, clubs and sports complexes.",
        ),
      },
      { property: "og:url", content: "https://kinra.fit/business" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://kinra.fit/business" }],
  }),
  component: BusinessLanding,
});
