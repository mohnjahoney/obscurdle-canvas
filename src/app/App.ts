// App.ts
// Central coordinator: owns canvas + GameEngine lifecycle + input

import { GameEngine } from "../engine/GameEngine"
import { createInitialState } from "../engine/initialize"
import { ObscureMode, Msg } from "../engine/types"

let canvas: HTMLCanvasElement
let engine: GameEngine | null = null

// ---- Input handling (lives at app level) ----

function handleKeyDown(e: KeyboardEvent) {
  if (!engine) return

  // very basic mapping (adjust as needed)
  if (e.key === "Enter") {
    engine.dispatch({ type: "submit_guess" })
  } else if (e.key === "Backspace") {
    engine.dispatch({ type: "delete_letter" })
  } else if (/^[a-zA-Z]$/.test(e.key)) {
    engine.dispatch({ type: "type_letter", letter: e.key.toUpperCase() })
  }
}

// Initialize app with a canvas (called once from main)
export function initApp(c: HTMLCanvasElement) {
  canvas = c

  // attach input listener once
  window.addEventListener("keydown", handleKeyDown)
}

// Start or restart the game with a given mode
export function startGame(obscureMode: ObscureMode) {
  if (!canvas) {
    throw new Error("App not initialized: call initApp(canvas) first")
  }

  // clean up previous engine
  if (engine) {
    engine.destroy()
    engine = null
  }

  // create new engine with fresh state
  engine = new GameEngine({
    canvas,
    initialState: createInitialState({obscureMode: obscureMode}),
  })

  // expose for debugging (optional)
  ;(window as any).engine = engine

  engine.start()

  // For debugging
  return engine
}

// Optional: expose current engine (for debugging / future use)
export function getEngine() {
  return engine
}
