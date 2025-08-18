'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Building, 
  Target, 
  HelpCircle,
  Info,
  Zap,
  Link as LinkIcon,
  Eye
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface NetworkLegendProps {
  showCompact?: boolean
}

const NODE_LEGEND = [
  {
    type: 'investor',
    color: 'bg-blue-500',
    icon: <Users className="h-3 w-3" />,
    label: 'Investors',
    description: 'Individual investors and venture capitalists'
  },
  {
    type: 'firm',
    color: 'bg-green-500',
    icon: <Building className="h-3 w-3" />,
    label: 'Firms',
    description: 'Investment firms and venture capital companies'
  },
  {
    type: 'company',
    color: 'bg-purple-500',
    icon: <Building className="h-3 w-3" />,
    label: 'Companies',
    description: 'Portfolio companies and startups'
  },
  {
    type: 'sector',
    color: 'bg-orange-500',
    icon: <Target className="h-3 w-3" />,
    label: 'Sectors',
    description: 'Industry sectors and categories'
  }
]

const CONNECTION_LEGEND = [
  {
    type: 'investment',
    color: 'border-blue-500',
    width: 'border-2',
    label: 'Investments',
    description: 'Direct investment relationships'
  },
  {
    type: 'co_investment',
    color: 'border-green-500',
    width: 'border-2',
    label: 'Co-investments',
    description: 'Joint investments in the same company'
  },
  {
    type: 'firm_colleague',
    color: 'border-purple-500',
    width: 'border-2',
    label: 'Firm Colleagues',
    description: 'Working at the same investment firm'
  },
  {
    type: 'board_member',
    color: 'border-orange-500',
    width: 'border-2',
    label: 'Board Members',
    description: 'Serving on the same company board'
  },
  {
    type: 'sector',
    color: 'border-gray-400',
    width: 'border',
    label: 'Sector',
    description: 'Shared industry focus or sector involvement'
  }
]

const TIER_LEGEND = [
  {
    tier: 1,
    label: 'Tier 1',
    description: 'Top-tier investors with highest connectivity and influence',
    color: 'text-green-600',
    size: 'Large'
  },
  {
    tier: 2,
    label: 'Tier 2',
    description: 'Well-connected investors with significant network presence',
    color: 'text-yellow-600',
    size: 'Medium'
  },
  {
    tier: 3,
    label: 'Tier 3',
    description: 'Emerging investors or those with smaller networks',
    color: 'text-gray-600',
    size: 'Small'
  }
]

const INTERACTION_GUIDE = [
  {
    action: 'Click',
    description: 'Select a node to view details and connections'
  },
  {
    action: 'Hover',
    description: 'Preview node information and highlight connections'
  },
  {
    action: 'Drag',
    description: 'Move nodes to reorganize the network layout'
  },
  {
    action: 'Zoom',
    description: 'Use mouse wheel or controls to zoom in/out'
  },
  {
    action: 'Pan',
    description: 'Drag the background to pan around the network'
  }
]

export function NetworkLegend({ showCompact = false }: NetworkLegendProps) {
  if (showCompact) {
    return (
      <Card className="w-fit">
        <CardContent className="p-3">
          <div className="flex items-center space-x-4">
            {/* Node Types */}
            <div className="flex items-center space-x-2">
              {NODE_LEGEND.map((node) => (
                <div key={node.type} className="flex items-center space-x-1">
                  <div className={`w-3 h-3 rounded-full ${node.color}`} />
                  <span className="text-xs">{node.label}</span>
                </div>
              ))}
            </div>
            
            <Separator orientation="vertical" className="h-4" />
            
            {/* Help Button */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Network Visualization Guide</DialogTitle>
                </DialogHeader>
                <NetworkLegend showCompact={false} />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Node Types */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Node Types</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {NODE_LEGEND.map((node) => (
            <div key={node.type} className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${node.color} flex items-center justify-center`}>
                <div className="text-white">
                  {node.icon}
                </div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{node.label}</div>
                <div className="text-xs text-muted-foreground">{node.description}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Connection Types */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center space-x-2">
            <LinkIcon className="h-4 w-4" />
            <span>Connection Types</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {CONNECTION_LEGEND.map((connection) => (
            <div key={connection.type} className="flex items-center space-x-3">
              <div className={`w-8 h-1 ${connection.color} ${connection.width} rounded`} />
              <div className="flex-1">
                <div className="text-sm font-medium">{connection.label}</div>
                <div className="text-xs text-muted-foreground">{connection.description}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Network Tiers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Network Tiers</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {TIER_LEGEND.map((tier) => (
            <div key={tier.tier} className="flex items-center space-x-3">
              <Badge variant="outline" className={tier.color}>
                Tier {tier.tier}
              </Badge>
              <div className="flex-1">
                <div className="text-sm font-medium flex items-center space-x-2">
                  <span>{tier.label}</span>
                  <span className="text-xs text-muted-foreground">({tier.size})</span>
                </div>
                <div className="text-xs text-muted-foreground">{tier.description}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Interaction Guide */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Interactions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {INTERACTION_GUIDE.map((interaction, index) => (
            <div key={index} className="flex items-start space-x-3">
              <Badge variant="outline" className="text-xs font-mono mt-0.5">
                {interaction.action}
              </Badge>
              <div className="text-xs text-muted-foreground flex-1">
                {interaction.description}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Additional Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2 text-blue-800">
            <Info className="h-4 w-4" />
            <span>Pro Tips</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-blue-700 space-y-1">
          <div>• Larger nodes have more connections or higher investment activity</div>
          <div>• Thicker connections indicate stronger relationships</div>
          <div>• Use filters to focus on specific sectors or investor types</div>
          <div>• The warm introduction finder shows connection paths between investors</div>
          <div>• Click "Fit to Screen" to center and scale the entire network</div>
        </CardContent>
      </Card>
    </div>
  )
}