import { GameObject } from "../unengin/GameObject.js"
import { Input } from "../unengin/Input.js"

export class Player extends GameObject {
  constructor(x,y){
    super(x,y)
    this.speed = 0;
    this.moveSpeed = 300;
    this.acceleration = 100;
    this.maxSpeed = 500;
    this.deceleration = 150;
  }

  update(deltaTime){
    if(Input.left){
      this.transform.x -= this.moveSpeed * deltaTime;
    }

    if(Input.right){
      this.transform.x += this.moveSpeed * deltaTime;
    }

    if(Input.space){
      this.speed += this.acceleration * deltaTime;
      if (this.speed > this.maxSpeed){
        this.speed = this.maxSpeed;
      }
    }else{
      this.speed -= this.deceleration * deltaTime;
      if (this.speed < 0){
        this.speed = 0
      }
    }

    this.transform.y += this.speed/100;
  }

  draw(ctx, camera){
  const screenPosition = camera.worldToScreen(
    this.transform.x,
    this.transform.y
  )

    ctx.fillRect(
      screenPosition.x,
      screenPosition.y,
      50,
      50
    )
  }
}