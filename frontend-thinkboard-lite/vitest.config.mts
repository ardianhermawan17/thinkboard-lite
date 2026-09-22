import { fileURLToPath } from "node:url"
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin"
import { playwright } from "@vitest/browser-playwright"
import { defineConfig } from "vitest/config"

const at = (path: string) => fileURLToPath(new URL(path, import.meta.url))

// The aliases MUST mirror tsconfig.json#compilerOptions.paths (I7): declared twice, always.
// One without the other is "works in dev, fails in test".
export default defineConfig({
  // Vite 8 transforms with Oxc (no esbuild option, no plugin-react needed): the automatic JSX runtime, as Next uses.
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    alias: {
      "@app": at("./src/app"),
      "@feature": at("./src/features"),
      "@shared": at("./src/shared"),
      "@public": at("./public"),
    },
  },
  test: {
    projects: [
      {
        // jsdom for slices, hooks and DOM components; a test that needs IndexedDB imports "fake-indexeddb/auto".
        extends: true,
        test: { name: "unit", environment: "jsdom", include: ["src/**/*.test.{ts,tsx}"], setupFiles: [at("./vitest.setup.ts")] },
      },
      {
        // Every story is a test, run in headless Chrome through Playwright (ffa §10). The installed Chrome is used,
        // so nothing is downloaded. ponytail: Chrome only; add a browser to `instances` when cross-browser matters.
        extends: true,
        plugins: [storybookTest({ configDir: ".storybook" })],
        test: {
          name: "stories",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({ launchOptions: { channel: "chrome" } }),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
})
