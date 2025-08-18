import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function FirmProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Firm Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-6">
            {/* Logo */}
            <Skeleton className="h-20 w-20 rounded-xl" />

            {/* Basic Info */}
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="text-center space-y-2">
                    <Skeleton className="h-8 w-16 mx-auto" />
                    <Skeleton className="h-4 w-20 mx-auto" />
                  </div>
                ))}
              </div>

              {/* Additional Info */}
              <div className="flex items-center space-x-6">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>

              {/* Badges */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-16" />
                  <div className="flex space-x-1">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-18" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-16" />
                  <div className="flex space-x-1">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="space-y-6">
        <div className="flex space-x-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-32" />
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}