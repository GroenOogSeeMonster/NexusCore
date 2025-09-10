'use client'

import { motion } from 'framer-motion'
import { 
  Rocket, 
  GitBranch, 
  Database, 
  Settings, 
  Play, 
  Shield,
  Zap,
  CloudLightning,
  RefreshCw
} from 'lucide-react'

interface ActionCardProps {
  icon: React.ReactNode
  title: string
  description: string
  color: string
  onClick: () => void
  disabled?: boolean
}

function ActionCard({ icon, title, description, color, onClick, disabled = false }: ActionCardProps) {
  return (
    <motion.button
      className={`glass rounded-xl p-6 text-left w-full group relative overflow-hidden ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'
      }`}
      whileHover={!disabled ? { y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
    >
      {/* Background glow effect */}
      <div 
        className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
        style={{ background: `radial-gradient(circle at center, ${color}, transparent 70%)` }}
      />
      
      <div className="relative z-10 space-y-3">
        <div 
          className="inline-flex p-3 rounded-lg"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
        
        <div className="space-y-1">
          <h3 className="font-display font-semibold text-white text-lg">
            {title}
          </h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Animated border on hover */}
      <motion.div
        className="absolute inset-0 rounded-xl border-2 border-transparent"
        whileHover={!disabled ? {
          borderColor: `${color}60`,
          boxShadow: `0 0 20px ${color}40`
        } : {}}
        transition={{ duration: 0.2 }}
      />
    </motion.button>
  )
}

export function QuickActions() {
  const handleAction = (actionName: string) => {
    console.log(`Executing action: ${actionName}`)
    // In a real app, this would trigger the actual action
  }

  const actions = [
    {
      icon: <Rocket className="w-6 h-6" />,
      title: 'Deploy Service',
      description: 'Deploy your latest changes to staging or production environments',
      color: '#6B46C1',
      onClick: () => handleAction('deploy')
    },
    {
      icon: <GitBranch className="w-6 h-6" />,
      title: 'Create Branch',
      description: 'Create a new feature branch from the main repository',
      color: '#0EA5E9',
      onClick: () => handleAction('create-branch')
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: 'Run Migration',
      description: 'Execute database migrations safely across environments',
      color: '#10B981',
      onClick: () => handleAction('migration')
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: 'Update Config',
      description: 'Modify service configuration with validation and rollback',
      color: '#F59E0B',
      onClick: () => handleAction('update-config')
    },
    {
      icon: <Play className="w-6 h-6" />,
      title: 'Scale Service',
      description: 'Horizontally scale your services based on traffic patterns',
      color: '#8B5CF6',
      onClick: () => handleAction('scale')
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Security Scan',
      description: 'Run comprehensive security scans on your services',
      color: '#EF4444',
      onClick: () => handleAction('security-scan')
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Performance Test',
      description: 'Execute load testing to validate service performance',
      color: '#F97316',
      onClick: () => handleAction('perf-test')
    },
    {
      icon: <CloudLightning className="w-6 h-6" />,
      title: 'Chaos Test',
      description: 'Run chaos engineering experiments to test resilience',
      color: '#06B6D4',
      onClick: () => handleAction('chaos-test')
    },
    {
      icon: <RefreshCw className="w-6 h-6" />,
      title: 'Sync Services',
      description: 'Synchronize service catalog with external repositories',
      color: '#84CC16',
      onClick: () => handleAction('sync')
    }
  ]

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold text-white">
          Quick Actions
        </h2>
        
        <motion.button
          className="text-nebula-purple-400 hover:text-nebula-purple-300 text-sm font-mono"
          whileHover={{ scale: 1.05 }}
        >
          View All →
        </motion.button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <ActionCard {...action} />
          </motion.div>
        ))}
      </div>

      {/* Voice command hint */}
      <motion.div
        className="mt-6 p-4 bg-gradient-to-r from-nebula-purple-500/10 to-plasma-blue-500/10 rounded-lg border border-white/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-quantum-green-400 rounded-full animate-pulse" />
          <p className="text-sm text-gray-300 font-mono">
            💡 Try voice commands: "Deploy auth service to staging" or "Show me critical incidents"
          </p>
        </div>
      </motion.div>
    </div>
  )
}