'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  const isNetworkError = error.message.includes('fetch') || error.message.includes('network')
  const isNavigationError = error.message.includes('NAVIGATION') || error.message.includes('route')

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
          <CardDescription>
            {isNetworkError && "We're having trouble connecting to our servers."}
            {isNavigationError && "There was an issue navigating to this page."}
            {!isNetworkError && !isNavigationError && "An unexpected error occurred."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Development Error Details</AlertTitle>
              <AlertDescription className="mt-2 text-sm font-mono">
                {error.message}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col gap-2">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try again
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Go home
              </Link>
            </Button>
          </div>
          
          {error.digest && (
            <p className="text-xs text-muted-foreground text-center">
              Error ID: {error.digest}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}