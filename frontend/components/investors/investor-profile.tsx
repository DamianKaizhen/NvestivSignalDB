'use client'

import { useQuery } from '@tanstack/react-query'
import { 
  ArrowLeft, 
  User, 
  Network, 
  TrendingUp,
  Brain
} from 'lucide-react'
import Link from 'next/link'
import { apiClient, queryKeys } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InvestorOverview } from './investor-overview'
import { InvestorConnections } from './investor-connections'
import { InvestorInvestments } from './investor-investments'
import { InvestorAnalysis } from './investor-analysis'

interface InvestorProfileProps {
  investorId: string
}

export function InvestorProfile({ investorId }: InvestorProfileProps) {
  const { data: investor, isLoading, error } = useQuery({
    queryKey: queryKeys.investor(investorId),
    queryFn: () => apiClient.getInvestor(investorId),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center space-x-4">
          <div className="h-9 w-32 bg-muted animate-pulse rounded-md" />
        </div>

        {/* Main Profile Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-start space-x-6">
              <div className="h-20 w-20 bg-muted animate-pulse rounded-full" />
              <div className="flex-1 space-y-4">
                <div className="h-8 w-64 bg-muted animate-pulse rounded-md" />
                <div className="space-y-2">
                  <div className="h-4 w-48 bg-muted animate-pulse rounded-md" />
                  <div className="h-4 w-40 bg-muted animate-pulse rounded-md" />
                  <div className="h-4 w-32 bg-muted animate-pulse rounded-md" />
                </div>
                <div className="h-16 w-full bg-muted animate-pulse rounded-md" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded-md" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/investors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Investors
            </Link>
          </Button>
        </div>

        {/* Error Card */}
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Failed to Load Profile</CardTitle>
            <CardDescription>
              We couldn't load the investor profile. This might be due to:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>API server is not running (localhost:3010)</li>
              <li>Network connectivity issues</li>
              <li>Invalid investor ID</li>
            </ul>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Retry
              </Button>
              <Button variant="outline" size="sm" asChild className="flex-1">
                <Link href="/investors">Go Back</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!investor) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/investors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Investors
            </Link>
          </Button>
        </div>

        {/* Not Found Card */}
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Investor Not Found</CardTitle>
            <CardDescription>
              The investor profile you're looking for doesn't exist or may have been removed.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/investors">
                Browse All Investors
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/investors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Investors
          </Link>
        </Button>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="border-b">
          <TabsList className="grid w-full grid-cols-4 bg-transparent h-auto p-0">
            <TabsTrigger 
              value="overview" 
              className="flex items-center space-x-2 px-6 py-3 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none"
            >
              <User className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="connections" 
              className="flex items-center space-x-2 px-6 py-3 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none"
            >
              <Network className="h-4 w-4" />
              <span>Connections</span>
            </TabsTrigger>
            <TabsTrigger 
              value="investments" 
              className="flex items-center space-x-2 px-6 py-3 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Investments</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analysis" 
              className="flex items-center space-x-2 px-6 py-3 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none"
            >
              <Brain className="h-4 w-4" />
              <span>Analysis</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-6">
          <InvestorOverview investor={investor} />
        </TabsContent>

        <TabsContent value="connections" className="mt-6">
          <InvestorConnections investor={investor} />
        </TabsContent>

        <TabsContent value="investments" className="mt-6">
          <InvestorInvestments investor={investor} />
        </TabsContent>

        <TabsContent value="analysis" className="mt-6">
          <InvestorAnalysis investor={investor} />
        </TabsContent>
      </Tabs>
    </div>
  )
}