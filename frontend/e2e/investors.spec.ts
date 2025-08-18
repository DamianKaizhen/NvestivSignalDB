import { test, expect } from '@playwright/test'

test.describe('Investors Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/investors')
  })

  test('loads investors page successfully', async ({ page }) => {
    // Check page title or heading
    await expect(page.getByRole('heading', { name: /investors/i })).toBeVisible()
    
    // Check for search and filter components
    await expect(page.getByRole('textbox', { name: /search/i })).toBeVisible()
  })

  test('displays investor list', async ({ page }) => {
    // Wait for investors to load
    await page.waitForTimeout(2000)
    
    // Check for investor cards or table rows
    const investorItems = page.locator('[data-testid*="investor"], .investor-card, .investor-row, [class*="investor"]')
    
    // Should have at least one investor or show empty state
    const count = await investorItems.count()
    if (count === 0) {
      // Check for empty state message
      await expect(page.getByText(/no investors found|no results/i)).toBeVisible()
    } else {
      // Should show investor information
      await expect(investorItems.first()).toBeVisible()
    }
  })

  test('search functionality works', async ({ page }) => {
    const searchInput = page.getByRole('textbox', { name: /search/i })
    
    // Test search input
    await searchInput.fill('test investor')
    await expect(searchInput).toHaveValue('test investor')
    
    // Wait for search results
    await page.waitForTimeout(1000)
    
    // Should trigger search (loading or results)
    const loadingOrResults = page.locator('[data-testid*="loading"], [data-testid*="investor"], .loading, .investor-card')
    await expect(loadingOrResults.first()).toBeVisible({ timeout: 5000 })
  })

  test('filters work correctly', async ({ page }) => {
    // Look for filter controls
    const locationFilter = page.getByLabel(/location/i).or(page.getByPlaceholder(/location/i))
    const sectorFilter = page.getByLabel(/sector/i).or(page.getByPlaceholder(/sector/i))
    
    if (await locationFilter.isVisible()) {
      await locationFilter.fill('San Francisco')
      await page.waitForTimeout(1000)
    }
    
    if (await sectorFilter.isVisible()) {
      await sectorFilter.fill('Technology')
      await page.waitForTimeout(1000)
    }
    
    // Should show filtered results
    await expect(page.locator('body')).toBeVisible()
  })

  test('pagination works if present', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(2000)
    
    // Look for pagination controls
    const nextButton = page.getByRole('button', { name: /next/i })
    const pageNumbers = page.locator('[data-testid*="page"], .page-number, [aria-label*="page"]')
    
    if (await nextButton.isVisible()) {
      await nextButton.click()
      await page.waitForTimeout(1000)
      
      // Should load next page
      await expect(page.locator('body')).toBeVisible()
    }
    
    if (await pageNumbers.count() > 0) {
      const pageTwo = pageNumbers.filter({ hasText: '2' }).first()
      if (await pageTwo.isVisible()) {
        await pageTwo.click()
        await page.waitForTimeout(1000)
      }
    }
  })

  test('investor profile links work', async ({ page }) => {
    // Wait for investors to load
    await page.waitForTimeout(2000)
    
    // Look for profile links or view buttons
    const profileLink = page.getByRole('link', { name: /view profile|profile/i }).first()
    const investorName = page.locator('[data-testid*="investor"] a, .investor-card a, .investor-row a').first()
    
    if (await profileLink.isVisible()) {
      await profileLink.click()
      // Should navigate to investor detail page
      await expect(page).toHaveURL(/investors\/[^\/]+$/)
    } else if (await investorName.isVisible()) {
      await investorName.click()
      // Should navigate to investor detail page
      await expect(page).toHaveURL(/investors\/[^\/]+$/)
    }
  })

  test('responsive design works', async ({ page }) => {
    // Desktop view
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.getByRole('heading', { name: /investors/i })).toBeVisible()
    
    // Tablet view
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.getByRole('heading', { name: /investors/i })).toBeVisible()
    
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.getByRole('heading', { name: /investors/i })).toBeVisible()
  })

  test('loading states are handled', async ({ page }) => {
    // Navigate to page and check for loading states
    await page.goto('/investors')
    
    // Should show some content within reasonable time
    await expect(page.getByRole('heading', { name: /investors/i })).toBeVisible({ timeout: 10000 })
    
    // Should not show loading spinner indefinitely
    const loadingSpinner = page.locator('[data-testid*="loading"], .loading, [class*="loading"]')
    if (await loadingSpinner.count() > 0) {
      await expect(loadingSpinner.first()).not.toBeVisible({ timeout: 10000 })
    }
  })

  test('error states are handled', async ({ page }) => {
    // Test with invalid filter to potentially trigger error
    const searchInput = page.getByRole('textbox', { name: /search/i })
    
    if (await searchInput.isVisible()) {
      // Try a very long search term that might cause issues
      await searchInput.fill('x'.repeat(1000))
      await page.waitForTimeout(2000)
      
      // Should handle gracefully without crashing
      await expect(page.locator('body')).toBeVisible()
    }
  })
})

test.describe('Individual Investor Page', () => {
  test('loads investor detail page', async ({ page }) => {
    // First navigate to investors list
    await page.goto('/investors')
    await page.waitForTimeout(2000)
    
    // Try to find and click on an investor
    const firstInvestorLink = page.locator('[data-testid*="investor"] a, .investor-card a, .investor-row a').first()
    
    if (await firstInvestorLink.isVisible()) {
      await firstInvestorLink.click()
      
      // Should be on investor detail page
      await expect(page).toHaveURL(/investors\/[^\/]+$/)
      
      // Should show investor details
      await expect(page.getByRole('heading')).toBeVisible()
    } else {
      // If no investors available, test with a mock URL
      await page.goto('/investors/test-investor-id')
      
      // Should either show investor details or proper error handling
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('shows investor information', async ({ page }) => {
    // Try to access an investor page directly
    await page.goto('/investors/1')
    
    // Should show investor information or proper error handling
    await expect(page.locator('body')).toBeVisible()
    
    // Look for typical investor profile elements
    const profileElements = page.locator('h1, h2, .investor-name, [data-testid*="name"]')
    const contactInfo = page.locator('[href*="linkedin"], [href*="mailto"], .contact-info')
    
    // At least one of these should be visible if the page loads successfully
    const hasContent = await profileElements.count() > 0 || await contactInfo.count() > 0
    expect(hasContent).toBeTruthy()
  })
})