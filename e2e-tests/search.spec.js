/**
 * End-to-End Tests for Nvestiv Search Functionality
 */

const { test, expect } = require('@playwright/test');

test.describe('Nvestiv Search Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
  });

  test('should load search page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Search.*Nvestiv/);
    
    const searchContent = page.locator('[data-testid="search-content"]');
    await expect(searchContent).toBeVisible({ timeout: 10000 });
  });

  test('should have prominent search interface', async ({ page }) => {
    // Main search input should be visible and prominent
    const searchInput = page.locator('[data-testid="main-search-input"], input[type="search"], input[placeholder*="search" i]').first();
    await expect(searchInput).toBeVisible();
    
    // Search button should be present
    const searchButton = page.locator('[data-testid="search-button"], button[type="submit"], button:has-text("Search")');
    await expect(searchButton).toBeVisible();
  });

  test('should perform basic text search', async ({ page }) => {
    const searchInput = page.locator('[data-testid="main-search-input"], input[type="search"], input[placeholder*="search" i]').first();
    const searchButton = page.locator('[data-testid="search-button"], button[type="submit"], button:has-text("Search")');
    
    // Enter search term
    await searchInput.fill('fintech');
    await searchButton.click();
    
    // Wait for results
    await page.waitForTimeout(3000);
    
    // Check for search results
    const results = page.locator('[data-testid="search-results"]');
    await expect(results).toBeVisible({ timeout: 10000 });
    
    // Should have at least one result
    const resultItems = page.locator('[data-testid="search-result-item"], .search-result');
    await expect(resultItems.first()).toBeVisible({ timeout: 5000 });
  });

  test('should test AI-powered search if available', async ({ page }) => {
    // Look for AI search toggle or option
    const aiSearchToggle = page.locator('[data-testid="ai-search-toggle"], input[type="checkbox"]:near(:text("AI"))', {
      hasText: /AI|intelligent|smart/i
    });
    
    if (await aiSearchToggle.isVisible()) {
      await aiSearchToggle.check();
      
      const searchInput = page.locator('[data-testid="main-search-input"], input[type="search"]').first();
      await searchInput.fill('companies focused on sustainable technology and green energy');
      
      const searchButton = page.locator('[data-testid="search-button"], button:has-text("Search")');
      await searchButton.click();
      
      // Wait for AI search results (may take longer)
      await page.waitForTimeout(5000);
      
      const results = page.locator('[data-testid="search-results"]');
      await expect(results).toBeVisible({ timeout: 15000 });
    }
  });

  test('should support different search types', async ({ page }) => {
    // Test investor search
    const searchTypeSelector = page.locator('[data-testid="search-type"], select[name="type"]');
    
    if (await searchTypeSelector.isVisible()) {
      await searchTypeSelector.selectOption('investors');
      
      const searchInput = page.locator('[data-testid="main-search-input"]').first();
      await searchInput.fill('venture capital');
      
      const searchButton = page.locator('[data-testid="search-button"]');
      await searchButton.click();
      
      await page.waitForTimeout(3000);
      
      // Results should be investor-focused
      const results = page.locator('[data-testid="search-results"]');
      await expect(results).toBeVisible();
    }
  });

  test('should display search suggestions', async ({ page }) => {
    const searchInput = page.locator('[data-testid="main-search-input"], input[type="search"]').first();
    
    // Start typing to trigger suggestions
    await searchInput.fill('tech');
    await page.waitForTimeout(1000);
    
    // Look for dropdown suggestions
    const suggestions = page.locator('[data-testid="search-suggestions"], .suggestions, .dropdown-menu');
    
    if (await suggestions.isVisible({ timeout: 3000 })) {
      const suggestionItems = suggestions.locator('li, .suggestion-item');
      await expect(suggestionItems.first()).toBeVisible();
      
      // Click on a suggestion
      await suggestionItems.first().click();
      
      // Should trigger search
      await page.waitForTimeout(2000);
      const results = page.locator('[data-testid="search-results"]');
      await expect(results).toBeVisible();
    }
  });

  test('should handle advanced search filters', async ({ page }) => {
    // Look for advanced search or filter options
    const advancedSearch = page.locator('[data-testid="advanced-search"], .advanced-filters, button:has-text("Advanced")');
    
    if (await advancedSearch.isVisible()) {
      await advancedSearch.click();
      
      // Look for filter options
      const locationFilter = page.locator('[data-testid="location-filter"], select[name="location"]');
      const sectorFilter = page.locator('[data-testid="sector-filter"], select[name="sector"]');
      
      if (await locationFilter.isVisible()) {
        await locationFilter.selectOption({ index: 1 });
      }
      
      if (await sectorFilter.isVisible()) {
        await sectorFilter.selectOption({ index: 1 });
      }
      
      // Perform filtered search
      const searchInput = page.locator('[data-testid="main-search-input"]').first();
      await searchInput.fill('startup');
      
      const searchButton = page.locator('[data-testid="search-button"]');
      await searchButton.click();
      
      await page.waitForTimeout(3000);
      
      const results = page.locator('[data-testid="search-results"]');
      await expect(results).toBeVisible();
    }
  });

  test('should show search result details', async ({ page }) => {
    // Perform a search first
    const searchInput = page.locator('[data-testid="main-search-input"], input[type="search"]').first();
    await searchInput.fill('artificial intelligence');
    
    const searchButton = page.locator('[data-testid="search-button"], button:has-text("Search")');
    await searchButton.click();
    
    await page.waitForTimeout(3000);
    
    // Check for detailed result information
    const resultItems = page.locator('[data-testid="search-result-item"], .search-result');
    await expect(resultItems.first()).toBeVisible({ timeout: 10000 });
    
    // Each result should have key information
    const firstResult = resultItems.first();
    
    // Should have name/title
    const resultTitle = firstResult.locator('[data-testid="result-title"], .result-name, h3, h4');
    await expect(resultTitle).toBeVisible();
    
    // Should have description or summary
    const resultDescription = firstResult.locator('[data-testid="result-description"], .result-summary, p');
    await expect(resultDescription).toBeVisible();
  });

  test('should handle empty search results', async ({ page }) => {
    const searchInput = page.locator('[data-testid="main-search-input"], input[type="search"]').first();
    await searchInput.fill('xyzunlikelysearchterm123456');
    
    const searchButton = page.locator('[data-testid="search-button"], button:has-text("Search")');
    await searchButton.click();
    
    await page.waitForTimeout(3000);
    
    // Should show no results message
    const noResults = page.locator('[data-testid="no-results"], .no-results, :text("No results found")');
    await expect(noResults).toBeVisible({ timeout: 5000 });
  });

  test('should support result navigation', async ({ page }) => {
    // Perform search
    const searchInput = page.locator('[data-testid="main-search-input"], input[type="search"]').first();
    await searchInput.fill('venture');
    
    const searchButton = page.locator('[data-testid="search-button"]');
    await searchButton.click();
    
    await page.waitForTimeout(3000);
    
    // Click on a search result
    const resultItems = page.locator('[data-testid="search-result-item"], .search-result');
    await expect(resultItems.first()).toBeVisible({ timeout: 10000 });
    
    const firstResultLink = resultItems.first().locator('a, [data-testid="result-link"]').first();
    
    if (await firstResultLink.isVisible()) {
      await firstResultLink.click();
      
      // Should navigate to detail page
      await page.waitForLoadState('networkidle');
      
      // URL should change
      const url = page.url();
      expect(url).not.toEqual(page.url());
    }
  });

  test('should maintain search history', async ({ page }) => {
    // Perform multiple searches
    const searchInput = page.locator('[data-testid="main-search-input"], input[type="search"]').first();
    const searchButton = page.locator('[data-testid="search-button"]');
    
    const searches = ['fintech', 'healthcare', 'blockchain'];
    
    for (const term of searches) {
      await searchInput.fill(term);
      await searchButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Check if search history is available
    const searchHistory = page.locator('[data-testid="search-history"], .search-history');
    
    if (await searchHistory.isVisible()) {
      // Should contain recent searches
      for (const term of searches) {
        const historyItem = searchHistory.locator(`:text("${term}")`);
        await expect(historyItem).toBeVisible();
      }
    }
  });

  test('should handle search loading states', async ({ page }) => {
    const searchInput = page.locator('[data-testid="main-search-input"], input[type="search"]').first();
    await searchInput.fill('comprehensive search test');
    
    const searchButton = page.locator('[data-testid="search-button"]');
    await searchButton.click();
    
    // Look for loading indicator
    const loadingIndicator = page.locator('[data-testid="search-loading"], .loading, .spinner');
    
    if (await loadingIndicator.isVisible({ timeout: 2000 })) {
      await expect(loadingIndicator).toBeHidden({ timeout: 15000 });
    }
    
    // Results should eventually appear
    const results = page.locator('[data-testid="search-results"]');
    await expect(results).toBeVisible({ timeout: 15000 });
  });

  test('should be keyboard accessible', async ({ page }) => {
    const searchInput = page.locator('[data-testid="main-search-input"], input[type="search"]').first();
    
    // Should be able to tab to search input
    await page.keyboard.press('Tab');
    await expect(searchInput).toBeFocused();
    
    // Should be able to search with Enter key
    await searchInput.fill('keyboard test');
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(3000);
    
    const results = page.locator('[data-testid="search-results"]');
    await expect(results).toBeVisible({ timeout: 10000 });
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept search API and simulate error
    await page.route('**/api/search/**', route => route.abort());
    
    const searchInput = page.locator('[data-testid="main-search-input"], input[type="search"]').first();
    await searchInput.fill('error test');
    
    const searchButton = page.locator('[data-testid="search-button"]');
    await searchButton.click();
    
    await page.waitForTimeout(3000);
    
    // Should show error message
    const errorMessage = page.locator('[data-testid="search-error"], .error-message, .alert-destructive');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });
});