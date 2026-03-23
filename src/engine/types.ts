// ---------- Basic shared types ----------

export type Vec2 = { x: number; y: number }

// ---------- Game state (model) ----------

export type GameStatus = "playing" | "won" | "lost"

export type TargetWordSource = "daily" | "random"

export type ObscureMode =
  | "none"
  | "simpleFade"
  | "laserBlast"
  | "gravity"

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
