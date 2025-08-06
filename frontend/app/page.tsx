import { Suspense } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { DashboardSimple } from '@/components/dashboard/dashboard-simple'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'

export default function HomePage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of the investor network with key statistics and insights
          </p>
        </div>
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardSimple />
        </Suspense>
      </div>
    </MainLayout>
  )
}