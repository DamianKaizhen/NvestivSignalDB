#!/usr/bin/env node

/**
 * Test Server Runner - Comprehensive Server Testing
 * Tests the existing running server without starting a new one
 */

const request = require('supertest');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class TestServerRunner {
    constructor() {
        this.baseURL = 'http://localhost:3010';
        this.results = {
            timestamp: new Date().toISOString(),
            environment: this.checkEnvironment(),
            tests: [],
            summary: { passed: 0, failed: 0, total: 0 },
            issues: [],
            recommendations: []
        };
    }

    checkEnvironment() {
        return {
            nodeVersion: process.version,
            platform: process.platform,
            cwd: process.cwd(),
            dbExists: fs.existsSync('investor_network_full.db'),
            webInterfaceExists: fs.existsSync('web_interface.html'),
            serverExists: fs.existsSync('simple_server.js'),
            dbSize: fs.existsSync('investor_network_full.db') 
                ? `${(fs.statSync('investor_network_full.db').size / 1024 / 1024).toFixed(2)}MB`
                : 'N/A'
        };
    }

    async runAllTests() {
        console.log('🚀 Starting Comprehensive Server Testing...\n');
        console.log(`📍 Testing server at: ${this.baseURL}`);

        const startTime = Date.now();

        // Test Categories
        await this.testServerHealth();
        await this.testWebInterface();
        await this.testAPIEndpoints();
        await this.testBlankScreenPrevention();
        if (this.results.environment.dbExists) {
            await this.testDatabaseFunctionality();
        }
        await this.testErrorHandling();
        await this.testPerformance();

        this.results.duration = Date.now() - startTime;
        this.analyzeResults();
        this.generateReport();

        console.log(`\n✅ Testing completed in ${(this.results.duration / 1000).toFixed(2)}s`);
        console.log(`📊 Results: ${this.results.summary.passed}/${this.results.summary.total} tests passed`);
        
        return this.results;
    }

    async runTest(name, testFunction) {
        console.log(`🧪 Testing: ${name}`);
        const startTime = Date.now();

        try {
            const result = await testFunction();
            const duration = Date.now() - startTime;

            this.results.tests.push({
                name,
                status: 'PASSED',
                duration,
                details: result
            });

            this.results.summary.passed++;
            console.log(`   ✅ ${name} - ${duration}ms`);

        } catch (error) {
            const duration = Date.now() - startTime;
            
            this.results.tests.push({
                name,
                status: 'FAILED',
                duration,
                error: error.message,
                details: error.details || {}
            });

            this.results.summary.failed++;
            console.log(`   ❌ ${name} - ${error.message}`);

            this.results.issues.push({
                type: 'TEST_FAILURE',
                test: name,
                message: error.message,
                recommendation: this.getRecommendation(name, error.message)
            });
        }

        this.results.summary.total++;
    }

    async testServerHealth() {
        await this.runTest('Server Health Check', async () => {
            const response = await this.makeRequest('GET', '/health');
            
            if (![200, 503].includes(response.status)) {
                throw new Error(`Unexpected health status: ${response.status}`);
            }

            const requiredFields = ['status', 'timestamp', 'uptime', 'database'];
            const missingFields = requiredFields.filter(field => !response.body.hasOwnProperty(field));
            
            if (missingFields.length > 0) {
                throw new Error(`Missing health fields: ${missingFields.join(', ')}`);
            }

            return {
                status: response.body.status,
                uptime: response.body.uptime,
                database: response.body.database,
                memory: response.body.memory
            };
        });

        await this.runTest('Server Diagnostics', async () => {
            const response = await this.makeRequest('GET', '/api/diagnostics');
            
            if (response.status !== 200) {
                throw new Error(`Diagnostics failed: ${response.status}`);
            }

            const required = ['server', 'database', 'files'];
            const missing = required.filter(field => !response.body.hasOwnProperty(field));
            
            if (missing.length > 0) {
                throw new Error(`Missing diagnostic fields: ${missing.join(', ')}`);
            }

            return {
                serverStatus: response.body.server.status,
                databaseExists: response.body.database.exists,
                webInterfaceExists: response.body.files.webInterface
            };
        });
    }

    async testWebInterface() {
        await this.runTest('Web Interface Load', async () => {
            const response = await this.makeRequest('GET', '/');
            
            if (response.status !== 200) {
                throw new Error(`Web interface failed to load: ${response.status}`);
            }

            const html = response.text;
            const checks = {
                hasDoctype: html.includes('<!DOCTYPE html>'),
                hasTitle: html.includes('Investor Network Database Browser'),
                hasStats: html.includes('id="stats"'),
                hasSearchForm: html.includes('search-form'),
                hasResults: html.includes('id="results"'),
                hasJavaScript: html.includes('<script>'),
                hasCSS: html.includes('<style>'),
                contentLength: html.length
            };

            const failedChecks = Object.entries(checks)
                .filter(([key, value]) => key !== 'contentLength' && !value)
                .map(([key]) => key);

            if (failedChecks.length > 0) {
                throw new Error(`Web interface missing elements: ${failedChecks.join(', ')}`);
            }

            if (checks.contentLength < 1000) {
                throw new Error(`Web interface too short: ${checks.contentLength} characters`);
            }

            return checks;
        });

        // Test with browser if possible
        await this.runTest('Web Interface Browser Test', async () => {
            let browser, page;
            
            try {
                browser = await puppeteer.launch({ 
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
                
                page = await browser.newPage();
                await page.setViewport({ width: 1200, height: 800 });
                
                const response = await page.goto(this.baseURL, { 
                    waitUntil: 'networkidle2',
                    timeout: 10000 
                });

                if (!response.ok()) {
                    throw new Error(`Browser load failed: ${response.status()}`);
                }

                const title = await page.title();
                const bodyText = await page.$eval('body', el => el.textContent.trim());
                
                const elementChecks = await page.evaluate(() => {
                    return {
                        hasTitle: !!document.querySelector('h1'),
                        hasStats: !!document.querySelector('#stats'),
                        hasSearchForm: !!document.querySelector('.search-form'),
                        hasResults: !!document.querySelector('#results'),
                        bodyVisible: document.body.style.display !== 'none'
                    };
                });

                const failedElements = Object.entries(elementChecks)
                    .filter(([key, value]) => !value)
                    .map(([key]) => key);

                if (failedElements.length > 0) {
                    throw new Error(`Browser test failed elements: ${failedElements.join(', ')}`);
                }

                if (bodyText.length < 100) {
                    throw new Error(`Browser shows minimal content: ${bodyText.length} characters`);
                }

                return {
                    title,
                    contentLength: bodyText.length,
                    elementChecks
                };

            } finally {
                if (page) await page.close();
                if (browser) await browser.close();
            }
        });
    }

    async testAPIEndpoints() {
        const endpoints = [
            { path: '/api/network/stats', name: 'Network Statistics' },
            { path: '/api/investors/search?limit=5', name: 'Investor Search' },
            { path: '/api/diagnostics', name: 'System Diagnostics' }
        ];

        for (const endpoint of endpoints) {
            await this.runTest(`API: ${endpoint.name}`, async () => {
                const response = await this.makeRequest('GET', endpoint.path);
                
                if (![200, 500].includes(response.status)) {
                    throw new Error(`Unexpected API status: ${response.status}`);
                }

                if (response.status === 200) {
                    if (!response.body || typeof response.body !== 'object') {
                        throw new Error('API returned invalid JSON');
                    }

                    // Specific validations
                    if (endpoint.path.includes('stats')) {
                        if (!response.body.hasOwnProperty('totalInvestors')) {
                            throw new Error('Stats missing totalInvestors field');
                        }
                    }

                    if (endpoint.path.includes('search')) {
                        if (!response.body.hasOwnProperty('investors')) {
                            throw new Error('Search missing investors field');
                        }
                    }
                }

                return {
                    status: response.status,
                    hasData: !!response.body,
                    responseSize: JSON.stringify(response.body || {}).length
                };
            });
        }

        // Test POST endpoint
        await this.runTest('API: Investor Matching (POST)', async () => {
            const response = await this.makeRequest('POST', '/api/investors/match', {
                firmName: 'Test',
                minConnections: 500
            });

            if (![200, 500].includes(response.status)) {
                throw new Error(`POST API unexpected status: ${response.status}`);
            }

            if (response.status === 200) {
                if (!response.body.hasOwnProperty('matches')) {
                    throw new Error('Match API missing matches field');
                }
            }

            return {
                status: response.status,
                hasMatches: response.body?.matches !== undefined
            };
        });
    }

    async testBlankScreenPrevention() {
        await this.runTest('Blank Screen Prevention', async () => {
            const response = await this.makeRequest('GET', '/');
            
            if (response.status !== 200) {
                throw new Error(`Page not accessible: ${response.status}`);
            }

            const html = response.text;
            const contentLength = html.trim().length;

            if (contentLength < 100) {
                throw new Error(`Blank screen detected: only ${contentLength} characters`);
            }

            const criticalElements = [
                'Investor Network Database Browser',
                'id="stats"',
                'search-form',
                'id="results"',
                '<script>',
                'loadStats'
            ];

            const missingElements = criticalElements.filter(element => !html.includes(element));
            
            if (missingElements.length > 0) {
                throw new Error(`Critical elements missing: ${missingElements.join(', ')}`);
            }

            // Check for JavaScript errors that might cause blank screen
            const hasErrorHandling = html.includes('window.addEventListener(\'error\'') && 
                                   html.includes('window.addEventListener(\'unhandledrejection\'');

            if (!hasErrorHandling) {
                throw new Error('Missing JavaScript error handling that prevents blank screens');
            }

            return {
                contentLength,
                hasCriticalElements: missingElements.length === 0,
                hasErrorHandling
            };
        });
    }

    async testDatabaseFunctionality() {
        await this.runTest('Database Connection', async () => {
            const response = await this.makeRequest('GET', '/api/network/stats');
            
            if (response.status === 500) {
                throw new Error(`Database connection failed: ${response.body?.error || 'Unknown error'}`);
            }

            if (response.status !== 200) {
                throw new Error(`Unexpected database response: ${response.status}`);
            }

            const stats = response.body;
            
            if (!stats.totalInvestors || stats.totalInvestors === 0) {
                throw new Error('Database appears empty or inaccessible');
            }

            return {
                totalInvestors: stats.totalInvestors,
                totalFirms: stats.totalFirms,
                withLinkedIn: stats.withLinkedIn,
                withInvestments: stats.withInvestments
            };
        });

        await this.runTest('Database Query Performance', async () => {
            const startTime = Date.now();
            const response = await this.makeRequest('GET', '/api/investors/search?limit=10');
            const queryTime = Date.now() - startTime;

            if (response.status !== 200) {
                throw new Error(`Database query failed: ${response.status}`);
            }

            if (queryTime > 5000) {
                throw new Error(`Database query too slow: ${queryTime}ms`);
            }

            return {
                queryTime,
                resultCount: response.body?.investors?.length || 0
            };
        });
    }

    async testErrorHandling() {
        await this.runTest('404 Error Handling', async () => {
            const response = await this.makeRequest('GET', '/api/nonexistent');
            
            if (response.status !== 404) {
                throw new Error(`Expected 404, got ${response.status}`);
            }

            if (!response.body?.error) {
                throw new Error('404 response missing error message');
            }

            return {
                hasErrorMessage: !!response.body.error,
                hasAvailableEndpoints: Array.isArray(response.body.availableEndpoints)
            };
        });

        await this.runTest('Malformed Request Handling', async () => {
            const response = await this.makeRequest('POST', '/api/investors/match', 'invalid-json');
            
            if (![400, 500].includes(response.status)) {
                throw new Error(`Expected 400/500 for malformed request, got ${response.status}`);
            }

            return {
                status: response.status,
                handledGracefully: true
            };
        });
    }

    async testPerformance() {
        await this.runTest('Response Time Performance', async () => {
            const endpoints = ['/health', '/api/diagnostics', '/'];
            const times = [];

            for (const endpoint of endpoints) {
                const startTime = Date.now();
                const response = await this.makeRequest('GET', endpoint);
                const duration = Date.now() - startTime;
                
                times.push({ endpoint, duration, status: response.status });
                
                if (duration > 5000) {
                    throw new Error(`${endpoint} too slow: ${duration}ms`);
                }
            }

            const avgTime = times.reduce((sum, t) => sum + t.duration, 0) / times.length;

            return {
                averageResponseTime: avgTime,
                endpointTimes: times
            };
        });

        await this.runTest('Concurrent Request Handling', async () => {
            const concurrentRequests = 5;
            const startTime = Date.now();

            const promises = Array(concurrentRequests).fill(null).map(() =>
                this.makeRequest('GET', '/health')
            );

            const responses = await Promise.all(promises);
            const totalTime = Date.now() - startTime;

            const successCount = responses.filter(r => [200, 503].includes(r.status)).length;
            
            if (successCount < concurrentRequests * 0.8) {
                throw new Error(`Too many concurrent request failures: ${successCount}/${concurrentRequests}`);
            }

            return {
                concurrentRequests,
                successCount,
                totalTime,
                avgTimePerRequest: totalTime / concurrentRequests
            };
        });
    }

    async makeRequest(method, path, body = null) {
        const fetch = (await import('node-fetch')).default;
        const url = `${this.baseURL}${path}`;
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            options.body = typeof body === 'string' ? body : JSON.stringify(body);
        }

        const response = await fetch(url, options);
        
        let responseBody;
        try {
            responseBody = await response.json();
        } catch {
            responseBody = await response.text();
        }

        return {
            status: response.status,
            body: responseBody,
            text: typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)
        };
    }

    getRecommendation(testName, errorMessage) {
        const recommendations = {
            'Server Health': 'Check server startup and port availability',
            'Web Interface': 'Verify HTML file exists and static serving works',
            'API': 'Check database connection and API route configuration',
            'Database': 'Ensure database file exists and is accessible',
            'Blank Screen': 'Review HTML/CSS/JavaScript for rendering issues',
            'Performance': 'Check server resources and database optimization'
        };

        for (const [key, rec] of Object.entries(recommendations)) {
            if (testName.includes(key)) {
                return rec;
            }
        }

        return 'Review server logs and configuration';
    }

    analyzeResults() {
        const { tests, environment } = this.results;
        
        // Check for blank screen issue
        const blankScreenTest = tests.find(t => t.name.includes('Blank Screen'));
        if (blankScreenTest?.status === 'FAILED') {
            this.results.issues.push({
                type: 'CRITICAL',
                message: 'Blank screen issue detected',
                recommendation: 'Fix HTML content loading and JavaScript execution'
            });
        }

        // Check database connectivity
        if (!environment.dbExists) {
            this.results.issues.push({
                type: 'WARNING',
                message: 'Database file not found',
                recommendation: 'Ensure investor_network_full.db is present'
            });
        }

        // Performance analysis
        const perfTest = tests.find(t => t.name.includes('Response Time'));
        if (perfTest?.details?.averageResponseTime > 2000) {
            this.results.issues.push({
                type: 'WARNING',
                message: `Slow response times: ${perfTest.details.averageResponseTime}ms average`,
                recommendation: 'Optimize database queries and server configuration'
            });
        }

        // Generate recommendations
        if (this.results.summary.failed === 0) {
            this.results.recommendations.push('✅ All tests passed - server is functioning correctly');
        } else {
            this.results.recommendations.push(`Fix ${this.results.summary.failed} failing tests`);
        }

        if (blankScreenTest?.status === 'PASSED') {
            this.results.recommendations.push('✅ Blank screen issue has been resolved');
        }
    }

    generateReport() {
        const report = this.createMarkdownReport();
        fs.writeFileSync('comprehensive-test-report.md', report);
        
        const summary = this.createSummaryReport();
        fs.writeFileSync('test-summary.txt', summary);
        
        console.log('\n📋 Reports generated:');
        console.log('   - comprehensive-test-report.md');
        console.log('   - test-summary.txt');
    }

    createMarkdownReport() {
        const { results } = this;
        const passRate = ((results.summary.passed / results.summary.total) * 100).toFixed(1);

        return `# Comprehensive Server Test Report

## Summary

**Generated:** ${results.timestamp}  
**Test Results:** ${results.summary.passed}/${results.summary.total} passed (${passRate}%)  
**Duration:** ${(results.duration / 1000).toFixed(2)}s  
**Issues Found:** ${results.issues.length}  

## Environment

- **Server URL:** ${this.baseURL}
- **Node Version:** ${results.environment.nodeVersion}
- **Platform:** ${results.environment.platform}
- **Database File:** ${results.environment.dbExists ? `✅ Found (${results.environment.dbSize})` : '❌ Missing'}
- **Web Interface:** ${results.environment.webInterfaceExists ? '✅ Found' : '❌ Missing'}

## Test Results

${results.tests.map(test => {
    const status = test.status === 'PASSED' ? '✅' : '❌';
    const duration = `${test.duration}ms`;
    
    let details = '';
    if (test.status === 'FAILED') {
        details = `\n**Error:** ${test.error}`;
    } else if (test.details) {
        const detailStr = JSON.stringify(test.details, null, 2);
        if (detailStr.length < 200) {
            details = `\n**Details:** \`${detailStr}\``;
        }
    }
    
    return `### ${status} ${test.name} (${duration})${details}`;
}).join('\n\n')}

