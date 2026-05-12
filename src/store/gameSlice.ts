import { create } from 'zustand'

interface PlayerStats {
  sanity: number
  health: number
  ammo: number
  maxAmmo: number
  inventory: string[]
  // Posición y orientación para el raycaster (floats, no tiles)
  posX: number
  posY: number
  dirX: number
  dirY: number
  planeX: number
  planeY: number
  mapLevel: number
  kills: number
  // Legado — ya no se usa para render pero puede quedar para lógica
  position: { x: number; y: number }
}

interface Enemy {
  id: string
  type: 'ghost' | 'cultist' | 'shadow'
  position: { x: number; y: number }
  health: number
  isAggro: boolean
}

interface GameState {
  player: PlayerStats
  enemies: Enemy[]
  isGameOver: boolean
  currentScene: string
  dialogueActive: boolean
  jumpScareTriggered: boolean
  message: string | null

  updateSanity: (amount: number) => void
  takeDamage: (amount: number) => void
  shoot: () => boolean
  reload: () => void
  movePlayer: (forward: number, strafe: number, rotate: number, map: number[][]) => void
  triggerJumpScare: () => void
  interact: () => void
  addItem: (item: string) => void
  showMessage: (msg: string) => void
  resetGame: () => void

  addEnemy: (enemy: Enemy) => void
  damageEnemy: (enemyId: string, damage: number) => boolean
  updateEnemies: (playerPos: { x: number; y: number }, map: number[][]) => void
}

const INITIAL_PLAYER: PlayerStats = {
  sanity: 100,
  health: 100,
  ammo: 6,
  maxAmmo: 12,
  inventory: ['📝 Nota: "Huye"', '🔦 Linterna'],
  // Posición inicial en el mapa (dentro de un pasillo libre)
  posX: 1.5,
  posY: 1.5,
  // Mirando hacia la derecha
  dirX: 1,
  dirY: 0,
  // Plano de cámara perpendicular (FOV ~66°)
  planeX: 0,
  planeY: 0.66,
  mapLevel: 1,
  kills: 0,
  position: { x: 1, y: 1 },
}

const INITIAL_ENEMIES: Enemy[] = [
  { id: 'enemy1', type: 'shadow', position: { x: 5, y: 3 }, health: 40, isAggro: false },
  { id: 'enemy2', type: 'ghost', position: { x: 7, y: 5 }, health: 30, isAggro: false },
  { id: 'enemy3', type: 'cultist', position: { x: 11, y: 8 }, health: 50, isAggro: false },
  { id: 'enemy4', type: 'shadow', position: { x: 3, y: 10 }, health: 40, isAggro: false },
]

const MOVE_SPEED = 0.08
const ROT_SPEED = 0.045

