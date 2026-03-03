const statusEl = document.getElementById('status');
const undoInput = document.getElementById('undoLimit');
const difficultyEl = document.getElementById('difficulty');
const startBtn = document.getElementById('start');

startBtn.addEventListener('click', () => {
  const raw = undoInput.value?.trim();
  const undoLimit = raw === '' ? 0 : Number(raw);
  const safeUndo = Number.isFinite(undoLimit) ? Math.max(0, Math.min(99, undoLimit)) : 0;
  const difficulty = difficultyEl.value;

  statusEl.textContent = `新局开始：难度=${difficulty}，悔棋次数=${safeUndo}（原型阶段）`;
});
