import { GameEngine } from "./engine/GameEngine"
import { createEmptyGrid } from "./engine/update"
import { GameState } from "./engine/types"
import { Tile } from "./entities/Tile"

// ---- Create canvas ----

const canvas = document.createElement("canvas")
canvas.style.width = "100vw"
canvas.style.height = "100vh"
canvas.style.display = "block"
document.body.style.margin = "0"
document.body.appendChild(canvas)

// ---- Initial GameState ----

const initialState: GameState = {
  grid: createEmptyGrid(),
  currentRow: 0,
  status: "playing",

  targetWord: "CRANE", // hardcoded for now

  targetWordSource: "random",
  obscureMode: "laserBlast",
}

// ---- Engine ----

const engine = new GameEngine({
  canvas,
  initialState,
})

// // ---- Build tile entities ----

// function buildTiles() {
//   const scene = engine.getScene()
//   scene.clear()

//   const state = engine.getState()

//   const tileSize = 60
//   const gap = 8

//   const totalWidth = 5 * tileSize + 4 * gap
//   const totalHeight = 6 * tileSize + 5 * gap

//   const origin = {
//     x: (window.innerWidth - totalWidth) / 2,
//     y: (window.innerHeight - totalHeight) / 2,
//   }

//   for (let row = 0; row < 6; row++) {
//     for (let col = 0; col < 5; col++) {
//       const tile = new Tile({
//         data: state.grid[row][col],
//         row,
//         col,
//         size: tileSize,
//         gap,
//         origin,
//       })

//       scene.add(tile)
//     }
//   }
// }

// ---- Input handling ----

window.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    engine.dispatch({ type: "submit_guess" })
  } else if (e.key === "Backspace") {
    engine.dispatch({ type: "delete_letter" })
  } else if (/^[a-zA-Z]$/.test(e.key)) {
    engine.dispatch({ type: "type_letter", letter: e.key })
  }

  // buildTiles()
})

// ---- Initial render ----

// buildTiles()
engine.start()
