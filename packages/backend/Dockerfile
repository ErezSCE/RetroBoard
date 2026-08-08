# syntax=docker/dockerfile:1

# ---------- Builder Stage ----------
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
COPY package.json ./
# Disable strict SSL for corporate proxies
RUN npm config set strict-ssl false && npm install --omit=dev

# Copy application source
COPY . .

# ---------- Production Stage ----------
FROM node:20-alpine

# Create non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

# Copy node_modules and source from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Change ownership to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

CMD ["node", "src/server.js"]
