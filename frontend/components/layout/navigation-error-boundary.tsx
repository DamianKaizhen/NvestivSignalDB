'use client'

import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface NavigationErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface NavigationErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
}

export class NavigationErrorBoundary extends React.Component<
  NavigationErrorBoundaryProps,
  NavigationErrorBoundaryState
> {
  constructor(props: NavigationErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): NavigationErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Navigation error boundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback

      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />
      }

      return (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Navigation Error</AlertTitle>
            <AlertDescription className="mt-2">
              There was an error loading this page. This might be a temporary issue.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={this.handleRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export function useNavigationErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    console.error('Navigation error captured:', error)
    setError(error)
  }, [])

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('NAVIGATION') || 
          event.error?.message?.includes('route') ||
          event.error?.message?.includes('ERR_ABORTED')) {
        captureError(event.error)
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('NAVIGATION') || 
          event.reason?.message?.includes('route') ||
          event.reason?.message?.includes('ERR_ABORTED')) {
        captureError(new Error(event.reason.message || 'Navigation error'))
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [captureError])

  return { error, resetError, captureError }
}