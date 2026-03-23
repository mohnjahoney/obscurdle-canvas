import {
  GameState,
  Msg,
  GameEvent,
  TileData,
  TileResult,
} from "./types"

// Helper: create an empty 6x5 grid
export function createEmptyGrid(): TileData[][] {
  return Array.from({ length: 6 }, () =>
    Array.from({ length: 5 }, () => ({
      letter: "",
      result: "notSubmitted" as TileResult,
    }))
  )
}

// Evaluate a guess against the target word
function evaluateGuess(guess: string, target: string): TileResult[] {
  const result: TileResult[] = Array(5).fill("absent")
  const targetLetters = target.split("")
  const used = Array(5).fill(false)

  // First pass: correct
  for (let i = 0; i < 5; i++) {
    if (guess[i] === target[i]) {
      result[i] = "correct"
      used[i] = true
    }
  }

  // Second pass: present
  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") continue

    for (let j = 0; j < 5; j++) {
      if (!used[j] && guess[i] === targetLetters[j]) {
        result[i] = "present"
        used[j] = true
        break
      }
    }
  }

  return result
}

export function update(
  state: GameState,
  msg: Msg
): { state: GameState; events: GameEvent[] } {
  let newState: GameState = structuredClone(state)
  const events: GameEvent[] = []

  if (state.status !== "playing") {
    return { state, events }
  }

  switch (msg.type) {
    case "type_letter": {
      const row = newState.currentRow
      const rowData = newState.grid[row]

      const nextIndex = rowData.findIndex((t) => t.letter === "")
      if (nextIndex === -1) break

      rowData[nextIndex].letter = msg.letter.toUpperCase()
      break
    }

    case "delete_letter": {
      const row = newState.currentRow
      const rowData = newState.grid[row]

      for (let i = 4; i >= 0; i--) {
        if (rowData[i].letter !== "") {
          rowData[i].letter = ""
          break
        }
      }
      break
    }

    case "submit_guess": {
      const row = newState.currentRow
      const rowData = newState.grid[row]

      const guess = rowData.map((t) => t.letter).join("")
      // if (guess.length < 5 || guess.includes("")) break
      const isComplete = rowData.every((t) => t.letter !== "")
      if (!isComplete) break
      
      events.push({ type: "guess_submitted", guess })

      const results = evaluateGuess(guess, newState.targetWord)

      for (let col = 0; col < 5; col++) {
        rowData[col].result = results[col]

        events.push({
          type: "tile_revealed",
          row,
          col,
          result: results[col],
        })
      }

      events.push({ type: "row_revealed", row })

      if (guess === newState.targetWord) {
        newState.status = "won"
        events.push({ type: "game_won" })
      } else if (row === 5) {
        newState.status = "lost"
        events.push({ type: "game_lost" })
      } else {
        newState.currentRow += 1
      }

      break
    }

    case "set_obscure_mode": {
      newState.obscureMode = msg.mode
      break
    }
  }

  return { state: newState, events }
}
