import { NetworkGraphData, NetworkNode, NetworkLink } from './api'

// Mock data for network visualization development and testing
export const mockNetworkData: NetworkGraphData = {
  nodes: [
    // Tier 1 Investors (Top-tier VCs)
    {
      id: 'marc_andreessen',
      name: 'Marc Andreessen',
      type: 'investor',
      value: 95,
      group: 'technology',
      tier: 1,
      location: 'San Francisco, CA',
      investment_count: 150,
      portfolio_size: 200,
      firm_name: 'Andreessen Horowitz'
    },
    {
      id: 'sequoia_roelof',
      name: 'Roelof Botha',
      type: 'investor',
      value: 92,
      group: 'technology',
      tier: 1,
      location: 'Menlo Park, CA',
      investment_count: 120,
      portfolio_size: 180,
      firm_name: 'Sequoia Capital'
    },
    {
      id: 'peter_thiel',
      name: 'Peter Thiel',
      type: 'investor',
      value: 88,
      group: 'fintech',
      tier: 1,
      location: 'San Francisco, CA',
      investment_count: 80,
      portfolio_size: 100,
      firm_name: 'Founders Fund'
    },
    {
      id: 'keith_rabois',
      name: 'Keith Rabois',
      type: 'investor',
      value: 85,
      group: 'consumer',
      tier: 1,
      location: 'Miami, FL',
      investment_count: 90,
      portfolio_size: 120,
      firm_name: 'Founders Fund'
    },

    // Tier 2 Investors (Well-connected)
    {
      id: 'sarah_guo',
      name: 'Sarah Guo',
      type: 'investor',
      value: 75,
      group: 'ai',
      tier: 2,
      location: 'San Francisco, CA',
      investment_count: 60,
      portfolio_size: 80,
      firm_name: 'Conviction Capital'
    },
    {
      id: 'elad_gil',
      name: 'Elad Gil',
      type: 'investor',
      value: 78,
      group: 'technology',
      tier: 2,
      location: 'San Francisco, CA',
      investment_count: 70,
      portfolio_size: 90,
      firm_name: 'Independent'
    },
    {
      id: 'katie_haun',
      name: 'Katie Haun',
      type: 'investor',
      value: 80,
      group: 'crypto',
      tier: 2,
      location: 'San Francisco, CA',
      investment_count: 40,
      portfolio_size: 50,
      firm_name: 'Haun Ventures'
    },

    // Tier 3 Investors (Emerging)
    {
      id: 'pre_seed_vc1',
      name: 'Alex Chen',
      type: 'investor',
      value: 45,
      group: 'enterprise',
      tier: 3,
      location: 'New York, NY',
      investment_count: 25,
      portfolio_size: 30,
      firm_name: 'Early Stage Capital'
    },
    {
      id: 'seed_vc2',
      name: 'Maria Rodriguez',
      type: 'investor',
      value: 50,
      group: 'healthcare',
      tier: 3,
      location: 'Boston, MA',
      investment_count: 30,
      portfolio_size: 40,
      firm_name: 'HealthTech Ventures'
    },

    // Investment Firms
    {
      id: 'a16z',
      name: 'Andreessen Horowitz',
      type: 'firm',
      value: 100,
      group: 'venture_capital',
      tier: 1,
      location: 'Menlo Park, CA',
      investment_count: 800,
      portfolio_size: 1000
    },
    {
      id: 'sequoia_capital',
      name: 'Sequoia Capital',
      type: 'firm',
      value: 98,
      group: 'venture_capital',
      tier: 1,
      location: 'Menlo Park, CA',
      investment_count: 1200,
      portfolio_size: 1500
    },
    {
      id: 'founders_fund',
      name: 'Founders Fund',
      type: 'firm',
      value: 90,
      group: 'venture_capital',
      tier: 1,
      location: 'San Francisco, CA',
      investment_count: 300,
      portfolio_size: 400
    },

    // Portfolio Companies
    {
      id: 'stripe',
      name: 'Stripe',
      type: 'company',
      value: 85,
      group: 'fintech',
      tier: 1,
      location: 'San Francisco, CA',
      investment_count: 0,
      portfolio_size: 0
    },
    {
      id: 'airbnb',
      name: 'Airbnb',
      type: 'company',
      value: 80,
      group: 'consumer',
      tier: 1,
      location: 'San Francisco, CA',
      investment_count: 0,
      portfolio_size: 0
    },
    {
      id: 'coinbase',
      name: 'Coinbase',
      type: 'company',
      value: 75,
      group: 'crypto',
      tier: 1,
      location: 'San Francisco, CA',
      investment_count: 0,
      portfolio_size: 0
    },
    {
      id: 'openai',
      name: 'OpenAI',
      type: 'company',
      value: 95,
      group: 'ai',
      tier: 1,
      location: 'San Francisco, CA',
      investment_count: 0,
      portfolio_size: 0
    },

    // Sectors
    {
      id: 'fintech_sector',
      name: 'Fintech',
      type: 'sector',
      value: 60,
      group: 'sector',
      tier: 1,
      location: 'Global',
      investment_count: 0,
      portfolio_size: 0
    },
    {
      id: 'ai_sector',
      name: 'Artificial Intelligence',
      type: 'sector',
      value: 70,
      group: 'sector',
      tier: 1,
      location: 'Global',
      investment_count: 0,
      portfolio_size: 0
    },
    {
      id: 'crypto_sector',
      name: 'Cryptocurrency',
      type: 'sector',
      value: 55,
      group: 'sector',
      tier: 1,
      location: 'Global',
      investment_count: 0,
      portfolio_size: 0
    }
  ],
  links: [
    // Firm colleague relationships
    {
      source: 'marc_andreessen',
      target: 'a16z',
      value: 10,
      type: 'firm_colleague',
      strength: 1.0
    },
    {
      source: 'sequoia_roelof',
      target: 'sequoia_capital',
      value: 10,
      type: 'firm_colleague',
      strength: 1.0
    },
    {
      source: 'peter_thiel',
      target: 'founders_fund',
      value: 10,
      type: 'firm_colleague',
      strength: 1.0
    },
    {
      source: 'keith_rabois',
      target: 'founders_fund',
      value: 8,
      type: 'firm_colleague',
      strength: 0.9
    },

    // Investment relationships
    {
      source: 'a16z',
      target: 'stripe',
      value: 8,
      type: 'investment',
      strength: 0.9
    },
    {
      source: 'a16z',
      target: 'airbnb',
      value: 7,
      type: 'investment',
      strength: 0.8
    },
    {
      source: 'a16z',
      target: 'coinbase',
      value: 9,
      type: 'investment',
      strength: 0.95
    },
    {
      source: 'sequoia_capital',
      target: 'stripe',
      value: 9,
      type: 'investment',
      strength: 0.95
    },
    {
      source: 'sequoia_capital',
      target: 'airbnb',
      value: 8,
      type: 'investment',
      strength: 0.9
    },
    {
      source: 'founders_fund',
      target: 'stripe',
      value: 6,
      type: 'investment',
      strength: 0.7
    },
    {
      source: 'sarah_guo',
      target: 'openai',
      value: 7,
      type: 'investment',
      strength: 0.8
    },

    // Co-investment relationships
    {
      source: 'marc_andreessen',
      target: 'sequoia_roelof',
      value: 6,
      type: 'co_investment',
      strength: 0.7
    },
    {
      source: 'marc_andreessen',
      target: 'peter_thiel',
      value: 5,
      type: 'co_investment',
      strength: 0.6
    },
    {
      source: 'peter_thiel',
      target: 'keith_rabois',
      value: 8,
      type: 'co_investment',
      strength: 0.9
    },
    {
      source: 'sarah_guo',
      target: 'elad_gil',
      value: 4,
      type: 'co_investment',
      strength: 0.5
    },

    // Board member relationships
    {
      source: 'marc_andreessen',
      target: 'coinbase',
      value: 7,
      type: 'board_member',
      strength: 0.8
    },
    {
      source: 'keith_rabois',
      target: 'airbnb',
      value: 6,
      type: 'board_member',
      strength: 0.7
    },

    // Sector relationships
    {
      source: 'stripe',
      target: 'fintech_sector',
      value: 5,
      type: 'sector',
      strength: 0.6
    },
    {
      source: 'coinbase',
      target: 'crypto_sector',
      value: 5,
      type: 'sector',
      strength: 0.6
    },
    {
      source: 'openai',
      target: 'ai_sector',
      value: 5,
      type: 'sector',
      strength: 0.6
    },
    {
      source: 'peter_thiel',
      target: 'fintech_sector',
      value: 4,
      type: 'sector',
      strength: 0.5
    },
    {
      source: 'katie_haun',
      target: 'crypto_sector',
      value: 4,
      type: 'sector',
      strength: 0.5
    },
    {
      source: 'sarah_guo',
      target: 'ai_sector',
      value: 4,
      type: 'sector',
      strength: 0.5
    }
  ],
  metadata: {
    total_nodes: 19,
    total_edges: 25,
    max_tier: 3,
    sectors: ['technology', 'fintech', 'consumer', 'ai', 'crypto', 'healthcare', 'enterprise'],
    locations: ['San Francisco, CA', 'Menlo Park, CA', 'Miami, FL', 'New York, NY', 'Boston, MA', 'Global']
  }
}

