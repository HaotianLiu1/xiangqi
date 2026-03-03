import test from 'node:test';
import assert from 'node:assert/strict';

import { XiangqiRuleEngine } from '../engine/rules.js';
import { PIECE_TYPE } from '../engine/board.js';

function makeState({ board, turn = 'red' }) {
  return { board, turn, winner: null };
}

test('soldier: red soldier cannot move sideways before crossing river', () => {
  const engine = new XiangqiRuleEngine();
  const state = makeState({
    board: [{ id: 'r-s', side: 'red', type: PIECE_TYPE.SOLDIER, x: 4, y: 6 }],
    turn: 'red'
  });

  const verdict = engine.validateMove(state, {
    from: { x: 4, y: 6 },
    to: { x: 5, y: 6 }
  });

  assert.equal(verdict.ok, false);
  assert.equal(verdict.code, 'INVALID_SOLDIER_DIRECTION');
});

test('soldier: red soldier can move sideways after crossing river', () => {
  const engine = new XiangqiRuleEngine();
  const state = makeState({
    board: [{ id: 'r-s', side: 'red', type: PIECE_TYPE.SOLDIER, x: 4, y: 4 }],
    turn: 'red'
  });

  const verdict = engine.validateMove(state, {
    from: { x: 4, y: 4 },
    to: { x: 5, y: 4 }
  });

  assert.equal(verdict.ok, true);
});

test('rook: rook cannot jump over blocking piece', () => {
  const engine = new XiangqiRuleEngine();
  const state = makeState({
    board: [
      { id: 'r-rook', side: 'red', type: PIECE_TYPE.ROOK, x: 0, y: 9 },
      { id: 'r-block', side: 'red', type: PIECE_TYPE.SOLDIER, x: 0, y: 8 }
    ],
    turn: 'red'
  });

  const verdict = engine.validateMove(state, {
    from: { x: 0, y: 9 },
    to: { x: 0, y: 7 }
  });

  assert.equal(verdict.ok, false);
  assert.equal(verdict.code, 'ROOK_PATH_BLOCKED');
});

test('cannon: capture requires exactly one piece in between', () => {
  const engine = new XiangqiRuleEngine();
  const state = makeState({
    board: [
      { id: 'r-cannon', side: 'red', type: PIECE_TYPE.CANNON, x: 1, y: 7 },
      { id: 'r-screen-1', side: 'red', type: PIECE_TYPE.SOLDIER, x: 1, y: 6 },
      { id: 'r-screen-2', side: 'red', type: PIECE_TYPE.SOLDIER, x: 1, y: 5 },
      { id: 'b-target', side: 'black', type: PIECE_TYPE.SOLDIER, x: 1, y: 4 }
    ],
    turn: 'red'
  });

  const verdict = engine.validateMove(state, {
    from: { x: 1, y: 7 },
    to: { x: 1, y: 4 }
  });

  assert.equal(verdict.ok, false);
  assert.equal(verdict.code, 'CANNON_CAPTURE_RULE');

  const legalState = makeState({
    board: [
      { id: 'r-cannon', side: 'red', type: PIECE_TYPE.CANNON, x: 1, y: 7 },
      { id: 'r-screen', side: 'red', type: PIECE_TYPE.SOLDIER, x: 1, y: 6 },
      { id: 'b-target', side: 'black', type: PIECE_TYPE.SOLDIER, x: 1, y: 5 }
    ],
    turn: 'red'
  });

  const verdict2 = engine.validateMove(legalState, {
    from: { x: 1, y: 7 },
    to: { x: 1, y: 5 }
  });

  assert.equal(verdict2.ok, true);
});

test('cannon: non-capture move cannot jump pieces', () => {
  const engine = new XiangqiRuleEngine();
  const state = makeState({
    board: [
      { id: 'r-cannon', side: 'red', type: PIECE_TYPE.CANNON, x: 1, y: 7 },
      { id: 'r-block', side: 'red', type: PIECE_TYPE.SOLDIER, x: 1, y: 6 }
    ],
    turn: 'red'
  });

  const verdict = engine.validateMove(state, {
    from: { x: 1, y: 7 },
    to: { x: 1, y: 5 }
  });

  assert.equal(verdict.ok, false);
  assert.equal(verdict.code, 'CANNON_MOVE_BLOCKED');
});

test('knight: knight move blocked by horse-leg', () => {
  const engine = new XiangqiRuleEngine();
  const state = makeState({
    board: [
      { id: 'r-knight', side: 'red', type: PIECE_TYPE.KNIGHT, x: 1, y: 9 },
      { id: 'r-block', side: 'red', type: PIECE_TYPE.SOLDIER, x: 2, y: 9 }
    ],
    turn: 'red'
  });

  const verdict = engine.validateMove(state, {
    from: { x: 1, y: 9 },
    to: { x: 3, y: 8 }
  });

  assert.equal(verdict.ok, false);
  assert.equal(verdict.code, 'KNIGHT_LEG_BLOCKED');
});

test('knight: invalid shape should be rejected', () => {
  const engine = new XiangqiRuleEngine();
  const state = makeState({
    board: [{ id: 'r-knight', side: 'red', type: PIECE_TYPE.KNIGHT, x: 1, y: 9 }],
    turn: 'red'
  });

  const verdict = engine.validateMove(state, {
    from: { x: 1, y: 9 },
    to: { x: 1, y: 8 }
  });

  assert.equal(verdict.ok, false);
  assert.equal(verdict.code, 'INVALID_KNIGHT_SHAPE');
});

test('detectCheck: rook threatening general should be detected as check', () => {
  const engine = new XiangqiRuleEngine();
  const state = makeState({
    board: [
      { id: 'r-general', side: 'red', type: PIECE_TYPE.GENERAL, x: 4, y: 9 },
      { id: 'b-general', side: 'black', type: PIECE_TYPE.GENERAL, x: 4, y: 0 },
      { id: 'b-rook', side: 'black', type: PIECE_TYPE.ROOK, x: 4, y: 5 }
    ],
    turn: 'red'
  });

  const result = engine.detectCheck(state, 'red');
  assert.equal(result.ok, true);
  assert.equal(result.inCheck, true);
  assert.equal(result.attackers.length, 1);
  assert.equal(result.attackers[0].pieceType, PIECE_TYPE.ROOK);
});

test('detectCheck: facing generals should be detected', () => {
  const engine = new XiangqiRuleEngine();
  const state = makeState({
    board: [
      { id: 'r-general', side: 'red', type: PIECE_TYPE.GENERAL, x: 4, y: 9 },
      { id: 'b-general', side: 'black', type: PIECE_TYPE.GENERAL, x: 4, y: 0 }
    ],
    turn: 'red'
  });

  const result = engine.detectCheck(state, 'red');
  assert.equal(result.ok, true);
  assert.equal(result.inCheck, true);
  assert.equal(result.attackers.some((a) => a.mode === 'general_facing'), true);
});
