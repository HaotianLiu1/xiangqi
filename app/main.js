const statusEl = document.getElementById('status');
const undoInput = document.getElementById('undoLimit');
const difficultyEl = document.getElementById('difficulty');
const startBtn = document.getElementById('start');
const resetBtn = document.getElementById('reset');
const undoBtn = document.getElementById('undo');
const switchTurnBtn = document.getElementById('switchTurn');
const boardEl = document.getElementById('board');
const metaEl = document.getElementById('meta');
const stateTurnEl = document.getElementById('stateTurn');
const stateUndoEl = document.getElementById('stateUndo');
const undoHintEl = document.getElementById('undoHint');

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
  moveCount: 0,
  selectedId: null,
  legalMoves: [],
  lastMovedId: null,
  moveFlashTimer: null
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

  if (type === 'error') {
    statusEl.style.background = '#fef2f2';
    statusEl.style.borderColor = '#fca5a5';
    statusEl.style.color = '#991b1b';
    return;
  }

  statusEl.style.background = '#ecfdf5';
  statusEl.style.borderColor = '#a7f3d0';
  statusEl.style.color = '#166534';
}

function setSelected(selectedId = null, legalMoves = []) {
  state.selectedId = selectedId;
  state.legalMoves = legalMoves;
}

function inBoard(x, y) {
  return x >= 0 && x < BOARD_COLS && y >= 0 && y < BOARD_ROWS;
}

function posKey(x, y) {
  return `${x},${y}`;
}

function findPieceAt(x, y) {
  return state.pieces.find((p) => p.x === x && p.y === y) || null;
}

function getCurrentSideText() {
  return state.turn === 'red' ? '红方' : '黑方';
}

function getSimpleLegalMoves(pieceId) {
  const piece = state.pieces.find((p) => p.id === pieceId);
  if (!piece) return [];

  const candidates = [
    { x: piece.x + 1, y: piece.y },
    { x: piece.x - 1, y: piece.y },
    { x: piece.x, y: piece.y + 1 },
    { x: piece.x, y: piece.y - 1 }
  ];

  return candidates.filter((pos) => {
    if (!inBoard(pos.x, pos.y)) return false;
    const occupant = findPieceAt(pos.x, pos.y);
    return !occupant || occupant.side !== piece.side;
  });
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

  const cellsLayer = document.createElement('div');
  cellsLayer.className = 'cells-layer';

  for (let y = 0; y < BOARD_ROWS; y += 1) {
    for (let x = 0; x < BOARD_COLS; x += 1) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell-hit';
      cell.style.left = `${(x / (BOARD_COLS - 1)) * 100}%`;
      cell.style.top = `${(y / (BOARD_ROWS - 1)) * 100}%`;
      cell.dataset.x = String(x);
      cell.dataset.y = String(y);
      cell.addEventListener('click', () => onCellClick(x, y));
      cellsLayer.appendChild(cell);
    }
  }

  const legalLayer = document.createElement('div');
  legalLayer.className = 'legal-layer';

  const piecesLayer = document.createElement('div');
  piecesLayer.className = 'pieces-layer';

  boardEl.appendChild(grid);
  boardEl.appendChild(river);
  boardEl.appendChild(cellsLayer);
  boardEl.appendChild(legalLayer);
  boardEl.appendChild(piecesLayer);
}

function renderLegalMoves() {
  const layer = boardEl.querySelector('.legal-layer');
  if (!layer) return;

  layer.innerHTML = '';
  state.legalMoves.forEach((pos) => {
    const marker = document.createElement('div');
    marker.className = 'legal-marker';
    marker.style.left = `${(pos.x / (BOARD_COLS - 1)) * 100}%`;
    marker.style.top = `${(pos.y / (BOARD_ROWS - 1)) * 100}%`;
    layer.appendChild(marker);
  });
}

function renderPieces() {
  const layer = boardEl.querySelector('.pieces-layer');
  if (!layer) return;

  layer.innerHTML = '';
  state.pieces.forEach((piece) => {
    const el = document.createElement('button');
    el.type = 'button';
    const selectedClass = piece.id === state.selectedId ? ' selected' : '';
    const movedClass = piece.id === state.lastMovedId ? ' moved' : '';
    el.className = `piece ${piece.side}${selectedClass}${movedClass}`;
    el.textContent = piece.text;
    el.style.left = `${(piece.x / (BOARD_COLS - 1)) * 100}%`;
    el.style.top = `${(piece.y / (BOARD_ROWS - 1)) * 100}%`;
    el.addEventListener('click', () => onPieceClick(piece.id));
    layer.appendChild(el);
  });

  renderLegalMoves();
}

function updateMeta() {
  metaEl.textContent = `难度：${state.difficulty}｜当前回合：${getCurrentSideText()}｜悔棋剩余：${state.undoRemaining}/${state.undoLimit}｜已走步数：${state.moveCount}`;
}

function updateStateBar() {
  if (!state.started) {
    stateTurnEl.textContent = '当前回合：未开始';
    stateUndoEl.textContent = '剩余悔棋：-';
    return;
  }

  stateTurnEl.textContent = `当前回合：${getCurrentSideText()}`;
  stateUndoEl.textContent = `剩余悔棋：${state.undoRemaining}/${state.undoLimit}`;
}

