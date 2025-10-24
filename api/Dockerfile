FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./

# Copy database directory (schema and init files)
COPY database/ ./database/

# Create database directory for SQLite file storage
RUN mkdir -p /database

# Expose the port the app runs on
EXPOSE 3000

# Start the application with tsx
CMD ["npx", "tsx", "src/index.ts"]

