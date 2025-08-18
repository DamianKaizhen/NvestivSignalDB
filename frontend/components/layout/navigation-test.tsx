'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const routes = [
  { path: '/', name: 'Dashboard', testPath: '/' },
  { path: '/investors', name: 'Investors', testPath: '/investors' },
  { path: '/firms', name: 'Firms', testPath: '/firms' },
  { path: '/network', name: 'Network', testPath: '/network' },
  { path: '/search', name: 'Search', testPath: '/search' },
  { path: '/investors/123', name: 'Investor Detail', testPath: '/investors/123' },
  { path: '/invalid-route', name: '404 Test', testPath: '/invalid-route' }
]

export function NavigationTest() {
  const [testResults, setTestResults] = useState<Record<string, 'pending' | 'success' | 'error'>>({})
  const [testing, setTesting] = useState(false)
  const router = useRouter()

  const testRoute = async (route: typeof routes[0]) => {
    setTestResults(prev => ({ ...prev, [route.path]: 'pending' }))
    
    try {
      // Test programmatic navigation
      await new Promise(resolve => {
        router.push(route.testPath)
        setTimeout(resolve, 500) // Give time for navigation
      })
      
      setTestResults(prev => ({ ...prev, [route.path]: 'success' }))
    } catch (error) {
      console.error(`Navigation test failed for ${route.path}:`, error)
      setTestResults(prev => ({ ...prev, [route.path]: 'error' }))
    }
  }

  const testAllRoutes = async () => {
    setTesting(true)
    for (const route of routes) {
      await testRoute(route)
      await new Promise(resolve => setTimeout(resolve, 300)) // Delay between tests
    }
    setTesting(false)
  }

  const getStatusBadge = (status: 'pending' | 'success' | 'error' | undefined) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Testing...</Badge>
      case 'success':
        return <Badge variant="default" className="bg-green-500">✓ Pass</Badge>
      case 'error':
        return <Badge variant="destructive">✗ Fail</Badge>
      default:
        return <Badge variant="outline">Not Tested</Badge>
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Navigation Test Suite</CardTitle>
        <div className="flex gap-2">
          <Button onClick={testAllRoutes} disabled={testing}>
            {testing ? 'Testing...' : 'Test All Routes'}
          </Button>
          <Button variant="outline" onClick={() => setTestResults({})}>
            Clear Results
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {routes.map((route) => (
            <div key={route.path} className="flex items-center justify-between p-3 border rounded">
              <div>
                <div className="font-medium">{route.name}</div>
                <div className="text-sm text-muted-foreground">{route.path}</div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(testResults[route.path])}
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testRoute(route)}
                    disabled={testing}
                  >
                    Test
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={route.testPath}>Visit</Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}