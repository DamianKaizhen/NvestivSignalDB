'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient, queryKeys, type FirmFilters } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { FirmsTable } from './firms-table'
import { FirmsFilters } from './firms-filters'

export function FirmsContent() {
  const [filters, setFilters] = useState<FirmFilters>({
    page: 1,
    limit: 50,
    sort_by: 'investor_count',
    sort_order: 'desc',
  })

  // Use the dedicated firms API endpoint
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.firmSearch(filters),
    queryFn: () => apiClient.searchFirms(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const handleFiltersChange = (newFilters: Partial<FirmFilters>) => {
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
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Page {data.page} of {data.totalPages}</span>
            </div>
          </div>
        )}

        {/* Table */}
        <Card>
          <FirmsTable 
            firms={data?.firms || []}
            isLoading={isLoading}
            pagination={{
              page: filters.page || 1,
              limit: filters.limit || 50,
              total: data?.total || 0,
              totalPages: data?.totalPages || 1,
              hasMore: (data?.page || 1) < (data?.totalPages || 1)
            }}
            onPageChange={(page) => handleFiltersChange({ page })}
          />
        </Card>
      </div>
    </div>
  )
}