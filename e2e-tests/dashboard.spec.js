/**
 * End-to-End Tests for Nvestiv Dashboard
 */

const { test, expect } = require('@playwright/test');

test.describe('Nvestiv Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should load dashboard page successfully', async ({ page }) => {
    // Check if page loads without errors
    await expect(page).toHaveTitle(/Nvestiv/);
    
    // Check for main dashboard elements
    const dashboardContent = page.locator('[data-testid="dashboard-content"]');
    await expect(dashboardContent).toBeVisible({ timeout: 10000 });
  });

  test('should display key metrics and statistics', async ({ page }) => {
    // Wait for statistics to load
    const statsSection = page.locator('[data-testid="stats-section"]');
    await expect(statsSection).toBeVisible({ timeout: 15000 });

    // Check for investor count
    const investorCount = page.locator('[data-testid="investor-count"]');
    await expect(investorCount).toBeVisible();
    
    // Verify the count is a reasonable number
    const countText = await investorCount.textContent();
    const count = parseInt(countText.replace(/,/g, ''));
    expect(count).toBeGreaterThan(30000);

    // Check for firm count
    const firmCount = page.locator('[data-testid="firm-count"]');
    await expect(firmCount).toBeVisible();
  });

  test('should display charts and visualizations', async ({ page }) => {
    // Check for charts container
    const chartsContainer = page.locator('[data-testid="charts-container"]');
    await expect(chartsContainer).toBeVisible({ timeout: 15000 });

    // Check for specific chart types
    const sectorChart = page.locator('[data-testid="top-sectors-chart"]');
    const locationChart = page.locator('[data-testid="top-locations-chart"]');
    const timelineChart = page.locator('[data-testid="investment-timeline-chart"]');

    await expect(sectorChart).toBeVisible();
    await expect(locationChart).toBeVisible();
    await expect(timelineChart).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    // Test navigation to different sections
    const investorsLink = page.locator('a[href="/investors"]');
    await expect(investorsLink).toBeVisible();
    
    const searchLink = page.locator('a[href="/search"]');
    await expect(searchLink).toBeVisible();
    
    const networkLink = page.locator('a[href="/network"]');
    await expect(networkLink).toBeVisible();
  });

  test('should handle loading states gracefully', async ({ page }) => {
    // Reload page and check for loading indicators
    await page.reload();
    
    // Look for skeleton loaders or loading spinners
    const loadingIndicator = page.locator('[data-testid="dashboard-skeleton"], .loading-spinner, .skeleton');
    
    // Loading indicator should appear briefly then disappear
    if (await loadingIndicator.isVisible({ timeout: 1000 })) {
      await expect(loadingIndicator).toBeHidden({ timeout: 10000 });
    }
    
    // Content should eventually load
    const content = page.locator('[data-testid="dashboard-content"]');
    await expect(content).toBeVisible({ timeout: 15000 });
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const content = page.locator('[data-testid="dashboard-content"]');
    await expect(content).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(content).toBeVisible();
    
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(content).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls and simulate failures
    await page.route('**/api/network/stats', route => route.abort());
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should show error state or fallback content
    const errorMessage = page.locator('[data-testid="error-message"], .error-state, .alert-destructive');
    
    // Either error message should be visible OR content should still load from other sources
    const content = page.locator('[data-testid="dashboard-content"]');
    const hasError = await errorMessage.isVisible({ timeout: 5000 });
    const hasContent = await content.isVisible({ timeout: 5000 });
    
    expect(hasError || hasContent).toBeTruthy();
  });

  test('should have accessible elements', async ({ page }) => {
    // Check for proper heading structure
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    
    // Check for proper alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
    
    // Check for proper ARIA labels on interactive elements
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      
      // Button should have either aria-label or visible text
      expect(ariaLabel || text?.trim()).toBeTruthy();
    }
  });
});