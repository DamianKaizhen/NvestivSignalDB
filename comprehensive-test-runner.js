#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Nvestiv Signal DB
 * This script orchestrates all testing phases with proper reporting
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class NvestivTestRunner {
  constructor() {
    this.testResults = {
      timestamp: new Date().toISOString(),
      phases: {},
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        warnings: [],
        errors: [],
        recommendations: []
      }
    };
    
    this.baseUrls = {
      api: 'http://localhost:3010',
      frontend: 'http://localhost:3013'
    };
  }

  async log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    console.log(logMessage);
    
    // Also write to log file
    const logFile = path.join(__dirname, 'test-execution.log');
    fs.appendFileSync(logFile, logMessage + '\n');
  }

  async checkPrerequisites() {
    this.log('=== CHECKING PREREQUISITES ===');
    const prerequisites = {
      dockerContainers: false,
      databaseFile: false,
      nodeModules: false,
      testFiles: false
    };

    try {
      // Check Docker containers
      const { stdout: dockerPs } = await execAsync('docker ps --format "table {{.Names}}\t{{.Status}}"');
      const runningContainers = dockerPs.toLowerCase();
      
      if (runningContainers.includes('nvestiv-api') && runningContainers.includes('nvestiv-frontend')) {
        prerequisites.dockerContainers = true;
        this.log('✓ Docker containers are running');
      } else {
        this.log('✗ Docker containers not running', 'warn');
        this.testResults.summary.warnings.push('Docker containers not running - attempting to test local servers');
      }

      // Check database file
      const dbPath = path.join(__dirname, 'investor_network_full.db');
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        prerequisites.databaseFile = true;
        this.log(`✓ Database file exists (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      } else {
        this.log('✗ Database file not found', 'error');
        this.testResults.summary.errors.push('Database file missing');
      }

      // Check node modules
      if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
        prerequisites.nodeModules = true;
        this.log('✓ Node modules installed');
      } else {
        this.log('✗ Node modules not installed', 'error');
        this.testResults.summary.errors.push('Node modules missing');
      }

      // Check test files
      const testDir = path.join(__dirname, 'tests');
      if (fs.existsSync(testDir)) {
        prerequisites.testFiles = true;
        this.log('✓ Test files available');
      } else {
        this.log('✗ Test directory not found', 'warn');
      }

      return prerequisites;
    } catch (error) {
      this.log(`Error checking prerequisites: ${error.message}`, 'error');
      return prerequisites;
    }
  }

  async testDockerContainers() {
    this.log('=== TESTING DOCKER CONTAINERS ===');
    const phase = {
      name: 'Docker Container Tests',
      startTime: Date.now(),
      tests: [],
      status: 'running'
    };

    try {
      // Test API container health
      const apiHealthTest = await this.testEndpoint(`${this.baseUrls.api}/health`, 'API Container Health');
      phase.tests.push(apiHealthTest);

      // Test frontend container accessibility
      const frontendTest = await this.testEndpoint(`${this.baseUrls.frontend}`, 'Frontend Container Health');
      phase.tests.push(frontendTest);

      // Test container connectivity
      const connectivityTest = await this.testContainerConnectivity();
      phase.tests.push(connectivityTest);

      phase.endTime = Date.now();
      phase.duration = phase.endTime - phase.startTime;
      phase.status = phase.tests.every(t => t.passed) ? 'passed' : 'failed';
      
      this.testResults.phases.dockerContainers = phase;
      this.log(`Docker container tests completed: ${phase.status}`);
      
      return phase;
    } catch (error) {
      phase.status = 'error';
      phase.error = error.message;
      this.log(`Docker container tests failed: ${error.message}`, 'error');
      return phase;
    }
  }

  async testContainerConnectivity() {
    try {
      const { stdout } = await execAsync('docker network ls');
      const networks = stdout.split('\n').filter(line => line.includes('nvestiv'));
      
      return {
        name: 'Container Network Connectivity',
        passed: networks.length > 0,
        message: networks.length > 0 ? 'Containers are on shared network' : 'No shared network detected',
        details: { networks: networks.map(n => n.trim()) }
      };
    } catch (error) {
      return {
        name: 'Container Network Connectivity',
        passed: false,
        message: `Network check failed: ${error.message}`,
        error: error.message
      };
    }
  }

  async testEndpoint(url, testName, options = {}) {
    const test = {
      name: testName,
      url: url,
      startTime: Date.now()
    };

    try {
      const fetch = (await import('node-fetch')).default;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeout || 10000);

      const response = await fetch(url, {
        signal: controller.signal,
        ...options
      });

      clearTimeout(timeout);

      test.endTime = Date.now();
      test.responseTime = test.endTime - test.startTime;
      test.status = response.status;
      test.passed = response.ok;
      test.message = `Response: ${response.status} ${response.statusText} (${test.responseTime}ms)`;

      if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
        try {
          test.data = await response.json();
        } catch (e) {
          test.message += ' (JSON parse error)';
        }
      }

      return test;
    } catch (error) {
      test.endTime = Date.now();
      test.responseTime = test.endTime - test.startTime;
      test.passed = false;
      test.error = error.message;
      test.message = `Failed: ${error.message} (${test.responseTime}ms)`;
      return test;
    }
  }

  async testBackendAPI() {
    this.log('=== TESTING BACKEND API ENDPOINTS ===');
    const phase = {
      name: 'Backend API Tests',
      startTime: Date.now(),
      tests: [],
      status: 'running'
    };

    const endpoints = [
      { url: '/health', name: 'Health Check', method: 'GET' },
      { url: '/api/network/stats', name: 'Network Statistics', method: 'GET' },
      { url: '/api/investors/search?q=test&limit=10', name: 'Investor Search', method: 'GET' },
      { url: '/api/investors/1', name: 'Single Investor', method: 'GET' },
      { url: '/api/search/ai?q=fintech', name: 'AI Search', method: 'GET' },
      { url: '/api/firms/search?q=venture&limit=10', name: 'Firm Search', method: 'GET' },
      { url: '/api/diagnostics', name: 'System Diagnostics', method: 'GET' }
    ];

    for (const endpoint of endpoints) {
      const test = await this.testEndpoint(
        `${this.baseUrls.api}${endpoint.url}`,
        endpoint.name,
        { method: endpoint.method }
      );
      phase.tests.push(test);
      
      // Add specific validations based on endpoint
      if (test.passed && test.data) {
        test.validations = await this.validateEndpointResponse(endpoint.url, test.data);
      }
    }

    phase.endTime = Date.now();
    phase.duration = phase.endTime - phase.startTime;
    phase.status = phase.tests.every(t => t.passed) ? 'passed' : 'failed';
    
    this.testResults.phases.backendAPI = phase;
    this.log(`Backend API tests completed: ${phase.status}`);
    
    return phase;
  }

  async validateEndpointResponse(endpoint, data) {
    const validations = [];

    switch (endpoint) {
      case '/health':
        validations.push({
          check: 'Has status field',
          passed: data.hasOwnProperty('status'),
          value: data.status
        });
        validations.push({
          check: 'Has timestamp',
          passed: data.hasOwnProperty('timestamp'),
          value: data.timestamp
        });
        break;

      case '/api/network/stats':
        validations.push({
          check: 'Has investor count',
          passed: data.hasOwnProperty('investors') && typeof data.investors === 'number',
          value: data.investors
        });
        validations.push({
          check: 'Has firm count',
          passed: data.hasOwnProperty('firms') && typeof data.firms === 'number',
          value: data.firms
        });
        break;

      case '/api/investors/search?q=test&limit=10':
        validations.push({
          check: 'Returns array',
          passed: Array.isArray(data),
          value: `Array length: ${data.length}`
        });
        if (Array.isArray(data) && data.length > 0) {
          validations.push({
            check: 'Has investor ID',
            passed: data[0].hasOwnProperty('id'),
            value: data[0].id
          });
          validations.push({
            check: 'Has investor name',
            passed: data[0].hasOwnProperty('name'),
            value: data[0].name
          });
        }
        break;
    }

    return validations;
  }

  async testFrontendPages() {
    this.log('=== TESTING FRONTEND PAGES ===');
    const phase = {
      name: 'Frontend Page Tests',
      startTime: Date.now(),
      tests: [],
      status: 'running'
    };

    const pages = [
      { url: '/', name: 'Dashboard' },
      { url: '/investors', name: 'Investors Page' },
      { url: '/search', name: 'Search Page' },
      { url: '/network', name: 'Network Page' },
      { url: '/firms', name: 'Firms Page' }
    ];

    for (const page of pages) {
      const test = await this.testEndpoint(
        `${this.baseUrls.frontend}${page.url}`,
        page.name
      );
      phase.tests.push(test);
    }

    phase.endTime = Date.now();
    phase.duration = phase.endTime - phase.startTime;
    phase.status = phase.tests.every(t => t.passed) ? 'passed' : 'failed';
    
    this.testResults.phases.frontendPages = phase;
    this.log(`Frontend page tests completed: ${phase.status}`);
    
    return phase;
  }

  async testDatabaseIntegrity() {
    this.log('=== TESTING DATABASE INTEGRITY ===');
    const phase = {
      name: 'Database Integrity Tests',
      startTime: Date.now(),
      tests: [],
      status: 'running'
    };

    try {
      // Test database file existence and size
      const dbPath = path.join(__dirname, 'investor_network_full.db');
      const dbTest = {
        name: 'Database File Check',
        passed: fs.existsSync(dbPath)
      };

      if (dbTest.passed) {
        const stats = fs.statSync(dbPath);
        dbTest.message = `Database file exists (${(stats.size / 1024 / 1024).toFixed(2)} MB)`;
        dbTest.details = { size: stats.size, modified: stats.mtime };
      } else {
        dbTest.message = 'Database file not found';
        dbTest.error = 'Missing database file';
      }

      phase.tests.push(dbTest);

      // Test database connectivity through API
      const connectivityTest = await this.testEndpoint(
        `${this.baseUrls.api}/api/diagnostics`,
        'Database Connectivity via API'
      );
      phase.tests.push(connectivityTest);

      // Test data integrity through sample queries
      const dataIntegrityTests = await this.testDataIntegrity();
      phase.tests.push(...dataIntegrityTests);

      phase.endTime = Date.now();
      phase.duration = phase.endTime - phase.startTime;
      phase.status = phase.tests.every(t => t.passed) ? 'passed' : 'failed';
      
      this.testResults.phases.databaseIntegrity = phase;
      this.log(`Database integrity tests completed: ${phase.status}`);
      
      return phase;
    } catch (error) {
      phase.status = 'error';
      phase.error = error.message;
      this.log(`Database integrity tests failed: ${error.message}`, 'error');
      return phase;
    }
  }

  async testDataIntegrity() {
    const tests = [];

    // Test investor count
    const investorCountTest = await this.testEndpoint(
      `${this.baseUrls.api}/api/network/stats`,
      'Investor Count Validation'
    );
    
    if (investorCountTest.passed && investorCountTest.data) {
      investorCountTest.validations = [{
        check: 'Investor count > 30000',
        passed: investorCountTest.data.investors > 30000,
        value: investorCountTest.data.investors
      }];
    }
    tests.push(investorCountTest);

    // Test search functionality
    const searchTest = await this.testEndpoint(
      `${this.baseUrls.api}/api/investors/search?q=venture&limit=5`,
      'Search Results Validation'
    );
    
    if (searchTest.passed && Array.isArray(searchTest.data)) {
      searchTest.validations = [{
        check: 'Returns search results',
        passed: searchTest.data.length > 0,
        value: `${searchTest.data.length} results`
      }];
    }
    tests.push(searchTest);

    return tests;
  }

  async testIntegration() {
    this.log('=== TESTING API-FRONTEND INTEGRATION ===');
    const phase = {
      name: 'Integration Tests',
      startTime: Date.now(),
      tests: [],
      status: 'running'
    };

    try {
      // Test CORS configuration
      const corsTest = await this.testCORS();
      phase.tests.push(corsTest);

      // Test data flow between API and frontend
      const dataFlowTest = await this.testDataFlow();
      phase.tests.push(dataFlowTest);

      // Test error handling
      const errorHandlingTest = await this.testErrorHandling();
      phase.tests.push(errorHandlingTest);

      phase.endTime = Date.now();
      phase.duration = phase.endTime - phase.startTime;
      phase.status = phase.tests.every(t => t.passed) ? 'passed' : 'failed';
      
      this.testResults.phases.integration = phase;
      this.log(`Integration tests completed: ${phase.status}`);
      
      return phase;
    } catch (error) {
      phase.status = 'error';
      phase.error = error.message;
      this.log(`Integration tests failed: ${error.message}`, 'error');
      return phase;
    }
  }

  async testCORS() {
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${this.baseUrls.api}/health`, {
        headers: {
          'Origin': this.baseUrls.frontend,
          'Access-Control-Request-Method': 'GET'
        }
      });

      return {
        name: 'CORS Configuration',
        passed: response.headers.get('access-control-allow-origin') !== null,
        message: response.headers.get('access-control-allow-origin') ? 
          'CORS headers present' : 'CORS headers missing',
        details: {
          allowOrigin: response.headers.get('access-control-allow-origin'),
          allowMethods: response.headers.get('access-control-allow-methods')
        }
      };
    } catch (error) {
      return {
        name: 'CORS Configuration',
        passed: false,
        message: `CORS test failed: ${error.message}`,
        error: error.message
      };
    }
  }

  async testDataFlow() {
    // Test if frontend can successfully fetch data from API
    const searchQuery = 'venture';
    const apiResponse = await this.testEndpoint(
      `${this.baseUrls.api}/api/investors/search?q=${searchQuery}&limit=5`,
      'Data Flow - API Response'
    );

    return {
      name: 'API-Frontend Data Flow',
      passed: apiResponse.passed && Array.isArray(apiResponse.data),
      message: apiResponse.passed ? 
        `API returns ${apiResponse.data.length} results for '${searchQuery}'` :
        'API data flow test failed',
      details: apiResponse
    };
  }

  async testErrorHandling() {
    // Test API error responses
    const errorTest = await this.testEndpoint(
      `${this.baseUrls.api}/api/nonexistent`,
      'Error Handling - 404 Response'
    );

    return {
      name: 'Error Handling',
      passed: errorTest.status === 404,
      message: errorTest.status === 404 ? 
        'API properly returns 404 for invalid endpoints' :
        `Expected 404, got ${errorTest.status}`,
      details: errorTest
    };
  }

  async generateReport() {
    this.log('=== GENERATING COMPREHENSIVE TEST REPORT ===');
    
    // Calculate summary statistics
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    Object.values(this.testResults.phases).forEach(phase => {
      if (phase.tests) {
        totalTests += phase.tests.length;
        passedTests += phase.tests.filter(t => t.passed).length;
        failedTests += phase.tests.filter(t => !t.passed).length;
      }
    });

    this.testResults.summary.totalTests = totalTests;
    this.testResults.summary.passedTests = passedTests;
    this.testResults.summary.failedTests = failedTests;
    this.testResults.summary.successRate = ((passedTests / totalTests) * 100).toFixed(2);

    // Generate recommendations
    this.generateRecommendations();

    // Write detailed report
    const reportPath = path.join(__dirname, 'COMPREHENSIVE-TEST-REPORT.md');
    const report = this.formatReport();
    fs.writeFileSync(reportPath, report);

    // Write JSON report for programmatic access
    const jsonReportPath = path.join(__dirname, 'test-results.json');
    fs.writeFileSync(jsonReportPath, JSON.stringify(this.testResults, null, 2));

    this.log(`✓ Test report generated: ${reportPath}`);
    this.log(`✓ JSON results saved: ${jsonReportPath}`);
    
    return {
      reportPath,
      jsonReportPath,
      summary: this.testResults.summary
    };
  }

  generateRecommendations() {
    const recommendations = [];

    // Check overall success rate
    if (this.testResults.summary.successRate < 80) {
      recommendations.push({
        priority: 'high',
        category: 'reliability',
        title: 'Low Test Success Rate',
        description: `Only ${this.testResults.summary.successRate}% of tests passed. Investigate failing tests immediately.`
      });
    }

    // Check Docker container status
    if (this.testResults.phases.dockerContainers && 
        this.testResults.phases.dockerContainers.status !== 'passed') {
      recommendations.push({
        priority: 'high',
        category: 'infrastructure',
        title: 'Docker Container Issues',
        description: 'Docker containers are not running properly. Check docker-compose configuration and restart containers.'
      });
    }

    // Check API response times
    Object.values(this.testResults.phases).forEach(phase => {
      if (phase.tests) {
        const slowTests = phase.tests.filter(t => t.responseTime > 5000);
        if (slowTests.length > 0) {
          recommendations.push({
            priority: 'medium',
            category: 'performance',
            title: 'Slow API Responses',
            description: `${slowTests.length} API endpoints are responding slowly (>5s). Consider optimizing database queries or adding caching.`
          });
        }
      }
    });

    // Check database integrity
    if (this.testResults.phases.databaseIntegrity && 
        this.testResults.phases.databaseIntegrity.status !== 'passed') {
      recommendations.push({
        priority: 'high',
        category: 'data',
        title: 'Database Integrity Issues',
        description: 'Database integrity tests failed. Verify database file exists and contains expected data.'
      });
    }

    this.testResults.summary.recommendations = recommendations;
  }

  formatReport() {
    const report = [];
    report.push('# Nvestiv Signal DB - Comprehensive Test Report');
    report.push('');
    report.push(`**Generated:** ${this.testResults.timestamp}`);
    report.push(`**Test Success Rate:** ${this.testResults.summary.successRate}%`);
    report.push(`**Total Tests:** ${this.testResults.summary.totalTests}`);
    report.push(`**Passed:** ${this.testResults.summary.passedTests}`);
    report.push(`**Failed:** ${this.testResults.summary.failedTests}`);
    report.push('');

    // Executive Summary
    report.push('## Executive Summary');
    report.push('');
    if (this.testResults.summary.successRate >= 90) {
      report.push('✅ **EXCELLENT** - Application is functioning well with minimal issues.');
    } else if (this.testResults.summary.successRate >= 80) {
      report.push('⚠️ **GOOD** - Application is mostly functional with some areas needing attention.');
    } else if (this.testResults.summary.successRate >= 60) {
      report.push('🔧 **NEEDS WORK** - Application has significant issues that should be addressed.');
    } else {
      report.push('❌ **CRITICAL** - Application has major problems requiring immediate attention.');
    }
    report.push('');

    // Detailed Results by Phase
    Object.entries(this.testResults.phases).forEach(([phaseName, phase]) => {
      report.push(`## ${phase.name}`);
      report.push('');
      report.push(`**Status:** ${phase.status === 'passed' ? '✅ PASSED' : phase.status === 'failed' ? '❌ FAILED' : '⚠️ ERROR'}`);
      report.push(`**Duration:** ${phase.duration}ms`);
      if (phase.tests) {
        report.push(`**Tests:** ${phase.tests.length} (${phase.tests.filter(t => t.passed).length} passed, ${phase.tests.filter(t => !t.passed).length} failed)`);
      }
      report.push('');

      if (phase.tests) {
        report.push('### Test Details');
        report.push('');
        phase.tests.forEach(test => {
          const status = test.passed ? '✅' : '❌';
          report.push(`**${status} ${test.name}**`);
          report.push(`- ${test.message}`);
          if (test.responseTime) {
            report.push(`- Response Time: ${test.responseTime}ms`);
          }
          if (test.validations) {
            test.validations.forEach(validation => {
              const valStatus = validation.passed ? '✅' : '❌';
              report.push(`  - ${valStatus} ${validation.check}: ${validation.value || 'N/A'}`);
            });
          }
          if (test.error) {
            report.push(`  - **Error:** ${test.error}`);
          }
          report.push('');
        });
      }

      if (phase.error) {
        report.push(`**Phase Error:** ${phase.error}`);
        report.push('');
      }
    });

    // Recommendations
    if (this.testResults.summary.recommendations.length > 0) {
      report.push('## Recommendations');
      report.push('');
      this.testResults.summary.recommendations.forEach(rec => {
        const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
        report.push(`### ${priority} ${rec.title} (${rec.category})`);
        report.push('');
        report.push(rec.description);
        report.push('');
      });
    }

    // Warnings and Errors
    if (this.testResults.summary.warnings.length > 0) {
      report.push('## Warnings');
      report.push('');
      this.testResults.summary.warnings.forEach(warning => {
        report.push(`- ⚠️ ${warning}`);
      });
      report.push('');
    }

    if (this.testResults.summary.errors.length > 0) {
      report.push('## Errors');
      report.push('');
      this.testResults.summary.errors.forEach(error => {
        report.push(`- ❌ ${error}`);
      });
      report.push('');
    }

    // Next Steps
    report.push('## Next Steps');
    report.push('');
    report.push('1. **Address Critical Issues:** Fix any high-priority recommendations first');
    report.push('2. **Performance Optimization:** Investigate slow API responses');
    report.push('3. **Monitoring:** Set up continuous monitoring for key metrics');
    report.push('4. **Regular Testing:** Run this test suite regularly to catch regressions');
    report.push('');

    return report.join('\n');
  }

  async run() {
    try {
      this.log('🚀 Starting Comprehensive Nvestiv Signal DB Test Suite');
      this.log('='.repeat(60));

      // Check prerequisites
      const prerequisites = await this.checkPrerequisites();
      
      // Run test phases
      await this.testDockerContainers();
      await this.testBackendAPI();
      await this.testFrontendPages();
      await this.testDatabaseIntegrity();
      await this.testIntegration();

      // Generate final report
      const reportInfo = await this.generateReport();

      this.log('='.repeat(60));
      this.log('🎉 Test Suite Completed!');
      this.log(`📊 Success Rate: ${this.testResults.summary.successRate}%`);
      this.log(`📄 Report: ${reportInfo.reportPath}`);
      this.log(`📁 JSON Data: ${reportInfo.jsonReportPath}`);

      return this.testResults;
    } catch (error) {
      this.log(`❌ Test suite failed: ${error.message}`, 'error');
      throw error;
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const runner = new NvestivTestRunner();
  runner.run()
    .then(results => {
      process.exit(results.summary.failedTests > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = NvestivTestRunner;