# Multi-stage build for TypeScript
FROM node:lts-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install all dependencies (including dev dependencies for TypeScript)
COPY package*.json ./
RUN npm install

# Copy source code and TypeScript configuration
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Production stage
FROM node:lts-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory to nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose the port the app runs on
EXPOSE 4000

# Health check to ensure the app is running
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

# Start the application
CMD ["node", "dist/server.js"]