import { CONFIG, randomInt } from "./config.js";

const WALL = 0;
const ROOM = 1;
const HALL = 2;

// 各階層の部屋・通路と、探索状況を管理する。
export class Dungeon {
  constructor(depth) {
    this.depth = depth;
    this.size = Math.min(CONFIG.maxMapSize, CONFIG.startMapSize + depth * CONFIG.mapSizePerFloor);
    this.tiles = Array.from({ length: this.size }, () => Array(this.size).fill(WALL));
    this.roomIds = Array.from({ length: this.size }, () => Array(this.size).fill(-1));
    this.discovered = Array.from({ length: this.size }, () => Array(this.size).fill(false));
    this.rooms = [];
    this.#generateRooms();
    this.#connectRooms();
    this.start = this.centerOf(this.rooms[0]);
    this.exit = this.centerOf(this.rooms[this.rooms.length - 1]);
    this.markRoom(this.rooms[0]);
  }

  #generateRooms() {
    const desired = randomInt(CONFIG.minRooms, Math.min(CONFIG.maxRooms, CONFIG.minRooms + Math.floor(this.depth / 2)));
    for (let attempt = 0; attempt < desired * 45 && this.rooms.length < desired; attempt += 1) {
      const width = randomInt(CONFIG.minRoomSize, CONFIG.maxRoomSize);
      const height = randomInt(CONFIG.minRoomSize, CONFIG.maxRoomSize);
      const room = {
        x: randomInt(1, this.size - width - 1),
        y: randomInt(1, this.size - height - 1),
        width,
        height,
      };
      if (this.rooms.some((other) => this.#overlaps(room, other))) continue;
      this.#carveRoom(room, this.rooms.length);
      this.rooms.push(room);
    }
    if (this.rooms.length < CONFIG.minRooms) this.#placeFallbackRooms();
  }

  #overlaps(room, other) {
    const gap = CONFIG.roomPadding;
    return room.x - gap < other.x + other.width &&
      room.x + room.width + gap > other.x &&
      room.y - gap < other.y + other.height &&
      room.y + room.height + gap > other.y;
  }

  #carveRoom(room, id) {
    for (let y = room.y; y < room.y + room.height; y += 1) {
      for (let x = room.x; x < room.x + room.width; x += 1) {
        this.tiles[y][x] = ROOM;
        this.roomIds[y][x] = id;
      }
    }
  }

  #placeFallbackRooms() {
    const span = Math.floor((this.size - 4) / CONFIG.minRooms);
    while (this.rooms.length < CONFIG.minRooms) {
      const index = this.rooms.length;
      const room = {
        x: 2 + (index % 3) * span,
        y: 2 + Math.floor(index / 3) * span,
        width: CONFIG.minRoomSize,
        height: CONFIG.minRoomSize,
      };
      this.#carveRoom(room, index);
      this.rooms.push(room);
    }
  }

  #connectRooms() {
    for (let index = 1; index < this.rooms.length; index += 1) {
      const previous = this.centerOf(this.rooms[index - 1]);
      const next = this.centerOf(this.rooms[index]);
      this.#carveHall(previous, next, Math.random() < 0.5);
    }
    const links = randomInt(CONFIG.minBranchLinks, CONFIG.maxBranchLinks);
    for (let link = 0; link < links; link += 1) {
      const first = this.centerOf(this.rooms[randomInt(0, this.rooms.length - 1)]);
      const second = this.centerOf(this.rooms[randomInt(0, this.rooms.length - 1)]);
      this.#carveHall(first, second, Math.random() < 0.5);
    }
  }

  #carveHall(from, to, horizontalFirst) {
    const bend = horizontalFirst ? { x: to.x, y: from.y } : { x: from.x, y: to.y };
    this.#carveLine(from, bend);
    this.#carveLine(bend, to);
  }

  #carveLine(from, to) {
    let x = from.x;
    let y = from.y;
    while (x !== to.x || y !== to.y) {
      if (this.tiles[y][x] === WALL) this.tiles[y][x] = HALL;
      if (x !== to.x) x += Math.sign(to.x - x);
      else y += Math.sign(to.y - y);
      if (this.tiles[y][x] === WALL) this.tiles[y][x] = HALL;
    }
  }

  centerOf(room) {
    return { x: Math.floor(room.x + room.width / 2), y: Math.floor(room.y + room.height / 2) };
  }

  isWalkable(x, y) {
    return x >= 0 && y >= 0 && x < this.size && y < this.size && this.tiles[y][x] !== WALL;
  }

  markRoom(room) {
    if (!room) return;
    for (let y = room.y; y < room.y + room.height; y += 1) {
      for (let x = room.x; x < room.x + room.width; x += 1) this.discovered[y][x] = true;
    }
    this.#markHallwaysNear(room);
  }

  #markHallwaysNear(room) {
    for (let y = room.y - 1; y <= room.y + room.height; y += 1) {
      for (let x = room.x - 1; x <= room.x + room.width; x += 1) {
        if (this.tiles[y]?.[x] === HALL) this.discovered[y][x] = true;
      }
    }
  }

  revealAround(x, y, radius) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (dx * dx + dy * dy <= radius * radius && this.isWalkable(x + dx, y + dy)) {
          this.discovered[y + dy][x + dx] = true;
        }
      }
    }
    const roomId = this.roomIds[y]?.[x];
    if (roomId >= 0) this.markRoom(this.rooms[roomId]);
  }

  isRoomTile(x, y) {
    return this.roomIds[y]?.[x] >= 0;
  }

  get tileTypes() {
    return { WALL, ROOM, HALL };
  }
}
