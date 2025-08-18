#!/usr/bin/env node

/**
 * API Standardization Test Suite
 * 
 * Comprehensive testing of all standardized endpoints to ensure:
 * - Consistent response formats
 * - Proper error handling
 * - Input validation
 * - Performance benchmarks
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3010';
const TIMEOUT = 10000; // 10 seconds

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Test suite results
const results = {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    performance: []
};

/**
 * Validate standard response format
 */
function validateStandardResponse(response, testName) {
    const issues = [];
    
    if (typeof response !== 'object') {
        issues.push('Response is not an object');
        return issues;
    }
    
    // Check for required fields
    if (typeof response.success !== 'boolean') {
        issues.push('Missing or invalid "success" field');
    }
    
    if (response.success) {
        if (!response.data) {
            issues.push('Success response missing "data" field');
        }
        if (!response.meta || typeof response.meta !== 'object') {
            issues.push('Success response missing or invalid "meta" field');
        }
        if (!response.meta?.timestamp) {
            issues.push('Meta missing timestamp');
        }
    } else {
        if (!response.error) {
            issues.push('Error response missing "error" field');
        }
        if (!response.error?.message) {
            issues.push('Error missing message');
        }
        if (!response.error?.code) {
            issues.push('Error missing code');
        }
        if (!response.error?.timestamp) {
            issues.push('Error missing timestamp');
        }
    }
    
    return issues;
}

/**
 * Run a single test
 */
async function runTest(testName, testFunction) {
    results.total++;
    const startTime = Date.now();
    
    try {
        logInfo(`Running: ${testName}`);
        await testFunction();
        const duration = Date.now() - startTime;
        results.performance.push({ test: testName, duration });
        results.passed++;
        logSuccess(`${testName} (${duration}ms)`);
    } catch (error) {
        const duration = Date.now() - startTime;
        results.failed++;
        logError(`${testName} (${duration}ms): ${error.message}`);
    }
}

/**
 * Make HTTP request with error handling
 */
