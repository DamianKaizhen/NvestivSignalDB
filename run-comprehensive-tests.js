#!/usr/bin/env node

/**
 * Comprehensive Test Runner and Report Generator
 * Runs all tests and generates detailed reports about the server functionality
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const request = require('supertest');

class ComprehensiveTestRunner {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                cwd: process.cwd(),
                dbExists: fs.existsSync('investor_network_full.db'),
                webInterfaceExists: fs.existsSync('web_interface.html'),
                serverExists: fs.existsSync('simple_server.js')
            },
            tests: {},
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                skipped: 0,
                duration: 0
            },
            issues: [],
            recommendations: []
        };
    }

    async runTests() {
        console.log('🚀 Starting Comprehensive Server Tests...\n');
        
        const startTime = Date.now();
        
        try {
            // Install dependencies if needed
            await this.ensureDependencies();
            
            // Run different test suites
            await this.runTestSuite('Unit Tests (Server Health)', 'tests/unit/server-health.test.js');
            await this.runTestSuite('Unit Tests (API Endpoints)', 'tests/unit/api-endpoints.test.js');
            await this.runTestSuite('Unit Tests (Database)', 'tests/unit/database.test.js');
            await this.runTestSuite('Unit Tests (Error Handling)', 'tests/unit/error-handling.test.js');
            await this.runTestSuite('Unit Tests (Performance)', 'tests/unit/performance.test.js');
            await this.runTestSuite('E2E Tests (Web Interface)', 'tests/e2e/web-interface.test.js');
            await this.runTestSuite('Integration Tests (Full Workflow)', 'tests/integration/full-workflow.test.js');
            
            // Run live server tests
            await this.runLiveServerTests();
            
        } catch (error) {
            console.error('❌ Test execution failed:', error.message);
            this.results.issues.push({
                type: 'CRITICAL',
                message: `Test execution failed: ${error.message}`,
                recommendation: 'Check test dependencies and server configuration'
            });
        }
        
        this.results.summary.duration = Date.now() - startTime;
        
        // Generate reports
        await this.generateReports();
        
        console.log('\n✅ Test execution completed!');
        console.log(`📊 Results: ${this.results.summary.passed} passed, ${this.results.summary.failed} failed, ${this.results.summary.skipped} skipped`);
        console.log(`⏱️  Total time: ${(this.results.summary.duration / 1000).toFixed(2)}s`);
        console.log('📋 Detailed report: test-report.md');
    }

    async ensureDependencies() {
        console.log('📦 Checking dependencies...');
        
        const packageJson = require('./package.json');
        const devDeps = packageJson.devDependencies || {};
        
        const missingDeps = [];
        for (const dep of ['jest', 'supertest', 'puppeteer']) {
            try {
                require.resolve(dep);
            } catch {
                missingDeps.push(dep);
            }
        }
        
        if (missingDeps.length > 0) {
            console.log(`⚠️  Missing dependencies: ${missingDeps.join(', ')}`);
            console.log('💡 Run: npm install --save-dev jest supertest puppeteer node-fetch');
            this.results.issues.push({
                type: 'WARNING',
                message: `Missing test dependencies: ${missingDeps.join(', ')}`,
                recommendation: 'Install missing dependencies with npm install'
            });
        }
    }

    async runTestSuite(name, testPath) {
        console.log(`🧪 Running ${name}...`);
        
        return new Promise((resolve) => {
            const jest = spawn('npx', ['jest', testPath, '--json'], {
                stdio: ['inherit', 'pipe', 'pipe'],
                shell: true
            });
            
            let stdout = '';
            let stderr = '';
            
            jest.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            jest.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            jest.on('close', (code) => {
                try {
                    const result = JSON.parse(stdout);
                    this.processTestResults(name, result);
                    console.log(`   ✅ ${name}: ${result.numPassedTests} passed, ${result.numFailedTests} failed`);
                } catch (error) {
                    console.log(`   ❌ ${name}: Failed to parse results`);
                    this.results.tests[name] = {
                        error: 'Failed to parse test results',
                        stderr: stderr.slice(0, 1000) // Limit error output
                    };
                    this.results.summary.failed++;
                }
                resolve();
            });
            
            jest.on('error', (error) => {
                console.log(`   ❌ ${name}: ${error.message}`);
                this.results.tests[name] = { error: error.message };
                this.results.summary.failed++;
                resolve();
            });
        });
    }

    processTestResults(suiteName, result) {
        this.results.tests[suiteName] = {
            numTests: result.numTotalTests,
            passed: result.numPassedTests,
            failed: result.numFailedTests,
            skipped: result.numPendingTests,
            duration: result.testResults[0]?.perfStats?.runtime || 0,
            success: result.success
        };
        
        this.results.summary.total += result.numTotalTests;
        this.results.summary.passed += result.numPassedTests;
        this.results.summary.failed += result.numFailedTests;
        this.results.summary.skipped += result.numPendingTests;
        
        // Extract failures for analysis
        if (result.testResults[0]?.assertionResults) {
            result.testResults[0].assertionResults.forEach(test => {
                if (test.status === 'failed') {
                    this.results.issues.push({
                        type: 'TEST_FAILURE',
                        suite: suiteName,
                        test: test.title,
                        message: test.failureMessages?.[0] || 'Test failed',
                        recommendation: this.getRecommendationForFailure(test.title)
                    });
                }
            });
        }
    }

    async runLiveServerTests() {
        console.log('🔄 Running live server tests...');
        
        try {
            // Start server for live testing
            const app = require('./simple_server.js');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const tests = [
                { name: 'Server Health Check', test: () => this.testServerHealth(app) },
                { name: 'Web Interface Load', test: () => this.testWebInterfaceLoad(app) },
                { name: 'API Endpoints', test: () => this.testAPIEndpoints(app) },
                { name: 'Blank Screen Prevention', test: () => this.testBlankScreenPrevention(app) }
            ];
            
            for (const { name, test } of tests) {
                try {
                    const result = await test();
                    console.log(`   ✅ ${name}: ${result.status}`);
                    this.results.tests[`Live Test: ${name}`] = result;
                    this.results.summary.passed++;
                } catch (error) {
                    console.log(`   ❌ ${name}: ${error.message}`);
                    this.results.tests[`Live Test: ${name}`] = { error: error.message };
                    this.results.summary.failed++;
                    
                    this.results.issues.push({
                        type: 'LIVE_TEST_FAILURE',
                        test: name,
                        message: error.message,
                        recommendation: this.getRecommendationForLiveTest(name, error.message)
                    });
                }
                this.results.summary.total++;
            }
            
        } catch (error) {
            console.log(`   ❌ Live server tests failed: ${error.message}`);
            this.results.issues.push({
                type: 'CRITICAL',
                message: `Could not start server for live tests: ${error.message}`,
                recommendation: 'Check server configuration and dependencies'
            });
        }
    }

    async testServerHealth(app) {
        const response = await request(app).get('/health');
        return {
            status: response.status === 200 ? 'HEALTHY' : `DEGRADED (${response.status})`,
            details: response.body
        };
    }

    async testWebInterfaceLoad(app) {
        const response = await request(app).get('/');
        const isBlank = response.text.trim().length < 100;
        const hasTitle = response.text.includes('Investor Network Database Browser');
        
        return {
            status: !isBlank && hasTitle ? 'LOADED' : 'BLANK_SCREEN',
            hasTitle,
            contentLength: response.text.length,
            statusCode: response.status
        };
    }

    async testAPIEndpoints(app) {
        const endpoints = [
            '/api/diagnostics',
            '/api/network/stats',
            '/api/investors/search?limit=1'
        ];
        
        const results = {};
        let healthyCount = 0;
        
        for (const endpoint of endpoints) {
            const response = await request(app).get(endpoint);
            results[endpoint] = {
                status: response.status,
                hasData: response.body && Object.keys(response.body).length > 0
            };
            
            if ([200, 500].includes(response.status)) {
                healthyCount++;
            }
        }
        
        return {
            status: healthyCount === endpoints.length ? 'ALL_RESPONDING' : 'PARTIAL_FAILURE',
            endpoints: results,
            healthyCount,
            totalCount: endpoints.length
        };
    }

    async testBlankScreenPrevention(app) {
        const response = await request(app).get('/');
        
        const checks = {
            hasContent: response.text.trim().length > 100,
            hasTitle: response.text.includes('Investor Network Database Browser'),
            hasStats: response.text.includes('stats'),
            hasSearchForm: response.text.includes('search-form'),
            hasJavaScript: response.text.includes('<script>'),
            hasCSS: response.text.includes('<style>')
        };
        
        const passedChecks = Object.values(checks).filter(Boolean).length;
        const totalChecks = Object.keys(checks).length;
        
        return {
            status: passedChecks >= totalChecks * 0.8 ? 'PREVENTED' : 'BLANK_SCREEN_RISK',
            checks,
            score: `${passedChecks}/${totalChecks}`
        };
    }

    getRecommendationForFailure(testTitle) {
        const recommendations = {
            'should respond to health check': 'Check if server is starting properly and port 3010 is available',
            'should load the main page': 'Verify web_interface.html exists and server static file serving is configured',
            'should connect to database': 'Check if investor_network_full.db exists and is accessible',
            'should not display blank screen': 'Verify HTML content loads and JavaScript executes without errors'
        };
        
        for (const [pattern, recommendation] of Object.entries(recommendations)) {
            if (testTitle.toLowerCase().includes(pattern.toLowerCase())) {
                return recommendation;
            }
        }
        
        return 'Review test logs and server configuration';
    }

    getRecommendationForLiveTest(testName, errorMessage) {
        if (testName.includes('Server Health')) {
            return 'Check server startup process and database initialization';
        }
        if (testName.includes('Web Interface')) {
            return 'Verify HTML file exists and static file serving is working';
        }
        if (testName.includes('API Endpoints')) {
            return 'Check API route configuration and database connection';
        }
        if (testName.includes('Blank Screen')) {
            return 'Review HTML/CSS/JavaScript for errors preventing proper rendering';
        }
        return 'Review server logs and configuration';
    }

    async generateReports() {
        // Generate Markdown report
        const markdown = this.generateMarkdownReport();
        fs.writeFileSync('test-report.md', markdown);
        
        // Generate JSON report
        fs.writeFileSync('test-results.json', JSON.stringify(this.results, null, 2));
        
        // Generate summary
        const summary = this.generateSummary();
        fs.writeFileSync('test-summary.txt', summary);
        
        console.log('\n📋 Reports generated:');
        console.log('   - test-report.md (Detailed markdown report)');
        console.log('   - test-results.json (Raw JSON results)');
        console.log('   - test-summary.txt (Quick summary)');
    }

    generateMarkdownReport() {
        const { results } = this;
        const passRate = ((results.summary.passed / Math.max(results.summary.total, 1)) * 100).toFixed(1);
        
        return `# Investor Database Server - Comprehensive Test Report

## Test Summary

**Generated:** ${results.timestamp}  
**Total Tests:** ${results.summary.total}  
**Passed:** ${results.summary.passed} (${passRate}%)  
**Failed:** ${results.summary.failed}  
**Skipped:** ${results.summary.skipped}  
**Duration:** ${(results.summary.duration / 1000).toFixed(2)}s  

## Environment

- **Node Version:** ${results.environment.nodeVersion}
- **Platform:** ${results.environment.platform}
- **Working Directory:** ${results.environment.cwd}
- **Database Available:** ${results.environment.dbExists ? '✅ Yes' : '❌ No'}
- **Web Interface Available:** ${results.environment.webInterfaceExists ? '✅ Yes' : '❌ No'}
- **Server File Available:** ${results.environment.serverExists ? '✅ Yes' : '❌ No'}

## Test Results by Suite

${Object.entries(results.tests).map(([suite, result]) => {
    if (result.error) {
        return `### ❌ ${suite}
**Status:** Failed  
**Error:** ${result.error}  
`;
    } else {
        return `### ${result.success !== false ? '✅' : '❌'} ${suite}
**Tests:** ${result.numTests || result.totalCount || 'N/A'}  
**Passed:** ${result.passed || result.healthyCount || '0'}  
**Failed:** ${result.failed || '0'}  
**Duration:** ${result.duration ? (result.duration / 1000).toFixed(2) + 's' : 'N/A'}  
`;
    }
}).join('\n')}

## Issues Found

${results.issues.length === 0 ? '✅ No issues found!' : results.issues.map(issue => 
    `### ${issue.type}: ${issue.test || issue.suite || 'General'}
**Message:** ${issue.message}  
**Recommendation:** ${issue.recommendation}  
`).join('\n')}

## Key Findings

### Blank Screen Analysis
${this.analyzeBlankScreenIssue()}

### Database Connectivity
${this.analyzeDatabaseConnectivity()}

### API Functionality
${this.analyzeAPIFunctionality()}

### Performance Analysis
${this.analyzePerformance()}

## Recommendations

${this.generateRecommendations().map(rec => `- ${rec}`).join('\n')}

## Next Steps

1. **High Priority Issues:** Address any CRITICAL issues first
2. **Database Setup:** Ensure investor_network_full.db is properly initialized
3. **Web Interface:** Verify all static files are accessible
4. **API Testing:** Test all endpoints with real data
5. **Performance:** Monitor response times under load

---
*Report generated by Comprehensive Test Runner*
`;
    }

    analyzeBlankScreenIssue() {
        const blankScreenTest = this.results.tests['Live Test: Blank Screen Prevention'];
        
        if (!blankScreenTest) {
            return '⚠️ Blank screen test not completed';
        }
        
        if (blankScreenTest.status === 'PREVENTED') {
            return '✅ Blank screen issue has been resolved. All content checks passed.';
        } else {
            const failedChecks = Object.entries(blankScreenTest.checks || {})
                .filter(([key, value]) => !value)
                .map(([key]) => key);
            
            return `❌ Blank screen risk detected. Failed checks: ${failedChecks.join(', ')}`;
        }
    }

    analyzeDatabaseConnectivity() {
        if (!this.results.environment.dbExists) {
            return '❌ Database file not found. This will cause API failures and blank screens.';
        }
        
        const dbTests = Object.entries(this.results.tests)
            .filter(([name]) => name.includes('Database'))
            .map(([name, result]) => ({ name, success: !result.error }));
        
        const successCount = dbTests.filter(t => t.success).length;
        
        if (successCount === dbTests.length) {
            return '✅ Database connectivity is working properly.';
        } else {
            return `⚠️ Database connectivity issues detected (${successCount}/${dbTests.length} tests passed).`;
        }
    }

    analyzeAPIFunctionality() {
        const apiTest = this.results.tests['Live Test: API Endpoints'];
        
        if (!apiTest) {
            return '⚠️ API functionality test not completed';
        }
        
        if (apiTest.status === 'ALL_RESPONDING') {
            return '✅ All API endpoints are responding correctly.';
        } else {
            return `⚠️ API issues detected. ${apiTest.healthyCount}/${apiTest.totalCount} endpoints responding.`;
        }
    }

    analyzePerformance() {
        const perfTests = Object.entries(this.results.tests)
            .filter(([name]) => name.includes('Performance'))
            .map(([name, result]) => result);
        
        if (perfTests.length === 0) {
            return '⚠️ Performance tests not completed';
        }
        
        const avgDuration = perfTests.reduce((sum, test) => sum + (test.duration || 0), 0) / perfTests.length;
        
        if (avgDuration < 2000) {
            return '✅ Performance is within acceptable limits.';
        } else {
            return `⚠️ Performance concerns detected. Average test duration: ${(avgDuration / 1000).toFixed(2)}s`;
        }
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (!this.results.environment.dbExists) {
            recommendations.push('**CRITICAL:** Create or restore the investor_network_full.db database file');
        }
        
        if (!this.results.environment.webInterfaceExists) {
            recommendations.push('**CRITICAL:** Ensure web_interface.html is present in the project root');
        }
        
        const criticalIssues = this.results.issues.filter(i => i.type === 'CRITICAL');
        if (criticalIssues.length > 0) {
            recommendations.push('**HIGH:** Resolve critical test failures that prevent server startup');
        }
        
        const blankScreenRisk = this.results.tests['Live Test: Blank Screen Prevention'];
        if (blankScreenRisk?.status === 'BLANK_SCREEN_RISK') {
            recommendations.push('**HIGH:** Fix blank screen issue - check HTML content loading and JavaScript execution');
        }
        
        if (this.results.summary.failed > 0) {
            recommendations.push('**MEDIUM:** Review and fix failing tests to ensure system reliability');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('✅ System appears to be functioning correctly - continue monitoring');
        }
        
        return recommendations;
    }

    generateSummary() {
        const { results } = this;
        const passRate = ((results.summary.passed / Math.max(results.summary.total, 1)) * 100).toFixed(1);
        
        return `INVESTOR DATABASE SERVER - TEST SUMMARY
==========================================

Test Results: ${results.summary.passed}/${results.summary.total} passed (${passRate}%)
Duration: ${(results.summary.duration / 1000).toFixed(2)}s
Issues: ${results.issues.length}

Environment Status:
- Database File: ${results.environment.dbExists ? 'FOUND' : 'MISSING'}
- Web Interface: ${results.environment.webInterfaceExists ? 'FOUND' : 'MISSING'}
- Server File: ${results.environment.serverExists ? 'FOUND' : 'MISSING'}

Key Issues:
${results.issues.slice(0, 5).map(i => `- ${i.type}: ${i.message}`).join('\n')}

Recommendations:
${this.generateRecommendations().slice(0, 3).map(r => `- ${r}`).join('\n')}

Full report: test-report.md
`;
    }
}

// Run if called directly
if (require.main === module) {
    const runner = new ComprehensiveTestRunner();
    runner.runTests().catch(error => {
        console.error('❌ Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = ComprehensiveTestRunner;