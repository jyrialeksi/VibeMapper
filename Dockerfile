# Stage 1: Build frontend + mcp-server
FROM node:22-slim AS builder

WORKDIR /build

# Copy workspace config and package files
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/
COPY backend/package.json backend/
COPY mcp-server/package.json mcp-server/

# Install all deps (needed for frontend build + mcp-server build)
RUN npm ci

# Copy source
COPY frontend/ frontend/
COPY backend/ backend/
COPY mcp-server/ mcp-server/

# Build frontend + mcp-server
RUN npm run build --workspace=frontend && npm run build --workspace=mcp-server

# Stage 2: Production
FROM node:22-slim

WORKDIR /app

# Copy package files for backend + mcp-server
COPY backend/package.json backend/
COPY mcp-server/package.json mcp-server/
COPY package.json package-lock.json ./

# Install backend + mcp-server deps only
RUN npm ci --workspace=backend --workspace=mcp-server --omit=dev

# Copy backend source
COPY backend/ backend/

# Copy built frontend
COPY --from=builder /build/frontend/dist frontend/dist

# Copy built mcp-server
COPY --from=builder /build/mcp-server/build mcp-server/build

# Create non-root user and data directory
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser && \
    mkdir -p backend/data && \
    chown -R appuser:appgroup backend/data

# Copy entrypoint script
COPY --chown=appuser:appgroup docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ARG COMMIT_SHA=unknown
ARG BUILD_TIME=unknown
ENV NODE_ENV=production
ENV PORT=3001
ENV COMMIT_SHA=$COMMIT_SHA
ENV BUILD_TIME=$BUILD_TIME

EXPOSE 3001

USER appuser

ENTRYPOINT ["docker-entrypoint.sh"]
