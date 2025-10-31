'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Play, 
  Pause, 
  Maximize2,
  Users,
  Building,
  Target,
  MapPin,
  TrendingUp
} from 'lucide-react'
import { NetworkNode, NetworkLink } from '@/lib/api'

interface D3NetworkVisualizationProps {
  data: {
    nodes: NetworkNode[]
    links: NetworkLink[]
  }
  onNodeSelect: (node: NetworkNode | null) => void
  selectedNode: NetworkNode | null
  onNodeHover: (node: NetworkNode | null) => void
  hoveredNode: NetworkNode | null
  filters: {
    minConnections: number
    sector: string
    location: string
    nodeType: string
  }
  width?: number
  height?: number
}

interface SimulationNode extends NetworkNode {
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
  vx?: number
  vy?: number
}

interface SimulationLink extends NetworkLink {
  source: SimulationNode
  target: SimulationNode
}

export function D3NetworkVisualization({
  data,
  onNodeSelect,
  selectedNode,
  onNodeHover,
  hoveredNode,
  filters,
  width = 1000,
  height = 600
}: D3NetworkVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const simulationRef = useRef<d3.Simulation<SimulationNode, SimulationLink> | null>(null)
  const [isSimulating, setIsSimulating] = useState(true)
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })
  const [nodeDetails, setNodeDetails] = useState<SimulationNode | null>(null)

  // Color schemes for different node types
  const getNodeColor = useCallback((node: NetworkNode) => {
    if (selectedNode?.id === node.id) return '#ef4444' // red for selected
    if (hoveredNode?.id === node.id) return '#f59e0b' // amber for hovered
    
    switch (node.type) {
      case 'investor': return '#3b82f6' // blue
      case 'firm': return '#10b981' // green
      case 'company': return '#8b5cf6' // purple
      case 'sector': return '#f97316' // orange
      default: return '#6b7280' // gray
    }
  }, [selectedNode, hoveredNode])

  const getNodeSize = useCallback((node: NetworkNode) => {
    const baseSize = 4
    let sizeMultiplier = 1
    
    if (node.investment_count) {
      sizeMultiplier = Math.log(node.investment_count + 1) * 1.5
    } else if (node.value) {
      sizeMultiplier = Math.log(node.value + 1) * 1.2
    }
    
    // Tier-based sizing
    const tierMultiplier = Math.max(1, (3 - node.tier) * 0.5)
    
    return Math.max(baseSize, Math.min(baseSize * sizeMultiplier * tierMultiplier, 25))
  }, [])

  const getLinkColor = useCallback((link: NetworkLink) => {
    switch (link.type) {
      case 'investment': return '#3b82f6'
      case 'co_investment': return '#10b981'
      case 'firm_colleague': return '#8b5cf6'
      case 'board_member': return '#f59e0b'
      case 'sector': return '#6b7280'
      default: return '#d1d5db'
    }
  }, [])

  const getLinkWidth = useCallback((link: NetworkLink) => {
    return Math.max(0.5, Math.min(link.strength * 3, 6))
  }, [])

  // Initialize D3 simulation
  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove() // Clear previous render

    // Create container groups
    const container = svg.append('g').attr('class', 'zoom-container')
    const linksGroup = container.append('g').attr('class', 'links')
    const nodesGroup = container.append('g').attr('class', 'nodes')

    // Setup zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        const { x, y, k } = event.transform
        container.attr('transform', event.transform)
        setTransform({ x, y, k })
      })

    svg.call(zoom)

    // Create simulation
    const simulation = d3.forceSimulation<SimulationNode>(data.nodes as SimulationNode[])
      .force('link', d3.forceLink<SimulationNode, SimulationLink>(data.links as SimulationLink[])
        .id((d) => d.id)
        .distance((d) => {
          // Adjust distance based on connection type
          switch (d.type) {
            case 'firm_colleague': return 30
            case 'investment': return 50
            case 'co_investment': return 40
            case 'board_member': return 35
            default: return 60
          }
        })
        .strength((d) => Math.min(d.strength, 1)))
      .force('charge', d3.forceManyBody()
        .strength((d) => {
          // More negative = more repulsion for important nodes
          const baseStrength = -100
          const tierMultiplier = Math.max(1, (3 - ((d as any).tier || 1)) * 0.5)
          return baseStrength * tierMultiplier
        }))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide()
        .radius((d) => getNodeSize(d as NetworkNode) + 2))

    simulationRef.current = simulation

    // Create links
    const links = linksGroup
      .selectAll('line')
      .data(data.links)
      .enter()
      .append('line')
      .attr('stroke', getLinkColor)
      .attr('stroke-width', getLinkWidth)
      .attr('stroke-opacity', 0.6)
      .attr('class', 'network-link')

    // Create nodes
    const nodes = nodesGroup
      .selectAll('g')
      .data(data.nodes)
      .enter()
      .append('g')
      .attr('class', 'network-node')
      .style('cursor', 'pointer')

    // Add circles for nodes
    nodes
      .append('circle')
      .attr('r', (d) => getNodeSize(d as NetworkNode))
      .attr('fill', getNodeColor)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)

    // Add labels for important nodes
    nodes
      .filter((d) => ((d as any).tier || 1) <= 2 || getNodeSize(d as NetworkNode) > 8)
      .append('text')
      .attr('dy', (d) => getNodeSize(d as NetworkNode) + 12)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', '500')
      .style('fill', 'currentColor')
      .style('pointer-events', 'none')
      .text((d) => d.name.length > 12 ? d.name.substring(0, 12) + '...' : d.name)

    // Add node interactions
    nodes
      .on('click', (event, d) => {
        event.stopPropagation()
        onNodeSelect(selectedNode?.id === d.id ? null : d)
      })
      .on('mouseenter', (event, d) => {
        onNodeHover(d)
        setNodeDetails(d as SimulationNode)
        
        // Highlight connected nodes and links
        const connectedNodeIds = new Set(
          data.links
            .filter(l => l.source === d.id || l.target === d.id)
            .map(l => l.source === d.id ? l.target : l.source)
        )

        nodes.style('opacity', (node) => 
          node.id === d.id || connectedNodeIds.has(node.id) ? 1 : 0.3
        )
        
        links.style('opacity', (link) => 
          link.source === d.id || link.target === d.id ? 0.8 : 0.1
        )
      })
      .on('mouseleave', () => {
        onNodeHover(null)
        setNodeDetails(null)
        
        // Reset opacity
        nodes.style('opacity', 1)
        links.style('opacity', 0.6)
      })

    // Enable drag behavior
    const drag = d3.drag<SVGGElement, SimulationNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      })
      .on('drag', (event, d) => {
        d.fx = event.x
        d.fy = event.y
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
      })

    nodes.call(drag)

    // Update positions on simulation tick
    simulation.on('tick', () => {
      links
        .attr('x1', (d) => (d.source as SimulationNode).x!)
        .attr('y1', (d) => (d.source as SimulationNode).y!)
        .attr('x2', (d) => (d.target as SimulationNode).x!)
        .attr('y2', (d) => (d.target as SimulationNode).y!)

      nodes.attr('transform', (d) => `translate(${d.x},${d.y})`)
    })

    // Monitor simulation progress
    simulation.on('end', () => {
      setIsSimulating(false)
    })

    return () => {
      simulation.stop()
    }
  }, [data, width, height, getNodeColor, getNodeSize, getLinkColor, getLinkWidth, onNodeSelect, onNodeHover, selectedNode])

  const handleZoomIn = () => {
    const svg = d3.select(svgRef.current!)
    svg.transition().duration(300).call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy,
      1.5
    )
  }

  const handleZoomOut = () => {
    const svg = d3.select(svgRef.current!)
    svg.transition().duration(300).call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy,
      0.67
    )
  }

  const handleReset = () => {
    const svg = d3.select(svgRef.current!)
    svg.transition().duration(500).call(
      d3.zoom<SVGSVGElement, unknown>().transform,
      d3.zoomIdentity
    )
    onNodeSelect(null)
    onNodeHover(null)
  }

  const handleFitToScreen = () => {
    if (!data.nodes.length) return
    
    const svg = d3.select(svgRef.current!)
    const bounds = (svg.select('.nodes').node() as SVGGElement)?.getBBox()
    
    if (bounds) {
      const fullWidth = width
      const fullHeight = height
      const widthRatio = fullWidth / bounds.width
      const heightRatio = fullHeight / bounds.height
      const scale = Math.min(widthRatio, heightRatio) * 0.8
      
      const centerX = bounds.x + bounds.width / 2
      const centerY = bounds.y + bounds.height / 2
      const translateX = fullWidth / 2 - centerX * scale
      const translateY = fullHeight / 2 - centerY * scale
      
      svg.transition().duration(750).call(
        d3.zoom<SVGSVGElement, unknown>().transform,
        d3.zoomIdentity.translate(translateX, translateY).scale(scale)
      )
    }
  }

  const toggleSimulation = () => {
    if (simulationRef.current) {
      if (isSimulating) {
        simulationRef.current.stop()
        setIsSimulating(false)
      } else {
        simulationRef.current.alpha(0.3).restart()
        setIsSimulating(true)
      }
    }
  }

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'investor': return <Users className="h-3 w-3" />
      case 'firm': return <Building className="h-3 w-3" />
      case 'company': return <Building className="h-3 w-3" />
      case 'sector': return <Target className="h-3 w-3" />
      default: return <Users className="h-3 w-3" />
    }
  }

  return (
    <div className="relative w-full">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleFitToScreen}>
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={toggleSimulation}
            className="flex items-center space-x-1"
          >
            {isSimulating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span className="text-xs">{isSimulating ? 'Pause' : 'Resume'}</span>
          </Button>
        </div>
      </div>

      {/* Node Details Tooltip */}
      {nodeDetails && (
        <div className="absolute top-4 left-4 z-10 max-w-xs">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center space-x-2">
                {getNodeIcon(nodeDetails.type)}
                <span>{nodeDetails.name}</span>
                <Badge variant="secondary" className="text-xs">
                  Tier {nodeDetails.tier}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-xs">
                {nodeDetails.firm_name && (
                  <div className="flex items-center space-x-1">
                    <Building className="h-3 w-3 text-muted-foreground" />
                    <span>{nodeDetails.firm_name}</span>
                  </div>
                )}
                {nodeDetails.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span>{nodeDetails.location}</span>
                  </div>
                )}
                {nodeDetails.investment_count && (
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    <span>{nodeDetails.investment_count} investments</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SVG Network */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border rounded-lg bg-muted/10"
      />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="p-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Investors</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Firms</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>Companies</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>Sectors</span>
            </div>
          </div>
          <Separator className="my-2" />
          <div className="text-xs text-muted-foreground">
            Drag nodes • Zoom/Pan • Click to select
          </div>
        </Card>
      </div>

      {/* Network Stats */}
      <div className="absolute bottom-4 right-4 z-10">
        <Card className="p-3">
          <div className="text-xs space-y-1">
            <div>Nodes: {data.nodes.length}</div>
            <div>Connections: {data.links.length}</div>
            <div>Zoom: {(transform.k * 100).toFixed(0)}%</div>
            {isSimulating && (
              <div className="text-blue-500">Simulating...</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}