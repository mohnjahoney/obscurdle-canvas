// ---------- Basic shared types ----------

import { EffectContext } from "../effects/EffectContext";

export type Vec2 = { x: number; y: number }

export const noopOnStart = () => {}
export const noopHandleEvent = () => {}

// ---------- Game state (model) ----------

export type GameStatus = "playing" | "won" | "lost"

export type TargetWordSource = "daily" | "random"

export type ObscureMode =
  | "normal"
  | "simpleFade"
  | "laserBlast"
  | "rotationPulse"

export type ObscureMeta = {
  label: string
  onStart: (ctx: EffectContext) => void
  handleEvent: (event: any, ctx: any) => void
}

export const OBSCURE_META_BY: Record<ObscureMode, ObscureMeta> = {
  normal:
  {
    label: "Normal",
    onStart: noopOnStart,
    handleEvent: noopHandleEvent 
  },
  simpleFade:
  {
    label: "Simple Fade",
    onStart: noopOnStart,
    handleEvent: noopHandleEvent 
  },
  laserBlast:
  { 
    label: "Laser Blast", 
    onStart: noopOnStart,
    handleEvent: noopHandleEvent 
  },
  rotationPulse:
  { 
    label: "Rotation Pulse", 
    onStart: noopOnStart,
    handleEvent: noopHandleEvent 
  },
}

// "notSubmitted" means the tile has not yet been evaluated (row not submitted)
export type TileResult = "correct" | "present" | "absent" | "notSubmitted"

export type TileData = {
  letter: string
  result: TileResult
}

export type GameState = {
    grid: TileData[][]
    currentRow: number
    status: GameStatus
  
    targetWord: string
  
    targetWordSource: TargetWordSource
    obscureMode: ObscureMode
  }

// ---------- Messages (inputs to update) ----------

export type Msg =
  | { type: "type_letter"; letter: string }
  | { type: "delete_letter" }
  | { type: "submit_guess" }
  | { type: "set_obscure_mode"; mode: ObscureMode }

// ---------- Events (outputs from update) ----------
// These represent meaningful gameplay / information-disclosure moments.
// They are NOT animation steps.

export type GameEvent =
  | { type: "guess_submitted"; guess: string }
  | { type: "tile_revealed"; row: number; col: number; result: TileResult }
  | { type: "row_revealed"; row: number }
  | { type: "game_won" }
  | { type: "game_lost" }
