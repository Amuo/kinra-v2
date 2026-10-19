import { chromium } from "file:///C:/Users/Dokta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.addInitScript(() => sessionStorage.setItem("strata-demo", "client"));
await page.goto("http://127.0.0.1:5187/app/me");
await page.getByRole("button", { name: "Explore your Kinra toolkit" }).click();
await page.getByRole("button", { name: /Exercise library/ }).click();
await page.getByRole("textbox", { name: "Search exercises" }).fill("squat");
await page.waitForTimeout(500);
console.log((await page.locator("body").innerText()).slice(-5000));
await page.screenshot({ path: "docs/FRONTEND-mobile.png", fullPage: true });
console.log(
  "overflow",
  await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
);
console.log("errors", errors);
await browser.close();
