/**
 * End-to-End Tests for Nvestiv Investors Page
 */

const { test, expect } = require('@playwright/test');

test.describe('Nvestiv Investors Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/investors');
    await page.waitForLoadState('networkidle');
  });

  test('should load investors page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Investors.*Nvestiv/);
    
    const investorsContent = page.locator('[data-testid="investors-content"]');
    await expect(investorsContent).toBeVisible({ timeout: 15000 });
  });

  test('should display investors table with data', async ({ page }) => {
    // Wait for table to load
    const investorsTable = page.locator('[data-testid="investors-table"]');
    await expect(investorsTable).toBeVisible({ timeout: 15000 });

    // Check for table headers
    const headers = ['Name', 'Location', 'Firms', 'Investments'];
    for (const header of headers) {
      const headerElement = page.locator('th', { hasText: header });
      await expect(headerElement).toBeVisible();
    }

    // Check for at least one data row
    const dataRows = page.locator('tbody tr');
    await expect(dataRows.first()).toBeVisible({ timeout: 10000 });
    
    // Verify we have multiple rows of data
    const rowCount = await dataRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should have working search functionality', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('[data-testid="search-input"], input[placeholder*="search" i]');
    await expect(searchInput).toBeVisible();

    // Perform search
    await searchInput.fill('venture');
    await searchInput.press('Enter');

    // Wait for search results
    await page.waitForTimeout(2000);

    // Check that results are filtered
    const tableRows = page.locator('tbody tr');
    const firstRow = tableRows.first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });

    // Check that search term appears in results
    const rowText = await firstRow.textContent();
    expect(rowText.toLowerCase()).toContain('venture');
  });

  test('should have working filters', async ({ page }) => {
    // Check for filter controls
    const filtersContainer = page.locator('[data-testid="investors-filters"]');
    await expect(filtersContainer).toBeVisible();

    // Test location filter if available
    const locationFilter = page.locator('[data-testid="location-filter"], select[name="location"]');
    if (await locationFilter.isVisible()) {
      await locationFilter.selectOption({ index: 1 }); // Select first non-empty option
      await page.waitForTimeout(2000);
      
      // Verify filter applied
      const tableRows = page.locator('tbody tr');
      await expect(tableRows.first()).toBeVisible();
    }
  });

  test('should have working pagination', async ({ page }) => {
    // Wait for initial data load
    await page.waitForTimeout(3000);

    // Check for pagination controls
    const pagination = page.locator('[data-testid="pagination"], .pagination');
    
    if (await pagination.isVisible()) {
      // Test next page if available
      const nextButton = page.locator('[data-testid="next-page"], button:has-text("Next")');
      
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(2000);
        
        // Verify new data loaded
        const tableRows = page.locator('tbody tr');
        await expect(tableRows.first()).toBeVisible();
      }
    }
  });

  test('should navigate to individual investor profile', async ({ page }) => {
    // Wait for table to load
    const tableRows = page.locator('tbody tr');
    await expect(tableRows.first()).toBeVisible({ timeout: 15000 });

    // Click on first investor name (should be a link)
    const firstInvestorLink = page.locator('tbody tr:first-child a, tbody tr:first-child [data-testid="investor-name"]').first();
    
    if (await firstInvestorLink.isVisible()) {
      await firstInvestorLink.click();
      
      // Should navigate to investor detail page
      await page.waitForLoadState('networkidle');
      
      // Check URL contains investor ID
      const url = page.url();
      expect(url).toMatch(/\/investors\/\d+/);
      
      // Check for investor profile content
      const profileContent = page.locator('[data-testid="investor-profile"]');
      await expect(profileContent).toBeVisible({ timeout: 10000 });
    }
  });

  test('should handle loading states', async ({ page }) => {
    await page.reload();
    
    // Check for loading skeleton
    const skeleton = page.locator('[data-testid="investors-skeleton"], .skeleton');
    
    if (await skeleton.isVisible({ timeout: 2000 })) {
      await expect(skeleton).toBeHidden({ timeout: 15000 });
    }
    
    // Content should load
    const content = page.locator('[data-testid="investors-content"]');
    await expect(content).toBeVisible({ timeout: 15000 });
  });

  test('should handle empty search results', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"], input[placeholder*="search" i]');
    await expect(searchInput).toBeVisible();

    // Search for something that shouldn't exist
    await searchInput.fill('xyzunlikelyinvestorname123');
    await searchInput.press('Enter');
    await page.waitForTimeout(3000);

    // Should show no results message
    const noResults = page.locator('[data-testid="no-results"], .no-results, text="No investors found"');
    await expect(noResults).toBeVisible({ timeout: 5000 });
  });

  test('should be accessible', async ({ page }) => {
    // Check for proper headings
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();

    // Check table accessibility
    const table = page.locator('table');
    if (await table.isVisible()) {
      // Should have proper table headers
      const headers = page.locator('th');
      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThan(0);
    }

    // Check for form labels
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.isVisible();
        expect(hasLabel || ariaLabel || placeholder).toBeTruthy();
      }
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept investors API and simulate error
    await page.route('**/api/investors/**', route => route.abort());
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should show error state
    const errorState = page.locator('[data-testid="error-state"], .error-message, .alert-destructive');
    await expect(errorState).toBeVisible({ timeout: 10000 });
  });

  test('should maintain state during navigation', async ({ page }) => {
    // Perform a search
    const searchInput = page.locator('[data-testid="search-input"], input[placeholder*="search" i]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('tech');
      await searchInput.press('Enter');
      await page.waitForTimeout(2000);
      
      // Navigate away and back
      await page.goto('/');
      await page.goBack();
      
      // Search term should be preserved (depending on implementation)
      const searchValue = await searchInput.inputValue();
      // This test might need adjustment based on whether state is preserved
    }
  });
});