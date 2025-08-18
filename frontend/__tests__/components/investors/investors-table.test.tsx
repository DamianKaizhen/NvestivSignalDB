import { render, screen, fireEvent } from '@testing-library/react'
import { InvestorsTable } from '@/components/investors/investors-table'
import type { Investor } from '@/lib/api'

const mockInvestor: Investor = {
  id: '1',
  name: 'John Doe',
  title: 'Managing Partner',
  company: 'Test Ventures',
  location: 'San Francisco, CA',
  linkedin_url: 'https://linkedin.com/in/johndoe',
  investment_focus: ['SaaS', 'AI', 'FinTech'],
  total_investments: 25,
  average_check_size: 500000,
  years_active: 10,
  bio: 'Test bio',
  email: 'john@testventures.com',
  phone: '+1234567890',
  website: 'https://testventures.com',
  twitter: '@johndoe',
  stage_focus: ['Series A', 'Series B'],
  sector_focus: ['Technology'],
  geography_focus: ['North America'],
  min_check_size: 100000,
  max_check_size: 1000000,
  notable_investments: ['Company A', 'Company B'],
  education: ['Stanford MBA'],
  previous_experience: ['Goldman Sachs'],
  firm_id: 'firm1',
  created_at: '2023-01-01',
  updated_at: '2023-01-01'
}

const mockInvestors: Investor[] = [mockInvestor]

// Mock Next.js components
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

describe('InvestorsTable', () => {
  it('renders loading state correctly', () => {
    render(<InvestorsTable investors={[]} isLoading={true} />)
    
    // Should show skeleton loaders
    expect(screen.getAllByTestId('skeleton')).toHaveLength(10)
  })

  it('renders empty state correctly', () => {
    render(<InvestorsTable investors={[]} isLoading={false} />)
    
    expect(screen.getByText('No investors found')).toBeInTheDocument()
    expect(screen.getByText('Try adjusting your search criteria or filters')).toBeInTheDocument()
  })

  it('renders investor data correctly', () => {
    render(<InvestorsTable investors={mockInvestors} isLoading={false} />)
    
    // Check investor name
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    
    // Check investor details
    expect(screen.getByText('Managing Partner')).toBeInTheDocument()
    expect(screen.getByText('Test Ventures')).toBeInTheDocument()
    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()
    
    // Check investment focus tags
    expect(screen.getByText('SaaS')).toBeInTheDocument()
    expect(screen.getByText('AI')).toBeInTheDocument()
    expect(screen.getByText('FinTech')).toBeInTheDocument()
    
    // Check stats
    expect(screen.getByText('25')).toBeInTheDocument() // total investments
    expect(screen.getByText('$500,000')).toBeInTheDocument() // average check size
    expect(screen.getByText('10y')).toBeInTheDocument() // years active
  })

  it('renders investor initials correctly', () => {
    render(<InvestorsTable investors={mockInvestors} isLoading={false} />)
    
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('handles long investment focus lists', () => {
    const investorWithManyFocus: Investor = {
      ...mockInvestor,
      investment_focus: ['SaaS', 'AI', 'FinTech', 'HealthTech', 'EdTech', 'CleanTech']
    }
    
    render(<InvestorsTable investors={[investorWithManyFocus]} isLoading={false} />)
    
    // Should show first 3 focus areas
    expect(screen.getByText('SaaS')).toBeInTheDocument()
    expect(screen.getByText('AI')).toBeInTheDocument()
    expect(screen.getByText('FinTech')).toBeInTheDocument()
    
    // Should show +3 more indicator
    expect(screen.getByText('+3 more')).toBeInTheDocument()
  })

  it('handles missing optional fields gracefully', () => {
    const minimalInvestor: Investor = {
      ...mockInvestor,
      title: undefined,
      company: undefined,
      location: undefined,
      linkedin_url: undefined,
      investment_focus: undefined,
      total_investments: undefined,
      average_check_size: undefined,
      years_active: undefined
    }
    
    render(<InvestorsTable investors={[minimalInvestor]} isLoading={false} />)
    
    // Should still show name
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    
    // Should show view profile button
    expect(screen.getByText('View Profile')).toBeInTheDocument()
  })

  it('renders external link for LinkedIn correctly', () => {
    render(<InvestorsTable investors={mockInvestors} isLoading={false} />)
    
    const linkedinLink = screen.getByRole('link', { name: '' })
    expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com/in/johndoe')
    expect(linkedinLink).toHaveAttribute('target', '_blank')
    expect(linkedinLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders view profile link correctly', () => {
    render(<InvestorsTable investors={mockInvestors} isLoading={false} />)
    
    const profileLink = screen.getByRole('link', { name: 'View Profile' })
    expect(profileLink).toHaveAttribute('href', '/investors/1')
  })

  it('renders multiple investors correctly', () => {
    const investor2: Investor = {
      ...mockInvestor,
      id: '2',
      name: 'Jane Smith',
      company: 'Another VC'
    }
    
    render(<InvestorsTable investors={[mockInvestor, investor2]} isLoading={false} />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Test Ventures')).toBeInTheDocument()
    expect(screen.getByText('Another VC')).toBeInTheDocument()
  })

  it('applies hover styles correctly', () => {
    render(<InvestorsTable investors={mockInvestors} isLoading={false} />)
    
    const investorRow = screen.getByText('John Doe').closest('div')
    expect(investorRow).toHaveClass('hover:bg-muted/50')
  })

  describe('accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<InvestorsTable investors={mockInvestors} isLoading={false} />)
      
      // Check for proper link roles
      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
    })

    it('has proper button roles', () => {
      render(<InvestorsTable investors={mockInvestors} isLoading={false} />)
      
      const button = screen.getByRole('button', { name: 'View Profile' })
      expect(button).toBeInTheDocument()
    })
  })
})