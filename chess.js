import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const chessConfigResponse = await fetch("/.netlify/functions/chess-config");
if (!chessConfigResponse.ok) throw new Error("Failed to load chess config from Netlify Function.");
const chessConfig = await chessConfigResponse.json();
if (!chessConfig.supabaseUrl || !chessConfig.supabaseAnonKey) throw new Error("Missing Supabase URL or anon key from chess config.");

const supabase = createClient(chessConfig.supabaseUrl, chessConfig.supabaseAnonKey);
const $ = selector => document.querySelector(selector);

const els = {
  authView: $("#authView"), landingView: $("#landingView"), lobbyView: $("#lobbyView"), gameView: $("#gameView"),
  loginTabBtn: $("#loginTabBtn"), registerTabBtn: $("#registerTabBtn"), authTitle: $("#authTitle"), authSubtitle: $("#authSubtitle"),
  authForm: $("#authForm"), authUsernameInput: $("#authUsernameInput"), authPasswordInput: $("#authPasswordInput"),
  authSubmitBtn: $("#authSubmitBtn"), authStatus: $("#authStatus"), logoutBtn: $("#logoutBtn"),
  navUsername: $("#navUsername"), navElo: $("#navElo"), profileUsername: $("#profileUsername"), profileElo: $("#profileElo"),
  profileWins: $("#profileWins"), profileLosses: $("#profileLosses"), lobbyUsername: $("#lobbyUsername"), lobbyElo: $("#lobbyElo"),
  gameUsername: $("#gameUsername"), gameElo: $("#gameElo"), heroPlayBtn: $("#heroPlayBtn"), heroRulesBtn: $("#heroRulesBtn"),
  backToLandingBtn: $("#backToLandingBtn"), quickMatchBtn: $("#quickMatchBtn"), createPrivateBtn: $("#createPrivateBtn"),
  joinRoomBtn: $("#joinRoomBtn"), roomCodeInput: $("#roomCodeInput"), lobbyStatus: $("#lobbyStatus"), timerSelect: $("#timerSelect"),
  board: $("#board"), leaveGameBtn: $("#leaveGameBtn"), returnLobbyBtn: $("#returnLobbyBtn"), copyRoomBtn: $("#copyRoomBtn"),
  connectionPill: $("#connectionPill"), winnerBanner: $("#winnerBanner"), winnerTitle: $("#winnerTitle"), winnerText: $("#winnerText"),
  topPlayerLabel: $("#topPlayerLabel"), bottomPlayerLabel: $("#bottomPlayerLabel"), turnText: $("#turnText"), playerText: $("#playerText"),
  gameStatus: $("#gameStatus"), whiteTimer: $("#whiteTimer"), blackTimer: $("#blackTimer"), whiteTimerRow: $("#whiteTimerRow"),
  blackTimerRow: $("#blackTimerRow"), selectedTitle: $("#selectedTitle"), selectedDescription: $("#selectedDescription"),
  useSkillBtn: $("#useSkillBtn"), cancelSkillBtn: $("#cancelSkillBtn"), battleLog: $("#battleLog"),
  offerDrawBtn: $("#offerDrawBtn"), resignBtn: $("#resignBtn"), drawOfferBanner: $("#drawOfferBanner"),
  acceptDrawBtn: $("#acceptDrawBtn"), declineDrawBtn: $("#declineDrawBtn"),
};

