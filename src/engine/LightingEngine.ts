export class LightingEngine {
  render(
    ctx: CanvasRenderingContext2D,
    playerX: number,
    playerY: number
  ) {
    ctx.fillStyle = 'rgba(0,0,0,0.92)'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    const gradient = ctx.createRadialGradient(
      playerX,
      playerY,
      20,
      playerX,
      playerY,
      180
    )

    gradient.addColorStop(0, 'rgba(0,0,0,0)')
    gradient.addColorStop(1, 'rgba(0,0,0,0.95)')

    ctx.globalCompositeOperation = 'destination-out'

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(playerX, playerY, 180, 0, Math.PI * 2)
    ctx.fill()

    ctx.globalCompositeOperation = 'source-over'
  }
}