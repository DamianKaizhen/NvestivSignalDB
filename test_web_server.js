#!/usr/bin/env node

const express = require('express');
const path = require('path');
const fs = require('fs');

console.log('🔍 TESTING WEB SERVER FOR BLANK SCREEN ISSUE\n');

// Create a minimal test HTML file to verify serving works
const testHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Page</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            background-color: #f0f0f0;
        }
        .test-box {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border: 2px solid #007acc;
        }
    </style>
</head>
<body>
    <div class="test-box">
        <h1>🎉 Test Page Loaded Successfully!</h1>
        <p>If you can see this, the Express server is working correctly.</p>
        <p>Current time: <span id="time"></span></p>
    </div>
    <script>
        document.getElementById('time').textContent = new Date().toLocaleString();
    </script>
</body>
</html>`;

fs.writeFileSync('test_page.html', testHTML);

const app = express();
const port = 3012;

// Add logging middleware
app.use((req, res, next) => {
    console.log(`📋 ${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Serve static files
app.use(express.static('.'));

// Test routes
app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'test_page.html'));
});

app.get('/', (req, res) => {
    console.log('📄 Serving web_interface.html from root route');
    res.sendFile(path.join(__dirname, 'web_interface.html'));
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        files: {
            'web_interface.html': fs.existsSync('web_interface.html'),
            'test_page.html': fs.existsSync('test_page.html')
        }
    });
});

const server = app.listen(port, () => {
    console.log(`
🚀 TEST SERVER STARTED ON PORT ${port}

Test URLs:
• Test page:     http://localhost:${port}/test
• Main interface: http://localhost:${port}/
• Health check:   http://localhost:${port}/health

📝 DEBUGGING STEPS:
1. First, test the simple test page: http://localhost:${port}/test
2. If that works, test the main interface: http://localhost:${port}/
3. Check browser console for JavaScript errors
4. Check network tab for failed requests
5. Try hard refresh (Ctrl+F5) to clear cache

🛠 COMMON ISSUES:
• Browser cache preventing updates
• JavaScript errors blocking rendering
• API calls failing and causing blank screens
• CSS issues hiding content
• Mixed content warnings (HTTP/HTTPS)

Server will auto-close in 60 seconds...
    `);
    
    // Auto-close after 60 seconds
    setTimeout(() => {
        console.log('\n⏰ Auto-closing test server...');
        server.close();
        fs.unlinkSync('test_page.html'); // Clean up test file
        process.exit(0);
    }, 60000);
});

process.on('SIGINT', () => {
    console.log('\n👋 Server stopped by user');
    if (fs.existsSync('test_page.html')) {
        fs.unlinkSync('test_page.html');
    }
    process.exit(0);
});