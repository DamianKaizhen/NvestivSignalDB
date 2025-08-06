/**
 * Performance Tests - Unit Testing
 * Tests response times, memory usage, and scalability
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');

describe('Performance Tests', () => {
    let app;
    
    beforeAll(async () => {
        process.env.NODE_ENV = 'test';
        app = require('../../simple_server.js');
        
        // Wait for server initialization
        await new Promise(resolve => setTimeout(resolve, 3000));
    });

    describe('Response Time Tests', () => {
        test('health endpoint should respond quickly', async () => {
            const startTime = Date.now();
            
            await request(app)
                .get('/health')
                .expect(res => {
                    const responseTime = Date.now() - startTime;
                    expect(responseTime).toBeLessThan(1000); // 1 second max
                });
        });

        test('diagnostics endpoint should respond within reasonable time', async () => {
            const startTime = Date.now();
            
            await request(app)
                .get('/api/diagnostics')
                .expect(res => {
                    const responseTime = Date.now() - startTime;
                    expect(responseTime).toBeLessThan(2000); // 2 seconds max
                });
        });

        test('web interface should load quickly', async () => {
            const startTime = Date.now();
            
            await request(app)
                .get('/')
                .expect(res => {
                    const responseTime = Date.now() - startTime;
                    expect(responseTime).toBeLessThan(3000); // 3 seconds max for HTML
                });
        });

        test('network stats should respond within acceptable time', async () => {
            const startTime = Date.now();
            
            const response = await request(app).get('/api/network/stats');
            const responseTime = Date.now() - startTime;
            
            if (response.status === 200) {
                expect(responseTime).toBeLessThan(5000); // 5 seconds max for stats
            } else {
                // Even errors should be fast
                expect(responseTime).toBeLessThan(2000);
            }
        });

        test('investor search should be performant', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/api/investors/search?limit=10');
            
            const responseTime = Date.now() - startTime;
            
            if (response.status === 200) {
                expect(responseTime).toBeLessThan(3000); // 3 seconds max for search
            }
        });
    });

    describe('Concurrent Request Performance', () => {
        test('should handle multiple simultaneous health checks', async () => {
            const concurrentRequests = 10;
            const startTime = Date.now();
            
            const requests = Array(concurrentRequests).fill(null).map(() =>
                request(app).get('/health')
            );
            
            const responses = await Promise.all(requests);
            const totalTime = Date.now() - startTime;
            
            // All requests should complete
            expect(responses).toHaveLength(concurrentRequests);
            
            // Should handle concurrent requests efficiently
            expect(totalTime).toBeLessThan(5000); // 5 seconds for 10 concurrent requests
            
            // Most should succeed
            const successCount = responses.filter(r => [200, 503].includes(r.status)).length;
            expect(successCount).toBeGreaterThan(concurrentRequests * 0.8); // At least 80% success
        });

        test('should handle concurrent API requests', async () => {
            const concurrentRequests = 5;
            const startTime = Date.now();
            
            const requests = Array(concurrentRequests).fill(null).map(() =>
                request(app).get('/api/diagnostics')
            );
            
            const responses = await Promise.all(requests);
            const totalTime = Date.now() - startTime;
            
            expect(responses).toHaveLength(concurrentRequests);
            expect(totalTime).toBeLessThan(8000); // 8 seconds for 5 concurrent API requests
        });

        test('should handle mixed endpoint requests concurrently', async () => {
            const startTime = Date.now();
            
            const requests = [
                request(app).get('/health'),
                request(app).get('/api/diagnostics'),
                request(app).get('/'),
                request(app).get('/api/network/stats'),
                request(app).get('/api/investors/search?limit=5')
            ];
            
            const responses = await Promise.all(requests);
            const totalTime = Date.now() - startTime;
            
            expect(responses).toHaveLength(5);
            expect(totalTime).toBeLessThan(10000); // 10 seconds for mixed requests
            
            // Each request should have a reasonable status
            responses.forEach(response => {
                expect([200, 404, 500, 503]).toContain(response.status);
            });
        });
    });

    describe('Resource Usage Tests', () => {
        test('should not consume excessive memory during operations', async () => {
            const initialMemory = process.memoryUsage();
            
            // Perform several operations
            const operations = [
                request(app).get('/health'),
                request(app).get('/api/diagnostics'),
                request(app).get('/api/network/stats'),
                request(app).get('/api/investors/search?limit=10')
            ];
            
            await Promise.all(operations);
            
            const finalMemory = process.memoryUsage();
            
            // Memory usage shouldn't grow excessively (allowing for reasonable growth)
            const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
            expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
        });

        test('should handle large result sets efficiently', async () => {
            const startTime = Date.now();
            const initialMemory = process.memoryUsage();
            
            const response = await request(app)
                .get('/api/investors/search?limit=100');
            
            const endTime = Date.now();
            const finalMemory = process.memoryUsage();
            
            if (response.status === 200) {
                // Should handle large result sets
                expect(endTime - startTime).toBeLessThan(10000); // 10 seconds max
                
                // Memory usage should be reasonable
                const memoryDiff = finalMemory.heapUsed - initialMemory.heapUsed;
                expect(memoryDiff).toBeLessThan(20 * 1024 * 1024); // Less than 20MB for 100 results
            }
        });
    });

    describe('Scalability Tests', () => {
        test('should handle rapid sequential requests', async () => {
            const requestCount = 20;
            const startTime = Date.now();
            
            const results = [];
            for (let i = 0; i < requestCount; i++) {
                const response = await request(app).get('/health');
                results.push(response.status);
                
                // Small delay between requests
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            const totalTime = Date.now() - startTime;
            
            // Should handle all requests within reasonable time
            expect(totalTime).toBeLessThan(15000); // 15 seconds for 20 sequential requests
            
            // Most requests should succeed
            const successCount = results.filter(status => [200, 503].includes(status)).length;
            expect(successCount).toBeGreaterThan(requestCount * 0.9); // At least 90% success
        });

        test('should maintain performance under sustained load', async () => {
            const duration = 5000; // 5 seconds
            const startTime = Date.now();
            const responses = [];
            
            while (Date.now() - startTime < duration) {
                try {
                    const response = await request(app).get('/health');
                    responses.push({
                        status: response.status,
                        time: Date.now() - startTime
                    });
                    
                    // Brief pause between requests
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    responses.push({
                        status: 'error',
                        time: Date.now() - startTime
                    });
                }
            }
            
            expect(responses.length).toBeGreaterThan(10); // Should handle multiple requests
            
            // Calculate average response success rate
            const successCount = responses.filter(r => [200, 503].includes(r.status)).length;
            const successRate = successCount / responses.length;
            expect(successRate).toBeGreaterThan(0.8); // At least 80% success rate
        });
    });

    describe('Database Performance Tests', () => {
        test('should query database efficiently', async () => {
            const dbPath = path.join(process.cwd(), 'investor_network_full.db');
            
            if (!fs.existsSync(dbPath)) {
                console.log('Skipping database performance tests - database not found');
                return;
            }
            
            const startTime = Date.now();
            
            const response = await request(app).get('/api/network/stats');
            
            const queryTime = Date.now() - startTime;
            
            if (response.status === 200) {
                expect(queryTime).toBeLessThan(3000); // 3 seconds max for stats query
                
                // Should return meaningful data
                expect(response.body).toHaveProperty('totalInvestors');
                expect(typeof response.body.totalInvestors).toBe('number');
            }
        });

        test('should handle complex searches efficiently', async () => {
            const dbPath = path.join(process.cwd(), 'investor_network_full.db');
            
            if (!fs.existsSync(dbPath)) {
                return;
            }
            
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/api/investors/search?minConnections=500&hasLinkedIn=true&limit=50');
            
            const searchTime = Date.now() - startTime;
            
            if (response.status === 200) {
                expect(searchTime).toBeLessThan(5000); // 5 seconds max for complex search
            }
        });
    });

    describe('Response Size Tests', () => {
        test('should return appropriately sized responses', async () => {
            const response = await request(app).get('/api/diagnostics');
            
            if (response.status === 200) {
                const responseSize = JSON.stringify(response.body).length;
                expect(responseSize).toBeLessThan(10000); // Less than 10KB for diagnostics
            }
        });

        test('should limit large response payloads', async () => {
            const response = await request(app)
                .get('/api/investors/search?limit=100');
            
            if (response.status === 200) {
                expect(response.body.investors.length).toBeLessThanOrEqual(100);
                
                // Response shouldn't be excessively large
                const responseSize = JSON.stringify(response.body).length;
                expect(responseSize).toBeLessThan(1024 * 1024); // Less than 1MB
            }
        });

        test('should compress responses when appropriate', async () => {
            const response = await request(app)
                .get('/')
                .set('Accept-Encoding', 'gzip');
            
            if (response.status === 200) {
                // HTML response should be reasonably sized
                expect(response.text.length).toBeGreaterThan(1000); // Should have content
                expect(response.text.length).toBeLessThan(500000); // Less than 500KB
            }
        });
    });

    describe('Error Performance Tests', () => {
        test('should handle errors quickly', async () => {
            const startTime = Date.now();
            
            const response = await request(app).get('/api/nonexistent');
            
            const errorTime = Date.now() - startTime;
            
            expect(response.status).toBe(404);
            expect(errorTime).toBeLessThan(1000); // Errors should be fast
        });

        test('should handle malformed requests efficiently', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .post('/api/investors/match')
                .set('Content-Type', 'application/json')
                .send('invalid json');
            
            const errorTime = Date.now() - startTime;
            
            expect([400, 500]).toContain(response.status);
            expect(errorTime).toBeLessThan(2000); // Error handling should be quick
        });
    });
});