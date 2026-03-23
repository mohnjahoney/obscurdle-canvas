import { Entity } from "./Entity"

// Scene manages all entities in the game world
export class Scene {
  private entities: Entity[] = []

  add(entity: Entity) {
    this.entities.push(entity)
  }

  update(dt: number) {
    // Update all entities
    for (const entity of this.entities) {
      entity.update(dt)
    }

    // Remove dead entities
    this.entities = this.entities.filter(
      (entity) => entity.isReadyToBeCleared !== true
    )
  }

  render(ctx: CanvasRenderingContext2D) {
    // if ((window as any).DEBUG_SOURCE) {
    //   console.log(this.entities)
    // }

    // Draw all entities (sorted by internalZOrder)
    this.entities.sort(
      (a, b) => (a.internalZOrder ?? 0) - (b.internalZOrder ?? 0)
    )

    for (const entity of this.entities) {
      entity.draw(ctx)
    }
  }

  clear() {
    this.entities = []
  }
}
