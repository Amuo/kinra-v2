import { describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getUser: vi.fn() } } }));
import { createDemoFeatures } from "../lib/feature-api";
import { createDemoOrganizations } from "../lib/organization-api";
import { createDemoBusiness, clearDemoBusiness } from "../lib/business-demo";
const make = (actor: string) => {
  const features = createDemoFeatures(
    actor,
    () => {},
    () => false,
  );
  const organizations = createDemoOrganizations(actor, features);
  return { features, organizations, business: createDemoBusiness(actor, features, organizations) };
};
describe("business demo and export parity", () => {
  it("seeds once under concurrent loads, provides usable visits/bookings/ledger, and never leaks secret codes in export", async () => {
    const actor = crypto.randomUUID(),
      { business, features } = make(actor);
    const lists = await Promise.all([business.list(), business.list(), business.list()]);
    expect(lists.every((l) => l.length === 1 && l[0]!.id === lists[0]![0]!.id)).toBe(true);
    const id = lists[0]![0]!.id,
      s = await business.snapshot(id);
    expect(s.locations).toHaveLength(4);
    expect(s.members).toHaveLength(3);
    const portal = await business.myMemberships(),
      person = portal[0]!.member.id;
    const pass = await business.issuePass(id, person);
    const input = {
      businessId: id,
      locationId: s.locations[0]!.id,
      token: pass.token,
      requestId: crypto.randomUUID(),
    };
    const entry = await business.checkIn(input);
    expect(entry.decision).toBe("allowed");
    expect((await business.checkIn(input)).alreadyRecorded).toBe(true);
    expect((await business.checkIn({ ...input, requestId: crypto.randomUUID() })).reason).toBe(
      "pass_used",
    );
    await business.checkOut(id, entry.visit!.id);
    const session = s.sessions.find((x) => x.locationId === s.locations[0]!.id)!;
    const booking = await business.bookSession(id, session.id, person, crypto.randomUUID());
    expect((await business.myMemberships())[0]!.bookings.some((b) => b.id === booking)).toBe(true);
    await business.cancelBooking(id, booking);
    const invoice = s.invoices[0]!;
    const payment = {
      id: crypto.randomUUID(),
      invoiceId: invoice.id,
      amountMinor: 1000,
      kind: "payment" as const,
      method: "cash" as const,
      reference: "Synthetic",
    };
    await business.recordPayment(id, payment);
    await business.recordPayment(id, payment);
    expect((await business.snapshot(id)).payments.filter((p) => p.id === payment.id)).toHaveLength(
      1,
    );
    const exported = JSON.stringify(await features.exportData());
    expect(exported).toContain("business");
    expect(exported).not.toContain(pass.token);
    clearDemoBusiness(actor);
  });
  it("keeps another demo business intact when an actor erases their own data", async () => {
    const a = make(crypto.randomUUID()),
      b = make(crypto.randomUUID());
    const aid = (await a.business.list())[0]!.id,
      bid = (await b.business.list())[0]!.id;
    await a.features.eraseData("DELETE KINRA DATA");
    expect((await b.business.snapshot(bid)).business.id).toBe(bid);
    expect(JSON.stringify(await a.features.exportData())).not.toContain(aid);
  });
});
