import { Entity } from "../scene/Entity"
import { TileData, TileResult, Vec2 } from "../engine/types"
import { CONFIG } from "../config"

// Simple visual tile for grid rendering (no animation yet)
export class Tile implements Entity {
  data: TileData

  // grid position
  row: number
  col: number

  // layout
  size: number
  gap: number
  origin: Vec2

  offsetX: number
  offsetY: number

  // rendering
  opacity: number = 1
  angle: number = 0

  isReadyToBeCleared = false
  private _logged: boolean

  constructor(row: number, col: number) {
    this.row = row
    this.col = col

    this.data = { letter: "", result: "notSubmitted" }

    this.size = CONFIG.grid.tileSize
    this.gap = CONFIG.grid.gap
    this.origin = { x: 0, y: 0 }

    this.offsetX = 0
    this.offsetY = 0

    this._logged = false
  }

  setData(data: TileData) {
    this.data = data
  }

  update(_dt: number) {
    // no-op for now (animation will come later)
  }

  private getPosition(ctx: CanvasRenderingContext2D): Vec2 {
    const canvas = ctx.canvas
    // const displayWidth = canvas?.clientWidth ?? window.innerWidth
    // const displayHeight = canvas?.clientHeight ?? window.innerHeight

    // const canvasWidth = canvas?.width ?? 100
    // const canvasHeight = canvas?.height ?? 100

    const totalWidth = CONFIG.grid.cols * this.size + (CONFIG.grid.cols - 1) * this.gap
    const totalHeight = CONFIG.grid.rows * this.size + (CONFIG.grid.rows - 1) * this.gap

    const originX = (canvas.width - totalWidth) / 2
    const originY = (canvas.height - totalHeight) / 2
    // const originX = canvas ? (canvas.width - totalWidth) / 2 : this.origin.x
    // const originY = canvas ? (canvas.height - totalHeight) / 2 : this.origin.y

    const x = originX + this.col * (this.size + this.gap) + this.offsetX
    const y = originY + this.row * (this.size + this.gap) + this.offsetY

    return { x, y }
  }

  private getFillColor(result: TileResult): string {
    switch (result) {
      case "correct":
        return "#6aaa64"
      case "present":
        return "#c9b458"
      case "absent":
        return "#3a3a3c"
      case "notSubmitted":
      default:
        return "#121213"
    }
  }

  private drawBurn(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const effects = (window as any).effectContext?.getTileEffects(this.row, this.col)

    if (effects?.burn) {
      const level = effects.burn.level
      const baseRadius = [0, 6, 10, 14][level]

      // const tileSize = 20; // I added this - not sure this is what GPT intended
      const cx = x + this.size / 2
      const cy = y + this.size / 2

      // stable randomness per tile
      const seed = this.row * 10 + this.col
      const rand = (n: number) => Math.sin(seed * 999 + n) * 0.5 + 0.5

      for (let i = 0; i < 3; i++) {
        const r = baseRadius * (0.8 + rand(i) * 0.4)
        const ox = (rand(i + 10) - 0.5) * 4
        const oy = (rand(i + 20) - 0.5) * 4

        const g = ctx.createRadialGradient(
          cx + ox,
          cy + oy,
          r * 0.2,
          cx + ox,
          cy + oy,
          r
        )

        g.addColorStop(0, "rgba(20, 10, 5, 0.9)")
        g.addColorStop(0.5, "rgba(40, 20, 10, 0.6)")
        g.addColorStop(1, "rgba(0,0,0,0)")

        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(cx + ox, cy + oy, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    // const effectContext = (window as any).effectContext
    // if (!effectContext) return

    // const effects = effectContext.getTileEffects(this.row, this.col)
    // const burnLevel = effects?.burn?.level ?? 0

    // if (burnLevel < 3 && burnLevel > 0) {
    //   // if (burnLevel > 0) {
    //   ctx.save()

    //   ctx.strokeStyle = "red"
    //   ctx.lineWidth = 3
    //   ctx.strokeRect(x, y, this.size, this.size)

    //   ctx.restore()
    // }

    // if (burnLevel === 0) return

    // const radiusMap = [0, 4, 8, 12]
    // const burnLevelIndicatorRadius = radiusMap[burnLevel]

    // ctx.save()

    // ctx.fillStyle = "black"
    // ctx.beginPath()
    // ctx.arc(x + this.size / 2, y + this.size / 2, burnLevelIndicatorRadius, 0, Math.PI * 2)
    // ctx.fill()

    // ctx.restore()
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { x, y } = this.getPosition(ctx)

    ctx.save()

    // move to tile center
    ctx.translate(x + this.size / 2, y + this.size / 2)

    // rotate
    ctx.rotate((this.angle * Math.PI) / 180)

    // move back so tile draws from top-left
    ctx.translate(-this.size / 2, -this.size / 2)

    // ---- draw everything at (0,0) ----

    // background
    ctx.fillStyle = this.getFillColor(this.data.result)
    ctx.fillRect(0, 0, this.size, this.size)

    // border
    ctx.strokeStyle = "#3a3a3c"
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, this.size, this.size)

    // letter
    if (this.data.letter) {
      ctx.save()
      ctx.globalAlpha = this.opacity

      ctx.fillStyle = "#ffffff"
      ctx.font = `${Math.floor(this.size * 0.6)}px sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      ctx.fillText(
        this.data.letter,
        this.size / 2,
        this.size / 2
      )

      ctx.restore()
    }

    // burn overlay
    this.drawBurn(ctx, 0, 0)

    ctx.restore()
  }
}
