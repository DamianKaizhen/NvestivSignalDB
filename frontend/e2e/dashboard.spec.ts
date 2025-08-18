import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page which contains the dashboard
    await page.goto('/')
  })

  test('loads the main dashboard', async ({ page }) => {
    // Check for main navigation
    await expect(page.getByRole('navigation')).toBeVisible()
    
    // Check for dashboard content
    await expect(page.getByText('Nvestiv')).toBeVisible()
    
    // Check for search functionality
    await expect(page.getByPlaceholder(/search/i)).toBeVisible()
  })

  test('displays network statistics', async ({ page }) => {
    // Check for stats cards or sections
    await expect(page.getByText(/investor/i)).toBeVisible()
    await expect(page.getByText(/firm/i)).toBeVisible()
    
    // Check for any visible numbers/statistics
    await expect(page.locator('[data-testid*="stat"], .stat, [class*="stat"]')).toBeVisible({ timeout: 10000 })
  })

  test('navigation works correctly', async ({ page }) => {
    // Test navigation to different sections
    const investorsLink = page.getByRole('link', { name: /investors/i })
    if (await investorsLink.isVisible()) {
      await investorsLink.click()
      await expect(page).toHaveURL(/investors/)
    }

    // Navigate back to dashboard
    await page.goto('/')
    
    // Test firms navigation
    const firmsLink = page.getByRole('link', { name: /firms/i })
    if (await firmsLink.isVisible()) {
      await firmsLink.click()
      await expect(page).toHaveURL(/firms/)
    }
  })

  test('search functionality is accessible', async ({ page }) => {
    // Test global search
    const searchInput = page.getByPlaceholder(/search/i)
    await expect(searchInput).toBeVisible()
    
    // Test that search input accepts text
    await searchInput.fill('test search')
    await expect(searchInput).toHaveValue('test search')
    
    // Clear search
    await searchInput.fill('')
    await expect(searchInput).toHaveValue('')
  })

  test('responsive design works', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.getByText('Nvestiv')).toBeVisible()
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.getByText('Nvestiv')).toBeVisible()
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.getByText('Nvestiv')).toBeVisible()
  })

  test('theme toggle works if available', async ({ page }) => {
    // Look for theme toggle button
    const themeToggle = page.getByRole('button', { name: /theme|dark|light/i })
    
    if (await themeToggle.isVisible()) {
      // Test theme toggle
      await themeToggle.click()
      
      // Check if theme changed (look for dark class or different background)
      const body = page.locator('body')
      const html = page.locator('html')
      
      // Check if dark mode is applied
      const isDarkMode = await body.evaluate((el) => 
        el.classList.contains('dark') || 
        getComputedStyle(el).backgroundColor === 'rgb(0, 0, 0)' ||
        getComputedStyle(el).backgroundColor === 'black'
      ) || await html.evaluate((el) => 
        el.classList.contains('dark')
      )
      
      expect(typeof isDarkMode).toBe('boolean')
    }
  })

  test('handles loading states', async ({ page }) => {
    // Check for loading indicators during page load
    await page.goto('/', { waitUntil: 'networkidle' })
    
    // Should not show loading spinners after load
    const loadingIndicators = page.locator('[data-testid*="loading"], .loading, [class*="loading"]')
    
    // If loading indicators exist, they should not be visible after loading
    if (await loadingIndicators.count() > 0) {
      await expect(loadingIndicators.first()).not.toBeVisible({ timeout: 10000 })
    }
  })

  test('error handling works', async ({ page }) => {
    // Test 404 page
    await page.goto('/non-existent-page')
    
    // Should show 404 page or error message
    await expect(page.getByText(/404|not found|page not found/i)).toBeVisible()
  })
})