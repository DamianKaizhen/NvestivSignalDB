'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'

interface ShimmerSkeletonProps {
  className?: string
  variant?: 'text' | 'avatar' | 'card' | 'button' | 'image'
  width?: string | number
  height?: string | number
  animate?: boolean
}

export const ShimmerSkeleton = memo(function ShimmerSkeleton({
  className,
  variant = 'text',
  width,
  height,
  animate = true
}: ShimmerSkeletonProps) {
  const baseClasses = cn(
    'bg-gradient-to-r from-muted via-muted/60 to-muted',
    animate && 'animate-pulse',
    'relative overflow-hidden',
    className
  )

  const variantClasses = {
    text: 'h-4 rounded',
    avatar: 'rounded-full',
    card: 'rounded-lg',
    button: 'rounded-md',
    image: 'rounded'
  }

  const shimmerClass = animate ? 'shimmer' : ''

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  return (
    <div 
      className={cn(baseClasses, variantClasses[variant], shimmerClass)}
      style={style}
    >
      {animate && (
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      )}
    </div>
  )
})

// Enhanced skeleton components for specific use cases
export const TextSkeleton = memo(function TextSkeleton({ 
  lines = 1, 
  className 
}: { 
  lines?: number
  className?: string 
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <ShimmerSkeleton 
          key={i}
          variant="text"
          className={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  )
})

export const CardSkeleton = memo(function CardSkeleton({ 
  className 
}: { 
  className?: string 
}) {
  return (
    <div className={cn('p-6 border rounded-lg space-y-4', className)}>
      <div className="flex items-center space-x-4">
        <ShimmerSkeleton variant="avatar" width={40} height={40} />
        <div className="space-y-2 flex-1">
          <ShimmerSkeleton variant="text" className="w-1/3" />
          <ShimmerSkeleton variant="text" className="w-1/2" />
        </div>
      </div>
      <TextSkeleton lines={3} />
      <div className="flex gap-2">
        <ShimmerSkeleton variant="button" width={80} height={32} />
        <ShimmerSkeleton variant="button" width={100} height={32} />
      </div>
    </div>
  )
})

export const TableRowSkeleton = memo(function TableRowSkeleton({
  columns = 4,
  className
}: {
  columns?: number
  className?: string
}) {
  return (
    <div className={cn('flex items-center space-x-4 py-4 border-b', className)}>
      <ShimmerSkeleton variant="avatar" width={32} height={32} />
      {Array.from({ length: columns - 1 }).map((_, i) => (
        <div key={i} className="flex-1">
          <ShimmerSkeleton variant="text" className="w-full" />
        </div>
      ))}
    </div>
  )
})

export const GridSkeleton = memo(function GridSkeleton({
  items = 6,
  columns = 3,
  className
}: {
  items?: number
  columns?: number
  className?: string
}) {
  return (
    <div className={cn(`grid gap-4 grid-cols-${columns}`, className)}>
      {Array.from({ length: items }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
})