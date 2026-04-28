import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./generated",
  use: {
    headless: true,
    baseURL: process.env.BASE_URL ?? '',
    ...(process.env.BASIC_USER ? {
      httpCredentials: {
        username: process.env.BASIC_USER ?? '',
        password: process.env.BASIC_PASS ?? '',
      }
    } : {}),
    viewport: { width: 1600, height: 900 },
    trace: 'on-first-retry',
  },
});
