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

    this.moveState = MoveState.RIGHT;
    this.moveCount = 0;
    this.minMoveCount = 20;
    this.changeDirection = 0.3;

    this.tunnelWidthState = TunnelWidthState.SHORT;
    this.depthCount = 0;
    this.minDepthCount = 20;
    this.changeWidth = 0.3;
  }

  generate() {
    this.updateMoveState();
    this.updateCenterX();
    this.updateTunnelWidthState()
    this.updateTunnelWidth();

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

    console.log(`left wall : ${this.leftWallX}`)
    console.log(`right wall : ${this.rightWallX}`)

    this.scene.add(leftWall)
    this.scene.add(rightWall)

    this.nextY += this.wallHeight
  }

  setTunnelWidthLevel(max,min){
    this.MaxTunnelWidth = max;
    this.MinTunnelWidth = min;
  }

  updateMoveState(){
    this.moveCount++;
    if(this.moveCount < this.minMoveCount){
      return;
    }

    if(Math.random() < this.changeDirection){
      this.moveState *= -1;
      this.moveCount = 0;
    }
  }
  updateCenterX(){
    let moveAmount = Math.random(0,1)*20;
    this.centerX += this.moveState * moveAmount;
    if( (this.centerX - this.tunnelWidth/2) < 100 ){
      this.centerX = 100 + this.tunnelWidth/2
    } else if ( (this.centerX + this.tunnelWidth/2) > 700 ){
      this.centerX = 700 - this.tunnelWidth/2
    }
  }

  updateTunnelWidthState(){
    this.depthCount++;
    if(this.depthCount < this.minDepthCount){
      return;
    }

    if(Math.random() < this.changeWidth){
      this.tunnelWidthState *= -1;
      this.depthCount = 0;
    }
  }
  updateTunnelWidth(){
    let widthAmount = Math.random(0,1)*20;
    this.tunnelWidth += this.tunnelWidthState * widthAmount;
    if( this.tunnelWidth < this.MinTunnelWidth ){
      this.tunnelWidth = this.MinTunnelWidth
    } else if ( this.tunnelWidth > this.MaxTunnelWidth ){
      this.tunnelWidth = this.MaxTunnelWidth
    }
  }
}

const MoveState = {
  LEFT:-1,
  RIGHT:1
}

const TunnelWidthState = {
  SHORT:-1,
  WIDE:1
}