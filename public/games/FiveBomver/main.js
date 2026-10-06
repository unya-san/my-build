const MAX_PLAYERS_PER_TEAM = 5;
const POINTS_PER_CORRECT_ANSWER = 10;
const ROOM_CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const elements = {
  notice: document.querySelector("#notice"),
  lobbyScreen: document.querySelector("#lobby-screen"),
  gameScreen: document.querySelector("#game-screen"),
  resultScreen: document.querySelector("#result-screen"),
  roomStatus: document.querySelector("#room-status"),
  teamCount: document.querySelector("#team-count"),
  timerSetting: document.querySelector("#timer-setting"),
  recoverySetting: document.querySelector("#recovery-setting"),
  roomPassword: document.querySelector("#room-password"),
  createRoom: document.querySelector("#create-room"),
  roomCodeCard: document.querySelector("#room-code-card"),
  roomCode: document.querySelector("#room-code"),
  copyRoomCode: document.querySelector("#copy-room-code"),
  joinForm: document.querySelector("#join-form"),
  joinCode: document.querySelector("#join-code"),
  joinPassword: document.querySelector("#join-password"),
  playerName: document.querySelector("#player-name"),
  joinTeam: document.querySelector("#join-team"),
  joinRoom: document.querySelector("#join-room"),
  playerCount: document.querySelector("#player-count"),
  teamRosters: document.querySelector("#team-rosters"),
  startGame: document.querySelector("#start-game"),
  activeTeam: document.querySelector("#active-team"),
  roundNumber: document.querySelector("#round-number"),
  teamScore: document.querySelector("#team-score"),
  timerValue: document.querySelector("#timer-value"),
  timerTrack: document.querySelector(".timer-track"),
  timerBar: document.querySelector("#timer-bar"),
  questionInput: document.querySelector("#question-input"),
  questionDisplay: document.querySelector("#question-display"),
  turnMessage: document.querySelector("#turn-message"),
  bombTrack: document.querySelector("#bomb-track"),
  answerList: document.querySelector("#answer-list"),
  beforeRoundControls: document.querySelector("#before-round-controls"),
  answerControls: document.querySelector("#answer-controls"),
  beginRound: document.querySelector("#begin-round"),
  backToLobby: document.querySelector("#back-to-lobby"),
  answerInput: document.querySelector("#answer-input"),
  markCorrect: document.querySelector("#mark-correct"),
  markIncorrect: document.querySelector("#mark-incorrect"),
  resultIcon: document.querySelector("#result-icon"),
  resultTitle: document.querySelector("#result-title"),
  resultMessage: document.querySelector("#result-message"),
  resultScore: document.querySelector("#result-score"),
  continueGame: document.querySelector("#continue-game"),
  nextTeam: document.querySelector("#next-team"),
  resultToLobby: document.querySelector("#result-to-lobby"),
};

const state = {
  roomCreated: false,
  roomCode: "",
  password: "",
  timerSeconds: 60,
  recoverySeconds: 3,
  teams: [],
  nextPlayerId: 1,
  activeTeamIndex: 0,
  roundNumber: 1,
  scoreByTeam: [],
  currentTurn: 0,
  remainingSeconds: 60,
  answers: [],
  timerId: null,
  roundIsActive: false,
};

// 表示するメッセージを更新し、エラーかどうかを支援技術にも伝えます。
function showNotice(message, isError = false) {
  elements.notice.textContent = message;
  elements.notice.classList.toggle("is-error", isError);
}

// 指定されたチーム数で、参加者と得点を初期化します。
function resetTeams(teamCount) {
  state.teams = Array.from({ length: teamCount }, (_, index) => ({
    name: `チーム${String.fromCharCode(65 + index)}`,
    players: [],
  }));
  state.scoreByTeam = Array.from({ length: teamCount }, () => 0);
  state.activeTeamIndex = 0;
  renderTeams();
  updateTeamOptions();
}

// 重複しにくい4文字のルームコードを作ります。
function makeRoomCode() {
  let code = "";

  // 見間違いやすい文字を避けた一覧から、コードを1文字ずつ選びます。
  for (let index = 0; index < 4; index += 1) {
    const characterIndex = Math.floor(Math.random() * ROOM_CODE_CHARACTERS.length);
    code += ROOM_CODE_CHARACTERS[characterIndex];
  }

  return code;
}

// 現在有効なチームを返します。
function getActiveTeam() {
  return state.teams[state.activeTeamIndex];
}

