'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Filter, 
  Search, 
  Settings,
  Download,
  Upload,
  RefreshCw,
  Users,
  Building,
  Target,
  MapPin,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react'

interface NetworkControlsProps {
  filters: {
    minConnections: number
    sector: string
    location: string
    nodeType: string
    minTier: number
    maxTier: number
    connectionTypes: string[]
    showLabels: boolean
    minStrength: number
  }
  onFiltersChange: (filters: any) => void
  availableFilters: {
    sectors: string[]
    locations: string[]
    nodeTypes: string[]
    connectionTypes: string[]
  }
  networkStats: {
    totalNodes: number
    totalConnections: number
    visibleNodes: number
    visibleConnections: number
  }
  onExportNetwork: () => void
  onImportNetwork: () => void
  onRefreshNetwork: () => void
  isLoading: boolean
}

const CONNECTION_TYPES = [
  { value: 'investment', label: 'Investments', color: 'bg-blue-500' },
  { value: 'co_investment', label: 'Co-investments', color: 'bg-green-500' },
  { value: 'firm_colleague', label: 'Firm Colleagues', color: 'bg-purple-500' },
  { value: 'board_member', label: 'Board Members', color: 'bg-orange-500' },
  { value: 'sector', label: 'Sector', color: 'bg-gray-500' },
]

const NODE_TYPES = [
  { value: 'all', label: 'All Nodes', icon: <Target className="h-4 w-4" /> },
  { value: 'investor', label: 'Investors', icon: <Users className="h-4 w-4" /> },
  { value: 'firm', label: 'Firms', icon: <Building className="h-4 w-4" /> },
  { value: 'company', label: 'Companies', icon: <Building className="h-4 w-4" /> },
  { value: 'sector', label: 'Sectors', icon: <Target className="h-4 w-4" /> },
]

export function NetworkControls({
  filters,
  onFiltersChange,
  availableFilters,
  networkStats,
  onExportNetwork,
  onImportNetwork,
  onRefreshNetwork,
  isLoading
}: NetworkControlsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const handleConnectionTypeToggle = (type: string, checked: boolean) => {
    const updatedTypes = checked
      ? [...filters.connectionTypes, type]
      : filters.connectionTypes.filter(t => t !== type)
    
    handleFilterChange('connectionTypes', updatedTypes)
  }

  const resetFilters = () => {
    onFiltersChange({
      minConnections: 1,
      sector: '',
      location: '',
      nodeType: 'all',
      minTier: 1,
      maxTier: 3,
      connectionTypes: ['investment', 'co_investment', 'firm_colleague'],
      showLabels: true,
      minStrength: 0.1
    })
    setSearchQuery('')
  }

  return (
    <div className="space-y-4">
      {/* Network Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Network Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-lg font-bold">{networkStats.visibleNodes}</div>
              <div className="text-xs text-muted-foreground">
                of {networkStats.totalNodes} nodes
              </div>
            </div>
            <div>
              <div className="text-lg font-bold">{networkStats.visibleConnections}</div>
              <div className="text-xs text-muted-foreground">
                of {networkStats.totalConnections} connections
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span>Search Nodes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Input
              placeholder="Search investors, firms, sectors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Node Type Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Node Type</Label>
            <Select
              value={filters.nodeType}
              onValueChange={(value) => handleFilterChange('nodeType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select node type" />
              </SelectTrigger>
              <SelectContent>
                {NODE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center space-x-2">
                      {type.icon}
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tier Range */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Network Tier</Label>
            <div className="px-2">
              <Slider
                value={[filters.minTier, filters.maxTier]}
                onValueChange={([min, max]) => {
                  handleFilterChange('minTier', min)
                  handleFilterChange('maxTier', max)
                }}
                min={1}
                max={3}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Tier {filters.minTier}</span>
                <span>Tier {filters.maxTier}</span>
              </div>
            </div>
          </div>

          {/* Minimum Connections */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">
              Min Connections: {filters.minConnections}
            </Label>
            <Slider
              value={[filters.minConnections]}
              onValueChange={([value]) => handleFilterChange('minConnections', value)}
              min={1}
              max={50}
              step={1}
              className="w-full"
            />
          </div>

          {/* Sector Filter */}
          {availableFilters.sectors.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Sector</Label>
              <Select
                value={filters.sector}
                onValueChange={(value) => handleFilterChange('sector', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All sectors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All sectors</SelectItem>
                  {availableFilters.sectors.map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Location Filter */}
          {availableFilters.locations.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Location</Label>
              <Select
                value={filters.location}
                onValueChange={(value) => handleFilterChange('location', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All locations</SelectItem>
                  {availableFilters.locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-3 w-3" />
                        <span>{location}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showAdvancedFilters && (
            <>
              <Separator />
              
              {/* Connection Types */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Connection Types</Label>
                <div className="space-y-2">
                  {CONNECTION_TYPES.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={type.value}
                        checked={filters.connectionTypes.includes(type.value)}
                        onCheckedChange={(checked) =>
                          handleConnectionTypeToggle(type.value, checked as boolean)
                        }
                      />
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${type.color}`} />
                        <Label htmlFor={type.value} className="text-xs cursor-pointer">
                          {type.label}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connection Strength */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">
                  Min Connection Strength: {(filters.minStrength * 100).toFixed(0)}%
                </Label>
                <Slider
                  value={[filters.minStrength]}
                  onValueChange={([value]) => handleFilterChange('minStrength', value)}
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Visual Options */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Display Options</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showLabels"
                    checked={filters.showLabels}
                    onCheckedChange={(checked) =>
                      handleFilterChange('showLabels', checked)
                    }
                  />
                  <Label htmlFor="showLabels" className="text-xs cursor-pointer flex items-center space-x-1">
                    {filters.showLabels ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    <span>Show Labels</span>
                  </Label>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onExportNetwork}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onImportNetwork}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-1" />
                Import
              </Button>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={onRefreshNetwork}
              disabled={isLoading}
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Refresh Network'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Filters */}
      {(filters.sector || filters.location || filters.nodeType !== 'all' || 
        filters.minConnections > 1 || filters.connectionTypes.length < CONNECTION_TYPES.length) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {filters.nodeType !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  {NODE_TYPES.find(t => t.value === filters.nodeType)?.label}
                </Badge>
              )}
              {filters.sector && (
                <Badge variant="secondary" className="text-xs">
                  {filters.sector}
                </Badge>
              )}
              {filters.location && (
                <Badge variant="secondary" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  {filters.location}
                </Badge>
              )}
              {filters.minConnections > 1 && (
                <Badge variant="secondary" className="text-xs">
                  Min {filters.minConnections} connections
                </Badge>
              )}
              {filters.connectionTypes.length < CONNECTION_TYPES.length && (
                <Badge variant="secondary" className="text-xs">
                  {filters.connectionTypes.length} connection types
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}