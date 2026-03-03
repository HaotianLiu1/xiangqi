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
      history: [],
      state: initial
    };

    this.sessions.set(id, session);
    return session;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
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

    const snapshot = {
      state: JSON.parse(JSON.stringify(session.state)),
      moveCount: session.moveCount,
      undoRemaining: session.undoRemaining
    };

    const { verdict, nextState } = this.ruleEngine.applyMove(session.state, move);
    if (!verdict.ok) return { ok: false, ...verdict };

    session.history.push(snapshot);
    session.state = nextState;
    session.moveCount += 1;
    session.updatedAt = nowIso();

    return {
      ok: true,
      verdict,
      session
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
    session.updatedAt = nowIso();

    return { ok: true, session };
  }
}
