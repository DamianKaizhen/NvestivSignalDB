FROM node:18-alpine

WORKDIR /app

# Install required system dependencies
RUN apk add --no-cache sqlite curl

# Copy backend files
COPY package*.json ./
COPY api_server.js ./
COPY network_analysis_full.js ./
COPY *.db ./
COPY Sample_Investor_DB/ ./Sample_Investor_DB/

# Install backend dependencies
RUN npm install

# Copy frontend files
COPY frontend/ ./frontend/

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm install

# Build frontend for production
ENV NEXT_PUBLIC_API_URL=http://localhost:3010
RUN npm run build

WORKDIR /app

# Create startup script
RUN echo '#!/bin/sh' > start.sh && \
    echo 'echo "🚀 Starting Nvestiv Signal DB Application..."' >> start.sh && \
    echo 'echo "Starting API Server on port 3010..."' >> start.sh && \
    echo 'node api_server.js &' >> start.sh && \
    echo 'API_PID=$!' >> start.sh && \
    echo 'sleep 10' >> start.sh && \
    echo 'echo "Starting Frontend on port 3013..."' >> start.sh && \
    echo 'cd frontend && PORT=3013 npm start &' >> start.sh && \
    echo 'FRONTEND_PID=$!' >> start.sh && \
    echo 'echo "✅ Application started successfully!"' >> start.sh && \
    echo 'echo "📊 API Server: http://localhost:3010"' >> start.sh && \
    echo 'echo "🎨 Frontend: http://localhost:3013"' >> start.sh && \
    echo 'echo "🔍 Health Check: http://localhost:3010/health"' >> start.sh && \
    echo 'wait $API_PID $FRONTEND_PID' >> start.sh && \
    chmod +x start.sh

# Expose ports
EXPOSE 3010 3013

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3010/health || exit 1

# Start the application
CMD ["./start.sh"]