# ---------- Base Runtime ----------
FROM node:18-alpine

WORKDIR /app

# Install system dependencies (minimal)
RUN apk add --no-cache dumb-init

# Copy only package files first
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Create non-root user (security + smaller attack surface)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

# Use dumb-init (better process handling, smaller + safer)
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "server.js"]