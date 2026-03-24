import { GameEvent } from "../engine/types"
import { EffectContext } from "../effects/EffectContext"
import { ObscureMode, ObscureMeta, noopOnStart, noopHandleEvent } from "../engine/types"

// ---- Mode implementations ----

const normalMeta: ObscureMeta = {
  label: "Normal",

  onStart: noopOnStart,

  handleEvent: noopHandleEvent,
}

const simpleFadeMeta: ObscureMeta = {
  label: "Simple Fade",

  onStart() {},

  handleEvent(event, ctx) {
    if (event.type !== "tile_revealed") return

    const { row, col } = event
    console.log("in handleEvent", row, col)
    ctx.fadeTile(row, col)
  },
}

const laserBlastMeta: ObscureMeta = {
  label: "Laser Blast",

  onStart(ctx) {
    ctx.startLaserLoop()
  },

  handleEvent(event, ctx) {
    if (event.type !== "tile_revealed") return
    if (event.result !== "correct") return

    const { row, col } = event
    ctx.registerTile(row, col)
  },
}

const rotationPulseMeta: ObscureMeta = {
  label: "Rotation Pulse",

  onStart(ctx) {
    console.log('in onstart rotation')
    ctx.startRotationPulse()
  },

  handleEvent(event, ctx) {
    // console.log('in handleEvent rotation')
    console.log("event", event)
    if (event.type !== "guess_submitted") return

    console.log('in handleEvent about to pulse')
    ctx.enableRotationPulse()
  },
}
// ---- Registry ----

export const OBSCURE_META_BY: Record<ObscureMode, ObscureMeta> = {
  normal: normalMeta,
  simpleFade: simpleFadeMeta,
  laserBlast: laserBlastMeta,
  rotationPulse: rotationPulseMeta,
  
}

// Optional list (for UI ordering)
export const OBSCURE_MODES = Object.keys(OBSCURE_META_BY) as ObscureMode[]