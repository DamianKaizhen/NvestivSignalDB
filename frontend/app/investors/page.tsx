import { Suspense } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { InvestorsContent } from '@/components/investors/investors-content'
import { InvestorsSkeleton } from '@/components/investors/investors-skeleton'

export default function InvestorsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investors</h1>
          <p className="text-muted-foreground">
            Browse and search through investor profiles with advanced filtering
          </p>
        </div>
        <Suspense fallback={<InvestorsSkeleton />}>
          <InvestorsContent />
        </Suspense>
      </div>
    </MainLayout>
  )
}