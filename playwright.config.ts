import { defineConfig } from "@playwright/test";

const port = Number(process.env.ALMANAC_UI_PORT ?? 4195);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("ALMANAC_UI_PORT must be an integer from 1024 to 65535");
const suffix = port === 4195 ? "" : `-${port}`;
const preview = `output/ui-preview${suffix}`;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/ui",
  timeout: 90_000,
  workers: 1,
  reporter: "list",
  outputDir: `output/ui-lint${suffix}`,
  use: { baseURL, screenshot: "only-on-failure", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    { name: "tablet", use: { viewport: { width: 768, height: 1024 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
    { name: "narrow", use: { viewport: { width: 320, height: 740 } } },
  ],
  // An isolated production build avoids live-reload changes from other agents.
  webServer: { command: `npm run build -- --outDir ${preview} && npm run preview -- --outDir ${preview} --host 127.0.0.1 --port ${port} --strictPort`, url: baseURL, reuseExistingServer: false },
});
