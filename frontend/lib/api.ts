const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010'

// Types based on the API endpoints
export interface NetworkStats {
  totalInvestors: number
  totalPeople: number
  totalFirms: number
  withLinkedIn: number
  withInvestments: number
  claimedProfiles: number
  highQuality: number
  networkTiers: Array<{ network_tier: string; count: number }>
  qualityTiers: Array<{ quality_tier: string; count: number }>
  topFirms: Array<{ 
    firm_name: string
    investor_count: number
    avg_investments: number
    avg_quality_score: number
    super_connected_count: number
    highly_connected_count: number
  }>
  investmentFocus: {
    founder_focused: number
    diversity_focused: number
    female_focused: number
    lead_investors: number
  }
  lastUpdated: string
}

export interface Investor {
  id: string
  name: string
  title?: string
  company?: string
  location?: string
  bio?: string
  linkedin_url?: string
  twitter_url?: string
  investment_focus?: string[]
  portfolio_companies?: string[]
  network_connections?: number
  total_investments?: number
  average_check_size?: number
  sectors?: string[]
  investment_stage?: string[]
  geography?: string[]
  notable_investments?: string[]
  years_active?: number
  education?: string[]
  previous_experience?: string[]
  created_at?: string
  updated_at?: string
}

export interface SearchFilters {
  query?: string
  location?: string
  sector?: string
  investment_stage?: string
  min_check_size?: number
  max_check_size?: number
  years_active_min?: number
  years_active_max?: number
  company?: string
  page?: number
  limit?: number
}

export interface Firm {
  id: string
  name: string
  slug?: string
  current_fund_size?: string
  investor_count?: number
  avg_investments?: number
  avg_quality_score?: number
  max_connections?: number
  total_investments?: number
  locations?: string[]
  sectors?: string[]
  stages?: string[]
  fund_size?: string
  description?: string
  website?: string
  founded_year?: number
  created_at?: string
  updated_at?: string
}

export interface FirmFilters {
  query?: string
  location?: string
  sector?: string
  investment_stage?: string
  min_fund_size?: number
  max_fund_size?: number
  min_investor_count?: number
  max_investor_count?: number
  founded_year_min?: number
  founded_year_max?: number
  page?: number
  limit?: number
  sort_by?: 'name' | 'investor_count' | 'avg_investments' | 'avg_quality_score' | 'total_investments'
  sort_order?: 'asc' | 'desc'
}

export interface FirmResponse {
  firms: Firm[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface FirmDetail extends Firm {
  investors: Investor[]
  analytics: {
    investment_trends: Array<{ month: string; count: number }>
    sector_distribution: Array<{ sector: string; count: number }>
    stage_distribution: Array<{ stage: string; count: number }>
    location_distribution: Array<{ location: string; count: number }>
  }
}

export interface SearchResponse {
  investors: Investor[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface MatchRequest {
  query: string
  filters?: Partial<SearchFilters>
  limit?: number
}

export interface MatchResponse {
  matches: Investor[]
  query: string
  matchingCriteria: string
}

export interface NetworkNode {
  id: string
  name: string
  type: 'investor' | 'firm' | 'sector' | 'company'
  value: number
  group: string
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
  tier: number
  location?: string
  investment_count?: number
  portfolio_size?: number
  firm_name?: string
}

export interface NetworkLink {
  source: string | NetworkNode
  target: string | NetworkNode
  value: number
  type: 'investment' | 'co_investment' | 'firm_colleague' | 'sector' | 'board_member'
  strength: number
}

export interface NetworkGraphData {
  nodes: NetworkNode[]
  links: NetworkLink[]
  metadata: {
    total_nodes: number
    total_edges: number
    max_tier: number
    sectors: string[]
    locations: string[]
  }
}

export interface WarmIntroPath {
  path: NetworkNode[]
  connections: NetworkLink[]
  strength: number
  hops: number
  introduction_text: string
}

export interface WarmIntroResponse {
  source: NetworkNode
  target: NetworkNode
  paths: WarmIntroPath[]
  best_path: WarmIntroPath | null
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      })


      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      throw error
    }
  }