const WALL_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="15" y="20" width="70" height="60" fill="%23777" stroke="%23222" stroke-width="5"/><line x1="15" y1="50" x2="85" y2="50" stroke="%23222" stroke-width="5"/><line x1="50" y1="20" x2="50" y2="50" stroke="%23222" stroke-width="5"/><line x1="30" y1="50" x2="30" y2="80" stroke="%23222" stroke-width="5"/><line x1="70" y1="50" x2="70" y2="80" stroke="%23222" stroke-width="5"/></svg>`;

const PIECE_ICONS = {
  white: { 
    king: "https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg", queen: "https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg", 
    rook: "https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg", bishop: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg", 
    knight: "https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg", pawn: "https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg",
    wall: WALL_SVG
  },
  black: { 
    king: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg", queen: "https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg", 
    rook: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg", bishop: "https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg", 
    knight: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg", pawn: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg",
    wall: WALL_SVG
  }
};

const PIECE_HP = { king: 6, queen: 5, rook: 4, bishop: 3, knight: 3, pawn: 2, wall: 99 };

const SKILLS = {
  pawn: { name: "Chain Eat", cooldown: 4, target: true, description: "Melompat miring maks 3 petak, melahap semua musuh di jalur." },
  rook: { name: "Build Wall", cooldown: 5, target: false, description: "Membangun dinding kokoh di depan pawn paling depan (bertahan 2 putaran)." },
  bishop: { name: "Pierce", cooldown: 4, target: true, description: "Melesat miring maks 5 petak, menghancurkan musuh di jalur (terblokir oleh King/Queen)." },
  knight: { name: "Passive: Expand Walk", cooldown: 0, target: null, description: "Bisa jalan lurus tak terbatas seperti Rook, tapi tidak bisa makan musuh." },
  queen: { name: "Obliterate", cooldown: 15, target: true, description: "Pindah ke jalur valid mana saja dan musnahkan semua musuh di sekelilingnya." },
  king: { name: "Teleport", cooldown: 5, target: true, description: "Teleportasi instan ke petak kosong mana saja di papan." }
};

let state = {
  user: null, profile: null, playerId: null, authMode: "login", resultProcessing: false,
  playerColor: null, game: null, channel: null, selected: null, moveHints: [], skillMode: false, skillHints: [], lastSeenDrawAt: null
};

// UI Helpers
function showToast(message) {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast"; toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

let activeModalCallback = null;
function showModal(title, text, onConfirm) {
  const modal = document.getElementById("customModal");
  document.getElementById("modalTitle").textContent = title; document.getElementById("modalText").textContent = text;
  activeModalCallback = onConfirm; modal.classList.remove("hidden");
}
function closeModal() { document.getElementById("customModal").classList.add("hidden"); activeModalCallback = null; }
document.getElementById("modalCancelBtn")?.addEventListener("click", closeModal);
document.getElementById("modalConfirmBtn")?.addEventListener("click", () => { if (activeModalCallback) activeModalCallback(); closeModal(); });

function showView(name) {
  const views = [els.authView, els.landingView, els.lobbyView, els.gameView].filter(Boolean);
  for (const view of views) view.classList.remove("view-active");
  if (name === "auth") els.authView.classList.add("view-active");
  if (name === "landing") els.landingView.classList.add("view-active");
  if (name === "lobby") els.lobbyView.classList.add("view-active");
  if (name === "game") els.gameView.classList.add("view-active");
}

function normalizeUsername(value) { return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, ""); }
function setAuthStatus(message) { if (els.authStatus) els.authStatus.textContent = message; }
function setAuthMode(mode) {
  state.authMode = mode;
  const isLogin = mode === "login";
  els.loginTabBtn?.classList.toggle("active", isLogin); els.registerTabBtn?.classList.toggle("active", !isLogin);
  if (els.authTitle) els.authTitle.textContent = isLogin ? "Login" : "Register";
  if (els.authSubtitle) els.authSubtitle.textContent = isLogin ? "Masuk pakai username dan password." : "Buat akun baru pakai username dan password.";
  if (els.authSubmitBtn) els.authSubmitBtn.textContent = isLogin ? "Login" : "Register";
  setAuthStatus(isLogin ? "Please login first." : "Create your account.");
}

function saveSession(profile) { localStorage.setItem("magicChessProfile", JSON.stringify(profile)); }
function clearSession() { localStorage.removeItem("magicChessProfile"); }
function loadSession() {
  try {
    const raw = localStorage.getItem("magicChessProfile");
    if (!raw) return null;
    const profile = JSON.parse(raw);
    if (!profile?.id || !profile?.username) return null;
    return profile;
  } catch { return null; }
}

function applyProfile(profile) {
  state.user = { id: profile.id, username: profile.username };
  state.profile = profile; state.playerId = profile.id;
  saveSession(profile); renderProfile();
}

function renderProfile() {
  const profile = state.profile; if (!profile) return;
  const username = profile.username || "Player";
  const elo = Number(profile.elo || 0); const wins = Number(profile.wins || 0); const losses = Number(profile.losses || 0);
  if (els.navUsername) els.navUsername.textContent = username; if (els.navElo) els.navElo.textContent = `${elo} ELO`;
  if (els.profileUsername) els.profileUsername.textContent = username; if (els.profileElo) els.profileElo.textContent = elo;
  if (els.profileWins) els.profileWins.textContent = wins; if (els.profileLosses) els.profileLosses.textContent = losses;
  if (els.lobbyUsername) els.lobbyUsername.textContent = username; if (els.lobbyElo) els.lobbyElo.textContent = `${elo} ELO`;
  if (els.gameUsername) els.gameUsername.textContent = username; if (els.gameElo) els.gameElo.textContent = elo;
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const username = normalizeUsername(els.authUsernameInput?.value); const password = els.authPasswordInput?.value || "";
  if (!username || username.length < 3) { setAuthStatus("Username minimal 3 karakter."); return; }
  if (password.length < 6) { setAuthStatus("Password minimal 6 karakter."); return; }

  els.authSubmitBtn.disabled = true;
  setAuthStatus(state.authMode === "login" ? "Logging in..." : "Registering...");
  try {
    const response = await fetch("/.netlify/functions/chess-auth", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: state.authMode, username, password })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Auth failed.");
    applyProfile(result.profile);
    setAuthStatus(state.authMode === "login" ? "Login success." : "Register success.");
    await checkUrlAndJoin();
  } catch (error) { setAuthStatus(error.message || "Auth failed."); } finally { els.authSubmitBtn.disabled = false; }
}

async function logout() {
  if (state.channel) await supabase.removeChannel(state.channel);
  clearSession();
  state.user = null; state.profile = null; state.playerId = null; state.game = null; state.playerColor = null; state.channel = null; state.lastSeenDrawAt = null;
  clearSelection();
  showView("auth"); setAuthMode("login");
}

async function checkActiveGame() {
  if (!state.playerId) return false;
  const { data: activeGame } = await supabase.from("magic_chess_games").select("*")
    .or(`white_player.eq.${state.playerId},black_player.eq.${state.playerId}`)
    .in("status", ["waiting", "active"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (activeGame) {
    const color = activeGame.white_player === state.playerId ? "white" : "black";
    await enterGame(activeGame, color);
    return true;
  }
  return false;
}

async function checkUrlAndJoin() {
  const hasActive = await checkActiveGame();
  if (hasActive) return;
  const params = new URLSearchParams(window.location.search);
  const roomCode = params.get("room");
  if (roomCode) { showView("lobby"); els.roomCodeInput.value = roomCode; await joinRoomByCode(); } 
  else { showView("landing"); }
}

function initAuth() {
  setAuthMode("login"); const profile = loadSession();
  if (profile) { applyProfile(profile); checkUrlAndJoin(); } else { showView("auth"); }
}

function setLobbyStatus(message) { els.lobbyStatus.textContent = message; }
function setGameStatus(message) { els.gameStatus.textContent = message; }
function setOnline(isOnline) { els.connectionPill.textContent = isOnline ? "Online" : "Offline"; els.connectionPill.classList.toggle("online", isOnline); }

function randomRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

function keyOf(x, y) { return `${x},${y}`; }
function parseKey(key) { const [x, y] = key.split(",").map(Number); return { x, y }; }
function inBoard(x, y) { return x >= 0 && x < 8 && y >= 0 && y < 8; }
function clone(value) { return structuredClone(value); }
function nowMs() { return Date.now(); }
function formatTime(seconds) {
  const safe = Math.max(0, Math.ceil(seconds)); const minutes = Math.floor(safe / 60); const secs = safe % 60;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function createPiece(type, color, x) {
  return {
    id: `${color}-${type}-${x}-${crypto.randomUUID().slice(0, 6)}`, type, color,
    hp: PIECE_HP[type], maxHp: PIECE_HP[type], shield: 0, cooldown: type === 'queen' ? 15 : 0
  };
}

function createInitialBoard(timerSeconds = 600, whiteUsername = "White") {
  const tiles = {};
  const back = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];
  for (let x = 0; x < 8; x++) {
    tiles[keyOf(x, 0)] = createPiece(back[x], "black", x);
    tiles[keyOf(x, 1)] = createPiece("pawn", "black", x);
    tiles[keyOf(x, 6)] = createPiece("pawn", "white", x);
    tiles[keyOf(x, 7)] = createPiece(back[x], "white", x);
  }
  return {
    turn: "white", tiles, players: { white: whiteUsername, black: "Waiting..." },
    log: ["Room created. Waiting for another player."], winner: null, drawOffer: null, drawOfferAt: null,
    lastAction: null, timers: { white: timerSeconds, black: timerSeconds }, timerStartedAt: null, resultApplied: false
  };
}

function getBoard() { return state.game?.board_state; }
function getPiece(square) { return getBoard()?.tiles?.[square] || null; }
function opposite(color) { return color === "white" ? "black" : "white"; }
function isMyTurn() { return (state.game?.status === "active" && getBoard()?.turn === state.playerColor && !getBoard()?.winner); }
function pieceLabel(piece) { return `${piece.color} ${piece.type}`; }
function addLog(board, message) { board.log = board.log || []; board.log.unshift(message); board.log = board.log.slice(0, 12); }

function getDisplayedTimers(board) {
  if (!board?.timers) return { white: 600, black: 600 };
  const timers = { white: Number(board.timers.white ?? 600), black: Number(board.timers.black ?? 600) };
  if (state.game?.status === "active" && !board.winner && board.timerStartedAt) {
    const elapsed = (nowMs() - Number(board.timerStartedAt)) / 1000;
    timers[board.turn] = Math.max(0, timers[board.turn] - elapsed);
  }
  return timers;
}

function renderTimers() {
  const board = getBoard(); const timers = getDisplayedTimers(board);
  if (!els.whiteTimer || !els.blackTimer) return;
  els.whiteTimer.textContent = formatTime(timers.white); els.blackTimer.textContent = formatTime(timers.black);
  els.whiteTimerRow?.classList.toggle("active", board?.turn === "white" && state.game?.status === "active" && !board?.winner);
  els.blackTimerRow?.classList.toggle("active", board?.turn === "black" && state.game?.status === "active" && !board?.winner);
}

function applyTimerBeforeAction(board) {
  if (state.game?.status !== "active" || board.winner || !board.timerStartedAt) return;
  const elapsed = (nowMs() - Number(board.timerStartedAt)) / 1000;
  board.timers[board.turn] = Math.max(0, Number(board.timers[board.turn]) - elapsed);
  board.timerStartedAt = nowMs();
  if (board.timers[board.turn] <= 0) { board.winner = opposite(board.turn); addLog(board, `${board.turn} ran out of time.`); }
}

function startTurnTimer(board) { board.timerStartedAt = nowMs(); }

function checkTimerFlag() {
  const board = getBoard(); if (!board || state.game?.status !== "active" || board.winner) return;
  const timers = getDisplayedTimers(board);
  if (timers[board.turn] <= 0 && isMyTurn()) {
    const nextBoard = clone(board); applyTimerBeforeAction(nextBoard);
    if (nextBoard.winner) updateGameBoard(nextBoard);
  }
}

function switchTurn(board) {
  board.turn = opposite(board.turn);
  for (const [key, piece] of Object.entries(board.tiles)) {
    if (piece.color === board.turn) {
      if (piece.cooldown > 0) piece.cooldown -= 1;
      if (piece.shield > 0) piece.shield = Math.max(0, piece.shield - 1);
      if (piece.type === 'wall') {
        piece.duration -= 1;
        if (piece.duration <= 0) {
            delete board.tiles[key];
            addLog(board, `Sebuah Dinding hancur karena durasi habis.`);
        }
      }
    }
  }
  startTurnTimer(board);

  if (!hasValidMoves(board, board.turn)) {
    if (isKingInCheck(board, board.turn)) {
      board.winner = opposite(board.turn); addLog(board, `Checkmate! ${opposite(board.turn).toUpperCase()} wins.`);
    } else {
      board.winner = "draw"; addLog(board, `Stalemate! Game is a draw.`);
    }
  } else if (isKingInCheck(board, board.turn)) {
    addLog(board, `${board.turn.toUpperCase()} is in CHECK!`);
  }
}

function damagePiece(board, square, amount) {
  const piece = board.tiles[square]; if (!piece) return null;
  let remaining = amount;
  if (piece.shield > 0) { const blocked = Math.min(piece.shield, remaining); piece.shield -= blocked; remaining -= blocked; }
  if (remaining > 0) piece.hp -= remaining;
  if (piece.hp <= 0) {
    const dead = board.tiles[square]; delete board.tiles[square];
    if (dead.type === "king") board.winner = opposite(dead.color);
    return dead;
  }
  return null;
}

function healPiece(piece, amount) { piece.hp = Math.min(piece.maxHp, piece.hp + amount); }

function pathClear(board, from, to) {
  const a = parseKey(from); const b = parseKey(to);
  const dx = Math.sign(b.x - a.x); const dy = Math.sign(b.y - a.y);
  let x = a.x + dx; let y = a.y + dy;
  while (x !== b.x || y !== b.y) {
    if (board.tiles[keyOf(x, y)]) return false;
    x += dx; y += dy;
  }
  return true;
}

// CHECK PROMOTION HELPER
function checkPromotion(board, square) {
  const piece = board.tiles[square];
  if (!piece || piece.type !== 'pawn') return;
  const y = parseKey(square).y;
  if ((piece.color === 'white' && y === 0) || (piece.color === 'black' && y === 7)) {
    piece.type = 'queen'; piece.hp = PIECE_HP.queen; piece.maxHp = PIECE_HP.queen; piece.cooldown = 15;
    addLog(board, `🌟 ${piece.color.toUpperCase()} PAWN BERUBAH MENJADI QUEEN!`);
  }
}

// BASIC MOVEMENT
function canMovePieceBasic(board, from, to) {
  const piece = board.tiles[from]; if (!piece || from === to) return false;
  const target = board.tiles[to]; if (target && target.color === piece.color) return false;
  const a = parseKey(from); const b = parseKey(to); if (!inBoard(b.x, b.y)) return false;
  const dx = b.x - a.x; const dy = b.y - a.y; const adx = Math.abs(dx); const ady = Math.abs(dy);

  if (piece.type === "pawn") {
    const dir = piece.color === "white" ? -1 : 1;
    const startY = piece.color === "white" ? 6 : 1;
    if (!target && dx === 0 && dy === dir) return true;
    if (!target && a.y === startY && dx === 0 && dy === dir * 2 && !board.tiles[keyOf(a.x, a.y + dir)]) return true;
    if (target && adx === 1 && dy === dir) return true;
    return false;
  }
  if (piece.type === "rook") return (dx === 0 || dy === 0) && pathClear(board, from, to);
  if (piece.type === "bishop") return adx === ady && pathClear(board, from, to);
  if (piece.type === "queen") return (dx === 0 || dy === 0 || adx === ady) && pathClear(board, from, to);
  if (piece.type === "knight") {
    const isKnightMove = (adx === 1 && ady === 2) || (adx === 2 && ady === 1);
    const isRookMove = (dx === 0 || dy === 0) && !target && pathClear(board, from, to); // OP: Lurus bebas asal kosong
    return isKnightMove || isRookMove;
  }
  if (piece.type === "king") return adx <= 1 && ady <= 1;
  return false;
}

function isSquareAttacked(board, targetSquare, attackerColor) {
  for (const [key, piece] of Object.entries(board.tiles)) {
    if (piece.color === attackerColor && canMovePieceBasic(board, key, targetSquare)) return true;
  }
  return false;
}

function findKing(board, color) {
  for (const [key, piece] of Object.entries(board.tiles)) { if (piece.color === color && piece.type === "king") return key; }
  return null;
}
function isKingInCheck(board, color) {
  const kingSquare = findKing(board, color); if (!kingSquare) return false;
  return isSquareAttacked(board, kingSquare, opposite(color));
}
function canMovePiece(board, from, to) {
  if (!canMovePieceBasic(board, from, to)) return false;
  const cloned = clone(board); cloned.tiles[to] = cloned.tiles[from]; delete cloned.tiles[from];
  if (isKingInCheck(cloned, board.tiles[from].color)) return false;
  return true;
}

// SKILLS
function canUseSkillOnBasic(board, from, to) {
  const piece = board.tiles[from]; if (!piece || piece.cooldown > 0) return false;
  const a = parseKey(from); const b = parseKey(to); if (!inBoard(b.x, b.y)) return false;
  const dx = b.x - a.x; const dy = b.y - a.y; const adx = Math.abs(dx); const ady = Math.abs(dy);

  if (piece.type === "pawn") return adx === ady && adx >= 1 && adx <= 3;
  if (piece.type === "bishop") return adx === ady && adx >= 1 && adx <= 5;
  if (piece.type === "queen") return (dx === 0 || dy === 0 || adx === ady) && pathClear(board, from, to);
  if (piece.type === "king") return !board.tiles[to]; // Any empty square
  return false;
}

function simulateSkillAndCheck(board, from, to) {
  const cloned = clone(board); const piece = cloned.tiles[from];
  
  if (piece.type === 'pawn' || piece.type === 'bishop') {
    const dirX = Math.sign(parseKey(to).x - parseKey(from).x); const dirY = Math.sign(parseKey(to).y - parseKey(from).y);
    let cx = parseKey(from).x + dirX; let cy = parseKey(from).y + dirY;
    let blocked = false;
    while(true) {
        const k = keyOf(cx, cy); const t = cloned.tiles[k];
        if (piece.type === 'bishop' && t && (t.type === 'king' || t.type === 'queen')) { blocked = true; break; }
        if (t && t.color !== piece.color) delete cloned.tiles[k]; // instakill
        if (cx === parseKey(to).x && cy === parseKey(to).y) break;
        cx += dirX; cy += dirY;
    }
    if (!blocked) { cloned.tiles[to] = piece; delete cloned.tiles[from]; }
  } else if (piece.type === 'queen') {
    cloned.tiles[to] = piece; delete cloned.tiles[from];
    const center = parseKey(to);
    for (let y = center.y - 1; y <= center.y + 1; y++) {
        for (let x = center.x - 1; x <= center.x + 1; x++) {
            const k = keyOf(x,y); const t = cloned.tiles[k];
            if (t && t.color !== piece.color) delete cloned.tiles[k];
        }
    }
  } else if (piece.type === 'king') {
    cloned.tiles[to] = piece; delete cloned.tiles[from];
  }
  return isKingInCheck(cloned, piece.color);
}

function canUseSkillOn(board, from, to) {
  if (!canUseSkillOnBasic(board, from, to)) return false;
  if (simulateSkillAndCheck(board, from, to)) return false;
  return true;
}

function canCastSelfSkillBasic(board, from) {
  const piece = board.tiles[from]; if (!piece || piece.cooldown > 0) return false;
  return piece.type === 'rook';
}

function simulateSelfSkillAndCheck(board, from) {
  const cloned = clone(board); const piece = cloned.tiles[from];
  // Rook cast doesn't affect check status initially
  return isKingInCheck(cloned, piece.color);
}

function canCastSelfSkill(board, from) {
  if (!canCastSelfSkillBasic(board, from)) return false;
  if (simulateSelfSkillAndCheck(board, from)) return false;
  return true;
}

function hasValidMoves(board, color) {
  for (const [from, piece] of Object.entries(board.tiles)) {
    if (piece.color !== color) continue;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const to = keyOf(x, y);
        if (canMovePiece(board, from, to)) return true;
      }
    }
    if (['pawn','bishop','queen','king'].includes(piece.type)) {
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          if (canUseSkillOn(board, from, keyOf(x, y))) return true;
        }
      }
    }
    if (piece.type === 'rook' && canCastSelfSkill(board, from)) return true;
  }
  return false;
}

function getMoveHints(square) {
  const board = getBoard(); if (!board) return []; const hints = [];
  for (let y = 0; y < 8; y++) { for (let x = 0; x < 8; x++) { const to = keyOf(x, y); if (canMovePiece(board, square, to)) hints.push(to); } }
  return hints;
}

function getSkillHints(square) {
  const board = getBoard(); if (!board) return []; const hints = [];
  for (let y = 0; y < 8; y++) { for (let x = 0; x < 8; x++) { const to = keyOf(x, y); if (canUseSkillOn(board, square, to)) hints.push(to); } }
  return hints;
}

async function updateGameBoard(board) {
  if (!state.game) return;
  const { data, error } = await supabase.from("magic_chess_games").update({
      board_state: board, current_turn: board.turn, winner: board.winner,
      status: board.winner ? "finished" : state.game.status === "waiting" ? "waiting" : "active", updated_at: new Date().toISOString()
    }).eq("id", state.game.id).select().single();
  if (error) { setGameStatus(error.message); return; }
  state.game = data; clearSelection(); renderGame();
}

async function moveSelected(to) {
  const board = clone(getBoard()); applyTimerBeforeAction(board);
  if (board.winner) { await updateGameBoard(board); return; }

  const from = state.selected; const piece = board.tiles[from]; if (!piece) return;
  if (!isMyTurn()) { setGameStatus("Not your turn."); return; }
  if (!canMovePiece(board, from, to)) { setGameStatus("Illegal move."); return; }

  const target = board.tiles[to];
  if (target) {
    addLog(board, `${pieceLabel(piece)} captured ${pieceLabel(target)}.`);
    if (target.type === "king") board.winner = piece.color;
  } else { addLog(board, `${pieceLabel(piece)} moved.`); }

  board.tiles[to] = piece; delete board.tiles[from];
  board.lastAction = { type: "move", from, to, pieceId: piece.id, pieceType: piece.type, color: piece.color, at: Date.now() };

  checkPromotion(board, to);
  if (!board.winner) switchTurn(board);
  await updateGameBoard(board);
}

async function castSelfSkill() {
  const board = clone(getBoard()); applyTimerBeforeAction(board);
  if (board.winner) { await updateGameBoard(board); return; }

  const from = state.selected; const piece = board.tiles[from]; if (!piece) return;
  if (!isMyTurn()) { setGameStatus("Not your turn."); return; }
  if (!canCastSelfSkill(board, from)) { setGameStatus("Invalid cast."); return; }

  if (piece.type === "rook") {
    let maxAdv = -1; let advCoord = null;
    for (const [pos, p] of Object.entries(board.tiles)) {
      if (p.color === piece.color && p.type === 'pawn') {
        const coords = parseKey(pos);
        const adv = piece.color === 'white' ? (7 - coords.y) : coords.y;
        if (adv > maxAdv) { maxAdv = adv; advCoord = coords; }
      }
    }
    if (!advCoord) { setGameStatus("Tidak ada Pawn tersisa untuk dilindungi!"); return; }
    const dir = piece.color === 'white' ? -1 : 1; const wallY = advCoord.y + dir;
    if (!inBoard(advCoord.x, wallY)) { setGameStatus("Pawn sudah mentok di ujung!"); return; }
    const wallPos = keyOf(advCoord.x, wallY);
    if (board.tiles[wallPos]) { setGameStatus("Area di depan Pawn terhalang!"); return; }
    
    board.tiles[wallPos] = { id: `wall-${crypto.randomUUID().slice(0, 6)}`, type: 'wall', color: piece.color, hp: 99, maxHp: 99, shield: 0, cooldown: 0, duration: 4 };
    piece.cooldown = SKILLS.rook.cooldown;
    addLog(board, `🧱 ${pieceLabel(piece)} membangun Wall kokoh di depan Pawn!`);
  }

  board.lastAction = { type: "skill", from, to: from, pieceId: piece.id, pieceType: piece.type, color: piece.color, at: Date.now() };
  switchTurn(board); await updateGameBoard(board);
}

async function castTargetSkill(to) {
  const board = clone(getBoard()); applyTimerBeforeAction(board);
  if (board.winner) { await updateGameBoard(board); return; }

  const from = state.selected; const piece = board.tiles[from]; if (!piece) return;
  if (!isMyTurn()) { setGameStatus("Not your turn."); return; }
  if (!canUseSkillOn(board, from, to)) { setGameStatus("Target skill tidak valid / membuat King terancam."); return; }

  if (piece.type === "pawn") {
    const dirX = Math.sign(parseKey(to).x - parseKey(from).x); const dirY = Math.sign(parseKey(to).y - parseKey(from).y);
    let cx = parseKey(from).x + dirX; let cy = parseKey(from).y + dirY; let hits = 0;
    while(true) {
        const k = keyOf(cx, cy); const t = board.tiles[k];
        if (t && t.color !== piece.color) { damagePiece(board, k, 999); hits++; }
        if (cx === parseKey(to).x && cy === parseKey(to).y) break;
        cx += dirX; cy += dirY;
    }
    board.tiles[to] = piece; delete board.tiles[from]; piece.cooldown = SKILLS.pawn.cooldown;
    addLog(board, `⚡ Pawn melompat dan melahap ${hits} keping!`);
    checkPromotion(board, to);
  }

  else if (piece.type === "bishop") {
    const dirX = Math.sign(parseKey(to).x - parseKey(from).x); const dirY = Math.sign(parseKey(to).y - parseKey(from).y);
    let cx = parseKey(from).x + dirX; let cy = parseKey(from).y + dirY; let blocked = false; let hits = 0;
    while(true) {
        const k = keyOf(cx, cy); const t = board.tiles[k];
        if (t) {
            if (t.type === 'king' || t.type === 'queen') { blocked = true; addLog(board, `🛡️ Melesat terhalang oleh ${t.type}!`); break; }
            if (t.color !== piece.color) { damagePiece(board, k, 999); hits++; }
        }
        if (cx === parseKey(to).x && cy === parseKey(to).y) break;
        cx += dirX; cy += dirY;
    }
    if (!blocked) { board.tiles[to] = piece; delete board.tiles[from]; }
    piece.cooldown = SKILLS.bishop.cooldown;
    addLog(board, `🏹 Bishop menembus dan membinasakan ${hits} keping!`);
  }

  else if (piece.type === "queen") {
    board.tiles[to] = piece; delete board.tiles[from];
    const center = parseKey(to); let hits = 0;
    for (let y = center.y - 1; y <= center.y + 1; y++) {
        for (let x = center.x - 1; x <= center.x + 1; x++) {
            const k = keyOf(x, y); const t = board.tiles[k];
            if (t && t.color !== piece.color && t.id !== piece.id) { damagePiece(board, k, 999); hits++; }
        }
    }
    piece.cooldown = SKILLS.queen.cooldown;
    addLog(board, `💥 Queen Obliterate! Menghempaskan ${hits} musuh di sekitarnya!`);
  }

  else if (piece.type === "king") {
    board.tiles[to] = piece; delete board.tiles[from]; piece.cooldown = SKILLS.king.cooldown;
    addLog(board, `🌀 King Teleport ke posisi aman!`);
  }

  board.lastAction = { type: "skill", from, to, pieceId: piece.id, pieceType: piece.type, color: piece.color, at: Date.now() };
  if (!board.winner) switchTurn(board);
  await updateGameBoard(board);
}

function clearSelection() {
  state.selected = null; state.moveHints = []; state.skillMode = false; state.skillHints = []; updateSelectedPanel();
}

function selectSquare(square) {
  const piece = getPiece(square);
  if (!piece) { clearSelection(); renderBoard(); return; }
  if (piece.color !== state.playerColor) { setGameStatus("Itu bukan bidak kamu."); return; }

  state.selected = square; state.skillMode = false; state.moveHints = getMoveHints(square); state.skillHints = [];
  updateSelectedPanel(); renderBoard();
}

function updateSelectedPanel() {
  const piece = state.selected ? getPiece(state.selected) : null; els.cancelSkillBtn.classList.add("hidden");
  if (!piece) {
    els.selectedTitle.textContent = "None"; els.selectedDescription.textContent = "Select one of your pieces to move or cast.";
    els.useSkillBtn.disabled = true; els.useSkillBtn.textContent = "Use Skill"; return;
  }
  const skill = SKILLS[piece.type];
  if(!skill) return;

  els.selectedTitle.innerHTML = `<img src="${PIECE_ICONS[piece.color][piece.type]}" style="height: 1.2em; vertical-align: middle; margin-right: 6px;"> <span style="vertical-align: middle; text-transform: capitalize;">${piece.color} ${piece.type}</span>`;
  els.selectedDescription.textContent = piece.type === 'wall' ? `HP ${piece.hp} • Akan hancur otomatis.` : `HP ${piece.hp}/${piece.maxHp} • Shield ${piece.shield} • ${skill.name}: ${skill.description}`;
  
  if (skill.target === null || piece.type === 'wall') {
    els.useSkillBtn.disabled = true; els.useSkillBtn.textContent = "Passive Skill";
  } else {
    els.useSkillBtn.disabled = piece.cooldown > 0 || !isMyTurn();
    els.useSkillBtn.textContent = piece.cooldown > 0 ? `Cooldown: ${piece.cooldown}` : `Use ${skill.name}`;
  }
  if (state.skillMode) els.cancelSkillBtn.classList.remove("hidden");
}

function handleBoardClick(square) {
  if (!state.game || getBoard()?.winner) return;
  const piece = getPiece(square);

  if (state.skillMode) { castTargetSkill(square); return; }
  if (!state.selected) { if (piece) selectSquare(square); return; }
  if (state.selected === square) { clearSelection(); renderBoard(); return; }
  if (state.moveHints.includes(square)) { moveSelected(square); return; }
  if (piece && piece.color === state.playerColor) { selectSquare(square); return; }
  setGameStatus("Choose a highlighted square.");
}

function renderBoard() {
  const board = getBoard(); els.board.innerHTML = "";
  const playingBlack = state.playerColor === "black";
  const yOrder = playingBlack ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const xOrder = playingBlack ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  for (const y of yOrder) {
    for (const x of xOrder) {
      const squareKey = keyOf(x, y); const square = document.createElement("button"); const piece = board?.tiles?.[squareKey];
      square.className = `square ${(x + y) % 2 === 0 ? "light" : "dark"}`; square.dataset.square = squareKey; square.setAttribute("aria-label", `Square ${x + 1},${y + 1}`);

      if (state.selected === squareKey) square.classList.add("selected");
      if (state.moveHints.includes(squareKey)) square.classList.add("can-move");
      if (state.skillHints.includes(squareKey)) square.classList.add("can-skill");

      if (piece) {
        const pieceEl = document.createElement("div"); pieceEl.className = `piece ${piece.color}`;
        if (board?.lastAction?.to === squareKey && board?.lastAction?.pieceId === piece.id) pieceEl.classList.add("piece-move-animate");
        
        const img = document.createElement("img"); img.src = PIECE_ICONS[piece.color][piece.type]; img.className = "piece-img"; pieceEl.appendChild(img);
        const meta = document.createElement("div"); meta.className = "piece-meta";
        meta.innerHTML = `<span class="hp">${piece.hp}</span> ${piece.shield > 0 ? `<span class="shield">${piece.shield}</span>` : ""} ${piece.cooldown > 0 ? `<span class="cd">${piece.cooldown}</span>` : ""}`;
        square.append(pieceEl, meta);
      }

      square.addEventListener("click", () => handleBoardClick(squareKey)); els.board.appendChild(square);
    }
  }
}

function renderPlayerLabels() {
  if (!els.topPlayerLabel || !els.bottomPlayerLabel) return;
  const board = getBoard(); const players = board?.players || { white: "White", black: "Black" };
  const wName = players.white || "White"; const bName = players.black || "Black";
  if (state.playerColor === "black") { els.topPlayerLabel.textContent = wName; els.bottomPlayerLabel.textContent = bName; } 
  else { els.topPlayerLabel.textContent = bName; els.bottomPlayerLabel.textContent = wName; }
}

function renderGame() {
  const board = getBoard();
  if (!board) {
    els.turnText.textContent = "Waiting..."; els.playerText.textContent = "You are not in a game."; els.copyRoomBtn.textContent = "------";
    els.battleLog.innerHTML = ""; els.drawOfferBanner?.classList.add("hidden"); renderTimers(); renderBoard(); return;
  }

  els.copyRoomBtn.textContent = state.game.room_code;
  els.turnText.textContent = board.winner ? `${board.winner.toUpperCase()} WINS` : `${board.turn.toUpperCase()}'s turn`;
  els.playerText.textContent = `You are ${state.playerColor || "spectator"}.`;

  if (state.game.status === "waiting") { setGameStatus("Waiting for another player..."); } 
  else if (board.winner) { setGameStatus("Game finished."); } 
  else if (isKingInCheck(board, board.turn)) { setGameStatus(isMyTurn() ? "Your turn - CHECK!" : "Opponent's turn - CHECK!"); } 
  else if (isMyTurn()) { setGameStatus("Your turn."); } else { setGameStatus("Opponent's turn."); }

  els.battleLog.innerHTML = (board.log || []).map(item => `<p>${escapeHtml(item)}</p>`).join("");

  if (board.drawOffer && board.drawOffer !== state.playerColor && !board.winner) {
    if (state.lastSeenDrawAt !== board.drawOfferAt) {
      const offererName = board.players?.[board.drawOffer] || board.drawOffer;
      showToast(`${offererName} offered a draw.`); state.lastSeenDrawAt = board.drawOfferAt;
    }
    els.drawOfferBanner?.classList.remove("hidden");
  } else { els.drawOfferBanner?.classList.add("hidden"); }

  if (board.winner) {
    els.winnerBanner.classList.remove("hidden");
    if (board.winner === "draw") { els.winnerTitle.textContent = "Draw"; els.winnerText.textContent = "The game ended in a draw."; } 
    else { els.winnerTitle.textContent = `${board.winner.toUpperCase()} wins`; els.winnerText.textContent = "The king has fallen."; }
    handleGameResult();
  } else { els.winnerBanner.classList.add("hidden"); }

  renderPlayerLabels(); updateSelectedPanel(); renderProfile(); renderTimers(); renderBoard();
}

