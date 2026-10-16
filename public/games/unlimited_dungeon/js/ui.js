import { CONFIG } from "./config.js";

// ステータス、冒険ログ、持ち物操作の画面を更新する。
export class GameUI {
  constructor() {
    this.elements = {
      hp: document.querySelector("#hp-stat"),
      hpMeter: document.querySelector("#hp-meter"),
      torch: document.querySelector("#torch-stat"),
      torchMeter: document.querySelector("#torch-meter"),
      attack: document.querySelector("#attack-stat"),
      defense: document.querySelector("#defense-stat"),
      exp: document.querySelector("#exp-stat"),
      level: document.querySelector("#level-stat"),
      equipment: document.querySelector("#equipment-stat"),
      bagCount: document.querySelector("#bag-count"),
      quickItems: document.querySelector("#quick-items"),
      log: document.querySelector("#message-log"),
      overlay: document.querySelector("#overlay"),
      floor: document.querySelector("#floor-label"),
      stage: document.querySelector(".stage"),
    };
    this.onAction = () => {};
    this.onClose = () => {};
    this.messages = [];
    this.selected = 0;
  }

  update(state) {
    const { player } = state;
    this.elements.hp.textContent = `${player.hp} / ${player.maxHp}`;
    this.elements.hpMeter.style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
    this.elements.torch.textContent = `${player.torch} / ${CONFIG.startingTorch}`;
    this.elements.torchMeter.style.width = `${(player.torch / CONFIG.startingTorch) * 100}%`;
    this.elements.attack.textContent = player.attack;
    this.elements.defense.textContent = player.defense;
    this.elements.exp.textContent = `${player.experience} / ${player.nextExperience}`;
    this.elements.level.textContent = player.level;
    this.elements.floor.textContent = `第 ${state.depth} 階層`;
    this.elements.equipment.innerHTML = [
      `武器：${player.equipment.weapon?.name ?? "なし"}`,
      `鎧：${player.equipment.armor?.name ?? "なし"}`,
      `盾：${player.equipment.shield?.name ?? "なし"}`,
      `向き：${player.facing.angle}`,
    ].join("<br>");
    this.elements.bagCount.textContent = `${player.inventory.length} / ${CONFIG.inventoryLimit}`;
    this.elements.quickItems.replaceChildren();
    player.inventory.slice(0, 4).forEach((item) => {
      const line = document.createElement("li");
      line.textContent = `${item.name}${this.#isEquipped(player, item) ? "（装備中）" : ""}`;
      this.elements.quickItems.append(line);
    });
    if (player.inventory.length > 4) {
      const more = document.createElement("li");
      more.textContent = `ほか ${player.inventory.length - 4} 個`;
      this.elements.quickItems.append(more);
    }
  }

  log(message) {
    this.messages.push(message);
    const line = document.createElement("li");
    line.textContent = message;
    this.elements.log.append(line);
    while (this.elements.log.children.length > 30) this.elements.log.firstElementChild.remove();
    this.messages = this.messages.slice(-30);
    this.elements.log.scrollTop = this.elements.log.scrollHeight;
  }

  clearLog() {
    this.messages = [];
    this.elements.log.replaceChildren();
    this.elements.log.scrollTop = 0;
  }

  shake(kind) {
    const className = kind === "hit" ? "shake-hit" : "shake-attack";
    this.elements.stage.classList.remove("shake-attack", "shake-hit");
    void this.elements.stage.offsetWidth;
    this.elements.stage.classList.add(className);
    this.elements.stage.addEventListener("animationend", () => {
      this.elements.stage.classList.remove(className);
    }, { once: true });
  }

  openInventory(player, actions) {
    this.onAction = actions.onAction;
    this.onClose = actions.onClose;
    this.selected = Math.min(this.selected, Math.max(0, player.inventory.length - 1));
    this.#renderInventory(player);
    this.elements.overlay.classList.remove("hidden");
  }

