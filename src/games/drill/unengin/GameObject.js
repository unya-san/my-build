import { Transform } from './Transform.js';

export class GameObject {
  constructor(x,y) {
    this.transform = new Transform(x,y);

    this.width = 50;
    this.height = 50;

    this.velocityX = 0;
    this.velocityY = 0;

    this.active = true;
  }

  update(deltaTime) {

  }

  draw(ctx, camera) {
    ctx.fillRect(this.x, this.y, 50, 50);
  }

  destroy() {
    this.active = false;
  }
}
