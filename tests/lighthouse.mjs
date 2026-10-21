import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";

const baseUrl = process.env.LIGHTHOUSE_URL ?? "http://127.0.0.1:3000";
const outputDirectory = join(process.cwd(), "lighthouse-reports");
const pages = process.env.LIGHTHOUSE_PAGE ? [process.env.LIGHTHOUSE_PAGE] : ["/", "/nft/042"];
const runs = 3;
const categories = ["performance", "accessibility", "best-practices", "seo"];
const profiles = {
  desktop: { formFactor: "desktop", screenEmulation: { disabled: true } },
  mobile: { formFactor: "mobile", screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 1, disabled: false } },
};
const selectedProfiles = process.env.LIGHTHOUSE_PROFILE ? { [process.env.LIGHTHOUSE_PROFILE]: profiles[process.env.LIGHTHOUSE_PROFILE] } : profiles;
const metricAudits = {
  lcp: "largest-contentful-paint",
  cls: "cumulative-layout-shift",
  tbt: "total-blocking-time",
};
const chromeFlags = ["--headless", "--no-first-run", "--no-default-browser-check"];
const summaries = [];
const medianOf = (values) => [...values].sort((first, second) => first - second)[Math.floor(values.length / 2)];

await mkdir(outputDirectory, { recursive: true });

const chrome = await launch({ chromeFlags });

try {
  for (const [profile, settings] of Object.entries(selectedProfiles)) {
    for (const page of pages) {
      const results = [];
      for (let run = 1; run <= runs; run += 1) {
        const result = await lighthouse(`${baseUrl}${page}`, { port: chrome.port, output: ["json", "html"], onlyCategories: categories, ...settings });
        const stem = `${page === "/" ? "inicio" : "detalhe"}-${profile}-${run}`;
        await writeFile(join(outputDirectory, `${stem}.report.json`), result.report[0]);
        await writeFile(join(outputDirectory, `${stem}.report.html`), result.report[1]);
        results.push({
          ...Object.fromEntries(categories.map((category) => [category, Math.round(result.lhr.categories[category].score * 100)])),
          ...Object.fromEntries(Object.entries(metricAudits).map(([metric, audit]) => [metric, result.lhr.audits[audit].numericValue])),
        });
      }
      const median = {
        ...Object.fromEntries(categories.map((category) => [category, medianOf(results.map((result) => result[category]))])),
        ...Object.fromEntries(Object.keys(metricAudits).map((metric) => [metric, medianOf(results.map((result) => result[metric]))])),
      };
      summaries.push({ profile, page, runs, median });
      console.log(`${profile} ${page}:`, median);
    }
  }
} finally {
  chrome.kill();
}

const summaryName = process.env.LIGHTHOUSE_PROFILE || process.env.LIGHTHOUSE_PAGE ? `summary-${process.env.LIGHTHOUSE_PROFILE ?? "all"}-${(process.env.LIGHTHOUSE_PAGE ?? "all").replaceAll("/", "-").replace(/^-/, "")}.json` : "summary.json";
await writeFile(join(outputDirectory, summaryName), `${JSON.stringify({ baseUrl, generatedAt: new Date().toISOString(), environment: { node: process.version, platform: process.platform, architecture: process.arch, chromeFlags }, summaries }, null, 2)}\n`);
