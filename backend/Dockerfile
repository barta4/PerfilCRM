# --- Build Stage ---
FROM node:22-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@9

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for compilation)
RUN pnpm install --frozen-lockfile || pnpm install --no-frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Build the NestJS application
RUN pnpm run build

# Remove development dependencies to keep the production layer slim
RUN pnpm prune --prod

# --- Production Stage ---
FROM node:22-alpine AS runner

WORKDIR /app

# Set directory permissions and create uploads directory for non-root user
RUN mkdir -p /app/uploads && chown -R node:node /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001

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
