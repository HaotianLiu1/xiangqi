const statusEl = document.getElementById('status');
const undoInput = document.getElementById('undoLimit');
const difficultyEl = document.getElementById('difficulty');
const startBtn = document.getElementById('start');
const resetBtn = document.getElementById('reset');
const undoBtn = document.getElementById('undo');
const switchTurnBtn = document.getElementById('switchTurn');
const boardEl = document.getElementById('board');
const metaEl = document.getElementById('meta');

const BOARD_COLS = 9;
const BOARD_ROWS = 10;

const INITIAL_PIECES = [
  // 黑方
  { side: 'black', text: '車', x: 0, y: 0 },
  { side: 'black', text: '馬', x: 1, y: 0 },
  { side: 'black', text: '象', x: 2, y: 0 },
  { side: 'black', text: '士', x: 3, y: 0 },
  { side: 'black', text: '將', x: 4, y: 0 },
  { side: 'black', text: '士', x: 5, y: 0 },
  { side: 'black', text: '象', x: 6, y: 0 },
  { side: 'black', text: '馬', x: 7, y: 0 },
  { side: 'black', text: '車', x: 8, y: 0 },
  { side: 'black', text: '砲', x: 1, y: 2 },
  { side: 'black', text: '砲', x: 7, y: 2 },
  { side: 'black', text: '卒', x: 0, y: 3 },
  { side: 'black', text: '卒', x: 2, y: 3 },
  { side: 'black', text: '卒', x: 4, y: 3 },
  { side: 'black', text: '卒', x: 6, y: 3 },
  { side: 'black', text: '卒', x: 8, y: 3 },

  // 红方
  { side: 'red', text: '俥', x: 0, y: 9 },
  { side: 'red', text: '傌', x: 1, y: 9 },
  { side: 'red', text: '相', x: 2, y: 9 },
  { side: 'red', text: '仕', x: 3, y: 9 },
  { side: 'red', text: '帥', x: 4, y: 9 },
  { side: 'red', text: '仕', x: 5, y: 9 },
  { side: 'red', text: '相', x: 6, y: 9 },
  { side: 'red', text: '傌', x: 7, y: 9 },
  { side: 'red', text: '俥', x: 8, y: 9 },
  { side: 'red', text: '炮', x: 1, y: 7 },
  { side: 'red', text: '炮', x: 7, y: 7 },
  { side: 'red', text: '兵', x: 0, y: 6 },
  { side: 'red', text: '兵', x: 2, y: 6 },
  { side: 'red', text: '兵', x: 4, y: 6 },
  { side: 'red', text: '兵', x: 6, y: 6 },
  { side: 'red', text: '兵', x: 8, y: 6 }
];

const state = {
  started: false,
  turn: 'red',
  difficulty: '中等',
  undoLimit: 1,
  undoRemaining: 1,
  pieces: [],
  history: [],
  moveCount: 0
};

function clonePieces(pieces) {
  return pieces.map((p) => ({ ...p }));
}

function setStatus(message, type = 'ok') {
  statusEl.textContent = message;
  if (type === 'warn') {
    statusEl.style.background = '#fff7ed';
    statusEl.style.borderColor = '#fdba74';
    statusEl.style.color = '#9a3412';
    return;
  }

  statusEl.style.background = '#ecfdf5';
  statusEl.style.borderColor = '#a7f3d0';
  statusEl.style.color = '#166534';
}

function buildBoardStatic() {
  boardEl.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'board-grid';

  for (let r = 0; r < BOARD_ROWS; r += 1) {
    const h = document.createElement('div');
    h.className = 'line-h';
    h.style.top = `${(r / (BOARD_ROWS - 1)) * 100}%`;
    grid.appendChild(h);
  }

  for (let c = 0; c < BOARD_COLS; c += 1) {
    const v = document.createElement('div');
    v.className = 'line-v';
    v.style.left = `${(c / (BOARD_COLS - 1)) * 100}%`;
    grid.appendChild(v);
  }

  const river = document.createElement('div');
  river.className = 'river';
  river.textContent = '楚河   汉界';

  const layer = document.createElement('div');
  layer.className = 'pieces-layer';

  boardEl.appendChild(grid);
  boardEl.appendChild(river);
  boardEl.appendChild(layer);
}

function renderPieces() {
  const layer = boardEl.querySelector('.pieces-layer');
  if (!layer) return;

  layer.innerHTML = '';
  state.pieces.forEach((piece) => {
    const el = document.createElement('div');
    el.className = `piece ${piece.side}`;
    el.textContent = piece.text;
    el.style.left = `${(piece.x / (BOARD_COLS - 1)) * 100}%`;
    el.style.top = `${(piece.y / (BOARD_ROWS - 1)) * 100}%`;
    layer.appendChild(el);
  });
}

