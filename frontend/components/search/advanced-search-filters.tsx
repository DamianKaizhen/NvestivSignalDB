"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Search, Filter, X, ChevronDown, Bookmark, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { SearchFilters } from "@/lib/api"

interface AdvancedSearchFiltersProps {
  filters: SearchFilters
  onFiltersChange: (filters: Partial<SearchFilters>) => void
  onSaveSearch?: (name: string, filters: SearchFilters) => void
  onExport?: () => void
  isLoading: boolean
  resultCount?: number
}

// Filter options based on the investor database schema
const INVESTMENT_STAGES: MultiSelectOption[] = [
  { value: "pre-seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series-a", label: "Series A" },
  { value: "series-b", label: "Series B" },
  { value: "series-c", label: "Series C" },
  { value: "growth", label: "Growth" },
  { value: "late-stage", label: "Late Stage" },
  { value: "bridge", label: "Bridge" },
]

const SECTORS: MultiSelectOption[] = [
  { value: "technology", label: "Technology" },
  { value: "healthcare", label: "Healthcare" },
  { value: "fintech", label: "Fintech" },
  { value: "saas", label: "SaaS" },
  { value: "ai-ml", label: "AI/ML" },
  { value: "blockchain", label: "Blockchain" },
  { value: "e-commerce", label: "E-commerce" },
  { value: "consumer", label: "Consumer" },
  { value: "enterprise", label: "Enterprise" },
  { value: "biotech", label: "Biotech" },
  { value: "energy", label: "Energy" },
  { value: "media", label: "Media" },
  { value: "gaming", label: "Gaming" },
  { value: "education", label: "Education" },
  { value: "real-estate", label: "Real Estate" },
  { value: "transportation", label: "Transportation" },
]

const LOCATIONS: MultiSelectOption[] = [
  { value: "san-francisco", label: "San Francisco" },
  { value: "new-york", label: "New York" },
  { value: "los-angeles", label: "Los Angeles" },
  { value: "boston", label: "Boston" },
  { value: "austin", label: "Austin" },
  { value: "seattle", label: "Seattle" },
  { value: "chicago", label: "Chicago" },
  { value: "london", label: "London" },
  { value: "berlin", label: "Berlin" },
  { value: "paris", label: "Paris" },
  { value: "singapore", label: "Singapore" },
  { value: "tel-aviv", label: "Tel Aviv" },
  { value: "toronto", label: "Toronto" },
  { value: "mumbai", label: "Mumbai" },
  { value: "bangalore", label: "Bangalore" },
]

const NETWORK_TIERS: MultiSelectOption[] = [
  { value: "super-connected", label: "Super Connected" },
  { value: "highly-connected", label: "Highly Connected" },
  { value: "well-connected", label: "Well Connected" },
  { value: "connected", label: "Connected" },
]

const DIVERSITY_FOCUS: MultiSelectOption[] = [
  { value: "founder-focused", label: "Founder Focused" },
  { value: "female-focused", label: "Female Focused" },
  { value: "diversity-focused", label: "Diversity Focused" },
  { value: "invests-in-diverse-founders", label: "Invests in Diverse Founders" },
  { value: "invests-in-female-founders", label: "Invests in Female Founders" },
]

