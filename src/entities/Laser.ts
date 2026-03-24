import { Entity } from "../scene/Entity"
import { Vec2 } from "../engine/types"
import { CONFIG } from "../config"

// Simple laser beam entity
export class Laser implements Entity {
  from: Vec2
  to: Vec2

  progress: number = 0 // 0 → 1 (animated)
  opacity: number = 1

  baseWidth: number = CONFIG.laser.width.medium
  width: number

  color: string = "#ff2e63"

  internalZOrder?: number | undefined = 1

  isReadyToBeCleared = false

  constructor(from: Vec2, to: Vec2) {
    this.from = from
    this.to = to
    this.width = this.baseWidth
  }

  update(_dt: number) {
    // no-op (GSAP drives animation)
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isReadyToBeCleared) return

    const x = this.from.x + (this.to.x - this.from.x) * this.progress
    const y = this.from.y + (this.to.y - this.from.y) * this.progress
    ctx.save()

    ctx.globalAlpha = this.opacity
    const w = this.width
    const cw = Math.max(0.5, w)

    ctx.beginPath()
    ctx.lineCap = "round"
    ctx.moveTo(this.from.x, this.from.y)
    ctx.lineTo(x, y)
    
    // --- outer glow (wide, soft) ---
    ctx.strokeStyle = "#ff2e63"
    ctx.lineWidth = cw * 3
    ctx.globalAlpha = this.opacity * 0.25
    ctx.shadowColor = "#ff2e63"
    ctx.shadowBlur = 20
    ctx.stroke()
    
    // --- mid layer (colored core) ---
    ctx.strokeStyle = "#ff2e63"
    ctx.lineWidth = cw * 1.5
    ctx.globalAlpha = this.opacity * 0.7
    ctx.shadowBlur = 10
    ctx.stroke()
    
    // --- inner core (white hot center) ---
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = cw * 0.5
    ctx.globalAlpha = this.opacity * 1
    ctx.shadowBlur = 0
    ctx.stroke()
    
    ctx.restore()
  }
}

// 🔥 Laser source (charging origin)
export class LaserSource implements Entity {
  position: Vec2

  radius: number = 20 // keep for now (no config entry yet)
  baseScale: number = 1
  oscAmp: number = 0.05
  oscSpeed: number = 2
  private t: number = 0
  scale: number = 1
  opacity: number = 1
  internalZOrder?: number | undefined = 2

  isReadyToBeCleared = false

  constructor(position: Vec2) {
    this.position = position
  }

  update(dt: number) {
    this.t += dt
    const osc = this.oscAmp * Math.sin(this.t * this.oscSpeed)
    this.scale = this.baseScale * (1 + osc)
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()

    const r = this.radius * this.scale

    // outer glow (pink)
    ctx.beginPath()
    ctx.arc(this.position.x, this.position.y, r + 8, 0, Math.PI * 2)
    ctx.fillStyle = "rgba(255, 46, 99, 0.18)"
    ctx.fill()

    // mid glow (white)
    ctx.beginPath()
    ctx.arc(this.position.x, this.position.y, r + 3, 0, Math.PI * 2)
    ctx.fillStyle = "rgba(255,255,255,0.25)"
    ctx.fill()

    // main body
    ctx.beginPath()
    ctx.arc(this.position.x, this.position.y, r, 0, Math.PI * 2)
    ctx.fillStyle = "#ff2e63"
    ctx.shadowColor = "#ff2e63"
    ctx.shadowBlur = 20
    ctx.fill()

    // hot core
    ctx.beginPath()
    ctx.arc(this.position.x, this.position.y, r * 0.4, 0, Math.PI * 2)
    ctx.fillStyle = "#ffffff"
    ctx.fill()

    ctx.restore()
  }
}