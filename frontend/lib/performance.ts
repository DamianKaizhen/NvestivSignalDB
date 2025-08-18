import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from 'web-vitals'

// Performance thresholds based on Core Web Vitals
export const PERFORMANCE_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  INP: { good: 200, poor: 500 },  // Interaction to Next Paint (replaces FID)
  CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
}

export type PerformanceData = {
  metric: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
  url: string
}

function getMetricRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = PERFORMANCE_THRESHOLDS[metric as keyof typeof PERFORMANCE_THRESHOLDS]
  if (!threshold) return 'good'
  
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

function sendToAnalytics(metric: Metric) {
  const performanceData: PerformanceData = {
    metric: metric.name,
    value: metric.value,
    rating: getMetricRating(metric.name, metric.value),
    timestamp: Date.now(),
    url: window.location.pathname,
  }

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔍 Performance Metric: ${metric.name}`)
    console.log(`Value: ${metric.value}${metric.name === 'CLS' ? '' : 'ms'}`)
    console.log(`Rating: ${performanceData.rating}`)
    console.log(`URL: ${performanceData.url}`)
    console.groupEnd()
  }

  // Store in localStorage for development debugging
  if (typeof window !== 'undefined') {
    const existingMetrics = JSON.parse(localStorage.getItem('performance-metrics') || '[]')
    existingMetrics.push(performanceData)
    
    // Keep only last 100 metrics
    if (existingMetrics.length > 100) {
      existingMetrics.splice(0, existingMetrics.length - 100)
    }
    
    localStorage.setItem('performance-metrics', JSON.stringify(existingMetrics))
  }

  // TODO: Send to your analytics service
  // Example: sendToGoogleAnalytics(performanceData)
  // Example: sendToDatadog(performanceData)
}

export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return

  // Measure Core Web Vitals
  onCLS(sendToAnalytics)
  onINP(sendToAnalytics)  // Interaction to Next Paint (replaces FID in web-vitals v3+)
  onFCP(sendToAnalytics)
  onLCP(sendToAnalytics)
  onTTFB(sendToAnalytics)
}

export function getPerformanceReport(): PerformanceData[] {
  if (typeof window === 'undefined') return []
  
  const metrics = JSON.parse(localStorage.getItem('performance-metrics') || '[]')
  return metrics
}

export function clearPerformanceData() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('performance-metrics')
}

// Custom performance markers
export function markStart(name: string) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(`${name}-start`)
  }
}

export function markEnd(name: string) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)
    
    const measure = performance.getEntriesByName(name, 'measure')[0]
    if (measure) {
      console.log(`⏱️ ${name}: ${measure.duration.toFixed(2)}ms`)
    }
  }
}

// Performance utilities
export function measureComponentRender<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  displayName?: string
) {
  const MeasuredComponent = (props: T) => {
    const name = displayName || Component.displayName || Component.name || 'Component'
    
    markStart(`render-${name}`)
    const result = Component(props)
    markEnd(`render-${name}`)
    
    return result
  }
  
  MeasuredComponent.displayName = `Measured(${displayName || Component.displayName || Component.name || 'Component'})`
  return MeasuredComponent
}

// Network performance monitoring
export function measureNetworkRequest(url: string, options?: RequestInit) {
  const startTime = performance.now()
  
  return fetch(url, options).then(response => {
    const endTime = performance.now()
    const duration = endTime - startTime
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌐 Network Request: ${url} - ${duration.toFixed(2)}ms`)
    }
    
    return response
  })
}