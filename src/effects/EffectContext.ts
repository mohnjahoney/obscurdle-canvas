import { Scene } from "../scene/Scene"
import { Vec2 } from "../engine/types"
import { Laser, LaserSource } from "../entities/Laser"
import gsap from "gsap"

// EffectContext provides controlled access for modes to interact with the scene
export class EffectContext {
  private scene: Scene

  constructor(scene: Scene) {
    this.scene = scene
  }

  // ---- Persistent entities ----

  private laserIntervalId: number | null = null
  private laserSource: LaserSource | null = null
  ensureLaserSource() {
    if (this.laserSource) return

    const source = new LaserSource({
      x: window.innerWidth / 2,
      y: 20,
    })
    this.scene.add(source)
    this.laserSource = source
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
    if (this.laserIntervalId !== null) return

    this.ensureLaserSource()

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
      x: window.innerWidth / 2,
      y: 20,
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

  getTile(_row: number, _col: number) {
    return undefined
  }

  getTilePosition(row: number, col: number): Vec2 {
    // Basic layout assumption (should match Tile.ts for now)
    const size = 60
    const gap = 8

    const totalWidth = 5 * size + 4 * gap
    const totalHeight = 6 * size + 5 * gap

    const origin = {
      x: (window.innerWidth - totalWidth) / 2,
      y: (window.innerHeight - totalHeight) / 2,
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
    tl.to(laser, {
      progress: 1,
      duration: 0.1,
      ease: "power4.out",
    })
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
        width: 1.6,
        yoyo: true,
        repeat: 3,
        duration: 0.08,
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