// 参加チームの選択肢と、参加済み人数の表示を同期します。
function updateTeamOptions() {
  elements.joinTeam.replaceChildren();

  // 作成済みチームごとに、参加先を選ぶ項目を追加します。
  state.teams.forEach((team, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = team.name;
    elements.joinTeam.append(option);
  });

  const totalPlayers = state.teams.reduce((total, team) => total + team.players.length, 0);
  const requiredPlayers = state.teams.length * MAX_PLAYERS_PER_TEAM;
  elements.playerCount.textContent = `${totalPlayers} / ${requiredPlayers} 人`;
}

// チームごとの5席を描画し、参加者の準備状態を操作できるようにします。
function renderTeams() {
  elements.teamRosters.replaceChildren();

  // 各チームについて、参加者の席と未参加の席を描画します。
  state.teams.forEach((team, teamIndex) => {
    const card = document.createElement("section");
    card.className = "team-roster";

    const heading = document.createElement("h4");
    const title = document.createElement("span");
    title.textContent = team.name;
    const count = document.createElement("span");
    count.className = "muted";
    count.textContent = `${team.players.length} / ${MAX_PLAYERS_PER_TEAM}`;
    heading.append(title, count);

    const seats = document.createElement("div");
    seats.className = "seat-list";

    // 5人分の席を埋め、登録済みプレイヤーには準備ボタンを付けます。
    for (let seatIndex = 0; seatIndex < MAX_PLAYERS_PER_TEAM; seatIndex += 1) {
      const player = team.players[seatIndex];
      const seat = document.createElement("div");
      seat.className = `seat${player ? "" : " seat-empty"}`;

      const avatar = document.createElement("span");
      avatar.className = "seat-avatar";
      avatar.textContent = player ? player.name.trim().charAt(0).toUpperCase() : String(seatIndex + 1);
      const name = document.createElement("span");
      name.className = "seat-name";
      name.textContent = player ? player.name : "参加待ち";
      seat.append(avatar, name);

      if (player) {
        seat.draggable = true;
        seat.addEventListener("dragstart", (event) => {
          if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", String(player.id));
          }
        });

        const readyButton = document.createElement("button");
        readyButton.className = "ready-toggle";
        readyButton.type = "button";
        readyButton.setAttribute("aria-pressed", String(player.ready));
        readyButton.textContent = player.ready ? "準備OK" : "準備する";
        readyButton.setAttribute("aria-label", `${player.name}の準備状態を切り替える`);
        readyButton.addEventListener("click", () => {
          player.ready = !player.ready;
          renderTeams();
          updateStartButton();
        });
        seat.append(readyButton);
      } else {
        const waiting = document.createElement("span");
        waiting.className = "seat-ready";
        waiting.textContent = "未参加";
        seat.append(waiting);
      }

      seat.addEventListener("dragover", (event) => event.preventDefault());
      seat.addEventListener("drop", (event) => movePlayer(event, teamIndex, seatIndex));
      seats.append(seat);
    }

    card.append(heading, seats);
    elements.teamRosters.append(card);
  });

  updateTeamOptions();
  updateStartButton();
}

// ドラッグされたプレイヤーを席へ移し、チームの人数上限を守ります。
function movePlayer(event, destinationTeamIndex, destinationSeatIndex) {
  event.preventDefault();
  const playerId = Number(event.dataTransfer?.getData("text/plain"));
  const sourceTeamIndex = state.teams.findIndex((team) => team.players.some((player) => player.id === playerId));
  if (!Number.isInteger(playerId) || sourceTeamIndex < 0) {
    return;
  }

  const sourceTeam = state.teams[sourceTeamIndex];
  const sourcePlayerIndex = sourceTeam.players.findIndex((player) => player.id === playerId);
  const destinationTeam = state.teams[destinationTeamIndex];
  if (!destinationTeam || (sourceTeamIndex !== destinationTeamIndex && destinationTeam.players.length >= MAX_PLAYERS_PER_TEAM)) {
    showNotice("移動先のチームは満員です。", true);
    return;
  }

  const [player] = sourceTeam.players.splice(sourcePlayerIndex, 1);
  destinationTeam.players.splice(Math.min(destinationSeatIndex, destinationTeam.players.length), 0, player);
  renderTeams();
  showNotice(`${player.name}さんの席を移動しました。`);
}

// 全チームの人数と準備状態を検証し、開始ボタンを制御します。
function updateStartButton() {
  const teamsReady = state.roomCreated && state.teams.length > 0 && state.teams.every((team) => (
    team.players.length === MAX_PLAYERS_PER_TEAM
    && team.players.every((player) => player.ready)
  ));
  elements.startGame.disabled = !teamsReady;
}

