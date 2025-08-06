#!/bin/bash

echo "🚀 Starting Nvestiv Investor Network Platform..."
echo ""

# Start API server in background
echo "Starting API server on port 3010..."
node api_server.js &
API_PID=$!

# Wait a moment for API to start
sleep 2

# Start frontend server
echo "Starting frontend server on port 3013..."
cd frontend
npm run dev &
FRONTEND_PID=$!

# Return to main directory
cd ..

echo ""
echo "✅ Both servers started successfully!"
echo ""
echo "📊 API Server: http://localhost:3010"
echo "🎨 Frontend UI: http://localhost:3013"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to handle shutdown
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $API_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to handle Ctrl+C
trap cleanup SIGINT

# Wait for either process to finish
wait $API_PID $FRONTEND_PID