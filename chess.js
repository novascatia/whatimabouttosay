import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const chessConfigResponse = await fetch("/.netlify/functions/chess-config");

if (!chessConfigResponse.ok) {
  throw new Error("Failed to load chess config from Netlify Function.");
}

const chessConfig = await chessConfigResponse.json();

if (!chessConfig.supabaseUrl || !chessConfig.supabaseAnonKey) {
  throw new Error("Missing Supabase URL or anon key from chess config.");
}

const supabase = createClient(
  chessConfig.supabaseUrl,
  chessConfig.supabaseAnonKey
);

const $ = selector => document.querySelector(selector);

const els = {
  landingView: $("#landingView"),
  lobbyView: $("#lobbyView"),
  gameView: $("#gameView"),

  openLobbyBtn: $("#openLobbyBtn"),
  heroPlayBtn: $("#heroPlayBtn"),
  heroRulesBtn: $("#heroRulesBtn"),
  backToLandingBtn: $("#backToLandingBtn"),

  quickMatchBtn: $("#quickMatchBtn"),
  createPrivateBtn: $("#createPrivateBtn"),
  joinRoomBtn: $("#joinRoomBtn"),
  roomCodeInput: $("#roomCodeInput"),
  lobbyStatus: $("#lobbyStatus"),

  board: $("#board"),
  leaveGameBtn: $("#leaveGameBtn"),
  returnLobbyBtn: $("#returnLobbyBtn"),
  copyRoomBtn: $("#copyRoomBtn"),
  connectionPill: $("#connectionPill"),
  winnerBanner: $("#winnerBanner"),
  winnerTitle: $("#winnerTitle"),
  winnerText: $("#winnerText"),

  turnText: $("#turnText"),
  playerText: $("#playerText"),
  gameStatus: $("#gameStatus"),

  selectedTitle: $("#selectedTitle"),
  selectedDescription: $("#selectedDescription"),
  useSkillBtn: $("#useSkillBtn"),
  cancelSkillBtn: $("#cancelSkillBtn"),
  battleLog: $("#battleLog")
};

const PIECE_ICONS = {
  white: {
    king: "♔",
    queen: "♕",
    rook: "♖",
    bishop: "♗",
    knight: "♘",
    pawn: "♙"
  },
  black: {
    king: "♚",
    queen: "♛",
    rook: "♜",
    bishop: "♝",
    knight: "♞",
    pawn: "♟"
  }
};

const PIECE_HP = {
  king: 6,
  queen: 4,
  rook: 4,
  bishop: 3,
  knight: 3,
  pawn: 2
};

const SKILLS = {
  pawn: {
    name: "Spark",
    cooldown: 2,
    target: true,
    description: "Damage 1 nearby enemy."
  },
  rook: {
    name: "Bulwark",
    cooldown: 3,
    target: false,
    description: "Gain 2 shield."
  },
  bishop: {
    name: "Bless / Smite",
    cooldown: 3,
    target: true,
    description: "Heal an ally or damage an enemy diagonally."
  },
  knight: {
    name: "Blink Strike",
    cooldown: 4,
    target: true,
    description: "Teleport to an empty knight square and damage nearby enemies."
  },
  queen: {
    name: "Arcane Storm",
    cooldown: 5,
    target: true,
    description: "Damage enemies in a 3×3 area."
  },
  king: {
    name: "Royal Guard",
    cooldown: 4,
    target: false,
    description: "Heal 1 and gain 2 shield."
  }
};

let state = {
  playerId: getPlayerId(),
  playerColor: null,
  game: null,
  channel: null,
  selected: null,
  moveHints: [],
  skillMode: false,
  skillHints: []
};

function getPlayerId() {
  const existing = localStorage.getItem("magicChessPlayerId");
  if (existing) return existing;

  const id = crypto.randomUUID();
  localStorage.setItem("magicChessPlayerId", id);
  return id;
}

function showView(name) {
  const views = [els.landingView, els.lobbyView, els.gameView];

  for (const view of views) {
    view.classList.remove("view-active");
  }

  if (name === "landing") els.landingView.classList.add("view-active");
  if (name === "lobby") els.lobbyView.classList.add("view-active");
  if (name === "game") els.gameView.classList.add("view-active");
}

function setLobbyStatus(message) {
  els.lobbyStatus.textContent = message;
}

function setGameStatus(message) {
  els.gameStatus.textContent = message;
}

function setOnline(isOnline) {
  els.connectionPill.textContent = isOnline ? "Online" : "Offline";
  els.connectionPill.classList.toggle("online", isOnline);
}

function randomRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
}

function keyOf(x, y) {
  return `${x},${y}`;
}

function parseKey(key) {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
}

function inBoard(x, y) {
  return x >= 0 && x < 8 && y >= 0 && y < 8;
}

function clone(value) {
  return structuredClone(value);
}

function createPiece(type, color, x) {
  return {
    id: `${color}-${type}-${x}-${crypto.randomUUID().slice(0, 6)}`,
    type,
    color,
    hp: PIECE_HP[type],
    maxHp: PIECE_HP[type],
    shield: 0,
    cooldown: 0
  };
}

function createInitialBoard() {
  const tiles = {};
  const back = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];

  for (let x = 0; x < 8; x++) {
    tiles[keyOf(x, 0)] = createPiece(back[x], "black", x);
    tiles[keyOf(x, 1)] = createPiece("pawn", "black", x);

    tiles[keyOf(x, 6)] = createPiece("pawn", "white", x);
    tiles[keyOf(x, 7)] = createPiece(back[x], "white", x);
  }

  return {
    turn: "white",
    tiles,
    log: ["Game created. White moves first."],
    winner: null,
    lastAction: null
  };
}

function getBoard() {
  return state.game?.board_state;
}

function getPiece(square) {
  return getBoard()?.tiles?.[square] || null;
}

function isMyTurn() {
  return getBoard()?.turn === state.playerColor;
}

function opposite(color) {
  return color === "white" ? "black" : "white";
}

function pieceLabel(piece) {
  return `${piece.color} ${piece.type}`;
}

function addLog(board, message) {
  board.log = board.log || [];
  board.log.unshift(message);
  board.log = board.log.slice(0, 10);
}

function switchTurn(board) {
  board.turn = opposite(board.turn);

  for (const piece of Object.values(board.tiles)) {
    if (piece.color === board.turn && piece.cooldown > 0) {
      piece.cooldown -= 1;
    }

    if (piece.color === board.turn && piece.shield > 0) {
      piece.shield = Math.max(0, piece.shield - 1);
    }
  }
}

function damagePiece(board, square, amount) {
  const piece = board.tiles[square];
  if (!piece) return null;

  let remaining = amount;

  if (piece.shield > 0) {
    const blocked = Math.min(piece.shield, remaining);
    piece.shield -= blocked;
    remaining -= blocked;
  }

  if (remaining > 0) {
    piece.hp -= remaining;
  }

  if (piece.hp <= 0) {
    const dead = board.tiles[square];
    delete board.tiles[square];

    if (dead.type === "king") {
      board.winner = opposite(dead.color);
    }

    return dead;
  }

  return null;
}

function healPiece(piece, amount) {
  piece.hp = Math.min(piece.maxHp, piece.hp + amount);
}

function pathClear(board, from, to) {
  const a = parseKey(from);
  const b = parseKey(to);

  const dx = Math.sign(b.x - a.x);
  const dy = Math.sign(b.y - a.y);

  let x = a.x + dx;
  let y = a.y + dy;

  while (x !== b.x || y !== b.y) {
    if (board.tiles[keyOf(x, y)]) return false;
    x += dx;
    y += dy;
  }

  return true;
}

function canMovePiece(board, from, to) {
  const piece = board.tiles[from];
  if (!piece) return false;
  if (from === to) return false;

  const target = board.tiles[to];

  if (target && target.color === piece.color) return false;

  const a = parseKey(from);
  const b = parseKey(to);

  if (!inBoard(b.x, b.y)) return false;

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);

  if (piece.type === "pawn") {
    const dir = piece.color === "white" ? -1 : 1;
    const startY = piece.color === "white" ? 6 : 1;

    if (!target && dx === 0 && dy === dir) return true;

    if (
      !target &&
      a.y === startY &&
      dx === 0 &&
      dy === dir * 2 &&
      !board.tiles[keyOf(a.x, a.y + dir)]
    ) {
      return true;
    }

    if (target && adx === 1 && dy === dir) return true;

    return false;
  }

  if (piece.type === "rook") {
    return (dx === 0 || dy === 0) && pathClear(board, from, to);
  }

  if (piece.type === "bishop") {
    return adx === ady && pathClear(board, from, to);
  }

  if (piece.type === "queen") {
    const straight = dx === 0 || dy === 0;
    const diagonal = adx === ady;

    return (straight || diagonal) && pathClear(board, from, to);
  }

  if (piece.type === "knight") {
    return (adx === 1 && ady === 2) || (adx === 2 && ady === 1);
  }

  if (piece.type === "king") {
    return adx <= 1 && ady <= 1;
  }

  return false;
}

