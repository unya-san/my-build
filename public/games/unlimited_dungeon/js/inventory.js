import { CONFIG, sortInventory } from "./config.js";

// 持ち物画面、装備、使用、投擲、拾得の処理を受け持つ。
export class InventorySystem {
  constructor(state, ui, combat, refresh) {
    this.state = state;
    this.ui = ui;
    this.combat = combat;
    this.refresh = refresh;
  }

  pickup() {
    const found = this.state.items.filter((item) =>
      item.x === this.state.player.x && item.y === this.state.player.y);
    for (const item of found) {
      const stack = item.kind === "Arrow"
        ? this.state.player.inventory.find((owned) =>
          owned.kind === "Arrow" && owned.name === item.name && owned.power === item.power)
        : null;
      if (!stack && this.state.player.inventory.length >= CONFIG.inventoryLimit) {
        this.ui.log("持ち物がいっぱいで、アイテムを拾えない。");
        break;
      }
      if (stack) stack.quantity += item.quantity ?? 1;
      else this.state.player.inventory.push(item);
      this.state.items = this.state.items.filter((candidate) => candidate !== item);
      this.ui.log(`${item.name}を拾った。`);
      sortInventory(this.state.player.inventory);
    }
  }

  open() {
    if (this.state.turnBusy) return;
    this.state.inventoryOpen = true;
    this.ui.openInventory(this.state.player, {
      onAction: (command, index) => this.execute(command, index),
      onClose: () => { this.state.inventoryOpen = false; },
    });
  }

  handleKey(key) {
    if (key === "escape" || key === "i") return this.ui.closeInventory();
    if (key === "arrowdown" || key === "s") return this.ui.changeSelection(1, this.state.player);
    if (key === "arrowup" || key === "w") return this.ui.changeSelection(-1, this.state.player);
    if (key === "enter") return this.execute("Use", this.ui.selected);
    const commandByKey = { p: "Put", u: "Use", t: "Throw", r: "Read", e: "Set" };
    if (commandByKey[key]) this.execute(commandByKey[key], this.ui.selected);
  }

  async execute(command, index) {
    if (this.state.turnBusy) return;
    const item = this.state.player.inventory[index];
    if (!item) return;
    const turnsBefore = this.state.player.turns;
    this.state.turnBusy = true;
    try {
      if (command === "Set") this.#setEquipment(item);
      else if (command === "Unset") this.#unsetEquipment(item);
      else if (command === "Put") {
        this.state.items.push({ ...item, x: this.state.player.x, y: this.state.player.y, id: `put-${Math.random()}` });
        this.#remove(index);
        this.ui.log(`${item.name}を足元に置いた。`);
        sortInventory(this.state.player.inventory);
      } else if (command === "Pick") this.pickup();
      else if (command === "Throw") await this.#throw(item, index);
      else if ((command === "Read" && item.kind === "Book") || command === "Use") await this.#use(item, index);
      this.refresh();
      if (this.state.ended) return;
      if (this.state.player.turns > turnsBefore) this.ui.closeInventory();
      else this.open();
    } finally {
      this.state.turnBusy = false;
    }
  }

  #setEquipment(item) {
    const slot = item.kind === "Sword" || item.kind === "Spear" || item.kind === "Bow" ? "weapon" :
      item.kind === "Armor" ? "armor" : item.kind === "Shield" ? "shield" : null;
    if (!slot) return this.ui.log(`${item.name}は装備できない。`);
    const previous = this.state.player.equipment[slot];
    if (previous) this.ui.log(`${previous.name}を外した。`);
    this.state.player.equipment[slot] = item;
    this.ui.log(`${item.name}を装備した。`);
  }

  #unsetEquipment(item) {
    const slot = Object.keys(this.state.player.equipment).find((key) =>
      this.state.player.equipment[key] === item);
    if (!slot) return this.ui.log(`${item.name}は装備されていない。`);
    this.state.player.equipment[slot] = null;
    this.ui.log(`${item.name}を外した。`);
  }

  async #use(item, index) {
    const { player } = this.state;
    if (item.effect === "heal") {
      const healed = Math.min(item.power, player.maxHp - player.hp);
      if (!healed) return this.ui.log("HPはすでに満タンだ。");
      player.hp += healed;
      this.ui.log(`${item.name}を使い、HPが${healed}回復した。`);
      player.turns += 1;
      await this.combat.finishTurn();
    } else if (item.effect === "attack" || item.effect === "defense") {
      const stat = item.effect === "attack" ? "bonusAttack" : "bonusDefense";
      player[stat] += item.power;
      this.ui.log(`${item.name}を使い、${item.effect === "attack" ? "攻撃" : "防御"}力が${item.power}上がった。`);
      player.turns += 1;
      await this.combat.finishTurn();
    } else if (item.effect === "torch") {
      const restored = Math.min(item.power, CONFIG.startingTorch - player.torch);
      if (!restored) return this.ui.log("松明はまだ十分に燃えている。");
      player.torch += restored;
      this.ui.log(`${item.name}を使い、松明が${restored}回復した。`);
      player.turns += 1;
      await this.combat.finishTurn();
    } else if (item.effect === "card") {
      return this.#throw(item, index);
    } else if (item.kind === "Arrow") {
      return this.ui.log("矢は弓を装備して攻撃すると自動で使用する。");
    } else if (item.effect === "blast" || item.effect === "ranged") {
      if (!await this.#hitTarget(item)) return;
    } else return this.ui.log(`${item.name}は今は使えない。`);
    this.#remove(index);
  }

  async #hitTarget(item) {
    const { player, enemies } = this.state;
    const target = enemies.find((enemy) => {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.max(Math.abs(dx), Math.abs(dy));
      if (item.effect === "blast") {
        return dx === player.facing.x && dy === player.facing.y;
      }
      return distance > 0 && distance <= 6 &&
        dx === player.facing.x * distance && dy === player.facing.y * distance;
    });
    if (!target) {
      this.ui.log(`${player.facing.angle}に効果の対象がいない。`);
      return false;
    }
    target.hp -= Math.max(1, item.power + (item.effect === "ranged" ? player.attack : 0) - target.defense);
    this.ui.log(`${item.name}が${target.name}に命中した。`);
    this.ui.shake("attack");
    this.ui.update(this.state);
    if (target.hp <= 0) this.combat.defeat(target);
    player.turns += 1;
    await this.combat.finishTurn();
    return true;
  }

  async #throw(item, index) {
    if (item.kind === "Card") {
      await this.combat.throwCard(item);
      this.#remove(index);
      return;
    }
    const { player, enemies } = this.state;
    const target = enemies.find((enemy) =>
      enemy.x === player.x + player.facing.x && enemy.y === player.y + player.facing.y);
    this.ui.shake("attack");
    if (!target) return this.ui.log(`${player.facing.angle}に投げる対象がいない。`);
    target.hp -= Math.max(1, item.power ?? 2);
    this.ui.log(`${item.name}を投げ、${target.name}に当てた。`);
    this.ui.shake("attack");
    this.ui.update(this.state);
    if (target.hp <= 0) this.combat.defeat(target);
    this.#remove(index);
    player.turns += 1;
    await this.combat.finishTurn();
  }

  #remove(index) {
    const [item] = this.state.player.inventory.splice(index, 1);
    const slot = Object.keys(this.state.player.equipment).find((key) =>
      this.state.player.equipment[key] === item);
    if (slot) this.state.player.equipment[slot] = null;
    sortInventory(this.state.player.inventory);
  }
}
