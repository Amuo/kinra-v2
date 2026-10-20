import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode } from "lucide-react";
import { useApi, useQ } from "@/lib/api";
import type { BusinessPass, BusinessMemberPortal } from "@/lib/business";
import { t, useLanguage } from "@/lib/i18n";
import { errorText } from "@/lib/i18n-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "./sheets";
import { ErrorState, Skeleton } from "./ui";
import { BusinessStatus, businessDate, businessToday, businessTime } from "./business-ui";

export function MemberPass() {
  useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="volt" className="mt-3 min-h-12 w-full" onClick={() => setOpen(true)}>
        <QrCode aria-hidden="true" />
        {t("My membership & QR pass")}
      </Button>
      {open && (
        <Sheet open onOpenChange={setOpen} title={t("My membership & QR pass")}>
          <MemberPassHome />
        </Sheet>
      )}
    </>
  );
}
function MemberPassHome() {
  const api = useApi();
  const memberships = useQ(["business-my-memberships"], (a) => a.business.myMemberships());
  const [code, setCode] = useState("");
  const [review, setReview] = useState("");
  const preview = useQ(
    ["business-claim", review],
    (a) => a.business.inspectClaim(review),
    !!review,
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        {t(
          "Your facility manages its membership and contact records. Linking enables your pass and bookings without sharing your health logs. Deleting your Kinra data unlinks your account; facility-owned records remain with the facility.",
        )}
      </p>
      {memberships.isLoading ? (
        <Skeleton className="h-44" />
      ) : memberships.error ? (
        <ErrorState onRetry={() => memberships.refetch()} />
      ) : (
        memberships.data?.map((portal) => (
          <PassCard
            key={portal.business.id}
            portal={portal}
            refresh={async () => {
              await memberships.refetch();
            }}
          />
        ))
      )}
      <details className="rounded-xl border border-border p-4" open={!memberships.data?.length}>
        <summary className="cursor-pointer py-2 font-semibold">{t("Link a membership")}</summary>
        <p className="my-3 text-sm text-muted-foreground">
          {t("Ask your reception team for your private app invitation code.")}
        </p>
        <label className="text-sm">
          {t("Invitation code")}
          <Input
            value={code}
            autoComplete="off"
            className="mt-2 min-h-12"
            onChange={(e) => {
              setCode(e.target.value);
              setReview("");
            }}
          />
        </label>
        <Button
          className="mt-3 min-h-11"
          variant="secondary"
          disabled={!code.trim() || busy}
          onClick={() => setReview(code.trim())}
        >
          {t("Review invitation")}
        </Button>
        {preview.error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {errorText(preview.error)}
          </p>
        )}
        {preview.data && review && (
          <div className="mt-4 rounded-xl border border-primary/30 p-4">
            <p className="font-semibold">{preview.data.businessName}</p>
            <p className="mt-1 text-sm">{preview.data.memberName}</p>
            <Button
              className="mt-3 min-h-11"
              variant="volt"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  await api.business.redeemClaim(review);
                  setCode("");
                  setReview("");
                  await memberships.refetch();
                } catch (cause) {
                  setError(errorText(cause));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t("Link this membership")}
            </Button>
          </div>
        )}
        {error && (
          <p role="alert" className="mt-3 text-destructive">
            {error}
          </p>
        )}
      </details>
    </div>
  );
}
function PassCard({
  portal,
  refresh,
}: {
  portal: BusinessMemberPortal;
  refresh: () => Promise<void>;
}) {
  const api = useApi();
  const [pass, setPass] = useState<BusinessPass | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!pass) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [pass]);
  const remaining = pass ? Math.max(0, Math.ceil((Date.parse(pass.expiresAt) - now) / 1000)) : 0;
  return (
    <section className="rounded-2xl border border-border bg-surface/40 p-5">
      <h3 className="font-display text-xl font-bold">{portal.business.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {portal.member.name} · {portal.member.number}
      </p>
      <div className="mt-4">
        <BusinessStatus value={portal.member.status} />
      </div>
      {portal.memberships.map((m) => (
        <div key={m.id} className="mt-4 border-t border-border pt-4">
          <div className="flex flex-wrap justify-between gap-2">
            <p className="font-semibold">{m.planName}</p>
            <BusinessStatus
              value={
                m.status === "active" && m.endDate < businessToday(portal.business.timezone)
                  ? "expired"
                  : m.status
              }
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {businessDate(m.startDate)} — {businessDate(m.endDate)}
          </p>
          <p className="mt-2 text-sm">
            {m.visitLimit === null
              ? t("Unlimited visits")
              : `${t("Visits remaining")}: ${Math.max(0, m.visitLimit - m.usedVisits)}`}
          </p>
        </div>
      ))}
      {pass && remaining > 0 ? (
        <div className="mt-5 text-center">
          <div className="mx-auto w-fit max-w-full rounded-2xl bg-white p-4">
            <QRCodeSVG
              value={pass.token}
              size={220}
              marginSize={4}
              level="M"
              title={t("Membership entry QR code")}
              className="h-auto max-w-full"
            />
          </div>
          <p className="mt-3 text-sm font-semibold">
            {t("Pass expires in {seconds}s", { seconds: remaining })}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("Show this code at reception. One entry only.")}
          </p>
        </div>
      ) : pass ? (
        <p role="status" className="mt-5 text-sm text-muted-foreground">
          {t("This pass has expired. Generate a fresh code.")}
        </p>
      ) : null}
      <Button
        variant="volt"
        className="mt-5 min-h-12 w-full"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          setPass(null);
          try {
            const next = await api.business.issuePass(portal.business.id, portal.member.id);
            setNow(Date.now());
            setPass(next);
          } catch (cause) {
            setError(errorText(cause));
          } finally {
            setBusy(false);
          }
        }}
      >
        <QrCode aria-hidden="true" />
        {t(busy ? "Generating…" : "Generate entry pass")}
      </Button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        {t("Reception checks your current membership and location access when scanned.")}
      </p>
      <div className="mt-5 border-t border-border pt-4">
        <h4 className="font-semibold">{t("Upcoming sessions")}</h4>
        {portal.sessions
          .filter((s) => s.status === "scheduled" && Date.parse(s.startsAt) > Date.now())
          .map((s) => {
            const booking = portal.bookings.find(
              (b) => b.sessionId === s.id && b.status === "booked",
            );
            return (
              <div key={s.id} className="mt-4 rounded-xl border border-border p-3">
                <p className="font-medium">{s.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {businessTime(s.startsAt, portal.business.timezone)}
                </p>
                <p className="mt-1 text-xs">
                  {s.booked}/{s.capacity}
                </p>
                <Button
                  variant="secondary"
                  className="mt-3 min-h-11 w-full"
                  disabled={busy || (!booking && s.booked >= s.capacity)}
                  onClick={async () => {
                    setBusy(true);
                    setError("");
                    try {
                      if (booking) await api.business.cancelBooking(portal.business.id, booking.id);
                      else
                        await api.business.bookSession(
                          portal.business.id,
                          s.id,
                          portal.member.id,
                          crypto.randomUUID(),
                        );
                      await refresh();
                    } catch (cause) {
                      setError(errorText(cause));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {t(booking ? "Cancel booking" : "Book session")}
                </Button>
              </div>
            );
          })}
      </div>
    </section>
  );
}
