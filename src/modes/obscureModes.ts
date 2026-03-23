import { GameEvent } from "../engine/types"
import { EffectContext } from "../effects/EffectContext"

// ---- Types ----

export type ObscureMode = {
  id: "laserBlast"
  label: string
  handleEvent: (event: GameEvent, ctx: EffectContext) => void
}

// ---- Laser Blast Mode ----

export const laserBlast: ObscureMode = {
  id: "laserBlast",
  label: "Laser Blast",

  handleEvent(event, ctx) {
    // Trigger on each tile reveal
    if (event.type !== "tile_revealed") return

    // Only fire for correct tiles
    if (event.result !== "correct") return

    const { row, col } = event

    // Ensure tile is registered in effect system
    // ctx.applyBurnEffect(row, col)
    ctx.registerTile(row, col)
  },
}

// ---- Registry ----

export const OBSCURE_MODES = {
  laserBlast,
}