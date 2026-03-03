import { isInsideBoard } from '../engine/board.js';

export const AI_LEVEL = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

function collectNaiveCandidates(state) {
  const stepDirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];

  const mine = state.board.filter((p) => p.side === state.turn);
  const enemies = new Set(
    state.board
      .filter((p) => p.side !== state.turn)
      .map((p) => `${p.x},${p.y}`)
  );

  const friends = new Set(
    mine.map((p) => `${p.x},${p.y}`)
  );

  const moves = [];
  for (const piece of mine) {
    for (const [dx, dy] of stepDirs) {
      const tx = piece.x + dx;
      const ty = piece.y + dy;
      if (!isInsideBoard(tx, ty)) continue;
      if (friends.has(`${tx},${ty}`)) continue;
      moves.push({
        from: { x: piece.x, y: piece.y },
        to: { x: tx, y: ty },
        scoreHint: enemies.has(`${tx},${ty}`) ? 10 : 1
      });
    }
  }

  return moves;
}

/**
 * AI 三档策略占位
 * easy: 随机
 * medium: 吃子优先（贪心）
 * hard: 预留极小深度搜索入口（当前仍为占位）
 */
export function chooseMoveByLevel({ state, level = AI_LEVEL.MEDIUM }) {
  const candidates = collectNaiveCandidates(state);
  if (candidates.length === 0) return null;

  if (level === AI_LEVEL.EASY) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  if (level === AI_LEVEL.MEDIUM) {
    const sorted = [...candidates].sort((a, b) => b.scoreHint - a.scoreHint);
    return sorted[0];
  }

  // HARD (placeholder): 为后续 minimax/alpha-beta 提供统一出口
  // TODO(xiaoxu): 接入规则引擎合法步生成 + 局面评估
  const sorted = [...candidates].sort((a, b) => b.scoreHint - a.scoreHint);
  return sorted[0];
}
