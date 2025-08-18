'use client'

import { TrendingUp, BarChart3, PieChart, Users, Target, Award, MapPin } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatNumber, formatCurrency } from '@/lib/utils'
import type { FirmDetail } from '@/lib/api'

interface FirmAnalyticsProps {
  firm: FirmDetail
}

export function FirmAnalytics({ firm }: FirmAnalyticsProps) {
  // Calculate analytics from firm data
  const totalInvestors = firm.investor_count || 0
  const totalInvestments = firm.total_investments || 0
  const avgInvestments = firm.avg_investments || 0
  const qualityScore = firm.avg_quality_score || 0
  const maxConnections = firm.max_connections || 0

  // Calculate performance metrics
  const performanceMetrics = [
    {
      label: 'Investment Activity',
      value: Math.min(totalInvestments / 100, 100), // Cap at 100%
      description: `${formatNumber(totalInvestments)} total investments`,
      color: 'bg-blue-500'
    },
    {
      label: 'Team Quality',
      value: qualityScore,
      description: `${qualityScore.toFixed(0)}% average quality score`,
      color: 'bg-green-500'
    },
    {
      label: 'Network Reach',
      value: Math.min(maxConnections / 1000 * 100, 100), // Assume 1000 is high
      description: `${formatNumber(maxConnections)} max connections`,
      color: 'bg-purple-500'
    },
    {
      label: 'Team Productivity',
      value: Math.min(avgInvestments / 50 * 100, 100), // Assume 50 is high
      description: `${avgInvestments.toFixed(1)} avg investments per person`,
      color: 'bg-orange-500'
    }
  ]

  // Group investors by various criteria for analytics
  const investorsByExperience = firm.investors?.reduce((acc, investor) => {
    const experience = investor.years_active || 0
    const bracket = experience >= 10 ? '10+ years' : experience >= 5 ? '5-10 years' : experience >= 2 ? '2-5 years' : '0-2 years'
    acc[bracket] = (acc[bracket] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const investorsByConnections = firm.investors?.reduce((acc, investor) => {
    const connections = investor.network_connections || 0
    const bracket = connections >= 1000 ? 'Highly Connected (1000+)' : connections >= 500 ? 'Well Connected (500-1000)' : connections >= 100 ? 'Connected (100-500)' : 'Limited Connections (<100)'
    acc[bracket] = (acc[bracket] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const topInvestors = firm.investors
    ?.sort((a, b) => (b.total_investments || 0) - (a.total_investments || 0))
    .slice(0, 5) || []

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((metric, idx) => (
          <Card key={idx}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{metric.label}</span>
                  <span className="text-sm text-muted-foreground">{metric.value.toFixed(0)}%</span>
                </div>
                <Progress value={metric.value} className="h-2" />
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>Top Performing Investors</span>
            </CardTitle>
            <CardDescription>
              Most active investment professionals at {firm.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topInvestors.map((investor, idx) => (
                <div key={investor.id || idx} className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{investor.name}</h4>
                    <p className="text-sm text-muted-foreground">{investor.title}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatNumber(investor.total_investments || 0)}</div>
                    <div className="text-xs text-muted-foreground">investments</div>
                  </div>
                </div>
              ))}
              {topInvestors.length === 0 && (
                <p className="text-muted-foreground">No investor data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Experience Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Experience Distribution</span>
            </CardTitle>
            <CardDescription>
              Years of experience across the team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(investorsByExperience).map(([bracket, count]) => (
                <div key={bracket} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{bracket}</span>
                    <span>{count} investors</span>
                  </div>
                  <Progress 
                    value={(count / totalInvestors) * 100} 
                    className="h-2" 
                  />
                </div>
              ))}
              {Object.keys(investorsByExperience).length === 0 && (
                <p className="text-muted-foreground">No experience data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Network Connectivity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Network Connectivity</span>
            </CardTitle>
            <CardDescription>
              Connection levels across the team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(investorsByConnections).map(([bracket, count]) => (
                <div key={bracket} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{bracket}</span>
                    <span>{count} investors</span>
                  </div>
                  <Progress 
                    value={(count / totalInvestors) * 100} 
                    className="h-2" 
                  />
                </div>
              ))}
              {Object.keys(investorsByConnections).length === 0 && (
                <p className="text-muted-foreground">No network data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Investment Focus Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Investment Focus</span>
            </CardTitle>
            <CardDescription>
              Sector and stage distribution
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {firm.sectors && firm.sectors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Primary Sectors</h4>
                <div className="flex flex-wrap gap-1">
                  {firm.sectors.map((sector, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {sector}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {firm.stages && firm.stages.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Investment Stages</h4>
                <div className="flex flex-wrap gap-1">
                  {firm.stages.map((stage, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {stage}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {firm.locations && firm.locations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Geographic Focus</h4>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{firm.locations.join(', ')}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Firm Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Firm Insights</span>
          </CardTitle>
          <CardDescription>
            Key insights and recommendations based on firm data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">Strengths</h4>
              <ul className="text-sm space-y-1">
                {qualityScore >= 70 && <li>• High-quality team members</li>}
                {totalInvestors >= 10 && <li>• Large investment team</li>}
                {maxConnections >= 500 && <li>• Strong network reach</li>}
                {avgInvestments >= 20 && <li>• High investment activity</li>}
                {(qualityScore < 70 && totalInvestors < 10 && maxConnections < 500 && avgInvestments < 20) && (
                  <li className="text-muted-foreground">• Analyzing firm strengths...</li>
                )}
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-orange-600">Opportunities</h4>
              <ul className="text-sm space-y-1">
                {qualityScore < 70 && <li>• Enhance team quality scores</li>}
                {maxConnections < 500 && <li>• Expand network connections</li>}
                {avgInvestments < 10 && <li>• Increase investment activity</li>}
                {!firm.sectors?.length && <li>• Define sector focus areas</li>}
                {(qualityScore >= 70 && maxConnections >= 500 && avgInvestments >= 10 && firm.sectors?.length) && (
                  <li className="text-muted-foreground">• Continue strong performance</li>
                )}
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600">Recommendations</h4>
              <ul className="text-sm space-y-1">
                <li>• Leverage top performers for deal flow</li>
                <li>• Cross-connect team members</li>
                <li>• Focus on specialized sectors</li>
                <li>• Enhance LinkedIn presence</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}