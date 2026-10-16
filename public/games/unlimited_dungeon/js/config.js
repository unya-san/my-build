// ゲーム全体で共有する調整値をまとめる。
export const CONFIG = Object.freeze({
  tileSize: 48,
  canvasWidth: 960,
  canvasHeight: 640,
  startMapSize: 32,
  mapSizePerFloor: 2,
  maxMapSize: 64,
  minRooms: 5,
  maxRooms: 10,
  minRoomSize: 4,
  maxRoomSize: 8,
  roomPadding: 1,
  minBranchLinks: 2,
  maxBranchLinks: 4,
  minItems: 5,
  maxItems: 15,
  minTorchesPerFloor: 2,
  maxTorchesPerFloor: 6,
  inventoryLimit: 30,
  startingHp: 100,
  startingAttack: 5,
  startingDefense: 0,
  startingTorch: 100,
  healPerTurn: 1,
  torchDrainPerTurn: 1,
  playerViewRadius: 9,
  moveDelay: 170,
  fastMoveDelay: 75,
  combatMessageDelay: 320,
  enemyCountPerRoom: 2,
  enemyCountPerDepth: 1,
  enemyDepthInterval: 3,
  maxEnemiesPerRoom: 5,
  spearRange: 2,
  bowRange: 6,
  cardRange: 6,
  itemRarityWeights: {
    common: 1,
    uncommon: 0.55,
    rare: 0.28,
    epic: 0.12,
    legendary: 0.04,
  },
  itemSortOrder: ["Book", "Sword", "Spear", "Bow", "Armor", "Shield", "Arrow", "Herb", "Card", "Torch"],
  colors: {
    wall: "#303b41",
    ground: "#75684e",
    corridor: "#625a48",
    unseen: "#0a0e12",
    explored: "#20282c",
    player: "#f3d37a",
    stairs: "#80d6b3",
  },
});

export const DIRECTIONS = Object.freeze({
  w: { x: 0, y: -1, angle: "北" },
  d: { x: 1, y: 0, angle: "東" },
  s: { x: 0, y: 1, angle: "南" },
  a: { x: -1, y: 0, angle: "西" },
  q: { x: -1, y: -1, angle: "北西" },
  e: { x: 1, y: -1, angle: "北東" },
  c: { x: 1, y: 1, angle: "南東" },
  z: { x: -1, y: 1, angle: "南西" },
});

export const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const randomDamage = () => Math.floor(Math.random() * 3) - 1;

export function sortInventory(items) {
  items.sort((first, second) =>
    CONFIG.itemSortOrder.indexOf(first.kind) - CONFIG.itemSortOrder.indexOf(second.kind) ||
    first.name.localeCompare(second.name, "ja") ||
    (first.plus ?? 0) - (second.plus ?? 0) ||
    (second.power ?? 0) - (first.power ?? 0));
}
