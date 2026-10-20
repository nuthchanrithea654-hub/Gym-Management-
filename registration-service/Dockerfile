# Use Node.js as the base image
FROM node:20-alpine

# Run in production mode
ENV NODE_ENV=production

# Set the working directory
WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy all service files into the container
COPY --chown=node:node . .

# Run as the non-root node user
USER node

# Expose port 5001
EXPOSE 5001

# Start the service
CMD ["node", "server.js"]
