#!/bin/bash

# Server Health Check Script
echo "🔍 Checking Investor Database Browser Server..."
echo ""

# Check if server is responding
if curl -s http://localhost:3010/health > /dev/null; then
    echo "✅ Server is responding"
    
    # Get health details  
    HEALTH=$(curl -s http://localhost:3010/health)
    STATUS=$(echo $HEALTH | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    UPTIME=$(echo $HEALTH | grep -o '"uptime":[0-9]*' | cut -d':' -f2)
    DATABASE=$(echo $HEALTH | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
    
    echo "   Status: $STATUS"
    echo "   Uptime: ${UPTIME}s"
    echo "   Database: $DATABASE"
    
    # Check web interface
    if curl -s -I http://localhost:3010/ | grep -q "200 OK"; then
        echo "✅ Web interface accessible"
    else
        echo "❌ Web interface not accessible"
    fi
    
    # Check API endpoints
    if curl -s http://localhost:3010/api/network/stats > /dev/null; then
        echo "✅ API endpoints working"
    else
        echo "❌ API endpoints not responding"
    fi
    
    echo ""
    echo "🌐 Access URLs:"
    echo "   Web Interface: http://localhost:3010"
    echo "   Health Check: http://localhost:3010/health"
    echo "   Diagnostics: http://localhost:3010/api/diagnostics"
    
else
    echo "❌ Server is not responding on port 3010"
    echo ""
    echo "🔧 Troubleshooting steps:"
    echo "   1. Check if server is running: ps aux | grep node"
    echo "   2. Start server: ./start_server.sh"
    echo "   3. Check port usage: ss -tlnp | grep 3010"
    echo "   4. View logs: tail -f server.log"
fi

echo ""