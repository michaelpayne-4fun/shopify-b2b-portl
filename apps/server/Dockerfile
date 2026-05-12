# syntax=docker/dockerfile:1.7

# ---------- build stage ----------
FROM node:20-alpine AS build
WORKDIR /repo

# Workspace manifests first for better layer caching.
COPY package.json yarn.lock tsconfig.base.json ./
COPY apps/portal/package.json apps/portal/
COPY apps/server/package.json apps/server/
COPY packages/domain/package.json packages/domain/
COPY packages/db/package.json packages/db/

RUN corepack enable && yarn install --frozen-lockfile

# Now the sources.
COPY . .

# Build the SPA. The BFF runs through tsx and reads TS directly, so
# no separate BFF build step is needed in v1 (see plan §2.5).
RUN yarn workspace @b2b/portal build

# ---------- runtime stage ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy the whole repo (small enough; v2 follow-up will trim).
COPY --from=build /repo /app

# Place the SPA build where the BFF expects to serve it.
RUN mv /app/apps/portal/dist /app/apps/server/public

WORKDIR /app/apps/server
EXPOSE 8080
# tsx-style run: the BFF's TS sources are loaded by tsx at startup.
CMD ["yarn", "tsx", "src/index.ts"]
