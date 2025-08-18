'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient, queryKeys, type SearchFilters } from '@/lib/api'
import { AdvancedSearchFilters } from '@/components/search/advanced-search-filters'
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

  const handleFiltersChange = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: newFilters.page ?? 1, // Reset to page 1 when filters change (except explicit page changes)
    }))
  }, [])

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  // Save search functionality
  const handleSaveSearch = (name: string, searchFilters: SearchFilters) => {
    const savedSearches = JSON.parse(localStorage.getItem('saved-searches') || '[]')
    const newSearch = {
      id: Date.now().toString(),
      name,
      query: searchFilters.query || '',
      filters: searchFilters,
      created: Date.now(),
    }
    
    savedSearches.unshift(newSearch)
    localStorage.setItem('saved-searches', JSON.stringify(savedSearches.slice(0, 10))) // Keep last 10
    
  }

  // Export functionality
  const handleExport = () => {
    if (!data?.investors) return

    const csvContent = [
      // CSV Headers
      ['Name', 'Title', 'Company', 'Location', 'LinkedIn', 'Network Connections', 'Total Investments'].join(','),
      // CSV Data
      ...data.investors.map(investor => [
        `"${investor.name || ''}"`,
        `"${investor.title || ''}"`,
        `"${investor.company || ''}"`,
        `"${investor.location || ''}"`,
        `"${investor.linkedin_url || ''}"`,
        investor.network_connections || 0,
        investor.total_investments || 0,
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `investors-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
      {/* Advanced Filters */}
      <AdvancedSearchFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onSaveSearch={handleSaveSearch}
        onExport={handleExport}
        isLoading={isLoading}
        resultCount={data?.total}
      />

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