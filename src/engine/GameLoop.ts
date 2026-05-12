export class GameLoop {
  private animationId = 0

  start(update: () => void) {
    const loop = () => {
      update()
      this.animationId = requestAnimationFrame(loop)
    }

    loop()
  }

  stop() {
    cancelAnimationFrame(this.animationId)
  }
}