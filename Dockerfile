FROM node:20-alpine

WORKDIR /app

# Copy API package files (including package-lock.json)
COPY api/package.json api/package-lock.json ./api/

# Install API dependencies
WORKDIR /app/api
RUN npm ci --only=production

# Copy API source code
COPY api/src/ ./src/
COPY api/tsconfig.json ./

# Copy data directory
COPY data/ /data/

# Expose port
EXPOSE 3000

# Start the API
CMD ["npx", "tsx", "src/index.ts"]

