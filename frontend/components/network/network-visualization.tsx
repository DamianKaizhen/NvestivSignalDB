'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

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

interface NetworkVisualizationProps {
  data: {
    nodes: NetworkNode[]
    links: NetworkLink[]
  }
  filters: {
    minConnections: number
    sector: string
    location: string
  }
  onNodeSelect: (node: NetworkNode | null) => void
  selectedNode: NetworkNode | null
}

export function NetworkVisualization({ 
  data, 
  filters, 
  onNodeSelect, 
  selectedNode 
}: NetworkVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Simple layout algorithm - circular positioning
  const layoutNodes = (nodes: NetworkNode[]) => {
    const width = 600
    const height = 400
    const centerX = width / 2
    const centerY = height / 2
    
    return nodes.map((node, index) => {
      let x, y, radius
      
      if (node.type === 'sector') {
        // Place sectors in the center
        radius = 50
        const angle = (index * 2 * Math.PI) / nodes.filter(n => n.type === 'sector').length
        x = centerX + Math.cos(angle) * radius
        y = centerY + Math.sin(angle) * radius
      } else if (node.type === 'investor') {
        // Place investors in outer ring
        radius = 150
        const investorNodes = nodes.filter(n => n.type === 'investor')
        const investorIndex = investorNodes.findIndex(n => n.id === node.id)
        const angle = (investorIndex * 2 * Math.PI) / investorNodes.length
        x = centerX + Math.cos(angle) * radius
        y = centerY + Math.sin(angle) * radius
      } else {
        // Place companies in middle ring
        radius = 100
        const companyNodes = nodes.filter(n => n.type === 'company')
        const companyIndex = companyNodes.findIndex(n => n.id === node.id)
        const angle = (companyIndex * 2 * Math.PI) / companyNodes.length
        x = centerX + Math.cos(angle) * radius
        y = centerY + Math.sin(angle) * radius
      }
      
      return { ...node, x, y }
    })
  }

  const layoutData = {
    nodes: layoutNodes(data.nodes),
    links: data.links
  }

  const getNodeColor = (node: NetworkNode) => {
    if (selectedNode?.id === node.id) return '#ef4444' // red for selected
    switch (node.type) {
      case 'investor': return '#3b82f6' // blue
      case 'company': return '#10b981' // green
      case 'sector': return '#8b5cf6' // purple
      default: return '#6b7280' // gray
    }
  }

  const getNodeSize = (node: NetworkNode) => {
    const baseSize = 8
    const sizeMultiplier = Math.log(node.value + 1) * 2
    return Math.max(baseSize, Math.min(baseSize + sizeMultiplier, 20))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.3))
  }

  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    onNodeSelect(null)
  }

  const handleNodeClick = (node: NetworkNode) => {
    onNodeSelect(selectedNode?.id === node.id ? null : node)
  }

  return (
    <div className="relative w-full h-96 border rounded-lg overflow-hidden bg-muted/20">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <Button size="sm" variant="outline" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={handleReset}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* SVG Network */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Links */}
          {layoutData.links.map((link, index) => {
            const sourceNode = layoutData.nodes.find(n => n.id === link.source)
            const targetNode = layoutData.nodes.find(n => n.id === link.target)
            
            if (!sourceNode || !targetNode) return null
            
            return (
              <line
                key={index}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke="#6b7280"
                strokeWidth={Math.max(1, link.value / 3)}
                strokeOpacity={0.6}
              />
            )
          })}
          
          {/* Nodes */}
          {layoutData.nodes.map((node) => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={getNodeSize(node)}
                fill={getNodeColor(node)}
                stroke={selectedNode?.id === node.id ? '#000' : '#fff'}
                strokeWidth={selectedNode?.id === node.id ? 2 : 1}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleNodeClick(node)
                }}
              />
              <text
                x={node.x}
                y={node.y - getNodeSize(node) - 5}
                textAnchor="middle"
                fontSize="12"
                fill="currentColor"
                className="pointer-events-none select-none"
              >
                {node.name.length > 15 ? node.name.substring(0, 15) + '...' : node.name}
              </text>
            </g>
          ))}
        </g>
      </svg>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-background/90 p-2 rounded">
        Drag to pan • Click nodes to select • Use controls to zoom
      </div>
    </div>
  )
}