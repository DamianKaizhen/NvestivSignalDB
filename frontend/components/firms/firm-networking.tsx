'use client'

import { Building, Users, Network, TrendingUp, ArrowRight, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatNumber } from '@/lib/utils'
import type { FirmDetail } from '@/lib/api'
import Link from 'next/link'

interface FirmNetworkingProps {
  firm: FirmDetail
}

export function FirmNetworking({ firm }: FirmNetworkingProps) {
  // Mock data for networking features (would be fetched from API in real implementation)
  const relatedFirms = [
    { id: '2', name: 'Sequoia Capital', sharedPortfolio: 15, coInvestments: 8, type: 'co-investor' },
    { id: '3', name: 'Andreessen Horowitz', sharedPortfolio: 12, coInvestments: 6, type: 'co-investor' },
    { id: '4', name: 'Greylock Partners', sharedPortfolio: 9, coInvestments: 4, type: 'co-investor' },
    { id: '5', name: 'Kleiner Perkins', sharedPortfolio: 7, coInvestments: 3, type: 'co-investor' },
  ]

  const alumniFirms = [
    { id: '6', name: 'Goldman Sachs', alumni: 8, type: 'alumni' },
    { id: '7', name: 'McKinsey & Company', alumni: 6, type: 'alumni' },
    { id: '8', name: 'Bain & Company', alumni: 5, type: 'alumni' },
  ]

  const networkStats = {
    totalConnections: firm.investors?.reduce((sum, inv) => sum + (inv.network_connections || 0), 0) || 0,
    averageConnections: firm.investor_count ? Math.round((firm.investors?.reduce((sum, inv) => sum + (inv.network_connections || 0), 0) || 0) / firm.investor_count) : 0,
    linkedInPenetration: firm.investors ? Math.round((firm.investors.filter(inv => inv.linkedin_url).length / firm.investors.length) * 100) : 0,
    networkTiers: {
      highly_connected: firm.investors?.filter(inv => (inv.network_connections || 0) >= 500).length || 0,
      well_connected: firm.investors?.filter(inv => (inv.network_connections || 0) >= 100 && (inv.network_connections || 0) < 500).length || 0,
      limited_network: firm.investors?.filter(inv => (inv.network_connections || 0) < 100).length || 0,
    },
  }

  return (
    <div className="space-y-6">
      {/* Network Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Network className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{formatNumber(networkStats.totalConnections)}</div>
            <div className="text-sm text-muted-foreground">Total Connections</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{formatNumber(networkStats.averageConnections)}</div>
            <div className="text-sm text-muted-foreground">Avg per Investor</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <ExternalLink className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{networkStats.linkedInPenetration}%</div>
            <div className="text-sm text-muted-foreground">LinkedIn Coverage</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{networkStats.networkTiers.highly_connected}</div>
            <div className="text-sm text-muted-foreground">Super Connected</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Co-Investment Partners */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Co-Investment Partners</span>
            </CardTitle>
            <CardDescription>
              Firms that frequently co-invest with {firm.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {relatedFirms.map((relatedFirm) => (
                <div key={relatedFirm.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <h4 className="font-medium">{relatedFirm.name}</h4>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                      <span>{relatedFirm.sharedPortfolio} shared portfolio companies</span>
                      <span>{relatedFirm.coInvestments} co-investments</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">Co-investor</Badge>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/firms/${relatedFirm.id}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alumni Networks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Alumni Networks</span>
            </CardTitle>
            <CardDescription>
              Organizations with alumni now at {firm.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alumniFirms.map((alumniSource) => (
                <div key={alumniSource.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <h4 className="font-medium">{alumniSource.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {alumniSource.alumni} team members from this organization
                    </p>
                  </div>
                  <Badge variant="outline">Alumni Source</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Network Composition */}
        <Card>
          <CardHeader>
            <CardTitle>Network Composition</CardTitle>
            <CardDescription>
              Distribution of network connectivity across the team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Highly Connected (500+)</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{networkStats.networkTiers.highly_connected}</span>
                  <div className="w-16 h-2 bg-muted rounded-full">
                    <div 
                      className="h-2 bg-green-500 rounded-full" 
                      style={{ width: `${(networkStats.networkTiers.highly_connected / (firm.investor_count || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Well Connected (100-500)</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{networkStats.networkTiers.well_connected}</span>
                  <div className="w-16 h-2 bg-muted rounded-full">
                    <div 
                      className="h-2 bg-yellow-500 rounded-full" 
                      style={{ width: `${(networkStats.networkTiers.well_connected / (firm.investor_count || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Limited Network (<100)</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{networkStats.networkTiers.limited_network}</span>
                  <div className="w-16 h-2 bg-muted rounded-full">
                    <div 
                      className="h-2 bg-red-500 rounded-full" 
                      style={{ width: `${(networkStats.networkTiers.limited_network / (firm.investor_count || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Network Insights</CardTitle>
            <CardDescription>
              Strategic networking recommendations for {firm.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">Network Strengths</h4>
                <ul className="text-sm space-y-1">
                  {networkStats.networkTiers.highly_connected >= 5 && <li>• Strong core of highly connected investors</li>}
                  {networkStats.linkedInPenetration >= 80 && <li>• Excellent LinkedIn coverage</li>}
                  {networkStats.averageConnections >= 300 && <li>• Above-average network reach</li>}
                  {networkStats.totalConnections >= 1000 && <li>• Substantial collective network</li>}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-orange-600">Opportunities</h4>
                <ul className="text-sm space-y-1">
                  {networkStats.linkedInPenetration < 80 && <li>• Improve LinkedIn profile completion</li>}
                  {networkStats.networkTiers.limited_network > (firm.investor_count || 0) * 0.3 && <li>• Enhance junior team connectivity</li>}
                  <li>• Strengthen alumni network connections</li>
                  <li>• Build relationships with co-investors</li>
                </ul>
              </div>

              <div className="pt-4">
                <Button variant="outline" className="w-full">
                  <Network className="h-4 w-4 mr-2" />
                  View Network Visualization
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}