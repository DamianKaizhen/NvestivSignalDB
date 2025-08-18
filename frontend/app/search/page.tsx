'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { SearchContent } from '@/components/search/search-content'
import { AdvancedSearchFilters } from '@/components/search/advanced-search-filters'
import { SearchSkeleton } from '@/components/search/search-skeleton'
import { useQuery } from '@tanstack/react-query'
import { apiClient, type SearchFilters } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { InvestorsTable } from '@/components/investors/investors-table'
import { Separator } from '@/components/ui/separator'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Initialize filters from URL parameters
  const [filters, setFilters] = useState<SearchFilters>(() => {
    const initialFilters: SearchFilters = {
      page: 1,
      limit: 20,
    }

    // Parse URL parameters
    const query = searchParams.get('q')
    const location = searchParams.get('location')
    const sector = searchParams.get('sector')
    const investment_stage = searchParams.get('investment_stage')
    const company = searchParams.get('company')
    const min_check_size = searchParams.get('min_check_size')
    const max_check_size = searchParams.get('max_check_size')
    const years_active_min = searchParams.get('years_active_min')
    const years_active_max = searchParams.get('years_active_max')
    const page = searchParams.get('page')
    const limit = searchParams.get('limit')

    if (query) initialFilters.query = query
    if (location) initialFilters.location = location
    if (sector) initialFilters.sector = sector
    if (investment_stage) initialFilters.investment_stage = investment_stage
    if (company) initialFilters.company = company
    if (min_check_size) initialFilters.min_check_size = parseInt(min_check_size)
    if (max_check_size) initialFilters.max_check_size = parseInt(max_check_size)
    if (years_active_min) initialFilters.years_active_min = parseInt(years_active_min)
    if (years_active_max) initialFilters.years_active_max = parseInt(years_active_max)
    if (page) initialFilters.page = parseInt(page)
    if (limit) initialFilters.limit = parseInt(limit)

    return initialFilters
  })

  // Search investors based on filters
  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['investors-search', filters],
    queryFn: () => apiClient.searchInvestors(filters),
    enabled: true,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Update URL when filters change
  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 } // Reset to page 1 when filters change
    setFilters(updatedFilters)

    // Update URL
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value.toString())
      }
    })

    const newUrl = `/search${params.toString() ? `?${params.toString()}` : ''}`
    router.replace(newUrl, { scroll: false })
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    updateFilters({ page })
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
    
    // Show success message (you could add a toast here)
    console.log('Search saved:', name)
  }

  // Export functionality
  const handleExport = () => {
    if (!searchResults?.investors) return

    const csvContent = [
      // CSV Headers
      ['Name', 'Title', 'Company', 'Location', 'LinkedIn', 'Network Connections', 'Total Investments'].join(','),
      // CSV Data
      ...searchResults.investors.map(investor => [
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
    link.setAttribute('download', `investors-search-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Search</h1>
          <p className="text-muted-foreground">
            Find investors using comprehensive filters or AI-powered natural language search
          </p>
        </div>

        {/* Advanced Search Filters */}
        <AdvancedSearchFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onSaveSearch={handleSaveSearch}
          onExport={handleExport}
          isLoading={isLoading}
          resultCount={searchResults?.total}
        />

        <Separator />

        {/* AI-Powered Search Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">AI-Powered Natural Language Search</h2>
          <Suspense fallback={<SearchSkeleton />}>
            <SearchContent />
          </Suspense>
        </div>

        <Separator />

        {/* Search Results */}
        {searchResults && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Search Results ({searchResults.total?.toLocaleString() || 0})
              </h2>
            </div>

            {searchResults.investors.length > 0 ? (
              <Card>
                <InvestorsTable
                  investors={searchResults.investors}
                  isLoading={isLoading}
                  pagination={{
                    page: filters.page || 1,
                    limit: filters.limit || 20,
                    total: searchResults.total || 0,
                    hasMore: searchResults.page < searchResults.totalPages,
                    onPageChange: handlePageChange,
                  }}
                />
              </Card>
            ) : !isLoading ? (
              <Card className="p-8 text-center">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">No investors found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search criteria or use the AI-powered search above
                  </p>
                </div>
              </Card>
            ) : null}
          </div>
        )}

        {error && (
          <Card className="p-8 text-center border-destructive">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-destructive">Search Error</h3>
              <p className="text-muted-foreground">
                Failed to search investors. Please check your connection and try again.
              </p>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}