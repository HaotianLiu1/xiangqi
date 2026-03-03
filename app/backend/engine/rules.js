import { cloneBoard, INITIAL_BOARD, isInsideBoard } from './board.js';

/**
 * 规则引擎（最小骨架）
 * - 提供合法走子校验入口
 * - 当前仅做基础边界/占位校验
 * - 各棋子详细规则后续补齐
 */
export class XiangqiRuleEngine {
  createInitialState() {
    return {
      board: cloneBoard(INITIAL_BOARD),
      turn: 'red',
      winner: null
    };
  }

  getPieceAt(board, x, y) {
    return board.find((p) => p.x === x && p.y === y) || null;
  }

  validateMove(state, move) {
    const { board, turn } = state;
    const from = move?.from;
    const to = move?.to;

    if (!from || !to) {
      return { ok: false, code: 'INVALID_INPUT', message: 'move.from / move.to 必填' };
    }

    if (!isInsideBoard(from.x, from.y) || !isInsideBoard(to.x, to.y)) {
      return { ok: false, code: 'OUT_OF_BOARD', message: '目标超出棋盘范围' };
    }

    const movingPiece = this.getPieceAt(board, from.x, from.y);
    if (!movingPiece) {
      return { ok: false, code: 'NO_PIECE', message: '起点无棋子' };
    }

    if (movingPiece.side !== turn) {
      return { ok: false, code: 'WRONG_TURN', message: '当前不是该方回合' };
    }

    const targetPiece = this.getPieceAt(board, to.x, to.y);
    if (targetPiece && targetPiece.side === movingPiece.side) {
      return { ok: false, code: 'BLOCKED_BY_FRIEND', message: '目标位置己方占用' };
    }

    // TODO(xiaoxu): 按棋子类型补充严格走法校验
    return {
      ok: true,
      code: 'PLACEHOLDER_PASS',
      message: '占位校验通过（尚未启用完整棋规）',
      detail: {
        pieceType: movingPiece.type,
        hasCapture: Boolean(targetPiece)
      }
    };
  }

  applyMove(state, move) {
    const verdict = this.validateMove(state, move);
    if (!verdict.ok) return { verdict, nextState: state };

    const nextBoard = cloneBoard(state.board).filter((p) => !(p.x === move.to.x && p.y === move.to.y));
    const idx = nextBoard.findIndex((p) => p.x === move.from.x && p.y === move.from.y);
    if (idx >= 0) {
      nextBoard[idx] = {
        ...nextBoard[idx],
        x: move.to.x,
        y: move.to.y
      };
    }

    const nextState = {
      ...state,
      board: nextBoard,
      turn: state.turn === 'red' ? 'black' : 'red'
    };

    return { verdict, nextState };
  }
}
