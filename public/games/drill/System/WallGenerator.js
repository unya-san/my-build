import { Wall } from "../Prefab/Wall.js"

export class WallGenerator {
  constructor(scene) {
    this.scene = scene
    this.wallWidth = 50;
    this.wallHeight = 20;
    this.leftWallX = 0;
    this.rightWallX = 750;

    this.nextY = 0;

    this.centerX = 400;
    this.tunnelWidth = 500;
    this.MaxTunnelWidth = 600;
    this.MinTunnelWidth = 400;

    this.prevPM = 1;
    this.prevPM_count = 50;
    this.loopcount = 50;
  }

  generate() {

    while(1){
      let randValue = Math.random(0,1)*20
      if( this.prevPM_count > 0 ) {
        this.prevPM_count--;
      } else {
        let pm = Math.random(0,1);
        if(pm > 0.7) {
          this.prevPM *= -1;
          this.prevPM_count = Math.random(0,1)*100 % 100;
          if(this.prevPM_count < 20){
            this.prevPM_count = 20
          }
        }
      }
      this.centerX += randValue*this.prevPM
      if((this.centerX - this.tunnelWidth/2) > 50 && (this.centerX + this.tunnelWidth/2) < 750){
        this.loopcount=50;
        break;
      }
      if(this.loopcount = 0){
        this.prevPM_count=0;
      }else{
        this.loopcount--;
      }
    }

    while(1){
      let randValue = Math.random(0,1)*20
      if((this.tunnelWidth+randValue)){
        
      }
    }

    this.leftWallX = this.centerX - this.tunnelWidth/2
    this.rightWallX = this.centerX + this.tunnelWidth/2

    const leftWall = new Wall(
      this.leftWallX,
      this.nextY,
      this.wallWidth,
      this.wallHeight
    )

    const rightWall = new Wall(
      this.rightWallX,
      this.nextY,
      this.wallWidth,
      this.wallHeight
    )

    this.scene.add(leftWall)
    this.scene.add(rightWall)

    this.nextY += this.wallHeight
  }

  setTunnelWidthLevel(max,min){
    this.MaxTunnelWidth = max;
    this.MinTunnelWidth = min;
  }
}