'use client'

import { Building, Users, MapPin, Target, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface Firm {
  name: string
  investorCount: number
  totalInvestments: number
  avgCheckSize: number
  locations: string[]
  sectors: string[]
  stages: string[]
  investors: any[]
}

interface FirmsTableProps {
  firms: Firm[]
  isLoading: boolean
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

  return (
    <div className="flex items-center justify-between p-4 border-b hover:bg-muted/50 transition-colors">
      <div className="flex items-center space-x-4 min-w-0 flex-1">
        {/* Logo/Initial */}
        <div className="h-10 w-10 bg-primary text-primary-foreground rounded flex items-center justify-center font-medium">
          {firmInitial}
        </div>

        {/* Main Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium truncate">{firm.name}</h3>
          </div>

          <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{formatNumber(firm.investorCount)} investors</span>
            </div>
            {firm.locations.length > 0 && (
              <div className="flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{firm.locations.slice(0, 2).join(', ')}</span>
                {firm.locations.length > 2 && <span>+{firm.locations.length - 2}</span>}
              </div>
            )}
          </div>

          {/* Sectors */}
          {firm.sectors.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
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
      <div className="flex items-center space-x-6 text-sm">
        <div className="text-center">
          <div className="font-medium">{formatNumber(firm.totalInvestments)}</div>
          <div className="text-muted-foreground">Investments</div>
        </div>
        {firm.avgCheckSize > 0 && (
          <div className="text-center">
            <div className="font-medium">{formatCurrency(firm.avgCheckSize)}</div>
            <div className="text-muted-foreground">Avg Check</div>
          </div>
        )}
        <div className="text-center">
          <div className="font-medium">{firm.stages.length}</div>
          <div className="text-muted-foreground">Stages</div>
        </div>
      </div>
    </div>
  )
}

export function FirmsTable({ firms, isLoading }: FirmsTableProps) {
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
    <div className="divide-y">
      {firms.map((firm) => (
        <FirmRow key={firm.name} firm={firm} />
      ))}
    </div>
  )
}