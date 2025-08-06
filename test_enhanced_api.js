#!/usr/bin/env node

/**
 * Quick test script for the enhanced API server
 * Tests key endpoints and functionality
 */

const http = require('http');

const API_BASE = 'http://localhost:3010';

// Test helper function
async function testEndpoint(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_BASE);
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        const req = http.request(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: parsed
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: body
                    });
                }
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

// Main test function
async function runTests() {
    console.log('🚀 Testing Enhanced API Server');
    console.log('================================\n');

    const tests = [
        {
            name: 'Health Check',
            path: '/health',
            expectedStatus: 200
        },
        {
            name: 'Network Stats',
            path: '/api/network/stats',
            expectedStatus: 200
        },
        {
            name: 'Investor Search (Basic)',
            path: '/api/investors/search?limit=5',
            expectedStatus: 200
        },
        {
            name: 'Investor Search (Filtered)',
            path: '/api/investors/search?hasLinkedIn=true&limit=3&sortBy=connections',
            expectedStatus: 200
        },
        {
            name: 'Firms List',
            path: '/api/firms?limit=5',
            expectedStatus: 200
        },
        {
            name: 'Network Graph',
            path: '/api/network/graph?limit=10&minConnections=100',
            expectedStatus: 200
        },
        {
            name: 'AI Search',
            path: '/api/search/ai?q=fintech%20seed%20investors&limit=5',
            expectedStatus: 200
        },
        {
            name: '404 Test',
            path: '/api/nonexistent',
            expectedStatus: 404
        }
    ];

    for (const test of tests) {
        try {
            console.log(`Testing: ${test.name}`);
            const result = await testEndpoint(test.path);
            
            if (result.status === test.expectedStatus) {
                console.log(`  ✅ Status ${result.status} - OK`);
                
                // Show some sample data for successful responses
                if (result.status === 200 && result.data.success !== false) {
                    if (result.data.data) {
                        console.log(`  📊 Data keys: ${Object.keys(result.data.data).join(', ')}`);
                    }
                    if (result.data.meta) {
                        console.log(`  📋 Meta keys: ${Object.keys(result.data.meta).join(', ')}`);
                    }
                }
            } else {
                console.log(`  ❌ Expected ${test.expectedStatus}, got ${result.status}`);
                console.log(`  Error: ${JSON.stringify(result.data, null, 2)}`);
            }
        } catch (error) {
            console.log(`  ❌ Request failed: ${error.message}`);
        }
        
        console.log('');
    }

    console.log('🎉 Test completed!');
    console.log('\n💡 Next steps:');
    console.log('1. Start the server: node api_server.js');
    console.log('2. Test endpoints: curl http://localhost:3010/health');
    console.log('3. Connect your frontend to http://localhost:3010');
}

// Run tests if server is available
runTests().catch(console.error);