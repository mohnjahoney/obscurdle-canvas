import { Scene } from "../scene/Scene"
import { Vec2 } from "../engine/types"
import { Laser, LaserSource } from "../entities/Laser"
import gsap from "gsap"
import { CONFIG } from "../config"
import { Tile } from "../entities/Tile"

type EffectContextDeps = {
  scene: Scene
  ctx: CanvasRenderingContext2D
  tiles: Tile[][]
}
// EffectContext provides controlled access for modes to interact with the scene
export class EffectContext {
  private scene: Scene
  private ctx: CanvasRenderingContext2D
  private tiles: Tile[][]
  
  private rotationIntervalId: number | null = null
  private rotationActive = false

  constructor({ scene, ctx, tiles }: EffectContextDeps) {
    this.scene = scene
    this.ctx = ctx
    this.tiles = tiles

    console.log("tiles in EffectContext (len):", this.tiles?.length)
  }


  // simpleFade
  fadeTile(row: number, col: number) {
    console.log("fadeTile called", row, col)
    const tile = this.getTile(row, col)
    console.log("tile:", tile)
    if (!tile) return
  
    gsap.to(tile, {
      opacity: 0,
      duration: 3,
      ease: "linear",
      // onUpdate: () => console.log("animating", tile.opacity),
    })
  }

  // ---- Persistent entities ----

  private laserIntervalId: number | null = null
  private laserSource: LaserSource | null = null

  ensureLaserSource() {
    if (this.laserSource) return

    const source = new LaserSource({
      x: this.ctx.canvas.width / 2,
      y: CONFIG.laser.source.y,
    })
    this.scene.add(source)
    this.laserSource = source
  }

  // Stop all animating tweens
  stop() {
    if (this.laserIntervalId !== null) {
      clearInterval(this.laserIntervalId)
      this.laserIntervalId = null
    }
  
    gsap.killTweensOf("*")
  }

  // ---- Effect state (per tile) ----

  private tileEffects: Map<string, TileEffectState> = new Map()

  private key(row: number, col: number) {
    return `${row}-${col}`
  }

  getTileEffects(row: number, col: number): TileEffectState | undefined {
    return this.tileEffects.get(this.key(row, col))
  }

  private getOrCreateTileEffects(row: number, col: number): TileEffectState {
    const k = this.key(row, col)
    let state = this.tileEffects.get(k)
    if (!state) {
      state = {}
      this.tileEffects.set(k, state)
    }
    return state
  }

  registerTile(row: number, col: number) {
    this.getOrCreateTileEffects(row, col)
  }

  applyBurnEffect(row: number, col: number) {
    const state = this.getOrCreateTileEffects(row, col)
    const current = state.burn?.level ?? 0
    const next = Math.min(3, current + 1)

    state.burn = { level: next }
  }

  // ---- Autonomous systems ----

  startLaserLoop() {
    // console.log("starting laser loop")
    this.ensureLaserSource()

    if (this.laserIntervalId !== null) return

    this.laserIntervalId = window.setInterval(() => {
      this.tickLaser()
    }, 3000)
  }

  private tickLaser() {
    // console.log("laserSource exists:", this.laserSource)
    const candidates: { row: number; col: number }[] = []

    for (const [key, state] of this.tileEffects.entries()) {
      const burnLevel = state.burn?.level ?? 0
      if (burnLevel < 3) {
        const [row, col] = key.split("-").map(Number)
        candidates.push({ row, col })
      }
    }

    if (candidates.length === 0) return

    const target = candidates[Math.floor(Math.random() * candidates.length)]

    const from = {
      x: this.ctx.canvas.width / 2,
      y: CONFIG.laser.source.y,
    }

    const to = this.getTilePosition(target.row, target.col)

    this.spawnLaser({
      from,
      to,
      row: target.row,
      col: target.col,
    })
  }

  // ---- Queries (read-only helpers) ----

  // NOTE: These are placeholders for now.
  // We'll wire them properly once tiles are managed more centrally.

  getTile(row: number, col: number): Tile | undefined {
    console.log("in getTile")
    return this.tiles?.[row]?.[col]
  }

  getTilePosition(row: number, col: number): Vec2 {
    const size = CONFIG.grid.tileSize
    const gap = CONFIG.grid.gap
    const cols = CONFIG.grid.cols
    const rows = CONFIG.grid.rows

    const totalWidth = cols * size + (cols - 1) * gap
    const totalHeight = rows * size + (rows - 1) * gap

    const origin = {
      x: (this.ctx.canvas.width - totalWidth) / 2,
      y: (this.ctx.canvas.height - totalHeight) / 2,
    }

    return {
      x: origin.x + col * (size + gap) + size / 2,
      y: origin.y + row * (size + gap) + size / 2,
    }
  }

  // ---- Tile effects ----

  shakeTile(row: number, col: number) {
    const engine = (window as any).engine
    const tile = engine?.tiles?.[row]?.[col]
    if (!tile) return

    gsap.to(tile, {
      offsetX: "+=2",
      offsetY: "+=2",
      yoyo: true,
      repeat: 5,
      duration: 0.04,
      ease: "power1.inOut",
      onComplete: () => {
        tile.offsetX = 0
        tile.offsetY = 0
      },
    })
  }

