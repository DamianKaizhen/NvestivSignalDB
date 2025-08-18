'use client'

import { useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Brain, 
  Zap, 
  Star, 
  Target,
  Users,
  Globe,
  Calendar,
  Award,
  Lightbulb,
  AlertCircle,
  ChevronRight,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { Investor } from '@/lib/api'

interface InvestorAnalysisProps {
  investor: Investor
}

interface AnalysisMetric {
  label: string
  value: number
  max: number
  description: string
  trend: 'up' | 'down' | 'stable'
}

interface Insight {
  id: string
  type: 'opportunity' | 'pattern' | 'warning' | 'recommendation'
  title: string
  description: string
  confidence: number
  actionable: boolean
}

export function InvestorAnalysis({ investor }: InvestorAnalysisProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>('influence')

  // Mock analysis data (replace with real API calls)
  const networkMetrics: AnalysisMetric[] = [
    {
      label: 'Network Influence',
      value: 87,
      max: 100,
      description: 'Overall influence within the venture capital ecosystem',
      trend: 'up'
    },
    {
      label: 'Deal Flow Quality', 
      value: 73,
      max: 100,
      description: 'Quality and exclusivity of investment opportunities',
      trend: 'up'
    },
    {
      label: 'Portfolio Performance',
      value: 69,
      max: 100,
      description: 'Historical returns and exit success rate',
      trend: 'stable'
    },
    {
      label: 'Market Timing',
      value: 82,
      max: 100,
      description: 'Ability to identify market trends and time investments',
      trend: 'up'
    }
  ]

  const insights: Insight[] = [
    {
      id: '1',
      type: 'opportunity',
      title: 'Strong Enterprise Software Focus',
      description: 'Has 65% portfolio allocation in enterprise software with above-average returns. Consider pitching B2B SaaS companies.',
      confidence: 92,
      actionable: true
    },
    {
      id: '2',
      type: 'pattern',
      title: 'Series B Specialist',
      description: 'Historically leads or co-leads 78% of Series B rounds. Most active in $10M-$25M range.',
      confidence: 88,
      actionable: true
    },
    {
      id: '3',
      type: 'recommendation',
      title: 'West Coast Geographic Preference',
      description: 'Shows strong bias toward San Francisco and Seattle companies. Remote-first companies may face additional scrutiny.',
      confidence: 75,
      actionable: true
    },
    {
      id: '4',
      type: 'warning',
      title: 'Declining Activity in Q3',
      description: 'Investment pace has slowed 40% compared to previous quarters. May be more selective or capacity constrained.',
      confidence: 67,
      actionable: false
    }
  ]

  const competitiveAnalysis = [
    {
      name: 'Sarah Chen (Sequoia)',
      similarity: 89,
      overlap: 12,
      strength: 'AI/ML investments',
      differentiation: 'Later stage focus'
    },
    {
      name: 'David Rodriguez (a16z)',
      similarity: 76,
      overlap: 8,
      strength: 'Developer tools',
      differentiation: 'Open source emphasis'
    },
    {
      name: 'Emma Thompson (Kleiner)',
      similarity: 82,
      overlap: 15,
      strength: 'Healthcare tech',
      differentiation: 'Regulatory expertise'
    }
  ]

  const marketTrends = [
    {
      trend: 'AI/ML Integration',
      relevance: 95,
      participation: 78,
      description: 'Strong positioning in AI-enabled enterprise software'
    },
    {
      trend: 'Remote Work Tools',
      relevance: 87,
      participation: 45,
      description: 'Underweight compared to market opportunity'
    },
    {
      trend: 'Climate Tech',
      relevance: 72,
      participation: 23,
      description: 'Limited exposure to growing climate technology sector'
    }
  ]

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Target className="h-4 w-4 text-green-500" />
      case 'pattern': return <BarChart3 className="h-4 w-4 text-blue-500" />
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'recommendation': return <Lightbulb className="h-4 w-4 text-purple-500" />
      default: return <Brain className="h-4 w-4" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />
      case 'down': return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
      default: return <Activity className="h-3 w-3 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* AI-Generated Summary */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary" />
            <span>AI Analysis Summary</span>
          </CardTitle>
          <CardDescription>
            Generated insights based on {investor.name}'s investment patterns and network analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-foreground leading-relaxed">
              <strong>{investor.name}</strong> is a {investor.years_active ? `${investor.years_active}-year` : 'experienced'} veteran 
              with strong positioning in enterprise software investments. Network analysis reveals high influence in the Bay Area ecosystem 
              with particular strength in Series B rounds. Recent activity suggests selectivity around AI-enabled B2B companies with 
              proven product-market fit.
            </p>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                <Star className="h-3 w-3 mr-1" />
                Top 15% Network Influence
              </Badge>
              <Badge variant="outline">
                <Target className="h-3 w-3 mr-1" />
                Series B Specialist
              </Badge>
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />
                Enterprise Focused
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Tabs */}
      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="competitive">Competitive Analysis</TabsTrigger>
          <TabsTrigger value="trends">Market Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Network Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators and scoring</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {networkMetrics.map((metric, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{metric.label}</span>
                        {getTrendIcon(metric.trend)}
                      </div>
                      <span className="text-sm font-mono">{metric.value}/100</span>
                    </div>
                    <Progress value={metric.value} className="h-2" />
                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Investment Pattern Analysis</CardTitle>
                <CardDescription>Statistical analysis of investment behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Average Check Size</p>
                      <p className="text-sm text-muted-foreground">Median investment amount</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(investor.average_check_size || 2500000)}</p>
                      <p className="text-xs text-muted-foreground">+15% vs peers</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Investment Velocity</p>
                      <p className="text-sm text-muted-foreground">Deals per quarter</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">3.2</p>
                      <p className="text-xs text-muted-foreground">Above average</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Follow-on Rate</p>
                      <p className="text-sm text-muted-foreground">Participates in next round</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">67%</p>
                      <p className="text-xs text-muted-foreground">High conviction</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Portfolio Diversity</p>
                      <p className="text-sm text-muted-foreground">Sector concentration</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Medium</p>
                      <p className="text-xs text-muted-foreground">3 primary sectors</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Benchmark Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Peer Benchmark Comparison</CardTitle>
              <CardDescription>Performance vs similar tier investors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">Top 15%</div>
                  <p className="text-sm text-muted-foreground">Network Influence Ranking</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">Above Average</div>
                  <p className="text-sm text-muted-foreground">Portfolio Performance</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">High</div>
                  <p className="text-sm text-muted-foreground">Deal Flow Quality</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* AI-Generated Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>AI-Generated Insights</span>
              </CardTitle>
              <CardDescription>
                Machine learning analysis of {investor.name}'s behavior patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.map((insight) => (
                  <div key={insight.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start space-x-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold">{insight.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {insight.confidence}% confidence
                          </Badge>
                          {insight.actionable && (
                            <Badge variant="secondary" className="text-xs">
                              Actionable
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                        {insight.actionable && (
                          <Button variant="outline" size="sm">
                            <ChevronRight className="h-4 w-4 mr-2" />
                            View Recommendations
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Investment Scoring */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Probability Scoring</CardTitle>
              <CardDescription>AI prediction of investment likelihood for different company profiles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">B2B SaaS (Series B, $15M)</p>
                    <p className="text-sm text-muted-foreground">AI-powered analytics platform</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="default">87%</Badge>
                    <p className="text-xs text-muted-foreground mt-1">High match</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">FinTech (Series A, $8M)</p>
                    <p className="text-sm text-muted-foreground">Payment processing startup</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">64%</Badge>
                    <p className="text-xs text-muted-foreground mt-1">Medium match</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Consumer App (Seed, $2M)</p>
                    <p className="text-sm text-muted-foreground">Social media platform</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">23%</Badge>
                    <p className="text-xs text-muted-foreground mt-1">Low match</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitive" className="space-y-6">
          {/* Competitive Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Similar Investor Profiles</CardTitle>
              <CardDescription>Investors with similar investment patterns and focus areas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {competitiveAnalysis.map((comp, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{comp.name}</h4>
                      <Badge variant="outline">{comp.similarity}% similar</Badge>
                    </div>
                    
                    <div className="grid gap-3 md:grid-cols-3">
                      <div>
                        <p className="text-sm font-medium">Portfolio Overlap</p>
                        <p className="text-xs text-muted-foreground">{comp.overlap} shared companies</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Shared Strength</p>
                        <p className="text-xs text-muted-foreground">{comp.strength}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Key Difference</p>
                        <p className="text-xs text-muted-foreground">{comp.differentiation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Market Position */}
          <Card>
            <CardHeader>
              <CardTitle>Market Position Analysis</CardTitle>
              <CardDescription>Competitive positioning within the venture capital landscape</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Competitive Advantages</h4>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center space-x-2">
                      <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
                      <span>Strong enterprise software network</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
                      <span>Proven Series B expertise</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
                      <span>High-quality deal flow</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Areas for Growth</h4>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center space-x-2">
                      <div className="h-1.5 w-1.5 bg-yellow-500 rounded-full"></div>
                      <span>Limited climate tech exposure</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="h-1.5 w-1.5 bg-yellow-500 rounded-full"></div>
                      <span>Geographic concentration risk</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="h-1.5 w-1.5 bg-yellow-500 rounded-full"></div>
                      <span>Consumer market underweight</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Market Trends Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Market Trends Alignment</CardTitle>
              <CardDescription>How {investor.name}'s portfolio aligns with current market trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {marketTrends.map((trend, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{trend.trend}</h4>
                      <Badge variant={trend.participation >= 70 ? 'default' : trend.participation >= 40 ? 'secondary' : 'outline'}>
                        {trend.participation}% participation
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Market Relevance</span>
                        <span>{trend.relevance}%</span>
                      </div>
                      <Progress value={trend.relevance} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Portfolio Participation</span>
                        <span>{trend.participation}%</span>
                      </div>
                      <Progress value={trend.participation} className="h-2" />
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{trend.description}</p>
                    
                    {index < marketTrends.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Future Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle>Emerging Opportunities</CardTitle>
              <CardDescription>AI-identified investment opportunities based on market analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="h-4 w-4 text-green-600" />
                    <h4 className="font-semibold text-green-900">High Opportunity</h4>
                  </div>
                  <p className="text-sm text-green-800 mb-2">AI Infrastructure & Developer Tools</p>
                  <p className="text-xs text-green-700">Strong alignment with existing portfolio and emerging market needs</p>
                </div>

                <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">Medium Opportunity</h4>
                  </div>
                  <p className="text-sm text-blue-800 mb-2">Cybersecurity & Data Privacy</p>
                  <p className="text-xs text-blue-700">Growing market with moderate portfolio representation</p>
                </div>

                <div className="p-4 border rounded-lg bg-orange-50 border-orange-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Globe className="h-4 w-4 text-orange-600" />
                    <h4 className="font-semibold text-orange-900">Emerging Opportunity</h4>
                  </div>
                  <p className="text-sm text-orange-800 mb-2">Sustainable Technology</p>
                  <p className="text-xs text-orange-700">Early-stage market with significant long-term potential</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}