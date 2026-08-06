# --- Build Stage ---
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (including devDependencies for compilation)
RUN pnpm install --no-frozen-lockfile

# Copy the rest of the application files
COPY . .

# Build the NestJS application
RUN pnpm run build

# Remove development dependencies to keep the image slim
RUN pnpm prune --prod

# --- Production Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

# Set directory permissions for non-root user
RUN chown node:node /app

# Set production environment
ENV NODE_ENV=production

# Copy built application and required production dependencies
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/public ./public

# Use non-root user
USER node

# Expose backend port
EXPOSE 3001

# Start NestJS backend
CMD ["node", "dist/main"]
