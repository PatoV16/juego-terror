// export class Renderer {
//   tileSize = 64

//   renderMap(
//     ctx: CanvasRenderingContext2D,
//     map: number[][]
//   ) {
//     for (let y = 0; y < map.length; y++) {
//       for (let x = 0; x < map[y].length; x++) {

//         if (map[y][x] === 1) {
//         //   ctx.fillStyle = '#111'
//         ctx.fillStyle = '#444'
//         } else {
//         //   ctx.fillStyle = '#222'
//         ctx.fillStyle = '#777'
//         }

//         ctx.fillRect(
//           x * this.tileSize,
//           y * this.tileSize,
//           this.tileSize,
//           this.tileSize
//         )
//       }
//     }
//   }

//   renderPlayer(
//     ctx: CanvasRenderingContext2D,
//     x: number,
//     y: number
//   ) {
//     ctx.fillStyle = '#00ff66'

//     ctx.beginPath()
//     ctx.arc(x, y, 16, 0, Math.PI * 2)
//     ctx.fill()
//   }

//   renderEnemy(
//     ctx: CanvasRenderingContext2D,
//     x: number,
//     y: number
//   ) {
//     ctx.fillStyle = 'red'

//     ctx.beginPath()
//     ctx.arc(x, y, 16, 0, Math.PI * 2)
//     ctx.fill()
//   }
// }
export class Renderer {
  tileSize = 64

  renderMap(
    ctx: CanvasRenderingContext2D,
    map: number[][]
  ) {
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {

        const tileX = x * this.tileSize
        const tileY = y * this.tileSize

        // =========================
        // PAREDES
        // =========================
        if (map[y][x] === 1) {

          // Gradiente pared
          const wallGradient = ctx.createLinearGradient(
            tileX,
            tileY,
            tileX + this.tileSize,
            tileY + this.tileSize
          )

          wallGradient.addColorStop(0, '#555')
          wallGradient.addColorStop(1, '#222')

          ctx.fillStyle = wallGradient

        } else {

          // Piso
          const floorGradient = ctx.createLinearGradient(
            tileX,
            tileY,
            tileX,
            tileY + this.tileSize
          )

          floorGradient.addColorStop(0, '#666')
          floorGradient.addColorStop(1, '#444')

          ctx.fillStyle = floorGradient
        }

        // Dibujar tile
        ctx.fillRect(
          tileX,
          tileY,
          this.tileSize,
          this.tileSize
        )

        // =========================
        // GRID
        // =========================
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'
        ctx.lineWidth = 2

        ctx.strokeRect(
          tileX,
          tileY,
          this.tileSize,
          this.tileSize
        )

        // =========================
        // SOMBRA INTERNA PAREDES
        // =========================
        if (map[y][x] === 1) {
          ctx.fillStyle = 'rgba(0,0,0,0.25)'

          ctx.fillRect(
            tileX,
            tileY,
            this.tileSize,
            8
          )

          ctx.fillRect(
            tileX,
            tileY,
            8,
            this.tileSize
          )
        }
      }
    }
  }

  renderPlayer(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ) {

    // Glow
    ctx.shadowColor = '#00ff66'
    ctx.shadowBlur = 25

    // Cuerpo
    const gradient = ctx.createRadialGradient(
      x,
      y,
      4,
      x,
      y,
      18
    )

    gradient.addColorStop(0, '#66ff99')
    gradient.addColorStop(1, '#00aa44')

    ctx.fillStyle = gradient

    ctx.beginPath()
    ctx.arc(x, y, 16, 0, Math.PI * 2)
    ctx.fill()

    // Outline
    ctx.strokeStyle = '#ccffdd'
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.arc(x, y, 16, 0, Math.PI * 2)
    ctx.stroke()

    // Centro
    ctx.fillStyle = '#ffffff'

    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fill()

    // Reset shadow
    ctx.shadowBlur = 0
  }

  renderEnemy(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ) {

    // Aura roja
    ctx.shadowColor = 'red'
    ctx.shadowBlur = 30

    // Gradiente enemigo
    const gradient = ctx.createRadialGradient(
      x,
      y,
      2,
      x,
      y,
      20
    )

    gradient.addColorStop(0, '#ff4444')
    gradient.addColorStop(1, '#660000')

    ctx.fillStyle = gradient

    ctx.beginPath()
    ctx.arc(x, y, 16, 0, Math.PI * 2)
    ctx.fill()

    // Ojos
    ctx.fillStyle = '#ffffff'

    ctx.beginPath()
    ctx.arc(x - 5, y - 3, 2, 0, Math.PI * 2)
    ctx.arc(x + 5, y - 3, 2, 0, Math.PI * 2)
    ctx.fill()

    // Boca
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.arc(x, y + 4, 6, 0, Math.PI)
    ctx.stroke()

    // Reset shadow
    ctx.shadowBlur = 0
  }

  renderFog(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) {

    const fogGradient = ctx.createLinearGradient(
      0,
      0,
      width,
      height
    )

    fogGradient.addColorStop(0, 'rgba(0,0,0,0.05)')
    fogGradient.addColorStop(1, 'rgba(0,0,0,0.15)')

    ctx.fillStyle = fogGradient

    ctx.fillRect(
      0,
      0,
      width,
      height
    )
  }

  renderVignette(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) {

    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.2,
      width / 2,
      height / 2,
      width * 0.7
    )

    gradient.addColorStop(0, 'rgba(0,0,0,0)')
    gradient.addColorStop(1, 'rgba(0,0,0,0.65)')

    ctx.fillStyle = gradient

    ctx.fillRect(
      0,
      0,
      width,
      height
    )
  }
}