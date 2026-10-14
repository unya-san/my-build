import { Transform } from './Transform.js';

export class GameObject {
  constructor(x, y, tag = "None") {
    this.transform = new Transform(x, y);

    this.width = 50;
    this.height = 50;

    this.velocityX = 0;
    this.velocityY = 0;

    this.active = true;

    this.tag = tag;
  }

  update(deltaTime) {

  }

  draw(ctx, camera) {
    ctx.fillRect(this.x, this.y, 50, 50);
  }

  destroy() {
    this.active = false;
  }

  setTag(t) {
    this.tag = t;
  }
}
