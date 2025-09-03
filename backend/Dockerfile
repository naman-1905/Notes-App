# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --silent

# Copy the rest of the app
COPY . .

# Copy .env if it exists in the build context (we'll generate it via Jenkins)
COPY .env .env

EXPOSE 5000
CMD ["npm", "start"]
