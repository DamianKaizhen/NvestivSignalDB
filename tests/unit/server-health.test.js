/**
 * Server Health Tests - Unit Testing
 * Tests server startup, health endpoints, and basic functionality
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');

describe('Server Health Tests', () => {
    let app;
    let server;
    
    beforeAll(async () => {
        // Check if database exists before starting server
        const dbPath = path.join(process.cwd(), 'investor_network_full.db');
        console.log('Database path:', dbPath);
        console.log('Database exists:', fs.existsSync(dbPath));
        
        // Import the app without starting the server automatically
        process.env.NODE_ENV = 'test';
        
        // Mock the server startup to prevent auto-start
        const originalConsoleLog = console.log;
        console.log = () => {}; // Suppress startup logs during tests
        
        // Import server
        app = require('../../simple_server.js');
        
        // Restore console.log
        console.log = originalConsoleLog;
        
        // Wait for server initialization
        await new Promise(resolve => setTimeout(resolve, 2000));
    });

    afterAll(async () => {
        if (server) {
            server.close();
        }
        // Clean up any test artifacts
        await new Promise(resolve => setTimeout(resolve, 1000));
    });

    describe('Basic Server Functionality', () => {
        test('should respond to health check endpoint', async () => {
            const response = await request(app)
                .get('/health')
                .expect('Content-Type', /json/);
            
            expect(response.status).toBeOneOf([200, 503]); // Healthy or degraded
            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('uptime');
            expect(response.body).toHaveProperty('database');
        });

        test('should return detailed server diagnostics', async () => {
            const response = await request(app)
                .get('/api/diagnostics')
                .expect(200)
                .expect('Content-Type', /json/);
            
            expect(response.body).toHaveProperty('server');
            expect(response.body).toHaveProperty('database');
            expect(response.body).toHaveProperty('files');
            expect(response.body).toHaveProperty('timestamp');
            
            expect(response.body.server).toHaveProperty('status');
            expect(response.body.server).toHaveProperty('port', 3010);
            expect(response.body.database).toHaveProperty('exists');
            expect(response.body.files).toHaveProperty('webInterface');
        });

        test('should serve web interface HTML', async () => {
            const response = await request(app)
                .get('/')
                .expect(200)
                .expect('Content-Type', /html/);
            
            expect(response.text).toContain('Investor Network Database Browser');
            expect(response.text).toContain('DOCTYPE html');
            expect(response.text).toContain('Search Investors');
        });

        test('should handle 404 for unknown API endpoints', async () => {
            const response = await request(app)
                .get('/api/nonexistent')
                .expect(404)
                .expect('Content-Type', /json/);
            
            expect(response.body).toHaveProperty('error', 'API endpoint not found');
            expect(response.body).toHaveProperty('availableEndpoints');
            expect(response.body.availableEndpoints).toContain('GET /health');
        });
    });

    describe('Database Connection Tests', () => {
        test('should connect to database successfully', async () => {
            const response = await request(app).get('/api/diagnostics');
            
            if (response.body.database.exists) {
                expect(response.body.database.status).toBe('connected');
                expect(response.body.database.size).toMatch(/\d+(\.\d+)?MB/);
            } else {
                console.warn('Database file not found - skipping connection test');
            }
        });

        test('should handle database errors gracefully', async () => {
            // This test checks if the server handles database connection issues
            const response = await request(app).get('/health');
            
            if (response.body.database === 'error') {
                expect(response.body.errors).toBeDefined();
                expect(response.body.errors.length).toBeGreaterThan(0);
            }
        });
    });

    describe('Error Handling', () => {
        test('should handle malformed requests gracefully', async () => {
            const response = await request(app)
                .post('/api/investors/match')
                .send('invalid json')
                .set('Content-Type', 'application/json');
            
            // Should not crash the server
            expect([400, 500]).toContain(response.status);
        });

        test('should return proper CORS headers', async () => {
            const response = await request(app)
                .get('/health')
                .set('Origin', 'http://localhost:3010');
            
            expect(response.headers).toHaveProperty('access-control-allow-origin');
        });
    });

    describe('Performance Tests', () => {
        test('should respond to health check within reasonable time', async () => {
            const startTime = Date.now();
            
            await request(app)
                .get('/health')
                .expect(res => {
                    const responseTime = Date.now() - startTime;
                    expect(responseTime).toBeLessThan(5000); // 5 seconds max
                });
        });

        test('should handle concurrent requests', async () => {
            const requests = Array(5).fill(null).map(() => 
                request(app).get('/health')
            );
            
            const responses = await Promise.all(requests);
            
            responses.forEach(response => {
                expect([200, 503]).toContain(response.status);
            });
        });
    });

    describe('File System Tests', () => {
        test('should verify all required files exist', async () => {
            const requiredFiles = [
                'web_interface.html',
                'network_analysis_full.js',
                'simple_server.js'
            ];
            
            requiredFiles.forEach(file => {
                const filePath = path.join(process.cwd(), file);
                expect(fs.existsSync(filePath)).toBe(true);
            });
        });

        test('should check database file size and structure', async () => {
            const dbPath = path.join(process.cwd(), 'investor_network_full.db');
            
            if (fs.existsSync(dbPath)) {
                const stats = fs.statSync(dbPath);
                expect(stats.size).toBeGreaterThan(1000); // At least 1KB
                
                // Check if it's a valid SQLite file
                const buffer = fs.readFileSync(dbPath, { start: 0, end: 16 });
                const header = buffer.toString('ascii', 0, 16);
                expect(header).toContain('SQLite format');
            }
        });
    });
});

// Custom Jest matcher for multiple possible values
expect.extend({
    toBeOneOf(received, expected) {
        const pass = expected.includes(received);
        return {
            message: () => `expected ${received} to be one of ${expected.join(', ')}`,
            pass
        };
    }
});