import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  "stories": [
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-a11y"
  ],
  "framework": "@storybook/nextjs-vite",
  "core": {
    "disableTelemetry": true
  },
  "staticDirs": [
    "../public"
  ]
};
export default config;