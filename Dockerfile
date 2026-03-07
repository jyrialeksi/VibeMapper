# Stage 1: Build frontend
FROM node:22-slim AS builder

WORKDIR /build

# Copy workspace config and package files
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/
COPY backend/package.json backend/

# Install all deps (needed for frontend build)
RUN npm ci

# Copy source
COPY frontend/ frontend/
COPY backend/ backend/

# Build frontend
RUN npm run build --workspace=frontend

# Stage 2: Production
FROM node:22-slim

WORKDIR /app

# Copy backend package files
COPY backend/package.json backend/
COPY package.json package-lock.json ./

# Install backend deps only
RUN npm ci --workspace=backend --omit=dev

# Copy backend source
COPY backend/ backend/

# Copy built frontend
COPY --from=builder /build/frontend/dist frontend/dist

# Create data directory
RUN mkdir -p backend/data

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "backend/src/server.js"]
