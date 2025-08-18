"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bookmark, Trash2, Search, Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { SearchFilters } from "@/lib/api"

interface SavedSearch {
  id: string
  name: string
  query: string
  filters: SearchFilters
  created: number
}

interface SavedSearchesProps {
  className?: string
}

export function SavedSearches({ className }: SavedSearchesProps) {
  const router = useRouter()
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [open, setOpen] = useState(false)

  // Load saved searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('saved-searches')
    if (saved) {
      setSavedSearches(JSON.parse(saved))
    }
  }, [])

  const handleLoadSearch = (search: SavedSearch) => {
    // Navigate to search page with saved filters
    const searchParams = new URLSearchParams()
    
    Object.entries(search.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, value.toString())
      }
    })

    router.push(`/search?${searchParams.toString()}`)
    setOpen(false)
  }

  const handleDeleteSearch = (searchId: string) => {
    const updatedSearches = savedSearches.filter(s => s.id !== searchId)
    setSavedSearches(updatedSearches)
    localStorage.setItem('saved-searches', JSON.stringify(updatedSearches))
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = Date.now()
    const diffMs = now - timestamp
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getFilterSummary = (filters: SearchFilters) => {
    const parts = []
    
    if (filters.query) parts.push(`"${filters.query}"`)
    if (filters.location) parts.push(`in ${filters.location}`)
    if (filters.sector) parts.push(`${filters.sector} sector`)
    if (filters.investment_stage) parts.push(`${filters.investment_stage} stage`)
    if (filters.company) parts.push(`at ${filters.company}`)
    if (filters.min_check_size || filters.max_check_size) {
      const min = filters.min_check_size ? `$${(filters.min_check_size / 1000).toFixed(0)}K` : '0'
      const max = filters.max_check_size ? `$${(filters.max_check_size / 1000000).toFixed(1)}M` : '∞'
      parts.push(`${min}-${max} checks`)
    }
    
    return parts.join(' • ') || 'No filters'
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Bookmark className="h-4 w-4 mr-2" />
          Saved Searches ({savedSearches.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Saved Searches</DialogTitle>
          <DialogDescription>
            Load your previously saved search criteria and filters
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {savedSearches.length === 0 ? (
            <div className="text-center py-8">
              <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No saved searches</h3>
              <p className="text-sm text-muted-foreground">
                Save your search criteria for quick access later
              </p>
            </div>
          ) : (
            savedSearches.map((search) => (
              <Card key={search.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{search.name}</CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(search.created)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLoadSearch(search)}
                        className="h-8 px-3"
                      >
                        <Search className="h-3 w-3 mr-1" />
                        Load
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSearch(search.id)}
                        className="h-8 px-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {getFilterSummary(search.filters)}
                    </div>
                    {search.query && (
                      <Badge variant="secondary" className="text-xs">
                        Query: "{search.query}"
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {savedSearches.length > 0 && (
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {savedSearches.length} saved search{savedSearches.length !== 1 ? 'es' : ''}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSavedSearches([])
                localStorage.removeItem('saved-searches')
              }}
            >
              Clear All
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}