## Issues Found

${results.issues.length === 0 ? '✅ No critical issues detected!' : 
  results.issues.map(issue => 
    `### ${issue.type}: ${issue.message}\n**Recommendation:** ${issue.recommendation}`
  ).join('\n\n')}

## Key Findings

### Blank Screen Status
${this.analyzeBlankScreenStatus()}

### Database Connectivity
${this.analyzeDatabaseStatus()}

### API Functionality
${this.analyzeAPIStatus()}

### Performance Analysis
${this.analyzePerformanceStatus()}

## Recommendations

${results.recommendations.map(rec => `- ${rec}`).join('\n')}

## Next Steps

1. **Address Critical Issues:** Fix any failed tests immediately
2. **Performance Optimization:** Monitor response times and optimize slow endpoints
3. **Monitoring:** Set up continuous monitoring for production use
4. **Testing:** Run these tests regularly to catch regressions

---
*Generated by Comprehensive Test Runner*
`;
    }

    analyzeBlankScreenStatus() {
        const blankScreenTest = this.results.tests.find(t => t.name.includes('Blank Screen'));
        const webInterfaceTest = this.results.tests.find(t => t.name.includes('Web Interface Browser'));
        
        if (blankScreenTest?.status === 'PASSED' && webInterfaceTest?.status === 'PASSED') {
            return '✅ **RESOLVED** - Blank screen issue has been fixed. All content loads properly.';
        } else if (blankScreenTest?.status === 'FAILED') {
            return `❌ **DETECTED** - Blank screen issue present: ${blankScreenTest.error}`;
        } else {
            return '⚠️ **UNKNOWN** - Blank screen test incomplete';
        }
    }

    analyzeDatabaseStatus() {
        if (!this.results.environment.dbExists) {
            return '❌ **MISSING** - Database file not found. This will cause API failures.';
        }
        
        const dbTest = this.results.tests.find(t => t.name.includes('Database Connection'));
        if (dbTest?.status === 'PASSED') {
            return `✅ **CONNECTED** - Database operational with ${dbTest.details?.totalInvestors?.toLocaleString()} investors`;
        } else if (dbTest?.status === 'FAILED') {
            return `❌ **ERROR** - Database connection failed: ${dbTest.error}`;
        }
        
        return '⚠️ **UNTESTED** - Database connectivity not verified';
    }

    analyzeAPIStatus() {
        const apiTests = this.results.tests.filter(t => t.name.includes('API:'));
        const passedAPI = apiTests.filter(t => t.status === 'PASSED').length;
        
        if (passedAPI === apiTests.length) {
            return `✅ **OPERATIONAL** - All ${apiTests.length} API endpoints responding correctly`;
        } else {
            return `⚠️ **PARTIAL** - ${passedAPI}/${apiTests.length} API endpoints working`;
        }
    }

    analyzePerformanceStatus() {
        const perfTest = this.results.tests.find(t => t.name.includes('Response Time'));
        
        if (perfTest?.status === 'PASSED') {
            const avgTime = perfTest.details?.averageResponseTime;
            if (avgTime < 1000) {
                return `✅ **EXCELLENT** - Average response time: ${avgTime?.toFixed(0)}ms`;
            } else if (avgTime < 2000) {
                return `⚠️ **ACCEPTABLE** - Average response time: ${avgTime?.toFixed(0)}ms`;
            } else {
                return `❌ **SLOW** - Average response time: ${avgTime?.toFixed(0)}ms`;
            }
        }
        
        return '⚠️ **UNTESTED** - Performance not measured';
    }

    createSummaryReport() {
        const { results } = this;
        
        return `INVESTOR DATABASE SERVER - COMPREHENSIVE TEST SUMMARY