function getMoveHints(square) {
  const board = getBoard();
  if (!board) return [];

  const hints = [];

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const to = keyOf(x, y);

      if (canMovePiece(board, square, to)) {
        hints.push(to);
      }
    }
  }

  return hints;
}

function canUseSkillOn(board, from, to) {
  const piece = board.tiles[from];
  if (!piece || piece.cooldown > 0) return false;

  const target = board.tiles[to];
  const a = parseKey(from);
  const b = parseKey(to);

  if (!inBoard(b.x, b.y)) return false;

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);

  if (piece.type === "pawn") {
    return !!target && target.color !== piece.color && adx <= 1 && ady <= 1;
  }

  if (piece.type === "bishop") {
    return !!target && adx === ady && adx <= 3 && pathClear(board, from, to);
  }

  if (piece.type === "knight") {
    return !target && ((adx === 1 && ady === 2) || (adx === 2 && ady === 1));
  }

  if (piece.type === "queen") {
    return Math.max(adx, ady) <= 4;
  }

  return false;
}

function getSkillHints(square) {
  const board = getBoard();
  if (!board) return [];

  const hints = [];

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const to = keyOf(x, y);

      if (canUseSkillOn(board, square, to)) {
        hints.push(to);
      }
    }
  }

  return hints;
}

async function updateGameBoard(board) {
  if (!state.game) return;

  const { data, error } = await supabase
    .from("magic_chess_games")
    .update({
      board_state: board,
      current_turn: board.turn,
      winner: board.winner,
      status: board.winner ? "finished" : "active",
      updated_at: new Date().toISOString()
    })
    .eq("id", state.game.id)
    .select()
    .single();

  if (error) {
    setGameStatus(error.message);
    return;
  }

  state.game = data;
  clearSelection();
  renderGame();
}

async function moveSelected(to) {
  const board = clone(getBoard());
  const from = state.selected;
  const piece = board.tiles[from];

  if (!piece) return;

  if (!isMyTurn()) {
    setGameStatus("Not your turn.");
    return;
  }

  if (!canMovePiece(board, from, to)) {
    setGameStatus("Illegal move.");
    return;
  }

  const target = board.tiles[to];

  if (target) {
    addLog(board, `${pieceLabel(piece)} captured ${pieceLabel(target)}.`);

    if (target.type === "king") {
      board.winner = piece.color;
    }
  } else {
    addLog(board, `${pieceLabel(piece)} moved.`);
  }

  board.tiles[to] = piece;
  delete board.tiles[from];

  if (!board.winner) {
    switchTurn(board);
  }

  await updateGameBoard(board);
}

async function castSelfSkill() {
  const board = clone(getBoard());
  const from = state.selected;
  const piece = board.tiles[from];

  if (!piece) return;

  if (!isMyTurn()) {
    setGameStatus("Not your turn.");
    return;
  }

  if (piece.cooldown > 0) {
    setGameStatus("Skill is on cooldown.");
    return;
  }

  if (piece.type === "rook") {
    piece.shield += 2;
    piece.cooldown = SKILLS.rook.cooldown;
    addLog(board, `${pieceLabel(piece)} cast Bulwark and gained 2 shield.`);
  } else if (piece.type === "king") {
    healPiece(piece, 1);
    piece.shield += 2;
    piece.cooldown = SKILLS.king.cooldown;
    addLog(board, `${pieceLabel(piece)} cast Royal Guard.`);
  } else {
    return;
  }

  switchTurn(board);
  await updateGameBoard(board);
}

