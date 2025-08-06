#!/usr/bin/env node

/**
 * Detailed API Endpoint Tester for Nvestiv Signal DB
 * This script performs in-depth testing of each API endpoint with detailed reporting
 */

const API_BASE = 'http://localhost:3010';

class DetailedAPITester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      endpoints: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: []
      }
    };
  }

  async log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    console.log(logMessage);
  }

  async testEndpoint(endpoint, expectedStatus = 200, description = '') {
    const test = {
      endpoint,
      description,
      startTime: Date.now(),
      expectedStatus
    };

    try {
      const fetch = (await import('node-fetch')).default;
      
      await this.log(`Testing ${endpoint} - ${description}`);
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        timeout: 10000
      });

      test.endTime = Date.now();
      test.responseTime = test.endTime - test.startTime;
      test.actualStatus = response.status;
      test.passed = response.status === expectedStatus;
      test.statusText = response.statusText;
      test.headers = Object.fromEntries(response.headers.entries());

      // Try to parse response body
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          test.data = await response.json();
        } else {
          test.textData = await response.text();
        }
      } catch (parseError) {
        test.parseError = parseError.message;
      }

      // Log result
      const status = test.passed ? '✅' : '❌';
      await this.log(`${status} ${endpoint}: ${test.actualStatus} (${test.responseTime}ms)`);
      
      if (test.data) {
        await this.log(`   Data keys: ${Object.keys(test.data).join(', ')}`);
        if (test.data.length !== undefined) {
          await this.log(`   Array length: ${test.data.length}`);
        }
      }

    } catch (error) {
      test.endTime = Date.now();
      test.responseTime = test.endTime - test.startTime;
      test.passed = false;
      test.error = error.message;
      
      await this.log(`❌ ${endpoint}: Error - ${error.message} (${test.responseTime}ms)`);
    }

    this.results.endpoints[endpoint] = test;
    this.results.summary.total++;
    if (test.passed) {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
    }

    return test;
  }

  async testHealthEndpoint() {
    await this.log('=== TESTING HEALTH ENDPOINT ===');
    
    const test = await this.testEndpoint('/health', 200, 'System health check');
    
    if (test.passed && test.data) {
      await this.log('Health endpoint analysis:');
      await this.log(`  Status: ${test.data.status}`);
      await this.log(`  Database connected: ${test.data.database?.status === 'connected'}`);
      await this.log(`  Total investors: ${test.data.database?.totalInvestors || 'unknown'}`);
      await this.log(`  Total firms: ${test.data.database?.totalFirms || 'unknown'}`);
      
      if (test.data.features) {
        await this.log(`  Features: ${Object.keys(test.data.features).join(', ')}`);
      }
    }
    
    return test;
  }

  async testNetworkStatsEndpoint() {
    await this.log('=== TESTING NETWORK STATS ENDPOINT ===');
    
    const test = await this.testEndpoint('/api/network/stats', 200, 'Network statistics');
    
    if (test.passed && test.data) {
      await this.log('Network stats analysis:');
      await this.log(`  Investors: ${test.data.investors || 'missing'}`);
      await this.log(`  Firms: ${test.data.firms || 'missing'}`);
      await this.log(`  Connections: ${test.data.connections || 'missing'}`);
      
      // Validate data reasonableness
      if (test.data.investors && test.data.investors > 30000) {
        await this.log('  ✅ Investor count looks reasonable');
      } else {
        await this.log('  ⚠️ Investor count seems low or missing');
        this.results.summary.warnings.push('Network stats investor count issue');
      }
    }
    
    return test;
  }

  async testInvestorSearchEndpoint() {
    await this.log('=== TESTING INVESTOR SEARCH ENDPOINT ===');
    
    const searchTerms = ['venture', 'fintech', 'healthcare', 'tech'];
    
    for (const term of searchTerms) {
      const endpoint = `/api/investors/search?q=${encodeURIComponent(term)}&limit=10`;
      const test = await this.testEndpoint(endpoint, 200, `Search for '${term}'`);
      
      if (test.passed && test.data) {
        if (Array.isArray(test.data)) {
          await this.log(`  ✅ Returned ${test.data.length} results for '${term}'`);
          
          if (test.data.length > 0) {
            const firstResult = test.data[0];
            await this.log(`  Sample result: ${firstResult.name || 'unknown'} (ID: ${firstResult.id || 'unknown'})`);
            
            // Validate result structure
            const requiredFields = ['id', 'name'];
            const missingFields = requiredFields.filter(field => !firstResult.hasOwnProperty(field));
            if (missingFields.length > 0) {
              await this.log(`  ⚠️ Missing fields: ${missingFields.join(', ')}`);
              this.results.summary.warnings.push(`Investor search missing fields: ${missingFields.join(', ')}`);
            }
          }
        } else {
          await this.log(`  ❌ Expected array, got ${typeof test.data}`);
          this.results.summary.warnings.push('Investor search not returning array');
        }
      }
    }
  }

  async testIndividualInvestorEndpoint() {
    await this.log('=== TESTING INDIVIDUAL INVESTOR ENDPOINT ===');
    
    // First get a valid investor ID from search
    const searchTest = await this.testEndpoint('/api/investors/search?q=venture&limit=1', 200, 'Get sample investor ID');
    
    if (searchTest.passed && searchTest.data && Array.isArray(searchTest.data) && searchTest.data.length > 0) {
      const investorId = searchTest.data[0].id;
      await this.log(`Using investor ID: ${investorId}`);
      
      const test = await this.testEndpoint(`/api/investors/${investorId}`, 200, `Get investor ${investorId}`);
      
      if (test.passed && test.data) {
        await this.log(`  ✅ Retrieved investor: ${test.data.name || 'unknown'}`);
        await this.log(`  Location: ${test.data.location || 'unknown'}`);
        await this.log(`  Firms: ${test.data.firms?.length || 0}`);
        await this.log(`  Investments: ${test.data.investments?.length || 0}`);
      }
    } else {
      await this.log('  ⚠️ Cannot test individual investor - no valid ID from search');
      // Test with a common ID that might exist
      await this.testEndpoint('/api/investors/1', 200, 'Test with ID 1');
    }
  }

  async testAISearchEndpoint() {
    await this.log('=== TESTING AI SEARCH ENDPOINT ===');
    
    const queries = [
      'fintech companies focused on payments',
      'sustainable technology investors',
      'healthcare innovation'
    ];
    
    for (const query of queries) {
      const endpoint = `/api/search/ai?q=${encodeURIComponent(query)}`;
      const test = await this.testEndpoint(endpoint, 200, `AI search: '${query}'`);
      
      if (test.passed && test.data) {
        await this.log(`  ✅ AI search returned results for '${query}'`);
        if (Array.isArray(test.data)) {
          await this.log(`  Results count: ${test.data.length}`);
        } else {
          await this.log(`  Result type: ${typeof test.data}`);
        }
      }
    }
  }

  async testFirmsEndpoint() {
    await this.log('=== TESTING FIRMS ENDPOINTS ===');
    
    // Test firms list
    await this.testEndpoint('/api/firms', 200, 'Get firms list');
    
    // Test firms search
    await this.testEndpoint('/api/firms/search?q=venture&limit=10', 200, 'Search firms');
    
    // Test firms analysis
    await this.testEndpoint('/api/firms/analysis', 200, 'Firms analysis');
  }

  async testDiagnosticsEndpoint() {
    await this.log('=== TESTING DIAGNOSTICS ENDPOINT ===');
    
    const test = await this.testEndpoint('/api/diagnostics', 200, 'System diagnostics');
    
    if (test.passed && test.data) {
      await this.log('Diagnostics analysis:');
      await this.log(`  Server status: ${test.data.server?.status || 'unknown'}`);
      await this.log(`  Database exists: ${test.data.database?.exists || 'unknown'}`);
      await this.log(`  Database size: ${test.data.database?.size || 'unknown'}`);
      await this.log(`  Files checked: ${Object.keys(test.data.files || {}).length}`);
    }
  }

  async testErrorHandling() {
    await this.log('=== TESTING ERROR HANDLING ===');
    
    // Test 404 endpoints
    await this.testEndpoint('/api/nonexistent', 404, 'Non-existent endpoint');
    
    // Test invalid parameters
    await this.testEndpoint('/api/investors/invalid-id', 400, 'Invalid investor ID');
    
    // Test malformed queries
    await this.testEndpoint('/api/investors/search?q=', 200, 'Empty search query');
  }

  async testPerformance() {
    await this.log('=== TESTING PERFORMANCE ===');
    
    const performanceTests = [
      { endpoint: '/health', description: 'Health check' },
      { endpoint: '/api/network/stats', description: 'Network stats' },
      { endpoint: '/api/investors/search?q=tech&limit=50', description: 'Large search' }
    ];
    
    for (const perfTest of performanceTests) {
      const test = await this.testEndpoint(perfTest.endpoint, 200, perfTest.description);
      
      if (test.responseTime > 5000) {
        await this.log(`  ⚠️ Slow response: ${test.responseTime}ms`);
        this.results.summary.warnings.push(`Slow response for ${perfTest.endpoint}: ${test.responseTime}ms`);
      } else if (test.responseTime > 2000) {
        await this.log(`  ⚠️ Moderate response time: ${test.responseTime}ms`);
      } else {
        await this.log(`  ✅ Good response time: ${test.responseTime}ms`);
      }
    }
  }

  async generateReport() {
    await this.log('=== GENERATING DETAILED REPORT ===');
    
    const report = [];
    report.push('# Detailed API Test Report - Nvestiv Signal DB');
    report.push('');
    report.push(`**Generated:** ${this.results.timestamp}`);
    report.push(`**Total Tests:** ${this.results.summary.total}`);
    report.push(`**Passed:** ${this.results.summary.passed}`);
    report.push(`**Failed:** ${this.results.summary.failed}`);
    report.push(`**Success Rate:** ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(2)}%`);
    report.push('');
    
    // Warnings
    if (this.results.summary.warnings.length > 0) {
      report.push('## Warnings');
      report.push('');
      this.results.summary.warnings.forEach(warning => {
        report.push(`- ⚠️ ${warning}`);
      });
      report.push('');
    }
    
    // Detailed endpoint results
    report.push('## Endpoint Test Results');
    report.push('');
    
    Object.entries(this.results.endpoints).forEach(([endpoint, test]) => {
      const status = test.passed ? '✅' : '❌';
      report.push(`### ${status} ${endpoint}`);
      report.push('');
      report.push(`- **Status:** ${test.actualStatus} ${test.statusText || ''}`);
      report.push(`- **Response Time:** ${test.responseTime}ms`);
      report.push(`- **Expected:** ${test.expectedStatus}`);
      report.push(`- **Passed:** ${test.passed ? 'Yes' : 'No'}`);
      
      if (test.error) {
        report.push(`- **Error:** ${test.error}`);
      }
      
      if (test.data) {
        report.push(`- **Data Type:** ${Array.isArray(test.data) ? 'Array' : typeof test.data}`);
        if (Array.isArray(test.data)) {
          report.push(`- **Array Length:** ${test.data.length}`);
        }
        if (typeof test.data === 'object' && !Array.isArray(test.data)) {
          report.push(`- **Object Keys:** ${Object.keys(test.data).join(', ')}`);
        }
      }
      
      report.push('');
    });
    
    // Recommendations
    report.push('## Recommendations');
    report.push('');
    
    const failedTests = Object.values(this.results.endpoints).filter(test => !test.passed);
    if (failedTests.length > 0) {
      report.push('### Failed Endpoints');
      report.push('');
      failedTests.forEach(test => {
        report.push(`- **${test.endpoint}:** ${test.error || `${test.actualStatus} ${test.statusText}`}`);
      });
      report.push('');
    }
    
    const slowTests = Object.values(this.results.endpoints).filter(test => test.responseTime > 2000);
    if (slowTests.length > 0) {
      report.push('### Performance Issues');
      report.push('');
      slowTests.forEach(test => {
        report.push(`- **${test.endpoint}:** ${test.responseTime}ms (slow)`);
      });
      report.push('');
    }
    
    const reportContent = report.join('\n');
    
    // Write report
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(__dirname, 'DETAILED-API-TEST-REPORT.md');
    fs.writeFileSync(reportPath, reportContent);
    
    // Write JSON results
    const jsonPath = path.join(__dirname, 'detailed-api-results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2));
    
    await this.log(`✅ Detailed report saved: ${reportPath}`);
    await this.log(`✅ JSON results saved: ${jsonPath}`);
    
    return { reportPath, jsonPath };
  }

  async run() {
    try {
      await this.log('🚀 Starting Detailed API Testing');
      await this.log('=' * 50);
      
      // Run all test suites
      await this.testHealthEndpoint();
      await this.testNetworkStatsEndpoint();
      await this.testInvestorSearchEndpoint();
      await this.testIndividualInvestorEndpoint();
      await this.testAISearchEndpoint();
      await this.testFirmsEndpoint();
      await this.testDiagnosticsEndpoint();
      await this.testErrorHandling();
      await this.testPerformance();
      
      // Generate report
      const reportInfo = await this.generateReport();
      
      await this.log('=' * 50);
      await this.log('🎉 Detailed API Testing Completed!');
      await this.log(`📊 Success Rate: ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(2)}%`);
      await this.log(`📄 Report: ${reportInfo.reportPath}`);
      
      return this.results;
    } catch (error) {
      await this.log(`❌ Testing failed: ${error.message}`, 'error');
      throw error;
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new DetailedAPITester();
  tester.run()
    .then(results => {
      process.exit(results.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Testing failed:', error);
      process.exit(1);
    });
}

module.exports = DetailedAPITester;