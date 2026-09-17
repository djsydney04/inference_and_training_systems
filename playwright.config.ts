import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/ui",
  timeout: 90_000,
  workers: 1,
  reporter: "list",
  outputDir: "output/ui-lint",
  use: { baseURL: "http://127.0.0.1:4195", screenshot: "only-on-failure", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    { name: "tablet", use: { viewport: { width: 768, height: 1024 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
    { name: "narrow", use: { viewport: { width: 320, height: 740 } } },
  ],
  // An isolated production build avoids live-reload changes from other agents.
  webServer: { command: "npm run build -- --outDir output/ui-preview && npm run preview -- --outDir output/ui-preview --host 127.0.0.1 --port 4195 --strictPort", url: "http://127.0.0.1:4195", reuseExistingServer: false },
});
