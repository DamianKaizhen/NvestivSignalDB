import { MainLayout } from '@/components/layout/main-layout'
import { NavigationTest } from '@/components/layout/navigation-test'
import { NavigationHealth } from '@/components/layout/navigation-health'

export default function TestNavigationPage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Navigation Testing</h1>
          <p className="text-muted-foreground">
            Test all navigation routes and error handling systems
          </p>
        </div>
        
        <NavigationHealth />
        
        <div className="border-t pt-8">
          <h2 className="text-xl font-semibold mb-4">Interactive Navigation Tests</h2>
          <NavigationTest />
        </div>
      </div>
    </MainLayout>
  )
}