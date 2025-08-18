'use client'

import { 
  User, 
  Building, 
  MapPin, 
  Target, 
  Calendar,
  TrendingUp,
  Network,
  Star,
  Award,
  Activity,
  Linkedin,
  Twitter,
  ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'
import { Investor } from '@/lib/api'

interface InvestorOverviewProps {
  investor: Investor
}

export function InvestorOverview({ investor }: InvestorOverviewProps) {
  const initials = investor.name
    ? investor.name
        .split(' ')
        .map(n => n?.[0] || '')
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??'

  const getQualityBadge = (investor: Investor) => {
    const score = (investor.total_investments || 0) + (investor.network_connections || 0) / 10
    if (score >= 50) return { label: 'Elite Investor', variant: 'default' as const }
    if (score >= 20) return { label: 'Top Tier', variant: 'secondary' as const }
    if (score >= 10) return { label: 'Active', variant: 'outline' as const }
    return { label: 'Emerging', variant: 'outline' as const }
  }

  const qualityBadge = getQualityBadge(investor)

  return (
    <div className="space-y-6">
      {/* Enhanced Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start space-x-6">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className="text-4xl font-bold mb-2">{investor.name || 'Unknown Investor'}</h1>
                  <Badge {...qualityBadge} className="mb-2">
                    <Award className="h-3 w-3 mr-1" />
                    {qualityBadge.label}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-2">
                  {investor.linkedin_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={investor.linkedin_url} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-4 w-4 mr-2" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {investor.twitter_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={investor.twitter_url} target="_blank" rel="noopener noreferrer">
                        <Twitter className="h-4 w-4 mr-2" />
                        Twitter
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-muted-foreground mb-4">
                {investor.title && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{investor.title}</span>
                  </div>
                )}
                {investor.company && (
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4" />
                    <span className="font-medium">{investor.company}</span>
                  </div>
                )}
                {investor.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{investor.location}</span>
                  </div>
                )}
              </div>

              {investor.bio && (
                <div className="bg-muted/50 p-4 rounded-lg border">
                  <p className="text-foreground leading-relaxed italic">
                    "{investor.bio}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {investor.total_investments && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investments</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(investor.total_investments)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Portfolio companies
              </p>
            </CardContent>
          </Card>
        )}

        {investor.average_check_size && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Check Size</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(investor.average_check_size)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Typical investment
              </p>
            </CardContent>
          </Card>
        )}

        {investor.years_active && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Years Active</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{investor.years_active}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Experience level
              </p>
            </CardContent>
          </Card>
        )}

        {investor.network_connections && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Network Connections</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(investor.network_connections)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Professional network
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Investment Preferences */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Investment Preferences</span>
            </CardTitle>
            <CardDescription>Areas of investment focus and expertise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {investor.investment_focus && investor.investment_focus.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Focus Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {investor.investment_focus.map((focus, idx) => (
                    <Badge key={idx} variant="secondary">
                      {focus || 'Unknown'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {investor.investment_stage && investor.investment_stage.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Investment Stages</h4>
                <div className="flex flex-wrap gap-2">
                  {investor.investment_stage.map((stage, idx) => (
                    <Badge key={idx} variant="outline">
                      {stage || 'Unknown'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {investor.sectors && investor.sectors.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Sectors</h4>
                <div className="flex flex-wrap gap-2">
                  {investor.sectors.map((sector, idx) => (
                    <Badge key={idx} variant="secondary">
                      {sector || 'Unknown'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {investor.geography && investor.geography.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Geographic Focus</h4>
                <div className="flex flex-wrap gap-2">
                  {investor.geography.map((geo, idx) => (
                    <Badge key={idx} variant="outline">
                      {geo}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>Latest investment activities and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {investor.notable_investments && investor.notable_investments.slice(0, 5).map((investment, idx) => (
                <div key={idx} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium">{investment}</p>
                    <p className="text-sm text-muted-foreground">Investment</p>
                  </div>
                </div>
              ))}
              
              {(!investor.notable_investments || investor.notable_investments.length === 0) && (
                <div className="text-center py-4 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activity data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact & Social */}
      <Card>
        <CardHeader>
          <CardTitle>Contact & Social Presence</CardTitle>
          <CardDescription>Ways to connect and learn more</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {investor.linkedin_url && (
              <Button variant="outline" asChild>
                <a href={investor.linkedin_url} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-4 w-4 mr-2" />
                  LinkedIn Profile
                  <ExternalLink className="h-3 w-3 ml-2" />
                </a>
              </Button>
            )}
            
            {investor.twitter_url && (
              <Button variant="outline" asChild>
                <a href={investor.twitter_url} target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter Profile
                  <ExternalLink className="h-3 w-3 ml-2" />
                </a>
              </Button>
            )}
            
            {!investor.linkedin_url && !investor.twitter_url && (
              <p className="text-muted-foreground">No social profiles available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Metadata */}
      {(investor.created_at || investor.updated_at) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between text-sm text-muted-foreground">
              {investor.created_at && (
                <div>Profile created: {formatDate(investor.created_at)}</div>
              )}
              {investor.updated_at && (
                <div>Last updated: {formatDate(investor.updated_at)}</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}