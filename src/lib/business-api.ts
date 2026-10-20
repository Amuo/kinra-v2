import { featureRpc } from "./backend";
import { businessSchemas, type BusinessApi } from "./business";
type Rpc = (
  name: string,
  args: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string; code?: string } | null }>;
export function createLiveBusiness(ownerId: string): BusinessApi {
  const call = async <T>(
    action: string,
    bid: string | null = null,
    data: object = {},
  ): Promise<T> => {
    const result = await (featureRpc as unknown as Rpc)("kinra_business", {
      action,
      bid,
      data,
      expected_owner: ownerId,
    });
    if (result.error)
      throw Error(
        ["42P01", "PGRST202"].includes(result.error.code ?? "")
          ? "Kinra Business needs its database migration. Your input has been preserved."
          : result.error.message,
      );
    return result.data as T;
  };
  return {
    list: () => call("list"),
    setup: (input) => {
      const { organizationId, ...data } = businessSchemas.setup.parse(input);
      return call("setup", organizationId ?? null, data);
    },
    snapshot: (bid) => call("snapshot", bid),
    saveLocation: (bid, input) => call("saveLocation", bid, businessSchemas.location.parse(input)),
    saveResource: (bid, input) => call("saveResource", bid, businessSchemas.resource.parse(input)),
    savePlan: (bid, input) => call("savePlan", bid, businessSchemas.plan.parse(input)),
    saveMember: (bid, input) => call("saveMember", bid, businessSchemas.member.parse(input)),
    saveMembership: (bid, input) =>
      call("saveMembership", bid, businessSchemas.membership.parse(input)),
    createClaim: (bid, memberId) => call("createClaim", bid, { memberId }),
    inspectClaim: (code) => call("inspectClaim", null, { code }),
    redeemClaim: async (code) => {
      await call("redeemClaim", null, { code });
    },
    myMemberships: () => call("myMemberships"),
    issuePass: (bid, memberId) => call("issuePass", bid, { memberId }),
    checkIn: ({ businessId, ...data }) => call("checkIn", businessId, data),
    checkOut: async (bid, visitId) => {
      await call("checkOut", bid, { visitId });
    },
    saveSession: (bid, input) => call("saveSession", bid, businessSchemas.session.parse(input)),
    bookSession: (bid, sessionId, memberId, requestId) =>
      call("bookSession", bid, { sessionId, memberId, requestId }),
    cancelBooking: async (bid, bookingId) => {
      await call("cancelBooking", bid, { bookingId });
    },
    saveInvoice: (bid, input) => call("saveInvoice", bid, businessSchemas.invoice.parse(input)),
    voidInvoice: async (bid, invoiceId) => {
      await call("voidInvoice", bid, { invoiceId });
    },
    recordPayment: (bid, input) => call("recordPayment", bid, businessSchemas.payment.parse(input)),
    exportData: (bid) => call("export", bid),
  };
}
