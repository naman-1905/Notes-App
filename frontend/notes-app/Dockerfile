# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Accept NEXT_PUBLIC_BASE_URL at build time
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}

COPY package*.json ./
RUN npm ci --silent

COPY . .

# Build Next.js app
RUN npm run build

# Production runtime stage
FROM node:18-alpine AS runner

# Install wget for health checks
RUN apk add --no-cache wget

WORKDIR /app

ENV NODE_ENV=production

# Create nextjs user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy the full build output and node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start Next.js in production
CMD ["npx", "next", "start", "-p", "3000", "-H", "0.0.0.0"]