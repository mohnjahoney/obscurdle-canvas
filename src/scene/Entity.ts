// Base interface for all renderable/updatable objects in the scene

export interface Entity {
  // Called every frame with delta time (in seconds)
  update(dt: number): void

  // Called every frame to render onto canvas
  draw(ctx: CanvasRenderingContext2D): void

  // Optional: whether this entity should be removed on the next render cycle
  isReadyToBeCleared?: boolean

  // Optional: draw order within the scene (lower drawn first). Defaults to 0 if undefined.
  internalZOrder?: number
}