export const useGameStore = create<GameState>((set, get) => ({
  player: { ...INITIAL_PLAYER },
  enemies: [...INITIAL_ENEMIES],
  isGameOver: false,
  currentScene: 'laberinto',
  dialogueActive: false,
  jumpScareTriggered: false,
  message: null,

  // ── Movimiento con raycaster ──────────────────────────────────────────────
  movePlayer: (forward, strafe, rotate, map) => set((state) => {
    let { posX, posY, dirX, dirY, planeX, planeY } = state.player

    // Rotación (matriz 2D)
    if (rotate !== 0) {
      const angle = ROT_SPEED * rotate
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const newDirX = dirX * cos - dirY * sin
      const newDirY = dirX * sin + dirY * cos
      const newPlaneX = planeX * cos - planeY * sin
      const newPlaneY = planeX * sin + planeY * cos
      dirX = newDirX
      dirY = newDirY
      planeX = newPlaneX
      planeY = newPlaneY
    }

    // Movimiento hacia adelante / atrás
    if (forward !== 0) {
      const nx = posX + dirX * MOVE_SPEED * forward
      const ny = posY + dirY * MOVE_SPEED * forward
      if (map[Math.floor(posY)]?.[Math.floor(nx)] !== 1) posX = nx
      if (map[Math.floor(ny)]?.[Math.floor(posX)] !== 1) posY = ny
    }

    // Strafe izquierda / derecha
    if (strafe !== 0) {
      const nx = posX + (-dirY) * MOVE_SPEED * strafe
      const ny = posY + dirX * MOVE_SPEED * strafe
      if (map[Math.floor(posY)]?.[Math.floor(nx)] !== 1) posX = nx
      if (map[Math.floor(ny)]?.[Math.floor(posX)] !== 1) posY = ny
    }

    // Reducir cordura levemente al moverse
    if ((forward !== 0 || strafe !== 0) && Math.random() < 0.03) {
      get().updateSanity(-0.5)
    }

    return {
      player: {
        ...state.player,
        posX,
        posY,
        dirX,
        dirY,
        planeX,
        planeY,
        position: { x: Math.floor(posX), y: Math.floor(posY) },
      }
    }
  }),

  // ── Actualizar cordura ────────────────────────────────────────────────────
  updateSanity: (amount) => set((state) => {
    const newSanity = Math.max(0, Math.min(100, state.player.sanity + amount))
    if (newSanity <= 0) {
      return { 
        player: { ...state.player, sanity: 0 }, 
        isGameOver: true,
        message: '💀 HAS PERDIDO LA CORdura 💀'
      }
    }
    return { player: { ...state.player, sanity: newSanity } }
  }),

  // ── Recibir daño ──────────────────────────────────────────────────────────
  takeDamage: (amount) => set((state) => {
    const newHealth = Math.max(0, state.player.health - amount)
    const newSanity = Math.max(0, state.player.sanity - amount * 0.5)
    const isDead = newHealth <= 0
    
    return {
      player: { 
        ...state.player, 
        health: newHealth, 
        sanity: newSanity 
      },
      isGameOver: isDead || state.isGameOver,
      message: isDead ? '💀 HAS MUERTO 💀' : `⚠️ Recibiste ${amount} de daño! ⚠️`,
    }
  }),

  // ── Disparar ──────────────────────────────────────────────────────────────
  shoot: () => {
    const state = get()
    
    // Verificar munición
    if (state.player.ammo <= 0) {
      set({ message: '🔫 ¡Sin munición! Busca más balas 🔫' })
      return false
    }
    
    // Reducir munición
    set({ player: { ...state.player, ammo: state.player.ammo - 1 } })

    const px = state.player.posX
    const py = state.player.posY

    // Encontrar enemigo más cercano
    const closestEnemy = state.enemies.reduce((best, e) => {
      const d = (e.position.x + 0.5 - px) ** 2 + (e.position.y + 0.5 - py) ** 2
      const bd = best ? (best.position.x + 0.5 - px) ** 2 + (best.position.y + 0.5 - py) ** 2 : Infinity
      return d < bd ? e : best
    }, null as Enemy | null)

    if (closestEnemy) {
      const dist = Math.sqrt(
        (closestEnemy.position.x + 0.5 - px) ** 2 +
        (closestEnemy.position.y + 0.5 - py) ** 2
      )
      
      // Solo impacta si está cerca
      if (dist < 4) {
        const damage = 25
        const newHealth = closestEnemy.health - damage
        
        if (newHealth <= 0) {
          // Enemigo eliminado
          set({
            enemies: state.enemies.filter(e => e.id !== closestEnemy.id),
            message: `💀 ¡Eliminaste al ${closestEnemy.type}! +10 cordura 💀`,
            player: { 
              ...state.player, 
              ammo: state.player.ammo - 1, 
              kills: state.player.kills + 1, 
              sanity: Math.min(100, state.player.sanity + 10) 
            },
          })
        } else {
          // Enemigo herido
          set({
            enemies: state.enemies.map(e => 
              e.id === closestEnemy.id ? { ...e, health: newHealth } : e
            ),
            message: `🎯 ¡Impacto! ${closestEnemy.type} tiene ${newHealth} HP 🎯`,
          })
        }
        return true
      }
    }

    set({ message: '💨 Fallaste el disparo... 💨' })
    return false
  },

  // ── Recargar ──────────────────────────────────────────────────────────────
  reload: () => set((state) => {
    const hasAmmo = state.player.inventory.includes('🔫 Munición')
    const needsReload = state.player.ammo < state.player.maxAmmo
    
    if (needsReload && hasAmmo) {
      // Consumir munición del inventario
      const newInventory = state.player.inventory.filter(i => i !== '🔫 Munición')
      return { 
        player: { 
          ...state.player, 
          ammo: state.player.maxAmmo,
          inventory: newInventory
        }, 
        message: '🔄 ¡Recargado! 🔄' 
      }
    } else if (!hasAmmo) {
      return { message: '❌ No tienes munición para recargar ❌' }
    }
    return { message: '🔫 El arma ya está cargada 🔫' }
  }),

  // ── Jump scare ───────────────────────────────────────────────────────────
  triggerJumpScare: () => {
    set({ jumpScareTriggered: true })
    get().updateSanity(-15)
    get().takeDamage(5)
    setTimeout(() => set({ jumpScareTriggered: false }), 1000)
  },

  // ── Interactuar con el entorno ────────────────────────────────────────────
  interact: () => {
    const r = Math.random()
    if (r < 0.25) {
      const items = ['🔫 Munición', '🧪 Poción de cordura', '📝 Pista críptica', '🔋 Batería', '🍪 Galletas']
      get().addItem(items[Math.floor(Math.random() * items.length)])
    } else if (r < 0.45) {
      get().updateSanity(15)
      set({ message: '🧠 Encontraste algo que te da esperanza +15 cordura 🧠' })
    } else if (r < 0.55) {
      get().takeDamage(-5) // Curación
      set({ message: '❤️ Encontraste un botiquín +5 vida ❤️' })
    } else {
      set({ message: '🔍 No hay nada aquí... 🔍' })
    }
  },

  // ── Añadir item al inventario ─────────────────────────────────────────────
  addItem: (item) => set((state) => ({
    player: { ...state.player, inventory: [...state.player.inventory, item] },
    message: `📦 ¡Encontraste: ${item}! 📦`,
  })),

  // ── Mostrar mensaje temporal ──────────────────────────────────────────────
  showMessage: (msg) => {
    set({ message: msg })
    setTimeout(() => set({ message: null }), 3000)
  },

  // ── Reiniciar juego ───────────────────────────────────────────────────────
  resetGame: () => set({
    player: { ...INITIAL_PLAYER },
    enemies: [...INITIAL_ENEMIES],
    isGameOver: false,
    jumpScareTriggered: false,
    message: '🔄 Juego reiniciado. Buena suerte... 🔄',
    currentScene: 'laberinto',
    dialogueActive: false,
  }),

  // ── Añadir enemigo ────────────────────────────────────────────────────────
  addEnemy: (enemy) => set((state) => ({ 
    enemies: [...state.enemies, enemy] 
  })),

  // ── Dañar enemigo específico ──────────────────────────────────────────────
  damageEnemy: (enemyId, damage) => {
    const state = get()
    const enemy = state.enemies.find(e => e.id === enemyId)
    if (!enemy) return false
    
    const newHealth = enemy.health - damage
    if (newHealth <= 0) {
      set({ 
        enemies: state.enemies.filter(e => e.id !== enemyId),
        message: `💀 Enemigo eliminado 💀`
      })
      return true
    }
    set({ 
      enemies: state.enemies.map(e => 
        e.id === enemyId ? { ...e, health: newHealth } : e
      ) 
    })
    return false
  },

  // ── Actualizar IA de enemigos ─────────────────────────────────────────────
  updateEnemies: (playerPos, map) => set((state) => ({
    enemies: state.enemies.map(enemy => {
      const dx = playerPos.x - enemy.position.x
      const dy = playerPos.y - enemy.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const isAggro = distance < 5

      if (isAggro && distance > 0.8) {
        let newX = enemy.position.x
        let newY = enemy.position.y

        // Movimiento hacia el jugador
        if (Math.abs(dx) > Math.abs(dy)) {
          newX += dx > 0 ? 1 : -1
        } else {
          newY += dy > 0 ? 1 : -1
        }

        // Verificar colisiones con paredes y otros enemigos
        const noWallCollision = map[newY]?.[newX] !== 1
        const noEnemyCollision = !state.enemies.some(e => 
          e.id !== enemy.id && e.position.x === newX && e.position.y === newY
        )

        if (noWallCollision && noEnemyCollision) {
          return { ...enemy, position: { x: newX, y: newY }, isAggro }
        }
        
        // Si no puede moverse, al menos ataca si está muy cerca
        if (distance < 1.2) {
          get().takeDamage(8)
          get().updateSanity(-3)
          return { ...enemy, isAggro }
        }
      }

      return { ...enemy, isAggro }
    })
  })),
}))