// ModeSelector.ts

import { OBSCURE_MODES, OBSCURE_META_BY } from "../modes/obscureModes"
import { startGame } from "../app/App"

export function createModeSelector() {
  const container = document.createElement("div")
  container.style.position = "fixed"
  container.style.top = "10px"
  container.style.left = "50%"
  container.style.transform = "translateX(-50%)"
  container.style.display = "flex"
  container.style.gap = "8px"
  container.style.zIndex = "1000"

  OBSCURE_MODES.forEach(obscureMode => {
    const obscureMeta = OBSCURE_META_BY[obscureMode]
    const btn = document.createElement("button")
    btn.innerText = obscureMeta.label
    btn.style.padding = "6px 10px"
    btn.style.cursor = "pointer"

    btn.onclick = () => {
      startGame(obscureMode)
    }

    container.appendChild(btn)
  })

  document.body.appendChild(container)
}

// initialize selector immediately
createModeSelector()
