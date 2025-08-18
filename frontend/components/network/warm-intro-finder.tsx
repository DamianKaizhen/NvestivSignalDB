'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient, queryKeys, WarmIntroResponse, NetworkNode } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Search, 
  Users, 
  ArrowRight, 
  TrendingUp, 
  MessageSquare,
  Copy,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface WarmIntroFinderProps {
  networkData: {
    nodes: NetworkNode[]
    links: any[]
  }
  selectedNode?: NetworkNode | null
}

export function WarmIntroFinder({ networkData, selectedNode }: WarmIntroFinderProps) {
  const [sourceId, setSourceId] = useState<string>(selectedNode?.id || '')
  const [targetId, setTargetId] = useState<string>('')
  const [sourceQuery, setSourceQuery] = useState<string>(selectedNode?.name || '')
  const [targetQuery, setTargetQuery] = useState<string>('')
  const [showSourceSuggestions, setShowSourceSuggestions] = useState(false)
  const [showTargetSuggestions, setShowTargetSuggestions] = useState(false)
  const { toast } = useToast()

  // Filter nodes for search suggestions
  const sourceSuggestions = networkData.nodes.filter(node =>
    node.name.toLowerCase().includes(sourceQuery.toLowerCase()) && 
    node.type === 'investor'
  ).slice(0, 5)

  const targetSuggestions = networkData.nodes.filter(node =>
    node.name.toLowerCase().includes(targetQuery.toLowerCase()) && 
    node.type === 'investor' &&
    node.id !== sourceId
  ).slice(0, 5)

  // Fetch warm introduction paths
  const { 
    data: warmIntros, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: queryKeys.warmIntros(sourceId, targetId),
    queryFn: () => apiClient.getWarmIntroductions(sourceId, targetId),
    enabled: !!(sourceId && targetId && sourceId !== targetId),
  })

  const handleSourceSelect = (node: NetworkNode) => {
    setSourceId(node.id)
    setSourceQuery(node.name)
    setShowSourceSuggestions(false)
  }

  const handleTargetSelect = (node: NetworkNode) => {
    setTargetId(node.id)
    setTargetQuery(node.name)
    setShowTargetSuggestions(false)
  }

  const handleSearch = () => {
    if (!sourceId || !targetId) {
      toast({
        title: "Missing Selection",
        description: "Please select both source and target investors",
        variant: "destructive"
      })
      return
    }
    
    if (sourceId === targetId) {
      toast({
        title: "Invalid Selection",
        description: "Source and target investors must be different",
        variant: "destructive"
      })
      return
    }

    refetch()
  }

  const copyIntroduction = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Introduction text copied to clipboard",
    })
  }

  const getConnectionTypeColor = (type: string) => {
    switch (type) {
      case 'co_investment': return 'bg-green-100 text-green-800'
      case 'firm_colleague': return 'bg-blue-100 text-blue-800'
      case 'board_member': return 'bg-purple-100 text-purple-800'
      case 'investment': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStrengthColor = (strength: number) => {
    if (strength >= 0.8) return 'text-green-600'
    if (strength >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Warm Introduction Finder</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Source Investor Selection */}
          <div className="space-y-2">
            <Label htmlFor="source">From (Source Investor)</Label>
            <div className="relative">
              <Input
                id="source"
                placeholder="Search for source investor..."
                value={sourceQuery}
                onChange={(e) => {
                  setSourceQuery(e.target.value)
                  setShowSourceSuggestions(true)
                }}
                onFocus={() => setShowSourceSuggestions(true)}
                className="pr-10"
              />
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              
              {showSourceSuggestions && sourceSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {sourceSuggestions.map((node) => (
                    <div
                      key={node.id}
                      className="p-2 hover:bg-accent cursor-pointer flex items-center justify-between"
                      onClick={() => handleSourceSelect(node)}
                    >
                      <div>
                        <div className="font-medium">{node.name}</div>
                        <div className="text-xs text-muted-foreground">{node.firm_name}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Tier {node.tier}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Target Investor Selection */}
          <div className="space-y-2">
            <Label htmlFor="target">To (Target Investor)</Label>
            <div className="relative">
              <Input
                id="target"
                placeholder="Search for target investor..."
                value={targetQuery}
                onChange={(e) => {
                  setTargetQuery(e.target.value)
                  setShowTargetSuggestions(true)
                }}
                onFocus={() => setShowTargetSuggestions(true)}
                className="pr-10"
              />
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              
              {showTargetSuggestions && targetSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {targetSuggestions.map((node) => (
                    <div
                      key={node.id}
                      className="p-2 hover:bg-accent cursor-pointer flex items-center justify-between"
                      onClick={() => handleTargetSelect(node)}
                    >
                      <div>
                        <div className="font-medium">{node.name}</div>
                        <div className="text-xs text-muted-foreground">{node.firm_name}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Tier {node.tier}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Button 
            onClick={handleSearch} 
            disabled={!sourceId || !targetId || isLoading}
            className="w-full"
          >
            {isLoading ? 'Finding Paths...' : 'Find Warm Introduction'}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to find warm introduction paths. This might be because there are no connections between these investors.
          </AlertDescription>
        </Alert>
      )}

      {warmIntros && (
        <div className="space-y-4">
          {/* Best Path Highlight */}
          {warmIntros.best_path && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span>Best Introduction Path</span>
                  <Badge variant="outline" className="bg-white">
                    {warmIntros.best_path.hops} hop{warmIntros.best_path.hops !== 1 ? 's' : ''}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Path Visualization */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                  {warmIntros.best_path.path.map((node, index) => (
                    <div key={node.id} className="flex items-center space-x-2 flex-shrink-0">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-white border-2 border-green-500 flex items-center justify-center">
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="text-xs font-medium mt-1 max-w-20 truncate">
                          {node.name}
                        </div>
                        {node.firm_name && (
                          <div className="text-xs text-muted-foreground max-w-20 truncate">
                            {node.firm_name}
                          </div>
                        )}
                      </div>
                      {index < warmIntros.best_path.path.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Connection Details */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Connection Details:</div>
                  {warmIntros.best_path.connections.map((connection, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="outline" 
                          className={getConnectionTypeColor(connection.type)}
                        >
                          {connection.type.replace('_', ' ')}
                        </Badge>
                        <span className={`text-sm font-medium ${getStrengthColor(connection.strength)}`}>
                          {(connection.strength * 100).toFixed(0)}% strength
                        </span>
                      </div>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>

                {/* Introduction Text */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Suggested Introduction:</div>
                  <div className="p-3 bg-white rounded border text-sm">
                    {warmIntros.best_path.introduction_text}
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => copyIntroduction(warmIntros.best_path!.introduction_text)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button size="sm" variant="outline">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Draft Email
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Paths */}
          {warmIntros.paths.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="h-5 w-5" />
                  <span>Alternative Paths ({warmIntros.paths.length - 1})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {warmIntros.paths
                  .filter(path => path !== warmIntros.best_path)
                  .map((path, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {path.hops} hop{path.hops !== 1 ? 's' : ''}
                          </Badge>
                          <span className={`text-sm font-medium ${getStrengthColor(path.strength)}`}>
                            {(path.strength * 100).toFixed(0)}% strength
                          </span>
                        </div>
                        <Button size="sm" variant="ghost">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center space-x-2 overflow-x-auto">
                        {path.path.map((node, nodeIndex) => (
                          <div key={node.id} className="flex items-center space-x-2 flex-shrink-0">
                            <div className="text-center">
                              <div className="text-xs font-medium max-w-16 truncate">
                                {node.name}
                              </div>
                              {node.firm_name && (
                                <div className="text-xs text-muted-foreground max-w-16 truncate">
                                  {node.firm_name}
                                </div>
                              )}
                            </div>
                            {nodeIndex < path.path.length - 1 && (
                              <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          {/* No Paths Found */}
          {warmIntros.paths.length === 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No warm introduction paths found between these investors. They may not be connected through the current network data.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  )
}