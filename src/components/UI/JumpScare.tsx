import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameSlice'
import { useAudio } from '../../hooks/useAudio'

const scareImages = [
  '/assets/jumpscares/face1.png',
  '/assets/jumpscares/face2.png',
  '/assets/jumpscares/demon.png',
]

export const JumpScareManager: React.FC = () => {
  const { jumpScareTriggered, triggerJumpScare } = useGameStore()
  const { playJumpScare } = useAudio()
  const [currentImage, setCurrentImage] = useState('')

  useEffect(() => {
    // Generar sustos aleatorios basados en cordura y tiempo
    const interval = setInterval(() => {
      const sanity = useGameStore.getState().player.sanity
      const probability = Math.max(0.001, (100 - sanity) / 5000)
      
      if (Math.random() < probability && !jumpScareTriggered) {
        const randomImage = scareImages[Math.floor(Math.random() * scareImages.length)]
        setCurrentImage(randomImage)
        triggerJumpScare()
        playJumpScare()
        
        // Vibración en móviles
        if (navigator.vibrate) navigator.vibrate(500)
      }
    }, 30000) // Cada 30 segundos

    return () => clearInterval(interval)
  }, [jumpScareTriggered, triggerJumpScare, playJumpScare])

  return (
    <AnimatePresence>
      {jumpScareTriggered && (
        <motion.div
          initial={{ opacity: 0, scale: 1.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
        >
          <motion.img
            src={currentImage}
            alt="JUMP SCARE"
            className="w-full h-full object-cover"
            animate={{
              scale: [1, 1.05, 1],
              filter: ['brightness(1)', 'brightness(2)', 'brightness(1)']
            }}
            transition={{ duration: 0.3 }}
          />
          <div className="absolute inset-0 bg-red-500/20 animate-pulse" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}