import { errorText } from "@/lib/i18n-errors";
import { t as tr, useLanguage, Message } from "@/lib/i18n";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Trash2 } from "lucide-react";
import { useApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "./sheets";

const confirmationText = "DELETE KINRA DATA";
export function DeleteKinraData() {
  useLanguage();
  const api = useApi();
  const navigate = useNavigate();
  const cache = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [exported, setExported] = useState(false);
  const erase = async () => {
    if (confirmation !== confirmationText || pending) return;
    setPending(true);
    setError("");
    try {
      await cache.cancelQueries();
      await api.features.eraseData(confirmation);
      cache.clear();
      sessionStorage.removeItem("strata-demo");
      await navigate({ to: "/", replace: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };
  return (
    <>
      <Button
        variant="ghost"
        className="mt-4 min-h-12 w-full whitespace-normal text-destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2 />
        <Message source="Delete Kinra profile and data" />
      </Button>
      <Sheet
        open={open}
        onOpenChange={(value) => !pending && !exporting && setOpen(value)}
        title={tr("Delete Kinra profile and data?")}
        sub={tr("Review what will be removed before continuing.")}
      >
        <div className="space-y-4">
          <p className="text-body">
            <Message source="This removes your Kinra profile, app records and private uploads. This cannot be undone. Your shared sign-in identity stays; other apps using that identity are not deleted." />
          </p>
          {api.mode !== "live" && (
            <p className="rounded-tile border border-volt/30 bg-volt/5 p-3 text-label">
              <Message source="Demo mode: this clears only this demo account’s records. No live account is affected." />
            </p>
          )}
          <Button
            variant="glass"
            className="h-12 w-full"
            disabled={pending || exporting}
            onClick={async () => {
              setExporting(true);
              setError("");
              try {
                const data = await api.features.exportData();
                const url = URL.createObjectURL(
                  new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
                );
                const link = document.createElement("a");
                link.href = url;
                link.download = "kinra-data-export.json";
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                setExported(true);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setExporting(false);
              }
            }}
          >
            <Download />
            {exporting
              ? tr("Preparing export…")
              : exported
                ? tr("Export again")
                : tr("Export my data first")}
          </Button>
          {exported && (
            <p role="status" className="text-caption text-muted-foreground">
              <Message source="Export prepared. Check your download before continuing." />
            </p>
          )}
          <label className="block text-label font-semibold">
            <Message source="Type {p0}to confirm" values={{ p0: confirmationText }} />
            <Input
              aria-label={tr("Type {p0} to confirm", { p0: confirmationText })}
              className="mt-2 h-12 bg-surface"
              value={confirmation}
              disabled={pending}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </label>
          {error && (
            <p role="alert" className="text-label text-destructive">
              {errorText(error)}
            </p>
          )}
          <Button
            variant="destructive"
            className="min-h-12 w-full whitespace-normal"
            disabled={confirmation !== confirmationText || pending || exporting}
            onClick={erase}
          >
            {pending ? tr("Deleting Kinra data…") : tr("Permanently delete Kinra data")}
          </Button>
          <Button
            variant="glass"
            className="h-12 w-full"
            disabled={pending || exporting}
            onClick={() => setOpen(false)}
          >
            <Message source="Keep my data" />
          </Button>
        </div>
      </Sheet>
    </>
  );
}
