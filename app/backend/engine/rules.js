import { cloneBoard, INITIAL_BOARD, isInsideBoard, PIECE_TYPE } from './board.js';

/**
 * 规则引擎（V3）
 * - 已实现：兵、车、炮、马 合法走子校验
 * - 已实现：将军检测 V1（含帅将照面）
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

  countPiecesBetween(board, from, to) {
    if (from.x !== to.x && from.y !== to.y) return -1;

    const dx = Math.sign(to.x - from.x);
    const dy = Math.sign(to.y - from.y);
    let cx = from.x + dx;
    let cy = from.y + dy;
    let count = 0;

    while (cx !== to.x || cy !== to.y) {
      if (this.getPieceAt(board, cx, cy)) count += 1;
      cx += dx;
      cy += dy;
    }

    return count;
  }

  isPathClearStraight(board, from, to) {
    const between = this.countPiecesBetween(board, from, to);
    return between === 0;
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

  validateCannonMove(board, from, to, hasTargetPiece) {
    if (from.x !== to.x && from.y !== to.y) {
      return { ok: false, code: 'INVALID_CANNON_DIRECTION', message: '炮只能走直线' };
    }

    const between = this.countPiecesBetween(board, from, to);
    if (between < 0) {
      return { ok: false, code: 'INVALID_CANNON_DIRECTION', message: '炮只能走直线' };
    }

    if (!hasTargetPiece && between !== 0) {
      return { ok: false, code: 'CANNON_MOVE_BLOCKED', message: '炮不吃子时路径不能有阻挡' };
    }

    if (hasTargetPiece && between !== 1) {
      return { ok: false, code: 'CANNON_CAPTURE_RULE', message: '炮吃子时必须隔一子' };
    }

    return { ok: true };
  }

  validateKnightMove(board, from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    if (!((adx === 2 && ady === 1) || (adx === 1 && ady === 2))) {
      return { ok: false, code: 'INVALID_KNIGHT_SHAPE', message: '马走日字' };
    }

    const leg = adx === 2
      ? { x: from.x + Math.sign(dx), y: from.y }
      : { x: from.x, y: from.y + Math.sign(dy) };

    if (this.getPieceAt(board, leg.x, leg.y)) {
      return { ok: false, code: 'KNIGHT_LEG_BLOCKED', message: '马腿被蹩' };
    }

    return { ok: true };
  }

  validateByPieceType(board, movingPiece, from, to, targetPiece) {
    if (movingPiece.type === PIECE_TYPE.SOLDIER) {
      return this.validateSoldierMove(movingPiece, from, to);
    }

    if (movingPiece.type === PIECE_TYPE.ROOK) {
      return this.validateRookMove(board, from, to);
    }

    if (movingPiece.type === PIECE_TYPE.CANNON) {
      return this.validateCannonMove(board, from, to, Boolean(targetPiece));
    }

    if (movingPiece.type === PIECE_TYPE.KNIGHT) {
      return this.validateKnightMove(board, from, to);
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

    const pieceVerdict = this.validateByPieceType(board, movingPiece, from, to, targetPiece);
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

  findGeneral(board, side) {
    return board.find((p) => p.side === side && p.type === PIECE_TYPE.GENERAL) || null;
  }

  isGeneralFacing(board, side) {
    const mine = this.findGeneral(board, side);
    const enemy = this.findGeneral(board, side === 'red' ? 'black' : 'red');
    if (!mine || !enemy) return false;
    if (mine.x !== enemy.x) return false;

    const between = this.countPiecesBetween(board, { x: mine.x, y: mine.y }, { x: enemy.x, y: enemy.y });
    return between === 0;
  }

  canPieceThreatenGeneral(board, piece, targetGeneral) {
    const supportedThreatTypes = new Set([
      PIECE_TYPE.SOLDIER,
      PIECE_TYPE.ROOK,
      PIECE_TYPE.CANNON,
      PIECE_TYPE.KNIGHT
    ]);

    if (!supportedThreatTypes.has(piece.type)) return false;

    const verdict = this.validateByPieceType(
      board,
      piece,
      { x: piece.x, y: piece.y },
      { x: targetGeneral.x, y: targetGeneral.y },
      targetGeneral
    );

    return verdict.ok;
  }

  /**
   * 将军检测 V1
   * - 检测兵/车/炮/马对将的直接威胁
   * - 检测“帅将照面”
   */
  detectCheck(state, side) {
    const targetGeneral = this.findGeneral(state.board, side);
    if (!targetGeneral) {
      return {
        ok: false,
        code: 'GENERAL_NOT_FOUND',
        inCheck: false,
        attackers: []
      };
    }

    const enemySide = side === 'red' ? 'black' : 'red';
    const attackers = [];

    const enemyPieces = state.board.filter((p) => p.side === enemySide);
    for (const piece of enemyPieces) {
      if (!this.canPieceThreatenGeneral(state.board, piece, targetGeneral)) continue;

      attackers.push({
        pieceId: piece.id,
        pieceType: piece.type,
        from: { x: piece.x, y: piece.y },
        mode: 'piece_attack'
      });
    }

    if (this.isGeneralFacing(state.board, side)) {
      const enemyGeneral = this.findGeneral(state.board, enemySide);
      attackers.push({
        pieceId: enemyGeneral?.id || 'enemy-general',
        pieceType: PIECE_TYPE.GENERAL,
        from: enemyGeneral ? { x: enemyGeneral.x, y: enemyGeneral.y } : null,
        mode: 'general_facing'
      });
    }

    return {
      ok: true,
      code: 'CHECK_DETECTED_V1',
      inCheck: attackers.length > 0,
      attackers
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
