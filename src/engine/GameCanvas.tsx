
import React, { useRef, useEffect } from 'react'
import { useGameStore } from '../store/gameSlice'

// Mapa del juego (1 = pared, 0 = pasillo)
export const MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,1,1,1,0,1,0,0,1],
  [1,0,1,0,0,0,0,0,1,0,0,0,1,0,0,1],
  [1,0,1,0,1,1,1,0,1,0,1,0,1,0,0,1],
  [1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1],
  [1,0,1,0,1,0,1,1,1,0,1,1,1,0,0,1],
  [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,1,1,1,1,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
  [1,0,1,1,1,1,1,0,1,0,0,1,0,0,0,1],
  [1,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,0,0,1,1,1,0,1,0,1,0,1,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
]

// Colores para paredes
const WALL_COLORS = {
  normal: '#4a2a2a',
  dark: '#2a1515',
  blood: '#5c1a1a',
}

interface GameCanvasProps {
  width?: number
  height?: number
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ width = 800, height = 600 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number | null>(null)

  const player = useGameStore((state) => state.player)
  const enemies = useGameStore((state) => state.enemies)
  const sanity = useGameStore((state) => state.player.sanity)

  // Raycaster para renderizar el mundo 3D
  const render = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Ajustar tamaño del canvas
    canvas.width = width
    canvas.height = height
    
    // Usar las propiedades correctas del store
    const posX = player.posX
    const posY = player.posY
    const dirX = player.dirX
    const dirY = player.dirY
    const planeX = player.planeX
    const planeY = player.planeY
    
    // Renderizar cada columna de la pantalla
    for (let x = 0; x < width; x++) {
      // Calcular posición del rayo
      const cameraX = 2 * x / width - 1
      const rayDirX = dirX + planeX * cameraX
      const rayDirY = dirY + planeY * cameraX
      
      // Posición del mapa
      let mapX = Math.floor(posX)
      let mapY = Math.floor(posY)
      
      // Distancia al muro
      const deltaDistX = Math.abs(1 / rayDirX)
      const deltaDistY = Math.abs(1 / rayDirY)
      
      let stepX: number
      let stepY: number
      let sideDistX: number
      let sideDistY: number
      
      // Dirección del raycast
      if (rayDirX < 0) {
        stepX = -1
        sideDistX = (posX - mapX) * deltaDistX
      } else {
        stepX = 1
        sideDistX = (mapX + 1 - posX) * deltaDistX
      }
      
      if (rayDirY < 0) {
        stepY = -1
        sideDistY = (posY - mapY) * deltaDistY
      } else {
        stepY = 1
        sideDistY = (mapY + 1 - posY) * deltaDistY
      }
      
      // Raycasting
      let hit = false
      let side = 0
      
      while (!hit) {
        if (sideDistX < sideDistY) {
          sideDistX += deltaDistX
          mapX += stepX
          side = 0
        } else {
          sideDistY += deltaDistY
          mapY += stepY
          side = 1
        }
        
        // Verificar límites del mapa
        if (mapY < 0 || mapY >= MAP.length || mapX < 0 || mapX >= MAP[0].length) {
          hit = true
          break
        }
        
        if (MAP[mapY]?.[mapX] === 1) {
          hit = true
        }
      }
      
      // Calcular distancia
      let perpWallDist: number
      if (side === 0) {
        perpWallDist = (sideDistX - deltaDistX)
      } else {
        perpWallDist = (sideDistY - deltaDistY)
      }
      
      // Prevenir división por cero
      if (perpWallDist < 0.001) perpWallDist = 0.001
      
      // Altura de la pared
      const lineHeight = Math.floor(height / perpWallDist)
      const drawStart = Math.max(0, (height - lineHeight) / 2)
      const drawEnd = Math.min(height, (height + lineHeight) / 2)
      
      // Oscurecer por distancia
      const shade = Math.min(1, 1 / (perpWallDist * 0.3))
      
      // Efecto de cordura baja (paredes se ven rojas)
      let wallColor: string
      if (sanity < 40) {
        const intensity = sanity / 100
        wallColor = `rgb(100, ${Math.floor(30 * intensity)}, ${Math.floor(30 * intensity)})`
      } else {
        const r = Math.floor(40 + 20 * shade)
        const g = Math.floor(15 + 15 * shade)
        const b = Math.floor(15 + 15 * shade)
        wallColor = side === 0 ? `rgb(${r}, ${g}, ${b})` : `rgb(${r * 0.7}, ${g * 0.7}, ${b * 0.7})`
      }
      
      ctx.fillStyle = wallColor
      ctx.fillRect(x, drawStart, 1, drawEnd - drawStart)
      
      // Dibujar suelo y techo
      ctx.fillStyle = `rgb(10, 5, ${5 + Math.floor(10 * shade)})`
      ctx.fillRect(x, drawEnd, 1, height - drawEnd)
      
      ctx.fillStyle = `rgb(5, 2, 2)`
      ctx.fillRect(x, 0, 1, drawStart)
    }
    
    // Dibujar enemigos (sprites)
    enemies.forEach(enemy => {
      // Posición del enemigo relativa al jugador
      const enemyX = enemy.position.x + 0.5 - posX
      const enemyY = enemy.position.y + 0.5 - posY
      
      // Transformar a espacio de cámara
      const invDet = 1 / (planeX * dirY - dirX * planeY)
      const transformX = invDet * (enemyY * dirX - enemyX * dirY)
      const transformY = invDet * (-enemyY * planeX + enemyX * planeY)
      
      if (transformY > 0) {
        const spriteScreenX = (width / 2) * (1 + transformX / transformY)
        const spriteHeight = Math.abs(Math.floor(height / transformY))
        const spriteWidth = Math.floor(spriteHeight)
        const spriteY = (height - spriteHeight) / 2
        const spriteX = spriteScreenX - spriteWidth / 2
        
        if (spriteX + spriteWidth > 0 && spriteX < width) {
          // Color del enemigo según tipo y aggro
          let color: string
          if (enemy.type === 'ghost') {
            color = enemy.isAggro ? '#ff66cc' : '#996699'
          } else if (enemy.type === 'cultist') {
            color = enemy.isAggro ? '#ff44aa' : '#884466'
          } else {
            color = enemy.isAggro ? '#ff3333' : '#993333'
          }
          
          ctx.fillStyle = color
          ctx.fillRect(spriteX, spriteY, spriteWidth, spriteHeight)
          
          // Ojos del enemigo (si está agresivo)
          if (enemy.isAggro) {
            ctx.fillStyle = '#ffffff'
            const eyeW = spriteWidth * 0.2
            const eyeH = spriteHeight * 0.15
            ctx.fillRect(spriteX + spriteWidth * 0.2, spriteY + spriteHeight * 0.3, eyeW, eyeH)
            ctx.fillRect(spriteX + spriteWidth * 0.6, spriteY + spriteHeight * 0.3, eyeW, eyeH)
            
            ctx.fillStyle = '#ff0000'
            const pupilW = spriteWidth * 0.12
            const pupilH = spriteHeight * 0.1
            ctx.fillRect(spriteX + spriteWidth * 0.22, spriteY + spriteHeight * 0.32, pupilW, pupilH)
            ctx.fillRect(spriteX + spriteWidth * 0.62, spriteY + spriteHeight * 0.32, pupilW, pupilH)
          }
          
          // Barra de vida del enemigo
          const healthPercent = Math.max(0, enemy.health / 50)
          ctx.fillStyle = '#ff0000'
          ctx.fillRect(spriteX, spriteY - 10, spriteWidth, 5)
          ctx.fillStyle = '#00ff00'
          ctx.fillRect(spriteX, spriteY - 10, spriteWidth * healthPercent, 5)
        }
      }
    })
    
    // Efecto de sangre en los bordes si la vida es baja
    if (player.health < 40) {
      const intensity = (40 - player.health) / 40
      ctx.fillStyle = `rgba(139, 0, 0, ${intensity * 0.5})`
      ctx.fillRect(0, 0, width, height)
      
      // Bordes más oscuros
      ctx.fillStyle = `rgba(139, 0, 0, ${intensity * 0.8})`
      ctx.fillRect(0, 0, width, 30)
      ctx.fillRect(0, 0, 30, height)
      ctx.fillRect(width - 30, 0, 30, height)
      ctx.fillRect(0, height - 30, width, 30)
    }
    
    // Efecto de cordura baja (visión distorsionada)
    if (sanity < 50) {
      const intensity = (50 - sanity) / 50
      ctx.fillStyle = `rgba(100, 0, 100, ${intensity * 0.2})`
      ctx.fillRect(0, 0, width, height)
    }
    
    frameRef.current = requestAnimationFrame(render)
  }
  
  useEffect(() => {
    render()
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [width, height, player, enemies, sanity])
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ display: 'block' }}
    />
  )
}