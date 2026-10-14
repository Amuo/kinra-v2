import { existsSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const metadata = new URL("../.output/nitro.json", import.meta.url);
if (!existsSync(metadata)) throw new Error("Build Kinra first with bun run build.");
if (JSON.parse(readFileSync(metadata, "utf8")).preset !== "cloudflare-module")
  throw new Error(
    "This preview expects the Cloudflare build. Use your deployment target's preview for another preset.",
  );
const args = process.argv.slice(2).map((arg) => (arg === "--host" ? "--ip" : arg));
const envFiles = [".env", ".env.local", ".dev.vars"]
  .filter((path) => existsSync(new URL(`../${path}`, import.meta.url)))
  .flatMap((path) => ["--env-file", path]);
const child = spawn(
  process.execPath,
  [
    fileURLToPath(new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url)),
    "dev",
    "--config",
    ".output/server/wrangler.json",
    "--local",
    "--ip",
    "127.0.0.1",
    "--show-interactive-dev-session",
    "false",
    ...envFiles,
    ...args,
  ],
  { cwd: root, stdio: "inherit", env: { ...process.env, WRANGLER_SEND_METRICS: "false" } },
);
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
