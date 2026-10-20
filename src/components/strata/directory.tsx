import { ExpertResources } from "./expert-resources";
import { useState } from "react";
import { useQ, useApi, useAct } from "@/lib/api";
import { t, useLanguage, number } from "@/lib/i18n";
import type { FeatureRecord } from "@/lib/feature-types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorState, SkeletonPage, Empty } from "./ui";
import { Sheet } from "./sheets";
import { FeatureWorkspace } from "./feature-hub";

type Listing = FeatureRecord<"expert"> | FeatureRecord<"facility">;
export function Directory({ kind }: { kind: "expert" | "facility" }) {
  useLanguage();
  const api = useApi();
  const rows = useQ(["features", kind], (a) => a.features.list(kind));
  const reviews = useQ(["features", "review"], (a) => a.features.list("review"));
  const saved = useQ(["features", "saved"], (a) => a.features.list("saved"));
  const bookmark = useAct((a, row: Listing) =>
    a.features.save("saved", { target_type: row.kind, target_id: row.id }),
  );
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Listing | null>(null);
  const [manage, setManage] = useState(false);
  const rating = (id: string) => {
    const values = (reviews.data ?? []).filter((r) => r.payload.subject_id === id);
    return {
      count: values.length,
      average: values.length
        ? values.reduce((sum, r) => sum + r.payload.rating, 0) / values.length
        : 0,
    };
  };
  const filterNames =
    kind === "expert" ? ["languages", "specialties"] : ["equipment", "amenities", "atmosphere"];
  const labels: Record<string, string> = {
    languages: "Language",
    specialties: "Specialty",
    equipment: "Equipment",
    amenities: "Amenities",
    atmosphere: "Atmosphere",
  };
  const entries = (rows.data ?? []) as Listing[];
  const options = (key: string) =>
    [
      ...new Set(
        entries.flatMap((row) => {
          const value = (row.payload as unknown as Record<string, unknown>)[key];
          return Array.isArray(value) ? (value as string[]) : [];
        }),
      ),
    ].sort();
  const matches = entries.filter((row) => {
    if (
      !`${row.payload.name} ${row.payload.city}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase())
    )
      return false;
    if (filters["rating"] && rating(row.id).average < Number(filters["rating"])) return false;
    for (const key of filterNames)
      if (
        filters[key] &&
        !((row.payload as unknown as Record<string, string[]>)[key] ?? []).includes(filters[key]!)
      )
        return false;
    if (row.kind === "facility") {
      if (filters["price"] && row.payload.price_tier !== Number(filters["price"])) return false;
      if (
        filters["promotion"] &&
        (!row.payload.promotion ||
          row.payload.promotion.valid_until < new Date().toISOString().slice(0, 10))
      )
        return false;
    }
    return true;
  });
  const select = (key: string, value: string) => setFilters((v) => ({ ...v, [key]: value }));
  if (manage)
    return (
      <div className="space-y-4">
        <Button wrap variant="secondary" onClick={() => setManage(false)}>
          {t("Back to discovery")}
        </Button>
        <FeatureWorkspace kind={kind} manage />
      </div>
    );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-title-l font-bold">
            {t(kind === "expert" ? "Find an expert" : "Find a facility")}
          </h2>
          <p className="mt-2 text-label text-muted-foreground">
            {t(
              "Listings and credentials are self-reported. Review the details before making contact.",
            )}
          </p>
        </div>
        <Button wrap variant="secondary" onClick={() => setManage(true)}>
          {t("Manage my listings")}
        </Button>
      </div>
      <label className="block">
        <span className="mb-2 block text-label">{t("Search name or city")}</span>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} className="min-h-11" />
      </label>
      <details className="rounded-tile border border-border p-4">
        <summary className="cursor-pointer py-2 font-semibold">{t("Filter results")}</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {filterNames.map((key) => (
            <label key={key} className="min-w-0 text-label">
              {t(labels[key]!)}
              <select
                className="mt-2 min-h-11 w-full rounded-xl border border-border bg-surface px-3"
                value={filters[key] ?? ""}
                onChange={(e) => select(key, e.target.value)}
              >
                <option value="">{t("All")}</option>
                {options(key).map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          ))}
          <label className="text-label">
            {t("Minimum review rating")}
            <select
              className="mt-2 min-h-11 w-full rounded-xl border border-border bg-surface px-3"
              value={filters["rating"] ?? ""}
              onChange={(e) => select("rating", e.target.value)}
            >
              <option value="">{t("All")}</option>
              {[3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {number(n)} / 5
                </option>
              ))}
            </select>
          </label>
          {kind === "facility" && (
            <>
              <label className="text-label">
                {t("Price tier")}
                <select
                  className="mt-2 min-h-11 w-full rounded-xl border border-border bg-surface px-3"
                  value={filters["price"] ?? ""}
                  onChange={(e) => select("price", e.target.value)}
                >
                  <option value="">{t("All")}</option>
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {"€".repeat(n)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  checked={!!filters["promotion"]}
                  onChange={(e) => select("promotion", e.target.checked ? "yes" : "")}
                />
                {t("Current promotions only")}
              </label>
            </>
          )}
          <Button
            wrap
            variant="ghost"
            onClick={() => {
              setFilters({});
              setQuery("");
            }}
          >
            {t("Clear filters")}
          </Button>
        </div>
      </details>
      {rows.isLoading || reviews.isLoading ? (
        <SkeletonPage />
      ) : rows.error || reviews.error ? (
        <ErrorState
          onRetry={() => {
            void rows.refetch();
            void reviews.refetch();
          }}
        />
      ) : matches.length === 0 ? (
        <Empty
          title={t("No matching listings")}
          body={t("Try a different city or clear some filters.")}
        />
      ) : (
        <div className="grid gap-3">
          {matches.map((row) => {
            const score = rating(row.id);
            return (
              <button
                key={row.id}
                type="button"
                className="rounded-card border border-border bg-surface p-4 text-left"
                onClick={() => setSelected(row)}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="min-w-0 break-words text-title font-bold">{row.payload.name}</h3>
                  <span className="text-caption">
                    {score.count
                      ? t("{rating} / 5 · {count} reviews", {
                          rating: number(score.average, { maximumFractionDigits: 1 }),
                          count: score.count,
                        })
                      : t("No reviews yet")}
                  </span>
                </div>
                <p className="mt-1 text-label">{row.payload.city}</p>
                <p className="mt-2 text-label text-muted-foreground">
                  {row.kind === "expert" ? row.payload.headline : row.payload.description}
                </p>
                {row.visibility === "private" && (
                  <p className="mt-2 text-caption">{t("Private draft")}</p>
                )}
              </button>
            );
          })}
        </div>
      )}
      {selected && (
        <Sheet
          open
          onOpenChange={(open) => !open && setSelected(null)}
          title={selected.payload.name}
        >
          <div className="space-y-4">
            <p className="text-label">{selected.payload.city}</p>
            <p className="whitespace-pre-wrap text-label">
              {selected.kind === "expert"
                ? selected.payload.biography
                : selected.payload.description}
            </p>
            {(selected.kind === "expert"
              ? [
                  ["Specialty", selected.payload.specialties],
                  ["Languages", selected.payload.languages],
                  ["Sports", selected.payload.sports],
                  ["Education", selected.payload.education],
                  ["Credential claims", selected.payload.credential_claims],
                ]
              : [
                  ["Equipment", selected.payload.equipment],
                  ["Amenities", selected.payload.amenities],
                  ["Atmosphere", selected.payload.atmosphere],
                ]
            ).map(([label, values]) =>
              Array.isArray(values) && values.length > 0 ? (
                <section key={label as string}>
                  <h3 className="text-label font-semibold">{t(label as string)}</h3>
                  <p className="mt-1 text-label text-muted-foreground">{values.join(" · ")}</p>
                </section>
              ) : null,
            )}
            {selected.kind === "expert" && (
              <>
                <p className="text-caption text-muted-foreground">
                  {t("Experience and client counts are self-reported.")}
                </p>
                <div className="flex flex-wrap gap-3 text-label">
                  {selected.payload.experience_years !== undefined && (
                    <span>
                      {t("{count} years of experience", {
                        count: selected.payload.experience_years,
                      })}
                    </span>
                  )}
                  {selected.payload.clients_count !== undefined && (
                    <span>
                      {t("{count} clients reported", { count: selected.payload.clients_count })}
                    </span>
                  )}
                </div>
                {selected.payload.website && (
                  <a
                    href={selected.payload.website}
                    target="_blank"
                    rel="noreferrer"
                    className="block min-h-11 py-2 text-label underline"
                  >
                    {t("Website")}
                  </a>
                )}
              </>
            )}
            {selected.kind === "facility" && (
              <>
                <p className="whitespace-pre-wrap text-label">{selected.payload.rules}</p>
                {[
                  ["Website", selected.payload.website],
                  ["Map", selected.payload.map_url],
                  ["Virtual tour", selected.payload.tour_url],
                ].map(([label, url]) =>
                  url ? (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="block min-h-11 py-2 text-label underline"
                    >
                      {t(label!)}
                    </a>
                  ) : null,
                )}
                {selected.payload.promotion &&
                  selected.payload.promotion.valid_until >=
                    new Date().toISOString().slice(0, 10) && (
                    <a
                      className="block rounded-tile border border-primary/30 p-4 underline"
                      href={selected.payload.promotion.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {selected.payload.promotion.title} · {selected.payload.promotion.valid_until}
                    </a>
                  )}
              </>
            )}
            <Button
              wrap
              className="w-full"
              disabled={
                bookmark.isPending ||
                saved.data?.some((row) => row.payload.target_id === selected.id)
              }
              onClick={() => void bookmark.mutate(selected)}
            >
              {t("Save listing")}
            </Button>
            {selected.owner_id === api.ownerId && (
              <Button
                wrap
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setSelected(null);
                  setManage(true);
                }}
              >
                {t("Edit my listing")}
              </Button>
            )}
            {selected.kind === "expert" && <ExpertResources key={selected.id} expert={selected} />}
            <ListingReviews key={selected.id} listing={selected} />
          </div>
        </Sheet>
      )}
    </div>
  );
}

function ListingReviews({ listing }: { listing: Listing }) {
  const api = useApi();
  const rows = useQ(["features", "review"], (a) => a.features.list("review"));
  const [rating, setRating] = useState("5");
  const [body, setBody] = useState("");
  const save = useAct((a) =>
    a.features.save(
      "review",
      {
        subject_id: listing.id,
        subject_type: listing.kind,
        rating: Number(rating),
        ...(body.trim() ? { body: body.trim() } : {}),
      },
      { visibility: "public" },
    ),
  );
  return (
    <section className="space-y-3 border-t border-border pt-4">
      <h3 className="font-semibold">{t("Reviews")}</h3>
      {(rows.data ?? [])
        .filter((row) => row.payload.subject_id === listing.id)
        .map((row) => (
          <div key={row.id} className="rounded-xl bg-surface p-3">
            <p>{number(row.payload.rating)} / 5</p>
            <p className="mt-1 whitespace-pre-wrap text-label">{row.payload.body}</p>
          </div>
        ))}
      {listing.owner_id !== api.ownerId && listing.visibility === "public" && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(undefined, { onSuccess: () => setBody("") });
          }}
        >
          <label className="block text-label">
            {t("Rating")}
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-border bg-surface p-2"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} / 5
                </option>
              ))}
            </select>
          </label>
          <label className="block text-label">
            {t("Your review")}
            <textarea
              maxLength={10000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-2 min-h-24 w-full rounded-xl border border-border bg-surface p-3"
            />
          </label>
          <p className="text-caption text-muted-foreground">
            {t("Your review will be visible to signed-in Kinra members.")}
          </p>
          <Button wrap type="submit" disabled={save.isPending}>
            {t("Publish review")}
          </Button>
        </form>
      )}
    </section>
  );
}