// 部屋を作成し、コードと設定をこのブラウザーのゲーム状態に反映します。
function createRoom() {
  const timerSeconds = Number(elements.timerSetting.value);
  const recoverySeconds = Number(elements.recoverySetting.value);

  if (!Number.isInteger(timerSeconds) || timerSeconds < 15 || timerSeconds > 180) {
    showNotice("制限時間は15〜180秒の整数で設定してください。", true);
    elements.timerSetting.focus();
    return;
  }
  if (!Number.isInteger(recoverySeconds) || recoverySeconds < 0 || recoverySeconds > 15) {
    showNotice("正解時の回復時間は0〜15秒の整数で設定してください。", true);
    elements.recoverySetting.focus();
    return;
  }

  state.timerSeconds = timerSeconds;
  state.recoverySeconds = recoverySeconds;
  state.password = elements.roomPassword.value;
  state.roomCode = makeRoomCode();
  state.roomCreated = true;
  resetTeams(Number(elements.teamCount.value));

  elements.roomCode.textContent = state.roomCode;
  elements.roomCodeCard.hidden = false;
  elements.roomStatus.textContent = "部屋作成済み";
  elements.roomStatus.classList.add("is-active");
  elements.joinCode.value = state.roomCode;
  elements.joinRoom.disabled = false;
  elements.joinTeam.disabled = false;
  elements.createRoom.disabled = true;
  elements.teamCount.disabled = true;
  elements.timerSetting.disabled = true;
  elements.recoverySetting.disabled = true;
  elements.roomPassword.disabled = true;
  elements.timerValue.textContent = String(state.timerSeconds);
  elements.timerTrack.setAttribute("aria-valuemax", String(state.timerSeconds));
  updateTeamOptions();
  showNotice(`部屋を作成しました。コード「${state.roomCode}」を参加者に伝えてください。`);
}

// ルームコードとパスワードを照合し、選択されたチームに参加者を登録します。
function joinRoom(event) {
  event.preventDefault();

  if (!state.roomCreated) {
    showNotice("先にホストが部屋を作成してください。", true);
    return;
  }
  if (elements.joinCode.value.trim().toUpperCase() !== state.roomCode) {
    showNotice("ルームコードが一致しません。コードを確認してください。", true);
    elements.joinCode.focus();
    return;
  }
  if (elements.joinPassword.value !== state.password) {
    showNotice("パスワードが一致しません。入力内容を確認してください。", true);
    elements.joinPassword.focus();
    return;
  }

  const name = elements.playerName.value.trim();
  const teamIndex = Number(elements.joinTeam.value);
  const team = state.teams[teamIndex];
  if (!name) {
    showNotice("プレイヤー名を入力してください。", true);
    elements.playerName.focus();
    return;
  }
  if (!team || team.players.length >= MAX_PLAYERS_PER_TEAM) {
    showNotice("選択したチームは満員です。別のチームを選んでください。", true);
    return;
  }
  if (state.teams.some((entry) => entry.players.some((player) => player.name.toLocaleLowerCase() === name.toLocaleLowerCase()))) {
    showNotice("同じ名前のプレイヤーがすでに参加しています。", true);
    elements.playerName.focus();
    return;
  }

  team.players.push({ id: state.nextPlayerId, name, ready: false });
  state.nextPlayerId += 1;
  elements.playerName.value = "";
  elements.joinPassword.value = "";
  renderTeams();
  showNotice(`${name}さんが${team.name}に参加しました。`);
  elements.playerName.focus();
}

// 5人全員の準備完了を確認し、ゲーム画面へ切り替えます。
function startGame() {
  if (elements.startGame.disabled) {
    showNotice("各チーム5人の参加と、全員の準備OKが必要です。", true);
    return;
  }

  state.activeTeamIndex = 0;
  state.roundNumber = 1;
  state.answers = [];
  state.currentTurn = 0;
  elements.lobbyScreen.hidden = true;
  elements.resultScreen.hidden = true;
  elements.gameScreen.hidden = false;
  prepareRound();
  showNotice("");
}

// 問題入力と回答順をリセットし、次のクイズを始める画面を準備します。
function prepareRound() {
  stopTimer();
  state.currentTurn = 0;
  state.remainingSeconds = state.timerSeconds;
  state.answers = [];
  state.roundIsActive = false;
  elements.questionInput.value = "";
  elements.questionDisplay.textContent = "問題を入力して、クイズを始めよう";
  elements.answerInput.value = "";
  elements.beforeRoundControls.hidden = false;
  elements.answerControls.hidden = true;
  elements.beginRound.disabled = false;
  elements.activeTeam.textContent = getActiveTeam().name;
  elements.roundNumber.textContent = `${state.roundNumber}問目`;
  elements.teamScore.textContent = String(state.scoreByTeam[state.activeTeamIndex]);
  elements.timerValue.textContent = String(state.remainingSeconds);
  elements.timerBar.style.width = "100%";
  elements.timerTrack.setAttribute("aria-valuenow", String(state.remainingSeconds));
  elements.turnMessage.textContent = "準備ができたらクイズを開始してください。";
  renderGamePlayers();
  renderAnswers();
}

