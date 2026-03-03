const statusEl = document.getElementById(status);
const undoInput = document.getElementById(undoLimit);
document.getElementById(start).addEventListener(click, () => {
  const n = Number(undoInput.value || 0);
  statusEl.textContent = `新局开始，悔棋次数=${Math.max(0, Math.min(99, n))}（原型阶段）`;
});
