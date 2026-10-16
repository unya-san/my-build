import { CONFIG, randomInt } from "./config.js";

// JSONの敵図鑑とプレイヤー・敵・アイテムの生成を担当する。
export class Player {
  constructor(position) {
    this.x = position.x;
    this.y = position.y;
    this.hp = CONFIG.startingHp;
    this.maxHp = CONFIG.startingHp;
    this.torch = CONFIG.startingTorch;
    this.baseAttack = CONFIG.startingAttack;
    this.baseDefense = CONFIG.startingDefense;
    this.level = 1;
    this.experience = 0;
    this.nextExperience = 20;
    this.facing = { x: 0, y: 1, angle: "南" };
    this.inventory = [];
    this.equipment = { weapon: null, armor: null, shield: null };
    this.bonusAttack = 0;
    this.bonusDefense = 0;
    this.turns = 0;
  }

  get attack() {
    const weapon = this.equipment.weapon;
    return this.baseAttack + this.bonusAttack + (weapon?.power ?? 0) + (weapon?.plus ?? 0);
  }

  get defense() {
    return this.baseDefense + this.bonusDefense +
      (this.equipment.armor?.power ?? 0) + (this.equipment.armor?.plus ?? 0) +
      (this.equipment.shield?.power ?? 0) + (this.equipment.shield?.plus ?? 0);
  }

  get alive() {
    return this.hp > 0;
  }
}

export function createEnemies(database, dungeon, depth) {
  const enemies = [];
  const occupied = new Set([`${dungeon.start.x},${dungeon.start.y}`, `${dungeon.exit.x},${dungeon.exit.y}`]);
  const perRoom = Math.min(
    CONFIG.maxEnemiesPerRoom,
    CONFIG.enemyCountPerRoom + Math.floor((depth - 1) / CONFIG.enemyDepthInterval) * CONFIG.enemyCountPerDepth,
  );
  const boss = database[database.length - 1];
  dungeon.rooms.forEach((room, roomIndex) => {
    const count = perRoom;
    for (let number = 0; number < count; number += 1) {
      const template = roomIndex === dungeon.rooms.length - 1 && number === 0
        ? boss
        : database[randomInt(0, Math.max(0, database.length - 2))];
      const variant = randomInt(0, 3);
      const position = findOpenCell(dungeon, room, occupied);
      occupied.add(`${position.x},${position.y}`);
      enemies.push({
        ...template,
        name: enemyVariantName(template.name, variant),
        spriteRow: database.indexOf(template),
        id: `${depth}-${roomIndex}-${number}-${Math.random()}`,
        x: position.x,
        y: position.y,
        hp: Math.ceil(template.hp * (1 + (depth - 1) * 0.18)),
        maxHp: Math.ceil(template.hp * (1 + (depth - 1) * 0.18)),
        attack: Math.ceil(template.attack * (1 + (depth - 1) * 0.14)),
        defense: Math.ceil(template.defense * (1 + (depth - 1) * 0.12)),
        exp: Math.ceil(template.exp * (1 + (depth - 1) * 0.12)),
        color: variant === 0 ? template.color : shadeColor(template.color, variant * 16),
        variant,
        awake: false,
      });
    }
  });
  return enemies;
}

export function createItems(database, dungeon, depth) {
  const items = [];
  const count = randomInt(CONFIG.minItems, CONFIG.maxItems);
  const regularItems = database.filter((item) => item.kind !== "Torch");
  const torches = database.filter((item) => item.kind === "Torch");
  const torchCount = Math.min(randomInt(CONFIG.minTorchesPerFloor, CONFIG.maxTorchesPerFloor), count);
  for (let index = 0; index < count - torchCount; index += 1) {
    const room = dungeon.rooms[randomInt(0, dungeon.rooms.length - 1)];
    const item = chooseWeightedItem(regularItems);
    const position = findOpenCell(dungeon, room);
    items.push(createItemInstance(item, depth, position, `${depth}-item-${index}`));
  }
  for (let index = 0; index < torchCount; index += 1) {
    const template = torches[randomInt(0, torches.length - 1)];
    const room = dungeon.rooms[randomInt(0, dungeon.rooms.length - 1)];
    items.push(createItemInstance(template, depth, findOpenCell(dungeon, room), `${depth}-torch-${index}`));
  }
  return items;
}

export function createItemInstance(template, depth, position, id) {
  const item = { ...template, x: position.x, y: position.y, id };
  if (item.kind === "Arrow") item.quantity = item.quantity ?? 5;
  if (["Sword", "Spear", "Bow", "Armor", "Shield"].includes(item.kind)) {
    item.plus = Math.floor((depth - 1) / 5) + 1 + randomInt(0, 1);
  }
  return item;
}

export function chooseWeightedItem(database) {
  const total = database.reduce((sum, item) => sum + rarityWeight(item), 0);
  let choice = Math.random() * total;
  return database.find((item) => {
    choice -= rarityWeight(item);
    return choice < 0;
  }) ?? database[database.length - 1];
}

function rarityWeight(item) {
  if (item.kind === "Bow") return 8 * (CONFIG.itemRarityWeights[item.rarity] ?? CONFIG.itemRarityWeights.common);
  if (item.kind === "Torch") return 5 * (CONFIG.itemRarityWeights[item.rarity] ?? CONFIG.itemRarityWeights.common);
  return CONFIG.itemRarityWeights[item.rarity] ?? CONFIG.itemRarityWeights.common;
}

function enemyVariantName(name, variant) {
  if (variant === 0) return name;
  if (name === "ミミック" && variant === 2) return "ミミックライト";
  const colors = ["", "グリーン", "ブルー", "パープル"];
  return `${colors[variant]}${name}`;
}

function findOpenCell(dungeon, room, occupied = new Set()) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const x = randomInt(room.x, room.x + room.width - 1);
    const y = randomInt(room.y, room.y + room.height - 1);
    if (dungeon.isWalkable(x, y) && !occupied.has(`${x},${y}`)) return { x, y };
  }
  return dungeon.centerOf(room);
}

function shadeColor(hex, amount) {
  const raw = Number.parseInt(hex.slice(1), 16);
  const channels = [raw >> 16, (raw >> 8) & 255, raw & 255]
    .map((channel) => Math.min(255, Math.max(0, channel + amount)));
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}
