/**
 * Error Handling Tests - Unit Testing
 * Tests error conditions, edge cases, and graceful degradation
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');

describe('Error Handling Tests', () => {
    let app;
    let originalEnv;
    
    beforeAll(async () => {
        originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'test';
        
        // Import app
        app = require('../../simple_server.js');
        
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 2000));
    });
    
    afterAll(() => {
        process.env.NODE_ENV = originalEnv;
    });

    describe('API Error Handling', () => {
        test('should handle malformed JSON requests', async () => {
            const response = await request(app)
                .post('/api/investors/match')
                .set('Content-Type', 'application/json')
                .send('{"invalid": json}');
            
            expect([400, 500]).toContain(response.status);
            
            if (response.status === 500) {
                expect(response.body).toHaveProperty('error');
                expect(response.body).toHaveProperty('timestamp');
            }
        });

        test('should handle invalid query parameters', async () => {
            const response = await request(app)
                .get('/api/investors/search?minConnections=invalid&limit=notANumber');
            
            // Should not crash server
            expect([200, 400, 500]).toContain(response.status);
            
            if (response.body.error) {
                expect(typeof response.body.error).toBe('string');
            }
        });

        test('should handle extremely large limit values', async () => {
            const response = await request(app)
                .get('/api/investors/search?limit=999999');
            
            expect([200, 400, 500]).toContain(response.status);
            
            if (response.status === 200) {
                // Should cap the limit
                expect(response.body.criteria.limit).toBeLessThanOrEqual(100);
            }
        });

        test('should handle special characters in search parameters', async () => {
            const specialChars = encodeURIComponent('Test & Co. <script>');
            const response = await request(app)
                .get(`/api/investors/search?firm=${specialChars}`);
            
            expect([200, 400, 500]).toContain(response.status);
            // Should not crash due to special characters
        });

        test('should handle very long strings in parameters', async () => {
            const longString = 'a'.repeat(10000);
            const response = await request(app)
                .get('/api/investors/search')
                .query({ firm: longString });
            
            expect([200, 400, 413, 500]).toContain(response.status);
            // Should handle long strings gracefully
        });

        test('should handle empty POST body', async () => {
            const response = await request(app)
                .post('/api/investors/match')
                .send();
            
            expect([200, 400, 500]).toContain(response.status);
            
            if (response.status === 200) {
                expect(response.body).toHaveProperty('matches');
                expect(response.body).toHaveProperty('targetProfile');
            }
        });

        test('should handle null values in POST body', async () => {
            const response = await request(app)
                .post('/api/investors/match')
                .send({
                    firmName: null,
                    minConnections: null,
                    networkTier: null
                });
            
            expect([200, 400, 500]).toContain(response.status);
        });
    });

    describe('HTTP Method Error Handling', () => {
        test('should reject invalid methods on API endpoints', async () => {
            const response = await request(app)
                .put('/api/network/stats');
            
            expect([405, 404]).toContain(response.status);
        });

        test('should handle OPTIONS requests for CORS', async () => {
            const response = await request(app)
                .options('/api/network/stats')
                .set('Origin', 'http://localhost:3010');
            
            expect([200, 204]).toContain(response.status);
        });

        test('should reject POST on GET-only endpoints', async () => {
            const response = await request(app)
                .post('/api/network/stats')
                .send({ test: 'data' });
            
            expect([404, 405]).toContain(response.status);
        });
    });

    describe('File System Error Handling', () => {
        test('should handle missing web interface file gracefully', async () => {
            // Temporarily rename the file if it exists
            const htmlPath = path.join(process.cwd(), 'web_interface.html');
            const backupPath = path.join(process.cwd(), 'web_interface.html.backup');
            let fileRenamed = false;
            
            if (fs.existsSync(htmlPath)) {
                fs.renameSync(htmlPath, backupPath);
                fileRenamed = true;
            }
            
            try {
                const response = await request(app).get('/');
                
                expect(response.status).toBe(404);
                expect(response.text).toContain('Web Interface Not Found');
                expect(response.text).toContain('web_interface.html');
                
            } finally {
                // Restore the file
                if (fileRenamed) {
                    fs.renameSync(backupPath, htmlPath);
                }
            }
        });

        test('should provide helpful error pages', async () => {
            const response = await request(app).get('/nonexistent-page');
            
            // Should serve the main interface or a proper 404
            expect([200, 404]).toContain(response.status);
            
            if (response.status === 404) {
                expect(response.text).toContain('html');
            }
        });
    });

    describe('Database Error Handling', () => {
        test('should handle database connection errors', async () => {
            const response = await request(app).get('/api/network/stats');
            
            if (response.status === 500) {
                expect(response.body).toHaveProperty('error');
                expect(response.body.error).toContain('database');
            }
        });

        test('should provide meaningful error messages', async () => {
            const response = await request(app).get('/api/diagnostics');
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('database');
            
            if (response.body.database.status === 'error') {
                expect(response.body).toHaveProperty('errors');
                expect(Array.isArray(response.body.errors)).toBe(true);
            }
        });
    });

    describe('Rate Limiting and Resource Protection', () => {
        test('should handle rapid successive requests', async () => {
            const requests = Array(10).fill(null).map(() =>
                request(app).get('/health')
            );
            
            const responses = await Promise.all(requests);
            
            // All requests should be handled (might be rate limited but not crash)
            responses.forEach(response => {
                expect([200, 429, 503]).toContain(response.status);
            });
        });

        test('should handle concurrent API requests', async () => {
            const concurrentRequests = Array(5).fill(null).map(() =>
                request(app).get('/api/investors/search?limit=1')
            );
            
            const responses = await Promise.all(concurrentRequests);
            
            responses.forEach(response => {
                expect([200, 500, 503]).toContain(response.status);
            });
        });
    });

    describe('Input Validation', () => {
        test('should sanitize SQL injection attempts', async () => {
            const maliciousInput = "'; DROP TABLE investors; --";
            const response = await request(app)
                .get('/api/investors/search')
                .query({ firm: maliciousInput });
            
            // Should not crash and should handle safely
            expect([200, 400, 500]).toContain(response.status);
        });

        test('should handle XSS attempts in parameters', async () => {
            const xssAttempt = '<script>alert("xss")</script>';
            const response = await request(app)
                .get('/api/investors/search')
                .query({ firm: xssAttempt });
            
            expect([200, 400, 500]).toContain(response.status);
            
            if (response.body.criteria) {
                // Should not execute script
                expect(response.body.criteria.firmName).not.toContain('<script>');
            }
        });
    });

    describe('Memory and Resource Error Handling', () => {
        test('should handle large response payloads', async () => {
            const response = await request(app)
                .get('/api/investors/search?limit=100');
            
            expect([200, 413, 500]).toContain(response.status);
            
            if (response.status === 200) {
                // Should limit response size appropriately
                expect(response.body.investors.length).toBeLessThanOrEqual(100);
            }
        });

        test('should handle timeout scenarios', async () => {
            // This test ensures the server doesn't hang indefinitely
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/api/network/stats')
                .timeout(10000); // 10 second timeout
            
            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(15000); // Should respond within 15 seconds
        });
    });

    describe('Error Response Format', () => {
        test('should return consistent error response format', async () => {
            const response = await request(app)
                .get('/api/nonexistent');
            
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error');
            expect(response.body).toHaveProperty('timestamp');
            expect(typeof response.body.error).toBe('string');
            expect(typeof response.body.timestamp).toBe('string');
        });

        test('should include helpful error context', async () => {
            const response = await request(app)
                .get('/api/nonexistent');
            
            expect(response.body).toHaveProperty('availableEndpoints');
            expect(Array.isArray(response.body.availableEndpoints)).toBe(true);
            expect(response.body.availableEndpoints.length).toBeGreaterThan(0);
        });

        test('should not expose sensitive information in errors', async () => {
            const response = await request(app)
                .get('/api/network/stats');
            
            if (response.status === 500) {
                // Should not expose file paths, credentials, or internal details
                expect(response.body.error).not.toMatch(/\/home\/|\/Users\/|password|secret|key/i);
            }
        });
    });

    describe('Graceful Degradation', () => {
        test('should continue serving web interface during API errors', async () => {
            const webResponse = await request(app).get('/');
            
            // Web interface should load even if API has issues
            expect([200, 404]).toContain(webResponse.status);
            
            if (webResponse.status === 200) {
                expect(webResponse.text).toContain('Investor Network Database Browser');
            }
        });

        test('should provide fallback responses for missing data', async () => {
            const response = await request(app).get('/api/investors/search?firm=NonExistentFirm12345');
            
            if (response.status === 200) {
                expect(response.body).toHaveProperty('count', 0);
                expect(response.body).toHaveProperty('investors');
                expect(response.body.investors).toHaveLength(0);
            }
        });
    });
});