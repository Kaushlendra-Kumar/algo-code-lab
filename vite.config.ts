/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves a project repository from /<repo-name>/.
// Override with BASE_PATH=/ for Cloudflare Pages or a custom domain.
// Vercel and Cloudflare Pages builds serve from the root automatically.
const rootHost = process.env.VERCEL || process.env.CF_PAGES;
const base = process.env.BASE_PATH ?? (rootHost ? '/' : '/algo-code-lab/');

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1500,
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
});
