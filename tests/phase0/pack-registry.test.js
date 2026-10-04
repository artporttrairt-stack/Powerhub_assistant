'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createPackRegistry } = require('../../extension/src/features/teacher-support/guidance/pack-registry.js');

function pack(id, matched = false) {
  return { id, version: '1.0.0', workflow: 'ms1', sourceIds: [`${id}-source`], applicability: () => ({ matched, reason: matched ? 'yes' : 'no' }) };
}

test('rejects missing or blank pack id', () => {
  const r = createPackRegistry();
  assert.throws(() => r.register({}), /Pack id is required/);
  assert.throws(() => r.register({ id: '   ' }), /Pack id is required/);
});

test('rejects duplicate pack ids', () => {
  const r = createPackRegistry();
  r.register(pack('one'));
  assert.throws(() => r.register(pack('one')), /Duplicate pack id/);
});

test('list preserves deterministic registration order', () => {
  const r = createPackRegistry();
  r.register(pack('b'));
  r.register(pack('a'));
  assert.deepEqual(r.list().map((p) => p.id), ['b', 'a']);
});

test('select returns none when no packs match', () => {
  const r = createPackRegistry();
  r.register(pack('a', false));
  assert.deepEqual(r.select({}), { status: 'none', pack: null, matchIds: [] });
});

test('select returns exactly one matched pack', () => {
  const r = createPackRegistry();
  r.register(pack('a', false));
  const stored = r.register(pack('b', true));
  const result = r.select({});
  assert.equal(result.status, 'matched');
  assert.equal(result.pack, stored);
  assert.deepEqual(result.matchIds, ['b']);
});

test('select fails closed when multiple packs match', () => {
  const r = createPackRegistry();
  r.register(pack('a', true));
  r.register(pack('b', true));
  assert.deepEqual(r.select({}), { status: 'ambiguous', pack: null, matchIds: ['a', 'b'] });
});

test('registered definitions and returned snapshots are immutable copies', () => {
  const r = createPackRegistry();
  const original = pack('a', true);
  const stored = r.register(original);
  original.sourceIds.push('mutated');
  assert.deepEqual(stored.sourceIds, ['a-source']);
  assert.equal(Object.isFrozen(stored), true);
  assert.equal(Object.isFrozen(stored.sourceIds), true);
  const list = r.list();
  const selection = r.select({});
  const snapshot = r.snapshot();
  assert.equal(Object.isFrozen(list), true);
  assert.equal(Object.isFrozen(selection), true);
  assert.equal(Object.isFrozen(selection.matchIds), true);
  assert.equal(Object.isFrozen(snapshot), true);
});
