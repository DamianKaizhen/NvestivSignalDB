import { Suspense } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { NetworkContent } from '@/components/network/network-content'
import { NetworkSkeleton } from '@/components/network/network-skeleton'

export default function NetworkPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Network Explorer</h1>
          <p className="text-muted-foreground">
            Explore relationships and connections within the investor network
          </p>
        </div>
        <Suspense fallback={<NetworkSkeleton />}>
          <NetworkContent />
        </Suspense>
      </div>
    </MainLayout>
  )
}