async function castTargetSkill(to) {
  const board = clone(getBoard());
  const from = state.selected;
  const piece = board.tiles[from];

  if (!piece) return;

  if (!isMyTurn()) {
    setGameStatus("Not your turn.");
    return;
  }

  if (piece.cooldown > 0) {
    setGameStatus("Skill is on cooldown.");
    return;
  }

  if (!canUseSkillOn(board, from, to)) {
    setGameStatus("Invalid skill target.");
    return;
  }

  if (piece.type === "pawn") {
    const dead = damagePiece(board, to, 1);
    piece.cooldown = SKILLS.pawn.cooldown;

    addLog(board, `${pieceLabel(piece)} cast Spark.`);

    if (dead) {
      addLog(board, `${pieceLabel(dead)} was destroyed.`);
    }
  }

  if (piece.type === "bishop") {
    const target = board.tiles[to];

    if (target.color === piece.color) {
      healPiece(target, 1);
      addLog(board, `${pieceLabel(piece)} healed ${pieceLabel(target)}.`);
    } else {
      const dead = damagePiece(board, to, 1);
      addLog(board, `${pieceLabel(piece)} smote ${pieceLabel(target)}.`);

      if (dead) {
        addLog(board, `${pieceLabel(dead)} was destroyed.`);
      }
    }

    piece.cooldown = SKILLS.bishop.cooldown;
  }

  if (piece.type === "knight") {
    const fromCoords = parseKey(from);
    const toCoords = parseKey(to);

    delete board.tiles[from];
    board.tiles[to] = piece;

    for (let y = toCoords.y - 1; y <= toCoords.y + 1; y++) {
      for (let x = toCoords.x - 1; x <= toCoords.x + 1; x++) {
        if (!inBoard(x, y)) continue;

        const key = keyOf(x, y);
        const target = board.tiles[key];

        if (target && target.color !== piece.color) {
          const dead = damagePiece(board, key, 1);

          if (dead) {
            addLog(board, `${pieceLabel(dead)} was destroyed.`);
          }
        }
      }
    }

    piece.cooldown = SKILLS.knight.cooldown;

    addLog(
      board,
      `${pieceLabel(piece)} blinked from ${fromCoords.x + 1},${fromCoords.y + 1} to ${toCoords.x + 1},${toCoords.y + 1}.`
    );
  }

  if (piece.type === "queen") {
    const center = parseKey(to);
    let hits = 0;

    for (let y = center.y - 1; y <= center.y + 1; y++) {
      for (let x = center.x - 1; x <= center.x + 1; x++) {
        if (!inBoard(x, y)) continue;

        const key = keyOf(x, y);
        const target = board.tiles[key];

        if (target && target.color !== piece.color) {
          hits += 1;

          const dead = damagePiece(board, key, 1);

          if (dead) {
            addLog(board, `${pieceLabel(dead)} was destroyed.`);
          }
        }
      }
    }

    piece.cooldown = SKILLS.queen.cooldown;
    addLog(board, `${pieceLabel(piece)} cast Arcane Storm and hit ${hits} enemy piece(s).`);
  }

  if (!board.winner) {
    switchTurn(board);
  }

  await updateGameBoard(board);
}

function clearSelection() {
  state.selected = null;
  state.moveHints = [];
  state.skillMode = false;
  state.skillHints = [];
  updateSelectedPanel();
}

function selectSquare(square) {
  const piece = getPiece(square);

  if (!piece) {
    clearSelection();
    renderBoard();
    return;
  }

  if (piece.color !== state.playerColor) {
    setGameStatus("That is not your piece.");
    return;
  }

  state.selected = square;
  state.skillMode = false;
  state.moveHints = getMoveHints(square);
  state.skillHints = [];

  updateSelectedPanel();
  renderBoard();
}

function updateSelectedPanel() {
  const piece = state.selected ? getPiece(state.selected) : null;

  els.cancelSkillBtn.classList.add("hidden");

  if (!piece) {
    els.selectedTitle.textContent = "None";
    els.selectedDescription.textContent = "Select one of your pieces to move or cast.";
    els.useSkillBtn.disabled = true;
    els.useSkillBtn.textContent = "Use skill";
    return;
  }

  const skill = SKILLS[piece.type];

  els.selectedTitle.textContent =
    `${PIECE_ICONS[piece.color][piece.type]} ${piece.color} ${piece.type}`;

  els.selectedDescription.textContent =
    `HP ${piece.hp}/${piece.maxHp} • Shield ${piece.shield} • ${skill.name}: ${skill.description}`;

  els.useSkillBtn.disabled = piece.cooldown > 0 || !isMyTurn();

  els.useSkillBtn.textContent = piece.cooldown > 0
    ? `Cooldown: ${piece.cooldown}`
    : `Use ${skill.name}`;

  if (state.skillMode) {
    els.cancelSkillBtn.classList.remove("hidden");
  }
}

function handleBoardClick(square) {
  if (!state.game || getBoard()?.winner) return;

  const piece = getPiece(square);

  if (state.skillMode) {
    castTargetSkill(square);
    return;
  }

  if (!state.selected) {
    if (piece) {
      selectSquare(square);
    }

    return;
  }

  if (state.selected === square) {
    clearSelection();
    renderBoard();
    return;
  }

  if (state.moveHints.includes(square)) {
    moveSelected(square);
    return;
  }

  if (piece && piece.color === state.playerColor) {
    selectSquare(square);
    return;
  }

  setGameStatus("Choose a highlighted square.");
}

