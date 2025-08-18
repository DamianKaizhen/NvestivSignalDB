'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface LoadingState {
  isLoading: boolean
  error: Error | null
  progress: number
}

interface UseLoadingStateOptions {
  minDuration?: number
  showProgress?: boolean
  onStart?: () => void
  onComplete?: () => void
  onError?: (error: Error) => void
}

export function useLoadingState(options: UseLoadingStateOptions = {}) {
  const {
    minDuration = 300,
    showProgress = false,
    onStart,
    onComplete,
    onError
  } = options

  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    progress: 0
  })

  const timeoutRef = useRef<NodeJS.Timeout>()
  const progressIntervalRef = useRef<NodeJS.Timeout>()
  const startTimeRef = useRef<number>()

  const setLoading = useCallback((loading: boolean) => {
    if (loading) {
      startTimeRef.current = Date.now()
      setState(prev => ({ ...prev, isLoading: true, error: null, progress: 0 }))
      onStart?.()

      // Simulate progress if enabled
      if (showProgress) {
        progressIntervalRef.current = setInterval(() => {
          setState(prev => {
            if (prev.progress >= 90) return prev
            return { ...prev, progress: prev.progress + Math.random() * 10 }
          })
        }, 200)
      }
    } else {
      const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0
      const remaining = Math.max(0, minDuration - elapsed)

      // Clear progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }

      // Ensure minimum loading duration for better UX
      timeoutRef.current = setTimeout(() => {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          progress: showProgress ? 100 : 0 
        }))
        onComplete?.()
      }, remaining)
    }
  }, [minDuration, showProgress, onStart, onComplete])

  const setError = useCallback((error: Error | null) => {
    setState(prev => ({ ...prev, error, isLoading: false }))
    if (error) {
      onError?.(error)
    }
  }, [onError])

  const setProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, progress: Math.max(0, Math.min(100, progress)) }))
  }, [])

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, progress: 0 })
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  return {
    ...state,
    setLoading,
    setError,
    setProgress,
    reset
  }
}

// Hook for async operations with automatic loading state
export function useAsyncOperation<T = any>(options: UseLoadingStateOptions = {}) {
  const loadingState = useLoadingState(options)

  const execute = useCallback(async (operation: () => Promise<T>): Promise<T | null> => {
    try {
      loadingState.setLoading(true)
      const result = await operation()
      loadingState.setLoading(false)
      return result
    } catch (error) {
      loadingState.setError(error as Error)
      return null
    }
  }, [loadingState])

  return {
    ...loadingState,
    execute
  }
}

// Global loading state manager
class LoadingManager {
  private listeners = new Set<(loading: boolean) => void>()
  private loadingCount = 0

  subscribe(listener: (loading: boolean) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    const isLoading = this.loadingCount > 0
    this.listeners.forEach(listener => listener(isLoading))
  }

  start() {
    this.loadingCount++
    this.notify()
  }

  stop() {
    this.loadingCount = Math.max(0, this.loadingCount - 1)
    this.notify()
  }

  reset() {
    this.loadingCount = 0
    this.notify()
  }

  get isLoading() {
    return this.loadingCount > 0
  }
}

export const globalLoadingManager = new LoadingManager()

// Hook for global loading state
export function useGlobalLoading() {
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    return globalLoadingManager.subscribe(setIsLoading)
  }, [])

  return {
    isLoading,
    start: () => globalLoadingManager.start(),
    stop: () => globalLoadingManager.stop(),
    reset: () => globalLoadingManager.reset()
  }
}