# Multi-stage production build for SportHubAI Backend
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY src ./src
COPY .sequelizerc ./

# Final production stage
FROM node:18-alpine

WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/.sequelizerc ./

# Expose API port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