function escapeHtml(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function requireAuth() { if (!state.user || !state.playerId) { showView("auth"); return false; } return true; }

async function createGame({ privateRoom = false } = {}) {
  if (!requireAuth()) return; setLobbyStatus("Creating room...");
  const roomCode = randomRoomCode(); const timerSeconds = Number(els.timerSelect?.value || 600);
  const board = createInitialBoard(timerSeconds, state.user.username);

  const { data, error } = await supabase.from("magic_chess_games").insert({
      room_code: roomCode, status: "waiting", white_player: state.playerId, black_player: null, current_turn: "white", board_state: board
    }).select().single();
  if (error) { setLobbyStatus(error.message); return; }
  await enterGame(data, "white");
}

async function quickMatch() {
  if (!requireAuth()) return; setLobbyStatus("Searching for open game...");
  const { data: waitingGames, error: searchError } = await supabase.from("magic_chess_games").select("*")
    .eq("status", "waiting").is("black_player", null).neq("white_player", state.playerId)
    .order("created_at", { ascending: true }).limit(1);

  if (searchError) { setLobbyStatus(searchError.message); return; }
  if (waitingGames && waitingGames.length > 0) {
    const target = waitingGames[0]; const board = target.board_state;
    board.players = board.players || {}; board.players.black = state.user.username;
    board.timerStartedAt = Date.now(); addLog(board, "Black joined. The battle begins. White timer started.");

    const { data, error } = await supabase.from("magic_chess_games").update({
        black_player: state.playerId, status: "active", board_state: board, updated_at: new Date().toISOString()
      }).eq("id", target.id).is("black_player", null).select().single();
    if (error) { setLobbyStatus("Could not join that room. Try again."); return; }
    await enterGame(data, "black"); return;
  }
  await createGame({ privateRoom: false });
}

async function joinRoomByCode() {
  if (!requireAuth()) return;
  const roomCode = els.roomCodeInput.value.trim().toUpperCase();
  if (!roomCode) { setLobbyStatus("Enter a room code first."); return; }

  setLobbyStatus("Joining room...");
  const { data: game, error: findError } = await supabase.from("magic_chess_games").select("*").eq("room_code", roomCode).single();

  if (findError || !game) { setLobbyStatus("Room not found."); return; }
  if (game.white_player === state.playerId) { await enterGame(game, "white"); return; }
  if (game.black_player === state.playerId) { await enterGame(game, "black"); return; }
  if (game.black_player) { setLobbyStatus("Room is already full."); return; }

  const board = game.board_state;
  board.players = board.players || {}; board.players.black = state.user.username;
  board.timerStartedAt = Date.now(); addLog(board, "Black joined. The battle begins. White timer started.");

  const { data, error } = await supabase.from("magic_chess_games").update({
      black_player: state.playerId, status: "active", board_state: board, updated_at: new Date().toISOString()
    }).eq("id", game.id).is("black_player", null).select().single();

  if (error) { setLobbyStatus(error.message); return; }
  await enterGame(data, "black");
}

async function enterGame(game, color) {
  state.game = game; state.playerColor = color; state.resultProcessing = false; clearSelection();
  const newUrl = new URL(window.location); newUrl.searchParams.set("room", game.room_code); window.history.pushState({ room: game.room_code }, "", newUrl);
  showView("game"); setOnline(false); renderGame();

  if (state.channel) await supabase.removeChannel(state.channel);
  state.channel = supabase.channel(`magic-chess-${game.id}`)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "magic_chess_games", filter: `id=eq.${game.id}` }, payload => {
      state.game = payload.new; clearSelection(); setOnline(true); renderGame();
    }).subscribe(status => { setOnline(status === "SUBSCRIBED"); });
}

