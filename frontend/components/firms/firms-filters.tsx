'use client'

import { useState, useEffect } from 'react'
import { Search, X, Filter, SlidersHorizontal, Building } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { FirmFilters } from '@/lib/api'

interface FirmsFiltersProps {
  filters: FirmFilters
  onFiltersChange: (filters: Partial<FirmFilters>) => void
  isLoading: boolean
}

const sortOptions = [
  { value: 'name', label: 'Firm Name' },
  { value: 'investor_count', label: 'Investor Count' },
  { value: 'avg_investments', label: 'Avg Investments' },
  { value: 'avg_quality_score', label: 'Quality Score' },
  { value: 'total_investments', label: 'Total Investments' },
]

const sectorOptions = [
  'Technology',
  'Healthcare',
  'Financial Services',
  'Consumer',
  'Enterprise Software',
  'E-commerce',
  'Biotech',
  'Fintech',
  'SaaS',
  'AI/ML',
  'Blockchain',
  'CleanTech',
  'Robotics',
  'EdTech',
  'Gaming'
]

const stageOptions = [
  'Pre-Seed',
  'Seed',
  'Series A',
  'Series B',
  'Series C',
  'Series D+',
  'Growth',
  'Late Stage',
  'IPO'
]

const locationOptions = [
  'San Francisco',
  'New York',
  'Los Angeles',
  'Boston',
  'Austin',
  'Seattle',
  'Chicago',
  'Denver',
  'London',
  'Berlin',
  'Paris',
  'Singapore',
  'Tel Aviv',
  'Toronto',
  'Sydney'
]

export function FirmsFilters({ filters, onFiltersChange, isLoading }: FirmsFiltersProps) {
  const [searchQuery, setSearchQuery] = useState(filters.query || '')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [investorRange, setInvestorRange] = useState([
    filters.min_investor_count || 1,
    filters.max_investor_count || 100
  ])

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
    setInvestorRange([1, 100])
    onFiltersChange({
      query: undefined,
      location: undefined,
      sector: undefined,
      investment_stage: undefined,
      min_investor_count: undefined,
      max_investor_count: undefined,
      founded_year_min: undefined,
      founded_year_max: undefined,
    })
  }

  const hasActiveFilters = Boolean(
    filters.query ||
    filters.location ||
    filters.sector ||
    filters.investment_stage ||
    filters.min_investor_count ||
    filters.max_investor_count ||
    filters.founded_year_min ||
    filters.founded_year_max
  )

  return (
    <div className="space-y-4">
      {/* Main search and sort row */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search firms by name, sector, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        
        <Select 
          value={filters.sort_by || 'investor_count'} 
          onValueChange={(value) => onFiltersChange({ sort_by: value as any })}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters.sort_order || 'desc'} 
          onValueChange={(value) => onFiltersChange({ sort_order: value as any })}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">High to Low</SelectItem>
            <SelectItem value="asc">Low to High</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
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

      {/* Advanced filters */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleContent>
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Advanced Filters</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Location Filter */}
              <div className="space-y-2">
                <Label>Location</Label>
                <Select 
                  value={filters.location || ''} 
                  onValueChange={(value) => onFiltersChange({ location: value || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Locations</SelectItem>
                    {locationOptions.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sector Filter */}
              <div className="space-y-2">
                <Label>Investment Sector</Label>
                <Select 
                  value={filters.sector || ''} 
                  onValueChange={(value) => onFiltersChange({ sector: value || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Sectors</SelectItem>
                    {sectorOptions.map((sector) => (
                      <SelectItem key={sector} value={sector}>
                        {sector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Investment Stage Filter */}
              <div className="space-y-2">
                <Label>Investment Stage</Label>
                <Select 
                  value={filters.investment_stage || ''} 
                  onValueChange={(value) => onFiltersChange({ investment_stage: value || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Stages</SelectItem>
                    {stageOptions.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Investor Count Range */}
            <div className="space-y-3">
              <Label>Number of Investors: {investorRange[0]} - {investorRange[1]}</Label>
              <Slider
                value={investorRange}
                onValueChange={(value) => {
                  setInvestorRange(value)
                  onFiltersChange({
                    min_investor_count: value[0],
                    max_investor_count: value[1]
                  })
                }}
                max={100}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            {/* Founded Year Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Founded After</Label>
                <Input
                  type="number"
                  placeholder="2000"
                  value={filters.founded_year_min || ''}
                  onChange={(e) => onFiltersChange({ 
                    founded_year_min: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Founded Before</Label>
                <Input
                  type="number"
                  placeholder="2024"
                  value={filters.founded_year_max || ''}
                  onChange={(e) => onFiltersChange({ 
                    founded_year_max: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                />
              </div>
            </div>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}