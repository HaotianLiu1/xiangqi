/**
 * 对局状态管理 API 草案（离线 Web 可嵌入）
 *
 * REST Draft:
 * - POST   /api/v1/sessions
 *   body: { difficulty: 'easy|medium|hard', undoLimit: number }
 *   res : { sessionId, state, meta }
 *
 * - GET    /api/v1/sessions/:sessionId
 *   res : { sessionId, status, moveCount, undoRemaining, state }
 *
 * - GET    /api/v1/sessions
 *   res : [{ sessionId, status, difficulty, moveCount, updatedAt }]
 *
 * - POST   /api/v1/sessions/:sessionId/moves
 *   body: { from: {x,y}, to: {x,y} }
 *   res : { ok, verdict, session }
 *
 * - POST   /api/v1/sessions/:sessionId/ai-move
 *   body: { level?: 'easy|medium|hard' }
 *   res : { ok, move, verdict, session }
 *
 * - POST   /api/v1/sessions/:sessionId/undo
 *   res : { ok, session }
 *
 * 说明:
 * - 当前阶段为最小骨架，默认内存态存储。
 * - 后续可扩展为 IndexedDB（纯离线持久化）。
 */

import { AI_LEVEL, chooseMoveByLevel } from '../ai/levels.js';
import { GameSessionStore } from '../state/gameSession.js';

export function createDraftApi() {
  const store = new GameSessionStore();

  return {
    createSession(payload = {}) {
      const session = store.createSession(payload);
      return { ok: true, session };
    },

    getSession(sessionId) {
      const session = store.getSession(sessionId);
      if (!session) return { ok: false, code: 'SESSION_NOT_FOUND' };
      return { ok: true, session };
    },

    listSessions() {
      return { ok: true, sessions: store.listSessions() };
    },

    playMove(sessionId, move) {
      return store.applyMove(sessionId, move);
    },

    playAiMove(sessionId, level = AI_LEVEL.MEDIUM) {
      const session = store.getSession(sessionId);
      if (!session) return { ok: false, code: 'SESSION_NOT_FOUND' };

      const move = chooseMoveByLevel({ state: session.state, level });
      if (!move) return { ok: false, code: 'NO_AVAILABLE_MOVE' };

      const result = store.applyMove(sessionId, move);
      return { ...result, move };
    },

    undo(sessionId) {
      return store.undo(sessionId);
    }
  };
}

export { AI_LEVEL };
