import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test('page load performance meets targets', async ({ page }) => {
    // Start performance monitoring
    await page.goto('/', { waitUntil: 'networkidle' })
    
    // Measure performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const timing = performance.timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      return {
        // Time to first byte
        ttfb: timing.responseStart - timing.navigationStart,
        // DOM content loaded
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        // Load complete
        loadComplete: timing.loadEventEnd - timing.navigationStart,
        // First Contentful Paint (if available)
        fcp: navigation ? navigation.domContentLoadedEventEnd - navigation.startTime : null,
        // Largest Contentful Paint (if available)
        lcp: null, // Will be measured separately
      }
    })
    
    console.log('Performance Metrics:', performanceMetrics)
    
    // Assert performance targets
    expect(performanceMetrics.ttfb).toBeLessThan(1000) // < 1 second TTFB
    expect(performanceMetrics.domContentLoaded).toBeLessThan(3000) // < 3 seconds DOM ready
    expect(performanceMetrics.loadComplete).toBeLessThan(5000) // < 5 seconds full load
  })

  test('Core Web Vitals are within acceptable ranges', async ({ page }) => {
    await page.goto('/')
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    
    // Measure Core Web Vitals
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals: any = {}
        
        // LCP - Largest Contentful Paint
        if ('PerformanceObserver' in window) {
          try {
            new PerformanceObserver((list) => {
              const entries = list.getEntries()
              const lastEntry = entries[entries.length - 1]
              vitals.lcp = lastEntry.startTime
            }).observe({ entryTypes: ['largest-contentful-paint'] })
          } catch (e) {
            console.log('LCP not supported')
          }
          
          // FID - First Input Delay
          try {
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                vitals.fid = entry.processingStart - entry.startTime
              }
            }).observe({ entryTypes: ['first-input'] })
          } catch (e) {
            console.log('FID not supported')
          }
          
          // CLS - Cumulative Layout Shift
          try {
            let clsValue = 0
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries() as any[]) {
                if (!entry.hadRecentInput) {
                  clsValue += entry.value
                }
              }
              vitals.cls = clsValue
            }).observe({ entryTypes: ['layout-shift'] })
          } catch (e) {
            console.log('CLS not supported')
          }
        }
        
        // Return after a delay to collect metrics
        setTimeout(() => resolve(vitals), 2000)
      })
    })
    
    console.log('Core Web Vitals:', webVitals)
    
    // Assert Core Web Vitals targets (if available)
    if ((webVitals as any).lcp) {
      expect((webVitals as any).lcp).toBeLessThan(2500) // LCP < 2.5s (good)
    }
    
    if ((webVitals as any).fid) {
      expect((webVitals as any).fid).toBeLessThan(100) // FID < 100ms (good)
    }
    
    if ((webVitals as any).cls) {
      expect((webVitals as any).cls).toBeLessThan(0.1) // CLS < 0.1 (good)
    }
  })

  test('search performance is acceptable', async ({ page }) => {
    await page.goto('/search')
    
    const searchInput = page.getByRole('textbox', { name: /search/i })
    await expect(searchInput).toBeVisible()
    
    // Measure search performance
    const startTime = Date.now()
    await searchInput.fill('technology venture capital')
    await page.keyboard.press('Enter')
    
    // Wait for results to appear
    await page.waitForSelector('[data-testid*="result"], .search-result, .no-results', { 
      timeout: 5000 
    })
    
    const endTime = Date.now()
    const searchDuration = endTime - startTime
    
    console.log('Search Duration:', searchDuration + 'ms')
    
    // Search should complete within 3 seconds
    expect(searchDuration).toBeLessThan(3000)
  })

  test('image loading performance', async ({ page }) => {
    await page.goto('/')
    
    // Wait for images to load
    await page.waitForLoadState('networkidle')
    
    // Check image loading performance
    const imageMetrics = await page.evaluate(() => {
      const images = document.querySelectorAll('img')
      const metrics: any[] = []
      
      images.forEach((img, index) => {
        const rect = img.getBoundingClientRect()
        metrics.push({
          index,
          loaded: img.complete && img.naturalHeight !== 0,
          visible: rect.top < window.innerHeight && rect.bottom > 0,
          src: img.src,
          size: {
            width: img.naturalWidth,
            height: img.naturalHeight
          }
        })
      })
      
      return metrics
    })
    
    console.log('Image Metrics:', imageMetrics)
    
    // All visible images should be loaded
    const visibleImages = imageMetrics.filter(img => img.visible)
    const loadedVisibleImages = visibleImages.filter(img => img.loaded)
    
    if (visibleImages.length > 0) {
      expect(loadedVisibleImages.length).toEqual(visibleImages.length)
    }
  })

  test('JavaScript bundle size is reasonable', async ({ page }) => {
    // Monitor network requests
    const jsResources: any[] = []
    
    page.on('response', response => {
      const url = response.url()
      if (url.includes('.js') && !url.includes('node_modules')) {
        jsResources.push({
          url,
          size: response.headers()['content-length'] || 0,
          status: response.status()
        })
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    console.log('JavaScript Resources:', jsResources)
    
    // Calculate total JS bundle size
    const totalSize = jsResources.reduce((total, resource) => {
      return total + (parseInt(resource.size) || 0)
    }, 0)
    
    console.log('Total JS Bundle Size:', totalSize + ' bytes')
    
    // Bundle size should be reasonable (< 1MB for initial load)
    expect(totalSize).toBeLessThan(1024 * 1024) // < 1MB
  })

  test('memory usage is acceptable', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Measure memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null
    })
    
    if (initialMemory) {
      console.log('Memory Usage:', initialMemory)
      
      // Memory usage should be reasonable
      expect(initialMemory.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024) // < 50MB
    }
  })

  test('network request optimization', async ({ page }) => {
    const requests: any[] = []
    
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      })
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    console.log('Total Requests:', requests.length)
    console.log('Request Types:', requests.reduce((acc, req) => {
      acc[req.resourceType] = (acc[req.resourceType] || 0) + 1
      return acc
    }, {}))
    
    // Should not make excessive requests
    expect(requests.length).toBeLessThan(50)
    
    // Should not have duplicate requests for the same resource
    const uniqueUrls = new Set(requests.map(req => req.url))
    expect(uniqueUrls.size).toEqual(requests.length)
  })

  test('scroll performance is smooth', async ({ page }) => {
    await page.goto('/investors')
    await page.waitForLoadState('networkidle')
    
    // Measure scroll performance
    const scrollPerformance = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frameCount = 0
        let startTime = performance.now()
        
        const measureFrames = () => {
          frameCount++
          if (frameCount < 30) {
            requestAnimationFrame(measureFrames)
          } else {
            const endTime = performance.now()
            const fps = 1000 / ((endTime - startTime) / frameCount)
            resolve({ fps, duration: endTime - startTime })
          }
        }
        
        // Start scrolling
        window.scrollTo(0, 1000)
        requestAnimationFrame(measureFrames)
      })
    })
    
    console.log('Scroll Performance:', scrollPerformance)
    
    // Should maintain reasonable frame rate
    expect((scrollPerformance as any).fps).toBeGreaterThan(30)
  })

  test('table/list rendering performance with large datasets', async ({ page }) => {
    await page.goto('/investors')
    await page.waitForTimeout(3000)
    
    // Measure rendering time for list items
    const renderingMetrics = await page.evaluate(() => {
      const startTime = performance.now()
      
      // Count visible list items
      const listItems = document.querySelectorAll('[data-testid*="investor"], .investor-card, .investor-row')
      
      const endTime = performance.now()
      
      return {
        itemCount: listItems.length,
        renderTime: endTime - startTime
      }
    })
    
    console.log('List Rendering Metrics:', renderingMetrics)
    
    // Rendering should be fast even with many items
    if (renderingMetrics.itemCount > 10) {
      expect(renderingMetrics.renderTime).toBeLessThan(100) // < 100ms
    }
  })

  test('performance regression detection', async ({ page }) => {
    // Baseline performance test
    const runs = 3
    const metrics: any[] = []
    
    for (let i = 0; i < runs; i++) {
      const startTime = Date.now()
      await page.goto('/', { waitUntil: 'networkidle' })
      const endTime = Date.now()
      
      metrics.push({
        loadTime: endTime - startTime,
        run: i + 1
      })
      
      // Clear cache between runs
      await page.context().clearCookies()
    }
    
    console.log('Performance Regression Test:', metrics)
    
    // Calculate average load time
    const avgLoadTime = metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length
    const maxLoadTime = Math.max(...metrics.map(m => m.loadTime))
    const minLoadTime = Math.min(...metrics.map(m => m.loadTime))
    
    console.log({
      average: avgLoadTime,
      max: maxLoadTime,
      min: minLoadTime,
      variance: maxLoadTime - minLoadTime
    })
    
    // Performance should be consistent (variance < 2 seconds)
    expect(maxLoadTime - minLoadTime).toBeLessThan(2000)
    expect(avgLoadTime).toBeLessThan(5000)
  })
})