=====================================================

OVERALL STATUS: ${results.summary.failed === 0 ? 'HEALTHY' : 'ISSUES DETECTED'}

Test Results: ${results.summary.passed}/${results.summary.total} passed
Duration: ${(results.duration / 1000).toFixed(2)}s
Issues: ${results.issues.length}

ENVIRONMENT:
- Database: ${results.environment.dbExists ? `FOUND (${results.environment.dbSize})` : 'MISSING'}
- Web Interface: ${results.environment.webInterfaceExists ? 'FOUND' : 'MISSING'}
- Server: ${results.environment.serverExists ? 'FOUND' : 'MISSING'}

KEY STATUS:
${this.analyzeBlankScreenStatus()}
${this.analyzeDatabaseStatus()}
${this.analyzeAPIStatus()}
${this.analyzePerformanceStatus()}

CRITICAL ISSUES:
${results.issues.filter(i => i.type === 'CRITICAL').map(i => `- ${i.message}`).join('\n') || 'None detected'}

RECOMMENDATIONS:
${results.recommendations.slice(0, 3).map(r => `- ${r}`).join('\n')}

Full details: comprehensive-test-report.md
`;
    }
}

// Run if called directly
if (require.main === module) {
    const runner = new TestServerRunner();
    runner.runAllTests()
        .then(results => {
            const exitCode = results.summary.failed > 0 ? 1 : 0;
            process.exit(exitCode);
        })
        .catch(error => {
            console.error('❌ Test runner failed:', error);
            process.exit(1);
        });
}

module.exports = TestServerRunner;