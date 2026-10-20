import fs from "node:fs";
import crypto from "node:crypto";
const root = new URL("../", import.meta.url);
fs.mkdirSync(new URL("audit/", root), { recursive: true });
const metadata = JSON.parse(
  fs.readFileSync(new URL("src/data/exercise-guidance.json", root), "utf8"),
);
const urls = [
  ...new Set(
    Object.values(metadata).flatMap((m) => m.media?.imageSourceUrls ?? m.media?.images ?? []),
  ),
].filter((url) => url.startsWith("https://raw.githubusercontent.com/"));
const manifest = [];
const failures = [];
let cursor = 0;
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (cursor < urls.length) {
      const sourceUrl = urls[cursor++];
      const relative = sourceUrl.split("/exercises/")[1];
      const path = new URL("public/exercise-media/" + relative, root);
      try {
        fs.mkdirSync(new URL("./", path), { recursive: true });
        if (!fs.existsSync(path)) {
          const response = await fetch(sourceUrl);
          if (!response.ok) throw new Error(String(response.status));
          const bytes = Buffer.from(await response.arrayBuffer());
          if (bytes[0] !== 255 || bytes[1] !== 216) throw new Error("Not a JPEG");
          fs.writeFileSync(path, bytes);
        }
        const bytes = fs.readFileSync(path);
        manifest.push({
          sourceUrl,
          path: "/exercise-media/" + relative,
          bytes: bytes.length,
          sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
        });
      } catch (error) {
        failures.push({ sourceUrl, error: String(error) });
      }
    }
  }),
);
manifest.sort((a, b) => a.path.localeCompare(b.path));
fs.writeFileSync(
  new URL("audit/exercise-media-manifest.json", root),
  JSON.stringify(
    { retrieved: "2026-10-19", license: "Unlicense", assets: manifest, failures },
    null,
    2,
  ) + "\n",
);
fs.writeFileSync(
  new URL("public/exercise-media/manifest.json", root),
  JSON.stringify(
    { retrieved: "2026-10-19", license: "Unlicense", assets: manifest, failures },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify(
    {
      downloaded: manifest.length,
      bytes: manifest.reduce((sum, item) => sum + item.bytes, 0),
      failures,
    },
    null,
    2,
  ),
);
if (failures.length) process.exitCode = 1;
