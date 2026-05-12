interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

export class ParticleEngine {
  particles: Particle[] = []

  spawn(x: number, y: number) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1
      })
    }
  }

  update(ctx: CanvasRenderingContext2D) {
    this.particles.forEach(p => {
      p.x += p.vx
      p.y += p.vy
      p.life -= 0.02

      ctx.fillStyle = `rgba(255,0,0,${p.life})`
      ctx.fillRect(p.x, p.y, 4, 4)
    })

    this.particles = this.particles.filter(p => p.life > 0)
  }
}