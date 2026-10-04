'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createWorkflowRegistry } = require('../../extension/src/features/teacher-support/registry/workflow-registry.js');

function workflow(id, matched = false, overrides = {}) {
  return {
    id,
    version: '1.0.0',
    label: id,
    status: 'READY',
    visibleInPicker: true,
    navigation: Object.freeze({ target: 'standards' }),
    applicability: () => ({ matched, reason: matched ? 'match' : 'no-match' }),
    guidancePackId: `${id}-pack`,
    ...overrides,
  };
}

test('two unrelated workflows register without changing core behavior', () => {
  const r = createWorkflowRegistry();
  r.register(workflow('alpha'));
  r.register(workflow('beta'));
  assert.deepEqual(r.list().map((w) => w.id), ['alpha', 'beta']);
});

test('select returns one match and fails closed on ambiguity', () => {
  const r = createWorkflowRegistry();
  const a = r.register(workflow('a', true));
  r.register(workflow('b', false));
  assert.deepEqual(r.select({}), { status: 'matched', workflow: a, matchIds: ['a'] });

  const r2 = createWorkflowRegistry();
  r2.register(workflow('a', true));
  r2.register(workflow('b', true));
  assert.deepEqual(r2.select({}), { status: 'ambiguous', workflow: null, matchIds: ['a', 'b'] });
});

test('registry rejects missing ids, duplicates, and malformed applicability', () => {
  const r = createWorkflowRegistry();
  assert.throws(() => r.register({}), /Workflow id is required/);
  r.register(workflow('one'));
  assert.throws(() => r.register(workflow('one')), /Duplicate workflow id/);
  assert.throws(() => r.register(workflow('bad', false, { applicability: null })), /applicability function/);
});
