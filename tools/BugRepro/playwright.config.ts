import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./generated",
  use: {
    headless: true,
  },
});
