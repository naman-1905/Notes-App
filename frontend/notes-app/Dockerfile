# frontend/notes-app/Dockerfile

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
WORKDIR /app
ENV NODE_ENV=production

# Copy build output and node_modules
COPY --from=builder /app/.next .next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Start Next.js in production
CMD ["npx", "next", "start", "-p", "3000", "-H", "0.0.0.0"]
