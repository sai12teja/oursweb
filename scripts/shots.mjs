// Visual QA: full-page screenshots of every route at several widths, with
// console-error capture. Dev-only (Playwright). Run against a running server:
//   node_modules/.bin/vite preview --port 4173   # or: npm run dev
//   BASE=http://localhost:4173 WIDTHS=375,768,1440 node scripts/shots.mjs
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.BASE || "http://localhost:4173";
const OUT = process.env.OUT || "shots";
const WIDTHS = (process.env.WIDTHS || "375,768,1440")
  .split(",")
  .map((n) => parseInt(n.trim(), 10));
mkdirSync(OUT, { recursive: true });

const routes = [
  ["home", "/"],
  ["about", "/about"],
  ["service", "/service"],
  ["team", "/team"],
  ["pricing", "/pricing"],
  ["faq", "/faq"],
  ["contact", "/contact"],
  ["404", "/404"],
];

// Scroll the whole page in steps so scroll-driven / IO reveals fire, then
// return to the top so the full-page capture starts clean.
async function triggerReveals(page) {
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    const max = document.body.scrollHeight;
    for (let y = 0; y <= max; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  });
}

const browser = await chromium.launch();
const report = [];

for (const [name, path] of routes) {
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: w < 500 ? 780 : 900 },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
    const entry = { name, w, errors };
    try {
      await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 25000 });
      await page.waitForTimeout(700);
      await triggerReveals(page);
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${OUT}/${name}-${w}.png`, fullPage: true });
      Object.assign(
        entry,
        await page.evaluate(() => {
          const de = document.documentElement;
          return {
            title: document.title,
            h1: document.querySelectorAll("h1").length,
            overflowX: de.scrollWidth > de.clientWidth + 1,
            scrollW: de.scrollWidth,
            clientW: de.clientWidth,
            hiddenReveals: [...document.querySelectorAll(".wow, [class*='tf-animate'], .sq-reveal")]
              .filter((el) => {
                const cs = getComputedStyle(el);
                return (parseFloat(cs.opacity) || 0) < 0.05 && el.offsetParent !== null;
              }).length,
          };
        })
      );
    } catch (e) {
      entry.errors.push("NAV FAIL: " + e.message);
    }
    report.push(entry);
    await ctx.close();
    process.stdout.write(`shot ${name}@${w}${entry.overflowX ? " ⚠overflowX" : ""}${entry.errors.length ? " ⚠err" : ""}\n`);
  }
}

await browser.close();
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
// Compact console summary
for (const r of report) {
  if (r.overflowX || (r.errors && r.errors.length) || r.hiddenReveals) {
    console.log(
      `${r.name}@${r.w}: overflowX=${r.overflowX} hiddenReveals=${r.hiddenReveals} errors=${(r.errors || []).length}`
    );
    (r.errors || []).forEach((e) => console.log("   • " + e));
  }
}
console.log("\nReport: " + OUT + "/report.json");
