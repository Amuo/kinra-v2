import { chromium } from "file:///C:/Users/Dokta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.addInitScript(() => sessionStorage.setItem("strata-demo", "client"));
await page.goto("http://127.0.0.1:5187/app/progress");
await page.getByRole("button", { name: "Goals", exact: true }).click();
await page.getByRole("button", { name: "Add", exact: true }).click();
await page.getByLabel("Title", { exact: true }).fill("QA consistent movement");
await page.getByLabel("Metric", { exact: true }).selectOption("sessions");
await page.getByLabel("Baseline", { exact: true }).fill("0");
await page.getByLabel("Target", { exact: true }).fill("3");
await page.getByLabel("Unit", { exact: true }).fill("sessions per week");
await page.getByRole("button", { name: "Save privately", exact: true }).click();
await page.getByRole("heading", { name: "QA consistent movement" }).waitFor();
await page.screenshot({ path: "docs/FRONTEND-goal-mobile.png" });
console.log(
  "goal saved; overflow",
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
);
await page.goto("http://127.0.0.1:5187/app/fuel");
await page.getByRole("button", { name: "Meal plans", exact: true }).click();
await page.getByRole("button", { name: "Add", exact: true }).click();
await page.getByLabel("Title", { exact: true }).fill("QA breakfast");
await page.getByRole("button", { name: "Add meals", exact: true }).click();
await page.getByLabel("Name", { exact: true }).fill("Breakfast");
await page.getByRole("button", { name: "Add foods", exact: true }).click();
await page.getByLabel("Name", { exact: true }).nth(1).fill("Oats");
await page.getByLabel("Calories", { exact: true }).fill("200");
await page.getByLabel("Protein", { exact: true }).fill("8");
await page.getByLabel("Carbs", { exact: true }).fill("30");
await page.getByLabel("Fat", { exact: true }).fill("5");
await page.getByRole("button", { name: "Save privately", exact: true }).click();
await page.getByRole("button", { name: "Log consumed · Breakfast", exact: true }).click();
await page.getByRole("button", { name: "Logged · Breakfast", exact: true }).waitFor();
console.log("plan saved and consumed");
await page.setViewportSize({ width: 1440, height: 1000 });
await page.screenshot({ path: "docs/FRONTEND-plan-desktop.png" });
console.log(
  "desktop overflow",
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
);
console.log("errors", errors);
await browser.close();
