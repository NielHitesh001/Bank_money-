# Multi-Stage Production Dockerfile for World Money Terminal OS
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm test
RUN npm run build

# Runtime Stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8766

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/data ./data
COPY --from=builder /app/FinanceVault ./FinanceVault
COPY --from=builder /app/scripts ./scripts

EXPOSE 8766

CMD ["node", "src/server/server.mjs"]
