# frontend/notes-app/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app

# allow passing NEXT_PUBLIC_BASE_URL at build time
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}

COPY package*.json ./
RUN npm ci --silent

COPY . .
RUN npm run build

# runtime image
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next .next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "run", "start", "--", "-H", "0.0.0.0", "-p", "3000"]