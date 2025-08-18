'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Network, 
  Users, 
  MapPin, 
  Building, 
  TrendingUp, 
  Search,
  Zap,
  UserPlus,
  ExternalLink,
  ArrowRight,
  Star
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { apiClient, queryKeys, Investor } from '@/lib/api'
import { formatNumber } from '@/lib/utils'

interface InvestorConnectionsProps {
  investor: Investor
}

export function InvestorConnections({ investor }: InvestorConnectionsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  
  // Mock data for network connections (replace with real API calls)
  const mockConnections = [
    {
      id: '1',
      name: 'Sarah Chen',
      title: 'Partner',
      company: 'Sequoia Capital',
      mutualConnections: 12,
      connectionStrength: 'Strong',
      recentActivity: 'Co-invested in 3 companies',
      avatar: 'SC'
    },
    {
      id: '2', 
      name: 'David Rodriguez',
      title: 'Managing Director',
      company: 'Andreessen Horowitz',
      mutualConnections: 8,
      connectionStrength: 'Medium',
      recentActivity: 'Board member at 2 shared companies',
      avatar: 'DR'
    },
    {
      id: '3',
      name: 'Emma Thompson',
      title: 'Principal',
      company: 'Kleiner Perkins',
      mutualConnections: 15,
      connectionStrength: 'Strong',
      recentActivity: 'Frequent co-investor',
      avatar: 'ET'
    }
  ]

  const mockMutualConnections = [
    {
      id: '1',
      name: 'Michael Johnson',
      title: 'CEO',
      company: 'TechStart Inc',
      relationship: 'Portfolio Company CEO',
      avatar: 'MJ'
    },
    {
      id: '2',
      name: 'Lisa Wang',
      title: 'Angel Investor',
      company: 'Independent',
      relationship: 'Co-investor',
      avatar: 'LW'
    }
  ]

  const filteredConnections = mockConnections.filter(connection =>
    connection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    connection.company.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getConnectionStrengthColor = (strength: string) => {
    switch (strength) {
      case 'Strong': return 'bg-green-500'
      case 'Medium': return 'bg-yellow-500'
      case 'Weak': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Network Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Direct Connections</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockConnections.length}</div>
            <p className="text-xs text-muted-foreground">
              Active network members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mutual Connections</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMutualConnections.length}</div>
            <p className="text-xs text-muted-foreground">
              Shared network members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.7</div>
            <p className="text-xs text-muted-foreground">
              Connection influence
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Search Connections</CardTitle>
          <CardDescription>Find specific connections and mutual contacts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Direct Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Direct Connections</span>
          </CardTitle>
          <CardDescription>Investors directly connected to {investor.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredConnections.map((connection) => (
              <div key={connection.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {connection.avatar}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-semibold">{connection.name}</h4>
                    <div className={`h-2 w-2 rounded-full ${getConnectionStrengthColor(connection.connectionStrength)}`}></div>
                    <Badge variant="outline" className="text-xs">
                      {connection.connectionStrength}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {connection.title} at {connection.company}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {connection.mutualConnections} mutual connections • {connection.recentActivity}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mutual Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Network className="h-5 w-5" />
            <span>Mutual Connections</span>
          </CardTitle>
          <CardDescription>People in both your network and {investor.name}'s network</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockMutualConnections.map((connection) => (
              <div key={connection.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    {connection.avatar}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold mb-1">{connection.name}</h4>
                  <p className="text-sm text-muted-foreground mb-1">
                    {connection.title} at {connection.company}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {connection.relationship}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Zap className="h-4 w-4 mr-2" />
                    Request Intro
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Warm Introduction Paths */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Warm Introduction Paths</span>
          </CardTitle>
          <CardDescription>Suggested paths for getting an introduction</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="secondary">Recommended</Badge>
                <span className="text-sm font-medium">2-hop introduction</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span>You</span>
                <ArrowRight className="h-4 w-4" />
                <span className="font-medium">Lisa Wang</span>
                <ArrowRight className="h-4 w-4" />
                <span className="font-medium">{investor.name}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Lisa Wang has co-invested with {investor.name} on 3 occasions and knows them well.
              </p>
              <Button variant="outline" size="sm" className="mt-3">
                <Zap className="h-4 w-4 mr-2" />
                Request Introduction
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Network Insights</CardTitle>
          <CardDescription>Analysis of {investor.name}'s network patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Most Connected Sector</p>
                <p className="text-sm text-muted-foreground">Enterprise Software</p>
              </div>
              <Badge variant="secondary">47%</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Primary Geography</p>
                <p className="text-sm text-muted-foreground">San Francisco Bay Area</p>
              </div>
              <Badge variant="secondary">62%</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Network Growth Rate</p>
                <p className="text-sm text-muted-foreground">Last 12 months</p>
              </div>
              <Badge variant="secondary">+23%</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}