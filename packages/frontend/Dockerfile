# syntax=docker/dockerfile:1

# ---------- Builder Stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
# Disable strict SSL for corporate proxies
RUN npm config set strict-ssl false && npm ci

# Copy source code
COPY . .

# Build the Vite app
RUN npm run build

# ---------- Production Stage ----------
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Use default nginx command
CMD ["nginx", "-g", "daemon off;"]
