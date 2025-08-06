/**
 * API Endpoints Tests - Unit Testing
 * Tests all API endpoints with various parameters and edge cases
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');

describe('API Endpoints Tests', () => {
    let app;
    let dbExists;
    
    beforeAll(async () => {
        // Check database availability
        dbExists = fs.existsSync(path.join(process.cwd(), 'investor_network_full.db'));
        console.log('Database available for testing:', dbExists);
        
        // Import app
        process.env.NODE_ENV = 'test';
        app = require('../../simple_server.js');
        
        // Wait for server initialization
        await new Promise(resolve => setTimeout(resolve, 2000));
    });

    describe('Network Stats API (/api/network/stats)', () => {
        test('should return network statistics when database is available', async () => {
            const response = await request(app)
                .get('/api/network/stats');
            
            if (dbExists) {
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('totalInvestors');
                expect(response.body).toHaveProperty('totalFirms');
                expect(response.body).toHaveProperty('lastUpdated');
                expect(typeof response.body.totalInvestors).toBe('number');
                expect(response.body.totalInvestors).toBeGreaterThan(0);
            } else {
                expect(response.status).toBe(500);
                expect(response.body).toHaveProperty('error');
            }
        });

        test('should include timestamp in response', async () => {
            const response = await request(app).get('/api/network/stats');
            
            if (response.status === 200) {
                expect(response.body).toHaveProperty('lastUpdated');
                expect(new Date(response.body.lastUpdated)).toBeInstanceOf(Date);
            }
        });

        test('should handle database errors gracefully', async () => {
            // This test ensures proper error handling
            const response = await request(app).get('/api/network/stats');
            
            if (response.status === 500) {
                expect(response.body).toHaveProperty('error');
                expect(response.body).toHaveProperty('timestamp');
                expect(response.body).toHaveProperty('endpoint', '/api/network/stats');
            }
        });
    });

    describe('Investor Search API (/api/investors/search)', () => {
        test('should return search results with no parameters', async () => {
            const response = await request(app)
                .get('/api/investors/search');
            
            if (dbExists) {
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('count');
                expect(response.body).toHaveProperty('investors');
                expect(response.body).toHaveProperty('criteria');
                expect(Array.isArray(response.body.investors)).toBe(true);
            } else {
                expect(response.status).toBe(500);
            }
        });

        test('should filter by firm name', async () => {
            if (!dbExists) return;
            
            const response = await request(app)
                .get('/api/investors/search?firm=Sequoia')
                .expect(200);
            
            expect(response.body.criteria).toHaveProperty('firmName', 'Sequoia');
            
            // Check if results contain the firm name (if any results)
            if (response.body.count > 0) {
                response.body.investors.forEach(investor => {
                    if (investor.firm_name) {
                        expect(investor.firm_name.toLowerCase()).toContain('sequoia');
                    }
                });
            }
        });

        test('should filter by minimum connections', async () => {
            if (!dbExists) return;
            
            const minConnections = 1000;
            const response = await request(app)
                .get(`/api/investors/search?minConnections=${minConnections}`)
                .expect(200);
            
            expect(response.body.criteria).toHaveProperty('minConnections', minConnections);
            
            // Check if results meet minimum connection criteria
            if (response.body.count > 0) {
                response.body.investors.forEach(investor => {
                    if (investor.first_degree_count) {
                        expect(investor.first_degree_count).toBeGreaterThanOrEqual(minConnections);
                    }
                });
            }
        });

        test('should filter by LinkedIn requirement', async () => {
            if (!dbExists) return;
            
            const response = await request(app)
                .get('/api/investors/search?hasLinkedIn=true')
                .expect(200);
            
            expect(response.body.criteria).toHaveProperty('hasLinkedIn', true);
            
            // Check if results have LinkedIn URLs (if any results)
            if (response.body.count > 0) {
                response.body.investors.forEach(investor => {
                    expect(investor.linkedin_url).toBeDefined();
                    expect(investor.linkedin_url).not.toBeNull();
                });
            }
        });

        test('should filter by network tier', async () => {
            if (!dbExists) return;
            
            const networkTier = 'Super Connected';
            const response = await request(app)
                .get(`/api/investors/search?networkTier=${encodeURIComponent(networkTier)}`)
                .expect(200);
            
            expect(response.body.criteria).toHaveProperty('networkTier', networkTier);
            
            // Check if results match network tier
            if (response.body.count > 0) {
                response.body.investors.forEach(investor => {
                    if (investor.network_tier) {
                        expect(investor.network_tier).toBe(networkTier);
                    }
                });
            }
        });

        test('should respect limit parameter', async () => {
            if (!dbExists) return;
            
            const limit = 5;
            const response = await request(app)
                .get(`/api/investors/search?limit=${limit}`)
                .expect(200);
            
            expect(response.body.criteria).toHaveProperty('limit', limit);
            expect(response.body.investors.length).toBeLessThanOrEqual(limit);
        });

        test('should cap limit at 100', async () => {
            if (!dbExists) return;
            
            const response = await request(app)
                .get('/api/investors/search?limit=500')
                .expect(200);
            
            expect(response.body.criteria.limit).toBeLessThanOrEqual(100);
        });

        test('should combine multiple filters', async () => {
            if (!dbExists) return;
            
            const params = new URLSearchParams({
                minConnections: '500',
                hasLinkedIn: 'true',
                limit: '10'
            });
            
            const response = await request(app)
                .get(`/api/investors/search?${params}`)
                .expect(200);
            
            expect(response.body.criteria.minConnections).toBe(500);
            expect(response.body.criteria.hasLinkedIn).toBe(true);
            expect(response.body.criteria.limit).toBe(10);
        });

        test('should handle invalid parameters gracefully', async () => {
            const response = await request(app)
                .get('/api/investors/search?minConnections=invalid&limit=abc');
            
            // Should not crash, might return 200 with empty results or 400/500
            expect([200, 400, 500]).toContain(response.status);
        });
    });

    describe('Investor Matching API (/api/investors/match)', () => {
        test('should accept POST requests with target profile', async () => {
            if (!dbExists) return;
            
            const targetProfile = {
                firmName: 'Tech Ventures',
                minConnections: 1000,
                networkTier: 'Highly Connected'
            };
            
            const response = await request(app)
                .post('/api/investors/match')
                .send(targetProfile)
                .expect(200);
            
            expect(response.body).toHaveProperty('matches');
            expect(response.body).toHaveProperty('targetProfile');
            expect(response.body).toHaveProperty('results');
            expect(response.body.targetProfile).toEqual(targetProfile);
            expect(typeof response.body.matches).toBe('number');
        });

        test('should handle empty target profile', async () => {
            if (!dbExists) return;
            
            const response = await request(app)
                .post('/api/investors/match')
                .send({})
                .expect(200);
            
            expect(response.body).toHaveProperty('matches');
            expect(response.body).toHaveProperty('results');
        });

        test('should handle malformed JSON', async () => {
            const response = await request(app)
                .post('/api/investors/match')
                .set('Content-Type', 'application/json')
                .send('{"invalid": json}');
            
            expect([400, 500]).toContain(response.status);
        });

        test('should return proper content type', async () => {
            if (!dbExists) return;
            
            const response = await request(app)
                .post('/api/investors/match')
                .send({ test: true });
            
            expect(response.headers['content-type']).toMatch(/application\/json/);
        });
    });

    describe('Response Validation', () => {
        test('all successful responses should include timestamp', async () => {
            const endpoints = [
                '/api/network/stats',
                '/api/investors/search',
            ];
            
            for (const endpoint of endpoints) {
                const response = await request(app).get(endpoint);
                
                if (response.status === 200) {
                    expect(response.body).toHaveProperty('timestamp');
                    expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
                }
            }
        });

        test('all error responses should include error information', async () => {
            const response = await request(app).get('/api/nonexistent');
            
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error');
            expect(response.body).toHaveProperty('timestamp');
        });

        test('should return proper HTTP status codes', async () => {
            const testCases = [
                { endpoint: '/api/network/stats', expectedStatus: [200, 500] },
                { endpoint: '/api/investors/search', expectedStatus: [200, 500] },
                { endpoint: '/api/nonexistent', expectedStatus: [404] }
            ];
            
            for (const testCase of testCases) {
                const response = await request(app).get(testCase.endpoint);
                expect(testCase.expectedStatus).toContain(response.status);
            }
        });
    });

    describe('Data Quality Tests', () => {
        test('investor search results should have required fields', async () => {
            if (!dbExists) return;
            
            const response = await request(app)
                .get('/api/investors/search?limit=1');
            
            if (response.status === 200 && response.body.count > 0) {
                const investor = response.body.investors[0];
                
                // Check for expected fields (allowing for null/undefined)
                expect(investor).toHaveProperty('id');
                
                // These fields should be present even if null
                const expectedFields = [
                    'full_name', 'firm_name', 'position', 'linkedin_url',
                    'first_degree_count', 'investment_count', 'network_tier'
                ];
                
                expectedFields.forEach(field => {
                    expect(investor).toHaveProperty(field);
                });
            }
        });

        test('network stats should have reasonable values', async () => {
            if (!dbExists) return;
            
            const response = await request(app).get('/api/network/stats');
            
            if (response.status === 200) {
                expect(response.body.totalInvestors).toBeGreaterThan(0);
                expect(response.body.totalFirms).toBeGreaterThan(0);
                
                // Reasonable bounds check
                expect(response.body.totalInvestors).toBeLessThan(1000000); // Less than 1M
                expect(response.body.totalFirms).toBeLessThan(100000); // Less than 100K
            }
        });
    });
});