export class Scene {
  constructor(){
    this.gameObjects = [];
  }

  add(gameObject) {
    this.gameObjects.push(gameObject);
  }

  update(deltaTime) {
    for (const gameObject of this.gameObjects) {
      if(gameObject.active) {
        gameObject.update(deltaTime);
      }
    }
  }

  draw(ctx, camera){
    for (const gameObject of this.gameObjects) {
      if(gameObject.active) {
        gameObject.draw(ctx, camera);
      }
    }
  }
}
