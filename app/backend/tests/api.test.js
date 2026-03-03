import test from 'node:test';
import assert from 'node:assert/strict';

import { createDraftApi } from '../api/draft.js';

test('api: update session status and query snapshot', () => {
  const api = createDraftApi();
  const created = api.createSession({ sessionId: 's-api-1', undoLimit: 2 });
  assert.equal(created.ok, true);

  const patched = api.updateSession('s-api-1', { status: 'paused' });
  assert.equal(patched.ok, true);
  assert.equal(patched.session.status, 'paused');

  const fetched = api.getSession('s-api-1');
  assert.equal(fetched.ok, true);
  assert.equal(fetched.session.status, 'paused');
});

test('api: playMove returns meta with next turn', () => {
  const api = createDraftApi();
  const created = api.createSession({ sessionId: 's-api-2', undoLimit: 1 });
  assert.equal(created.ok, true);

  // red soldier forward one step (legal)
  const moved = api.playMove('s-api-2', {
    from: { x: 0, y: 6 },
    to: { x: 0, y: 5 }
  });

  assert.equal(moved.ok, true);
  assert.equal(moved.meta.nextTurn, 'black');
  assert.equal(moved.meta.moveCount, 1);
});

test('api: detectCheck placeholder endpoint works', () => {
  const api = createDraftApi();
  const created = api.createSession({ sessionId: 's-api-3', undoLimit: 1 });
  assert.equal(created.ok, true);

  const check = api.detectCheck('s-api-3', 'red');
  assert.equal(check.ok, true);
  assert.equal(typeof check.inCheck, 'boolean');
  assert.ok(Array.isArray(check.attackers));
});
