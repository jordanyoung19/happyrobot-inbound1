FROM node:20-alpine

WORKDIR /app

# Copy metrics package files and source
COPY metrics/package*.json ./metrics/
COPY metrics/tsconfig.json ./metrics/
COPY metrics/tsconfig.node.json ./metrics/
COPY metrics/vite.config.ts ./metrics/
COPY metrics/index.html ./metrics/
COPY metrics/src/ ./metrics/src/

# Install metrics dependencies and build
WORKDIR /app/metrics
RUN npm install
RUN npm run build

# Copy API package files
WORKDIR /app
COPY api/package*.json ./api/

# Install API dependencies
WORKDIR /app/api
RUN npm install --production

# Copy API source code
COPY api/src/ ./src/
COPY api/tsconfig.json ./

# Copy database directory structure
COPY api/database/ ./database/

# Copy data directory
COPY data/ /data/

# Create database directory for SQLite file
RUN mkdir -p /database

# Expose port
EXPOSE 3000

# Start the API
CMD ["npx", "tsx", "src/index.ts"]

