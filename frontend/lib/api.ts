const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

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

      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${url}`, error)
      throw error
    }
  }

  // Network statistics
  async getNetworkStats(): Promise<NetworkStats> {
    return this.request<NetworkStats>('/api/network/stats')
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
        investors: Investor[]
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
      investors: response.data.investors.map((investor: any) => ({
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
    return this.request<Investor>(`/api/investors/${id}`)
  }

  // AI matching
  async matchInvestors(matchRequest: MatchRequest): Promise<MatchResponse> {
    return this.request<MatchResponse>('/api/investors/match', {
      method: 'POST',
      body: JSON.stringify(matchRequest),
    })
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
  investors: ['investors'] as const,
  investorSearch: (filters: SearchFilters) => ['investors', 'search', filters] as const,
  investor: (id: string) => ['investors', id] as const,
  investorMatch: (query: string) => ['investors', 'match', query] as const,
}