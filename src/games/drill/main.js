import { Player } from "./player.js";
import { Input } from "./unengin/Input.js"
import { Scene } from "./unengin/Scene.js"
import { GameObject } from "./unengin/GameObject.js"
import { Camera } from "./unengin/Camera.js"


//GameLoop
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

Input.initialize();

const scene = new Scene();
const camera = new Camera();
const player = new Player(375,500);

scene.add(player);

let lastTime = performance.now();

function gameLoop(currentTime){
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  //更新
  scene.update(deltaTime);

  //画面クリア
  ctx.clearRect(0,0,canvas.width,canvas.height);

  //描画
  scene.draw(ctx, camera);

  ctx.font = "20px sans-serif";
  ctx.fillText(
    `Speed:${player.speed.toFixed(1)}`,
    20,
    30
  );
  requestAnimationFrame(gameLoop);

}

requestAnimationFrame(gameLoop);
