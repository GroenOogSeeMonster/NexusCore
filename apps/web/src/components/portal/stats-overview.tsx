'use client'

import { motion } from 'framer-motion'
import { Activity, Zap, Shield, TrendingUp, Server, AlertTriangle } from 'lucide-react'

interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: string
  change: string
  trend: 'up' | 'down' | 'neutral'
  color: string
}

function StatCard({ icon, title, value, change, trend, color }: StatCardProps) {
  const trendColors = {
    up: 'text-quantum-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400'
  }

  return (
    <motion.div
      className="glass rounded-2xl p-6 relative overflow-hidden group"
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      {/* Background glow */}
      <div 
        className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity"
        style={{ background: `radial-gradient(circle at center, ${color}, transparent 70%)` }}
      />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div 
            className="p-3 rounded-xl"
            style={{ backgroundColor: `${color}15`, color }}
          >
            {icon}
          </div>
          
          <div className={`flex items-center space-x-1 text-sm font-mono ${trendColors[trend]}`}>
            {trend === 'up' && <TrendingUp className="w-4 h-4" />}
            {trend === 'down' && <TrendingUp className="w-4 h-4 rotate-180" />}
            <span>{change}</span>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="text-3xl font-bold text-white font-display">
            {value}
          </div>
          <div className="text-sm text-gray-400 font-mono uppercase tracking-wide">
            {title}
          </div>
        </div>
      </div>

      {/* Animated border */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
        <div 
          className="absolute inset-0 rounded-2xl"
          style={{ 
            background: `linear-gradient(45deg, ${color}40, transparent, ${color}40)`,
            backgroundSize: '200% 200%',
            animation: 'gradient-shift 3s ease infinite'
          }}
        />
      </div>
    </motion.div>
  )
}

export function StatsOverview() {
  const stats = [
    {
      icon: <Server className="w-6 h-6" />,
      title: 'Active Services',
      value: '147',
      change: '+12 this week',
      trend: 'up' as const,
      color: '#6B46C1'
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: 'Deployments Today',
      value: '23',
      change: '+156% vs yesterday',
      trend: 'up' as const,
      color: '#0EA5E9'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Avg Response Time',
      value: '127ms',
      change: '-23ms from last hour',
      trend: 'up' as const,
      color: '#10B981'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Security Score',
      value: '94%',
      change: '+2% this week',
      trend: 'up' as const,
      color: '#F59E0B'
    },
    {
      icon: <AlertTriangle className="w-6 h-6" />,
      title: 'Active Incidents',
      value: '2',
      change: '-5 resolved today',
      trend: 'down' as const,
      color: '#EF4444'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Platform Health',
      value: '99.8%',
      change: 'Steady',
      trend: 'neutral' as const,
      color: '#8B5CF6'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-white">
          Platform Overview
        </h2>
        
        <div className="flex items-center space-x-2 text-sm text-gray-400 font-mono">
          <div className="w-2 h-2 bg-quantum-green-400 rounded-full animate-pulse" />
          <span>Real-time data</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}