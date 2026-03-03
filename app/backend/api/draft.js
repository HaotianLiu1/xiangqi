/**
 * 对局状态管理 API 草案（离线 Web 可嵌入）
 *
 * REST Draft:
 * - POST   /api/v1/sessions
 * - GET    /api/v1/sessions/:sessionId
 * - GET    /api/v1/sessions
 * - PATCH  /api/v1/sessions/:sessionId
 * - POST   /api/v1/sessions/:sessionId/moves
 * - POST   /api/v1/sessions/:sessionId/ai-move
 * - GET    /api/v1/sessions/:sessionId/check?side=red|black
 * - POST   /api/v1/sessions/:sessionId/undo
 */

import { AI_LEVEL, chooseMoveByLevel } from '../ai/levels.js';
import { GameSessionStore } from '../state/gameSession.js';

function normalizeError(result) {
  if (result.ok) return result;

  const map = {
    SESSION_NOT_FOUND: 'ERR_SESSION_NOT_FOUND',
    SESSION_NOT_PLAYING: 'ERR_SESSION_NOT_PLAYING',
    INVALID_PATCH: 'ERR_INVALID_PATCH',
    INVALID_STATUS: 'ERR_INVALID_STATUS',
    INVALID_SIDE: 'ERR_INVALID_SIDE',
    INVALID_INPUT: 'ERR_INVALID_INPUT',
    OUT_OF_BOARD: 'ERR_OUT_OF_BOARD',
    NO_OP_MOVE: 'ERR_NO_OP_MOVE',
    NO_PIECE: 'ERR_NO_PIECE',
    WRONG_TURN: 'ERR_WRONG_TURN',
    BLOCKED_BY_FRIEND: 'ERR_BLOCKED_BY_FRIEND',
    INVALID_SOLDIER_STEP: 'ERR_INVALID_SOLDIER_STEP',
    INVALID_SOLDIER_DIRECTION: 'ERR_INVALID_SOLDIER_DIRECTION',
    INVALID_ROOK_DIRECTION: 'ERR_INVALID_ROOK_DIRECTION',
    ROOK_PATH_BLOCKED: 'ERR_ROOK_PATH_BLOCKED',
    INVALID_CANNON_DIRECTION: 'ERR_INVALID_CANNON_DIRECTION',
    CANNON_MOVE_BLOCKED: 'ERR_CANNON_MOVE_BLOCKED',
    CANNON_CAPTURE_RULE: 'ERR_CANNON_CAPTURE_RULE',
    INVALID_KNIGHT_SHAPE: 'ERR_INVALID_KNIGHT_SHAPE',
    KNIGHT_LEG_BLOCKED: 'ERR_KNIGHT_LEG_BLOCKED',
    GENERAL_NOT_FOUND: 'ERR_GENERAL_NOT_FOUND',
    UNDO_LIMIT_REACHED: 'ERR_UNDO_LIMIT_REACHED',
    NO_HISTORY: 'ERR_NO_HISTORY',
    NO_AVAILABLE_MOVE: 'ERR_NO_AVAILABLE_MOVE'
  };

  return {
    ...result,
    errorCode: map[result.code] || 'ERR_UNKNOWN'
  };
}

export function createDraftApi() {
  const store = new GameSessionStore();

  return {
    createSession(payload = {}) {
      const session = store.createSession(payload);
      return { ok: true, session };
    },

    getSession(sessionId) {
      return normalizeError(store.getSessionSnapshot(sessionId));
    },

    listSessions() {
      return { ok: true, sessions: store.listSessions() };
    },

    updateSession(sessionId, patch = {}) {
      if (!patch.status) {
        return normalizeError({ ok: false, code: 'INVALID_PATCH', message: '当前仅支持 patch.status' });
      }
      return normalizeError(store.updateSessionStatus(sessionId, patch.status));
    },

    playMove(sessionId, move) {
      return normalizeError(store.applyMove(sessionId, move));
    },

    playAiMove(sessionId, level = AI_LEVEL.MEDIUM) {
      const session = store.getSession(sessionId);
      if (!session) return normalizeError({ ok: false, code: 'SESSION_NOT_FOUND' });

      const move = chooseMoveByLevel({ state: session.state, level });
      if (!move) return normalizeError({ ok: false, code: 'NO_AVAILABLE_MOVE' });

      const result = store.applyMove(sessionId, move);
      return normalizeError({ ...result, move });
    },

    detectCheck(sessionId, side) {
      if (!side || (side !== 'red' && side !== 'black')) {
        return normalizeError({ ok: false, code: 'INVALID_SIDE', message: 'side 必须为 red 或 black' });
      }

      return normalizeError(store.detectCheck(sessionId, side));
    },

    undo(sessionId) {
      return normalizeError(store.undo(sessionId));
    }
  };
}

export { AI_LEVEL };
