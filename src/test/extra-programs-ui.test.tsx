import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ExtraPrograms } from "@/components/strata/extra-programs";
import { setLanguage } from "@/lib/i18n";
const state = vi.hoisted(() => ({
  plans: [] as unknown[],
  save: vi.fn(),
  activate: vi.fn(),
  reload: vi.fn(),
}));
vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  useApi: () => ({ ownerId: "owner", mode: "demo" }),
  useMe: () => ({ data: { id: "owner", role: "trainer" } }),
  useQ: (key: string[]) => ({
    data:
      key[0] === "plan-clients"
        ? [{ id: "11111111-1111-4111-8111-111111111111", display_name: "Connected client" }]
        : key[1] === "video_event"
          ? []
          : state.plans,
    isPending: false,
    error: null,
    refetch: state.reload,
  }),
  useAct: (fn: (api: unknown, value: unknown) => Promise<unknown>) => ({
    isPending: false,
    mutateAsync: (value: unknown) =>
      fn({ features: { save: state.save, activateSupplementPlan: state.activate } }, value),
  }),
}));
afterEach(() => {
  cleanup();
  state.plans = [];
  vi.clearAllMocks();
  setLanguage("en", false);
});
it("preserves a failed video draft and retries the same private assigned record", async () => {
  state.save.mockRejectedValueOnce(new Error("Temporary failure")).mockResolvedValueOnce("saved");
  render(<ExtraPrograms kind="video_plan" />);
  fireEvent.click(screen.getByRole("button", { name: "New video plan" }));
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "My mobility videos" } });
  fireEvent.change(screen.getByLabelText("Assign to client"), {
    target: { value: "11111111-1111-4111-8111-111111111111" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add video" }));
  fireEvent.change(screen.getAllByLabelText("Title")[1]!, { target: { value: "Reviewed clip" } });
  fireEvent.change(screen.getByLabelText("Video link · HTTPS"), {
    target: { value: "https://example.org/video" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save private plan" }));
  await waitFor(() => expect(state.save).toHaveBeenCalledTimes(1));
  expect(screen.getAllByLabelText("Title")[1]).toHaveValue("Reviewed clip");
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: "Save private plan" }));
  await waitFor(() => expect(state.save).toHaveBeenCalledTimes(2));
  const [kind, payload, options] = state.save.mock.calls[0]!;
  expect(kind).toBe("video_plan");
  expect(payload.videos[0]).toMatchObject({
    title: "Reviewed clip",
    url: "https://example.org/video",
  });
  expect(options).toMatchObject({
    visibility: "private",
    clientId: "11111111-1111-4111-8111-111111111111",
  });
  expect(state.save.mock.calls[1]![2].id).toBe(options.id);
});
it("opens supplement review without activating and activates only the reviewed date", async () => {
  state.plans = [
    {
      id: "plan",
      updated_at: "2026-10-20T10:00:00Z",
      owner_id: "owner",
      kind: "supplement_plan",
      payload: {
        title: "Reviewed plan",
        weeks: 2,
        context: "general",
        supplements: [
          {
            id: "item",
            name: "Personal supplement",
            dose: 1,
            unit: "tabs",
            times: ["08:00"],
            frequency: "daily",
          },
        ],
      },
    },
  ];
  state.activate.mockResolvedValue({ ids: ["schedule"], alreadyActivated: false });
  render(<ExtraPrograms kind="supplement_plan" />);
  fireEvent.click(screen.getByRole("button", { name: "Review plan" }));
  expect(state.activate).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-10-22" } });
  fireEvent.click(screen.getByRole("button", { name: "Activate reviewed schedules" }));
  await waitFor(() =>
    expect(state.activate).toHaveBeenCalledWith("plan", "2026-10-22", "2026-10-20T10:00:00Z"),
  );
  expect(state.save).not.toHaveBeenCalled();
});

it("does not allow a coach to activate a plan assigned to another person", () => {
  state.plans = [
    {
      id: "plan",
      updated_at: "2026-10-20T10:00:00Z",
      owner_id: "owner",
      client_id: "client",
      kind: "supplement_plan",
      payload: {
        title: "Client plan",
        weeks: 2,
        context: "general",
        supplements: [
          {
            id: "item",
            name: "Personal supplement",
            dose: 1,
            unit: "tabs",
            times: ["08:00"],
            frequency: "daily",
          },
        ],
      },
    },
  ];
  render(<ExtraPrograms kind="supplement_plan" />);
  fireEvent.click(screen.getByRole("button", { name: "Review plan" }));
  expect(screen.getByRole("button", { name: "Activate reviewed schedules" })).toBeDisabled();
  expect(state.activate).not.toHaveBeenCalled();
});

it("requires explicit reload and renewed activation after a plan revision change, preserving the date", async () => {
  const plan = {
    id: "plan",
    owner_id: "owner",
    updated_at: "2026-10-20T10:00:00Z",
    kind: "supplement_plan",
    payload: {
      title: "Reviewed plan",
      weeks: 2,
      context: "general",
      supplements: [
        {
          id: "item",
          name: "Original item",
          dose: 1,
          unit: "tabs",
          times: ["08:00"],
          frequency: "daily",
        },
      ],
    },
  };
  state.plans = [plan];
  state.activate
    .mockRejectedValueOnce(new Error("This plan changed. Reload and review it before activating."))
    .mockResolvedValueOnce({ ids: ["schedule"], alreadyActivated: false });
  state.reload.mockResolvedValue({
    data: [
      {
        ...plan,
        updated_at: "2026-10-20T11:00:00Z",
        payload: {
          ...plan.payload,
          supplements: [{ ...plan.payload.supplements[0], name: "Changed item", dose: 2 }],
        },
      },
    ],
    error: null,
  });
  render(<ExtraPrograms kind="supplement_plan" />);
  fireEvent.click(screen.getByRole("button", { name: "Review plan" }));
  fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-10-23" } });
  fireEvent.click(screen.getByRole("button", { name: "Activate reviewed schedules" }));
  await screen.findByText("This plan changed. Reload and review it before activating.");
  expect(state.activate).toHaveBeenCalledWith("plan", "2026-10-23", plan.updated_at);
  fireEvent.click(screen.getByRole("button", { name: "Reload and review plan" }));
  await screen.findByText("Changed item");
  expect(screen.getByLabelText("Start date")).toHaveValue("2026-10-23");
  expect(state.activate).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Activate reviewed schedules" }));
  await waitFor(() =>
    expect(state.activate).toHaveBeenLastCalledWith("plan", "2026-10-23", "2026-10-20T11:00:00Z"),
  );
});