// Mock warm introduction response
export const mockWarmIntroResponse = {
  source: {
    id: 'pre_seed_vc1',
    name: 'Alex Chen',
    type: 'investor' as const,
    value: 45,
    group: 'enterprise',
    tier: 3,
    location: 'New York, NY',
    firm_name: 'Early Stage Capital'
  },
  target: {
    id: 'marc_andreessen',
    name: 'Marc Andreessen',
    type: 'investor' as const,
    value: 95,
    group: 'technology',
    tier: 1,
    location: 'San Francisco, CA',
    firm_name: 'Andreessen Horowitz'
  },
  paths: [
    {
      path: [
        {
          id: 'pre_seed_vc1',
          name: 'Alex Chen',
          type: 'investor' as const,
          value: 45,
          group: 'enterprise',
          tier: 3,
          firm_name: 'Early Stage Capital'
        },
        {
          id: 'elad_gil',
          name: 'Elad Gil',
          type: 'investor' as const,
          value: 78,
          group: 'technology',
          tier: 2,
          firm_name: 'Independent'
        },
        {
          id: 'marc_andreessen',
          name: 'Marc Andreessen',
          type: 'investor' as const,
          value: 95,
          group: 'technology',
          tier: 1,
          firm_name: 'Andreessen Horowitz'
        }
      ],
      connections: [
        {
          source: 'pre_seed_vc1',
          target: 'elad_gil',
          value: 3,
          type: 'co_investment' as const,
          strength: 0.4
        },
        {
          source: 'elad_gil',
          target: 'marc_andreessen',
          value: 5,
          type: 'co_investment' as const,
          strength: 0.6
        }
      ],
      strength: 0.5,
      hops: 2,
      introduction_text: "Hi Marc, I'd like to introduce you to Alex Chen from Early Stage Capital. Alex is doing some interesting work in the enterprise space and I think you two would have a great conversation about the future of B2B software. Alex has a strong track record of identifying early-stage enterprise opportunities. Would you be open to a quick intro call? Best, Elad"
    }
  ],
  best_path: null
}

// Mock function to simulate API delay
export const simulateNetworkApiDelay = (data: any, delay: number = 1000): Promise<any> => {
  return new Promise(resolve => {
    setTimeout(() => resolve(data), delay)
  })
}