async function leaveGame() {
  if (state.channel) await supabase.removeChannel(state.channel);
  state.channel = null; state.game = null; state.playerColor = null; state.lastSeenDrawAt = null; clearSelection(); setOnline(false);
  const newUrl = new URL(window.location); newUrl.searchParams.delete("room"); window.history.pushState({}, "", newUrl);
  showView("lobby");
}

function startSkillMode() {
  const piece = state.selected ? getPiece(state.selected) : null;
  if (!piece) return;
  if (!isMyTurn()) { setGameStatus("Not your turn."); return; }
  if (piece.cooldown > 0) { setGameStatus("Skill is on cooldown."); return; }

  const skill = SKILLS[piece.type];
  if (!skill.target) { castSelfSkill(); return; }

  state.skillMode = true; state.moveHints = []; state.skillHints = getSkillHints(state.selected);
  if (state.skillHints.length === 0) { setGameStatus("Tidak ada target valid yang aman untuk rajaku."); } 
  else { setGameStatus(`Choose a target for ${skill.name}.`); }
  updateSelectedPanel(); renderBoard();
}

function cancelSkillMode() {
  if (!state.selected) return;
  state.skillMode = false; state.skillHints = []; state.moveHints = getMoveHints(state.selected);
  updateSelectedPanel(); renderBoard();
}

