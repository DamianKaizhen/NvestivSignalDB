'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react'

interface HealthCheck {
  name: string
  description: string
  test: () => Promise<boolean>
}

const healthChecks: HealthCheck[] = [
  {
    name: 'Middleware Headers',
    description: 'Check if middleware is adding proper headers',
    test: async () => {
      try {
        const response = await fetch('/', { method: 'HEAD' })
        return response.headers.has('X-Route-Valid') && response.headers.has('X-Navigation-Version')
      } catch {
        return false
      }
    }
  },
  {
    name: '404 Handling',
    description: 'Test that invalid routes return 404',
    test: async () => {
      try {
        const response = await fetch('/invalid-test-route-12345', { method: 'HEAD' })
        return response.status === 404
      } catch {
        return false
      }
    }
  },
  {
    name: 'Valid Routes',
    description: 'Test that all main routes are accessible',
    test: async () => {
      const routes = ['/', '/investors', '/firms', '/network', '/search']
      try {
        const results = await Promise.all(
          routes.map(async (route) => {
            const response = await fetch(route, { method: 'HEAD' })
            return response.ok
          })
        )
        return results.every(Boolean)
      } catch {
        return false
      }
    }
  },
  {
    name: 'Dynamic Routes',
    description: 'Test that dynamic routes work correctly',
    test: async () => {
      try {
        const response = await fetch('/investors/test-id', { method: 'HEAD' })
        return response.ok
      } catch {
        return false
      }
    }
  },
  {
    name: 'API Proxy',
    description: 'Test that API routes are properly proxied',
    test: async () => {
      try {
        // This will test the proxy to the backend
        const response = await fetch('/api/health', { method: 'HEAD' })
        // Even if backend is down, the proxy should be working (may return 502/503 but not 404)
        return response.status !== 404
      } catch {
        return false
      }
    }
  }
]

export function NavigationHealth() {
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({})
  const [testing, setTesting] = useState(false)
  const [overallHealth, setOverallHealth] = useState<'good' | 'warning' | 'error' | null>(null)

  const runHealthCheck = async (check: HealthCheck) => {
    setTestResults(prev => ({ ...prev, [check.name]: null }))
    try {
      const result = await check.test()
      setTestResults(prev => ({ ...prev, [check.name]: result }))
      return result
    } catch (error) {
      console.error(`Health check failed for ${check.name}:`, error)
      setTestResults(prev => ({ ...prev, [check.name]: false }))
      return false
    }
  }

  const runAllHealthChecks = async () => {
    setTesting(true)
    const results: boolean[] = []
    
    for (const check of healthChecks) {
      const result = await runHealthCheck(check)
      results.push(result)
      await new Promise(resolve => setTimeout(resolve, 200)) // Small delay
    }

    // Calculate overall health
    const passed = results.filter(Boolean).length
    const total = results.length
    
    if (passed === total) {
      setOverallHealth('good')
    } else if (passed >= total * 0.7) {
      setOverallHealth('warning')
    } else {
      setOverallHealth('error')
    }
    
    setTesting(false)
  }

  const getStatusIcon = (result: boolean | null) => {
    if (result === null) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    return result ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const getStatusBadge = (result: boolean | null) => {
    if (result === null) {
      return <Badge variant="secondary">Testing...</Badge>
    }
    return result ? (
      <Badge variant="default" className="bg-green-500">Pass</Badge>
    ) : (
      <Badge variant="destructive">Fail</Badge>
    )
  }

  const getOverallHealthAlert = () => {
    if (!overallHealth) return null

    switch (overallHealth) {
      case 'good':
        return (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              All navigation systems are working correctly!
            </AlertDescription>
          </Alert>
        )
      case 'warning':
        return (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Most systems are working, but some issues were detected.
            </AlertDescription>
          </Alert>
        )
      case 'error':
        return (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Multiple navigation issues detected. Please check the failing tests.
            </AlertDescription>
          </Alert>
        )
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Navigation Health Check
          <Button onClick={runAllHealthChecks} disabled={testing}>
            {testing ? 'Running Tests...' : 'Run All Tests'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {getOverallHealthAlert()}
        
        <div className="space-y-3">
          {healthChecks.map((check) => (
            <div key={check.name} className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-3">
                {getStatusIcon(testResults[check.name])}
                <div>
                  <div className="font-medium">{check.name}</div>
                  <div className="text-sm text-muted-foreground">{check.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(testResults[check.name])}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runHealthCheck(check)}
                  disabled={testing}
                >
                  Test
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-sm text-muted-foreground text-center pt-2">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  )
}