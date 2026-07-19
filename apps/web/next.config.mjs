import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';

// Single source of truth: the repo-root .env. cwd is apps/web when `next` runs.
loadEnv({ path: resolve(process.cwd(), '../../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Hide the dev-mode indicator; it overlaps the sidebar footer in the corner.
  devIndicators: false,
  // @dayfold/shared ships raw JS via the workspace; let Next transpile it.
  transpilePackages: ['@dayfold/shared'],
  experimental: {
    // Server actions are used for mutations across the app.
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
};

export default nextConfig;
