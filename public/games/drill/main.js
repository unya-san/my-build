import { Player } from "./Prefab/player.js"
import { Input } from "./unengin/Input.js"
import { Scene } from "./unengin/Scene.js"
import { Camera } from "./unengin/Camera.js"
import { WallGenerator } from "./System/WallGenerator.js"


//GameLoop
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
console.log("A")

Input.initialize();
console.log("B")

const scene = new Scene();
const camera = new Camera();
const player = new Player(400,100);
console.log("C")

scene.add(player);

const wallGenerator = new WallGenerator(scene);
for ( let i=0; i<50; i++){
  wallGenerator.generate();
}
console.log("D")

let lastTime = performance.now();

let depthLevel = 0;
console.log("E")

function gameLoop(currentTime){
console.log("F")
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
