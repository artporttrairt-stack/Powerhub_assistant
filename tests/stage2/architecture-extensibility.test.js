'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createWorkflowRegistry } = require('../../extension/src/features/teacher-support/registry/workflow-registry.js');

function fakeWorkflow(id, { status = 'READY', visibleInPicker = true, matched = false } = {}) {
  return {
    id,
    version: '0.0.0-fixture',
    label: `Fixture ${id}`,
    status,
    visibleInPicker,
    navigation: { target: 'fixture-target' },
    applicability: () => ({ matched, reason: 'fixture' }),
    guidancePackId: `${id}-fixture-pack`,
  };
}

test('future Grade 7 Music workflow registers without core changes', () => {
  const r = createWorkflowRegistry();
  const stored = r.register(fakeWorkflow('future-grade7-music'));
  assert.equal(stored.id, 'future-grade7-music');
  assert.equal(r.get('future-grade7-music'), stored);
});

test('future EOS workflow becomes picker-visible by changing only status', () => {
  const hidden = fakeWorkflow('future-eos-workflow', { status: 'SOURCE_REQUIRED' });
  const r1 = createWorkflowRegistry();
  r1.register(hidden);
  assert.deepEqual(r1.listVisible(), []);

  const ready = { ...hidden, status: 'READY' };
  const r2 = createWorkflowRegistry();
  r2.register(ready);
  assert.deepEqual(r2.listVisible().map((w) => w.id), ['future-eos-workflow']);
});

test('removing a fake pack leaves registry core working', () => {
  const r = createWorkflowRegistry();
  r.register(fakeWorkflow('independent-a'));
  assert.deepEqual(r.list().map((w) => w.id), ['independent-a']);
  assert.deepEqual(r.select({}), { status: 'none', workflow: null, matchIds: [] });
});

test('registering 20 fake workflows creates no observers or listeners', () => {
  const previousMutationObserver = globalThis.MutationObserver;
  const previousAddEventListener = globalThis.addEventListener;
  let sideEffects = 0;
  globalThis.MutationObserver = class ForbiddenMutationObserver {
    constructor() { sideEffects += 1; }
  };
  globalThis.addEventListener = () => { sideEffects += 1; };
  try {
    const r = createWorkflowRegistry();
    for (let i = 0; i < 20; i += 1) r.register(fakeWorkflow(`future-${i}`));
    assert.equal(r.list().length, 20);
    assert.equal(sideEffects, 0);
  } finally {
    if (previousMutationObserver === undefined) delete globalThis.MutationObserver;
    else globalThis.MutationObserver = previousMutationObserver;
    if (previousAddEventListener === undefined) delete globalThis.addEventListener;
    else globalThis.addEventListener = previousAddEventListener;
  }
});

test('generic Teacher Support source contains no seed grade/class/subject assumptions', () => {
  const genericFiles = [
    '../../extension/src/features/teacher-support/registry/workflow-registry.js',
    '../../extension/src/features/teacher-support/guidance/pack-registry.js',
    '../../extension/src/features/teacher-support/runtime/support-lifecycle.js',
  ];
  const forbidden = /CAM Primary|Grade\s*[1-9]|Music|\bMS1\b|\bEE\b|\bAE\b|\bME\b|\bBE\b|\bWB\b/;
  for (const relative of genericFiles) {
    const full = path.join(__dirname, relative);
    if (!fs.existsSync(full)) continue;
    assert.doesNotMatch(fs.readFileSync(full, 'utf8'), forbidden, `seed assumption leaked into ${relative}`);
  }
});
