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
