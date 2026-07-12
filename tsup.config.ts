import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  bundle: true,
  sourcemap: true,
  splitting: false,
  external: ['@prisma/client', '@prisma/adapter-pg', 'pg'],
});
