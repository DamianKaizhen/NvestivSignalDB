'use client'

import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Building, Users, MapPin, Target, TrendingUp, ExternalLink, Star, Globe, Calendar, DollarSign } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiClient, queryKeys } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatCurrency, formatNumber } from '@/lib/utils'
// import { FirmNetworking } from './firm-networking'

interface FirmProfileProps {
  firmId: string
}

export function FirmProfile({ firmId }: FirmProfileProps) {
  const router = useRouter()
  
  const { data: firm, isLoading, error } = useQuery({
    queryKey: queryKeys.firm(firmId),
    queryFn: () => apiClient.getFirm(firmId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-muted rounded mb-6"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !firm) {
    return (
      <div className="text-center py-12">
        <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium">Firm not found</p>
        <p className="text-muted-foreground mb-4">
          The firm you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  const firmInitial = firm.name.charAt(0).toUpperCase()
  const qualityScore = firm.avg_quality_score || 0
  const qualityLevel = qualityScore >= 80 ? 'high' : qualityScore >= 60 ? 'medium' : 'low'
  const qualityColor = qualityLevel === 'high' ? 'text-green-600' : qualityLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Firms
        </Button>
      </div>

      {/* Firm Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              {/* Logo */}
              <div className="relative">
                <div className="h-20 w-20 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-xl flex items-center justify-center font-bold text-2xl shadow-lg">
                  {firmInitial}
                </div>
                {qualityScore >= 80 && (
                  <div className="absolute -top-2 -right-2 h-7 w-7 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Star className="h-4 w-4 text-white fill-current" />
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold">{firm.name}</h1>
                    {firm.description && (
                      <p className="text-muted-foreground mt-2 max-w-2xl">
                        {firm.description}
                      </p>
                    )}
                  </div>
                  {firm.website && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={firm.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4 mr-2" />
                        Website
                        <ExternalLink className="h-3 w-3 ml-2" />
                      </a>
                    </Button>
                  )}
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatNumber(firm.investor_count || 0)}</div>
                    <div className="text-sm text-muted-foreground">Investors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatNumber(firm.total_investments || 0)}</div>
                    <div className="text-sm text-muted-foreground">Total Investments</div>
                  </div>
                  {firm.avg_investments && (
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatNumber(firm.avg_investments)}</div>
                      <div className="text-sm text-muted-foreground">Avg per Investor</div>
                    </div>
                  )}
                  {qualityScore > 0 && (
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${qualityColor}`}>
                        {qualityScore.toFixed(0)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Quality Score</div>
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                <div className="flex items-center space-x-6 mt-4 text-sm text-muted-foreground">
                  {firm.locations && firm.locations.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{firm.locations.join(', ')}</span>
                    </div>
                  )}
                  {firm.current_fund_size && (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4" />
                      <span>{firm.current_fund_size}</span>
                    </div>
                  )}
                  {firm.founded_year && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Founded {firm.founded_year}</span>
                    </div>
                  )}
                </div>

                {/* Sectors & Stages */}
                <div className="mt-4 space-y-2">
                  {firm.sectors && firm.sectors.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Sectors:</span>
                      <div className="flex flex-wrap gap-1">
                        {firm.sectors.map((sector, idx) => (
                          <Badge key={idx} variant="secondary">
                            {sector}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {firm.stages && firm.stages.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Stages:</span>
                      <div className="flex flex-wrap gap-1">
                        {firm.stages.map((stage, idx) => (
                          <Badge key={idx} variant="outline">
                            {stage}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="investors">Investors ({firm.investors?.length || 0})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Firm Details */}
            <Card>
              <CardHeader>
                <CardTitle>Firm Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">Fund Size</h4>
                  <p className="text-muted-foreground">
                    {firm.current_fund_size || 'Not specified'}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium">Investment Focus</h4>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {firm.sectors && firm.sectors.length > 0 ? (
                      firm.sectors.map((sector, idx) => (
                        <Badge key={idx} variant="secondary">
                          {sector}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">Not specified</p>
                    )}
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium">Investment Stages</h4>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {firm.stages && firm.stages.length > 0 ? (
                      firm.stages.map((stage, idx) => (
                        <Badge key={idx} variant="outline">
                          {stage}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">Not specified</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Quality Score</h4>
                    <p className={`text-2xl font-bold ${qualityColor}`}>
                      {qualityScore > 0 ? `${qualityScore.toFixed(0)}%` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Max Connections</h4>
                    <p className="text-2xl font-bold">
                      {firm.max_connections ? formatNumber(firm.max_connections) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Avg Investments</h4>
                    <p className="text-2xl font-bold">
                      {firm.avg_investments ? formatNumber(firm.avg_investments) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Total Portfolio</h4>
                    <p className="text-2xl font-bold">
                      {formatNumber(firm.total_investments || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="investors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Investment professionals at {firm.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {firm.investors && firm.investors.length > 0 ? (
                <div className="grid gap-4">
                  {firm.investors.map((investor, idx) => (
                    <Link
                      key={investor.id || idx}
                      href={`/investors/${investor.id}`}
                      className="flex items-center space-x-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {investor.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium">{investor.name}</h4>
                        <p className="text-sm text-muted-foreground">{investor.title}</p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                          <span>{formatNumber(investor.total_investments || 0)} investments</span>
                          <span>{formatNumber(investor.network_connections || 0)} connections</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No investors found for this firm.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Analytics coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Network analysis coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}