function renderBoard() {
  const board = getBoard();
  els.board.innerHTML = "";

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const squareKey = keyOf(x, y);
      const square = document.createElement("button");
      const piece = board?.tiles?.[squareKey];

      square.className = `square ${(x + y) % 2 === 0 ? "light" : "dark"}`;
      square.dataset.square = squareKey;
      square.setAttribute("aria-label", `Square ${x + 1},${y + 1}`);

      if (state.selected === squareKey) {
        square.classList.add("selected");
      }

      if (state.moveHints.includes(squareKey)) {
        square.classList.add("can-move");
      }

      if (state.skillHints.includes(squareKey)) {
        square.classList.add("can-skill");
      }

      if (piece) {
        const pieceEl = document.createElement("div");
        pieceEl.className = `piece ${piece.color}`;
        pieceEl.textContent = PIECE_ICONS[piece.color][piece.type];

        const meta = document.createElement("div");
        meta.className = "piece-meta";

        meta.innerHTML = `
          <span class="hp">${piece.hp}</span>
          ${piece.shield > 0 ? `<span class="shield">${piece.shield}</span>` : ""}
          ${piece.cooldown > 0 ? `<span class="cd">${piece.cooldown}</span>` : ""}
        `;

        square.append(pieceEl, meta);
      }

      square.addEventListener("click", () => handleBoardClick(squareKey));
      els.board.appendChild(square);
    }
  }
}

