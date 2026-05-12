interface Enemy {
  id: string
  type: 'ghost' | 'cultist' | 'shadow'
  position: { x: number; y: number }
  health: number
  isAggro: boolean
  detectionRadius: number
  speed: number
}

export class EnemyAI {
  static updateEnemy(enemy: Enemy, playerPos: { x: number; y: number }, mapWalls: boolean[][]): Enemy {
    const dx = playerPos.x - enemy.position.x
    const dy = playerPos.y - enemy.position.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Detectar al jugador
    const isAggro = distance < enemy.detectionRadius

    if (isAggro && enemy.health > 0) {
      // Movimiento hacia el jugador con pathfinding simple
      const angle = Math.atan2(dy, dx)
      const newX = enemy.position.x + Math.cos(angle) * enemy.speed
      const newY = enemy.position.y + Math.sin(angle) * enemy.speed

      // Verificar colisiones con paredes
      if (!mapWalls[Math.floor(newY)]?.[Math.floor(newX)]) {
        return { ...enemy, position: { x: newX, y: newY }, isAggro }
      }
    }

    return { ...enemy, isAggro }
  }

  static getEnemyTypeBehavior(type: Enemy['type']) {
    switch (type) {
      case 'ghost':
        return { detectionRadius: 200, speed: 1.5, damage: 20, health: 30 }
      case 'cultist':
        return { detectionRadius: 300, speed: 2, damage: 15, health: 50 }
      case 'shadow':
        return { detectionRadius: 150, speed: 3, damage: 25, health: 40 }
    }
  }
}