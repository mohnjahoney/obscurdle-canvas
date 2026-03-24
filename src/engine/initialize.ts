import {GameState, TileData, TileResult} from "./types"

// Helper: create an empty 6x5 grid
export function createEmptyGrid(): TileData[][] {
  return Array.from({ length: 6 }, () =>
    Array.from({ length: 5 }, () => ({
      letter: "",
      result: "notSubmitted" as TileResult,
    }))
  )
}

export function createInitialState(
    overrides: Partial<GameState> = {}
  ): GameState {
    return {
      grid: createEmptyGrid(),
      currentRow: 0,
      status: "playing",
      targetWord: "CRANE",
      targetWordSource: "random",
      obscureMode: "normal",
  
      ...overrides,
    }
  }