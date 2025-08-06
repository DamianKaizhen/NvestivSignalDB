import { Suspense } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { FirmsContent } from '@/components/firms/firms-content'
import { FirmsSkeleton } from '@/components/firms/firms-skeleton'

export default function FirmsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investment Firms</h1>
          <p className="text-muted-foreground">
            Browse investment firms and companies in the network
          </p>
        </div>
        <Suspense fallback={<FirmsSkeleton />}>
          <FirmsContent />
        </Suspense>
      </div>
    </MainLayout>
  )
}