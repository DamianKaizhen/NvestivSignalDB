#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

console.log('🚀 Starting Investor Network Server...\n');

// Function to check if server is responding
function checkServer(port, callback) {
    const options = {
        hostname: 'localhost',
        port: port,
        path: '/health',
        method: 'GET',
        timeout: 5000
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            try {
                const parsed = JSON.parse(data);
                callback(null, parsed);
            } catch (e) {
                callback(e, null);
            }
        });
    });

    req.on('error', callback);
    req.on('timeout', () => {
        req.destroy();
        callback(new Error('Request timeout'), null);
    });

    req.end();
}

// Start the server
const serverProcess = spawn('node', ['simple_server.js'], {
    stdio: 'inherit',
    cwd: __dirname
});

serverProcess.on('error', (err) => {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
});

// Wait a moment for server to start, then test it
setTimeout(() => {
    console.log('\n🔍 Testing server health...');
    
    checkServer(3010, (err, data) => {
        if (err) {
            console.error('❌ Server health check failed:', err.message);
            console.log('\n📋 Troubleshooting steps:');
            console.log('1. Check if port 3010 is already in use: netstat -tulpn | grep 3010');
            console.log('2. Check server logs above for errors');
            console.log('3. Verify investor_network_full.db exists and is readable');
        } else {
            console.log('✅ Server is healthy:', data.status);
            console.log('\n🌐 Access your application:');
            console.log('• Web Interface: http://localhost:3010');
            console.log('• API Health:    http://localhost:3010/health');
            console.log('\n💡 If browser shows blank screen:');
            console.log('1. Open browser dev tools (F12)');
            console.log('2. Check Console tab for JavaScript errors');
            console.log('3. Check Network tab for failed API calls');
            console.log('4. Try hard refresh (Ctrl+F5 or Cmd+Shift+R)');
            console.log('\n⚡ Server is running. Press Ctrl+C to stop.');
        }
    });
}, 3000);

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down server...');
    serverProcess.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down server...');
    serverProcess.kill('SIGTERM');
    process.exit(0);
});