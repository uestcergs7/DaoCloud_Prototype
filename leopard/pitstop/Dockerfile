# Build stage
FROM docker.m.daocloud.io/node:20-alpine AS builder

ENV COREPACK_NPM_REGISTRY=https://registry.npmmirror.com
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc* ./

RUN pnpm install --frozen-lockfile --registry=https://registry.npmmirror.com

COPY . .

RUN pnpm run build

COPY tsconfig.server.json ./
RUN pnpm exec tsc -p tsconfig.server.json

# Production stage
FROM docker.m.daocloud.io/node:20-alpine

ENV COREPACK_NPM_REGISTRY=https://registry.npmmirror.com
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc* ./

RUN pnpm install --frozen-lockfile --prod --registry=https://registry.npmmirror.com

COPY --from=builder /app/dist ./dist

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

ENTRYPOINT ["./docker-entrypoint.sh"]
