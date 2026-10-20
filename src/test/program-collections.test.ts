import { expect, it } from "vitest";
import { createDemoFeatures } from "@/lib/feature-api";
import { parseFeature, type FeatureRecord } from "@/lib/feature-types";
import { videoStarters, localizedVideoPlan } from "@/lib/video-starters";

it("activates reviewed supplement programs once and keeps assigned plans private in the demo API", async () => {
  const coach = crypto.randomUUID(),
    client = crypto.randomUUID(),
    other = crypto.randomUUID();
  let connected = true;
  const connection = (a: string, b: string) => connected && a === coach && b === client;
  const a = createDemoFeatures(coach, () => {}, connection),
    b = createDemoFeatures(client, () => {}, connection),
    c = createDemoFeatures(other, () => {}, connection);
  const id = await a.save(
    "supplement_plan",
    {
      title: "Existing regimen",
      weeks: 1,
      context: "general",
      supplements: [
        {
          id: crypto.randomUUID(),
          name: "My existing product",
          dose: 1,
          unit: "tabs",
          times: ["08:00"],
          frequency: "daily",
        },
      ],
    },
    { clientId: client },
  );
  expect(await c.list("supplement_plan")).toEqual([]);
  const revision = (await b.list("supplement_plan"))[0]!.updated_at;
  await expect(b.activateSupplementPlan(id, "2026-10-20", "stale")).rejects.toThrow(/changed/);
  const first = await b.activateSupplementPlan(id, "2026-10-20", revision),
    retry = await b.activateSupplementPlan(id, "2026-10-20", revision);
  expect(first.ids).toHaveLength(1);
  expect(retry).toEqual({ ...first, alreadyActivated: true });
  const saved = await b.list("supplement");
  expect(saved).toHaveLength(1);
  expect(saved[0]!.payload).toMatchObject({
    dose: 1,
    start_date: "2026-10-20",
    end_date: "2026-10-26",
  });
  connected = false;
  await expect(b.activateSupplementPlan(id, "2026-10-20", revision)).rejects.toThrow();
  await a.eraseData("DELETE KINRA DATA");
  await b.eraseData("DELETE KINRA DATA");
});
it("records manual video events idempotently with source title snapshots", async () => {
  const owner = crypto.randomUUID(),
    api = createDemoFeatures(
      owner,
      () => {},
      () => false,
    );
  const payload = videoStarters("en")[0]!.payload,
    id = await api.save("video_plan", payload);
  const event = {
    plan_id: id,
    video_id: payload.videos[0]!.id,
    date: "2026-10-20",
    status: "completed" as const,
    title_snapshot: "forged",
  };
  const first = await api.save("video_event", event);
  expect(await api.save("video_event", event)).toBe(first);
  expect((await api.list("video_event"))[0]!.payload.title_snapshot).toBe(payload.videos[0]!.title);
  await api.remove(id);
  await api.save("video_event", { ...event, status: "skipped" });
  expect((await api.list("video_event"))[0]!.payload.title_snapshot).toBe(payload.videos[0]!.title);
  await api.eraseData("DELETE KINRA DATA");
});
it("localizes starter metadata in three languages while retaining custom text and external English media attribution", () => {
  for (const language of ["en", "bs", "de"] as const) {
    for (const starter of videoStarters(language)) {
      expect(parseFeature("video_plan", starter.payload)).toEqual(starter.payload);
      expect(starter.mediaLanguage).toBe("English");
      const record = { payload: starter.payload } as FeatureRecord<"video_plan">;
      for (const target of ["en", "bs", "de"] as const) {
        const expected = videoStarters(target).find((s) => s.id === starter.id)!;
        expect(localizedVideoPlan(record, target).payload).toEqual(expected.payload);
      }
      record.payload = {
        ...record.payload,
        title: "My custom title",
        videos: record.payload.videos.map((v) => ({
          ...v,
          notes: "Custom note",
          duration_seconds: 123,
        })),
      };
      const result = localizedVideoPlan(record, "de").payload;
      expect(result.title).toBe("My custom title");
      expect(result.videos[0]).toMatchObject({ notes: "Custom note", duration_seconds: 123 });
    }
  }
});
