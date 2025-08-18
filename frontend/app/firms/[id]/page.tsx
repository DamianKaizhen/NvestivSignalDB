import { Suspense } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { FirmProfile } from '@/components/firms/firm-profile'
import { FirmProfileSkeleton } from '@/components/firms/firm-profile-skeleton'

interface FirmPageProps {
  params: {
    id: string
  }
}

export default function FirmPage({ params }: FirmPageProps) {
  return (
    <MainLayout>
      <Suspense fallback={<FirmProfileSkeleton />}>
        <FirmProfile firmId={params.id} />
      </Suspense>
    </MainLayout>
  )
}

export async function generateMetadata({ params }: FirmPageProps) {
  // This would ideally fetch the firm name from API
  return {
    title: `Firm Profile - Nvestiv`,
    description: `Detailed profile and analytics for investment firm`,
  }
}