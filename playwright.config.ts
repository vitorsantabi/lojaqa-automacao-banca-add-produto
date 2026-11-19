import 'dotenv/config';
import { defineConfig } from '@playwright/test';

const apiBaseUrl = `${(process.env.API_BASE_URL || 'https://api-qa-fap2026.onrender.com/api').replace(/\/+$/, '')}/`;

export default defineConfig({
  testDir: './tests',
  timeout: 45000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: apiBaseUrl,
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  }
});
