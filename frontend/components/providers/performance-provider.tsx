'use client'

import { useEffect } from 'react'
import { initPerformanceMonitoring } from '@/lib/performance'

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize performance monitoring on client side
    initPerformanceMonitoring()
  }, [])

  return <>{children}</>
}