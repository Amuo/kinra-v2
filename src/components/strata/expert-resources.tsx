import { useState } from "react";
import { useApi, useQ, useAct } from "@/lib/api";
import { t, number, useLanguage } from "@/lib/i18n";
import { errorText } from "@/lib/i18n-errors";
import type { FeatureRecord } from "@/lib/feature-types";
import type { ResourceUpload, ExpertResource } from "@/lib/resources";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState } from "./ui";

export function ExpertResources({ expert }: { expert: FeatureRecord<"expert"> }) {
  useLanguage();
  const api = useApi();
  const rows = useQ(["resources", expert.id], (a) => a.resources.list(expert.id));
  const [file, setFile] = useState<File | null>(null);
  const [draft, setDraft] = useState<ResourceUpload | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [error, setError] = useState("");
  const [remove, setRemove] = useState<ExpertResource | null>(null);
  const upload = useAct((a, file: File) => a.resources.upload(expert.id, file));
  const save = useAct((a) =>
    a.resources.save(draft!, title.trim(), description.trim(), visibility),
  );
  const discard = useAct((a) => a.resources.discard(draft!));
  const deletion = useAct((a, row: ExpertResource) => a.resources.remove(row));
  const download = useAct(async (a, row: ExpertResource) => {
    const blob = await a.resources.download(row);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = row.payload.filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  const reset = () => {
    setDraft(null);
    setFile(null);
    setTitle("");
    setDescription("");
    setVisibility("private");
    setError("");
  };
  const busy = upload.isPending || save.isPending || discard.isPending;
  return (
    <section className="space-y-3 border-t border-border pt-4">
      <h3 className="text-title font-semibold">{t("Expert materials")}</h3>
      <p className="text-caption text-muted-foreground">
        {t(
          "PDF materials are provided by the profile owner. Download to review them in your own PDF reader.",
        )}
      </p>
      {rows.error ? (
        <ErrorState onRetry={() => void rows.refetch()} />
      ) : rows.isLoading ? (
        <p role="status">{t("Loading…")}</p>
      ) : (
        (rows.data ?? []).map((row) => (
          <div key={row.id} className="rounded-tile border border-border p-3">
            <h4 className="break-words font-semibold">{row.payload.title}</h4>
            <p className="mt-1 whitespace-pre-wrap text-label">{row.payload.description}</p>
            <p className="mt-2 break-words text-caption text-muted-foreground">
              {row.payload.filename} ·{" "}
              {number(row.payload.bytes / 1048576, { maximumFractionDigits: 1 })} MB ·{" "}
              {t(row.visibility === "public" ? "Public" : "Private")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                wrap
                variant="secondary"
                disabled={download.isPending}
                onClick={() => download.mutate(row)}
              >
                {t("Download PDF")}
              </Button>
              {expert.owner_id === api.ownerId && (
                <Button wrap variant="ghost" onClick={() => setRemove(row)}>
                  {t("Remove material")}
                </Button>
              )}
            </div>
          </div>
        ))
      )}
      {remove && (
        <div
          role="alertdialog"
          aria-label={t("Remove material")}
          className="rounded-tile border border-destructive/40 p-4"
        >
          <p className="text-label">{t("Remove this material and its stored file?")}</p>
          <p className="mt-2 break-words font-semibold">{remove.payload.title}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              wrap
              variant="destructive"
              disabled={deletion.isPending}
              onClick={() =>
                deletion.mutate(remove, {
                  onSuccess: () => {
                    setRemove(null);
                    void rows.refetch();
                  },
                })
              }
            >
              {t("Remove")}
            </Button>
            <Button
              wrap
              variant="secondary"
              disabled={deletion.isPending}
              onClick={() => setRemove(null)}
            >
              {t("Cancel")}
            </Button>
          </div>
        </div>
      )}
      {expert.owner_id === api.ownerId && (
        <details className="rounded-tile border border-border p-4">
          <summary className="cursor-pointer py-2 font-semibold">{t("Add PDF material")}</summary>
          <div className="mt-3 space-y-3">
            {!draft ? (
              <>
                <label className="block text-label">
                  {t("PDF file, up to 10 MB")}
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    disabled={busy}
                    className="mt-2 block min-h-11 w-full min-w-0 text-label"
                    onChange={(e) => {
                      setFile(e.target.files?.[0] ?? null);
                      setError("");
                    }}
                  />
                </label>
                {file && (
                  <p className="break-words text-caption">
                    {file.name} · {number(file.size / 1048576, { maximumFractionDigits: 1 })} MB
                  </p>
                )}
                <Button
                  wrap
                  disabled={!file || busy}
                  onClick={async () => {
                    if (!file) return;
                    setError("");
                    try {
                      const result = (await upload.mutateAsync(file)) as ResourceUpload;
                      setDraft(result);
                      setTitle(file.name.replace(/\.pdf$/i, ""));
                    } catch (cause) {
                      setError(errorText(cause));
                    }
                  }}
                >
                  {t("Upload privately for review")}
                </Button>
              </>
            ) : (
              <>
                <p className="break-words text-caption">{draft.filename}</p>
                <label className="block text-label">
                  {t("Title")}
                  <Input
                    className="mt-2 min-h-11"
                    maxLength={200}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </label>
                <label className="block text-label">
                  {t("Description")}
                  <textarea
                    maxLength={10000}
                    className="mt-2 min-h-24 w-full rounded-xl border border-border bg-surface p-3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </label>
                <label className="block text-label">
                  {t("Visibility")}
                  <select
                    className="mt-2 min-h-11 w-full rounded-xl border border-border bg-surface p-2"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as "private" | "public")}
                  >
                    <option value="private">{t("Private")}</option>
                    <option value="public">{t("Public")}</option>
                  </select>
                </label>
                <p className="text-caption text-muted-foreground">
                  {t(
                    "Public materials are available to signed-in members only while this expert profile is also public. Private materials remain yours.",
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    wrap
                    disabled={busy || !title.trim()}
                    onClick={() =>
                      save.mutate(undefined, {
                        onSuccess: () => {
                          reset();
                          void rows.refetch();
                        },
                      })
                    }
                  >
                    {t(visibility === "public" ? "Publish material" : "Save private material")}
                  </Button>
                  <Button
                    wrap
                    variant="secondary"
                    disabled={busy}
                    onClick={() => discard.mutate(undefined, { onSuccess: reset })}
                  >
                    {t("Discard uploaded draft")}
                  </Button>
                </div>
              </>
            )}
            {error && (
              <p role="alert" className="text-label text-destructive">
                {error}
              </p>
            )}
          </div>
        </details>
      )}
    </section>
  );
}
