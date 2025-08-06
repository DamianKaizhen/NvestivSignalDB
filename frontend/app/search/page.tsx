import { Suspense } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { SearchContent } from '@/components/search/search-content'
import { SearchSkeleton } from '@/components/search/search-skeleton'

export default function SearchPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Search</h1>
          <p className="text-muted-foreground">
            Use AI-powered matching to find investors that align with your specific needs
          </p>
        </div>
        <Suspense fallback={<SearchSkeleton />}>
          <SearchContent />
        </Suspense>
      </div>
    </MainLayout>
  )
}