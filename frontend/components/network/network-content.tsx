'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient, queryKeys } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Network, Users, Building, TrendingUp, MapPin, Target } from 'lucide-react'
import { NetworkVisualization } from './network-visualization'
import { NetworkFilters } from './network-filters'

interface NetworkNode {
  id: string
  name: string
  type: 'investor' | 'company' | 'sector'
  value: number
  group: string
}

interface NetworkLink {
  source: string
  target: string
  value: number
  type: 'investment' | 'partnership' | 'sector'
}

export function NetworkContent() {
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null)
  const [filters, setFilters] = useState({
    minConnections: 5,
    sector: '',
    location: '',
  })

  const { data: stats } = useQuery({
    queryKey: queryKeys.networkStats,
    queryFn: () => apiClient.getNetworkStats(),
  })

  // Mock network data - in a real app, this would come from an API
  const networkData = {
    nodes: [
      { id: 'a16z', name: 'Andreessen Horowitz', type: 'investor', value: 50, group: 'vc' },
      { id: 'sequoia', name: 'Sequoia Capital', type: 'investor', value: 48, group: 'vc' },
      { id: 'greylock', name: 'Greylock Partners', type: 'investor', value: 35, group: 'vc' },
      { id: 'tech', name: 'Technology', type: 'sector', value: 100, group: 'sector' },
      { id: 'healthcare', name: 'Healthcare', type: 'sector', value: 80, group: 'sector' },
      { id: 'fintech', name: 'Fintech', type: 'sector', value: 90, group: 'sector' },
      { id: 'stripe', name: 'Stripe', type: 'company', value: 30, group: 'company' },
      { id: 'airbnb', name: 'Airbnb', type: 'company', value: 25, group: 'company' },
      { id: 'uber', name: 'Uber', type: 'company', value: 28, group: 'company' },
    ] as NetworkNode[],
    links: [
      { source: 'a16z', target: 'stripe', value: 5, type: 'investment' },
      { source: 'a16z', target: 'airbnb', value: 4, type: 'investment' },
      { source: 'sequoia', target: 'stripe', value: 6, type: 'investment' },
      { source: 'greylock', target: 'airbnb', value: 3, type: 'investment' },
      { source: 'tech', target: 'stripe', value: 8, type: 'sector' },
      { source: 'tech', target: 'uber', value: 7, type: 'sector' },
      { source: 'fintech', target: 'stripe', value: 10, type: 'sector' },
    ] as NetworkLink[],
  }

  return (
    <div className="space-y-6">
      {/* Network Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Network Nodes</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvestors + stats.totalFirms}</div>
              <p className="text-xs text-muted-foreground">
                Investors and firms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connections</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.withInvestments}</div>
              <p className="text-xs text-muted-foreground">
                Investment relationships
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sectors</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.topFirms?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active sectors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Locations</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.qualityTiers?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Geographic hubs
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Filters */}
        <div className="lg:col-span-1">
          <NetworkFilters
            filters={filters}
            onFiltersChange={setFilters}
            stats={stats}
          />
        </div>

        {/* Visualization */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Network Visualization</CardTitle>
              <CardDescription>
                Interactive network showing relationships between investors, companies, and sectors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NetworkVisualization
                data={networkData}
                filters={filters}
                onNodeSelect={setSelectedNode}
                selectedNode={selectedNode}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                {selectedNode.type === 'investor' && <Users className="h-5 w-5" />}
                {selectedNode.type === 'company' && <Building className="h-5 w-5" />}
                {selectedNode.type === 'sector' && <Target className="h-5 w-5" />}
                <span>{selectedNode.name}</span>
              </div>
              <Badge variant="secondary" className="ml-2">
                {selectedNode.type}
              </Badge>
            </CardTitle>
            <CardDescription>
              Network connections and relationships
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-2xl font-bold">{selectedNode.value}</div>
                <div className="text-sm text-muted-foreground">Connection Strength</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {networkData.links.filter(l => l.source === selectedNode.id || l.target === selectedNode.id).length}
                </div>
                <div className="text-sm text-muted-foreground">Direct Connections</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{selectedNode.group}</div>
                <div className="text-sm text-muted-foreground">Category</div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm font-medium mb-2">Connected To:</div>
              <div className="flex flex-wrap gap-2">
                {networkData.links
                  .filter(l => l.source === selectedNode.id || l.target === selectedNode.id)
                  .map((link, idx) => {
                    const connectedNodeId = link.source === selectedNode.id ? link.target : link.source
                    const connectedNode = networkData.nodes.find(n => n.id === connectedNodeId)
                    return connectedNode ? (
                      <Badge key={idx} variant="outline" className="cursor-pointer hover:bg-accent">
                        {connectedNode.name}
                      </Badge>
                    ) : null
                  })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}