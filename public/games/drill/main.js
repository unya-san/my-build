import { Player } from "./Prefab/player.js"
import { Input } from "./unengin/Input.js"
import { Scene } from "./unengin/Scene.js"
import { Camera } from "./unengin/Camera.js"
import { WallGenerator } from "./System/WallGenerator.js"
import { Collision } from "./unengin/Collision.js"


//GameLoop
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

Input.initialize();

const scene = new Scene();
const camera = new Camera();
const player = new Player(400, 100);
console.log("A")

scene.add(player);
console.log("B")

const wallGenerator = new WallGenerator(scene);
console.log("C")
for (let i = 0; i < 50; i++) {
  console.log("D")
  wallGenerator.generate();
}
console.log("E")

let lastTime = performance.now();
console.log("F")

let depthLevel = 0;

function gameLoop(currentTime) {
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  //更新
  scene.update(deltaTime);

  //画面クリア
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  //描画
  camera.setPos(0, player.transform.y - 100 - player.speed / 10);
  scene.draw(ctx, camera);

  ctx.font = "20px sans-serif";
  ctx.fillText(
    `Speed:${player.speed.toFixed(1)}`,
    20,
    30
  );

  if (player.transform.y > 500 * depthLevel + 500) {
    depthLevel++;
    for (let i = 0; i < 50; i++) {
      wallGenerator.generate();
    }
  }

  for (const gameObject of scene.gameObjects) {
    if (gameObject.tag === "Wall") {
      if (Collision.checkPlayerWall(player, gameObject)) {
        console.log("Wall Collision!");
      }
    }
  }

  requestAnimationFrame(gameLoop);

}

requestAnimationFrame(gameLoop);
