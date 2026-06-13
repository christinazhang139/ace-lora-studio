FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/ui/package.json packages/ui/
COPY studio/package.json studio/
COPY muse/package.json muse/
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY . .
RUN npm run build --workspace=studio

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# OpenShift runs containers as arbitrary UID (non-root)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

COPY --from=builder /app/studio/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/studio/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/studio/.next/static ./studio/.next/static

USER 1001
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "studio/server.js"]
