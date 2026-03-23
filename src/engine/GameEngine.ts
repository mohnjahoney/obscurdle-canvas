import { Scene } from "../scene/Scene"
import { update } from "./update"
import { GameState, Msg } from "./types"
import { EffectContext } from "../effects/EffectContext"
import { OBSCURE_MODES } from "../modes/obscureModes"
import { Tile } from "../entities/Tile"

// Minimal GameEngine: owns canvas, loop, state, and dispatch

export class GameEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private scene: Scene
  private effectContext: EffectContext
  public tiles: Tile[][] = []

  private state: GameState
  private lastTime = 0

  constructor(opts: {
    canvas: HTMLCanvasElement
    initialState: GameState
  }) {
    this.canvas = opts.canvas
    const ctx = this.canvas.getContext("2d")
    if (!ctx) throw new Error("2D context not available")
    this.ctx = ctx

    this.scene = new Scene()
    this.effectContext = new EffectContext(this.scene)
    ;(window as any).effectContext = this.effectContext

    ;(window as any).engine = this

    this.state = opts.initialState

    // init tiles once
    this.initTiles()
    this.updateTilesFromState()

    this.resize()
    window.addEventListener("resize", this.resize)
  }

  // ---- Public API ----

  start() {
    this.lastTime = performance.now()
  
    if (this.state.obscureMode === "laserBlast") {
      this.effectContext.startLaserLoop()
    }
  
    requestAnimationFrame(this.loop)
  }

  dispatch(msg: Msg) {
    const { state, events } = update(this.state, msg)
    this.state = state

    this.updateTilesFromState()

    const ctx = this.effectContext

    const mode = OBSCURE_MODES[this.state.obscureMode as keyof typeof OBSCURE_MODES]

    // console.log("in dispatch")

    if (!mode || !mode.handleEvent) return

    for (const event of events) {
      mode.handleEvent(event, ctx)
    }
  }

  getState() {
    return this.state
  }

  getScene() {
    return this.scene
  }

  private initTiles() {
    this.tiles = []

    for (let row = 0; row < 6; row++) {
      const rowTiles: Tile[] = []

      for (let col = 0; col < 5; col++) {
        const tile = new Tile(row, col)
        this.scene.add(tile)
        rowTiles.push(tile)
      }

      this.tiles.push(rowTiles)
    }
  }

  private updateTilesFromState() {
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 5; col++) {
        // console.log("grid cell", this.state.grid[row][col])
        const tile = this.tiles[row][col]
        const data = this.state.grid[row][col]
        // update tile data (safe optional call)
        ;(tile as any).setData?.(data)
        // if (row === 0 && col === 0) {
        //   console.log("data going into tile", data)
        // }
      }
    }
  }

  // ---- Loop ----

  private loop = (time: number) => {
    const dt = (time - this.lastTime) / 1000
    this.lastTime = time

    this.update(dt)
    this.render()

    requestAnimationFrame(this.loop)
  }

  private update(dt: number) {
    this.scene.update(dt)
  }

  private render() {
    const { ctx, canvas } = this

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    this.scene.render(ctx)
  }

  // ---- Helpers ----

  private resize = () => {
    const dpr = window.devicePixelRatio || 1
    const rect = this.canvas.getBoundingClientRect()

    this.canvas.width = Math.floor(rect.width * dpr)
    this.canvas.height = Math.floor(rect.height * dpr)

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
}