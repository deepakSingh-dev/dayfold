# Hocuspocus sync service. Built from the repo root so the @dayfold/shared
# workspace is available. Runs plain JS (ESM) with Node — no build step.
FROM node:22-alpine

WORKDIR /app

# Install only the sync workspace's deps (+ its @dayfold/shared workspace link).
# Scoping to the workspace avoids pulling the web app's toolchain (esbuild etc.),
# whose platform-specific optional deps break a full `npm ci` inside Linux.
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/sync/package.json ./apps/sync/package.json
RUN npm install --workspace @dayfold/sync --omit=dev --no-audit --no-fund

# Copy the code the sync service needs.
COPY packages/shared ./packages/shared
COPY apps/sync ./apps/sync

WORKDIR /app/apps/sync
EXPOSE 1234
CMD ["node", "src/index.js"]
