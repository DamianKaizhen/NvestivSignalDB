import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility Tests', () => {
  test('homepage should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/')
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('investors page should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/investors')
    await page.waitForTimeout(2000) // Wait for content to load
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('search page should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(2000)
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('keyboard navigation works correctly', async ({ page }) => {
    await page.goto('/')
    
    // Test Tab navigation
    await page.keyboard.press('Tab')
    
    // Check if focus is visible
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Continue tabbing through interactive elements
    const maxTabs = 10
    for (let i = 0; i < maxTabs; i++) {
      await page.keyboard.press('Tab')
      const currentFocus = page.locator(':focus')
      
      // Focus should be on an interactive element
      if (await currentFocus.count() > 0) {
        const tagName = await currentFocus.evaluate(el => el.tagName.toLowerCase())
        const isInteractive = ['a', 'button', 'input', 'textarea', 'select'].includes(tagName) ||
                            await currentFocus.getAttribute('tabindex') !== null ||
                            await currentFocus.getAttribute('role') === 'button' ||
                            await currentFocus.getAttribute('role') === 'link'
        
        if (isInteractive) {
          // Focus should be visible
          await expect(currentFocus).toBeVisible()
        }
      }
    }
  })

  test('search input has proper labels and ARIA attributes', async ({ page }) => {
    await page.goto('/search')
    
    const searchInput = page.getByRole('textbox', { name: /search/i })
    await expect(searchInput).toBeVisible()
    
    // Check for proper labeling
    const label = await searchInput.getAttribute('aria-label') || 
                  await searchInput.getAttribute('aria-labelledby') ||
                  await searchInput.getAttribute('placeholder')
    
    expect(label).toBeTruthy()
    expect(label!.length).toBeGreaterThan(0)
  })

  test('buttons have accessible names', async ({ page }) => {
    await page.goto('/')
    
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      
      if (await button.isVisible()) {
        const accessibleName = await button.textContent() ||
                              await button.getAttribute('aria-label') ||
                              await button.getAttribute('title')
        
        // Button should have an accessible name
        expect(accessibleName).toBeTruthy()
        expect(accessibleName!.trim().length).toBeGreaterThan(0)
      }
    }
  })

  test('links have accessible names', async ({ page }) => {
    await page.goto('/')
    
    const links = page.locator('a')
    const linkCount = await links.count()
    
    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i)
      
      if (await link.isVisible()) {
        const accessibleName = await link.textContent() ||
                              await link.getAttribute('aria-label') ||
                              await link.getAttribute('title')
        
        // Link should have an accessible name
        expect(accessibleName).toBeTruthy()
        expect(accessibleName!.trim().length).toBeGreaterThan(0)
      }
    }
  })

  test('images have alt text', async ({ page }) => {
    await page.goto('/')
    
    const images = page.locator('img')
    const imageCount = await images.count()
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i)
      
      if (await img.isVisible()) {
        const altText = await img.getAttribute('alt')
        
        // Image should have alt text (can be empty for decorative images)
        expect(altText).not.toBeNull()
      }
    }
  })

  test('headings are properly structured', async ({ page }) => {
    await page.goto('/')
    
    const headings = page.locator('h1, h2, h3, h4, h5, h6')
    const headingCount = await headings.count()
    
    if (headingCount > 0) {
      // Should have at least one h1
      const h1Count = await page.locator('h1').count()
      expect(h1Count).toBeGreaterThanOrEqual(1)
      
      // Check heading hierarchy
      let previousLevel = 0
      for (let i = 0; i < headingCount; i++) {
        const heading = headings.nth(i)
        const tagName = await heading.evaluate(el => el.tagName.toLowerCase())
        const currentLevel = parseInt(tagName.charAt(1))
        
        if (previousLevel > 0) {
          // Heading levels should not skip (e.g., h1 to h3)
          expect(currentLevel - previousLevel).toBeLessThanOrEqual(1)
        }
        
        previousLevel = currentLevel
      }
    }
  })

  test('color contrast is sufficient', async ({ page }) => {
    await page.goto('/')
    
    // Run axe-core specifically for color contrast
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .include('body')
      .analyze()
    
    // Filter for color contrast violations
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    )
    
    expect(colorContrastViolations).toEqual([])
  })

  test('form controls have labels', async ({ page }) => {
    await page.goto('/search')
    
    const formControls = page.locator('input, textarea, select')
    const controlCount = await formControls.count()
    
    for (let i = 0; i < controlCount; i++) {
      const control = formControls.nth(i)
      
      if (await control.isVisible()) {
        const label = await control.getAttribute('aria-label') ||
                     await control.getAttribute('aria-labelledby') ||
                     await control.getAttribute('placeholder')
        
        // Form control should have some form of labeling
        expect(label).toBeTruthy()
      }
    }
  })

  test('focus indicators are visible', async ({ page }) => {
    await page.goto('/')
    
    // Find focusable elements
    const focusableElements = page.locator('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])')
    const count = await focusableElements.count()
    
    if (count > 0) {
      const firstFocusable = focusableElements.first()
      await firstFocusable.focus()
      
      // Check if focus indicator is visible
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
      
      // The focused element should have some visual indication
      // This is hard to test programmatically, but we can check if outline is not 'none'
      const outline = await focusedElement.evaluate(el => 
        getComputedStyle(el).outline
      )
      
      // Should not have outline: none (unless custom focus styles are used)
      if (outline === 'none' || outline === '') {
        // Check for custom focus styles
        const boxShadow = await focusedElement.evaluate(el => 
          getComputedStyle(el).boxShadow
        )
        const border = await focusedElement.evaluate(el => 
          getComputedStyle(el).border
        )
        
        // Should have some form of focus indication
        expect(boxShadow !== 'none' || border !== 'none').toBeTruthy()
      }
    }
  })

  test('skip links work if present', async ({ page }) => {
    await page.goto('/')
    
    // Tab to first element (might be skip link)
    await page.keyboard.press('Tab')
    
    const focusedElement = page.locator(':focus')
    
    if (await focusedElement.isVisible()) {
      const text = await focusedElement.textContent()
      
      if (text && text.toLowerCase().includes('skip')) {
        // If it's a skip link, test that it works
        await focusedElement.press('Enter')
        
        // Should move focus to main content
        const newFocus = page.locator(':focus')
        const newFocusId = await newFocus.getAttribute('id')
        
        // Focus should have moved
        expect(newFocusId).toBeTruthy()
      }
    }
  })

  test('responsive design maintains accessibility', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 1200, height: 800 }, // Desktop
      { width: 768, height: 1024 }, // Tablet
      { width: 375, height: 667 },  // Mobile
    ]
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.goto('/')
      await page.waitForTimeout(1000)
      
      // Run accessibility scan for this viewport
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()
      
      // Should not have violations at any viewport size
      expect(accessibilityScanResults.violations).toEqual([])
    }
  })
})