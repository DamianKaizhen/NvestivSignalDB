'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient, queryKeys, type SearchFilters } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { FirmsTable } from './firms-table'
import { FirmsFilters } from './firms-filters'

export function FirmsContent() {
  const [filters, setFilters] = useState<SearchFilters>({
    page: 1,
    limit: 50,
  })

  // Use the search investors endpoint but filter by company field
  const { data, isLoading, error } = useQuery({
    queryKey: ['firms', filters],
    queryFn: async () => {
      const result = await apiClient.searchInvestors(filters)
      
      // Group investors by company and aggregate data
      const firmMap = new Map()
      
      result.investors.forEach(investor => {
        if (!investor.company) return
        
        const company = investor.company
        if (!firmMap.has(company)) {
          firmMap.set(company, {
            name: company,
            investors: [],
            totalInvestments: 0,
            avgCheckSize: 0,
            locations: new Set(),
            sectors: new Set(),
            stages: new Set(),
          })
        }
        
        const firm = firmMap.get(company)
        firm.investors.push(investor)
        
        if (investor.total_investments) {
          firm.totalInvestments += investor.total_investments
        }
        
        if (investor.location) {
          firm.locations.add(investor.location)
        }
        
        if (investor.sectors) {
          investor.sectors.forEach(sector => firm.sectors.add(sector))
        }
        
        if (investor.investment_stage) {
          investor.investment_stage.forEach(stage => firm.stages.add(stage))
        }
      })
      
      // Convert to array and calculate averages
      const firms = Array.from(firmMap.values()).map(firm => ({
        ...firm,
        investorCount: firm.investors.length,
        avgCheckSize: firm.investors.reduce((sum: number, inv: any) => sum + (inv.average_check_size || 0), 0) / firm.investors.length || 0,
        locations: Array.from(firm.locations),
        sectors: Array.from(firm.sectors),
        stages: Array.from(firm.stages),
      }))
      
      // Sort by investor count
      firms.sort((a, b) => b.investorCount - a.investorCount)
      
      return {
        firms,
        total: firms.length,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(firms.length / result.limit)
      }
    },
  })

  const handleFiltersChange = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: newFilters.page ?? 1,
    }))
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load firms</p>
        <p className="text-sm text-muted-foreground mt-2">
          Please ensure the API server is running at localhost:3010
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-6">
        <FirmsFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          isLoading={isLoading}
        />
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {/* Results count */}
        {data && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Found {data.total.toLocaleString()} investment firms
            </p>
          </div>
        )}

        {/* Table */}
        <Card>
          <FirmsTable 
            firms={data?.firms || []}
            isLoading={isLoading}
          />
        </Card>
      </div>
    </div>
  )
}