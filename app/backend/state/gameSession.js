import { XiangqiRuleEngine } from '../engine/rules.js';

function nowIso() {
  return new Date().toISOString();
}

export class GameSessionStore {
  constructor() {
    this.ruleEngine = new XiangqiRuleEngine();
    this.sessions = new Map();
  }

  createSession({ sessionId, difficulty = 'medium', undoLimit = 1 } = {}) {
    const id = sessionId || `sess_${Date.now()}`;
    const initial = this.ruleEngine.createInitialState();

    const session = {
      sessionId: id,
      difficulty,
      undoLimit,
      undoRemaining: undoLimit,
      moveCount: 0,
      status: 'playing',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      lastMoveAt: null,
      history: [],
      state: initial
    };

    this.sessions.set(id, session);
    return session;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  getSessionSnapshot(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) {
      return { ok: false, code: 'SESSION_NOT_FOUND', message: '对局不存在' };
    }

    return {
      ok: true,
      session: {
        sessionId: session.sessionId,
        status: session.status,
        difficulty: session.difficulty,
        moveCount: session.moveCount,
        undoRemaining: session.undoRemaining,
        turn: session.state.turn,
        winner: session.state.winner,
        lastMoveAt: session.lastMoveAt,
        updatedAt: session.updatedAt,
        board: session.state.board
      }
    };
  }

  listSessions() {
    return [...this.sessions.values()].map((s) => ({
      sessionId: s.sessionId,
      status: s.status,
      difficulty: s.difficulty,
      moveCount: s.moveCount,
      updatedAt: s.updatedAt
    }));
  }

  applyMove(sessionId, move) {
    const session = this.getSession(sessionId);
    if (!session) {
      return { ok: false, code: 'SESSION_NOT_FOUND', message: '对局不存在' };
    }

    if (session.status !== 'playing') {
      return { ok: false, code: 'SESSION_NOT_PLAYING', message: '对局状态不可落子' };
    }

    const snapshot = {
      state: JSON.parse(JSON.stringify(session.state)),
      moveCount: session.moveCount,
      undoRemaining: session.undoRemaining,
      status: session.status,
      lastMoveAt: session.lastMoveAt
    };

    const { verdict, nextState } = this.ruleEngine.applyMove(session.state, move);
    if (!verdict.ok) return { ok: false, ...verdict };

    session.history.push(snapshot);
    session.state = nextState;
    session.moveCount += 1;
    session.lastMoveAt = nowIso();
    session.updatedAt = nowIso();

    return {
      ok: true,
      verdict,
      session,
      meta: {
        sessionId: session.sessionId,
        moveCount: session.moveCount,
        nextTurn: session.state.turn,
        status: session.status,
        updatedAt: session.updatedAt
      }
    };
  }

  updateSessionStatus(sessionId, status) {
    const session = this.getSession(sessionId);
    if (!session) {
      return { ok: false, code: 'SESSION_NOT_FOUND', message: '对局不存在' };
    }

    const allowed = new Set(['playing', 'paused', 'finished']);
    if (!allowed.has(status)) {
      return { ok: false, code: 'INVALID_STATUS', message: '状态非法' };
    }

    session.status = status;
    session.updatedAt = nowIso();

    return {
      ok: true,
      session,
      meta: {
        sessionId: session.sessionId,
        status: session.status,
        updatedAt: session.updatedAt
      }
    };
  }

  undo(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) {
      return { ok: false, code: 'SESSION_NOT_FOUND', message: '对局不存在' };
    }

    if (session.undoRemaining <= 0) {
      return { ok: false, code: 'UNDO_LIMIT_REACHED', message: '悔棋次数已用尽' };
    }

    const previous = session.history.pop();
    if (!previous) {
      return { ok: false, code: 'NO_HISTORY', message: '无可悔步骤' };
    }

    session.state = previous.state;
    session.moveCount = previous.moveCount;
    session.undoRemaining -= 1;
    session.status = previous.status;
    session.lastMoveAt = previous.lastMoveAt;
    session.updatedAt = nowIso();

    return { ok: true, session };
  }
}
