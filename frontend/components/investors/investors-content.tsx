'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient, queryKeys, type SearchFilters } from '@/lib/api'
import { InvestorsFilters } from './investors-filters'
import { InvestorsTable } from './investors-table'
import { InvestorsPagination } from './investors-pagination'
import { Card } from '@/components/ui/card'

export function InvestorsContent() {
  const [filters, setFilters] = useState<SearchFilters>({
    page: 1,
    limit: 50,
  })

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.investorSearch(filters),
    queryFn: () => apiClient.searchInvestors(filters),
  })

  const handleFiltersChange = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: newFilters.page ?? 1, // Reset to page 1 when filters change (except explicit page changes)
    }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load investors</p>
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
        <InvestorsFilters
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
              Showing {((data.page - 1) * data.limit) + 1} to {Math.min(data.page * data.limit, data.total || data.investors.length)} of {data.total ? data.total.toLocaleString() : 'unknown'} investors
            </p>
            <p className="text-sm text-muted-foreground">
              Page {data.page}{data.totalPages ? ` of ${data.totalPages}` : ''}
            </p>
          </div>
        )}

        {/* Table */}
        <Card>
          <InvestorsTable 
            investors={data?.investors || []}
            isLoading={isLoading}
          />
        </Card>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <InvestorsPagination
            currentPage={data.page}
            totalPages={data.totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  )
}