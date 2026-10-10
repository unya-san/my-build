import { GameObject } from "../unengin/GameObject.js"

export class Wall extends GameObject {
  constructor(x, y, width, height) {
    super(x, y, "Wall")
    this.width = width
    this.height = height
  }

  draw(ctx, camera) {
    const screenPosition = camera.worldToScreen(
      this.transform.x,
      this.transform.y
    )

    ctx.fillRect(
      screenPosition.x,
      screenPosition.y,
      this.width,
      this.height
    )
  }
}
