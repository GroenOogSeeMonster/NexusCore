'use client'

import { Suspense, useRef, useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
// Use deep imports to avoid pulling the @react-three/drei barrel (which includes Bvh)
import { OrbitControls } from '@react-three/drei/core/OrbitControls'
import { Stars } from '@react-three/drei/core/Stars'
import { Html } from '@react-three/drei/web/Html'
import * as THREE from 'three'
import { motion } from 'framer-motion'

// Mock service data - in real app this would come from API
const mockServices = [
  {
    id: '1',
    name: 'auth-service',
    type: 'SERVICE',
    position: { x: 0, y: 0, z: 0 },
    color: '#6B46C1',
    size: 2,
    language: ['TypeScript'],
    framework: ['Express'],
    health: 'healthy',
    connections: ['user-service', 'notification-service']
  },
  {
    id: '2',
    name: 'user-service',
    type: 'SERVICE',
    position: { x: 5, y: 2, z: 3 },
    color: '#0EA5E9',
    size: 1.8,
    language: ['Go'],
    framework: ['Gin'],
    health: 'warning',
    connections: ['database']
  },
  {
    id: '3',
    name: 'notification-service',
    type: 'SERVICE',
    position: { x: -3, y: -1, z: 4 },
    color: '#10B981',
    size: 1.5,
    language: ['Python'],
    framework: ['FastAPI'],
    health: 'healthy',
    connections: ['message-queue']
  },
  {
    id: '4',
    name: 'database',
    type: 'DATABASE',
    position: { x: 8, y: 0, z: 0 },
    color: '#F59E0B',
    size: 2.2,
    language: ['SQL'],
    framework: ['PostgreSQL'],
    health: 'healthy',
    connections: []
  },
  {
    id: '5',
    name: 'message-queue',
    type: 'QUEUE',
    position: { x: -6, y: 3, z: -2 },
    color: '#EF4444',
    size: 1.6,
    language: [],
    framework: ['Redis'],
    health: 'healthy',
    connections: []
  },
  {
    id: '6',
    name: 'api-gateway',
    type: 'API_GATEWAY',
    position: { x: -2, y: 5, z: 1 },
    color: '#8B5CF6',
    size: 2.5,
    language: ['JavaScript'],
    framework: ['Kong'],
    health: 'critical',
    connections: ['auth-service', 'user-service']
  }
]

interface ServiceNodeProps {
  service: typeof mockServices[0]
  onClick: (service: typeof mockServices[0]) => void
  isSelected: boolean
}

function ServiceNode({ service, onClick, isSelected }: ServiceNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const glowRef = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = service.position.y + Math.sin(state.clock.elapsedTime + service.position.x) * 0.2
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
    }
    
    if (glowRef.current) {
      // Pulsing glow effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1
      glowRef.current.scale.setScalar(scale)
    }
  })

  const getServiceGeometry = (type: string) => {
    switch (type) {
      case 'DATABASE':
        return <cylinderGeometry args={[1, 1, 0.5, 8]} />
      case 'QUEUE':
        return <boxGeometry args={[1.5, 0.5, 1.5]} />
      case 'API_GATEWAY':
        return <boxGeometry args={[2, 0.3, 2]} />
      default:
        return <sphereGeometry args={[1, 32, 32]} />
    }
  }

  const healthColor = {
    healthy: '#10B981',
    warning: '#F59E0B',
    critical: '#EF4444'
  }[service.health]

  return (
    <group position={[service.position.x, service.position.y, service.position.z]}>
      {/* Glow effect */}
      <mesh ref={glowRef} scale={service.size * 1.3}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial 
          color={service.color} 
          transparent 
          opacity={0.1} 
        />
      </mesh>

      {/* Main service node */}
      <mesh 
        ref={meshRef}
        scale={service.size}
        onClick={() => onClick(service)}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default'
        }}
      >
        {getServiceGeometry(service.type)}
        <meshStandardMaterial 
          color={service.color}
          emissive={service.color}
          emissiveIntensity={isSelected ? 0.3 : 0.1}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Health indicator */}
      <mesh position={[0, service.size + 0.3, 0]} scale={0.3}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color={healthColor} />
      </mesh>

      {/* Service name label */}
      <Html distanceFactor={20} position={[0, -service.size - 1, 0]} center>
        <div className="glass rounded-lg px-3 py-1 text-sm font-mono text-white whitespace-nowrap pointer-events-none">
          {service.name}
        </div>
      </Html>
    </group>
  )
}

interface ConnectionLineProps {
  from: typeof mockServices[0]
  to: typeof mockServices[0]
}

