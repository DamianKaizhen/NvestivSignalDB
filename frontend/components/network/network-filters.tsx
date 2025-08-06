'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import type { NetworkStats } from '@/lib/api'

interface NetworkFiltersProps {
  filters: {
    minConnections: number
    sector: string
    location: string
  }
  onFiltersChange: (filters: any) => void
  stats?: NetworkStats
}

export function NetworkFilters({ filters, onFiltersChange, stats }: NetworkFiltersProps) {
  const handleConnectionsChange = (value: number[]) => {
    onFiltersChange({ ...filters, minConnections: value[0] })
  }

  const handleSectorChange = (value: string) => {
    onFiltersChange({ ...filters, sector: value })
  }

  const handleLocationChange = (value: string) => {
    onFiltersChange({ ...filters, location: value })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Network Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Minimum Connections */}
        <div className="space-y-3">
          <Label>Minimum Connections: {filters.minConnections}</Label>
          <Slider
            value={[filters.minConnections]}
            onValueChange={handleConnectionsChange}
            max={50}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1</span>
            <span>50</span>
          </div>
        </div>

        {/* Sector Filter */}
        <div className="space-y-2">
          <Label>Sector</Label>
          <Select value={filters.sector} onValueChange={handleSectorChange}>
            <SelectTrigger>
              <SelectValue placeholder="All sectors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Sectors</SelectItem>
              {stats?.topFirms?.map((firm) => (
                <SelectItem key={firm.firm_name} value={firm.firm_name}>
                  {firm.firm_name} ({firm.investor_count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location Filter */}
        <div className="space-y-2">
          <Label>Location</Label>
          <Select value={filters.location} onValueChange={handleLocationChange}>
            <SelectTrigger>
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Locations</SelectItem>
              {stats?.qualityTiers?.map((tier) => (
                <SelectItem key={tier.quality_tier} value={tier.quality_tier}>
                  {tier.quality_tier} ({tier.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          <Label>Legend</Label>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Investors</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Companies</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>Sectors</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-2 p-3 bg-muted rounded-lg">
          <div className="text-sm font-medium">How to use:</div>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Click nodes to see details</li>
            <li>• Drag to pan the network</li>
            <li>• Scroll to zoom in/out</li>
            <li>• Use filters to focus the view</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}