// ホストが入力した問題でタイマーを開始し、回答操作を有効にします。
function beginRound() {
  const question = elements.questionInput.value.trim();
  if (!question) {
    showNotice("クイズを始める前に問題を入力してください。", true);
    elements.questionInput.focus();
    return;
  }

  state.roundIsActive = true;
  state.remainingSeconds = state.timerSeconds;
  elements.questionDisplay.textContent = question;
  elements.questionInput.disabled = true;
  elements.beforeRoundControls.hidden = true;
  elements.answerControls.hidden = false;
  elements.answerInput.focus();
  renderGamePlayers();
  updateTurnMessage();
  updateTimerDisplay();
  state.timerId = window.setInterval(tickTimer, 1000);
  showNotice("");
}

// 残り時間を1秒進め、時間切れならラウンドを終了します。
function tickTimer() {
  state.remainingSeconds = Math.max(0, state.remainingSeconds - 1);
  updateTimerDisplay();

  if (state.remainingSeconds === 0) {
    finishRound(false);
  }
}

// 数字、プログレスバー、アクセシビリティ用の残り時間を更新します。
function updateTimerDisplay() {
  const percentage = (state.remainingSeconds / state.timerSeconds) * 100;
  elements.timerValue.textContent = String(state.remainingSeconds);
  elements.timerBar.style.width = `${percentage}%`;
  elements.timerTrack.setAttribute("aria-valuenow", String(state.remainingSeconds));
}

// ゲーム盤に参加者5人を並べ、現在の回答者と回答済みの人を示します。
function renderGamePlayers() {
  elements.bombTrack.replaceChildren();
  const team = getActiveTeam();

  // 回答順に席を作成し、爆弾を現在の回答者の位置に表示します。
  team.players.forEach((player, index) => {
    const stop = document.createElement("div");
    stop.className = "player-stop";
    if (index === state.currentTurn && state.currentTurn < MAX_PLAYERS_PER_TEAM) {
      stop.classList.add("is-current");
    }
    if (index < state.currentTurn) {
      stop.classList.add("is-done");
    }

    const bomb = document.createElement("span");
    bomb.className = "player-bomb";
    bomb.setAttribute("aria-hidden", "true");
    bomb.textContent = "💣";
    const avatar = document.createElement("span");
    avatar.className = "player-avatar";
    avatar.textContent = player.name.trim().charAt(0).toUpperCase();
    const name = document.createElement("span");
    name.className = "player-label";
    name.textContent = player.name;
    const status = document.createElement("span");
    status.className = "player-state";
    status.textContent = index < state.currentTurn ? "回答OK" : index === state.currentTurn ? "あなたの番" : "待機中";
    stop.append(bomb, avatar, name, status);
    elements.bombTrack.append(stop);
  });
}

// 記録した正解を画面左下の一覧に表示します。
function renderAnswers() {
  elements.answerList.replaceChildren();

  // 回答を文字列チップとして追加し、ユーザー入力をHTMLとして解釈しないようにします。
  state.answers.forEach((entry) => {
    const chip = document.createElement("span");
    chip.className = "answer-chip";
    chip.textContent = `${entry.player}: ${entry.answer}`;
    elements.answerList.append(chip);
  });
}

// 現在の回答者名と残り人数を、ホスト向けの案内に反映します。
function updateTurnMessage() {
  const player = getActiveTeam().players[state.currentTurn];
  if (!player) {
    elements.turnMessage.textContent = "全員の回答が終わりました。";
    return;
  }
  elements.turnMessage.textContent = `回答者：${player.name}（あと${MAX_PLAYERS_PER_TEAM - state.currentTurn}人）`;
}

