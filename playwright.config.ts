import { defineConfig } from "@playwright/test";

/**
 * Real-browser verification for TrustLens.
 *
 * The application is served by the platform-managed dev server on port 5173, so
 * there is deliberately no `webServer` block: these tests attach to the server
 * that is already running and never start, stop or restart one.
 *
 * Specs are named `*.e2e.ts` rather than `*.spec.ts` because `bun test` collects
 * `*.spec.ts` files and would hand them to the unit runner.
 *
 * Only the chromium headless shell is installed — the smallest chromium build
 * that can render and drive the real application.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5173",
    channel: "chromium-headless-shell",
    // The container runs as root, where Chromium refuses its own sandbox, and
    // /dev/shm is small.
    launchOptions: { args: ["--no-sandbox", "--disable-dev-shm-usage"] },
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 900 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
  ],
});
