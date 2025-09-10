'use client'

import { motion } from 'framer-motion'
import { Sparkles, Zap, Rocket } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-nebula-purple-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-plasma-blue-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-quantum-green-500/10 rounded-full blur-3xl animate-float" />
      </div>

      <div className="relative z-10 text-center space-y-8 px-4 max-w-5xl mx-auto">
        {/* Main title with holographic effect */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-4"
        >
          <motion.div
            className="flex items-center justify-center space-x-2 text-sm font-mono text-quantum-green-400 mb-4"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-4 h-4" />
            <span>SYSTEM STATUS: ONLINE</span>
            <Sparkles className="w-4 h-4" />
          </motion.div>
          
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-bold leading-tight">
            <span className="holographic-text">Dev</span>
            <span className="text-white">Forge</span>
          </h1>
          
          <motion.div
            className="text-xl md:text-2xl text-gray-300 font-light max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            The next-generation platform engineering command center that combines{' '}
            <span className="text-nebula-purple-400 font-medium">AI intelligence</span>,{' '}
            <span className="text-plasma-blue-400 font-medium">3D visualizations</span>, and{' '}
            <span className="text-quantum-green-400 font-medium">seamless integrations</span>
          </motion.div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <motion.button
            className="btn-cosmic group relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10 flex items-center space-x-2">
              <Rocket className="w-5 h-5" />
              <span>Launch Platform</span>
            </span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-quantum-green-500/20 to-plasma-blue-500/20"
              animate={{ x: [-100, 100] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </motion.button>
          
          <motion.button
            className="btn-ghost group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Explore Features</span>
            </span>
          </motion.button>
        </motion.div>

        {/* Stats Preview */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          <div className="glass rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-quantum-green-400 mb-2">10,000+</div>
            <div className="text-sm text-gray-400 font-mono">Services Managed</div>
          </div>
          
          <div className="glass rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-plasma-blue-400 mb-2">99.9%</div>
            <div className="text-sm text-gray-400 font-mono">Platform Uptime</div>
          </div>
          
          <div className="glass rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-nebula-purple-400 mb-2">50ms</div>
            <div className="text-sm text-gray-400 font-mono">Response Time</div>
          </div>
        </motion.div>
      </div>

      {/* Floating elements */}
      <motion.div
        className="absolute top-20 left-20 w-2 h-2 bg-quantum-green-400 rounded-full opacity-60"
        animate={{
          y: [-20, 20, -20],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute bottom-20 right-20 w-3 h-3 bg-plasma-blue-400 rounded-full opacity-40"
        animate={{
          y: [20, -20, 20],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </section>
  )
}