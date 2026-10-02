console.log("A")
import { Player } from "./Prefab/player.js"
console.log("B")
import { Input } from "./unengin/Input.js"
console.log("C")
import { Scene } from "./unengin/Scene.js"
console.log("D")
import { Camera } from "./unengin/Camera.js"
console.log("E")
import { WallGenerator } from "./System/WallGenerator.js"
console.log("F")


//GameLoop
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

Input.initialize();

const scene = new Scene();
const camera = new Camera();
const player = new Player(400,100);

scene.add(player);

const wallGenerator = new WallGenerator(scene);
for ( let i=0; i<50; i++){
  wallGenerator.generate();
}

let lastTime = performance.now();

let depthLevel = 0;

function gameLoop(currentTime){
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  //更新
  scene.update(deltaTime);

  //画面クリア
  ctx.clearRect(0,0,canvas.width,canvas.height);

  //描画
  camera.setPos(0,player.transform.y-100-player.speed/10);
  scene.draw(ctx, camera);

  ctx.font = "20px sans-serif";
  ctx.fillText(
    `Speed:${player.speed.toFixed(1)}`,
    20,
    30
  );

  if(player.transform.y > 500*depthLevel + 500){
    depthLevel++;
    for ( let i=0; i<50; i++){
      wallGenerator.generate();
    }
  }

  requestAnimationFrame(gameLoop);

}

requestAnimationFrame(gameLoop);
