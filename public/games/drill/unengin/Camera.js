export class Camera {
  constructor(){
    this.x = 0;
    this.y = 0;
  }

  worldToScreen(x,y){
    return {
      x:x-this.x,
      y:y-this.y
    };
  }

  setPos(x,y){
    this.x=x;
    this.y=y;
  }
}