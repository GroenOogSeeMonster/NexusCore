'use client'

import { motion } from 'framer-motion'
import { 
  GitCommit, 
  Rocket, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User,
  ExternalLink
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Activity {
  id: string
  type: 'deployment' | 'commit' | 'incident' | 'resolved' | 'config'
  title: string
  description: string
  user: string
  service: string
  timestamp: Date
  status: 'success' | 'failed' | 'pending' | 'warning'
}

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'deployment',
    title: 'Production deployment completed',
    description: 'auth-service v2.1.4 deployed successfully',
    user: 'alex.chen',
    service: 'auth-service',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    status: 'success'
  },
  {
    id: '2',
    type: 'incident',
    title: 'High latency detected',
    description: 'API gateway showing increased response times',
    user: 'system',
    service: 'api-gateway',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    status: 'warning'
  },
  {
    id: '3',
    type: 'commit',
    title: 'New feature: OAuth integration',
    description: 'Added support for multiple OAuth providers',
    user: 'sarah.kim',
    service: 'auth-service',
    timestamp: new Date(Date.now() - 32 * 60 * 1000), // 32 minutes ago
    status: 'success'
  },
  {
    id: '4',
    type: 'resolved',
    title: 'Database connection issue resolved',
    description: 'Connection pool optimization fixed timeout issues',
    user: 'mike.johnson',
    service: 'user-service',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    status: 'success'
  },
  {
    id: '5',
    type: 'config',
    title: 'Environment variables updated',
    description: 'Updated rate limiting configuration for production',
    user: 'lisa.wang',
    service: 'api-gateway',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    status: 'success'
  },
  {
    id: '6',
    type: 'deployment',
    title: 'Staging deployment failed',
    description: 'Build failed due to dependency issues',
    user: 'david.martinez',
    service: 'notification-service',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    status: 'failed'
  }
]

interface ActivityItemProps {
  activity: Activity
}

function ActivityItem({ activity }: ActivityItemProps) {
  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'deployment':
        return <Rocket className="w-5 h-5" />
      case 'commit':
        return <GitCommit className="w-5 h-5" />
      case 'incident':
        return <AlertTriangle className="w-5 h-5" />
      case 'resolved':
        return <CheckCircle className="w-5 h-5" />
      case 'config':
        return <Clock className="w-5 h-5" />
      default:
        return <Clock className="w-5 h-5" />
    }
  }

  const getStatusColor = (status: Activity['status']) => {
    switch (status) {
      case 'success':
        return '#10B981'
      case 'failed':
        return '#EF4444'
      case 'pending':
        return '#F59E0B'
      case 'warning':
        return '#F97316'
      default:
        return '#6B7280'
    }
  }

  const getTypeColor = (type: Activity['type']) => {
    switch (type) {
      case 'deployment':
        return '#6B46C1'
      case 'commit':
        return '#0EA5E9'
      case 'incident':
        return '#EF4444'
      case 'resolved':
        return '#10B981'
      case 'config':
        return '#F59E0B'
      default:
        return '#6B7280'
    }
  }

  return (
    <motion.div
      className="flex items-start space-x-4 p-4 rounded-lg hover:bg-white/5 transition-colors group"
      whileHover={{ x: 4 }}
      transition={{ duration: 0.2 }}
    >
      {/* Icon */}
      <div 
        className="flex-shrink-0 p-2 rounded-lg"
        style={{ 
          backgroundColor: `${getTypeColor(activity.type)}15`,
          color: getTypeColor(activity.type)
        }}
      >
        {getIcon(activity.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-medium text-sm truncate">
            {activity.title}
          </h3>
          <div 
            className="flex-shrink-0 w-2 h-2 rounded-full"
            style={{ backgroundColor: getStatusColor(activity.status) }}
          />
        </div>
        
        <p className="text-gray-400 text-sm leading-relaxed">
          {activity.description}
        </p>
        
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3 text-gray-500">
            <div className="flex items-center space-x-1">
              <User className="w-3 h-3" />
              <span className="font-mono">{activity.user}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <span className="font-mono bg-white/10 px-2 py-1 rounded">
                {activity.service}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-gray-500">
            <span className="font-mono">
              {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
            </span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function RecentActivity() {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold text-white">
          Recent Activity
        </h2>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-gray-400 font-mono">
            <div className="w-2 h-2 bg-quantum-green-400 rounded-full animate-pulse" />
            <span>Live updates</span>
          </div>
          
          <motion.button
            className="text-nebula-purple-400 hover:text-nebula-purple-300 text-sm font-mono"
            whileHover={{ scale: 1.05 }}
          >
            View All →
          </motion.button>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {mockActivities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <ActivityItem activity={activity} />
          </motion.div>
        ))}
      </div>

      {/* Activity insights */}
      <motion.div
        className="mt-6 p-4 bg-gradient-to-r from-quantum-green-500/10 to-nebula-purple-500/10 rounded-lg border border-white/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-white">Today's Summary</p>
            <p className="text-xs text-gray-400 font-mono">
              23 deployments • 5 incidents resolved • 89% success rate
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold text-quantum-green-400 font-display">
              +12%
            </div>
            <div className="text-xs text-gray-400 font-mono">
              vs yesterday
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}