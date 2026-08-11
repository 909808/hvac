import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

const resolvePath = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@engine': resolvePath('./src/engine'),
      '@content': resolvePath('./src/content'),
      '@games': resolvePath('./src/games'),
      '@ui': resolvePath('./src/ui'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