function updateMeta() {
  const sideText = state.turn === 'red' ? '红方' : '黑方';
  metaEl.textContent = `难度：${state.difficulty}｜当前回合：${sideText}｜悔棋剩余：${state.undoRemaining}/${state.undoLimit}｜已走步数：${state.moveCount}`;
}

function randomMovePiece() {
  const movable = state.pieces.filter((p) => p.side === state.turn);
  if (movable.length === 0) return false;

  const piece = movable[Math.floor(Math.random() * movable.length)];
  const from = { x: piece.x, y: piece.y };
  const candidates = [
    { x: piece.x + 1, y: piece.y },
    { x: piece.x - 1, y: piece.y },
    { x: piece.x, y: piece.y + 1 },
    { x: piece.x, y: piece.y - 1 }
  ].filter((pos) => pos.x >= 0 && pos.x < BOARD_COLS && pos.y >= 0 && pos.y < BOARD_ROWS);

  if (candidates.length === 0) return false;

  const to = candidates[Math.floor(Math.random() * candidates.length)];

  state.history.push({
    pieces: clonePieces(state.pieces),
    turn: state.turn,
    moveCount: state.moveCount,
    undoRemaining: state.undoRemaining
  });

  const occupantIdx = state.pieces.findIndex((p) => p.x === to.x && p.y === to.y && p.side !== piece.side);
  if (occupantIdx >= 0) {
    state.pieces.splice(occupantIdx, 1);
  }

  piece.x = to.x;
  piece.y = to.y;

  state.turn = state.turn === 'red' ? 'black' : 'red';
  state.moveCount += 1;

  const sideName = state.turn === 'red' ? '黑方' : '红方';
  setStatus(`已执行演示走子：${sideName}完成一步。`, 'ok');
  return true;
}

function lockSetup(locked) {
  difficultyEl.disabled = locked;
  undoInput.disabled = locked;
  startBtn.textContent = locked ? '进行中（可重开）' : '开始新局';
  undoBtn.disabled = !locked || state.undoRemaining <= 0;
  switchTurnBtn.disabled = !locked;
}

function startGame() {
  const raw = undoInput.value?.trim();
  const inputNum = raw === '' ? 0 : Number(raw);
  const safeUndo = Number.isFinite(inputNum) ? Math.max(0, Math.min(99, Math.floor(inputNum))) : 0;

  if (safeUndo !== inputNum) {
    undoInput.value = String(safeUndo);
  }

  state.started = true;
  state.difficulty = difficultyEl.value;
  state.undoLimit = safeUndo;
  state.undoRemaining = safeUndo;
  state.turn = 'red';
  state.moveCount = 0;
  state.history = [];
  state.pieces = clonePieces(INITIAL_PIECES);

  renderPieces();
  updateMeta();
  lockSetup(true);

  setStatus(`新局开始：难度=${state.difficulty}，悔棋可用=${state.undoLimit} 次。配置已锁定，重开可修改。`);
}

function undoMove() {
  if (!state.started) {
    setStatus('请先开始新局后再悔棋。', 'warn');
    return;
  }

  if (state.undoRemaining <= 0) {
    setStatus('悔棋次数已用尽。', 'warn');
    undoBtn.disabled = true;
    return;
  }

  const prev = state.history.pop();
  if (!prev) {
    setStatus('当前没有可悔的步骤。', 'warn');
    return;
  }

  state.pieces = clonePieces(prev.pieces);
  state.turn = prev.turn;
  state.moveCount = prev.moveCount;
  state.undoRemaining -= 1;

  renderPieces();
  updateMeta();
  undoBtn.disabled = state.undoRemaining <= 0;

  setStatus(`已悔棋一次，剩余 ${state.undoRemaining} 次。`);
}

function resetSetup() {
  difficultyEl.value = '中等';
  undoInput.value = '1';

  state.started = false;
  state.turn = 'red';
  state.difficulty = '中等';
  state.undoLimit = 1;
  state.undoRemaining = 1;
  state.history = [];
  state.pieces = clonePieces(INITIAL_PIECES);
  state.moveCount = 0;

  renderPieces();
  updateMeta();
  lockSetup(false);
  setStatus('已重置到开局前状态：可重新配置难度和悔棋次数。');
}

startBtn.addEventListener('click', startGame);
undoBtn.addEventListener('click', undoMove);
resetBtn.addEventListener('click', resetSetup);
switchTurnBtn.addEventListener('click', () => {
  if (!state.started) {
    setStatus('请先开始新局。', 'warn');
    return;
  }

  const moved = randomMovePiece();
  if (!moved) {
    setStatus('当前无可执行演示步。', 'warn');
    return;
  }

  undoBtn.disabled = state.undoRemaining <= 0;
  updateMeta();
  renderPieces();
});

buildBoardStatic();
resetSetup();
