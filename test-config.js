/**
 * Comprehensive Test Configuration for Nvestiv Signal DB
 * This configuration sets up Jest with proper environment variables and test settings
 */

module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/test-setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/comprehensive-tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'api_server.js',
    'simple_server.js',
    'network_analysis_full.js',
    '!node_modules/**',
    '!coverage/**',
    '!tests/**'
  ],
  globals: {
    'process.env': {
      NODE_ENV: 'test',
      API_BASE_URL: 'http://localhost:3010',
      FRONTEND_BASE_URL: 'http://localhost:3013'
    }
  }
};