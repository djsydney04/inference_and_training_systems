import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

// A separate server keeps concurrent layout checks from stopping this suite.
export default defineConfig({
  ...base,
  testDir: "./tests/playback-ui",
  outputDir: "output/playback-tests",
  use: { ...base.use, baseURL: "http://127.0.0.1:4396" },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4396 --strictPort",
    url: "http://127.0.0.1:4396",
    reuseExistingServer: !process.env.CI,
  },
});
