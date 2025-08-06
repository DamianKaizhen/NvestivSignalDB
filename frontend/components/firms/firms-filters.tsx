'use client'

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { SearchFilters } from '@/lib/api'

interface FirmsFiltersProps {
  filters: SearchFilters
  onFiltersChange: (filters: Partial<SearchFilters>) => void
  isLoading: boolean
}

export function FirmsFilters({ filters, onFiltersChange, isLoading }: FirmsFiltersProps) {
  const [searchQuery, setSearchQuery] = useState(filters.company || '')

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== filters.company) {
        onFiltersChange({ company: searchQuery || undefined })
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, filters.company, onFiltersChange])

  const handleClearFilters = () => {
    setSearchQuery('')
    onFiltersChange({
      company: undefined,
    })
  }

  const hasActiveFilters = filters.company

  return (
    <div className="flex gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search firms by company name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          disabled={isLoading}
        />
      </div>
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
  )
}