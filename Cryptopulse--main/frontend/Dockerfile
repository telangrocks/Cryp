# =============================================================================
# CryptoPulse Frontend Dockerfile - Production Ready
# =============================================================================

# Use Node.js Alpine as base image
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    tzdata

# =========================================================================
# Dependencies Stage
# =========================================================================
FROM base AS dependencies

# Copy package files
COPY package*.json ./

# Install pnpm globally
RUN npm install -g pnpm@10.18.0

# Install dependencies with pnpm
RUN pnpm install --production=false

# =========================================================================
# Build Stage
# =========================================================================
FROM dependencies AS build

# Copy source code
COPY . .

# Build application with pnpm
RUN pnpm run build

# =========================================================================
# Production Stage - Nginx
# =========================================================================
FROM nginx:alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy built application from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set ownership
RUN chown -R nextjs:nodejs /usr/share/nginx/html && \
    chown -R nextjs:nodejs /var/cache/nginx && \
    chown -R nextjs:nodejs /var/log/nginx && \
    chown -R nextjs:nodejs /etc/nginx/conf.d

# Create nginx pid directory
RUN mkdir -p /var/run/nginx && \
    chown -R nextjs:nodejs /var/run/nginx

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Start nginx with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]
