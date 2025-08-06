#!/usr/bin/env node

const fetch = require('node-fetch').default || require('node-fetch');

console.log('🔍 Testing Nvestiv API and Frontend Setup\n');

async function testEndpoint(url, description) {
    try {
        console.log(`Testing ${description}...`);
        const response = await fetch(url);
        const data = await response.text();
        
        if (response.ok) {
            console.log(`✅ ${description} - Status: ${response.status}`);
            if (url.includes('/health')) {
                const healthData = JSON.parse(data);
                console.log(`   Database: ${healthData.database.totalInvestors} investors, ${healthData.database.totalFirms} firms`);
            }
            return true;
        } else {
            console.log(`❌ ${description} - Status: ${response.status}`);
            console.log(`   Error: ${data.substring(0, 100)}...`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ${description} - Connection failed: ${error.message}`);
        return false;
    }
}

async function testCORS(apiUrl, frontendUrl) {
    try {
        console.log(`Testing CORS from ${frontendUrl} to ${apiUrl}...`);
        const response = await fetch(apiUrl, {
            headers: {
                'Origin': frontendUrl,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log(`✅ CORS test - Status: ${response.status}`);
            return true;
        } else {
            console.log(`❌ CORS test - Status: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ CORS test failed: ${error.message}`);
        return false;
    }
}

async function main() {
    const tests = [
        ['http://localhost:3010/', 'API Root (should redirect to /health)'],
        ['http://localhost:3010/health', 'API Health Check'],
        ['http://localhost:3010/api/network/stats', 'API Network Stats'],
        ['http://localhost:3010/api/investors/search?limit=1', 'API Investor Search'],
        ['http://localhost:3013/', 'Frontend (port 3013)'],
        ['http://localhost:3014/', 'Frontend (port 3014)']
    ];

    console.log('='.repeat(60));
    console.log('ENDPOINT TESTS');
    console.log('='.repeat(60));

    let apiWorking = false;
    let frontendWorking = false;

    for (const [url, description] of tests) {
        const success = await testEndpoint(url, description);
        if (url.includes('3010') && success) apiWorking = true;
        if ((url.includes('3013') || url.includes('3014')) && success) frontendWorking = true;
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    }

    console.log('\n' + '='.repeat(60));
    console.log('CORS TESTS');
    console.log('='.repeat(60));

    if (apiWorking) {
        await testCORS('http://localhost:3010/api/network/stats', 'http://localhost:3013');
        await testCORS('http://localhost:3010/api/network/stats', 'http://localhost:3014');
    }

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));

    console.log(`API Server (port 3010): ${apiWorking ? '✅ Working' : '❌ Not Working'}`);
    console.log(`Frontend (port 3013/3014): ${frontendWorking ? '✅ Working' : '❌ Not Working'}`);
    
    if (apiWorking && frontendWorking) {
        console.log('\n🎉 Both API and Frontend are working!');
        console.log('🌐 Frontend URL: http://localhost:3014');
        console.log('🔧 API URL: http://localhost:3010');
        console.log('📊 API Health: http://localhost:3010/health');
    } else {
        console.log('\n⚠️  Issues detected:');
        if (!apiWorking) console.log('   - API server needs to be started');
        if (!frontendWorking) console.log('   - Frontend server needs to be started');
    }
}

main().catch(console.error);