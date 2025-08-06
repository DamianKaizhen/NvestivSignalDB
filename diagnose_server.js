#!/usr/bin/env node

const express = require('express');
const path = require('path');
const fs = require('fs');

console.log('🔍 DIAGNOSING EXPRESS SERVER SETUP\n');

// Check if files exist
const files = [
    'web_interface.html',
    'simple_server.js',
    'investor_network_full.db'
];

console.log('📁 File Check:');
files.forEach(file => {
    const exists = fs.existsSync(file);
    const status = exists ? '✅' : '❌';
    console.log(`   ${status} ${file}`);
    if (exists && file === 'web_interface.html') {
        const stats = fs.statSync(file);
        console.log(`      Size: ${stats.size} bytes`);
        const content = fs.readFileSync(file, 'utf8');
        console.log(`      Contains HTML: ${content.includes('<html>') ? '✅' : '❌'}`);
        console.log(`      Contains JavaScript: ${content.includes('<script>') ? '✅' : '❌'}`);
    }
});

console.log('\n🌐 Testing Basic Express Setup:');

const app = express();
const port = 3011; // Use different port for testing

// Test static file serving
app.use(express.static('.'));

// Test root route
app.get('/', (req, res) => {
    console.log('   📄 Root route accessed');
    const filePath = path.join(__dirname, 'web_interface.html');
    console.log(`   📂 Serving file: ${filePath}`);
    res.sendFile(filePath);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const server = app.listen(port, () => {
    console.log(`   ✅ Test server started on http://localhost:${port}`);
    
    // Test the endpoints
    setTimeout(async () => {
        const fetch = require('node-fetch').default || require('node-fetch');
        
        try {
            console.log('\n🧪 Testing Endpoints:');
            
            // Test health endpoint
            const healthResponse = await fetch(`http://localhost:${port}/health`);
            const healthData = await healthResponse.json();
            console.log(`   ✅ Health check: ${JSON.stringify(healthData)}`);
            
            // Test root endpoint
            const rootResponse = await fetch(`http://localhost:${port}/`);
            const rootText = await rootResponse.text();
            console.log(`   ✅ Root endpoint: ${rootText.length} characters received`);
            console.log(`   📄 HTML content detected: ${rootText.includes('<!DOCTYPE html>') ? '✅' : '❌'}`);
            console.log(`   🎨 CSS detected: ${rootText.includes('<style>') ? '✅' : '❌'}`);
            console.log(`   ⚡ JavaScript detected: ${rootText.includes('<script>') ? '✅' : '❌'}`);
            
        } catch (error) {
            console.log(`   ❌ Test failed: ${error.message}`);
        }
        
        server.close();
        console.log('\n✅ Diagnosis complete!');
        process.exit(0);
    }, 1000);
});