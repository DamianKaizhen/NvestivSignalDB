import { apiClient } from '@/lib/api'

// Mock fetch globally
global.fetch = jest.fn()

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('ApiClient', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('getNetworkStats', () => {
    it('should fetch network stats successfully', async () => {
      const mockStats = {
        totalInvestors: 100,
        totalPeople: 200,
        totalFirms: 50,
        withLinkedIn: 80,
        withInvestments: 70,
        claimedProfiles: 30,
        highQuality: 60,
        networkTiers: [],
        qualityTiers: [],
        topFirms: [],
        investmentFocus: {
          founder_focused: 20,
          diversity_focused: 15,
          female_focused: 10,
          lead_investors: 25
        },
        lastUpdated: '2023-01-01'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      } as Response)

      const result = await apiClient.getNetworkStats()
      
      expect(result).toEqual(mockStats)
      expect(mockFetch).toHaveBeenCalledWith('/api/network/stats', {
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response)

      await expect(apiClient.getNetworkStats()).rejects.toThrow('HTTP error! status: 500')
    })
  })

  describe('searchInvestors', () => {
    it('should search investors with filters', async () => {
      const mockResponse = {
        success: true,
        data: {
          investors: [
            {
              id: 1,
              full_name: 'John Doe',
              position: 'Partner',
              firm_name: 'Test VC',
              location: 'San Francisco',
              investment_focus: ['SaaS', 'AI'],
              investment_count: 25,
              connection_count: 100
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            hasMore: false,
            total: 1
          }
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const filters = {
        query: 'John',
        location: 'San Francisco',
        page: 1,
        limit: 20
      }

      const result = await apiClient.searchInvestors(filters)
      
      expect(result.investors).toHaveLength(1)
      expect(result.investors[0]).toMatchObject({
        id: '1',
        name: 'John Doe',
        title: 'Partner',
        company: 'Test VC',
        location: 'San Francisco',
        investment_focus: ['SaaS', 'AI'],
        total_investments: 25,
        network_connections: 100
      })
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
      expect(result.totalPages).toBe(1)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/investors/search?query=John&location=San%20Francisco&page=1&limit=20',
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    })

    it('should search investors without filters', async () => {
      const mockResponse = {
        success: true,
        data: {
          investors: [],
          pagination: {
            page: 1,
            limit: 20,
            hasMore: false,
            total: 0
          }
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await apiClient.searchInvestors({})
      
      expect(result.investors).toHaveLength(0)
      expect(mockFetch).toHaveBeenCalledWith('/api/investors/search', {
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })

    it('should handle undefined values in filters', async () => {
      const mockResponse = {
        success: true,
        data: {
          investors: [],
          pagination: {
            page: 1,
            limit: 20,
            hasMore: false,
            total: 0
          }
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const filters = {
        query: 'test',
        location: undefined,
        sector: '',
        page: 1
      }

      await apiClient.searchInvestors(filters)
      
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/investors/search?query=test&page=1',
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    })
  })

  describe('getInvestor', () => {
    it('should fetch individual investor', async () => {
      const mockResponse = {
        success: true,
        data: {
          investor: {
            id: 123,
            full_name: 'Jane Smith',
            position: 'Managing Partner',
            firm_name: 'Example Ventures',
            location: 'New York',
            headline: 'Experienced investor',
            linkedin_url: 'https://linkedin.com/in/janesmith',
            investment_focus: {
              sectors: ['FinTech', 'HealthTech'],
              stages: ['Series A', 'Series B']
            },
            investment_count: 50,
            connection_count: 200
          }
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await apiClient.getInvestor('123')
      
      expect(result).toMatchObject({
        id: '123',
        name: 'Jane Smith',
        title: 'Managing Partner',
        company: 'Example Ventures',
        location: 'New York',
        bio: 'Experienced investor',
        linkedin_url: 'https://linkedin.com/in/janesmith',
        investment_focus: ['FinTech', 'HealthTech'],
        sectors: ['FinTech', 'HealthTech'],
        investment_stage: ['Series A', 'Series B'],
        total_investments: 50,
        network_connections: 200
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/investors/123', {
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })
  })

  describe('matchInvestors', () => {
    it('should match investors with AI', async () => {
      const mockResponse = {
        matches: [
          {
            id: '1',
            name: 'AI Investor',
            title: 'Partner',
            company: 'AI Fund'
          }
        ],
        query: 'AI startups',
        matchingCriteria: 'Focus on AI and machine learning'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const matchRequest = {
        query: 'AI startups',
        filters: { sector: 'AI' },
        limit: 10
      }

      const result = await apiClient.matchInvestors(matchRequest)
      
      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith('/api/investors/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(matchRequest)
      })
    })
  })

  describe('searchFirms', () => {
    it('should search firms with filters', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [
            {
              id: 1,
              name: 'Test Ventures',
              investor_count: 10,
              avg_investments: 5,
              fund_size: '$100M',
              locations: ['San Francisco'],
              sectors: ['SaaS']
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            hasMore: false,
            total: 1
          }
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const filters = {
        query: 'Test',
        location: 'San Francisco'
      }

      const result = await apiClient.searchFirms(filters)
      
      expect(result.firms).toHaveLength(1)
      expect(result.firms[0]).toMatchObject({
        id: '1',
        name: 'Test Ventures',
        investor_count: 10,
        avg_investments: 5,
        fund_size: '$100M',
        locations: ['San Francisco'],
        sectors: ['SaaS']
      })
    })
  })

  describe('getFirm', () => {
    it('should fetch individual firm with investors', async () => {
      const mockResponse = {
        success: true,
        data: {
          firm: {
            id: 1,
            name: 'Example Ventures',
            fund_size: '$500M',
            investor_count: 15,
            investors: [
              {
                id: 1,
                full_name: 'Partner One',
                position: 'General Partner',
                investment_count: 30
              }
            ]
          }
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await apiClient.getFirm('1')
      
      expect(result.name).toBe('Example Ventures')
      expect(result.fund_size).toBe('$500M')
      expect(result.investor_count).toBe(15)
      expect(result.investors).toHaveLength(1)
      expect(result.investors[0].name).toBe('Partner One')
    })
  })

  describe('healthCheck', () => {
    it('should perform health check', async () => {
      const mockResponse = {
        status: 'ok',
        timestamp: '2023-01-01T00:00:00Z'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await apiClient.healthCheck()
      
      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith('/api/health', {
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(apiClient.getNetworkStats()).rejects.toThrow('Network error')
    })

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      } as Response)

      await expect(apiClient.getNetworkStats()).rejects.toThrow('Invalid JSON')
    })
  })
})