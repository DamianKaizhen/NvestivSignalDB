'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, RefreshCw, Network, Home } from 'lucide-react'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function NetworkError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Network page error:', error)
  }, [error])

  const isDataError = error.message.includes('fetch') || error.message.includes('API')

  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Network className="h-12 w-12 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl">Network Page Error</CardTitle>
            <CardDescription>
              {isDataError 
                ? "We're having trouble loading network data." 
                : "There was an issue loading the network visualization."
              }
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
                  Go to Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}