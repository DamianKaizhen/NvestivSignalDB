'use client'

import { memo, useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface ProgressiveLoaderProps {
  isLoading: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
  minLoadTime?: number
  showProgress?: boolean
  className?: string
}

export const ProgressiveLoader = memo(function ProgressiveLoader({
  isLoading,
  children,
  fallback,
  minLoadTime = 500,
  showProgress = false,
  className = ''
}: ProgressiveLoaderProps) {
  const [showContent, setShowContent] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isLoading) {
      // Add minimum load time for smooth UX
      const timer = setTimeout(() => {
        setShowContent(true)
      }, minLoadTime)

      return () => clearTimeout(timer)
    } else {
      setShowContent(false)
      setProgress(0)
    }
  }, [isLoading, minLoadTime])

  useEffect(() => {
    if (isLoading && showProgress) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 15
        })
      }, 200)

      return () => clearInterval(interval)
    }
  }, [isLoading, showProgress])

  if (isLoading || !showContent) {
    return (
      <div className={`transition-opacity duration-300 ${className}`}>
        {showProgress && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Loading...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        {fallback || <DefaultSkeleton />}
      </div>
    )
  }

  return (
    <div className={`animate-in fade-in duration-500 ${className}`}>
      {children}
    </div>
  )
})

function DefaultSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}