async function makeRequest(method, url, data = null) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${url}`,
            timeout: TIMEOUT,
            validateStatus: () => true // Don't throw on HTTP errors
        };
        
        if (data) {
            config.data = data;
        }
        
        const response = await axios(config);
        return {
            status: response.status,
            data: response.data,
            headers: response.headers
        };
    } catch (error) {
        throw new Error(`Request failed: ${error.message}`);
    }
}

/**
 * Test Cases
 */

// Test 1: Health Endpoint
async function testHealthEndpoint() {
    const response = await makeRequest('GET', '/health');
    
    if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    const issues = validateStandardResponse(response.data, 'Health Endpoint');
    if (issues.length > 0) {
        throw new Error(`Response format issues: ${issues.join(', ')}`);
    }
    
    if (!response.data.data.status || response.data.data.status !== 'healthy') {
        throw new Error('Health status is not healthy');
    }
    
    if (!response.data.data.version) {
        throw new Error('Missing version information');
    }
}

// Test 2: Investor Search - Valid Request
async function testInvestorSearchValid() {
    const response = await makeRequest('GET', '/api/investors/search?limit=5&page=1');
    
    if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    const issues = validateStandardResponse(response.data, 'Investor Search');
    if (issues.length > 0) {
        throw new Error(`Response format issues: ${issues.join(', ')}`);
    }
    
    if (!response.data.data.results || !Array.isArray(response.data.data.results)) {
        throw new Error('Missing or invalid results array');
    }
    
    if (!response.data.data.pagination) {
        throw new Error('Missing pagination data');
    }
    
    if (response.data.data.results.length > 5) {
        throw new Error('Limit validation failed - returned more than requested');
    }
}

// Test 3: Investor Search - Invalid Parameters
async function testInvestorSearchInvalid() {
    const response = await makeRequest('GET', '/api/investors/search?limit=500&page=-1');
    
    if (response.status !== 200) {
        throw new Error(`Expected status 200 with sanitization, got ${response.status}`);
    }
    
    // Should sanitize to valid values
    const issues = validateStandardResponse(response.data, 'Investor Search Invalid');
    if (issues.length > 0) {
        throw new Error(`Response format issues: ${issues.join(', ')}`);
    }
    
    // Should return data despite invalid input (sanitized)
    if (!response.data.data.results) {
        throw new Error('Should return sanitized results');
    }
}

// Test 4: Investor Detail - Valid ID
async function testInvestorDetailValid() {
    const response = await makeRequest('GET', '/api/investors/12582');
    
    if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    const issues = validateStandardResponse(response.data, 'Investor Detail');
    if (issues.length > 0) {
        throw new Error(`Response format issues: ${issues.join(', ')}`);
    }
    
    if (!response.data.data.investor) {
        throw new Error('Missing investor data');
    }
    
    if (!response.data.data.investor.id) {
        throw new Error('Missing investor ID');
    }
}

// Test 5: Investor Detail - Invalid ID
async function testInvestorDetailInvalid() {
    const response = await makeRequest('GET', '/api/investors/99999999');
    
    if (response.status !== 404) {
        throw new Error(`Expected status 404, got ${response.status}`);
    }
    
    const issues = validateStandardResponse(response.data, 'Investor Detail Invalid');
    if (issues.length > 0) {
        throw new Error(`Response format issues: ${issues.join(', ')}`);
    }
    
    if (response.data.error.code !== 'INVESTOR_NOT_FOUND') {
        throw new Error(`Expected error code INVESTOR_NOT_FOUND, got ${response.data.error.code}`);
    }
}

// Test 6: Firms List
async function testFirmsList() {
    const response = await makeRequest('GET', '/api/firms?limit=3');
    
    if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    const issues = validateStandardResponse(response.data, 'Firms List');
    if (issues.length > 0) {
        throw new Error(`Response format issues: ${issues.join(', ')}`);
    }
    
    if (!response.data.data.items || !Array.isArray(response.data.data.items)) {
        throw new Error('Missing or invalid items array');
    }
    
    if (!response.data.data.pagination) {
        throw new Error('Missing pagination data');
    }
}

// Test 7: Firm Detail
async function testFirmDetail() {
    const response = await makeRequest('GET', '/api/firms/120');
    
    if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    const issues = validateStandardResponse(response.data, 'Firm Detail');
    if (issues.length > 0) {
        throw new Error(`Response format issues: ${issues.join(', ')}`);
    }
    
    if (!response.data.data.firm) {
        throw new Error('Missing firm data');
    }
}

// Test 8: AI Search - Valid Query
async function testAISearchValid() {
    const response = await makeRequest('GET', '/api/search/ai?q=fintech&limit=3');
    
    if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    const issues = validateStandardResponse(response.data, 'AI Search');
    if (issues.length > 0) {
        throw new Error(`Response format issues: ${issues.join(', ')}`);
    }
    
    if (!response.data.data.query) {
        throw new Error('Missing query data');
    }
    
    if (!response.data.data.results || !Array.isArray(response.data.data.results)) {
        throw new Error('Missing or invalid results array');
    }
}

// Test 9: AI Search - Invalid Query (Too Short)
async function testAISearchInvalid() {
    const response = await makeRequest('GET', '/api/search/ai?q=ab');
    
    if (response.status !== 400) {
        throw new Error(`Expected status 400, got ${response.status}`);
    }
    
    const issues = validateStandardResponse(response.data, 'AI Search Invalid');
    if (issues.length > 0) {
        throw new Error(`Response format issues: ${issues.join(', ')}`);
    }
    
    if (response.data.error.code !== 'INVALID_QUERY') {
        throw new Error(`Expected error code INVALID_QUERY, got ${response.data.error.code}`);
    }
}

// Test 10: Network Stats
async function testNetworkStats() {
    const response = await makeRequest('GET', '/api/network/stats');
    
    if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    const issues = validateStandardResponse(response.data, 'Network Stats');
    if (issues.length > 0) {
        throw new Error(`Response format issues: ${issues.join(', ')}`);
    }
    
    if (!response.data.data.totalInvestors) {
        throw new Error('Missing totalInvestors data');
    }
}

// Test 11: Network Graph
async function testNetworkGraph() {
    const response = await makeRequest('GET', '/api/network/graph?limit=50&minConnections=1000');
    
    if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    const issues = validateStandardResponse(response.data, 'Network Graph');
    if (issues.length > 0) {
        throw new Error(`Response format issues: ${issues.join(', ')}`);
    }
    
    if (!response.data.data.nodes || !Array.isArray(response.data.data.nodes)) {
        throw new Error('Missing or invalid nodes array');
    }
}

// Test 12: 404 Error Handling
async function test404Handling() {
    const response = await makeRequest('GET', '/api/nonexistent/endpoint');
    
    if (response.status !== 404) {
        throw new Error(`Expected status 404, got ${response.status}`);
    }
    
    const issues = validateStandardResponse(response.data, '404 Error');
    if (issues.length > 0) {
        throw new Error(`Response format issues: ${issues.join(', ')}`);
    }
    
    if (response.data.error.code !== 'ENDPOINT_NOT_FOUND') {
        throw new Error(`Expected error code ENDPOINT_NOT_FOUND, got ${response.data.error.code}`);
    }
}

/**
 * Performance Analysis
 */
function analyzePerformance() {
    log('\n📊 Performance Analysis:', 'bold');
    
    const avgTime = results.performance.reduce((sum, p) => sum + p.duration, 0) / results.performance.length;
    logInfo(`Average response time: ${avgTime.toFixed(2)}ms`);
    
    const slowTests = results.performance.filter(p => p.duration > 500);
    if (slowTests.length > 0) {
        logWarning(`Slow tests (>500ms): ${slowTests.map(t => `${t.test} (${t.duration}ms)`).join(', ')}`);
        results.warnings += slowTests.length;
    }
    
    const fastTests = results.performance.filter(p => p.duration < 100);
    logSuccess(`Fast tests (<100ms): ${fastTests.length}`);
}

/**
 * Main Test Runner
 */
async function runAllTests() {
    log('🚀 Starting API Standardization Test Suite\n', 'bold');
    
    // Check if server is running
    try {
        await makeRequest('GET', '/health');
        logSuccess('API server is running and accessible\n');
    } catch (error) {
        logError('API server is not accessible. Please start the server first.');
        process.exit(1);
    }
    
    // Run all tests
    await runTest('Health Endpoint', testHealthEndpoint);
    await runTest('Investor Search - Valid', testInvestorSearchValid);
    await runTest('Investor Search - Invalid Parameters', testInvestorSearchInvalid);
    await runTest('Investor Detail - Valid ID', testInvestorDetailValid);
    await runTest('Investor Detail - Invalid ID', testInvestorDetailInvalid);
    await runTest('Firms List', testFirmsList);
    await runTest('Firm Detail', testFirmDetail);
    await runTest('AI Search - Valid Query', testAISearchValid);
    await runTest('AI Search - Invalid Query', testAISearchInvalid);
    await runTest('Network Stats', testNetworkStats);
    await runTest('Network Graph', testNetworkGraph);
    await runTest('404 Error Handling', test404Handling);
    
    // Analyze performance
    analyzePerformance();
    
    // Final summary
    log('\n📋 Test Summary:', 'bold');
    logInfo(`Total tests: ${results.total}`);
    logSuccess(`Passed: ${results.passed}`);
    if (results.failed > 0) {
        logError(`Failed: ${results.failed}`);
    }
    if (results.warnings > 0) {
        logWarning(`Warnings: ${results.warnings}`);
    }
    
    const successRate = ((results.passed / results.total) * 100).toFixed(1);
    
    if (results.failed === 0) {
        log(`\n🎉 All tests passed! Success rate: ${successRate}%`, 'green');
        log('✅ API standardization is complete and working correctly!', 'green');
    } else {
        log(`\n💥 Some tests failed. Success rate: ${successRate}%`, 'red');
        log('❌ Please review and fix the failing tests.', 'red');
        process.exit(1);
    }
}

// Run the test suite
if (require.main === module) {
    runAllTests().catch(error => {
        logError(`Test suite failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = {
    runAllTests,
    makeRequest,
    validateStandardResponse,
    BASE_URL
};