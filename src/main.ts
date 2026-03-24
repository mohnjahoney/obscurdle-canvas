// main.ts

import { initApp, startGame } from "./app/App"
import {createModeSelector} from "./ui/ModeSelector"

// Create canvas once
const canvas = document.createElement("canvas")
document.body.style.margin = "0"
document.body.appendChild(canvas)

canvas.style.position = "absolute"
canvas.style.left = "50%"
canvas.style.top = "50%"
canvas.style.transform = "translate(-50%, -50%)"

canvas.width = 600
canvas.height = 800


// Initialize app with canvas
initApp(canvas)
const obscureMode = "normal"
createModeSelector(obscureMode)
const engine = startGame(obscureMode)
// console.log(engine.getState())


