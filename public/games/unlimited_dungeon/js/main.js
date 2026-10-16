import { CONFIG, DIRECTIONS } from "./config.js";
import { Dungeon } from "./dungeon.js";
import { Player, createEnemies, createItems } from "./actors.js";
import { Renderer } from "./renderer.js";
import { GameUI } from "./ui.js";
import { CombatSystem } from "./combat.js";
import { InventorySystem } from "./inventory.js";

// 各機能を組み合わせ、冒険開始とキーボード操作を管理する。
const canvas = document.querySelector("#game-canvas");
const renderer = new Renderer(canvas);
const ui = new GameUI();
const state = { depth: 1, dungeon: null, player: null, enemies: [], items: [], ended: false, inventoryOpen: false, turnBusy: false };
const heldKeys = new Set();
let enemyDatabase;
let itemDatabase;
let combat;
let inventory;
let lastMoveAt = 0;

async function start() {
  const [enemyResponse, itemResponse] = await Promise.all([
    fetch("./data/enemies.json"),
    fetch("./data/items.json"),
  ]);
  if (!enemyResponse.ok || !itemResponse.ok) throw new Error("冒険データを読み込めませんでした。");
  [enemyDatabase, itemDatabase] = await Promise.all([enemyResponse.json(), itemResponse.json()]);
  combat = new CombatSystem(state, ui, itemDatabase, endRun);
  inventory = new InventorySystem(state, ui, combat, refresh);
  resetRun();
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", (event) => heldKeys.delete(event.key.toLowerCase()));
  window.addEventListener("blur", () => heldKeys.clear());
  requestAnimationFrame(drawFrame);
}

function resetRun() {
  state.depth = 1;
  state.ended = false;
  state.inventoryOpen = false;
  state.turnBusy = false;
  state.dungeon = new Dungeon(state.depth);
  state.player = new Player(state.dungeon.start);
  state.enemies = createEnemies(enemyDatabase, state.dungeon, state.depth);
  state.items = createItems(itemDatabase, state.dungeon, state.depth);
  ui.clearLog();
  ui.log("勇者は無限に続く地下迷宮へ足を踏み入れた。");
  ui.log("部屋に入ると、その部屋の地図が明らかになる。");
  inventory.pickup();
  ui.elements.overlay.classList.add("hidden");
  refresh();
}

function drawFrame() {
  renderer.draw(state);
  requestAnimationFrame(drawFrame);
}

function refresh() {
  ui.update(state);
}

function handleKeyDown(event) {
  const key = event.key.toLowerCase();
  if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) event.preventDefault();
  heldKeys.add(key);
  if (state.ended || state.turnBusy) return;
  if (state.inventoryOpen) return inventory.handleKey(key);
  if (key === "i" || key === "escape") return inventory.open();
  if (key === " " || key === "spacebar") {
    return runTurn(() => combat.attack());
  }
  const direction = getPressedDirection(key);
  if (direction) moveOrTurn(direction, event.shiftKey || heldKeys.has("shift"));
}

function getPressedDirection(key) {
  const horizontal = Number(heldKeys.has("d")) - Number(heldKeys.has("a"));
  const vertical = Number(heldKeys.has("s")) - Number(heldKeys.has("w"));
  if (["q", "e", "z", "c"].includes(key)) return DIRECTIONS[key];
  if (horizontal === 0 && vertical === 0) {
    return DIRECTIONS[key] ?? null;
  }
  return { x: horizontal, y: vertical, angle: directionName(horizontal, vertical) };
}

function directionName(x, y) {
  if (x === 0) return y < 0 ? "北" : "南";
  if (y === 0) return x < 0 ? "西" : "東";
  return y < 0 ? (x < 0 ? "北西" : "北東") : (x < 0 ? "南西" : "南東");
}

function moveOrTurn(direction, fast) {
  const now = performance.now();
  const delay = fast ? CONFIG.fastMoveDelay : CONFIG.moveDelay;
  if (now - lastMoveAt < delay) return;
  lastMoveAt = now;
  if (heldKeys.has("x")) {
    state.player.facing = direction;
    ui.log(`向きを${direction.angle}に変えた。`);
    return refresh();
  }
  state.player.facing = direction;
  const next = { x: state.player.x + direction.x, y: state.player.y + direction.y };
  if (!state.dungeon.isWalkable(next.x, next.y) ||
    state.enemies.some((enemy) => enemy.x === next.x && enemy.y === next.y)) {
    ui.log("行く手を阻まれている。");
    return;
  }
  runTurn(async () => {
    state.player.x = next.x;
    state.player.y = next.y;
    state.dungeon.revealAround(next.x, next.y, CONFIG.playerViewRadius);
    state.player.turns += 1;
    inventory.pickup();
    await combat.finishTurn();
    if (!state.ended && state.player.x === state.dungeon.exit.x &&
      state.player.y === state.dungeon.exit.y) descend();
  });
}

function runTurn(action) {
  if (state.turnBusy) return;
  state.turnBusy = true;
  Promise.resolve()
    .then(action)
    .then(refresh)
    .catch((error) => {
      console.error(error);
      ui.log(`行動を完了できませんでした：${error.message}`);
    })
    .finally(() => { state.turnBusy = false; });
}

function descend() {
  state.depth += 1;
  state.dungeon = new Dungeon(state.depth);
  state.player.x = state.dungeon.start.x;
  state.player.y = state.dungeon.start.y;
  state.enemies = createEnemies(enemyDatabase, state.dungeon, state.depth);
  state.items = createItems(itemDatabase, state.dungeon, state.depth);
  ui.log(`${state.depth}階層へ降りた。敵がさらに強くなっている。`);
}

function endRun(reason) {
  ui.showEnd("冒険はここで終わった", `${reason} ${state.depth}階層・レベル${state.player.level}まで到達した。`, resetRun);
}

document.querySelector("#inventory-button").addEventListener("click", () => inventory?.open());
document.querySelector("#new-game-button").addEventListener("click", () => {
  if (combat) resetRun();
});
start().catch((error) => {
  console.error(error);
  ui.log(error.message);
});
