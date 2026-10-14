import { CONFIG } from "./config.js";

const SPRITE = Object.freeze({
  enemyColumns: [8, 120, 230, 336],
  itemColumns: [842, 933, 1024, 1115],
  enemyRows: [
    [18, 55], [76, 70], [152, 58], [216, 51], [272, 58],
    [329, 59], [389, 59], [453, 57], [511, 58], [570, 59],
    [626, 60], [679, 70], [751, 48], [794, 63], [860, 58],
    [920, 49], [967, 59], [1025, 54], [1080, 57], [1148, 80],
  ],
  itemRows: {
    Book: [16, 66],
    Herb: [99, 66],
    Card: [180, 66],
    Sword: [259, 68],
    Shield: [340, 72],
    Armor: [432, 64],
    Spear: [510, 66],
    Bow: [594, 66],
    Arrow: [681, 60],
    Torch: [1025, 54],
  },
});

// メイン画面と右上のミニマップをCanvasへ描画する。
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.context.imageSmoothingEnabled = false;
    this.spriteSheet = new Image();
    this.spriteSheet.onload = () => this.#prepareSprites();
    this.spriteSheet.onerror = () => console.error("スプライト画像を読み込めませんでした。");
    this.spriteSheet.src = new URL("../data/sprite.png", import.meta.url).href;
  }

  draw(state) {
    const { context: ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = CONFIG.colors.unseen;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const origin = this.#cameraOrigin(state);
    this.#drawMap(state, origin);
    this.#drawEntities(state, origin);
    this.#drawMinimap(state);
  }

  #cameraOrigin(state) {
    const visibleColumns = Math.ceil(this.canvas.width / CONFIG.tileSize);
    const visibleRows = Math.ceil(this.canvas.height / CONFIG.tileSize);
    return {
      x: Math.max(0, Math.min(state.dungeon.size - visibleColumns, state.player.x - Math.floor(visibleColumns / 2))),
      y: Math.max(0, Math.min(state.dungeon.size - visibleRows, state.player.y - Math.floor(visibleRows / 2))),
    };
  }

  #drawMap(state, origin) {
    const { context: ctx } = this;
    const { dungeon } = state;
    for (let screenY = 0; screenY <= this.canvas.height / CONFIG.tileSize; screenY += 1) {
      for (let screenX = 0; screenX <= this.canvas.width / CONFIG.tileSize; screenX += 1) {
        const x = origin.x + screenX;
        const y = origin.y + screenY;
        if (x >= dungeon.size || y >= dungeon.size) continue;
        const px = screenX * CONFIG.tileSize;
        const py = screenY * CONFIG.tileSize;
        if (!dungeon.discovered[y][x]) {
          if (this.#nearPlayer(x, y, state.player)) this.#drawTile(ctx, px, py, CONFIG.colors.explored);
          continue;
        }
        const type = dungeon.tiles[y][x];
        if (type === dungeon.tileTypes.ROOM) this.#drawTile(ctx, px, py, CONFIG.colors.ground);
        if (type === dungeon.tileTypes.HALL) this.#drawTile(ctx, px, py, CONFIG.colors.corridor);
        if (type !== dungeon.tileTypes.WALL) this.#drawTile(ctx, px, py, "#0000", true);
      }
    }
    const exitPosition = state.dungeon.exit;
    const exit = this.#screenPoint(exitPosition, origin);
    if (exit && state.dungeon.discovered[exitPosition.y][exitPosition.x]) {
      this.#drawMarker(ctx, exit.x, exit.y, CONFIG.colors.stairs, "⇩");
    }
  }

  #nearPlayer(x, y, player) {
    const dx = x - player.x;
    const dy = y - player.y;
    return dx * dx + dy * dy <= CONFIG.playerViewRadius * CONFIG.playerViewRadius;
  }

  #drawTile(ctx, x, y, color, grid = false) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, CONFIG.tileSize, CONFIG.tileSize);
    if (grid) {
      ctx.strokeStyle = "#ffffff0d";
      ctx.strokeRect(x + 0.5, y + 0.5, CONFIG.tileSize - 1, CONFIG.tileSize - 1);
    }
  }

  #drawEntities(state, origin) {
    const { context: ctx } = this;
    for (const item of state.items) {
      const point = this.#screenPoint(item, origin);
      if (point && state.dungeon.discovered[item.y][item.x]) {
        this.#drawItemSprite(item, point.x, point.y);
      }
    }
    for (const enemy of state.enemies) {
      const point = this.#screenPoint(enemy, origin);
      if (point && state.dungeon.discovered[enemy.y][enemy.x]) {
        this.#drawEnemySprite(enemy, point.x, point.y);
      }
    }
    const playerPoint = this.#screenPoint(state.player, origin);
    if (playerPoint) {
      this.#drawMarker(ctx, playerPoint.x, playerPoint.y, CONFIG.colors.player, "●");
      const { x, y } = state.player.facing;
      ctx.fillStyle = "#fff4ca";
      ctx.beginPath();
      ctx.arc(playerPoint.x + CONFIG.tileSize / 2 + x * 13, playerPoint.y + CONFIG.tileSize / 2 + y * 13, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  #prepareSprites() {
    const scratch = document.createElement("canvas");
    scratch.width = this.spriteSheet.naturalWidth;
    scratch.height = this.spriteSheet.naturalHeight;
    const context = scratch.getContext("2d", { willReadFrequently: true });
    context.drawImage(this.spriteSheet, 0, 0);
    const pixels = context.getImageData(0, 0, scratch.width, scratch.height);
    for (let index = 0; index < pixels.data.length; index += 4) {
      if (pixels.data[index] < 16 && pixels.data[index + 1] < 16 && pixels.data[index + 2] < 16) {
        pixels.data[index + 3] = 0;
      }
    }
    context.putImageData(pixels, 0, 0);
    this.sprites = scratch;
  }

  #drawEnemySprite(enemy, x, y) {
    const row = SPRITE.enemyRows[enemy.spriteRow ?? 0];
    if (!this.sprites || !row) return this.#drawMarker(this.context, x, y, enemy.color, "◆");
    const column = SPRITE.enemyColumns[enemy.variant ?? 0];
    this.context.drawImage(this.sprites, column, row[0], 104, row[1], x + 1, y + 1, CONFIG.tileSize - 2, CONFIG.tileSize - 2);
  }

  #drawItemSprite(item, x, y) {
    const spriteKind = item.kind === "Torch" ? "Torch" : item.kind;
    const row = SPRITE.itemRows[spriteKind];
    if (!this.sprites || !row) return this.#drawMarker(this.context, x, y, "#8be0c0", "✦");
    const variant = item.rarity === "legendary" ? 3 :
      item.rarity === "epic" ? 3 : item.rarity === "rare" ? 2 : item.rarity === "uncommon" ? 1 : 0;
    const column = item.kind === "Torch"
      ? SPRITE.enemyColumns[item.size === "large" ? 2 : 0]
      : SPRITE.itemColumns[variant];
    const sourceWidth = item.kind === "Torch" ? 104 : 76;
    const destSize = item.kind === "Torch" ? CONFIG.tileSize - 2 : CONFIG.tileSize - 7;
    const offset = (CONFIG.tileSize - destSize) / 2;
    this.context.drawImage(this.sprites, column, row[0], sourceWidth, row[1], x + offset, y + offset, destSize, destSize);
  }

  #screenPoint(position, origin) {
    const x = position.x - origin.x;
    const y = position.y - origin.y;
    if (x < 0 || y < 0 || x * CONFIG.tileSize > this.canvas.width || y * CONFIG.tileSize > this.canvas.height) return null;
    return { x: x * CONFIG.tileSize, y: y * CONFIG.tileSize };
  }

  #drawMarker(ctx, x, y, color, symbol) {
    ctx.fillStyle = color;
    ctx.font = `bold ${CONFIG.tileSize - 7}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(symbol, x + CONFIG.tileSize / 2, y + CONFIG.tileSize / 2 + 1);
  }

  #drawMinimap(state) {
    const { context: ctx } = this;
    const size = Math.min(190, this.canvas.width * 0.24);
    const cell = size / state.dungeon.size;
    const left = this.canvas.width - size - 18;
    const top = 18;
    ctx.fillStyle = "#080d12dd";
    ctx.fillRect(left - 7, top - 7, size + 14, size + 14);
    for (let y = 0; y < state.dungeon.size; y += 1) {
      for (let x = 0; x < state.dungeon.size; x += 1) {
        if (!state.dungeon.discovered[y][x]) continue;
        ctx.fillStyle = state.dungeon.tiles[y][x] === state.dungeon.tileTypes.ROOM ? "#b2a27c" : "#756a55";
        ctx.fillRect(left + x * cell, top + y * cell, Math.max(1, cell), Math.max(1, cell));
      }
    }
    if (state.dungeon.discovered[state.dungeon.exit.y][state.dungeon.exit.x]) {
      ctx.fillStyle = CONFIG.colors.stairs;
      ctx.fillRect(left + state.dungeon.exit.x * cell, top + state.dungeon.exit.y * cell, Math.max(2, cell * 2), Math.max(2, cell * 2));
    }
    ctx.fillStyle = CONFIG.colors.player;
    ctx.beginPath();
    ctx.arc(left + (state.player.x + 0.5) * cell, top + (state.player.y + 0.5) * cell, Math.max(2, cell * 1.5), 0, Math.PI * 2);
    ctx.fill();
  }
}
