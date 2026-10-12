import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/ActionDBG/',
  test: { include: ['tests/**/*.test.ts'] },
});
