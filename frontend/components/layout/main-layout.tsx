'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  BarChart3, 
  Users, 
  Building, 
  Network, 
  Search,
  Menu,
  X,
  TrendingUp,
  Globe
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { GlobalSearch } from '@/components/search/global-search'
import { SavedSearches } from '@/components/search/saved-searches'
import { NavigationErrorBoundary, useNavigationErrorBoundary } from './navigation-error-boundary'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: BarChart3,
    description: 'Overview and key metrics'
  },
  {
    name: 'Investors',
    href: '/investors',
    icon: Users,
    description: 'Browse investor profiles'
  },
  {
    name: 'Firms',
    href: '/firms',
    icon: Building,
    description: 'Investment firms and companies'
  },
  {
    name: 'Network',
    href: '/network',
    icon: Network,
    description: 'Relationship explorer'
  },
  {
    name: 'Search',
    href: '/search',
    icon: Search,
    description: 'Advanced search and AI matching'
  }
]

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { error: navError, resetError } = useNavigationErrorBoundary()

  // Handle navigation loading states
  useEffect(() => {
    const handleStart = () => setIsNavigating(true)
    const handleComplete = () => setIsNavigating(false)

    // Listen for route change events
    const originalPush = router.push
    const originalReplace = router.replace

    router.push = async (...args) => {
      handleStart()
      try {
        await originalPush.apply(router, args)
        handleComplete()
      } catch (error) {
        handleComplete()
        throw error
      }
    }

    router.replace = async (...args) => {
      handleStart()
      try {
        await originalReplace.apply(router, args)
        handleComplete()
      } catch (error) {
        handleComplete()
        throw error
      }
    }

    return () => {
      router.push = originalPush
      router.replace = originalReplace
    }
  }, [router])

  // Safe navigation wrapper
  const handleNavigation = (href: string) => {
    try {
      resetError()
      router.push(href)
    } catch (error) {
      console.error('Navigation error:', error)
    }
  }

  // Show navigation error if present
  if (navError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Navigation error occurred. Please try refreshing the page.
            <Button onClick={resetError} className="mt-2 w-full">
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <NavigationErrorBoundary>
      <div className="min-h-screen bg-background relative">
        {/* Loading overlay for navigation */}
        {isNavigating && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        )}
      {/* Mobile sidebar */}
      <div className={cn(
        'fixed inset-0 z-50 lg:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed left-0 top-0 h-full w-72 bg-card shadow-xl">
          <div className="flex h-16 items-center justify-between px-6">
            <Link href="/" className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">Nvestiv</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="px-4">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                    isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:h-full lg:w-72 lg:bg-card lg:shadow-sm lg:block">
        <div className="flex h-16 items-center px-6 border-b">
          <Link href="/" className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Nvestiv</span>
          </Link>
        </div>
        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 rounded-lg px-3 py-3 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </div>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div className="hidden lg:flex items-center space-x-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span>32,780 investors • Real-time data</span>
            </div>
          </div>
          
          {/* Global Search - centered on larger screens */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <GlobalSearch 
              className="w-full"
              placeholder="Search investors, firms, or describe your needs..."
            />
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Saved Searches */}
            <div className="hidden lg:block">
              <SavedSearches />
            </div>
            
            {/* Mobile search button */}
            <div className="md:hidden">
              <GlobalSearch 
                placeholder="Search..."
                showShortcut={false}
              />
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
      </div>
    </NavigationErrorBoundary>
  )
}