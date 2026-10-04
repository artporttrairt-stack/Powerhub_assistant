'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createSupportLifecycle } = require('../../extension/src/features/teacher-support/runtime/support-lifecycle.js');

function registry(selection) { return { select: () => selection }; }

test('no matching pack stays DORMANT and never calls onReady', () => {
  let readyCalls = 0;
  const lifecycle = createSupportLifecycle({
    getContext: () => ({ ok: true }),
    packRegistry: registry({ status: 'none', pack: null, matchIds: [] }),
    onReady: () => { readyCalls += 1; },
  });
  assert.deepEqual(lifecycle.start(), { state: 'DORMANT', selectionStatus: 'none', packId: null, matchIds: [] });
  assert.equal(readyCalls, 0);
});

test('ambiguous selection fails closed to AMBIGUOUS', () => {
  const lifecycle = createSupportLifecycle({
    getContext: () => ({}),
    packRegistry: registry({ status: 'ambiguous', pack: null, matchIds: ['a', 'b'] }),
  });
  assert.deepEqual(lifecycle.start(), { state: 'AMBIGUOUS', selectionStatus: 'ambiguous', packId: null, matchIds: ['a', 'b'] });
});

test('verified single match reaches READY without mounting UI by default', () => {
  const p = { id: 'cam-primary.ms1' };
  const lifecycle = createSupportLifecycle({
    getContext: () => ({}),
    packRegistry: registry({ status: 'matched', pack: p, matchIds: [p.id] }),
  });
  assert.deepEqual(lifecycle.start(), { state: 'READY', selectionStatus: 'matched', packId: p.id, matchIds: [p.id] });
});

test('start is idempotent', () => {
  let contextCalls = 0;
  const lifecycle = createSupportLifecycle({
    getContext: () => { contextCalls += 1; return {}; },
    packRegistry: registry({ status: 'none', pack: null, matchIds: [] }),
  });
  lifecycle.start(); lifecycle.start();
  assert.equal(contextCalls, 1);
});

test('stop enters STOPPED and remains stopped', () => {
  const lifecycle = createSupportLifecycle({
    getContext: () => ({}),
    packRegistry: registry({ status: 'none', pack: null, matchIds: [] }),
  });
  lifecycle.start();
  assert.equal(lifecycle.stop().state, 'STOPPED');
  assert.equal(lifecycle.start().state, 'STOPPED');
  assert.equal(lifecycle.reconcile({}).state, 'STOPPED');
});

test('reconcile is explicit-call only and can move between states', () => {
  let selection = { status: 'none', pack: null, matchIds: [] };
  const lifecycle = createSupportLifecycle({
    getContext: () => ({}),
    packRegistry: { select: () => selection },
  });
  assert.equal(lifecycle.start().state, 'DORMANT');
  selection = { status: 'matched', pack: { id: 'x' }, matchIds: ['x'] };
  assert.equal(lifecycle.snapshot().state, 'DORMANT');
  assert.equal(lifecycle.reconcile({}).state, 'READY');
});

test('lifecycle source contains no implicit observer listener or scheduling primitive', () => {
  const src = fs.readFileSync(path.resolve(__dirname, '../../extension/src/features/teacher-support/runtime/support-lifecycle.js'), 'utf8');
  for (const token of ['MutationObserver', 'setInterval(', 'setTimeout(', 'requestAnimationFrame(', 'addEventListener(']) {
    assert.equal(src.includes(token), false, `Forbidden lifecycle primitive: ${token}`);
  }
});
