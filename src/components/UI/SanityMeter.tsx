import React, { useEffect, useState } from 'react'
import { useGameStore } from '../../store/gameSlice'
import { motion, AnimatePresence } from 'framer-motion'

export const SanityMeter: React.FC = () => {
  const sanity = useGameStore((state) => state.player.sanity)
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    if (sanity < 30) {
      setShowWarning(true)
      const timer = setTimeout(() => setShowWarning(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [sanity])

  const getSanityColor = () => {
    if (sanity > 70) return 'bg-green-500'
    if (sanity > 30) return 'bg-yellow-500'
    return 'bg-red-500 animate-pulse'
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 p-3 rounded-lg border border-red-900/50">
      <div className="text-xs text-red-400 mb-1">SALUD MENTAL</div>
      <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getSanityColor()}`}
          style={{ width: `${sanity}%` }}
        />
      </div>
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -top-8 right-0 text-red-500 text-xs whitespace-nowrap"
          >
            ⚠️ ESTÁS PERDIENDO LA CORDURA ⚠️
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}