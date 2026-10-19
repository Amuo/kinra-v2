import { chromium } from "file:///C:/Users/Dokta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.addInitScript(() => sessionStorage.setItem("strata-demo", "client"));
await page.goto("http://127.0.0.1:5187/app/fuel");
await page.getByRole("button", { name: "Supplements", exact: true }).click();
await page.getByRole("button", { name: "Add", exact: true }).click();
await page.getByLabel("Name", { exact: true }).fill("QA schedule");
await page.getByLabel("Dose", { exact: true }).fill("5");
await page.getByLabel("Unit", { exact: true }).selectOption("g");
await page.getByRole("button", { name: "Add times", exact: true }).click();
await page.getByLabel("Value", { exact: true }).fill("08:00");
await page.getByRole("button", { name: "Save privately", exact: true }).click();
const doseButton = page.getByRole("button", { name: "Record 08:00 dose taken", exact: true });
await doseButton.click();
await page.waitForFunction(() =>
  [...document.querySelectorAll("button")].some(
    (b) => b.textContent === "Record 08:00 dose taken" && b.disabled,
  ),
);
await page.screenshot({ path: "docs/FRONTEND-dose-mobile.png" });
console.log("scheduled dose recorded and slot disabled");
await page.goto("http://127.0.0.1:5187/app/me");
await page.getByRole("button", { name: "Explore your Kinra toolkit" }).click();
await page.getByRole("button", { name: "App preferences", exact: true }).click();
await page.getByRole("button", { name: "Add", exact: true }).click();
await page.getByLabel("Language", { exact: true }).selectOption("bs");
await page.getByLabel("Theme", { exact: true }).selectOption("light");
await page.getByRole("checkbox", { name: "Cycle", exact: true }).uncheck();
await page.getByRole("button", { name: "Save privately", exact: true }).click();
await page.waitForFunction(() => document.documentElement.classList.contains("kinra-light"));
await page.getByRole("button", { name: "All tools", exact: true }).click();
await page.getByText("Vaši Kinra alati", { exact: true }).waitFor();
console.log(
  "light theme applied; Bosnian toolkit visible; cycle hidden",
  (await page.getByRole("button", { name: "Dnevnik ciklusa", exact: true }).count()) === 0,
);
await page.screenshot({ path: "docs/FRONTEND-preferences-mobile.png" });
console.log("errors", errors);
await browser.close();
