import { Suspense } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { InvestorProfile } from '@/components/investors/investor-profile'
import { InvestorProfileSkeleton } from '@/components/investors/investor-profile-skeleton'

interface InvestorPageProps {
  params: {
    id: string
  }
}

export default function InvestorPage({ params }: InvestorPageProps) {
  return (
    <MainLayout>
      <Suspense fallback={<InvestorProfileSkeleton />}>
        <InvestorProfile investorId={params.id} />
      </Suspense>
    </MainLayout>
  )
}