  #renderInventory(player) {
    const { overlay } = this.elements;
    overlay.replaceChildren();
    const dialog = document.createElement("div");
    dialog.className = "dialog";
    const title = document.createElement("h2");
    title.textContent = `持ち物（${player.inventory.length} / ${CONFIG.inventoryLimit}）`;
    dialog.append(title);
    const hint = document.createElement("p");
    hint.className = "hint";
    hint.textContent = "項目を選択してコマンドを実行。I または Esc で閉じます。";
    dialog.append(hint);
    const list = document.createElement("ul");
    list.className = "inventory-list";
    player.inventory.forEach((item, index) => {
      const row = document.createElement("li");
      const button = document.createElement("button");
      button.className = index === this.selected ? "selected" : "";
      button.textContent = `${item.name}${item.plus ? ` +${item.plus}` : ""}　[${item.kind}]${item.quantity ? ` ×${item.quantity}` : ""}${this.#isEquipped(player, item) ? "　装備中" : ""}`;
      button.addEventListener("click", () => {
        this.selected = index;
        this.#renderInventory(player);
      });
      row.append(button);
      list.append(row);
    });
    dialog.append(list);
    if (player.inventory.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "持ち物はありません。";
      dialog.append(empty);
    } else {
      dialog.append(this.#createItemDetails(player, player.inventory[this.selected]));
      dialog.append(this.#createCommands(player.inventory[this.selected]));
    }
    const close = document.createElement("button");
    close.className = "menu-button";
    close.textContent = "閉じる";
    close.addEventListener("click", () => this.closeInventory());
    dialog.append(close);
    overlay.append(dialog);
  }

  #createCommands(item) {
    const commands = document.createElement("div");
    commands.className = "commands";
    const options = ["Put", "Use", "Throw", "Pick"];
    if (item.kind === "Book") options.push("Read");
    if (["Sword", "Armor", "Shield", "Spear", "Bow"].includes(item.kind)) options.push("Set", "Unset");
    const labels = {
      Put: "置く", Use: "使う", Throw: "投げる", Pick: "拾う",
      Read: "読む", Set: "装備", Unset: "装備解除",
    };
    options.forEach((command) => {
      const button = document.createElement("button");
      button.textContent = labels[command];
      button.addEventListener("click", () => this.onAction(command, this.selected));
      commands.append(button);
    });
    return commands;
  }

  #createItemDetails(player, item) {
    const details = document.createElement("div");
    details.className = "selected-details";
    const descriptions = {
      heal: `HPを${item.power}回復する。`,
      attack: `攻撃力が${item.power}上昇する。`,
      defense: `防御力が${item.power}上昇する。`,
      blast: `向いている方向の隣接した敵に${item.power}ダメージ。`,
      ranged: `向いている方向、最大6マス先の敵に矢を射る。矢の攻撃力：${item.power}。`,
      weapon: "装備すると攻撃力が上がる。",
      armor: "装備すると防御力が上がる。",
      shield: "装備すると防御力が上がる。",
      torch: `松明の残り時間を最大${item.power}回復する（上限${CONFIG.startingTorch}）。`,
      card: this.#cardDescription(item),
    };
    const rarityNames = { common: "コモン", uncommon: "アンコモン", rare: "レア", epic: "エピック", legendary: "レジェンダリー" };
    const lines = [
      `${rarityNames[item.rarity] ?? "通常"}${item.plus ? `　強化 +${item.plus}` : ""}`,
      descriptions[item.effect] ?? "効果なし。",
    ];
    if (item.kind === "Arrow") lines.push(`残り${item.quantity ?? 1}本。弓装備中の攻撃で1本消費。`);
    const comparison = this.#equipmentComparison(player, item);
    if (comparison) lines.push(comparison);
    details.textContent = lines.join("\n");
    return details;
  }

  #cardDescription(item) {
    if (item.cardEffect === "poison") return `${item.duration}ターン毒を与え、毎ターン${item.power}ダメージ。`;
    if (item.cardEffect === "sleep") return `${item.duration}ターン敵を眠らせ、行動を止める。`;
    return `${item.power}の直接ダメージを与える。`;
  }

  #equipmentComparison(player, item) {
    const slot = item.kind === "Sword" || item.kind === "Spear" || item.kind === "Bow" ? "weapon" :
      item.kind === "Armor" ? "armor" : item.kind === "Shield" ? "shield" : null;
    if (!slot) return "";
    const current = player.equipment[slot];
    const upgrade = item.power + (item.plus ?? 0);
    const previous = (current?.power ?? 0) + (current?.plus ?? 0);
    const stat = slot === "weapon" ? "攻撃力" : "防御力";
    const total = slot === "weapon" ? player.attack : player.defense;
    const next = total - previous + upgrade;
    const sign = next - total > 0 ? "+" : "";
    const reach = item.kind === "Spear" ? "（2マス先まで）" :
      item.kind === "Bow" ? "（矢を消費・6マス先まで）" : "";
    return `装備比較：${stat} ${total} → ${next}（${sign}${next - total}）${reach}`;
  }

  changeSelection(amount, player) {
    if (!player.inventory.length) return;
    this.selected = (this.selected + amount + player.inventory.length) % player.inventory.length;
    this.#renderInventory(player);
  }

  closeInventory() {
    this.elements.overlay.classList.add("hidden");
    this.onClose();
  }

  showEnd(title, message, restart) {
    const dialog = document.createElement("div");
    dialog.className = "dialog";
    const heading = document.createElement("h2");
    heading.textContent = title;
    const text = document.createElement("p");
    text.textContent = message;
    const button = document.createElement("button");
    button.className = "menu-button";
    button.textContent = "もう一度挑戦";
    button.addEventListener("click", restart);
    dialog.append(heading, text, button);
    this.elements.overlay.replaceChildren(dialog);
    this.elements.overlay.classList.remove("hidden");
  }

  #isEquipped(player, item) {
    return Object.values(player.equipment).includes(item);
  }
}