  // ---- Laser effect (mode behavior) ----
  spawnLaser(opts: { from: Vec2; to: Vec2; row: number; col: number }) {
    // Use persistent laser source
    const source = this.laserSource!

    const laser = new Laser(opts.from, opts.to)
    this.scene.add(laser)

    const tl = gsap.timeline({
      onComplete: () => {
        laser.isReadyToBeCleared = true
        // keep source alive
      },
    })

    // ---- Charge (pulse the source) ----
    tl.to(source, {
      baseScale: 1.8,
      duration: 0.12,
      ease: "power2.out",
    })
    tl.to(source, {
      baseScale: 1.2,
      duration: 0.08,
      ease: "power2.in",
    })

    // ---- Fire (laser) ----
    // tl.to(laser, {
    //   progress: 1,
    //   duration: 0.1,
    //   ease: "power4.out",
    // })
    tl.fromTo(
      laser,
      { progress: 0, width: 40 },   // start values
      {
        progress: 1,
        width: 8,
        duration: 0.2,
        ease: "power4.out",
      }
    )
    // Quick settle to medium size after snap
    tl.to(source, {
      baseScale: 1.2,
      duration: 0.08,
      ease: "power3.out",
    }, "<")

    // ---- Impact flash at target ----
    tl.add(() => {
      const flash = new LaserSource(opts.to)
      flash.radius = 20
      this.scene.add(flash)
      // Apply burn here
      // this.applyBurnEffect(opts.row, opts.col)  // removed as per instructions
      this.shakeTile(opts.row, opts.col)

      gsap.fromTo(
        flash,
        { scale: 0.5, opacity: 1 },
        {
          scale: 2,
          opacity: 0,
          duration: 0.2,
          ease: "power2.out",
          onComplete: () => {
            flash.isReadyToBeCleared = true
          },
        }
      )
    })

    // ---- Hold (burn + pulse) ----
    tl.add(() => {
      // apply burn during hold
      this.applyBurnEffect(opts.row, opts.col)

      // increase oscillation amplitude
      source.oscAmp = 0.12

      // pulse laser thickness
      gsap.to(laser, {
        width: 4,
        yoyo: true,
        repeat: 3,
        duration: 0.2,
        ease: "power1.inOut",
      })

      // sync source pulse (oscAmp, not scale)
      gsap.to(source, {
        oscAmp: 0.12,
        duration: 0.1,
        ease: "power1.out",
      })
    })

    tl.to(laser, {
      duration: 0.35,
    })

    // Return source to idle before fade
    tl.add(() => {
      gsap.to(source, {
        baseScale: 1,
        duration: 0.2,
        ease: "power2.inOut",
      })
      gsap.to(source, {
        oscAmp: 0.05,
        duration: 0.2,
      })
    })

    // ---- Fade out ----
    tl.to(
      laser,
      {
        opacity: 0,
        duration: 0.1,
      },
      "-=0.05"
    )

    // Removed standalone source pulse gsap.to(...) as per instructions
  }

  // rotationPulse
  startRotationPulse() {
    if (this.rotationIntervalId !== null) return
  
    this.rotationIntervalId = window.setInterval(() => {
      if (!this.rotationActive) return
      this.tickRotationPulse()
    }, 5000)
  }

  enableRotationPulse() {
    this.rotationActive = true
  }

  // private tickRotationPulse() {
  //   for (let row = 0; row < this.tiles.length; row++) {
  //     for (let col = 0; col < this.tiles[row].length; col++) {
  //       const tile = this.tiles[row][col]
  //       if (!tile) continue
  
  //       // const delta = 5* (row + col)
  //       const delta = 5 * Math.sqrt(row*row + col*col)
  
  //       gsap.to(tile, {
  //         angle: (tile.angle ?? 0) + delta,
  //         duration: 0.2,
  //         ease: "power3.out",
  //       })
  //     }
  //   }
  // }


  // private tickRotationPulse() {
  //   const tiles = this.tiles.flat()
  
  //   gsap.to(tiles, {
  //     angle: (i, tile: Tile) =>
  //       (tile.angle ?? 0) +
  //       5 * Math.sqrt(tile.row * tile.row + tile.col * tile.col),
  
  //     duration: 0.2,
  //     ease: "power3.out",
  
  //     stagger: (i, tile: Tile) =>
  //       0.02 * (tile.row + tile.col),
  //   })
  // }

  private tickRotationPulse() {
    const tiles = this.tiles.flat()
  
    gsap.to(tiles, {
      angle: "+=15",
      duration: 0.2,
      // ease: "power3.out",
      ease: "back.out(6)",
  
      stagger: (i, tile: Tile) =>
        0.1 * (tile.row + tile.col),
    })
  }

  // general
  destroyTile(_row: number, _col: number) {
    // Placeholder: will hook into actual tile entities later
  }

  // ---- Animation helpers ----

  timeline() {
    return gsap.timeline()
  }

  animate(target: any, vars: gsap.TweenVars) {
    return gsap.to(target, vars)
  }

}

// ---- Types ----

type TileEffectState = {
  burn?: {
    level: number // 0–3
  }
}