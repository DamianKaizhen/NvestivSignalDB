'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { apiClient, type MatchRequest, type Investor } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SearchIcon, Sparkles, AlertCircle } from 'lucide-react'
import { SearchResults } from './search-results'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function SearchContent() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{
    matches: Investor[]
    query: string
    matchingCriteria: string
  } | null>(null)

  const mutation = useMutation({
    mutationFn: (matchRequest: MatchRequest) => apiClient.matchInvestors(matchRequest),
    onSuccess: (data) => {
      setResults(data)
    },
  })

  const handleSearch = () => {
    if (!query.trim()) return
    
    mutation.mutate({
      query: query.trim(),
      limit: 20,
    })
  }

  const handleExample = (exampleQuery: string) => {
    setQuery(exampleQuery)
  }

  const examples = [
    "Find investors who invest in early-stage fintech startups in Silicon Valley",
    "I'm looking for VCs who have invested in AI/ML companies and write checks between $1M-$5M",
    "Looking for angel investors in NYC who focus on consumer products and have e-commerce experience",
    "Find investors who led Series A rounds in healthcare/biotech companies",
    "I need investors who understand enterprise SaaS and have experience with B2B marketplaces"
  ]

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>AI-Powered Investor Matching</span>
          </CardTitle>
          <CardDescription>
            Describe your funding needs in natural language and let AI find the most relevant investors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="search-query" className="text-sm font-medium">
              Describe your search criteria
            </label>
            <Textarea
              id="search-query"
              placeholder="e.g., I'm looking for Series A investors in fintech who have invested in similar companies to mine..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleSearch}
              disabled={!query.trim() || mutation.isPending}
              className="flex items-center space-x-2"
            >
              {mutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <SearchIcon className="h-4 w-4" />
                  <span>Find Investors</span>
                </>
              )}
            </Button>
            
            <span className="text-sm text-muted-foreground">
              AI will analyze and match your criteria
            </span>
          </div>

          {mutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to search. Please ensure the API server is running and try again.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Example Searches */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Example Searches</CardTitle>
          <CardDescription>
            Click on any example to try it out
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {examples.map((example, idx) => (
              <button
                key={idx}
                onClick={() => handleExample(example)}
                className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors text-sm"
              >
                "{example}"
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {results && (
        <SearchResults 
          results={results}
          isLoading={mutation.isPending}
        />
      )}
    </div>
  )
}