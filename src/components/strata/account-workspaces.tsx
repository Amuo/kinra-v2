import { useState } from "react";
import { Check, Loader2, Plus } from "lucide-react";
import { useAct, useQ } from "@/lib/api";
import { t, useLanguage, roleLabel } from "@/lib/i18n";
import { errorText } from "@/lib/i18n-errors";
import { accountRoleLabels, type AccountRole } from "@/lib/workspaces";
import { Button } from "@/components/ui/button";
import { ErrorState, Skeleton } from "./ui";
const descriptions: Record<AccountRole, string> = {
  solo: "Plan and track your own training, food and recovery.",
  client: "Follow plans and communicate with a coach you explicitly choose to connect.",
  trainer: "Create programs and support clients who choose to connect with you.",
  specialist:
    "Use coaching tools for client support and a professional profile. This does not provide diagnosis tools or verify credentials.",
  organization:
    "Organize your organization toolkit. Adding this workspace does not grant staff access or access to member records.",
};
export function AccountWorkspaces() {
  useLanguage();
  const workspaces = useQ(["account-workspaces"], (api) => api.accountWorkspaces());
  const [adding, setAdding] = useState<AccountRole | "">("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const change = useAct((api, next: { role: AccountRole; add: boolean }) =>
    api.setWorkspace(next.role, next.add),
  );
  if (workspaces.isLoading) return <Skeleton className="my-5 h-40" />;
  if (workspaces.error)
    return (
      <ErrorState
        message={t("Could not load your workspaces.")}
        onRetry={() => workspaces.refetch()}
      />
    );
  if (!workspaces.data) return null;
  const data = workspaces.data;
  const missing = (Object.keys(accountRoleLabels) as AccountRole[]).filter(
    (role) => !data.roles.includes(role),
  );
  const apply = (role: AccountRole, add: boolean) => {
    setError("");
    setStatus("");
    change.mutate(
      { role, add },
      {
        onSuccess: () => {
          setAdding("");
          setStatus(t(add ? "Workspace added and selected." : "Workspace selected."));
        },
        onError: (cause) => setError(errorText(cause)),
      },
    );
  };
  return (
    <section
      className="my-5 rounded-card border border-border bg-surface p-4"
      aria-label={t("Account workspaces")}
    >
      <h2 className="font-display text-title font-bold">{t("Account workspaces")}</h2>
      <p className="mt-2 text-label text-muted-foreground">
        {t(
          "Choose the tools you want to use. Your account and existing connections stay together.",
        )}
      </p>
      <p className="mt-2 text-caption text-muted-foreground">
        {t("Original account type")}: {roleLabel(data.primary)}
      </p>
      <div className="mt-4 flex flex-col gap-2" role="group" aria-label={t("Active workspace")}>
        {data.roles.map((role) => (
          <Button
            key={role}
            type="button"
            wrap
            variant={data.active === role ? "volt" : "glass"}
            aria-pressed={data.active === role}
            disabled={change.isPending}
            className="min-h-12 w-full justify-start text-left"
            onClick={() => apply(role, false)}
          >
            {data.active === role && <Check className="size-4 shrink-0" aria-hidden="true" />}
            {t(accountRoleLabels[role])}
          </Button>
        ))}
      </div>
      {missing.length > 0 && (
        <details className="mt-4 border-t border-border pt-3">
          <summary className="cursor-pointer py-2 text-label font-semibold">
            {t("Add a workspace")}
          </summary>
          <label className="mt-3 block">
            <span className="mb-2 block text-label">{t("Workspace to add")}</span>
            <select
              className="min-h-12 w-full min-w-0 rounded-tile border border-border bg-background px-3 text-label"
              disabled={change.isPending}
              value={adding}
              onChange={(event) => {
                setAdding(event.target.value as AccountRole | "");
                setError("");
              }}
            >
              <option value="">{t("Choose a workspace")}</option>
              {missing.map((role) => (
                <option key={role} value={role}>
                  {t(accountRoleLabels[role])}
                </option>
              ))}
            </select>
          </label>
          {adding && (
            <div className="mt-3 rounded-tile border border-primary/25 bg-primary/5 p-4">
              <h3 className="text-label font-semibold">{t(accountRoleLabels[adding])}</h3>
              <p className="mt-2 text-label text-muted-foreground">{t(descriptions[adding])}</p>
              <p className="mt-3 text-caption text-muted-foreground">
                {t(
                  "Adding a workspace does not connect anyone or share your records. Connections and organization permissions are managed separately.",
                )}
              </p>
              <Button
                type="button"
                wrap
                variant="volt"
                className="mt-4 min-h-12 w-full"
                disabled={change.isPending}
                onClick={() => apply(adding, true)}
              >
                {change.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Plus className="size-4" aria-hidden="true" />
                )}
                {t("Add and switch workspace")}
              </Button>
            </div>
          )}
        </details>
      )}
      {error && (
        <p role="alert" className="mt-3 text-label text-destructive">
          {error}
        </p>
      )}
      {status && (
        <p role="status" className="mt-3 text-label text-muted-foreground">
          {status}
        </p>
      )}
    </section>
  );
}