// 正解を記録して得点と時間を加算し、5人目なら成功画面に進みます。
function markAnswerCorrect() {
  if (!state.roundIsActive) {
    showNotice("クイズを開始してから正誤を判定してください。", true);
    return;
  }

  const answer = elements.answerInput.value.trim();
  if (!answer) {
    showNotice("正解した回答を入力してください。", true);
    elements.answerInput.focus();
    return;
  }

  const player = getActiveTeam().players[state.currentTurn];
  state.answers.push({ player: player.name, answer });
  state.scoreByTeam[state.activeTeamIndex] += POINTS_PER_CORRECT_ANSWER;
  state.remainingSeconds = Math.min(state.timerSeconds, state.remainingSeconds + state.recoverySeconds);
  state.currentTurn += 1;
  elements.answerInput.value = "";
  elements.teamScore.textContent = String(state.scoreByTeam[state.activeTeamIndex]);
  updateTimerDisplay();
  renderAnswers();
  renderGamePlayers();

  if (state.currentTurn >= MAX_PLAYERS_PER_TEAM) {
    finishRound(true);
    return;
  }

  updateTurnMessage();
  elements.answerInput.focus();
  showNotice(`${player.name}さん正解！次の人へ爆弾が移動しました。`);
}

// 不正解の判定を表示し、回答者と爆弾の位置はそのままにします。
function markAnswerIncorrect() {
  if (!state.roundIsActive) {
    showNotice("クイズを開始してから正誤を判定してください。", true);
    return;
  }

  const player = getActiveTeam().players[state.currentTurn];
  elements.answerInput.value = "";
  elements.answerInput.focus();
  showNotice(`${player.name}さんは不正解です。次の回答を待っています。`);
}

// タイマーを停止し、成功または時間切れの結果画面へ切り替えます。
function finishRound(isSuccess) {
  stopTimer();
  state.roundIsActive = false;
  elements.gameScreen.hidden = true;
  elements.resultScreen.hidden = false;
  elements.resultIcon.textContent = isSuccess ? "🎉" : "💥";
  elements.resultTitle.textContent = isSuccess ? "クリア！" : "タイムアップ";
  elements.resultMessage.textContent = isSuccess
    ? `${getActiveTeam().name}、5人全員が正解しました！`
    : `${getActiveTeam().name}は時間内に5人全員の正解に届きませんでした。`;
  elements.resultScore.textContent = String(state.scoreByTeam[state.activeTeamIndex]);
  elements.nextTeam.hidden = state.teams.length < 2;
  showNotice("");
}

// 動作中のカウントダウンを停止し、タイマーIDを破棄します。
function stopTimer() {
  if (state.timerId !== null) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

// 同じチームのスコアを保ったまま、次の問題を始める画面へ戻します。
function continueWithSameTeam() {
  state.roundNumber += 1;
  elements.resultScreen.hidden = true;
  elements.gameScreen.hidden = false;
  elements.questionInput.disabled = false;
  prepareRound();
}

// 2チーム対戦中の操作で、次のチームの問題画面に切り替えます。
function switchToNextTeam() {
  state.activeTeamIndex = (state.activeTeamIndex + 1) % state.teams.length;
  state.roundNumber += 1;
  elements.resultScreen.hidden = true;
  elements.gameScreen.hidden = false;
  elements.questionInput.disabled = false;
  prepareRound();
}

// ラウンド結果からロビーへ戻し、作成済みのルームと得点を維持します。
function returnToLobby() {
  stopTimer();
  state.roundIsActive = false;
  elements.resultScreen.hidden = true;
  elements.gameScreen.hidden = true;
  elements.lobbyScreen.hidden = false;
  elements.questionInput.disabled = false;
  showNotice("ロビーに戻りました。準備状態とチームスコアは保持されています。");
}

// ロビー作成済みの状態を保ち、ゲーム画面からロビーへ戻ります。
function returnFromGameToLobby() {
  returnToLobby();
}

elements.teamCount.addEventListener("change", () => {
  resetTeams(Number(elements.teamCount.value));
});
elements.createRoom.addEventListener("click", createRoom);
elements.joinForm.addEventListener("submit", joinRoom);
elements.startGame.addEventListener("click", startGame);
elements.beginRound.addEventListener("click", beginRound);
elements.markCorrect.addEventListener("click", markAnswerCorrect);
elements.markIncorrect.addEventListener("click", markAnswerIncorrect);
elements.continueGame.addEventListener("click", continueWithSameTeam);
elements.nextTeam.addEventListener("click", switchToNextTeam);
elements.resultToLobby.addEventListener("click", returnToLobby);
elements.backToLobby.addEventListener("click", returnFromGameToLobby);
elements.answerInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    markAnswerCorrect();
  }
});
elements.copyRoomCode.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(state.roomCode);
    showNotice("ルームコードをコピーしました。");
  } catch (error) {
    showNotice(`コピーできませんでした。ルームコード「${state.roomCode}」を手動で共有してください。`, true);
  }
});

resetTeams(Number(elements.teamCount.value));
