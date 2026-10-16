import { CONFIG, randomDamage, sortInventory } from "./config.js";
import { chooseWeightedItem, createItemInstance } from "./actors.js";

// 通常攻撃、敵の行動、経験値とレベルアップをまとめて処理する。
export class CombatSystem {
  constructor(state, ui, itemDatabase, onGameOver) {
    this.state = state;
    this.ui = ui;
    this.itemDatabase = itemDatabase;
    this.onGameOver = onGameOver;
  }

  async attack() {
    const { player, enemies } = this.state;
    this.ui.shake("attack");
    const weapon = player.equipment.weapon;
    const isBow = weapon?.kind === "Bow";
    const arrow = isBow ? player.inventory.find((item) => item.kind === "Arrow" && item.quantity > 0) : null;
    if (isBow && !arrow) {
      this.ui.log("矢がなく、弓を射てない。");
      player.turns += 1;
      await this.finishTurn();
      return;
    }
    if (isBow) this.#consumeArrow(arrow);
    const range = isBow ? CONFIG.bowRange : weapon?.kind === "Spear" ? CONFIG.spearRange : 1;
    const target = this.#findTarget(range);
    if (!target) {
      this.ui.log(isBow ? "矢は飛んでいったが、敵には当たらなかった。" : `${player.facing.angle}に敵はいない。`);
    } else {
      const damage = Math.max(1, player.attack + (arrow?.power ?? 0) + randomDamage() - target.defense);
      target.hp -= damage;
      this.ui.log(`${target.name}に${damage}のダメージ。`);
      this.ui.update(this.state);
      if (target.hp <= 0) this.defeat(target);
    }
    player.turns += 1;
    await this.finishTurn();
  }

  #findTarget(range) {
    const { player, enemies, dungeon } = this.state;
    for (let distance = 1; distance <= range; distance += 1) {
      const x = player.x + player.facing.x * distance;
      const y = player.y + player.facing.y * distance;
      const target = enemies.find((enemy) => enemy.x === x && enemy.y === y);
      if (target) return target;
      if (!dungeon.isWalkable(x, y)) return null;
    }
    return null;
  }

  async throwCard(card) {
    this.ui.shake("attack");
    const target = this.#findTarget(CONFIG.cardRange);
    if (!target) {
      this.ui.log(`${card.name}を投げたが、敵には当たらなかった。`);
    } else if (card.cardEffect === "poison") {
      target.poisonTurns = Math.max(target.poisonTurns ?? 0, card.duration);
      target.poisonDamage = Math.max(target.poisonDamage ?? 0, card.power);
      this.ui.log(`${target.name}に毒を与えた（${card.duration}ターン）。`);
    } else if (card.cardEffect === "sleep") {
      target.sleepTurns = Math.max(target.sleepTurns ?? 0, card.duration);
      this.ui.log(`${target.name}を${card.duration}ターン眠らせた。`);
    } else {
      const damage = Math.max(1, card.power - target.defense);
      target.hp -= damage;
      this.ui.log(`${target.name}にカードが命中し、${damage}のダメージ。`);
      if (target.hp <= 0) this.defeat(target);
    }
    this.state.player.turns += 1;
    await this.finishTurn();
  }

  #consumeArrow(arrow) {
    arrow.quantity -= 1;
    if (arrow.quantity <= 0) {
      const index = this.state.player.inventory.indexOf(arrow);
      this.state.player.inventory.splice(index, 1);
    }
    sortInventory(this.state.player.inventory);
  }

  defeat(enemy) {
    this.state.enemies = this.state.enemies.filter((candidate) => candidate !== enemy);
    this.ui.log(`${enemy.name}を倒した。経験値${enemy.exp}を獲得。`);
    this.state.player.experience += enemy.exp;
    while (this.state.player.experience >= this.state.player.nextExperience) this.#levelUp();
    if (Math.random() < this.#dropChance(enemy)) {
      const template = chooseWeightedItem(this.itemDatabase);
      const dropped = createItemInstance(template, this.state.depth, enemy, `drop-${Math.random()}`);
      this.state.items.push(dropped);
      this.ui.log(`${enemy.name}は${dropped.name}を落とした。`);
    }
  }

  #dropChance(enemy) {
    const baseChance = enemy.rarity === "legendary" ? 0.025 :
      enemy.rarity === "epic" ? 0.06 : enemy.rarity === "rare" ? 0.12 : 0.2;
    return baseChance;
  }

  async finishTurn() {
    const { player } = this.state;
    player.hp = Math.min(player.maxHp, player.hp + CONFIG.healPerTurn);
    player.torch = Math.max(0, player.torch - CONFIG.torchDrainPerTurn);
    this.ui.update(this.state);
    await this.#pause();
    await this.#moveEnemies();
    if (!player.alive || player.torch <= 0) {
      this.state.ended = true;
      this.onGameOver(player.alive ? "松明の火が消えた。" : "HPが尽きた。");
    }
  }

  #levelUp() {
    const { player } = this.state;
    player.experience -= player.nextExperience;
    player.level += 1;
    player.nextExperience = Math.ceil(player.nextExperience * 1.45);
    player.maxHp += 3;
    player.hp = player.maxHp;
    player.baseAttack += 1;
    if (player.level % 2 === 0) player.baseDefense += 1;
    this.ui.log(`レベル${player.level}に成長！最大HP・攻撃力が上がった。`);
  }

  async #moveEnemies() {
    const { player, dungeon, enemies } = this.state;
    for (const enemy of [...enemies]) {
      if (enemy.poisonTurns > 0) {
        enemy.hp -= enemy.poisonDamage;
        enemy.poisonTurns -= 1;
        this.ui.log(`${enemy.name}は毒で${enemy.poisonDamage}のダメージを受けた。`);
        this.ui.update(this.state);
        await this.#pause();
        if (enemy.hp <= 0) {
          this.defeat(enemy);
          continue;
        }
      }
      if (enemy.sleepTurns > 0) {
        enemy.sleepTurns -= 1;
        continue;
      }
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
        const damage = Math.max(1, enemy.attack - player.defense);
        player.hp -= damage;
        this.ui.log(`${enemy.name}の攻撃。${damage}のダメージを受けた。`);
        this.ui.shake("hit");
        this.ui.update(this.state);
        await this.#pause();
        if (!player.alive) break;
        continue;
      }
      if (Math.max(Math.abs(dx), Math.abs(dy)) > 8) continue;
      const step = { x: Math.sign(dx), y: Math.sign(dy) };
      let nextX = enemy.x + step.x;
      let nextY = enemy.y + step.y;
      const occupied = enemies.some((other) =>
        other !== enemy && other.x === nextX && other.y === nextY);
      if (occupied || !dungeon.isWalkable(nextX, nextY)) {
        if (step.x && step.y) {
          const alternatives = [{ x: step.x, y: 0 }, { x: 0, y: step.y }];
          const alternative = alternatives.find((candidate) => {
            const x = enemy.x + candidate.x;
            const y = enemy.y + candidate.y;
            return dungeon.isWalkable(x, y) && !enemies.some((other) =>
              other !== enemy && other.x === x && other.y === y);
          });
          if (!alternative) continue;
          nextX = enemy.x + alternative.x;
          nextY = enemy.y + alternative.y;
        } else continue;
      }
      if (nextX !== player.x || nextY !== player.y) {
        enemy.x = nextX;
        enemy.y = nextY;
      }
    }
  }

  #pause() {
    return new Promise((resolve) => setTimeout(resolve, CONFIG.combatMessageDelay));
  }
}
