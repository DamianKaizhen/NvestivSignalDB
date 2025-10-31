'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient, queryKeys, NetworkNode, NetworkLink } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Network, 
  Users, 
  Building, 
  TrendingUp, 
  MapPin, 
  Target,
  Workflow,
  Filter,
  BookOpen,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { D3NetworkVisualization } from './d3-network-visualization'
import { NetworkControls } from './network-controls'
import { WarmIntroFinder } from './warm-intro-finder'
import { NetworkLegend } from './network-legend'

export function NetworkContent() {
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null)
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null)
  const [activeTab, setActiveTab] = useState('visualization')
  const [filters, setFilters] = useState({
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

  // Fetch network stats
  const { data: stats } = useQuery({
    queryKey: queryKeys.networkStats,
    queryFn: () => apiClient.getNetworkStats(),
  })

  // Fetch network graph data
  const { 
    data: networkData, 
    isLoading: isLoadingNetwork, 
    error: networkError,
    refetch: refetchNetwork
  } = useQuery({
    queryKey: queryKeys.networkGraph(filters),
    queryFn: () => apiClient.getNetworkGraph({
      min_tier: filters.minTier,
      max_tier: filters.maxTier,
      sector: filters.sector || undefined,
      location: filters.location || undefined,
      limit: 500 // Reasonable limit for visualization performance
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Filter network data based on current filters
  const filteredNetworkData = useMemo(() => {
    if (!networkData) return { nodes: [], links: [] }

    let filteredNodes = networkData.nodes.filter(node => {
      // Filter by node type
      if (filters.nodeType !== 'all' && node.type !== filters.nodeType) {
        return false
      }

      // Filter by minimum connections (safe check for links existence)
      const links = networkData.links || []
      const nodeConnections = links.filter(
        link => link.source === node.id || link.target === node.id
      ).length
      if (nodeConnections < filters.minConnections) {
        return false
      }

      // Filter by sector (if node has sector data)
      if (filters.sector && node.group !== filters.sector) {
        return false
      }

      // Filter by location
      if (filters.location && node.location !== filters.location) {
        return false
      }

      return true
    })

    // Get node IDs for filtering links
    const nodeIds = new Set(filteredNodes.map(n => n.id))
    const links = networkData.links || []

    let filteredLinks = links.filter(link => {
      // Only include links between visible nodes
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id
      
      if (!nodeIds.has(sourceId) || !nodeIds.has(targetId)) {
        return false
      }

      // Filter by connection type
      if (!filters.connectionTypes.includes(link.type)) {
        return false
      }

      // Filter by connection strength
      if (link.strength < filters.minStrength) {
        return false
      }

      return true
    })

    return {
      nodes: filteredNodes,
      links: filteredLinks
    }
  }, [networkData, filters])

  // Calculate available filter options
  const availableFilters = useMemo(() => {
    if (!networkData) {
      return {
        sectors: [],
        locations: [],
        nodeTypes: ['all', 'investor', 'firm', 'company', 'sector'],
        connectionTypes: ['investment', 'co_investment', 'firm_colleague', 'board_member', 'sector']
      }
    }

    const sectors = [...new Set(networkData.nodes.map(n => n.group).filter(Boolean))]
    const locations = [...new Set(networkData.nodes.map(n => n.location).filter(Boolean))]
    const nodeTypes = ['all', ...new Set(networkData.nodes.map(n => n.type))]
    const connectionTypes = [...new Set(networkData.links.map(l => l.type))]

    return {
      sectors: sectors.sort(),
      locations: locations.sort(),
      nodeTypes,
      connectionTypes
    }
  }, [networkData])

  // Calculate network stats for display
  const networkStats = useMemo(() => {
    const total = networkData || { nodes: [], links: [] }
    const visible = filteredNetworkData

    return {
      totalNodes: total.nodes.length,
      totalConnections: total.links.length,
      visibleNodes: visible.nodes.length,
      visibleConnections: visible.links.length
    }
  }, [networkData, filteredNetworkData])

  const handleExportNetwork = () => {
    if (!filteredNetworkData) return
    
    const dataStr = JSON.stringify(filteredNetworkData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'network-data.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImportNetwork = () => {
    // Placeholder for import functionality
    console.log('Import network data')
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
              <div className="text-2xl font-bold">
                {networkStats.visibleNodes}
                <span className="text-sm text-muted-foreground ml-1">
                  / {networkStats.totalNodes}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Visible nodes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connections</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {networkStats.visibleConnections}
                <span className="text-sm text-muted-foreground ml-1">
                  / {networkStats.totalConnections}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Visible connections
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Investors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvestors}</div>
              <p className="text-xs text-muted-foreground">
                Total investors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Firms</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFirms}</div>
              <p className="text-xs text-muted-foreground">
                Investment firms
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error State */}
      {networkError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load network data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoadingNetwork && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading network data...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {!isLoadingNetwork && !networkError && (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Sidebar Controls */}
          <div className="lg:col-span-1 space-y-4">
            <NetworkControls
              filters={filters}
              onFiltersChange={setFilters}
              availableFilters={availableFilters}
              networkStats={networkStats}
              onExportNetwork={handleExportNetwork}
              onImportNetwork={handleImportNetwork}
              onRefreshNetwork={refetchNetwork}
              isLoading={isLoadingNetwork}
            />
          </div>

          {/* Main Visualization Area */}
          <div className="lg:col-span-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="visualization" className="flex items-center space-x-2">
                  <Network className="h-4 w-4" />
                  <span>Network</span>
                </TabsTrigger>
                <TabsTrigger value="warm-intros" className="flex items-center space-x-2">
                  <Workflow className="h-4 w-4" />
                  <span>Warm Intros</span>
                </TabsTrigger>
                <TabsTrigger value="guide" className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Guide</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="visualization" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Interactive Network Visualization</CardTitle>
                    <CardDescription>
                      Explore relationships between {networkStats.visibleNodes} investors, firms, and sectors
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {filteredNetworkData.nodes.length > 0 ? (
                      <D3NetworkVisualization
                        data={filteredNetworkData}
                        onNodeSelect={setSelectedNode}
                        selectedNode={selectedNode}
                        onNodeHover={setHoveredNode}
                        hoveredNode={hoveredNode}
                        filters={filters}
                        width={1000}
                        height={600}
                      />
                    ) : (
                      <div className="flex items-center justify-center py-12 text-muted-foreground">
                        <div className="text-center">
                          <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No nodes match the current filters</p>
                          <p className="text-sm">Try adjusting your filter settings</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="warm-intros" className="mt-4">
                <WarmIntroFinder 
                  networkData={filteredNetworkData}
                  selectedNode={selectedNode}
                />
              </TabsContent>

              <TabsContent value="guide" className="mt-4">
                <NetworkLegend />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}

      {/* Selected Node Details */}
      {selectedNode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                {selectedNode.type === 'investor' && <Users className="h-5 w-5" />}
                {selectedNode.type === 'firm' && <Building className="h-5 w-5" />}
                {selectedNode.type === 'company' && <Building className="h-5 w-5" />}
                {selectedNode.type === 'sector' && <Target className="h-5 w-5" />}
                <span>{selectedNode.name}</span>
              </div>
              <Badge variant="secondary" className="ml-2">
                {selectedNode.type}
              </Badge>
              <Badge variant="outline" className="ml-2">
                Tier {selectedNode.tier}
              </Badge>
            </CardTitle>
            <CardDescription>
              Network connections and relationship details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <div className="text-2xl font-bold">{selectedNode.value || 0}</div>
                <div className="text-sm text-muted-foreground">Network Value</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {filteredNetworkData.links.filter(l => 
                    (typeof l.source === 'string' ? l.source : l.source.id) === selectedNode.id || 
                    (typeof l.target === 'string' ? l.target : l.target.id) === selectedNode.id
                  ).length}
                </div>
                <div className="text-sm text-muted-foreground">Direct Connections</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{selectedNode.investment_count || 0}</div>
                <div className="text-sm text-muted-foreground">Investments</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{selectedNode.group || 'N/A'}</div>
                <div className="text-sm text-muted-foreground">Category</div>
              </div>
            </div>
            
            {(selectedNode.firm_name || selectedNode.location) && (
              <div className="mt-4 pt-4 border-t grid gap-2 md:grid-cols-2">
                {selectedNode.firm_name && (
                  <div>
                    <div className="text-sm font-medium">Firm</div>
                    <div className="text-sm text-muted-foreground">{selectedNode.firm_name}</div>
                  </div>
                )}
                {selectedNode.location && (
                  <div>
                    <div className="text-sm font-medium">Location</div>
                    <div className="text-sm text-muted-foreground">{selectedNode.location}</div>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm font-medium mb-2">Connected To:</div>
              <div className="flex flex-wrap gap-2">
                {filteredNetworkData.links
                  .filter(l => 
                    (typeof l.source === 'string' ? l.source : l.source.id) === selectedNode.id || 
                    (typeof l.target === 'string' ? l.target : l.target.id) === selectedNode.id
                  )
                  .slice(0, 10) // Limit to first 10 connections
                  .map((link, idx) => {
                    const sourceId = typeof link.source === 'string' ? link.source : link.source.id
                    const targetId = typeof link.target === 'string' ? link.target : link.target.id
                    const connectedNodeId = sourceId === selectedNode.id ? targetId : sourceId
                    const connectedNode = filteredNetworkData.nodes.find(n => n.id === connectedNodeId)
                    return connectedNode ? (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => setSelectedNode(connectedNode)}
                      >
                        {connectedNode.name}
                      </Badge>
                    ) : null
                  })}
                {filteredNetworkData.links.filter(l => 
                  (typeof l.source === 'string' ? l.source : l.source.id) === selectedNode.id || 
                  (typeof l.target === 'string' ? l.target : l.target.id) === selectedNode.id
                ).length > 10 && (
                  <Badge variant="secondary">
                    +{filteredNetworkData.links.filter(l => 
                      (typeof l.source === 'string' ? l.source : l.source.id) === selectedNode.id || 
                      (typeof l.target === 'string' ? l.target : l.target.id) === selectedNode.id
                    ).length - 10} more
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}