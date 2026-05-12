// engine/Raycaster.ts
export class Raycaster {
  private zbuffer: number[] = []

  cast(
    ctx: CanvasRenderingContext2D,
    map: number[][],
    posX: number, posY: number,
    dirX: number, dirY: number,
    planeX: number, planeY: number
  ) {
    const W = ctx.canvas.width
    const H = ctx.canvas.height

    // Cielo y suelo
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, W, H / 2)
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, H / 2, W, H / 2)

    this.zbuffer = new Array(W)

    for (let x = 0; x < W; x++) {
      // Dirección del rayo para esta columna
      const cameraX = (2 * x) / W - 1
      const rayDirX = dirX + planeX * cameraX
      const rayDirY = dirY + planeY * cameraX

      let mapX = Math.floor(posX)
      let mapY = Math.floor(posY)

      // DDA algorithm
      const deltaDistX = Math.abs(1 / rayDirX)
      const deltaDistY = Math.abs(1 / rayDirY)

      let stepX: number, stepY: number
      let sideDistX: number, sideDistY: number

      if (rayDirX < 0) { stepX = -1; sideDistX = (posX - mapX) * deltaDistX }
      else             { stepX =  1; sideDistX = (mapX + 1 - posX) * deltaDistX }
      if (rayDirY < 0) { stepY = -1; sideDistY = (posY - mapY) * deltaDistY }
      else             { stepY =  1; sideDistY = (mapY + 1 - posY) * deltaDistY }

      let hit = false
      let side = 0

      while (!hit) {
        if (sideDistX < sideDistY) { sideDistX += deltaDistX; mapX += stepX; side = 0 }
        else                        { sideDistY += deltaDistY; mapY += stepY; side = 1 }
        if (map[mapY]?.[mapX] === 1) hit = true
      }

      // Distancia perpendicular (evita el efecto "ojo de pez")
      const perpWallDist = side === 0
        ? sideDistX - deltaDistX
        : sideDistY - deltaDistY

      this.zbuffer[x] = perpWallDist

      const lineHeight = Math.floor(H / perpWallDist)
      const drawStart = Math.max(0, Math.floor(-lineHeight / 2 + H / 2))
      const drawEnd   = Math.min(H - 1, Math.floor(lineHeight / 2 + H / 2))

      // Color con sombra según distancia y lado
      let brightness = Math.floor(255 / (1 + perpWallDist * perpWallDist * 0.1))
      if (side === 1) brightness = Math.floor(brightness * 0.6)

      ctx.fillStyle = `rgb(${brightness * 0.3}, ${brightness * 0.5}, ${brightness * 0.3})`
      ctx.fillRect(x, drawStart, 1, drawEnd - drawStart)
    }
  }

  getZBuffer() { return this.zbuffer }
}