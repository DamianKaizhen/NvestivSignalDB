'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient, queryKeys } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'
import { BarChart3, Users, Building, TrendingUp, MapPin, Target } from 'lucide-react'

export function DashboardContent() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: queryKeys.networkStats,
    queryFn: () => apiClient.getNetworkStats(),
  })

  if (isLoading) {
    return <div>Loading dashboard...</div>
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load dashboard data</p>
        <p className="text-sm text-muted-foreground mt-2">
          Please ensure the API server is running at localhost:3010
        </p>
      </div>
    )
  }

  if (!stats) {
    return <div>No data available</div>
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalInvestors)}</div>
            <p className="text-xs text-muted-foreground">
              Active investor profiles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investment Firms</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalFirms)}</div>
            <p className="text-xs text-muted-foreground">
              Registered firms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With LinkedIn</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.withLinkedIn)}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.withLinkedIn / stats.totalInvestors) * 100)}% LinkedIn coverage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Investors</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.withInvestments)}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.withInvestments / stats.totalInvestors) * 100)}% have investments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Firms */}
      <Card>
        <CardHeader>
          <CardTitle>Top Investment Firms</CardTitle>
          <CardDescription>
            Leading firms by investor count and quality
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.topFirms && stats.topFirms.length > 0 ? (
            <div className="space-y-3">
              {stats.topFirms.slice(0, 10).map((firm, index) => (
                <div key={firm.firm_name} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-muted-foreground w-6">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{firm.firm_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {firm.investor_count} investors
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {Math.round(firm.avg_quality_score)}
                    </div>
                    <div className="text-sm text-muted-foreground">quality score</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No firm data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Network Tiers */}
        <Card>
          <CardHeader>
            <CardTitle>Network Distribution</CardTitle>
            <CardDescription>
              Investor connectivity levels across the network
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.networkTiers && stats.networkTiers.length > 0 ? (
              <div className="space-y-4">
                {stats.networkTiers.map((tier) => (
                  <div key={tier.network_tier} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{tier.network_tier}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatNumber(tier.count)} ({Math.round((tier.count / stats.totalInvestors) * 100)}%)
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${Math.min((tier.count / stats.totalInvestors) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No network tier data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Investment Focus */}
        <Card>
          <CardHeader>
            <CardTitle>Investment Focus Areas</CardTitle>
            <CardDescription>
              Key characteristics and specializations of investors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {formatNumber(stats.investmentFocus.founder_focused)}
                </div>
                <div className="text-sm text-muted-foreground">Founder Focused</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {formatNumber(stats.investmentFocus.diversity_focused)}
                </div>
                <div className="text-sm text-muted-foreground">Diversity Focused</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {formatNumber(stats.investmentFocus.female_focused)}
                </div>
                <div className="text-sm text-muted-foreground">Female Focused</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {formatNumber(stats.investmentFocus.lead_investors)}
                </div>
                <div className="text-sm text-muted-foreground">Lead Investors</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}