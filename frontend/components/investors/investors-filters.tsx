'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SearchFilters } from '@/lib/api'

interface InvestorsFiltersProps {
  filters: SearchFilters
  onFiltersChange: (filters: Partial<SearchFilters>) => void
  isLoading: boolean
}

const SECTORS = [
  'Technology', 'Healthcare', 'Finance', 'Consumer', 'Enterprise', 'SaaS',
  'E-commerce', 'Fintech', 'Biotech', 'AI/ML', 'Blockchain', 'Media',
  'Gaming', 'Education', 'Real Estate', 'Energy', 'Transportation'
]

const INVESTMENT_STAGES = [
  'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Growth', 'Late Stage'
]

const LOCATIONS = [
  'San Francisco', 'New York', 'Los Angeles', 'Boston', 'Austin', 'Seattle',
  'Chicago', 'London', 'Berlin', 'Paris', 'Singapore', 'Tel Aviv', 'Toronto'
]

export function InvestorsFilters({ filters, onFiltersChange, isLoading }: InvestorsFiltersProps) {
  const [searchQuery, setSearchQuery] = useState(filters.query || '')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== filters.query) {
        onFiltersChange({ query: searchQuery || undefined })
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, filters.query, onFiltersChange])

  const handleClearFilters = () => {
    setSearchQuery('')
    onFiltersChange({
      query: undefined,
      location: undefined,
      sector: undefined,
      investment_stage: undefined,
      min_check_size: undefined,
      max_check_size: undefined,
      years_active_min: undefined,
      years_active_max: undefined,
      company: undefined,
    })
  }

  const hasActiveFilters = filters.query || filters.location || filters.sector || 
    filters.investment_stage || filters.min_check_size || filters.max_check_size ||
    filters.years_active_min || filters.years_active_max || filters.company

  return (
    <div className="space-y-4">
      {/* Basic Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search investors by name, company, or bio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="shrink-0"
        >
          <Filter className="h-4 w-4 mr-2" />
          Advanced
        </Button>
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="shrink-0"
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Advanced Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Select
                  value={filters.location || ''}
                  onValueChange={(value) => onFiltersChange({ location: value || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Locations</SelectItem>
                    {LOCATIONS.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sector</label>
                <Select
                  value={filters.sector || ''}
                  onValueChange={(value) => onFiltersChange({ sector: value || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Sectors</SelectItem>
                    {SECTORS.map((sector) => (
                      <SelectItem key={sector} value={sector}>
                        {sector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Investment Stage */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Investment Stage</label>
                <Select
                  value={filters.investment_stage || ''}
                  onValueChange={(value) => onFiltersChange({ investment_stage: value || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Stages</SelectItem>
                    {INVESTMENT_STAGES.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Company */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Company</label>
                <Input
                  placeholder="Company name"
                  value={filters.company || ''}
                  onChange={(e) => onFiltersChange({ company: e.target.value || undefined })}
                />
              </div>

              {/* Min Check Size */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Min Check Size ($)</label>
                <Input
                  type="number"
                  placeholder="e.g., 50000"
                  value={filters.min_check_size || ''}
                  onChange={(e) => onFiltersChange({ min_check_size: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>

              {/* Max Check Size */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Check Size ($)</label>
                <Input
                  type="number"
                  placeholder="e.g., 5000000"
                  value={filters.max_check_size || ''}
                  onChange={(e) => onFiltersChange({ max_check_size: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>

              {/* Years Active Min */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Min Years Active</label>
                <Input
                  type="number"
                  placeholder="e.g., 5"
                  value={filters.years_active_min || ''}
                  onChange={(e) => onFiltersChange({ years_active_min: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>

              {/* Years Active Max */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Years Active</label>
                <Input
                  type="number"
                  placeholder="e.g., 20"
                  value={filters.years_active_max || ''}
                  onChange={(e) => onFiltersChange({ years_active_max: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}