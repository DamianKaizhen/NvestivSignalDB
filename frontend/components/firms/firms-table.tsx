'use client'

import Link from 'next/link'
import { Building, Users, MapPin, Target, TrendingUp, ExternalLink, ChevronRight, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { Firm } from '@/lib/api'

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

interface FirmsTableProps {
  firms: Firm[]
  isLoading: boolean
  pagination?: PaginationInfo
  onPageChange?: (page: number) => void
}

function FirmsTableSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-4 border-b">
          <div className="flex items-center space-x-4 flex-1">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-64" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="space-y-1">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function FirmRow({ firm }: { firm: Firm }) {
  const firmInitial = firm.name.charAt(0).toUpperCase()
  const qualityScore = firm.avg_quality_score || 0
  const qualityLevel = qualityScore >= 80 ? 'high' : qualityScore >= 60 ? 'medium' : 'low'
  const qualityColor = qualityLevel === 'high' ? 'text-green-600' : qualityLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'

  return (
    <Link 
      href={`/firms/${firm.id || firm.name.toLowerCase().replace(/\s+/g, '-')}`}
      className="block transition-all duration-200 hover:bg-muted/50 group"
    >
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4 min-w-0 flex-1">
          {/* Logo/Initial */}
          <div className="relative">
            <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-lg flex items-center justify-center font-bold text-lg shadow-sm">
              {firmInitial}
            </div>
            {qualityScore >= 80 && (
              <div className="absolute -top-1 -right-1 h-5 w-5 bg-yellow-500 rounded-full flex items-center justify-center">
                <Star className="h-3 w-3 text-white fill-current" />
              </div>
            )}
          </div>

          {/* Main Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                {firm.name}
              </h3>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>

            <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>{formatNumber(firm.investor_count || 0)} investors</span>
              </div>
              {firm.locations && firm.locations.length > 0 && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{firm.locations.slice(0, 2).join(', ')}</span>
                  {firm.locations.length > 2 && <span>+{firm.locations.length - 2}</span>}
                </div>
              )}
              {firm.current_fund_size && (
                <div className="flex items-center space-x-1">
                  <Target className="h-3 w-3" />
                  <span>{firm.current_fund_size}</span>
                </div>
              )}
            </div>

            {/* Sectors */}
            {firm.sectors && firm.sectors.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {firm.sectors.slice(0, 3).map((sector, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {sector}
                  </Badge>
                ))}
                {firm.sectors.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{firm.sectors.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-8 text-sm">
          <div className="text-center">
            <div className="font-semibold text-lg">{formatNumber(firm.total_investments || 0)}</div>
            <div className="text-muted-foreground text-xs">Investments</div>
          </div>
          {firm.avg_investments && firm.avg_investments > 0 && (
            <div className="text-center">
              <div className="font-semibold text-lg">{formatNumber(firm.avg_investments)}</div>
              <div className="text-muted-foreground text-xs">Avg per Investor</div>
            </div>
          )}
          {qualityScore > 0 && (
            <div className="text-center">
              <div className={`font-semibold text-lg ${qualityColor}`}>
                {qualityScore.toFixed(0)}%
              </div>
              <div className="text-muted-foreground text-xs">Quality Score</div>
            </div>
          )}
          {firm.max_connections && firm.max_connections > 0 && (
            <div className="text-center">
              <div className="font-semibold text-lg">{formatNumber(firm.max_connections)}</div>
              <div className="text-muted-foreground text-xs">Max Connections</div>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

function PaginationControls({ pagination, onPageChange }: { 
  pagination: PaginationInfo
  onPageChange: (page: number) => void 
}) {
  const pages = Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => {
    const startPage = Math.max(1, pagination.page - 5)
    return startPage + i
  }).filter(page => page <= pagination.totalPages)

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>
          Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
          {pagination.total.toLocaleString()} firms
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
        >
          Previous
        </Button>
        
        <div className="flex items-center space-x-1">
          {pages.map((page) => (
            <Button
              key={page}
              variant={page === pagination.page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className="w-10"
            >
              {page}
            </Button>
          ))}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={!pagination.hasMore}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export function FirmsTable({ firms, isLoading, pagination, onPageChange }: FirmsTableProps) {
  if (isLoading) {
    return <FirmsTableSkeleton />
  }

  if (firms.length === 0) {
    return (
      <div className="text-center py-12">
        <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium">No firms found</p>
        <p className="text-muted-foreground">
          Try adjusting your search criteria
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="divide-y">
        {firms.map((firm) => (
          <FirmRow key={firm.id || firm.name} firm={firm} />
        ))}
      </div>
      
      {pagination && onPageChange && (
        <PaginationControls 
          pagination={pagination} 
          onPageChange={onPageChange} 
        />
      )}
    </div>
  )
}