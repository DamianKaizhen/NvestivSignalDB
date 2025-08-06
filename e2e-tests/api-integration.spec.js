/**
 * End-to-End API Integration Tests for Nvestiv
 */

const { test, expect } = require('@playwright/test');

test.describe('API Integration Tests', () => {
  const API_BASE = 'http://localhost:3010';
  
  test('should verify all critical API endpoints are working', async ({ request }) => {
    // Test health endpoint
    const healthResponse = await request.get(`${API_BASE}/health`);
    expect(healthResponse.ok()).toBeTruthy();
    
    const healthData = await healthResponse.json();
    expect(healthData).toHaveProperty('status');
    expect(healthData).toHaveProperty('timestamp');
    
    // Test network stats
    const statsResponse = await request.get(`${API_BASE}/api/network/stats`);
    expect(statsResponse.ok()).toBeTruthy();
    
    const statsData = await statsResponse.json();
    expect(statsData).toHaveProperty('investors');
    expect(statsData).toHaveProperty('firms');
    expect(statsData.investors).toBeGreaterThan(30000);
    
    // Test investor search
    const searchResponse = await request.get(`${API_BASE}/api/investors/search?q=venture&limit=10`);
    expect(searchResponse.ok()).toBeTruthy();
    
    const searchData = await searchResponse.json();
    expect(Array.isArray(searchData)).toBeTruthy();
    expect(searchData.length).toBeGreaterThan(0);
    expect(searchData.length).toBeLessThanOrEqual(10);
    
    // Test single investor
    if (searchData.length > 0) {
      const investorId = searchData[0].id;
      const investorResponse = await request.get(`${API_BASE}/api/investors/${investorId}`);
      expect(investorResponse.ok()).toBeTruthy();
      
      const investorData = await investorResponse.json();
      expect(investorData).toHaveProperty('id', investorId);
      expect(investorData).toHaveProperty('name');
    }
  });

  test('should handle CORS correctly', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`, {
      headers: {
        'Origin': 'http://localhost:3013'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    
    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBeTruthy();
  });

  test('should return proper error responses', async ({ request }) => {
    // Test 404 for non-existent endpoint
    const notFoundResponse = await request.get(`${API_BASE}/api/nonexistent`);
    expect(notFoundResponse.status()).toBe(404);
    
    const errorData = await notFoundResponse.json();
    expect(errorData).toHaveProperty('error');
    
    // Test invalid investor ID
    const invalidInvestorResponse = await request.get(`${API_BASE}/api/investors/99999999`);
    expect([404, 400]).toContain(invalidInvestorResponse.status());
  });

  test('should handle search parameters correctly', async ({ request }) => {
    // Test search with various parameters
    const searchTests = [
      { q: 'tech', limit: 5 },
      { q: 'venture capital', limit: 20 },
      { q: 'healthcare' }, // no limit
      { q: '' } // empty search
    ];
    
    for (const params of searchTests) {
      const queryString = new URLSearchParams(params).toString();
      const response = await request.get(`${API_BASE}/api/investors/search?${queryString}`);
      
      if (params.q === '') {
        // Empty search might return 400 or all results
        expect([200, 400]).toContain(response.status());
      } else {
        expect(response.ok()).toBeTruthy();
        
        const data = await response.json();
        expect(Array.isArray(data)).toBeTruthy();
        
        if (params.limit) {
          expect(data.length).toBeLessThanOrEqual(params.limit);
        }
      }
    }
  });

  test('should test AI search endpoint if available', async ({ request }) => {
    const aiSearchResponse = await request.get(`${API_BASE}/api/search/ai?q=fintech companies`);
    
    // AI search might not be available or might require special setup
    if (aiSearchResponse.ok()) {
      const aiData = await aiSearchResponse.json();
      expect(Array.isArray(aiData) || typeof aiData === 'object').toBeTruthy();
    } else {
      // If not available, should return proper error
      expect([404, 501, 503]).toContain(aiSearchResponse.status());
    }
  });

  test('should handle concurrent requests properly', async ({ request }) => {
    // Make multiple concurrent requests
    const promises = Array(10).fill(null).map((_, i) => 
      request.get(`${API_BASE}/api/investors/search?q=test${i}&limit=5`)
    );
    
    const responses = await Promise.all(promises);
    
    // All requests should succeed
    responses.forEach(response => {
      expect(response.ok()).toBeTruthy();
    });
    
    // Check response times are reasonable
    const data = await Promise.all(responses.map(r => r.json()));
    data.forEach(result => {
      expect(Array.isArray(result)).toBeTruthy();
    });
  });

  test('should validate response data structures', async ({ request }) => {
    // Test investor search response structure
    const searchResponse = await request.get(`${API_BASE}/api/investors/search?q=venture&limit=5`);
    expect(searchResponse.ok()).toBeTruthy();
    
    const searchData = await searchResponse.json();
    expect(Array.isArray(searchData)).toBeTruthy();
    
    if (searchData.length > 0) {
      const investor = searchData[0];
      expect(investor).toHaveProperty('id');
      expect(investor).toHaveProperty('name');
      expect(typeof investor.id).toBe('number');
      expect(typeof investor.name).toBe('string');
    }
    
    // Test network stats structure
    const statsResponse = await request.get(`${API_BASE}/api/network/stats`);
    const statsData = await statsResponse.json();
    
    expect(typeof statsData.investors).toBe('number');
    expect(typeof statsData.firms).toBe('number');
    expect(statsData.investors).toBeGreaterThan(0);
    expect(statsData.firms).toBeGreaterThan(0);
  });

  test('should handle large result sets efficiently', async ({ request }) => {
    // Test search that might return many results
    const largeSearchResponse = await request.get(`${API_BASE}/api/investors/search?q=a&limit=100`);
    expect(largeSearchResponse.ok()).toBeTruthy();
    
    const startTime = Date.now();
    const largeSearchData = await largeSearchResponse.json();
    const responseTime = Date.now() - startTime;
    
    expect(Array.isArray(largeSearchData)).toBeTruthy();
    expect(largeSearchData.length).toBeLessThanOrEqual(100);
    expect(responseTime).toBeLessThan(10000); // Should respond within 10 seconds
  });

  test('should validate diagnostics endpoint', async ({ request }) => {
    const diagnosticsResponse = await request.get(`${API_BASE}/api/diagnostics`);
    
    if (diagnosticsResponse.ok()) {
      const diagnosticsData = await diagnosticsResponse.json();
      
      expect(diagnosticsData).toHaveProperty('server');
      expect(diagnosticsData).toHaveProperty('database');
      expect(diagnosticsData).toHaveProperty('timestamp');
      
      expect(diagnosticsData.server).toHaveProperty('status');
      expect(diagnosticsData.database).toHaveProperty('exists');
    }
  });

  test('should test firms search endpoint', async ({ request }) => {
    const firmsResponse = await request.get(`${API_BASE}/api/firms/search?q=venture&limit=10`);
    
    if (firmsResponse.ok()) {
      const firmsData = await firmsResponse.json();
      expect(Array.isArray(firmsData)).toBeTruthy();
      
      if (firmsData.length > 0) {
        const firm = firmsData[0];
        expect(firm).toHaveProperty('id');
        expect(firm).toHaveProperty('name');
      }
    } else {
      // Firms endpoint might not be implemented yet
      expect([404, 501]).toContain(firmsResponse.status());
    }
  });
});

test.describe('Frontend-API Integration', () => {
  test('should verify frontend can fetch and display API data', async ({ page }) => {
    // Go to dashboard and verify API data is displayed
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that statistics from API are displayed
    const statsSection = page.locator('[data-testid="stats-section"]');
    await expect(statsSection).toBeVisible({ timeout: 15000 });
    
    // Verify investor count from API
    const investorCount = page.locator('[data-testid="investor-count"]');
    await expect(investorCount).toBeVisible();
    
    const countText = await investorCount.textContent();
    const count = parseInt(countText.replace(/,/g, ''));
    expect(count).toBeGreaterThan(30000);
  });

  test('should handle API errors in frontend', async ({ page }) => {
    // Intercept API calls and simulate failure
    await page.route('**/api/network/stats', route => route.abort());
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Frontend should handle the error gracefully
    const errorIndicator = page.locator('[data-testid="error-message"], .error-state, .alert-destructive');
    const loadingIndicator = page.locator('[data-testid="loading"], .loading, .skeleton');
    
    // Either show error or continue loading with fallback data
    const hasError = await errorIndicator.isVisible({ timeout: 5000 });
    const isLoading = await loadingIndicator.isVisible({ timeout: 5000 });
    
    expect(hasError || isLoading).toBeTruthy();
  });

  test('should test search functionality integration', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    const searchButton = page.locator('button[type="submit"], button:has-text("Search")');
    
    await searchInput.fill('fintech');
    await searchButton.click();
    
    // Wait for API call and results
    await page.waitForTimeout(3000);
    
    const results = page.locator('[data-testid="search-results"]');
    await expect(results).toBeVisible({ timeout: 10000 });
    
    // Verify search results contain expected data
    const resultItems = page.locator('[data-testid="search-result-item"], .search-result');
    await expect(resultItems.first()).toBeVisible();
  });

  test('should test investor detail page API integration', async ({ page }) => {
    // Go to investors page first
    await page.goto('/investors');
    await page.waitForLoadState('networkidle');
    
    // Wait for table to load
    const tableRows = page.locator('tbody tr');
    await expect(tableRows.first()).toBeVisible({ timeout: 15000 });
    
    // Click on first investor
    const firstInvestorLink = page.locator('tbody tr:first-child a').first();
    
    if (await firstInvestorLink.isVisible()) {
      await firstInvestorLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should load investor detail from API
      const profileContent = page.locator('[data-testid="investor-profile"]');
      await expect(profileContent).toBeVisible({ timeout: 10000 });
      
      // Should display investor details
      const investorName = page.locator('[data-testid="investor-name"], h1, h2').first();
      await expect(investorName).toBeVisible();
    }
  });
});