#!/bin/bash

echo "🔄 Restarting Nvestiv API Server..."

# Kill existing API server
pkill -f "api_server.js" 2>/dev/null || echo "No existing API server found"

# Wait a moment
sleep 2

# Start new API server
echo "🚀 Starting API server on port 3010..."
cd /home/damian/ExperimentationKaizhen/Nvestiv
nohup node api_server.js > api_server.log 2>&1 &

# Give it time to start
sleep 3

# Test if it's working
echo "🧪 Testing API server..."
if curl -s http://localhost:3010/health > /dev/null; then
    echo "✅ API server is running successfully!"
    echo "📊 Health check: http://localhost:3010/health"
    echo "🌐 Frontend should now load data at: http://localhost:3013"
else
    echo "❌ API server failed to start"
    echo "📋 Check logs with: tail -f api_server.log"
fi