export function AdvancedSearchFilters({
  filters,
  onFiltersChange,
  onSaveSearch,
  onExport,
  isLoading,
  resultCount,
}: AdvancedSearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState(filters.query || "")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [checkSizeRange, setCheckSizeRange] = useState([
    filters.min_check_size || 0,
    filters.max_check_size || 10000000,
  ])
  const [yearsActiveRange, setYearsActiveRange] = useState([
    filters.years_active_min || 0,
    filters.years_active_max || 30,
  ])
  const [saveSearchName, setSaveSearchName] = useState("")
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  // Extended filter state for new fields
  const [selectedStages, setSelectedStages] = useState<string[]>([])
  const [selectedSectors, setSelectedSectors] = useState<string[]>([])
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [selectedNetworkTiers, setSelectedNetworkTiers] = useState<string[]>([])
  const [selectedDiversityFocus, setSelectedDiversityFocus] = useState<string[]>([])
  const [hasLinkedIn, setHasLinkedIn] = useState<boolean | undefined>(undefined)
  const [leadsRounds, setLeadsRounds] = useState<boolean | undefined>(undefined)
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== filters.query) {
        onFiltersChange({ query: searchQuery || undefined })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, filters.query])

  // Update check size filters
  useEffect(() => {
    onFiltersChange({
      min_check_size: checkSizeRange[0] > 0 ? checkSizeRange[0] : undefined,
      max_check_size: checkSizeRange[1] < 10000000 ? checkSizeRange[1] : undefined,
    })
  }, [checkSizeRange])

  // Update years active filters
  useEffect(() => {
    onFiltersChange({
      years_active_min: yearsActiveRange[0] > 0 ? yearsActiveRange[0] : undefined,
      years_active_max: yearsActiveRange[1] < 30 ? yearsActiveRange[1] : undefined,
    })
  }, [yearsActiveRange])

  const handleClearFilters = () => {
    setSearchQuery("")
    setCheckSizeRange([0, 10000000])
    setYearsActiveRange([0, 30])
    setSelectedStages([])
    setSelectedSectors([])
    setSelectedLocations([])
    setSelectedNetworkTiers([])
    setSelectedDiversityFocus([])
    setHasLinkedIn(undefined)
    setLeadsRounds(undefined)
    setIsActive(undefined)

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

  const handleSaveSearch = () => {
    if (saveSearchName.trim() && onSaveSearch) {
      onSaveSearch(saveSearchName.trim(), filters)
      setSaveSearchName("")
      setShowSaveDialog(false)
    }
  }

  const hasActiveFilters = 
    filters.query ||
    filters.location ||
    filters.sector ||
    filters.investment_stage ||
    filters.min_check_size ||
    filters.max_check_size ||
    filters.years_active_min ||
    filters.years_active_max ||
    filters.company ||
    selectedStages.length > 0 ||
    selectedSectors.length > 0 ||
    selectedLocations.length > 0 ||
    selectedNetworkTiers.length > 0 ||
    selectedDiversityFocus.length > 0 ||
    hasLinkedIn !== undefined ||
    leadsRounds !== undefined ||
    isActive !== undefined

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value}`
  }

  return (
    <div className="space-y-6">
      {/* Main Search Bar with Quick Actions */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search investors by name, company, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
            disabled={isLoading}
          />
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="h-12 px-6"
        >
          <Filter className="h-4 w-4 mr-2" />
          Advanced
          <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </Button>

        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="h-12 px-6"
          >
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}

        {onSaveSearch && (
          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-12 px-6">
                <Bookmark className="h-4 w-4 mr-2" />
                Save
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Search</DialogTitle>
                <DialogDescription>
                  Give your search a name to save it for later use
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="search-name">Search Name</Label>
                  <Input
                    id="search-name"
                    value={saveSearchName}
                    onChange={(e) => setSaveSearchName(e.target.value)}
                    placeholder="e.g., Early-stage Fintech Investors"
                  />
                </div>
                <Button onClick={handleSaveSearch} className="w-full">
                  Save Search
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {onExport && resultCount && resultCount > 0 && (
          <Button variant="outline" onClick={onExport} className="h-12 px-6">
            <Download className="h-4 w-4 mr-2" />
            Export ({resultCount})
          </Button>
        )}
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.query && (
            <Badge variant="secondary" className="px-3 py-1">
              Search: "{filters.query}"
              <X 
                className="h-3 w-3 ml-2 cursor-pointer hover:text-destructive" 
                onClick={() => {
                  setSearchQuery("")
                  onFiltersChange({ query: undefined })
                }}
              />
            </Badge>
          )}
          {selectedStages.map(stage => (
            <Badge key={stage} variant="secondary" className="px-3 py-1">
              Stage: {INVESTMENT_STAGES.find(s => s.value === stage)?.label}
              <X 
                className="h-3 w-3 ml-2 cursor-pointer hover:text-destructive" 
                onClick={() => {
                  const newStages = selectedStages.filter(s => s !== stage)
                  setSelectedStages(newStages)
                }}
              />
            </Badge>
          ))}
          {/* Add more filter chips as needed */}
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Advanced Search Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Investment Stage */}
              <div className="space-y-2">
                <Label>Investment Stages</Label>
                <MultiSelect
                  options={INVESTMENT_STAGES}
                  onValueChange={setSelectedStages}
                  defaultValue={selectedStages}
                  placeholder="Select stages"
                />
              </div>

              {/* Sectors */}
              <div className="space-y-2">
                <Label>Sectors</Label>
                <MultiSelect
                  options={SECTORS}
                  onValueChange={setSelectedSectors}
                  defaultValue={selectedSectors}
                  placeholder="Select sectors"
                />
              </div>

              {/* Locations */}
              <div className="space-y-2">
                <Label>Locations</Label>
                <MultiSelect
                  options={LOCATIONS}
                  onValueChange={setSelectedLocations}
                  defaultValue={selectedLocations}
                  placeholder="Select locations"
                />
              </div>

              {/* Network Tier */}
              <div className="space-y-2">
                <Label>Network Tier</Label>
                <MultiSelect
                  options={NETWORK_TIERS}
                  onValueChange={setSelectedNetworkTiers}
                  defaultValue={selectedNetworkTiers}
                  placeholder="Select network tiers"
                />
              </div>

              {/* Diversity Focus */}
              <div className="space-y-2">
                <Label>Diversity Focus</Label>
                <MultiSelect
                  options={DIVERSITY_FOCUS}
                  onValueChange={setSelectedDiversityFocus}
                  defaultValue={selectedDiversityFocus}
                  placeholder="Select diversity focus"
                />
              </div>

              {/* Company/Firm */}
              <div className="space-y-2">
                <Label htmlFor="company">Company/Firm</Label>
                <Input
                  id="company"
                  placeholder="e.g., Andreessen Horowitz"
                  value={filters.company || ""}
                  onChange={(e) => onFiltersChange({ company: e.target.value || undefined })}
                />
              </div>
            </div>

            <Separator />

            {/* Investment Amount Range */}
            <div className="space-y-4">
              <Label>Check Size Range</Label>
              <div className="px-3">
                <Slider
                  defaultValue={checkSizeRange}
                  max={10000000}
                  min={0}
                  step={50000}
                  onValueChange={setCheckSizeRange}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>{formatCurrency(checkSizeRange[0])}</span>
                  <span>{formatCurrency(checkSizeRange[1])}</span>
                </div>
              </div>
            </div>

            {/* Years Active Range */}
            <div className="space-y-4">
              <Label>Years Active</Label>
              <div className="px-3">
                <Slider
                  defaultValue={yearsActiveRange}
                  max={30}
                  min={0}
                  step={1}
                  onValueChange={setYearsActiveRange}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>{yearsActiveRange[0]} years</span>
                  <span>{yearsActiveRange[1]} years</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Boolean Filters */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-linkedin"
                  checked={hasLinkedIn === true}
                  onCheckedChange={(checked) => setHasLinkedIn(checked ? true : undefined)}
                />
                <Label htmlFor="has-linkedin">Has LinkedIn Profile</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="leads-rounds"
                  checked={leadsRounds === true}
                  onCheckedChange={(checked) => setLeadsRounds(checked ? true : undefined)}
                />
                <Label htmlFor="leads-rounds">Leads Investment Rounds</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-active"
                  checked={isActive === true}
                  onCheckedChange={(checked) => setIsActive(checked ? true : undefined)}
                />
                <Label htmlFor="is-active">Currently Active</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {resultCount !== undefined && (
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            "Searching..."
          ) : (
            `Found ${resultCount.toLocaleString()} investor${resultCount !== 1 ? 's' : ''}`
          )}
        </div>
      )}
    </div>
  )
}