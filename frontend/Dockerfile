# --- Build Stage ---
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy the rest of the application files
COPY . .

# Set environment variables for build time (Next.js embeds these in the client bundle)
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_GOOGLE_MAPS_KEY=""

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GOOGLE_MAPS_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_KEY
ENV NODE_ENV=production

# Build the Next.js application
RUN pnpm run build

# --- Production Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

# Set directory permissions for non-root user
RUN chown node:node /app

# Install pnpm for running the start script
RUN npm install -g pnpm

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy built application and required production dependencies
COPY --from=builder --chown=node:node /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

# Use non-root user
USER node

# Expose port
EXPOSE 3000

# Start Next.js
CMD ["pnpm", "run", "start"]
