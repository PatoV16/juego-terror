import React, { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameSlice'
import { useAudio } from '../hooks/useAudio'
import { motion, AnimatePresence } from 'framer-motion'
import { GameCanvas, MAP } from '../engine/GameCanvas'

export const LaberintoScene: React.FC = () => {
  const { playFootstep, playAmbient, playGunshot, playWhisper, playReload } = useAudio()

  const keysRef     = useRef({ w: false, s: false, a: false, d: false, q: false })
  const lastShotRef = useRef(0)

  const [showDialogue, setShowDialogue] = useState(true)
  const [, forceUpdate] = useState(0)

  // Re-render HUD cada 100ms
  useEffect(() => {
    const id = setInterval(() => forceUpdate(n => n + 1), 100)
    return () => clearInterval(id)
  }, [])

  // Música + mensaje inicial
  useEffect(() => {
    playAmbient()
    setTimeout(() => {
      useGameStore.getState().showMessage(
        'W/S avanzar · A/D rotar · ESPACIO disparar · R recargar · E interactuar'
      )
    }, 1500)
  }, [])

  // IA enemigos
  useEffect(() => {
    const id = setInterval(() => {
      const state = useGameStore.getState()
      state.updateEnemies(state.player.position, MAP)
    }, 500)
    return () => clearInterval(id)
  }, [])

  // Ocultar diálogo
  useEffect(() => {
    const t = setTimeout(() => setShowDialogue(false), 5000)
    return () => clearTimeout(t)
  }, [])

  // Jump scares
  useEffect(() => {
    const id = setInterval(() => {
      const state = useGameStore.getState()
      if (state.player.sanity < 50 && Math.random() < 0.02) {
        state.triggerJumpScare()
        playWhisper()
      }
    }, 10000)
    return () => clearInterval(id)
  }, [])

  // ── Teclas + movimiento — todo en un único useEffect con deps vacías ─────────
  useEffect(() => {
    // Loop de movimiento — llama al store directamente, sin closures de React
    const moveId = setInterval(() => {
      const k = keysRef.current
      const forward = (k.w ? 1 : 0) - (k.s ? 1 : 0)
      const rotate  = (k.d ? 1 : 0) - (k.a ? 1 : 0)
      const strafe  = (k.q ? -1 : 0)

      if (forward !== 0 || rotate !== 0 || strafe !== 0) {
        useGameStore.getState().movePlayer(forward, strafe, rotate, MAP)
        if (forward !== 0) playFootstep()
      }
    }, 16)

    const down = (e: KeyboardEvent) => {
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
      }

      const k = e.key.toLowerCase()

      if (k === 'w') { keysRef.current.w = true; return }
      if (k === 's') { keysRef.current.s = true; return }
      if (k === 'a') { keysRef.current.a = true; return }
      if (k === 'd') { keysRef.current.d = true; return }
      if (k === 'q') { keysRef.current.q = true; return }

      if (k === ' ') {
        const now = Date.now()
        if (now - lastShotRef.current > 250) {
          lastShotRef.current = now
          useGameStore.getState().shoot()
          playGunshot()
        }
        return
      }

      if (k === 'r' && !e.ctrlKey) { useGameStore.getState().reload();   return }
      if (k === 'e')               { useGameStore.getState().interact();  return }
    }

    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === 'w') keysRef.current.w = false
      if (k === 's') keysRef.current.s = false
      if (k === 'a') keysRef.current.a = false
      if (k === 'd') keysRef.current.d = false
      if (k === 'q') keysRef.current.q = false
    }

    window.addEventListener('keydown', down)
    window.addEventListener('keyup',   up)
    window.focus()

    return () => {
      clearInterval(moveId)
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup',   up)
    }
  }, []) // deps vacías — se monta una vez, sin closures problemáticos

  const p = useGameStore.getState().player
  const message = useGameStore.getState().message

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">

      {/* Título */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-red-500 text-xs font-mono z-20 tracking-widest">
        LABERINTO — NIVEL {p.mapLevel}
      </div>

      {/* Stats */}
      <div className="absolute top-12 left-4 bg-black/75 border border-red-900/50 p-3 rounded-lg text-sm font-mono z-20 space-y-2">
        <div>
          <span className="text-green-400">❤️ {p.health}%</span>
          <div className="w-28 h-1.5 bg-gray-800 rounded mt-1">
            <div
              className="h-full rounded transition-all duration-300"
              style={{
                width: `${p.health}%`,
                background: p.health > 50 ? '#22c55e' : p.health > 25 ? '#f97316' : '#ef4444',
              }}
            />
          </div>
        </div>
        <div>
          <span className={p.sanity > 50 ? 'text-blue-400' : 'text-red-400 animate-pulse'}>
            🧠 {Math.floor(p.sanity)}%
          </span>
          <div className="w-28 h-1.5 bg-gray-800 rounded mt-1">
            <div
              className="h-full rounded transition-all duration-300"
              style={{
                width: `${p.sanity}%`,
                background: p.sanity > 50 ? '#60a5fa' : p.sanity > 25 ? '#f97316' : '#ef4444',
              }}
            />
          </div>
        </div>
        <div className="text-yellow-400">🔫 {p.ammo}/{p.maxAmmo}</div>
        <div className="text-purple-400">💀 {p.kills} kills</div>
      </div>

      {/* Inventario */}
      <div className="absolute top-12 right-4 bg-black/75 border border-red-900/50 p-3 rounded-lg text-xs font-mono z-20 max-w-[160px]">
        <div className="text-gray-500 mb-1 tracking-widest">INVENTARIO</div>
        {p.inventory.map((item, i) => (
          <div key={i} className="text-gray-300 truncate">{item}</div>
        ))}
      </div>

      {/* Overlay daño */}
      {p.health < 50 && (
        <div
          className={`absolute inset-0 pointer-events-none z-10 ${p.health < 25 ? 'animate-pulse' : ''}`}
          style={{
            background: `radial-gradient(ellipse at center, transparent 40%, rgba(180,0,0,${(50 - p.health) / 120}) 100%)`
          }}
        />
      )}

      {/* Overlay cordura */}
      {p.sanity < 30 && (
        <div className="absolute inset-0 pointer-events-none z-10 backdrop-blur-[1px]" />
      )}

      {/* Mensajes */}
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/90 border border-red-500/70 px-5 py-2 rounded-lg z-30 pointer-events-none"
          >
            <p className="text-red-400 text-sm font-mono whitespace-nowrap">{message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Diálogo inicial */}
      <AnimatePresence>
        {showDialogue && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/90 border border-red-900 p-4 rounded-lg max-w-sm text-center z-20 pointer-events-none"
          >
            <p className="text-red-400 text-sm font-mono leading-relaxed">
              "Despiertas en un lugar desconocido..."<br />
              "Algo te observa en la oscuridad..."<br />
              <span className="text-yellow-400">W/S avanzar · A/D rotar</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advertencia cordura */}
      <AnimatePresence>
        {p.sanity < 30 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 text-red-500 text-xs font-mono animate-pulse z-20 tracking-widest pointer-events-none"
          >
            ⚠ ESTÁS PERDIENDO LA CORDURA ⚠
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controles */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 border border-gray-800 px-4 py-2 rounded-lg text-white text-xs font-mono z-20 flex gap-3 pointer-events-none">
        <span><kbd className="px-1.5 py-0.5 bg-gray-800 rounded">W/S</kbd> Avanzar</span>
        <span><kbd className="px-1.5 py-0.5 bg-gray-800 rounded">A/D</kbd> Rotar</span>
        <span><kbd className="px-1.5 py-0.5 bg-gray-800 rounded">SPC</kbd> Disparar</span>
        <span><kbd className="px-1.5 py-0.5 bg-gray-800 rounded">R</kbd> Recargar</span>
        <span><kbd className="px-1.5 py-0.5 bg-gray-800 rounded">E</kbd> Interactuar</span>
      </div>

    </div>
  )
}