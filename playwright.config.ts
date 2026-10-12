import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4173/ActionDBG/',
    viewport: { width: 1280, height: 800 },
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || undefined,
      args: ['--enable-unsafe-swiftshader'],
    },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173/ActionDBG/',
    reuseExistingServer: !process.env.CI,
  },
});
