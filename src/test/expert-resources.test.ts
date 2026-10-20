// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getUser: vi.fn() } } }));
import { createDemoFeatures } from "../lib/feature-api";
import { createDemoResources } from "../lib/resource-api";
import { inspectResource } from "../lib/resources";
import { parseFeature } from "../lib/feature-types";
const author = "00000000-0000-4000-8000-000000000501";
const reader = "00000000-0000-4000-8000-000000000502";
describe("expert resource file and demo boundaries", () => {
  it("accepts PDF signatures with safe filenames and rejects mislabeled, active or oversized files", async () => {
    await expect(
      inspectResource(
        new File(["%PDF-1.7\nSynthetic"], "../Example.pdf", { type: "application/pdf" }),
      ),
    ).resolves.toEqual({ filename: "..Example.pdf", mime: "application/pdf" });
    await expect(
      inspectResource(new File(["<html>active</html>"], "fake.pdf", { type: "application/pdf" })),
    ).rejects.toThrow("contents");
    await expect(
      inspectResource(new File(["%PDF-1.7"], "fake.doc", { type: "application/msword" })),
    ).rejects.toThrow("contents");
    await expect(
      inspectResource(
        new File([new Uint8Array(10485761)], "large.pdf", { type: "application/pdf" }),
      ),
    ).rejects.toThrow("10 MB");
    await expect(
      inspectResource(new File([], "empty.pdf", { type: "application/pdf" })),
    ).rejects.toThrow();
  });
  it("supports a private draft, reviewed publication, idempotent save, actual Blob download and parent unpublishing", async () => {
    const authorFeatures = createDemoFeatures(
      author,
      () => {},
      () => false,
    );
    const readerFeatures = createDemoFeatures(
      reader,
      () => {},
      () => false,
    );
    const a = createDemoResources(author, authorFeatures);
    const b = createDemoResources(reader, readerFeatures);
    const expertPayload = {
      name: "Demo author",
      headline: "Self-reported",
      city: "Sarajevo",
      languages: [],
      specialties: [],
    };
    const expert = await authorFeatures.save("expert", expertPayload, { visibility: "public" });
    const source = new File(["%PDF-1.7\nOriginal uploaded content"], "Example.pdf", {
      type: "application/pdf",
    });
    const upload = await a.upload(expert, source);
    expect(await b.list(expert)).toEqual([]);
    const id = await a.save(upload, "My PDF", "Synthetic resource", "private");
    expect(await b.list(expert)).toEqual([]);
    await a.save(upload, "My PDF", "Reviewed publication", "public");
    expect(await a.list(expert)).toHaveLength(1);
    const published = (await b.list(expert))[0]!;
    expect(published.id).toBe(id);
    expect(await (await b.download(published)).text()).toBe(await source.text());
    await expect(a.discard(upload)).rejects.toThrow("saved resource");
    await expect(b.remove(published)).rejects.toThrow("owner");
    await authorFeatures.save("expert", expertPayload, { id: expert, visibility: "private" });
    expect(await b.list(expert)).toEqual([]);
    await expect(b.download(published)).rejects.toThrow("unavailable");
    await authorFeatures.save("expert", expertPayload, { id: expert, visibility: "public" });
    expect(await b.list(expert)).toHaveLength(1);
    await a.remove(published);
    await a.remove(published);
    expect(await b.list(expert)).toEqual([]);
    await expect(b.download(published)).rejects.toThrow();
    const abandoned = await a.upload(expert, source);
    await a.discard(abandoned);
    await expect(a.save(abandoned, "Missing", "No file", "private")).rejects.toThrow("Upload");
    await expect(b.upload(expert, source)).rejects.toThrow("own expert");
    await expect(
      authorFeatures.save(
        "expert_resource",
        {
          expert_id: expert,
          title: "Fake metadata",
          storage_path: `${author}/00000000-0000-4000-8000-000000000599.pdf`,
          filename: "Missing.pdf",
          mime: "application/pdf",
          bytes: 20,
        },
        { visibility: "public" },
      ),
    ).rejects.toThrow("uploaded");
  });
  it("retains strict schemas for optional profile claims, facilities and resource metadata", () => {
    expect(() =>
      parseFeature("expert", {
        name: "Example",
        headline: "Example",
        city: "X",
        languages: [],
        specialties: [],
        clients_count: -1,
      }),
    ).toThrow();
    expect(() =>
      parseFeature("expert", {
        name: "Example",
        headline: "Example",
        city: "X",
        languages: [],
        specialties: [],
        verified_by_clinician: true,
      }),
    ).toThrow();
    for (const url of [
      "javascript:alert(1)",
      "data:text/html,unsafe",
      "https://user:secret@example.test/file",
      "https://example.test/\nlink",
    ])
      expect(() =>
        parseFeature("facility", {
          name: "Example",
          type: "studio",
          city: "X",
          equipment: [],
          amenities: [],
          map_url: url,
        }),
      ).toThrow();
    expect(() =>
      parseFeature("expert_resource", {
        expert_id: author,
        title: "PDF",
        storage_path: `${author}/${reader}.pdf`,
        filename: "bad\nname.pdf",
        mime: "application/pdf",
        bytes: 5,
      }),
    ).toThrow();
  });
});
