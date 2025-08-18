"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, ArrowRight, TrendingUp, Clock, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useQuery } from "@tanstack/react-query"
import { apiClient, type Investor } from "@/lib/api"

interface GlobalSearchProps {
  className?: string
  placeholder?: string
  showShortcut?: boolean
}

interface SearchHistory {
  query: string
  timestamp: number
}

interface SavedSearch {
  id: string
  name: string
  query: string
  filters: any
  created: number
}

export function GlobalSearch({ 
  className,
  placeholder = "Search investors...",
  showShortcut = true
}: GlobalSearchProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([])
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Load search history and saved searches from localStorage
  useEffect(() => {
    const history = localStorage.getItem("search-history")
    const saved = localStorage.getItem("saved-searches")
    
    if (history) {
      setSearchHistory(JSON.parse(history))
    }
    if (saved) {
      setSavedSearches(JSON.parse(saved))
    }
  }, [])

  // Keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Search suggestions based on query
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["search-suggestions", query],
    queryFn: async () => {
      if (!query || query.length < 2) return { investors: [] }
      
      return apiClient.searchInvestors({
        query,
        limit: 5,
      })
    },
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return

    // Add to search history
    const newHistory = [
      { query: searchQuery, timestamp: Date.now() },
      ...searchHistory.filter(h => h.query !== searchQuery)
    ].slice(0, 10) // Keep last 10 searches

    setSearchHistory(newHistory)
    localStorage.setItem("search-history", JSON.stringify(newHistory))

    // Navigate to search page with query
    const searchParams = new URLSearchParams({ q: searchQuery })
    router.push(`/search?${searchParams.toString()}`)
    setOpen(false)
    setQuery("")
  }

  const handleInvestorSelect = (investor: Investor) => {
    // Add to search history
    const searchQuery = investor.name
    const newHistory = [
      { query: searchQuery, timestamp: Date.now() },
      ...searchHistory.filter(h => h.query !== searchQuery)
    ].slice(0, 10)

    setSearchHistory(newHistory)
    localStorage.setItem("search-history", JSON.stringify(newHistory))

    // Navigate to investor profile
    router.push(`/investors/${investor.id}`)
    setOpen(false)
    setQuery("")
  }

  const recentSearches = searchHistory.slice(0, 5)
  const trendingQueries = [
    "AI investors",
    "Fintech seed investors",
    "Female VCs",
    "Healthcare Series A",
    "Diversity focused investors"
  ]

  return (
    <>
      {/* Search Input Trigger */}
      <div className={cn("relative", className)}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            className="pl-10 pr-20 cursor-pointer"
            readOnly
          />
          {showShortcut && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          )}
        </div>
      </div>

      {/* Search Dialog */}
      <CommandDialog 
        open={open} 
        onOpenChange={setOpen}
        title="Search Investors"
        description="Search for investors, firms, or use AI-powered matching"
        className="max-w-2xl"
      >
        <CommandInput
          placeholder="Search investors, firms, or describe your needs..."
          value={query}
          onValueChange={setQuery}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch(query)
            }
          }}
        />
        <CommandList className="max-h-96">
          {query.length >= 2 ? (
            <>
              {/* Search Results */}
              {suggestions?.investors && suggestions.investors.length > 0 && (
                <CommandGroup heading="Investors">
                  {suggestions.investors.map((investor) => (
                    <CommandItem
                      key={investor.id}
                      value={investor.name}
                      onSelect={() => handleInvestorSelect(investor)}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {investor.name?.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{investor.name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {investor.company && investor.title ? 
                            `${investor.title} at ${investor.company}` :
                            investor.company || investor.title || investor.location
                          }
                        </div>
                      </div>
                      {investor.network_connections && investor.network_connections > 100 && (
                        <Badge variant="secondary" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {investor.network_connections > 1000 ? 
                            `${Math.round(investor.network_connections / 1000)}K` : 
                            investor.network_connections
                          }
                        </Badge>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* AI Search Option */}
              <CommandGroup>
                <CommandItem
                  onSelect={() => handleSearch(query)}
                  className="flex items-center gap-3 px-4 py-3 bg-primary/5"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">AI-Powered Search</div>
                    <div className="text-sm text-muted-foreground">
                      Use natural language to find matching investors
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CommandItem>
              </CommandGroup>

              {isLoading && (
                <CommandEmpty>
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                </CommandEmpty>
              )}

              {!isLoading && suggestions?.investors?.length === 0 && (
                <CommandEmpty>
                  <div className="py-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      No investors found. Try AI-powered search above.
                    </p>
                  </div>
                </CommandEmpty>
              )}
            </>
          ) : (
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <CommandGroup heading="Recent Searches">
                  {recentSearches.map((search, index) => (
                    <CommandItem
                      key={index}
                      value={search.query}
                      onSelect={() => handleSearch(search.query)}
                      className="flex items-center gap-3 px-4 py-2"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">{search.query}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(search.timestamp).toLocaleDateString()}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Saved Searches */}
              {savedSearches.length > 0 && (
                <CommandGroup heading="Saved Searches">
                  {savedSearches.slice(0, 5).map((search) => (
                    <CommandItem
                      key={search.id}
                      value={search.name}
                      onSelect={() => {
                        // Navigate with saved filters
                        const searchParams = new URLSearchParams({
                          q: search.query,
                          ...search.filters
                        })
                        router.push(`/search?${searchParams.toString()}`)
                        setOpen(false)
                      }}
                      className="flex items-center gap-3 px-4 py-2"
                    >
                      <div className="flex h-4 w-4 items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      <span className="flex-1">{search.name}</span>
                      <Badge variant="outline" className="text-xs">
                        Saved
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Trending Searches */}
              <CommandGroup heading="Trending">
                {trendingQueries.map((trending, index) => (
                  <CommandItem
                    key={index}
                    value={trending}
                    onSelect={() => handleSearch(trending)}
                    className="flex items-center gap-3 px-4 py-2"
                  >
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{trending}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}