async function copyRoomCode() {
  if (!state.game) return;
  try { await navigator.clipboard.writeText(state.game.room_code); setGameStatus("Room code copied."); } 
  catch { setGameStatus(`Room code: ${state.game.room_code}`); }
}

function scrollToRules() { showView("lobby"); setLobbyStatus("Create a room or join by code. Rules are below."); }

async function handleGameResult() {
  const board = getBoard(); if (!board?.winner || !state.user || !state.profile || !state.game || !state.playerColor) return;
  const storageKey = `magicChessResult:${state.game.id}:${state.user.id}`;
  if (localStorage.getItem(storageKey) === "done") return;
  if (board.winner === "draw") { localStorage.setItem(storageKey, "done"); return; }
  if (state.resultProcessing) return; state.resultProcessing = true;

  try {
    const response = await fetch("/.netlify/functions/chess-result", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: state.user.id, gameId: state.game.id, playerColor: state.playerColor })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to apply result.");
    localStorage.setItem(storageKey, "done"); applyProfile(result.profile);
  } catch (error) { console.error(error); } finally { state.resultProcessing = false; }
}

// MATCH ACTIONS
function resignGame() {
  showModal("Confirm Resign", "Are you sure you want to resign and lose the game?", async () => {
    const board = clone(getBoard()); board.winner = opposite(state.playerColor);
    const playerName = board.players?.[state.playerColor] || state.playerColor;
    addLog(board, `${playerName} resigned.`); await updateGameBoard(board);
  });
}

