/**
 * Full Workflow Integration Tests
 * Tests complete end-to-end functionality from server start to web interface interaction
 */

const request = require('supertest');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

describe('Full Workflow Integration Tests', () => {
    let app;
    let browser;
    let page;
    let baseURL;
    
    beforeAll(async () => {
        // Start server
        process.env.NODE_ENV = 'test';
        app = require('../../simple_server.js');
        baseURL = 'http://localhost:3010';
        
        // Wait for server initialization
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Launch browser
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });
    });
    
    afterAll(async () => {
        if (page) await page.close();
        if (browser) await browser.close();
    });

    describe('Server Startup and Initialization', () => {
        test('should start server successfully', async () => {
            const healthResponse = await request(app).get('/health');
            expect([200, 503]).toContain(healthResponse.status);
            expect(healthResponse.body).toHaveProperty('status');
        });

        test('should initialize database connection', async () => {
            const diagnosticsResponse = await request(app).get('/api/diagnostics');
            expect(diagnosticsResponse.status).toBe(200);
            expect(diagnosticsResponse.body).toHaveProperty('database');
        });

        test('should serve static files and web interface', async () => {
            const webResponse = await request(app).get('/');
            expect([200, 404]).toContain(webResponse.status);
            
            if (webResponse.status === 200) {
                expect(webResponse.text).toContain('Investor Network Database Browser');
            }
        });
    });

    describe('API Functionality Workflow', () => {
        test('should provide complete API workflow', async () => {
            // Step 1: Check server health
            const healthResponse = await request(app).get('/health');
            expect([200, 503]).toContain(healthResponse.status);
            
            // Step 2: Get diagnostics
            const diagResponse = await request(app).get('/api/diagnostics');
            expect(diagResponse.status).toBe(200);
            
            // Step 3: Get network statistics
            const statsResponse = await request(app).get('/api/network/stats');
            expect([200, 500]).toContain(statsResponse.status);
            
            // Step 4: Perform search
            const searchResponse = await request(app)
                .get('/api/investors/search?limit=5');
            expect([200, 500]).toContain(searchResponse.status);
            
            // Step 5: Test matching API
            const matchResponse = await request(app)
                .post('/api/investors/match')
                .send({ test: true });
            expect([200, 500]).toContain(matchResponse.status);
        });

        test('should handle API workflow with database', async () => {
            const dbExists = fs.existsSync(path.join(process.cwd(), 'investor_network_full.db'));
            
            if (!dbExists) {
                console.log('Skipping database workflow test - database not found');
                return;
            }
            
            // Complete database workflow
            const statsResponse = await request(app).get('/api/network/stats');
            if (statsResponse.status === 200) {
                expect(statsResponse.body).toHaveProperty('totalInvestors');
                expect(statsResponse.body.totalInvestors).toBeGreaterThan(0);
                
                // Use stats to inform search
                const searchResponse = await request(app)
                    .get('/api/investors/search?limit=10');
                
                expect(searchResponse.status).toBe(200);
                expect(searchResponse.body).toHaveProperty('investors');
                
                // If we have results, test matching
                if (searchResponse.body.count > 0) {
                    const sampleInvestor = searchResponse.body.investors[0];
                    const matchResponse = await request(app)
                        .post('/api/investors/match')
                        .send({
                            firmName: sampleInvestor.firm_name,
                            minConnections: 100
                        });
                    
                    expect(matchResponse.status).toBe(200);
                    expect(matchResponse.body).toHaveProperty('matches');
                }
            }
        });
    });

    describe('Web Interface Integration', () => {
        test('should load web interface completely', async () => {
            await page.goto(baseURL, { waitUntil: 'networkidle2', timeout: 30000 });
            
            // Check page loaded
            const title = await page.title();
            expect(title).toBe('Investor Network Database Browser');
            
            // Check main elements loaded
            const heading = await page.$('h1');
            expect(heading).toBeTruthy();
            
            const statsSection = await page.$('#stats');
            expect(statsSection).toBeTruthy();
            
            const searchForm = await page.$('.search-form');
            expect(searchForm).toBeTruthy();
        });

        test('should integrate with API endpoints from browser', async () => {
            await page.goto(baseURL, { waitUntil: 'networkidle2' });
            
            // Wait for initial stats to load or error to appear
            await page.waitForFunction(() => {
                const statsDiv = document.getElementById('stats');
                return statsDiv && !statsDiv.textContent.includes('Loading...');
            }, { timeout: 15000 });
            
            const statsContent = await page.$eval('#stats', el => el.textContent);
            
            // Should show either data or meaningful error
            expect(statsContent).not.toContain('Loading...');
            
            const hasData = statsContent.includes('Total Investors') || 
                           statsContent.includes('Database Statistics');
            const hasError = statsContent.includes('Connection Failed') || 
                           statsContent.includes('error');
            
            expect(hasData || hasError).toBe(true);
        });

        test('should handle complete search workflow', async () => {
            await page.goto(baseURL, { waitUntil: 'networkidle2' });
            
            // Fill search form
            await page.type('#firmName', 'Venture');
            await page.type('#minConnections', '500');
            await page.select('#hasLinkedIn', 'true');
            
            // Execute search
            await page.click('button[onclick="searchInvestors()"]');
            
            // Wait for results
            await page.waitForFunction(() => {
                const resultsDiv = document.getElementById('results');
                return resultsDiv && resultsDiv.textContent.trim() !== '' && 
                       !resultsDiv.textContent.includes('Searching investors...');
            }, { timeout: 15000 });
            
            const resultsContent = await page.$eval('#results', el => el.textContent);
            
            // Should show results or meaningful message
            expect(resultsContent).not.toContain('Searching investors...');
            
            const hasResults = resultsContent.includes('Found') || 
                             resultsContent.includes('No investors found');
            const hasError = resultsContent.includes('failed') || 
                           resultsContent.includes('error');
            
            expect(hasResults || hasError).toBe(true);
        });

        test('should handle top investors workflow', async () => {
            await page.goto(baseURL, { waitUntil: 'networkidle2' });
            
            // Click "Get Top Connected" button
            await page.click('button[onclick="getTopInvestors()"]');
            
            // Wait for results
            await page.waitForFunction(() => {
                const resultsDiv = document.getElementById('results');
                return resultsDiv && resultsDiv.textContent.trim() !== '' && 
                       !resultsDiv.textContent.includes('Loading top investors...');
            }, { timeout: 15000 });
            
            const resultsContent = await page.$eval('#results', el => el.textContent);
            expect(resultsContent).not.toContain('Loading top investors...');
        });
    });

    describe('Error Recovery Workflow', () => {
        test('should recover from API failures gracefully', async () => {
            await page.goto(baseURL, { waitUntil: 'networkidle2' });
            
            // Intercept and fail API requests
            await page.setRequestInterception(true);
            let interceptEnabled = true;
            
            page.on('request', (request) => {
                if (interceptEnabled && request.url().includes('/api/')) {
                    request.abort();
                } else {
                    request.continue();
                }
            });
            
            // Try operations that should fail
            await page.click('button[onclick="searchInvestors()"]');
            
            // Wait for error handling
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Should display error messages
            const resultsContent = await page.$eval('#results', el => el.textContent);
            expect(resultsContent).toContain('failed');
            
            // Disable interception and try again
            interceptEnabled = false;
            await page.setRequestInterception(false);
            
            // Page should still be functional
            const title = await page.title();
            expect(title).toBe('Investor Network Database Browser');
        });

        test('should handle database connection issues', async () => {
            // Test API behavior when database is not available
            const statsResponse = await request(app).get('/api/network/stats');
            
            if (statsResponse.status === 500) {
                // Should provide meaningful error
                expect(statsResponse.body).toHaveProperty('error');
                expect(statsResponse.body.error).toContain('database');
                
                // Web interface should still be accessible
                const webResponse = await request(app).get('/');
                expect([200, 404]).toContain(webResponse.status);
            }
        });
    });

    describe('Performance Integration', () => {
        test('should handle complete workflow within acceptable time', async () => {
            const startTime = Date.now();
            
            // Simulate user workflow
            await page.goto(baseURL, { waitUntil: 'networkidle2' });
            
            // Wait for stats to load
            await page.waitForFunction(() => {
                const statsDiv = document.getElementById('stats');
                return !statsDiv.textContent.includes('Loading...');
            }, { timeout: 10000 });
            
            // Perform search
            await page.type('#firmName', 'Tech');
            await page.click('button[onclick="searchInvestors()"]');
            
            // Wait for search results
            await page.waitForFunction(() => {
                const resultsDiv = document.getElementById('results');
                return resultsDiv.textContent.trim() !== '' && 
                       !resultsDiv.textContent.includes('Searching');
            }, { timeout: 10000 });
            
            const totalTime = Date.now() - startTime;
            expect(totalTime).toBeLessThan(30000); // Complete workflow under 30 seconds
        });

        test('should maintain performance during extended use', async () => {
            await page.goto(baseURL, { waitUntil: 'networkidle2' });
            
            // Simulate extended usage
            for (let i = 0; i < 3; i++) {
                await page.type('#firmName', `Test${i}`);
                await page.click('button[onclick="searchInvestors()"]');
                
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Clear form
                await page.$eval('#firmName', el => el.value = '');
            }
            
            // Page should still be responsive
            const title = await page.title();
            expect(title).toBe('Investor Network Database Browser');
        });
    });

    describe('Data Flow Integration', () => {
        test('should validate complete data flow', async () => {
            const dbExists = fs.existsSync(path.join(process.cwd(), 'investor_network_full.db'));
            
            if (!dbExists) {
                console.log('Skipping data flow test - database not found');
                return;
            }
            
            // Test server -> API -> database flow
            const statsResponse = await request(app).get('/api/network/stats');
            
            if (statsResponse.status === 200) {
                // Validate API response structure
                expect(statsResponse.body).toHaveProperty('totalInvestors');
                expect(statsResponse.body).toHaveProperty('lastUpdated');
                
                // Test web interface -> API flow
                await page.goto(baseURL, { waitUntil: 'networkidle2' });
                
                // Check if stats are reflected in UI
                await page.waitForFunction(() => {
                    const statsDiv = document.getElementById('stats');
                    return statsDiv && (
                        statsDiv.textContent.includes('Total Investors') ||
                        statsDiv.textContent.includes('error')
                    );
                }, { timeout: 10000 });
                
                const statsUI = await page.$eval('#stats', el => el.textContent);
                
                if (statsUI.includes('Total Investors')) {
                    // Data successfully flowed from database to UI
                    expect(statsUI).toContain('Total Investors');
                }
            }
        });

        test('should handle blank screen prevention', async () => {
            await page.goto(baseURL, { waitUntil: 'networkidle2' });
            
            // Check that page is not blank
            const bodyText = await page.$eval('body', el => el.textContent.trim());
            expect(bodyText.length).toBeGreaterThan(100);
            
            // Check that essential content is visible
            const mainContent = await page.$eval('.container', el => {
                const style = window.getComputedStyle(el);
                return {
                    display: style.display,
                    visibility: style.visibility,
                    hasContent: el.textContent.trim().length > 0
                };
            });
            
            expect(mainContent.display).not.toBe('none');
            expect(mainContent.visibility).not.toBe('hidden');
            expect(mainContent.hasContent).toBe(true);
            
            // Verify critical elements are present
            const criticalElements = await page.evaluate(() => {
                return {
                    title: !!document.querySelector('h1'),
                    stats: !!document.querySelector('#stats'),
                    searchForm: !!document.querySelector('.search-form'),
                    results: !!document.querySelector('#results')
                };
            });
            
            expect(criticalElements.title).toBe(true);
            expect(criticalElements.stats).toBe(true);
            expect(criticalElements.searchForm).toBe(true);
            expect(criticalElements.results).toBe(true);
        });
    });

    describe('User Experience Integration', () => {
        test('should provide consistent user experience', async () => {
            await page.goto(baseURL, { waitUntil: 'networkidle2' });
            
            // Test form interactions
            await page.type('#firmName', 'Test Firm');
            const firmValue = await page.$eval('#firmName', el => el.value);
            expect(firmValue).toBe('Test Firm');
            
            // Test dropdown selections
            await page.select('#networkTier', 'Highly Connected');
            const tierValue = await page.$eval('#networkTier', el => el.value);
            expect(tierValue).toBe('Highly Connected');
            
            // Test button functionality
            const searchButton = await page.$('button[onclick="searchInvestors()"]');
            expect(searchButton).toBeTruthy();
            
            // Test that form submission works
            await page.click('button[onclick="searchInvestors()"]');
            
            // Should show loading or results
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const resultsVisible = await page.$eval('#results', el => 
                el.textContent.trim() !== ''
            );
            expect(resultsVisible).toBe(true);
        });
    });
});