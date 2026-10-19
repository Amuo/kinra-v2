import { chromium } from "file:///C:/Users/Dokta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.addInitScript(() => sessionStorage.setItem("strata-demo", "client"));
await page.goto("http://127.0.0.1:5187/app/me");
await page.getByRole("button", { name: "Private messages", exact: true }).click();
await page
  .getByLabel("Your message", { exact: true })
  .fill("Synthetic QA message: checking tomorrow's training plan.");
await page.getByRole("button", { name: "Close", exact: true }).click();
await page.getByRole("button", { name: "Private messages", exact: true }).click();
if (!(await page.getByLabel("Your message", { exact: true }).inputValue()).includes("Synthetic QA"))
  throw new Error("Draft lost on close");
await page.getByRole("button", { name: "Send privately", exact: true }).click();

await page
  .getByRole("log")
  .getByText("Synthetic QA message: checking tomorrow's training plan.", { exact: true })
  .waitFor();
if ((await page.getByLabel("Your message", { exact: true }).inputValue()) !== "")
  throw new Error("Sent draft not cleared");
await page.screenshot({ path: "docs/FRONTEND-messages-mobile.png" });
console.log(
  "Message sent in demo, named conversation shown, draft retained on close then cleared on success",
);
await page.getByRole("button", { name: "Close", exact: true }).click();
await page.getByRole("button", { name: "Delete Kinra profile and data", exact: true }).click();
const deletion = page.getByRole("button", { name: "Permanently delete Kinra data", exact: true });
if (!(await deletion.isDisabled())) throw new Error("Delete enabled without phrase");
await page
  .getByLabel("Type DELETE KINRA DATA to confirm", { exact: true })
  .fill("delete kinra data");
if (!(await deletion.isDisabled())) throw new Error("Delete enabled for incorrect phrase");
await page
  .getByLabel("Type DELETE KINRA DATA to confirm", { exact: true })
  .fill("DELETE KINRA DATA");
const download = page.waitForEvent("download");
await page.getByRole("button", { name: "Export my data first", exact: true }).click();
await download;
await page.screenshot({ path: "docs/FRONTEND-delete-review-mobile.png" });
await deletion.click();
await page.waitForURL("http://127.0.0.1:5187/");
if (await page.evaluate(() => sessionStorage.getItem("strata-demo")))
  throw new Error("Demo session flag remains");
console.log(
  "Demo-only erasure exported first, required exact phrase, completed and returned to landing page",
);
console.log("Runtime errors", errors);
if (errors.length) throw new Error("Browser runtime errors");
await browser.close();
