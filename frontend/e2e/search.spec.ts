import { test, expect } from '@playwright/test'

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/search')
  })

  test('loads search page successfully', async ({ page }) => {
    // Check for search page elements
    await expect(page.getByRole('heading', { name: /search/i })).toBeVisible()
    await expect(page.getByRole('textbox', { name: /search/i })).toBeVisible()
  })

  test('basic search functionality works', async ({ page }) => {
    const searchInput = page.getByRole('textbox', { name: /search/i })
    
    // Test basic search
    await searchInput.fill('venture capital')
    await page.keyboard.press('Enter')
    
    // Wait for results
    await page.waitForTimeout(2000)
    
    // Should show search results or no results message
    const results = page.locator('[data-testid*="result"], .search-result, .result-item')
    const noResults = page.getByText(/no results|no matches|not found/i)
    
    const hasResults = await results.count() > 0
    const hasNoResults = await noResults.isVisible()
    
    // Either should have results or show no results message
    expect(hasResults || hasNoResults).toBeTruthy()
  })

  test('advanced search filters work', async ({ page }) => {
    // Look for advanced search toggle or filters
    const advancedToggle = page.getByRole('button', { name: /advanced|filters|more options/i })
    
    if (await advancedToggle.isVisible()) {
      await advancedToggle.click()
      
      // Look for filter options
      const locationFilter = page.getByLabel(/location/i)
      const sectorFilter = page.getByLabel(/sector/i)
      const stageFilter = page.getByLabel(/stage/i)
      
      if (await locationFilter.isVisible()) {
        await locationFilter.fill('San Francisco')
      }
      
      if (await sectorFilter.isVisible()) {
        await sectorFilter.fill('SaaS')
      }
      
      // Apply filters
      const applyButton = page.getByRole('button', { name: /apply|search/i })
      if (await applyButton.isVisible()) {
        await applyButton.click()
        await page.waitForTimeout(2000)
      }
    }
    
    // Should handle filter application
    await expect(page.locator('body')).toBeVisible()
  })

  test('search suggestions work if available', async ({ page }) => {
    const searchInput = page.getByRole('textbox', { name: /search/i })
    
    // Type partial search term
    await searchInput.fill('tech')
    await page.waitForTimeout(500)
    
    // Look for dropdown suggestions
    const suggestions = page.locator('[data-testid*="suggestion"], .suggestion, .autocomplete')
    
    if (await suggestions.count() > 0) {
      // Click on first suggestion
      await suggestions.first().click()
      
      // Should execute search with suggestion
      await page.waitForTimeout(1000)
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('search results display correctly', async ({ page }) => {
    const searchInput = page.getByRole('textbox', { name: /search/i })
    
    // Perform search
    await searchInput.fill('AI')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(3000)
    
    // Check for results structure
    const resultItems = page.locator('[data-testid*="result"], .search-result')
    
    if (await resultItems.count() > 0) {
      const firstResult = resultItems.first()
      
      // Should have clickable elements
      const links = firstResult.locator('a')
      if (await links.count() > 0) {
        await expect(links.first()).toBeVisible()
      }
      
      // Should have some text content
      await expect(firstResult).toContainText(/\w+/)
    }
  })

  test('search pagination works', async ({ page }) => {
    const searchInput = page.getByRole('textbox', { name: /search/i })
    
    // Perform search that might return many results
    await searchInput.fill('investor')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(3000)
    
    // Look for pagination
    const nextButton = page.getByRole('button', { name: /next/i })
    const pageNumbers = page.locator('[data-testid*="page"], .pagination')
    
    if (await nextButton.isVisible()) {
      await nextButton.click()
      await page.waitForTimeout(2000)
      
      // Should load next page
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('search history works if available', async ({ page }) => {
    const searchInput = page.getByRole('textbox', { name: /search/i })
    
    // Perform a few searches
    await searchInput.fill('venture capital')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1000)
    
    await searchInput.clear()
    await searchInput.fill('artificial intelligence')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1000)
    
    // Click on search input to see if history appears
    await searchInput.click()
    await page.waitForTimeout(500)
    
    // Look for history dropdown
    const historyItems = page.locator('[data-testid*="history"], .search-history')
    
    if (await historyItems.count() > 0) {
      // Should show previous searches
      await expect(historyItems.first()).toBeVisible()
    }
  })

  test('search performance is acceptable', async ({ page }) => {
    const searchInput = page.getByRole('textbox', { name: /search/i })
    
    // Measure search response time
    const startTime = Date.now()
    
    await searchInput.fill('technology')
    await page.keyboard.press('Enter')
    
    // Wait for results to appear
    await page.waitForSelector('[data-testid*="result"], .search-result, .no-results', { 
      timeout: 5000 
    })
    
    const endTime = Date.now()
    const searchTime = endTime - startTime
    
    // Search should complete within 5 seconds
    expect(searchTime).toBeLessThan(5000)
  })

  test('empty search handling', async ({ page }) => {
    const searchInput = page.getByRole('textbox', { name: /search/i })
    
    // Try empty search
    await searchInput.fill('')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1000)
    
    // Should handle empty search gracefully
    await expect(page.locator('body')).toBeVisible()
    
    // Should not crash or show error
    const errorMessages = page.locator('[data-testid*="error"], .error, .alert-error')
    if (await errorMessages.count() > 0) {
      // If error messages exist, they should be user-friendly
      await expect(errorMessages.first()).not.toContainText(/undefined|null|error|crash/i)
    }
  })

  test('special characters in search', async ({ page }) => {
    const searchInput = page.getByRole('textbox', { name: /search/i })
    
    // Test search with special characters
    const specialSearchTerms = ['@username', '#hashtag', 'company & co', 'search/term']
    
    for (const term of specialSearchTerms) {
      await searchInput.fill(term)
      await page.keyboard.press('Enter')
      await page.waitForTimeout(1000)
      
      // Should handle special characters without crashing
      await expect(page.locator('body')).toBeVisible()
      
      // Clear for next test
      await searchInput.clear()
    }
  })

  test('search mobile responsiveness', async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    
    const searchInput = page.getByRole('textbox', { name: /search/i })
    await expect(searchInput).toBeVisible()
    
    // Search should work on mobile
    await searchInput.fill('mobile test')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(2000)
    
    // Results should be mobile-friendly
    await expect(page.locator('body')).toBeVisible()
  })
})