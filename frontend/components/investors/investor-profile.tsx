'use client'

import { useQuery } from '@tanstack/react-query'
import { 
  ArrowLeft, 
  ExternalLink, 
  MapPin, 
  Building, 
  User, 
  Target, 
  Calendar,
  GraduationCap,
  Briefcase,
  TrendingUp,
  Network,
  Twitter,
  Linkedin
} from 'lucide-react'
import Link from 'next/link'
import { apiClient, queryKeys } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'

interface InvestorProfileProps {
  investorId: string
}

export function InvestorProfile({ investorId }: InvestorProfileProps) {
  const { data: investor, isLoading, error } = useQuery({
    queryKey: queryKeys.investor(investorId),
    queryFn: () => apiClient.getInvestor(investorId),
  })

  if (isLoading) {
    return <div>Loading investor profile...</div>
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load investor profile</p>
        <p className="text-sm text-muted-foreground mt-2">
          Please ensure the API server is running at localhost:3010
        </p>
      </div>
    )
  }

  if (!investor) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium">Investor not found</p>
        <p className="text-muted-foreground">
          The investor profile you're looking for doesn't exist
        </p>
      </div>
    )
  }

  const initials = investor.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

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

      {/* Main Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start space-x-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-4 mb-2">
                <h1 className="text-3xl font-bold">{investor.name}</h1>
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

              <div className="space-y-2 text-muted-foreground">
                {investor.title && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{investor.title}</span>
                  </div>
                )}
                {investor.company && (
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4" />
                    <span>{investor.company}</span>
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
                <p className="mt-4 text-foreground leading-relaxed">
                  {investor.bio}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {investor.total_investments && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investments</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(investor.total_investments)}</div>
            </CardContent>
          </Card>
        )}

        {investor.average_check_size && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Check Size</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(investor.average_check_size)}</div>
            </CardContent>
          </Card>
        )}

        {investor.years_active && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Years Active</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{investor.years_active}</div>
            </CardContent>
          </Card>
        )}

        {investor.network_connections && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Network Connections</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(investor.network_connections)}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Details Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Investment Focus */}
        {investor.investment_focus && investor.investment_focus.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Investment Focus</CardTitle>
              <CardDescription>Areas of investment interest</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {investor.investment_focus.map((focus, idx) => (
                  <Badge key={idx} variant="secondary">
                    {focus}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Investment Stages */}
        {investor.investment_stage && investor.investment_stage.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Investment Stages</CardTitle>
              <CardDescription>Preferred investment stages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {investor.investment_stage.map((stage, idx) => (
                  <Badge key={idx} variant="outline">
                    {stage}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sectors */}
        {investor.sectors && investor.sectors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sectors</CardTitle>
              <CardDescription>Industry sectors of interest</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {investor.sectors.map((sector, idx) => (
                  <Badge key={idx} variant="secondary">
                    {sector}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Geography */}
        {investor.geography && investor.geography.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Geographic Focus</CardTitle>
              <CardDescription>Geographic areas of investment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {investor.geography.map((geo, idx) => (
                  <Badge key={idx} variant="outline">
                    {geo}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notable Investments */}
      {investor.notable_investments && investor.notable_investments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Notable Investments</CardTitle>
            <CardDescription>Key portfolio companies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {investor.notable_investments.map((investment, idx) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <div className="font-medium">{investment}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Background */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Education */}
        {investor.education && investor.education.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5" />
                <span>Education</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {investor.education.map((edu, idx) => (
                  <div key={idx} className="text-sm">
                    {edu}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Previous Experience */}
        {investor.previous_experience && investor.previous_experience.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5" />
                <span>Previous Experience</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {investor.previous_experience.map((exp, idx) => (
                  <div key={idx} className="text-sm">
                    {exp}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Portfolio Companies */}
      {investor.portfolio_companies && investor.portfolio_companies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Companies</CardTitle>
            <CardDescription>Current and past portfolio companies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {investor.portfolio_companies.slice(0, 20).map((company, idx) => (
                <div key={idx} className="p-2 border rounded text-sm text-center">
                  {company}
                </div>
              ))}
              {investor.portfolio_companies.length > 20 && (
                <div className="p-2 border rounded text-sm text-center text-muted-foreground">
                  +{investor.portfolio_companies.length - 20} more
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timestamps */}
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