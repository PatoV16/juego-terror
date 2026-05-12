
import  { useState,  } from 'react'
import { LaberintoScene } from './scenes/LaberintoScene'
import { GameCanvas } from './engine/GameCanvas'
import { useGameStore } from './store/gameSlice'
import { useAudio } from './hooks/useAudio'
import './index.css'

function App() {
  const [, setGameStarted] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const { resetGame, isGameOver } = useGameStore()
  const { playAmbient } = useAudio()

  const startGame = () => {
    resetGame()
    setShowIntro(false)
    setGameStarted(true)
    playAmbient()
  }

  const restartGame = () => {
    resetGame()
    setGameStarted(true)
    setShowIntro(false)
    playAmbient()
  }

  if (isGameOver) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center p-8">
          <h1 className="text-6xl font-bold text-red-600 mb-4 animate-pulse">GAME OVER</h1>
          <p className="text-gray-400 mb-8">Has perdido la cordura... o tal vez nunca la tuviste</p>
          <button
            onClick={restartGame}
            className="px-8 py-3 bg-red-900/50 border border-red-500 text-red-400 rounded-lg hover:bg-red-900/80 transition-all duration-300 font-mono"
          >
            REINICIAR EXPERIMENTO
          </button>
        </div>
      </div>
    )
  }

  if (showIntro) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center p-8 max-w-2xl">
          <h1 className="text-7xl font-bold text-red-600 mb-8 animate-pulse" style={{ fontFamily: 'monospace' }}>
            C O N T R O L
          </h1>
          <p className="text-gray-400 mb-4 text-lg font-mono">
            "El miedo es solo el principio..."
          </p>
          <p className="text-gray-500 mb-12 text-sm font-mono">
            Un experimento psicológico interactivo
          </p>
          <button
            onClick={startGame}
            className="px-12 py-4 bg-red-900/30 border-2 border-red-500 text-red-400 rounded-lg hover:bg-red-900/60 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300 font-mono text-lg"
          >
            COMENZAR
          </button>
          <div className="mt-8 text-gray-600 text-xs font-mono">
            ⚠️ Recomendamos usar auriculares para una mejor experiencia
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Vista 3D del juego */}
      <GameCanvas width={window.innerWidth} height={window.innerHeight} />
      
      {/* HUD y UI encima del canvas */}
      <LaberintoScene />
    </div>
  )
}

export default App