function ConnectionLine({ from, to }: ConnectionLineProps) {
  const ref = useRef<THREE.BufferGeometry>(null!)
  
  const points = useMemo(() => {
    const fromPos = new THREE.Vector3(from.position.x, from.position.y, from.position.z)
    const toPos = new THREE.Vector3(to.position.x, to.position.y, to.position.z)
    
    // Create a curved path
    const midPoint = fromPos.clone().lerp(toPos, 0.5)
    midPoint.y += 1 // Add some curve
    
    const curve = new THREE.QuadraticBezierCurve3(fromPos, midPoint, toPos)
    return curve.getPoints(50)
  }, [from.position, to.position])

  useFrame((state) => {
    if (ref.current) {
      // Animate the line with flowing particles effect
      const positions = ref.current.attributes.position
      if (positions) {
        const time = state.clock.elapsedTime
        for (let i = 0; i < positions.count; i++) {
          const alpha = i / positions.count
          const wave = Math.sin(time * 2 + alpha * Math.PI * 4) * 0.1
          positions.setY(i, points[i].y + wave)
        }
        positions.needsUpdate = true
      }
    }
  })

  return (
    <line>
      <bufferGeometry ref={ref}>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial 
        color="#6B46C1" 
        transparent 
        opacity={0.6}
        linewidth={2}
      />
    </line>
  )
}

function ServiceConnections() {
  const connections = useMemo(() => {
    const result: Array<{ from: typeof mockServices[0], to: typeof mockServices[0] }> = []
    
    mockServices.forEach(service => {
      service.connections.forEach(connectionName => {
        const targetService = mockServices.find(s => s.name === connectionName)
        if (targetService) {
          result.push({ from: service, to: targetService })
        }
      })
    })
    
    return result
  }, [])

  return (
    <>
      {connections.map((connection, index) => (
        <ConnectionLine 
          key={index} 
          from={connection.from} 
          to={connection.to} 
        />
      ))}
    </>
  )
}

function ServiceGalaxyScene() {
  const [selectedService, setSelectedService] = useState<typeof mockServices[0] | null>(null)

  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.2} />
      
      {/* Main directional light */}
      <directionalLight 
        position={[10, 10, 10]} 
        intensity={1} 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      {/* Point lights for dramatic effect */}
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#6B46C1" />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#0EA5E9" />
      
      {/* Stars background */}
      <Stars 
        radius={100} 
        depth={50} 
        count={5000} 
        factor={4} 
        saturation={0} 
        fade 
      />

      {/* Service nodes */}
      {mockServices.map((service) => (
        <ServiceNode
          key={service.id}
          service={service}
          onClick={setSelectedService}
          isSelected={selectedService?.id === service.id}
        />
      ))}

      {/* Service connections */}
      <ServiceConnections />

      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        autoRotate={true}
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI}
        minDistance={5}
        maxDistance={50}
      />
    </>
  )
}

interface ServiceDetailProps {
  service: typeof mockServices[0] | null
  onClose: () => void
}

function ServiceDetail({ service, onClose }: ServiceDetailProps) {
  if (!service) return null

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="absolute top-4 right-4 w-80 glass rounded-2xl p-6 z-10"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-display font-bold text-white">
          {service.name}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ×
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 font-mono uppercase tracking-wide">
            Type
          </label>
          <div className="text-white font-medium">{service.type}</div>
        </div>

        <div>
          <label className="text-sm text-gray-400 font-mono uppercase tracking-wide">
            Health Status
          </label>
          <div className={`font-medium capitalize ${
            service.health === 'healthy' ? 'text-quantum-green-400' :
            service.health === 'warning' ? 'text-solar-flare-400' :
            'text-red-400'
          }`}>
            {service.health}
          </div>
        </div>

        {service.language.length > 0 && (
          <div>
            <label className="text-sm text-gray-400 font-mono uppercase tracking-wide">
              Language
            </label>
            <div className="flex flex-wrap gap-2 mt-1">
              {service.language.map((lang) => (
                <span 
                  key={lang}
                  className="px-2 py-1 text-xs bg-nebula-purple-500/20 text-nebula-purple-300 rounded-md font-mono"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}

        {service.framework.length > 0 && (
          <div>
            <label className="text-sm text-gray-400 font-mono uppercase tracking-wide">
              Framework
            </label>
            <div className="flex flex-wrap gap-2 mt-1">
              {service.framework.map((fw) => (
                <span 
                  key={fw}
                  className="px-2 py-1 text-xs bg-plasma-blue-500/20 text-plasma-blue-300 rounded-md font-mono"
                >
                  {fw}
                </span>
              ))}
            </div>
          </div>
        )}

        {service.connections.length > 0 && (
          <div>
            <label className="text-sm text-gray-400 font-mono uppercase tracking-wide">
              Dependencies
            </label>
            <div className="space-y-1 mt-1">
              {service.connections.map((conn) => (
                <div 
                  key={conn}
                  className="text-sm text-white font-mono bg-white/5 rounded px-2 py-1"
                >
                  {conn}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function ServiceGalaxy() {
  const [selectedService, setSelectedService] = useState<typeof mockServices[0] | null>(null)

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-deep-space-900 to-deep-space-950 rounded-xl overflow-hidden">
      <Canvas
        camera={{ position: [15, 10, 15], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ServiceGalaxyScene />
        </Suspense>
      </Canvas>

      {/* Controls overlay */}
      <div className="absolute bottom-4 left-4 glass rounded-lg p-3 text-sm text-gray-300 font-mono">
        <div>🖱️ Drag to rotate</div>
        <div>🔍 Scroll to zoom</div>
        <div>👆 Click nodes for details</div>
      </div>

      {/* Service detail panel */}
      <ServiceDetail 
        service={selectedService} 
        onClose={() => setSelectedService(null)} 
      />
    </div>
  )
}