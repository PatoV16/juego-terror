export class Camera {
  x = 0
  y = 0
  shakeIntensity = 0

  update(targetX: number, targetY: number) {
    this.x += (targetX - this.x) * 0.1
    this.y += (targetY - this.y) * 0.1
  }

  shake(amount: number) {
    this.shakeIntensity = amount
  }

  apply(ctx: CanvasRenderingContext2D) {
    const shakeX = (Math.random() - 0.5) * this.shakeIntensity
    const shakeY = (Math.random() - 0.5) * this.shakeIntensity

    ctx.translate(-this.x + shakeX, -this.y + shakeY)

    this.shakeIntensity *= 0.9
  }
}