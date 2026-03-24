// ModeSelector.ts

import { OBSCURE_MODES, OBSCURE_META_BY } from "../modes/obscureModes"
import { startGame } from "../app/App"
import { ObscureMode } from "../engine/types"

export function createModeSelector(obscureMode: ObscureMode) {
  const container = document.createElement("div")
  container.style.position = "fixed"
  container.style.top = "10px"
  container.style.left = "50%"
  container.style.transform = "translateX(-50%)"
  container.style.display = "flex"
  container.style.gap = "8px"
  container.style.zIndex = "1000"

  OBSCURE_MODES.forEach(oMode => {
    const obscureMeta = OBSCURE_META_BY[oMode]
    const btn = document.createElement("button")
    btn.innerText = obscureMeta.label
    btn.style.padding = "6px 10px"
    btn.style.cursor = "pointer"

    btn.style.background = "#222"
    btn.style.color = "#fff"
    btn.style.border = "1px solid #555"

    btn.onclick = () => {
      startGame(oMode)

      // update all buttons
      container.querySelectorAll("button").forEach(b => {
        (b as HTMLButtonElement).style.background = "#222"
      })

      btn.style.background = "#444"
    }

    container.appendChild(btn)
  })

  document.body.appendChild(container)
}
