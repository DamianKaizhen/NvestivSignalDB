'use client'

import Link from 'next/link'
import { memo, useMemo } from 'react'
import { ExternalLink, MapPin, Building, User, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { Investor } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'

interface InvestorsTableProps {
  investors: Investor[]
  isLoading: boolean
}

const InvestorTableSkeleton = memo(function InvestorTableSkeleton() {
  const skeletonItems = useMemo(() => Array.from({ length: 10 }, (_, i) => i), [])
  
  return (
    <div className="space-y-4 p-6">
      {skeletonItems.map((i) => (
        <div key={i} className="flex items-center space-x-4 py-4 border-b">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
})

const InvestorRow = memo(function InvestorRow({ investor }: { investor: Investor }) {
  const initials = useMemo(() => {
    return investor.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }, [investor.name])

  const displayedFocus = useMemo(() => {
    if (!investor.investment_focus || investor.investment_focus.length === 0) return null
    return investor.investment_focus.slice(0, 3)
  }, [investor.investment_focus])

  const remainingFocusCount = useMemo(() => {
    if (!investor.investment_focus || investor.investment_focus.length <= 3) return 0
    return investor.investment_focus.length - 3
  }, [investor.investment_focus])

  return (
    <div className="flex items-start justify-between p-4 border-b hover:bg-muted/50 transition-colors">
      <div className="flex items-center space-x-4 min-w-0 flex-1">
        {/* Avatar */}
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Main Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <Link 
              href={`/investors/${investor.id}`}
              className="font-medium hover:text-primary truncate"
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
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
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

          {/* Bio snippet */}
          {investor.bio && (
            <div className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {investor.bio}
            </div>
          )}

          {/* Investment Focus */}
          {displayedFocus && (
            <div className="flex flex-wrap gap-1 mt-2">
              {displayedFocus.map((focus, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {focus}
                </Badge>
              ))}
              {remainingFocusCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  +{remainingFocusCount} more
                </Badge>
              )}
            </div>
          )}

          {/* Additional sectors */}
          {investor.sectors && investor.sectors.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              <span className="text-xs text-muted-foreground mr-1">Sectors:</span>
              {investor.sectors.slice(0, 3).map((sector, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {sector}
                </Badge>
              ))}
              {investor.sectors.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{investor.sectors.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center space-x-6 text-sm">
        {investor.network_connections && investor.network_connections > 0 && (
          <div className="text-center">
            <div className="font-medium">{formatNumber(investor.network_connections)}</div>
            <div className="text-muted-foreground">Network</div>
          </div>
        )}
        {investor.total_investments && (
          <div className="text-center">
            <div className="font-medium">{formatNumber(investor.total_investments)}</div>
            <div className="text-muted-foreground">Investments</div>
          </div>
        )}
        {investor.average_check_size && (
          <div className="text-center">
            <div className="font-medium">{formatCurrency(investor.average_check_size)}</div>
            <div className="text-muted-foreground">Avg Check</div>
          </div>
        )}
        {investor.years_active && (
          <div className="text-center">
            <div className="font-medium">{investor.years_active}y</div>
            <div className="text-muted-foreground">Active</div>
          </div>
        )}
        <div className="ml-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/investors/${investor.id}`}>
              View Profile
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
})

export const InvestorsTable = memo(function InvestorsTable({ investors, isLoading }: InvestorsTableProps) {
  if (isLoading) {
    return <InvestorTableSkeleton />
  }

  if (investors.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium">No investors found</p>
        <p className="text-muted-foreground">
          Try adjusting your search criteria or filters
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y">
      {investors.map((investor) => (
        <InvestorRow key={investor.id} investor={investor} />
      ))}
    </div>
  )
})