'use client'

import { useState } from 'react'
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Building, 
  Users, 
  Star,
  Filter,
  Search,
  ArrowUpRight,
  Briefcase,
  Target,
  Award,
  BarChart3
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Investor } from '@/lib/api'

interface InvestorInvestmentsProps {
  investor: Investor
}

interface Investment {
  id: string
  company: string
  sector: string
  stage: string
  amount: number
  date: string
  status: 'Active' | 'Exited' | 'IPO'
  coInvestors: string[]
  description: string
  valuation?: number
  exitMultiple?: number
}

export function InvestorInvestments({ investor }: InvestorInvestmentsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStage, setSelectedStage] = useState<string>('all')
  const [selectedSector, setSelectedSector] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // Mock investment data (replace with real API calls)
  const mockInvestments: Investment[] = [
    {
      id: '1',
      company: 'DataFlow Analytics',
      sector: 'Enterprise Software',
      stage: 'Series B',
      amount: 5000000,
      date: '2024-03-15',
      status: 'Active',
      coInvestors: ['Sequoia Capital', 'Andreessen Horowitz'],
      description: 'AI-powered business intelligence platform',
      valuation: 150000000
    },
    {
      id: '2',
      company: 'HealthTech Solutions',
      sector: 'Healthcare',
      stage: 'Series A',
      amount: 2500000,
      date: '2023-11-20',
      status: 'Active',
      coInvestors: ['Kleiner Perkins', 'GV'],
      description: 'Telemedicine platform for rural communities',
      valuation: 50000000
    },
    {
      id: '3',
      company: 'FinanceFlow',
      sector: 'FinTech',
      stage: 'Seed',
      amount: 1000000,
      date: '2023-08-10',
      status: 'Exited',
      coInvestors: ['First Round Capital'],
      description: 'B2B payment processing platform',
      valuation: 25000000,
      exitMultiple: 3.2
    },
    {
      id: '4',
      company: 'EduLearn Pro',
      sector: 'Education',
      stage: 'Series C',
      amount: 8000000,
      date: '2022-12-05',
      status: 'IPO',
      coInvestors: ['Insight Partners', 'Tiger Global'],
      description: 'Online learning platform for professionals',
      valuation: 800000000,
      exitMultiple: 12.5
    }
  ]

  const filteredInvestments = mockInvestments.filter(investment => {
    const matchesSearch = investment.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         investment.sector.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStage = selectedStage === 'all' || investment.stage === selectedStage
    const matchesSector = selectedSector === 'all' || investment.sector === selectedSector
    const matchesStatus = selectedStatus === 'all' || investment.status === selectedStatus
    
    return matchesSearch && matchesStage && matchesSector && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-blue-500'
      case 'Exited': return 'bg-green-500'
      case 'IPO': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const totalInvested = mockInvestments.reduce((sum, inv) => sum + inv.amount, 0)
  const activeInvestments = mockInvestments.filter(inv => inv.status === 'Active').length
  const exitedInvestments = mockInvestments.filter(inv => inv.status === 'Exited' || inv.status === 'IPO')
  const avgExitMultiple = exitedInvestments.length > 0 
    ? exitedInvestments.reduce((sum, inv) => sum + (inv.exitMultiple || 0), 0) / exitedInvestments.length 
    : 0

  return (
    <div className="space-y-6">
      {/* Investment Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div>
            <p className="text-xs text-muted-foreground">
              Across {mockInvestments.length} investments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Investments</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeInvestments}</div>
            <p className="text-xs text-muted-foreground">
              Current portfolio companies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful Exits</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exitedInvestments.length}</div>
            <p className="text-xs text-muted-foreground">
              IPOs and acquisitions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Exit Multiple</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgExitMultiple.toFixed(1)}x</div>
            <p className="text-xs text-muted-foreground">
              Return on investment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filter Investments</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedStage} onValueChange={setSelectedStage}>
              <SelectTrigger>
                <SelectValue placeholder="All stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="Seed">Seed</SelectItem>
                <SelectItem value="Series A">Series A</SelectItem>
                <SelectItem value="Series B">Series B</SelectItem>
                <SelectItem value="Series C">Series C</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedSector} onValueChange={setSelectedSector}>
              <SelectTrigger>
                <SelectValue placeholder="All sectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                <SelectItem value="Enterprise Software">Enterprise Software</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="FinTech">FinTech</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Exited">Exited</SelectItem>
                <SelectItem value="IPO">IPO</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Investment Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Investment Timeline</span>
          </CardTitle>
          <CardDescription>
            Chronological view of {investor.name}'s investment activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {filteredInvestments
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((investment, index) => (
                <div key={investment.id} className="relative">
                  {index !== filteredInvestments.length - 1 && (
                    <div className="absolute left-6 top-12 h-full w-px bg-border"></div>
                  )}
                  
                  <div className="flex items-start space-x-4">
                    <div className={`h-3 w-3 rounded-full mt-2 ${getStatusColor(investment.status)}`}></div>
                    
                    <Card className="flex-1">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <CardTitle className="text-lg">{investment.company}</CardTitle>
                              <Badge variant="outline">{investment.status}</Badge>
                            </div>
                            <CardDescription>{investment.description}</CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">{formatCurrency(investment.amount)}</div>
                            <div className="text-sm text-muted-foreground">{formatDate(investment.date)}</div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="secondary">{investment.sector}</Badge>
                          <Badge variant="outline">{investment.stage}</Badge>
                          {investment.valuation && (
                            <Badge variant="outline">
                              <Building className="h-3 w-3 mr-1" />
                              {formatCurrency(investment.valuation)} valuation
                            </Badge>
                          )}
                          {investment.exitMultiple && (
                            <Badge variant="default">
                              <ArrowUpRight className="h-3 w-3 mr-1" />
                              {investment.exitMultiple}x return
                            </Badge>
                          )}
                        </div>
                        
                        {investment.coInvestors.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-1">Co-investors:</p>
                            <div className="flex flex-wrap gap-1">
                              {investment.coInvestors.map((coinvestor, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {coinvestor}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Investment Analysis */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Sector Breakdown</span>
            </CardTitle>
            <CardDescription>Investment distribution by industry</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Enterprise Software', 'Healthcare', 'FinTech', 'Education'].map((sector, index) => {
                const sectorInvestments = mockInvestments.filter(inv => inv.sector === sector)
                const sectorAmount = sectorInvestments.reduce((sum, inv) => sum + inv.amount, 0)
                const percentage = (sectorAmount / totalInvested) * 100
                
                return (
                  <div key={sector} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{sector}</span>
                      <span>{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {sectorInvestments.length} investments • {formatCurrency(sectorAmount)}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Stage Distribution</span>
            </CardTitle>
            <CardDescription>Investment distribution by funding stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Seed', 'Series A', 'Series B', 'Series C'].map((stage, index) => {
                const stageInvestments = mockInvestments.filter(inv => inv.stage === stage)
                const stageAmount = stageInvestments.reduce((sum, inv) => sum + inv.amount, 0)
                const percentage = (stageAmount / totalInvested) * 100
                
                return (
                  <div key={stage} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{stage}</span>
                      <span>{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div 
                        className="h-full bg-secondary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stageInvestments.length} investments • {formatCurrency(stageAmount)}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Co-investor Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Frequent Co-investors</span>
          </CardTitle>
          <CardDescription>Investors who frequently participate in the same rounds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {['Sequoia Capital', 'Andreessen Horowitz', 'Kleiner Perkins', 'First Round Capital', 'GV', 'Insight Partners'].map((coinvestor, index) => {
              const sharedDeals = Math.floor(Math.random() * 5) + 1 // Mock data
              const relationshipStrength = sharedDeals >= 3 ? 'Strong' : sharedDeals >= 2 ? 'Medium' : 'Weak'
              
              return (
                <div key={coinvestor} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{coinvestor}</h4>
                    <Badge variant={relationshipStrength === 'Strong' ? 'default' : 'outline'}>
                      {relationshipStrength}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {sharedDeals} shared investments
                  </p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}