  // Network statistics
  async getNetworkStats(): Promise<NetworkStats> {
    const response = await this.request<{
      success: boolean
      data: NetworkStats
      meta: any
    }>('/api/network/stats')
    
    // The API returns data wrapped in { success, data, meta } format
    return response.data
  }

  // Search investors
  async searchInvestors(filters: SearchFilters = {}): Promise<SearchResponse> {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString())
      }
    })

    const queryString = params.toString()
    const endpoint = `/api/investors/search${queryString ? `?${queryString}` : ''}`
    
    const response = await this.request<{
      success: boolean
      data: {
        results: any[]
        pagination: {
          page: number
          limit: number
          hasMore: boolean
          total: number | null
        }
      }
    }>(endpoint)

    // Transform API response to expected format
    return {
      investors: response.data.results.map((investor: any) => ({
        id: investor.id?.toString() || '',
        name: investor.full_name || investor.name || '',
        title: investor.position || investor.title,
        company: investor.firm_name || investor.company,
        location: investor.location,
        bio: investor.headline || investor.bio,
        linkedin_url: investor.linkedin_url,
        twitter_url: investor.twitter_url,
        investment_focus: investor.investment_focus || [],
        portfolio_companies: investor.portfolio_companies || [],
        network_connections: investor.connection_count || investor.network_connections || 0,
        total_investments: investor.investment_count || investor.total_investments || 0,
        average_check_size: investor.target_investment || investor.average_check_size,
        sectors: investor.sectors || [],
        investment_stage: investor.investment_stage || [],
        geography: investor.geography || [],
        notable_investments: investor.notable_investments || [],
        years_active: investor.years_active,
        education: investor.education || [],
        previous_experience: investor.previous_experience || [],
        created_at: investor.created_at,
        updated_at: investor.updated_at,
      } as Investor)),
      total: response.data.pagination.total || 0,
      page: response.data.pagination.page,
      limit: response.data.pagination.limit,
      totalPages: response.data.pagination.total 
        ? Math.ceil(response.data.pagination.total / response.data.pagination.limit)
        : 1
    }
  }

  // Get individual investor
  async getInvestor(id: string): Promise<Investor> {
    const response = await this.request<{
      success: boolean
      data: {
        investor: any
      }
    }>(`/api/investors/${id}`)

    const investor = response.data.investor
    
    // Transform API response to expected format
    return {
      id: investor.id?.toString() || '',
      name: investor.full_name || investor.name || '',
      title: investor.position || investor.title,
      company: investor.firm_name || investor.company,
      location: investor.location,
      bio: investor.headline || investor.bio,
      linkedin_url: investor.linkedin_url,
      twitter_url: investor.twitter_url,
      investment_focus: investor.investment_focus?.sectors || [],
      portfolio_companies: investor.portfolio_companies || [],
      network_connections: investor.connection_count || investor.network_connections || 0,
      total_investments: investor.investment_count || investor.total_investments || 0,
      average_check_size: investor.target_investment || investor.average_check_size,
      sectors: investor.investment_focus?.sectors || investor.sectors || [],
      investment_stage: investor.investment_focus?.stages || investor.investment_stage || [],
      geography: investor.geography || [],
      notable_investments: investor.notable_investments || [],
      years_active: investor.years_active,
      education: investor.education || [],
      previous_experience: investor.previous_experience || [],
      created_at: investor.created_at,
      updated_at: investor.updated_at,
    } as Investor
  }

  // AI matching
  async matchInvestors(matchRequest: MatchRequest): Promise<MatchResponse> {
    return this.request<MatchResponse>('/api/investors/match', {
      method: 'POST',
      body: JSON.stringify(matchRequest),
    })
  }

  // Network graph data
  async getNetworkGraph(filters?: {
    min_tier?: number
    max_tier?: number
    sector?: string
    location?: string
    limit?: number
  }): Promise<NetworkGraphData> {
    try {
      const params = new URLSearchParams()
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            params.append(key, value.toString())
          }
        })
      }

      const queryString = params.toString()
      const endpoint = `/api/network/graph${queryString ? `?${queryString}` : ''}`
      
      const response = await this.request<any>(endpoint)
      
      // Transform API response to match expected interface
      // API returns { nodes, edges, stats } but we need { nodes, links, metadata }
      const transformedData: NetworkGraphData = {
        nodes: response.nodes || [],
        links: (response.edges || []).map((edge: any) => ({
          source: edge.source,
          target: edge.target,
          value: edge.value || 1,
          type: edge.type || 'investment',
          strength: edge.strength || 0.5
        })),
        metadata: {
          total_nodes: response.stats?.totalNodes || response.nodes?.length || 0,
          total_edges: response.stats?.totalEdges || response.edges?.length || 0,
          max_tier: 3, // Default value
          sectors: [], // Will be computed from nodes if needed
          locations: [] // Will be computed from nodes if needed
        }
      }
      
      return transformedData
    } catch (error) {
      // Fallback to mock data if API is not available
      console.warn('Network API not available, using mock data:', error)
      const { mockNetworkData, simulateNetworkApiDelay } = await import('./mock-network-data')
      
      // Apply filters to mock data
      let filteredData = { ...mockNetworkData }
      
      if (filters) {
        if (filters.min_tier || filters.max_tier) {
          filteredData.nodes = filteredData.nodes.filter(node => {
            const minTier = filters.min_tier || 1
            const maxTier = filters.max_tier || 3
            return node.tier >= minTier && node.tier <= maxTier
          })
        }
        
        if (filters.sector) {
          filteredData.nodes = filteredData.nodes.filter(node => 
            node.group === filters.sector
          )
        }
        
        if (filters.location) {
          filteredData.nodes = filteredData.nodes.filter(node => 
            node.location === filters.location
          )
        }
        
        if (filters.limit) {
          filteredData.nodes = filteredData.nodes.slice(0, filters.limit)
        }
        
        // Filter links to only include connections between remaining nodes
        const nodeIds = new Set(filteredData.nodes.map(n => n.id))
        filteredData.links = filteredData.links.filter(link => 
          nodeIds.has(typeof link.source === 'string' ? link.source : link.source.id) &&
          nodeIds.has(typeof link.target === 'string' ? link.target : link.target.id)
        )
      }
      
      return await simulateNetworkApiDelay(filteredData, 500)
    }
  }

  // Get warm introduction paths
  async getWarmIntroductions(sourceId: string, targetId: string): Promise<WarmIntroResponse> {
    try {
      return await this.request<WarmIntroResponse>(`/api/investors/${sourceId}/warm-intros/${targetId}`)
    } catch (error) {
      // Fallback to mock data if API is not available
      console.warn('Warm intro API not available, using mock data:', error)
      const { mockWarmIntroResponse, simulateNetworkApiDelay } = await import('./mock-network-data')
      
      // Customize mock response based on the actual requested IDs
      const customResponse = {
        ...mockWarmIntroResponse,
        source: { ...mockWarmIntroResponse.source, id: sourceId },
        target: { ...mockWarmIntroResponse.target, id: targetId }
      }
      
      // Set best path to the first path if available
      if (customResponse.paths.length > 0) {
        customResponse.best_path = customResponse.paths[0]
      }
      
      return await simulateNetworkApiDelay(customResponse, 800)
    }
  }

  // Search firms
  async searchFirms(filters: FirmFilters = {}): Promise<FirmResponse> {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString())
      }
    })

    const queryString = params.toString()
    const endpoint = `/api/firms${queryString ? `?${queryString}` : ''}`
    
    const response = await this.request<{
      success: boolean
      data: {
        items: any[]
        pagination: {
          page: number
          limit: number
          hasMore: boolean
          total: number | null
        }
      }
    }>(endpoint)

    // Transform API response to expected format
    return {
      firms: response.data.items.map((firm: any) => ({
        id: firm.id?.toString() || '',
        name: firm.name || '',
        slug: firm.slug,
        current_fund_size: firm.current_fund_size || firm.fund_size,
        investor_count: firm.investor_count || 0,
        avg_investments: firm.avg_investments || 0,
        avg_quality_score: firm.avg_quality_score || 0,
        max_connections: firm.max_connections || 0,
        total_investments: firm.total_investments || 0,
        locations: firm.locations || [],
        sectors: firm.sectors || [],
        stages: firm.stages || [],
        fund_size: firm.fund_size || firm.current_fund_size,
        description: firm.description,
        website: firm.website,
        founded_year: firm.founded_year,
        created_at: firm.created_at,
        updated_at: firm.updated_at,
      } as Firm)),
      total: response.data.pagination.total || 0,
      page: response.data.pagination.page,
      limit: response.data.pagination.limit,
      totalPages: response.data.pagination.total 
        ? Math.ceil(response.data.pagination.total / response.data.pagination.limit)
        : 1
    }
  }

  // Get individual firm
  async getFirm(id: string): Promise<FirmDetail> {
    const response = await this.request<{
      success: boolean
      data: {
        firm: any
      }
    }>(`/api/firms/${id}`)

    const firm = response.data.firm
    const investors = firm.investors || []
    
    // Transform API response to expected format
    return {
      id: firm.id?.toString() || '',
      name: firm.name || '',
      slug: firm.slug,
      current_fund_size: firm.current_fund_size || firm.fund_size,
      investor_count: firm.investor_count || 0,
      avg_investments: firm.avg_investments || 0,
      avg_quality_score: firm.avg_quality_score || 0,
      max_connections: firm.max_connections || 0,
      total_investments: firm.total_investments || 0,
      locations: firm.locations || [],
      sectors: firm.sectors || [],
      stages: firm.stages || [],
      fund_size: firm.fund_size || firm.current_fund_size,
      description: firm.description,
      website: firm.website,
      founded_year: firm.founded_year,
      created_at: firm.created_at,
      updated_at: firm.updated_at,
      investors: investors.map((investor: any) => ({
        id: investor.id?.toString() || '',
        name: investor.full_name || investor.name || '',
        title: investor.position || investor.title,
        company: firm.name,
        location: investor.location,
        bio: investor.headline || investor.bio,
        linkedin_url: investor.linkedin_url,
        twitter_url: investor.twitter_url,
        investment_focus: investor.investment_focus || [],
        portfolio_companies: investor.portfolio_companies || [],
        network_connections: investor.first_degree_count || investor.network_connections || 0,
        total_investments: investor.investment_count || investor.total_investments || 0,
        average_check_size: investor.target_investment || investor.average_check_size,
        sectors: investor.sectors || [],
        investment_stage: investor.investment_stage || [],
        geography: investor.geography || [],
        notable_investments: investor.notable_investments || [],
        years_active: investor.years_active,
        education: investor.education || [],
        previous_experience: investor.previous_experience || [],
        created_at: investor.created_at,
        updated_at: investor.updated_at,
      } as Investor)),
      analytics: {
        investment_trends: [],
        sector_distribution: [],
        stage_distribution: [],
        location_distribution: []
      }
    } as FirmDetail
  }

  // Get firm analytics
  async getFirmAnalytics(): Promise<any> {
    return this.request<any>('/api/firms/analysis')
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/api/health')
  }
}

export const apiClient = new ApiClient()

// React Query keys
export const queryKeys = {
  networkStats: ['network', 'stats'] as const,
  networkGraph: (filters?: any) => ['network', 'graph', filters] as const,
  warmIntros: (sourceId: string, targetId: string) => ['warm-intros', sourceId, targetId] as const,
  investors: ['investors'] as const,
  investorSearch: (filters: SearchFilters) => ['investors', 'search', filters] as const,
  investor: (id: string) => ['investors', id] as const,
  investorMatch: (query: string) => ['investors', 'match', query] as const,
  firms: ['firms'] as const,
  firmSearch: (filters: FirmFilters) => ['firms', 'search', filters] as const,
  firm: (id: string) => ['firms', id] as const,
  firmAnalytics: ['firms', 'analytics'] as const,
}