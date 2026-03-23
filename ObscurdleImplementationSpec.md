# Obscurdle — Implementation Spec (Cursor AI Prompt)

## 1. Game Overview

Obscurdle is a Wordle-style web game built with a custom canvas-based rendering system and GSAP for animation.

The core gameplay mirrors Wordle:
- Guess a 5-letter word
- Receive feedback per tile (correct, present, absent)
- Limited number of guesses

The key twist:
- The game layers **visual, temporal, and physics-based effects (“Obscure Modes”)** on top of the standard gameplay.
- These effects alter how information is perceived, not the underlying correctness.

---

## 2. Aesthetic & Feel

The game should feel:
- cohesive (single unified canvas world)
- responsive (low latency input and feedback)
- expressive (animations are core, not decorative)
- polished and deliberate (tight timing, no jank)

Visual priorities:
- smooth animation (GSAP-driven)
- strong sequencing and timing
- minimal base visuals enhanced by effects

---

## 3. Core Gameplay (Wordle Mechanics)

- 5-letter word guessing
- 6 attempts
- Feedback per tile:
  - "correct" → right letter, right position
  - "present" → right letter, wrong position
  - "absent" → letter not in word

Game progression:
- Player types letters
- Submits guess
- System evaluates guess
- Emits events describing results

---

## 4. Game Variants

### 4.1 Target Word Source

Determines how the answer is selected.

```ts
type TargetWordSource = "daily" | "random"
```

- "daily": shared word for all players
- "random": randomly selected word per session

---

### 4.2 Obscure Modes (Primary Variation Axis)

Defines how the game is visually and temporally experienced.

```ts
type ObscureModeId =
  | "none"
  | "simpleFade"
  | "laserBlast"
  | "gravity"
```

Properties:
- DO NOT change correctness rules
- DO modify:
  - animation
  - timing
  - visibility
  - physics behavior

Examples:
- none → standard Wordle
- simpleFade → tiles fade out over time
- laserBlast → correct tiles get destroyed by lasers
- gravity → tiles fall or move physically

---

## 5. Architecture Overview

### 5.1 Core Philosophy

- Single canvas-based scene (no React layout system)
- Small number of files (~15–25)
- Clear separation of concerns:
  - game logic (pure)
  - events (bridge layer)
  - scene (visual world)
  - entities (simulation objects)
  - modes (effect logic)

---

### 5.2 Data Flow

```
Input → Msg → update() → GameState + GameEvents
                          ↓
                    Mode.handleEvent(...)
                          ↓
                     EffectContext
                          ↓
                        Scene
                          ↓
                     Entities (GSAP animated)
```

---

## 6. Suggested File Structure

```
src/
  main.ts

  engine/
    GameEngine.ts
    update.ts
    types.ts

  scene/
    Scene.ts
    Entity.ts

  entities/
    Tile.ts
    Laser.ts
    Particle.ts

  modes/
    obscureModes.ts

  effects/
    EffectContext.ts

  utils/
    math.ts
```

---

## 7. Core Types

### Game State

```ts
type GameStatus = "playing" | "won" | "lost"

type GameState = {
  grid: TileData[][]
  currentRow: number
  status: GameStatus

  targetWordSource: TargetWordSource
  obscureMode: ObscureModeId
}
```

---

### Tile Data (Model Layer)

```ts
type TileResult = "correct" | "present" | "absent" | null

type TileData = {
  letter: string
  result: TileResult
}
```

**Important:**
- This is pure game truth
- No positions or animation state

---

### Messages (Input to update)

```ts
type Msg =
  | { type: "type_letter"; letter: string }
  | { type: "delete_letter" }
  | { type: "submit_guess" }
  | { type: "set_obscure_mode"; mode: ObscureModeId }
```

---

### Events (Output of update)

Events represent meaningful gameplay / information disclosure moments.

```ts
type GameEvent =
  | { type: "guess_submitted"; guess: string }
  | { type: "tile_revealed"; row: number; col: number; result: TileResult }
  | { type: "row_revealed"; row: number }
  | { type: "game_won" }
  | { type: "game_lost" }
```

