import { HeroSection } from '@/components/portal/hero-section'
import { ServiceGalaxy } from '@/components/3d/service-galaxy'
import { QuickActions } from '@/components/portal/quick-actions'
import { StatsOverview } from '@/components/portal/stats-overview'
import { RecentActivity } from '@/components/portal/recent-activity'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-deep-space-900">
      {/* Hero Section */}
      <HeroSection />
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Overview */}
        <StatsOverview />
        
        {/* Quick Actions & 3D Service Galaxy */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <QuickActions />
          <div className="relative">
            <div className="glass rounded-3xl p-6 h-96">
              <h3 className="text-xl font-display font-semibold text-white mb-4">
                Service Galaxy
              </h3>
              <ServiceGalaxy />
            </div>
          </div>
        </div>
        
        {/* Recent Activity */}
        <RecentActivity />
      </div>
    </div>
  )
}