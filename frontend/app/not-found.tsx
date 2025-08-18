'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="text-6xl font-bold text-muted-foreground mb-4">404</div>
          <CardTitle className="text-2xl">Page Not Found</CardTitle>
          <CardDescription>
            The page you're looking for doesn't exist or may have been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/search">
                <Search className="h-4 w-4 mr-2" />
                Search Investors
              </Link>
            </Button>
            <Button variant="ghost" onClick={() => window.history.back()} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Popular sections:</p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              <Link href="/investors" className="text-primary hover:underline">
                Investors
              </Link>
              <span>•</span>
              <Link href="/firms" className="text-primary hover:underline">
                Firms
              </Link>
              <span>•</span>
              <Link href="/network" className="text-primary hover:underline">
                Network
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}