function renderGame() {
  const board = getBoard();

  if (!board) {
    els.turnText.textContent = "Waiting...";
    els.playerText.textContent = "You are not in a game.";
    els.copyRoomBtn.textContent = "------";
    els.battleLog.innerHTML = "";
    renderBoard();
    return;
  }

  els.copyRoomBtn.textContent = state.game.room_code;

  els.turnText.textContent = board.winner
    ? `${board.winner.toUpperCase()} WINS`
    : `${board.turn.toUpperCase()}'s turn`;

  els.playerText.textContent = `You are ${state.playerColor || "spectator"}.`;

  if (state.game.status === "waiting") {
    setGameStatus("Waiting for another player...");
  } else if (board.winner) {
    setGameStatus("Game finished.");
  } else if (isMyTurn()) {
    setGameStatus("Your turn.");
  } else {
    setGameStatus("Opponent's turn.");
  }

  els.battleLog.innerHTML = (board.log || [])
    .map(item => `<p>${escapeHtml(item)}</p>`)
    .join("");

  if (board.winner) {
    els.winnerBanner.classList.remove("hidden");
    els.winnerTitle.textContent = `${board.winner.toUpperCase()} wins`;
    els.winnerText.textContent = "The king has fallen.";
  } else {
    els.winnerBanner.classList.add("hidden");
  }

  updateSelectedPanel();
  renderBoard();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function createGame({ privateRoom = false } = {}) {
  setLobbyStatus("Creating room...");

  const roomCode = randomRoomCode();
  const board = createInitialBoard();

  const { data, error } = await supabase
    .from("magic_chess_games")
    .insert({
      room_code: roomCode,
      status: privateRoom ? "waiting" : "waiting",
      white_player: state.playerId,
      black_player: null,
      current_turn: "white",
      board_state: board
    })
    .select()
    .single();

  if (error) {
    setLobbyStatus(error.message);
    return;
  }

  await enterGame(data, "white");
}

async function quickMatch() {
  setLobbyStatus("Searching for open game...");

  const { data: waitingGames, error: searchError } = await supabase
    .from("magic_chess_games")
    .select("*")
    .eq("status", "waiting")
    .is("black_player", null)
    .neq("white_player", state.playerId)
    .order("created_at", { ascending: true })
    .limit(1);

  if (searchError) {
    setLobbyStatus(searchError.message);
    return;
  }

  if (waitingGames && waitingGames.length > 0) {
    const target = waitingGames[0];
    const board = target.board_state;

    addLog(board, "Black joined. The battle begins.");

    const { data, error } = await supabase
      .from("magic_chess_games")
      .update({
        black_player: state.playerId,
        status: "active",
        board_state: board,
        updated_at: new Date().toISOString()
      })
      .eq("id", target.id)
      .is("black_player", null)
      .select()
      .single();

    if (error) {
      setLobbyStatus("Could not join that room. Try again.");
      return;
    }

    await enterGame(data, "black");
    return;
  }

  await createGame({ privateRoom: false });
}

async function joinRoomByCode() {
  const roomCode = els.roomCodeInput.value.trim().toUpperCase();

  if (!roomCode) {
    setLobbyStatus("Enter a room code first.");
    return;
  }

  setLobbyStatus("Joining room...");

  const { data: game, error: findError } = await supabase
    .from("magic_chess_games")
    .select("*")
    .eq("room_code", roomCode)
    .single();

  if (findError || !game) {
    setLobbyStatus("Room not found.");
    return;
  }

  if (game.white_player === state.playerId) {
    await enterGame(game, "white");
    return;
  }

  if (game.black_player === state.playerId) {
    await enterGame(game, "black");
    return;
  }

  if (game.black_player) {
    setLobbyStatus("Room is already full.");
    return;
  }

  const board = game.board_state;

  addLog(board, "Black joined. The battle begins.");

  const { data, error } = await supabase
    .from("magic_chess_games")
    .update({
      black_player: state.playerId,
      status: "active",
      board_state: board,
      updated_at: new Date().toISOString()
    })
    .eq("id", game.id)
    .is("black_player", null)
    .select()
    .single();

  if (error) {
    setLobbyStatus(error.message);
    return;
  }

  await enterGame(data, "black");
}

async function enterGame(game, color) {
  state.game = game;
  state.playerColor = color;
  clearSelection();

  showView("game");
  setOnline(false);
  renderGame();

  if (state.channel) {
    await supabase.removeChannel(state.channel);
  }

  state.channel = supabase
    .channel(`magic-chess-${game.id}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "magic_chess_games",
        filter: `id=eq.${game.id}`
      },
      payload => {
        state.game = payload.new;
        clearSelection();
        setOnline(true);
        renderGame();
      }
    )
    .subscribe(status => {
      setOnline(status === "SUBSCRIBED");
    });
}

async function leaveGame() {
  if (state.channel) {
    await supabase.removeChannel(state.channel);
  }

  state.channel = null;
  state.game = null;
  state.playerColor = null;

  clearSelection();
  setOnline(false);
  showView("lobby");
}

function startSkillMode() {
  const piece = state.selected ? getPiece(state.selected) : null;

  if (!piece) return;

  if (!isMyTurn()) {
    setGameStatus("Not your turn.");
    return;
  }

  if (piece.cooldown > 0) {
    setGameStatus("Skill is on cooldown.");
    return;
  }

  const skill = SKILLS[piece.type];

  if (!skill.target) {
    castSelfSkill();
    return;
  }

  state.skillMode = true;
  state.moveHints = [];
  state.skillHints = getSkillHints(state.selected);

  if (state.skillHints.length === 0) {
    setGameStatus("No valid skill targets.");
  } else {
    setGameStatus(`Choose a target for ${skill.name}.`);
  }

  updateSelectedPanel();
  renderBoard();
}

function cancelSkillMode() {
  if (!state.selected) return;

  state.skillMode = false;
  state.skillHints = [];
  state.moveHints = getMoveHints(state.selected);

  updateSelectedPanel();
  renderBoard();
}

async function copyRoomCode() {
  if (!state.game) return;

  try {
    await navigator.clipboard.writeText(state.game.room_code);
    setGameStatus("Room code copied.");
  } catch {
    setGameStatus(`Room code: ${state.game.room_code}`);
  }
}

function scrollToRules() {
  showView("lobby");
  setLobbyStatus("Create a room or join by code. Rules are below.");
}

els.openLobbyBtn.addEventListener("click", () => showView("lobby"));
els.heroPlayBtn.addEventListener("click", () => showView("lobby"));
els.heroRulesBtn.addEventListener("click", scrollToRules);
els.backToLandingBtn.addEventListener("click", () => showView("landing"));

els.quickMatchBtn.addEventListener("click", quickMatch);
els.createPrivateBtn.addEventListener("click", () => createGame({ privateRoom: true }));
els.joinRoomBtn.addEventListener("click", joinRoomByCode);

els.roomCodeInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    joinRoomByCode();
  }
});

els.leaveGameBtn.addEventListener("click", leaveGame);
els.returnLobbyBtn.addEventListener("click", leaveGame);
els.copyRoomBtn.addEventListener("click", copyRoomCode);

els.useSkillBtn.addEventListener("click", startSkillMode);
els.cancelSkillBtn.addEventListener("click", cancelSkillMode);

renderGame();
