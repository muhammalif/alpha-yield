# Use Node.js 18 Alpine for smaller image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for tsx)
RUN npm install

# Copy source code
COPY . .

# Expose port for health check (optional)
EXPOSE 3000

# Run the app
CMD ["npm", "run", "dev"]