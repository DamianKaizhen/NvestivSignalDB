#!/bin/bash

# Investor Database Browser - Server Startup Script
# This script helps you start the server with proper error handling

echo "🚀 Starting Investor Database Browser Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if database file exists
if [ ! -f "investor_network_full.db" ]; then
    echo "❌ Database file 'investor_network_full.db' not found."
    echo "   Please make sure you're in the correct directory and the database exists."
    exit 1
fi

# Check if web interface exists
if [ ! -f "web_interface.html" ]; then
    echo "❌ Web interface file 'web_interface.html' not found."
    exit 1
fi

# Check if server file exists
if [ ! -f "simple_server.js" ]; then
    echo "❌ Server file 'simple_server.js' not found."
    exit 1
fi

# Check if port 3010 is already in use
if ss -tln | grep -q ":3010 "; then
    echo "⚠️  Port 3010 is already in use. Please stop other applications using this port."
    echo "   You can find what's using the port with: ss -tlnp | grep 3010"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies."
        exit 1
    fi
fi

echo "✅ Pre-flight checks passed!"
echo ""

# Offer to start in background or foreground
echo "How would you like to start the server?"
echo "1) Foreground (see logs in terminal, use Ctrl+C to stop)"
echo "2) Background (run in background, logs saved to server.log)"
read -p "Choose option (1 or 2): " choice

case $choice in
    1)
        echo "🌟 Starting server in foreground..."
        echo "   Press Ctrl+C to stop the server"
        echo ""
        node simple_server.js
        ;;
    2)
        echo "🌟 Starting server in background..."
        nohup node simple_server.js > server.log 2>&1 &
        SERVER_PID=$!
        echo "   Server PID: $SERVER_PID"
        echo "   Logs: tail -f server.log"
        echo "   Stop: kill $SERVER_PID"
        echo ""
        
        # Wait a moment and check if server started
        sleep 2
        if curl -s http://localhost:3010/health > /dev/null; then
            echo "✅ Server started successfully!"
            echo "🌐 Web Interface: http://localhost:3010"
            echo "🔧 Server Health: http://localhost:3010/health"
            echo "📊 Diagnostics: http://localhost:3010/api/diagnostics"
        else
            echo "❌ Server may have failed to start. Check server.log for details."
        fi
        ;;
    *)
        echo "❌ Invalid option. Please choose 1 or 2."
        exit 1
        ;;
esac