**Notes:**
- These are NOT animation steps
- They are semantic events that modes can interpret

---

## 8. Effect System

### EffectContext

Provides controlled access for modes to interact with the scene.

```ts
type EffectContext = {
  getTile: (row: number, col: number) => Tile | undefined
  getTilePosition: (row: number, col: number) => Vec2

  spawnLaser: (opts: { from: Vec2; to: Vec2 }) => void
  spawnParticles: (opts: { position: Vec2; count: number }) => void

  destroyTile: (row: number, col: number) => void

  timeline: () => gsap.core.Timeline
}
```

**Rules:**
- Modes DO NOT directly mutate scene or entities
- Modes only act through EffectContext

---

## 9. Obscure Modes

```ts
type ObscureMode = {
  id: ObscureModeId
  label: string

  handleEvent?: (event: GameEvent, ctx: EffectContext) => void
  update?: (dt: number, ctx: EffectContext) => void
}
```

Registry:

```ts
const OBSCURE_MODES: Record<ObscureModeId, ObscureMode>
```

**Design principle:**
- No switch/case on mode
- Always delegate: `mode.handleEvent(...)`

---

## 10. Scene & Entities

### Scene

```ts
class Scene {
  entities: Entity[]

  add(entity: Entity): void
  update(dt: number): void
  render(ctx: CanvasRenderingContext2D): void
}
```

---

### Entity Interface

```ts
interface Entity {
  update(dt: number): void
  draw(ctx: CanvasRenderingContext2D): void
  isReadyToBeCleared?: boolean
}
```

---

### Example: Laser Entity

```ts
class Laser {
  from: Vec2
  to: Vec2

  progress: number = 0
  opacity: number = 1

  isReadyToBeCleared = true

  draw(ctx: CanvasRenderingContext2D) {
    const x = this.from.x + (this.to.x - this.from.x) * this.progress
    const y = this.from.y + (this.to.y - this.from.y) * this.progress

    ctx.save()
    ctx.globalAlpha = this.opacity
    ctx.strokeStyle = "#ff2e63"
    ctx.lineWidth = 4
    ctx.lineCap = "round"

    ctx.beginPath()
    ctx.moveTo(this.from.x, this.from.y)
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.restore()
  }
}
```

---

## 11. Animation (GSAP)

GSAP drives animation by mutating entity properties.

Example:

```ts
gsap.to(laser, {
  progress: 1,
  duration: 0.15,
  ease: "power2.out"
})
```

Engine loop:
- reads properties
- renders accordingly

---

## 12. Example: LaserBlast Mode

Trigger: `row_revealed`

Behavior:
- find correct tiles
- fire lasers sequentially
- destroy tiles

```ts
handleEvent(event, ctx) {
  if (event.type !== "row_revealed") return

  const tl = ctx.timeline()
  let index = 0

  for (let col = 0; col < 5; col++) {
    const tile = ctx.getTile(event.row, col)
    if (!tile || tile.data.result !== "correct") continue

    const pos = ctx.getTilePosition(event.row, col)

    tl.add(() => {
      ctx.spawnLaser({
        from: { x: 0, y: pos.y },
        to: { x: 800, y: pos.y }
      })

      ctx.destroyTile(event.row, col)
    }, index * 0.12)

    index++
  }
}
```

---

## 13. Engine Loop

```ts
class GameEngine {
  loop(time: number) {
    const dt = ...

    this.update(dt)
    this.render()

    requestAnimationFrame(this.loop)
  }
}
```

---

## 14. Guiding Principles

- Keep GameState minimal and pure
- Treat visuals as interpretation, not truth
- Use events as the bridge between logic and effects
- Use delegation (mode.handleEvent), not branching
- Avoid premature abstraction
- Build incrementally

---

## 15. Implementation Goal

First version should support:
- basic Wordle gameplay
- at least 1 obscure mode (laserBlast)
- working canvas scene
- GSAP-driven animations

Focus on:
- visible behavior
- clean architecture
- iteration speed