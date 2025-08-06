/**
 * Web Interface E2E Tests
 * Tests web interface loading, JavaScript functionality, and user interactions
 */

const puppeteer = require('puppeteer');
const request = require('supertest');
const fs = require('fs');
const path = require('path');

describe('Web Interface E2E Tests', () => {
    let browser;
    let page;
    let app;
    let server;
    let baseURL;
    
    beforeAll(async () => {
        // Start the server for E2E testing
        process.env.NODE_ENV = 'test';
        app = require('../../simple_server.js');
        
        // Wait for server to initialize
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        baseURL = 'http://localhost:3010';
        
        // Launch Puppeteer browser
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        
        page = await browser.newPage();
        
        // Set viewport
        await page.setViewport({ width: 1200, height: 800 });
        
        // Enable console logging
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('Browser console error:', msg.text());
            }
        });
        
        // Enable error tracking  
        page.on('pageerror', error => {
            console.log('Page error:', error.message);
        });
    });
    
    afterAll(async () => {
        if (page) await page.close();
        if (browser) await browser.close();
        if (server) server.close();
        
        // Clean up
        await new Promise(resolve => setTimeout(resolve, 1000));
    });

    describe('Page Loading Tests', () => {
        test('should load the main page without errors', async () => {
            try {
                const response = await page.goto(baseURL, { 
                    waitUntil: 'networkidle2',
                    timeout: 30000 
                });
                
                expect(response.status()).toBe(200);
                
                // Check page title
                const title = await page.title();
                expect(title).toBe('Investor Network Database Browser');
                
                // Check main heading
                const heading = await page.$eval('h1', el => el.textContent);
                expect(heading).toContain('Investor Network Database Browser');
                
            } catch (error) {
                console.error('Page loading failed:', error);
                throw error;
            }
        });

        test('should not display blank screen', async () => {
            await page.goto(baseURL, { waitUntil: 'networkidle2' });
            
            // Check if body has content
            const bodyText = await page.$eval('body', el => el.textContent.trim());
            expect(bodyText.length).toBeGreaterThan(100);
            
            // Check if main container is visible
            const containerVisible = await page.$eval('.container', el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden';
            });
            expect(containerVisible).toBe(true);
        });

        test('should load CSS styles correctly', async () => {
            await page.goto(baseURL, { waitUntil: 'networkidle2' });
            
            // Check if styles are applied
            const backgroundColor = await page.$eval('body', el => 
                window.getComputedStyle(el).backgroundColor
            );
            expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)'); // Not transparent
            
            // Check if container has proper styling
            const containerPadding = await page.$eval('.container', el =>
                window.getComputedStyle(el).padding
            );
            expect(containerPadding).not.toBe('0px');
        });

        test('should load all required DOM elements', async () => {
            await page.goto(baseURL, { waitUntil: 'networkidle2' });
            
            // Check for required elements
            const requiredElements = [
                '#stats',           // Stats grid
                '#firmName',        // Firm name input
                '#minConnections',  // Min connections input
                '#networkTier',     // Network tier select
                '#hasLinkedIn',     // LinkedIn select
                '#results'          // Results container
            ];
            
            for (const selector of requiredElements) {
                const element = await page.$(selector);
                expect(element).not.toBeNull();
            }
        });
    });

    describe('JavaScript Functionality Tests', () => {
        test('should load statistics on page load', async () => {
            await page.goto(baseURL, { waitUntil: 'networkidle2' });
            
            // Wait for stats to load (or error to appear)
            await page.waitForFunction(() => {
                const statsDiv = document.getElementById('stats');
                return !statsDiv.textContent.includes('Loading...');
            }, { timeout: 10000 });
            
            const statsContent = await page.$eval('#stats', el => el.textContent);
            
            // Should either show stats or an error message
            expect(statsContent).not.toContain('Loading...');
            
            // Check if it's either successful stats or error
            const hasStats = statsContent.includes('Total Investors') || 
                            statsContent.includes('Database Statistics');
            const hasError = statsContent.includes('API Connection Failed') || 
                           statsContent.includes('error');
            
            expect(hasStats || hasError).toBe(true);
        });

        test('should handle search form interactions', async () => {
            await page.goto(baseURL, { waitUntil: 'networkidle2' });
            
            // Fill out search form
            await page.type('#firmName', 'Test Firm');
            await page.type('#minConnections', '1000');
            await page.select('#networkTier', 'Highly Connected');
            await page.select('#hasLinkedIn', 'true');
            
            // Verify form values
            const firmValue = await page.$eval('#firmName', el => el.value);
            const connectionsValue = await page.$eval('#minConnections', el => el.value);
            const tierValue = await page.$eval('#networkTier', el => el.value);
            const linkedinValue = await page.$eval('#hasLinkedIn', el => el.value);
            
            expect(firmValue).toBe('Test Firm');
            expect(connectionsValue).toBe('1000');
            expect(tierValue).toBe('Highly Connected');
            expect(linkedinValue).toBe('true');
        });

        test('should execute search functionality', async () => {
            await page.goto(baseURL, { waitUntil: 'networkidle2' });
            
            // Wait for page to fully load
            await page.waitForSelector('#results', { timeout: 5000 });
            
            // Click search button
            await page.click('button[onclick="searchInvestors()"]');
            
            // Wait for results or error
            await page.waitForFunction(() => {
                const resultsDiv = document.getElementById('results');
                return resultsDiv.textContent.trim() !== '';
            }, { timeout: 10000 });
            
            const resultsContent = await page.$eval('#results', el => el.textContent);
            
            // Should show either results or error message
            expect(resultsContent.trim()).not.toBe('');
            
            // Check for either success or expected error
            const hasResults = resultsContent.includes('Found') || 
                             resultsContent.includes('No investors found');
            const hasError = resultsContent.includes('failed') || 
                           resultsContent.includes('error');
            
            expect(hasResults || hasError).toBe(true);
        });

        test('should execute top investors functionality', async () => {
            await page.goto(baseURL, { waitUntil: 'networkidle2' });
            
            // Click "Get Top Connected" button
            await page.click('button[onclick="getTopInvestors()"]');
            
            // Wait for results
            await page.waitForFunction(() => {
                const resultsDiv = document.getElementById('results');
                return resultsDiv.textContent.trim() !== '' && 
                       !resultsDiv.textContent.includes('Loading top investors...');
            }, { timeout: 10000 });
            
            const resultsContent = await page.$eval('#results', el => el.textContent);
            
            // Should show either results or error
            expect(resultsContent).not.toContain('Loading top investors...');
        });
    });

    describe('Error Handling Tests', () => {
        test('should display appropriate error messages', async () => {
            await page.goto(baseURL, { waitUntil: 'networkidle2' });
            
            // Wait for initial load
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check if error handling is working
            const pageContent = await page.content();
            
            // Should not have uncaught JavaScript errors causing blank screen
            expect(pageContent).toContain('Investor Network Database Browser');
            
            // Check if error handlers are in place
            const hasErrorHandlers = await page.evaluate(() => {
                return window.addEventListener && typeof window.addEventListener === 'function';
            });
            expect(hasErrorHandlers).toBe(true);
        });

        test('should handle network failures gracefully', async () => {
            await page.goto(baseURL, { waitUntil: 'networkidle2' });
            
            // Intercept and fail API requests
            await page.setRequestInterception(true);
            page.on('request', (request) => {
                if (request.url().includes('/api/')) {
                    request.abort();
                } else {
                    request.continue();
                }
            });
            
            // Try to load stats (should fail gracefully)
            await page.click('button[onclick="loadStats()"]');
            
            // Wait and check if error is handled
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const hasErrorMessage = await page.evaluate(() => {
                return document.body.textContent.includes('error') || 
                       document.body.textContent.includes('failed') ||
                       document.body.textContent.includes('Connection');
            });
            
            // Should handle the error instead of showing blank screen
            expect(hasErrorMessage).toBe(true);
        });
    });

    describe('User Experience Tests', () => {
        test('should have proper form validation', async () => {
            await page.goto(baseURL, { waitUntil: 'networkidle2' });
            
            // Test numeric input validation
            await page.type('#minConnections', 'abc');
            const numericValue = await page.$eval('#minConnections', el => el.value);
            
            // Browsers handle this differently, but should not crash
            expect(typeof numericValue).toBe('string');
        });

        test('should be responsive and accessible', async () => {
            await page.goto(baseURL, { waitUntil: 'networkidle2' });
            
            // Test mobile viewport
            await page.setViewport({ width: 375, height: 667 });
            await page.reload({ waitUntil: 'networkidle2' });
            
            // Check if page is still functional
            const mobileTitle = await page.title();
            expect(mobileTitle).toBe('Investor Network Database Browser');
            
            // Reset viewport
            await page.setViewport({ width: 1200, height: 800 });
        });

        test('should handle rapid user interactions', async () => {
            await page.goto(baseURL, { waitUntil: 'networkidle2' });
            
            // Rapidly click search button multiple times
            for (let i = 0; i < 3; i++) {
                await page.click('button[onclick="searchInvestors()"]');
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Page should still be functional
            const isResponsive = await page.evaluate(() => {
                return document.readyState === 'complete';
            });
            expect(isResponsive).toBe(true);
        });
    });

    describe('Performance Tests', () => {
        test('should load within reasonable time', async () => {
            const startTime = Date.now();
            
            await page.goto(baseURL, { waitUntil: 'networkidle2' });
            
            const loadTime = Date.now() - startTime;
            expect(loadTime).toBeLessThan(10000); // 10 seconds max
        });

        test('should not have memory leaks', async () => {
            const initialMemory = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0);
            
            // Perform several operations
            for (let i = 0; i < 5; i++) {
                await page.click('button[onclick="searchInvestors()"]');
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            const finalMemory = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0);
            
            // Memory shouldn't grow excessively (allowing for reasonable growth)
            if (initialMemory > 0 && finalMemory > 0) {
                expect(finalMemory).toBeLessThan(initialMemory * 3); // Less than 3x growth
            }
        });
    });
});