'use client'

import Link from 'next/link'
import { ExternalLink, MapPin, Building, User, Target, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { Investor } from '@/lib/api'

interface SearchResultsProps {
  results: {
    matches: Investor[]
    query: string
    matchingCriteria: string
  }
  isLoading: boolean
}

function InvestorCard({ investor }: { investor: Investor }) {
  const initials = investor.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <Link 
                href={`/investors/${investor.id}`}
                className="font-semibold hover:text-primary truncate"
              >
                {investor.name}
              </Link>
              {investor.linkedin_url && (
                <a 
                  href={investor.linkedin_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>

            <div className="space-y-1 mt-2 text-sm text-muted-foreground">
              {investor.title && (
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span className="truncate">{investor.title}</span>
                </div>
              )}
              {investor.company && (
                <div className="flex items-center space-x-1">
                  <Building className="h-3 w-3" />
                  <span className="truncate">{investor.company}</span>
                </div>
              )}
              {investor.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{investor.location}</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-right text-sm">
            {investor.average_check_size && (
              <div className="font-medium">{formatCurrency(investor.average_check_size)}</div>
            )}
            {investor.total_investments && (
              <div className="text-muted-foreground">{formatNumber(investor.total_investments)} investments</div>
            )}
          </div>
        </div>
      </CardHeader>

      {(investor.bio || investor.investment_focus || investor.sectors) && (
        <CardContent className="pt-0">
          {investor.bio && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {investor.bio}
            </p>
          )}
          
          {investor.investment_focus && investor.investment_focus.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Investment Focus
              </div>
              <div className="flex flex-wrap gap-1">
                {investor.investment_focus.slice(0, 4).map((focus, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {focus}
                  </Badge>
                ))}
                {investor.investment_focus.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{investor.investment_focus.length - 4}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {investor.sectors && investor.sectors.length > 0 && (
            <div className="space-y-2 mt-3">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Sectors
              </div>
              <div className="flex flex-wrap gap-1">
                {investor.sectors.slice(0, 3).map((sector, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {sector}
                  </Badge>
                ))}
                {investor.sectors.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{investor.sectors.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/investors/${investor.id}`}>
                View Full Profile
              </Link>
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export function SearchResults({ results, isLoading }: SearchResultsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse space-y-2">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>AI Match Results</span>
          </CardTitle>
          <CardDescription>
            Found {results.matches.length} investors matching your criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium mb-1">Your Query:</div>
              <div className="text-sm text-muted-foreground italic">
                "{results.query}"
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Matching Criteria:</div>
              <div className="text-sm text-muted-foreground">
                {results.matchingCriteria}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Grid */}
      {results.matches.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {results.matches.map((investor) => (
            <InvestorCard key={investor.id} investor={investor} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No matches found</p>
            <p className="text-muted-foreground">
              Try refining your search criteria or using different keywords
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}