function updateUndoAvailability() {
  if (!state.started) {
    undoBtn.disabled = true;
    undoBtn.title = '请先开始新局';
    undoHintEl.textContent = '未开局，悔棋不可用';
    return;
  }

  if (state.undoRemaining <= 0) {
    undoBtn.disabled = true;
    undoBtn.title = '悔棋次数已用尽';
    undoHintEl.textContent = '悔棋次数已用尽';
    return;
  }

  if (state.history.length <= 0) {
    undoBtn.disabled = true;
    undoBtn.title = '当前没有可悔步骤';
    undoHintEl.textContent = '走子后可悔棋';
    return;
  }

  undoBtn.disabled = false;
  undoBtn.title = `可悔棋（剩余 ${state.undoRemaining} 次）`;
  undoHintEl.textContent = `可悔棋（剩余 ${state.undoRemaining} 次）`;
}

function saveSnapshot() {
  state.history.push({
    pieces: clonePieces(state.pieces),
    turn: state.turn,
    moveCount: state.moveCount,
    undoRemaining: state.undoRemaining
  });
}

function performMove(piece, targetX, targetY) {
  saveSnapshot();

  const occupantIdx = state.pieces.findIndex((p) => p.x === targetX && p.y === targetY && p.side !== piece.side);
  if (occupantIdx >= 0) {
    state.pieces.splice(occupantIdx, 1);
  }

  piece.x = targetX;
  piece.y = targetY;

  state.lastMovedId = piece.id;
  if (state.moveFlashTimer) {
    clearTimeout(state.moveFlashTimer);
  }
  state.moveFlashTimer = setTimeout(() => {
    state.lastMovedId = null;
    renderPieces();
  }, 260);

  state.turn = state.turn === 'red' ? 'black' : 'red';
  state.moveCount += 1;
  setSelected(null, []);

  renderPieces();
  updateMeta();
  updateStateBar();
  updateUndoAvailability();
  setStatus(`落子成功，轮到${getCurrentSideText()}。`);
}

function onPieceClick(pieceId) {
  if (!state.started) {
    setStatus('请先开始新局。', 'warn');
    return;
  }

  const piece = state.pieces.find((p) => p.id === pieceId);
  if (!piece) return;

  if (piece.side !== state.turn) {
    if (state.selectedId) {
      const legalSet = new Set(state.legalMoves.map((m) => posKey(m.x, m.y)));
      if (legalSet.has(posKey(piece.x, piece.y))) {
        const selectedPiece = state.pieces.find((p) => p.id === state.selectedId);
        if (selectedPiece) {
          performMove(selectedPiece, piece.x, piece.y);
          return;
        }
      }
    }

    setStatus('非法落子：当前回合不可操作对方棋子。', 'error');
    return;
  }

  if (state.selectedId === pieceId) {
    setSelected(null, []);
    renderPieces();
    setStatus('已取消选中。');
    return;
  }

  const legalMoves = getSimpleLegalMoves(pieceId);
  setSelected(pieceId, legalMoves);
  renderPieces();
  setStatus(`已选中${piece.text}，请点击高亮点位落子。`);
}

function onCellClick(x, y) {
  if (!state.started) {
    setStatus('请先开始新局。', 'warn');
    return;
  }

  const occupant = findPieceAt(x, y);
  if (!state.selectedId) {
    if (occupant && occupant.side === state.turn) {
      onPieceClick(occupant.id);
      return;
    }

    setStatus('请先选中当前回合的一枚棋子。', 'warn');
    return;
  }

  const selectedPiece = state.pieces.find((p) => p.id === state.selectedId);
  if (!selectedPiece) {
    setSelected(null, []);
    renderPieces();
    return;
  }

  const legalSet = new Set(state.legalMoves.map((m) => posKey(m.x, m.y)));
  if (!legalSet.has(posKey(x, y))) {
    setStatus('非法落子：该位置不是当前棋子的可落子点。', 'error');
    return;
  }

  performMove(selectedPiece, x, y);
}

function randomMovePiece() {
  const movable = state.pieces.filter((p) => p.side === state.turn);
  if (movable.length === 0) return false;

  const candidates = movable
    .map((piece) => ({ piece, legalMoves: getSimpleLegalMoves(piece.id) }))
    .filter((item) => item.legalMoves.length > 0);

  if (candidates.length === 0) return false;

  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  const target = chosen.legalMoves[Math.floor(Math.random() * chosen.legalMoves.length)];

  performMove(chosen.piece, target.x, target.y);
  setStatus(`已执行演示走子，轮到${getCurrentSideText()}。`);
  return true;
}

function lockSetup(locked) {
  difficultyEl.disabled = locked;
  undoInput.disabled = locked;
  startBtn.textContent = locked ? '进行中（可重开）' : '开始新局';
  switchTurnBtn.disabled = !locked;
  updateUndoAvailability();
}

function prepareInitialPieces() {
  return clonePieces(INITIAL_PIECES).map((piece, index) => ({
    ...piece,
    id: `p-${index}`
  }));
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
  state.pieces = prepareInitialPieces();
  state.lastMovedId = null;
  if (state.moveFlashTimer) {
    clearTimeout(state.moveFlashTimer);
    state.moveFlashTimer = null;
  }
  setSelected(null, []);

  renderPieces();
  updateMeta();
  updateStateBar();
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
    updateUndoAvailability();
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
  setSelected(null, []);

  state.lastMovedId = null;
  renderPieces();
  updateMeta();
  updateStateBar();
  updateUndoAvailability();

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
  state.pieces = prepareInitialPieces();
  state.moveCount = 0;
  state.lastMovedId = null;
  if (state.moveFlashTimer) {
    clearTimeout(state.moveFlashTimer);
    state.moveFlashTimer = null;
  }
  setSelected(null, []);

  renderPieces();
  updateMeta();
  updateStateBar();
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
});

buildBoardStatic();
resetSetup();
