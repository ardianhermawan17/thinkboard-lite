import type { StorybookConfig } from "@storybook/nextjs-vite"

const config: StorybookConfig = {
  framework: "@storybook/nextjs-vite",
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-vitest"],
  core: { disableTelemetry: true }, // no usage data leaves the machine (D-12)
}

export default config
