# Production image for the Next.js web app. UNUSED IN DEV (dev runs `npm run
# dev` locally); provided for the Oracle Cloud deployment path in DEPLOYMENT.md.
# Built from the repo root for workspace access.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY apps/sync/package.json ./apps/sync/package.json
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build --workspace @dayfold/web

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/web ./apps/web
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["npm", "run", "start"]