async function offerDraw() {
  const board = clone(getBoard()); if (board.drawOffer === state.playerColor) return;
  board.drawOffer = state.playerColor; board.drawOfferAt = Date.now(); 
  const playerName = board.players?.[state.playerColor] || state.playerColor;
  addLog(board, `${playerName} offered a draw.`); await updateGameBoard(board);
}

async function acceptDraw() {
  const board = clone(getBoard()); board.winner = "draw"; board.drawOffer = null; board.drawOfferAt = null;
  const playerName = board.players?.[state.playerColor] || state.playerColor;
  addLog(board, `${playerName} accepted the draw.`); await updateGameBoard(board);
}

async function declineDraw() {
  const board = clone(getBoard()); board.drawOffer = null; board.drawOfferAt = null;
  const playerName = board.players?.[state.playerColor] || state.playerColor;
  addLog(board, `${playerName} declined the draw.`); await updateGameBoard(board);
}

els.loginTabBtn?.addEventListener("click", () => setAuthMode("login"));
els.registerTabBtn?.addEventListener("click", () => setAuthMode("register"));
els.authForm?.addEventListener("submit", handleAuthSubmit);
els.logoutBtn?.addEventListener("click", logout);
els.heroPlayBtn?.addEventListener("click", () => showView("lobby"));
els.heroRulesBtn?.addEventListener("click", scrollToRules);
els.backToLandingBtn?.addEventListener("click", () => showView("landing"));
els.quickMatchBtn?.addEventListener("click", quickMatch);
els.createPrivateBtn?.addEventListener("click", () => createGame({ privateRoom: true }));
els.joinRoomBtn?.addEventListener("click", joinRoomByCode);
els.roomCodeInput?.addEventListener("keydown", event => { if (event.key === "Enter") joinRoomByCode(); });
els.leaveGameBtn?.addEventListener("click", leaveGame);
els.returnLobbyBtn?.addEventListener("click", leaveGame);
els.copyRoomBtn?.addEventListener("click", copyRoomCode);
els.useSkillBtn?.addEventListener("click", startSkillMode);
els.cancelSkillBtn?.addEventListener("click", cancelSkillMode);
els.offerDrawBtn?.addEventListener("click", offerDraw);
els.resignBtn?.addEventListener("click", resignGame);
els.acceptDrawBtn?.addEventListener("click", acceptDraw);
els.declineDrawBtn?.addEventListener("click", declineDraw);

setInterval(() => { renderTimers(); checkTimerFlag(); }, 250);
initAuth();
