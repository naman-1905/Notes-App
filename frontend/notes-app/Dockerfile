# Use Node.js LTS Alpine image
FROM node:18-alpine

# Install wget for health checks
RUN apk add --no-cache wget

# Set working directory
WORKDIR /app

# Accept NEXT_PUBLIC_BASE_URL at build time
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}

# Set NODE_ENV to production
ENV NODE_ENV=production

# Create nextjs user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy package files and install dependencies
COPY --chown=nextjs:nodejs package*.json ./
RUN npm ci --silent && npm cache clean --force

# Copy the rest of the application
COPY --chown=nextjs:nodejs . .

# Build the application
RUN npm run build

# Switch to nextjs user
USER nextjs

# Set environment variables
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Expose the port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application
CMD ["npm", "start"]