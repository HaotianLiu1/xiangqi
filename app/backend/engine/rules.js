import { cloneBoard, INITIAL_BOARD, isInsideBoard, PIECE_TYPE } from './board.js';

/**
 * 规则引擎（V1）
 * - 已实现：兵(SOLDIER)、车(ROOK) 合法走子校验
 * - 其他棋子：占位放行（后续补齐）
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

  isPathClearStraight(board, from, to) {
    if (from.x !== to.x && from.y !== to.y) return false;

    const dx = Math.sign(to.x - from.x);
    const dy = Math.sign(to.y - from.y);
    let cx = from.x + dx;
    let cy = from.y + dy;

    while (cx !== to.x || cy !== to.y) {
      if (this.getPieceAt(board, cx, cy)) return false;
      cx += dx;
      cy += dy;
    }

    return true;
  }

  validateSoldierMove(movingPiece, from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const stepCount = Math.abs(dx) + Math.abs(dy);

    if (stepCount !== 1) {
      return { ok: false, code: 'INVALID_SOLDIER_STEP', message: '兵/卒每次只能走一格' };
    }

    const isRed = movingPiece.side === 'red';
    const forward = isRed ? -1 : 1;
    const hasCrossedRiver = isRed ? from.y <= 4 : from.y >= 5;

    if (dy === forward && dx === 0) {
      return { ok: true };
    }

    if (dy === 0 && Math.abs(dx) === 1 && hasCrossedRiver) {
      return { ok: true };
    }

    return {
      ok: false,
      code: 'INVALID_SOLDIER_DIRECTION',
      message: hasCrossedRiver ? '兵/卒过河后可平走，不可后退' : '兵/卒未过河前只能前进'
    };
  }

  validateRookMove(board, from, to) {
    if (from.x !== to.x && from.y !== to.y) {
      return { ok: false, code: 'INVALID_ROOK_DIRECTION', message: '车只能走直线' };
    }

    if (!this.isPathClearStraight(board, from, to)) {
      return { ok: false, code: 'ROOK_PATH_BLOCKED', message: '车的路径被阻挡' };
    }

    return { ok: true };
  }

  validateByPieceType(board, movingPiece, from, to) {
    if (movingPiece.type === PIECE_TYPE.SOLDIER) {
      return this.validateSoldierMove(movingPiece, from, to);
    }

    if (movingPiece.type === PIECE_TYPE.ROOK) {
      return this.validateRookMove(board, from, to);
    }

    return {
      ok: true,
      code: 'PLACEHOLDER_PASS',
      message: '该棋子规则暂未启用，按占位校验通过'
    };
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

    if (from.x === to.x && from.y === to.y) {
      return { ok: false, code: 'NO_OP_MOVE', message: '起终点不能相同' };
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

    const pieceVerdict = this.validateByPieceType(board, movingPiece, from, to);
    if (!pieceVerdict.ok) {
      return pieceVerdict;
    }

    return {
      ok: true,
      code: pieceVerdict.code || 'VALID_MOVE',
      message: pieceVerdict.message || '走子合法',
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
