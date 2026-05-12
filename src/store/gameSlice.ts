import { create } from 'zustand'

interface PlayerStats {
  sanity: number
  health: number
  ammo: number
  maxAmmo: number
  inventory: string[]
  // Position and orientation for raycaster
  posX: number
  posY: number
  dirX: number
  dirY: number
  planeX: number
  planeY: number
  mapLevel: number
  kills: number
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
  inventory: ['📝 Note: "Run Away"', '🔦 Flashlight'],
  posX: 1.5,
  posY: 1.5,
  dirX: 1,
  dirY: 0,
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
  currentScene: 'maze',
  dialogueActive: false,
  jumpScareTriggered: false,
  message: null,

  movePlayer: (forward, strafe, rotate, map) => set((state) => {
    let { posX, posY, dirX, dirY, planeX, planeY } = state.player

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

    if (forward !== 0) {
      const nx = posX + dirX * MOVE_SPEED * forward
      const ny = posY + dirY * MOVE_SPEED * forward

      if (map[Math.floor(posY)]?.[Math.floor(nx)] !== 1) posX = nx
      if (map[Math.floor(ny)]?.[Math.floor(posX)] !== 1) posY = ny
    }

    if (strafe !== 0) {
      const nx = posX + (-dirY) * MOVE_SPEED * strafe
      const ny = posY + dirX * MOVE_SPEED * strafe

      if (map[Math.floor(posY)]?.[Math.floor(nx)] !== 1) posX = nx
      if (map[Math.floor(ny)]?.[Math.floor(posX)] !== 1) posY = ny
    }

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
        position: {
          x: Math.floor(posX),
          y: Math.floor(posY),
        },
      },
    }
  }),

  updateSanity: (amount) => set((state) => {
    const newSanity = Math.max(0, Math.min(100, state.player.sanity + amount))

    if (newSanity <= 0) {
      return {
        player: { ...state.player, sanity: 0 },
        isGameOver: true,
        message: '💀 YOU LOST YOUR SANITY 💀',
      }
    }

    return {
      player: {
        ...state.player,
        sanity: newSanity,
      },
    }
  }),

  takeDamage: (amount) => set((state) => {
    const newHealth = Math.max(0, state.player.health - amount)
    const newSanity = Math.max(0, state.player.sanity - amount * 0.5)
    const isDead = newHealth <= 0

    return {
      player: {
        ...state.player,
        health: newHealth,
        sanity: newSanity,
      },
      isGameOver: isDead || state.isGameOver,
      message: isDead
        ? '💀 YOU DIED 💀'
        : `⚠️ You received ${amount} damage! ⚠️`,
    }
  }),

  shoot: () => {
    const state = get()

    if (state.player.ammo <= 0) {
      set({
        message: '🔫 Out of ammo! Find more bullets 🔫',
      })
      return false
    }

    set({
      player: {
        ...state.player,
        ammo: state.player.ammo - 1,
      },
    })

    const px = state.player.posX
    const py = state.player.posY

    const closestEnemy = state.enemies.reduce((best, e) => {
      const d =
        (e.position.x + 0.5 - px) ** 2 +
        (e.position.y + 0.5 - py) ** 2

      const bd = best
        ? (best.position.x + 0.5 - px) ** 2 +
          (best.position.y + 0.5 - py) ** 2
        : Infinity

      return d < bd ? e : best
    }, null as Enemy | null)

    if (closestEnemy) {
      const dist = Math.sqrt(
        (closestEnemy.position.x + 0.5 - px) ** 2 +
        (closestEnemy.position.y + 0.5 - py) ** 2
      )

      if (dist < 4) {
        const damage = 25
        const newHealth = closestEnemy.health - damage

        if (newHealth <= 0) {
          set({
            enemies: state.enemies.filter(
              e => e.id !== closestEnemy.id
            ),
            message: `💀 You killed the ${closestEnemy.type}! +10 sanity 💀`,
            player: {
              ...state.player,
              ammo: state.player.ammo - 1,
              kills: state.player.kills + 1,
              sanity: Math.min(
                100,
                state.player.sanity + 10
              ),
            },
          })
        } else {
          set({
            enemies: state.enemies.map(e =>
              e.id === closestEnemy.id
                ? { ...e, health: newHealth }
                : e
            ),
            message: `🎯 Hit! ${closestEnemy.type} has ${newHealth} HP left 🎯`,
          })
        }

        return true
      }
    }

    set({
      message: '💨 You missed the shot... 💨',
    })

    return false
  },

  reload: () => set((state) => {
    const hasAmmo = state.player.inventory.includes('🔫 Ammo')
    const needsReload = state.player.ammo < state.player.maxAmmo

    if (needsReload && hasAmmo) {
      const newInventory = state.player.inventory.filter(
        i => i !== '🔫 Ammo'
      )

      return {
        player: {
          ...state.player,
          ammo: state.player.maxAmmo,
          inventory: newInventory,
        },
        message: '🔄 Reloaded! 🔄',
      }
    } else if (!hasAmmo) {
      return {
        message: '❌ You have no ammo to reload ❌',
      }
    }

    return {
      message: '🔫 Weapon already loaded 🔫',
    }
  }),

  triggerJumpScare: () => {
    set({ jumpScareTriggered: true })

    get().updateSanity(-15)
    get().takeDamage(5)

    setTimeout(() => {
      set({ jumpScareTriggered: false })
    }, 1000)
  },

  interact: () => {
    const r = Math.random()

    if (r < 0.25) {
      const items = [
        '🔫 Ammo',
        '🧪 Sanity Potion',
        '📝 Cryptic Note',
        '🔋 Battery',
        '🍪 Cookies',
      ]

      get().addItem(
        items[Math.floor(Math.random() * items.length)]
      )
    } else if (r < 0.45) {
      get().updateSanity(15)

      set({
        message: '🧠 You found something hopeful +15 sanity 🧠',
      })
    } else if (r < 0.55) {
      get().takeDamage(-5)

      set({
        message: '❤️ You found a medkit +5 health ❤️',
      })
    } else {
      set({
        message: '🔍 There is nothing here... 🔍',
      })
    }
  },

  addItem: (item) => set((state) => ({
    player: {
      ...state.player,
      inventory: [...state.player.inventory, item],
    },
    message: `📦 You found: ${item}! 📦`,
  })),

  showMessage: (msg) => {
    set({ message: msg })

    setTimeout(() => {
      set({ message: null })
    }, 3000)
  },

  resetGame: () => set({
    player: { ...INITIAL_PLAYER },
    enemies: [...INITIAL_ENEMIES],
    isGameOver: false,
    jumpScareTriggered: false,
    message: '🔄 Game restarted. Good luck... 🔄',
    currentScene: 'maze',
    dialogueActive: false,
  }),

  addEnemy: (enemy) => set((state) => ({
    enemies: [...state.enemies, enemy],
  })),

  damageEnemy: (enemyId, damage) => {
    const state = get()

    const enemy = state.enemies.find(
      e => e.id === enemyId
    )

    if (!enemy) return false

    const newHealth = enemy.health - damage

    if (newHealth <= 0) {
      set({
        enemies: state.enemies.filter(
          e => e.id !== enemyId
        ),
        message: '💀 Enemy eliminated 💀',
      })

      return true
    }

    set({
      enemies: state.enemies.map(e =>
        e.id === enemyId
          ? { ...e, health: newHealth }
          : e
      ),
    })

    return false
  },

  updateEnemies: (playerPos, map) => set((state) => ({
    enemies: state.enemies.map(enemy => {
      const dx = playerPos.x - enemy.position.x
      const dy = playerPos.y - enemy.position.y

      const distance = Math.sqrt(dx * dx + dy * dy)

      const isAggro = distance < 5

      if (isAggro && distance > 0.8) {
        let newX = enemy.position.x
        let newY = enemy.position.y

        if (Math.abs(dx) > Math.abs(dy)) {
          newX += dx > 0 ? 1 : -1
        } else {
          newY += dy > 0 ? 1 : -1
        }

        const noWallCollision =
          map[newY]?.[newX] !== 1

        const noEnemyCollision = !state.enemies.some(
          e =>
            e.id !== enemy.id &&
            e.position.x === newX &&
            e.position.y === newY
        )

        if (noWallCollision && noEnemyCollision) {
          return {
            ...enemy,
            position: { x: newX, y: newY },
            isAggro,
          }
        }

        if (distance < 1.2) {
          get().takeDamage(8)
          get().updateSanity(-3)

          return {
            ...enemy,
            isAggro,
          }
        }
      }

      return {
        ...enemy,
        isAggro,
      }
    }),
  })),
}))