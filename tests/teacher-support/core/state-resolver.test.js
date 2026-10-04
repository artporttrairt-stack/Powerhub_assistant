const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const MODULE_PATH = path.resolve(__dirname, '../../../extension/modules/teacher-support/core/state-resolver.js');

function selection(status, pack = null) {
  return { status, pack, matchIds: pack ? [pack.id] : [] };
}

test('no pack match resolves to DORMANT', () => {
  const { resolveSupportState } = require(MODULE_PATH);
  assert.deepEqual(
    resolveSupportState({ selection: selection('none'), workflowDecision: null, mode: 'active' }),
    { state: 'DORMANT', reason: 'no-workflow' }
  );
});

test('ambiguous pack selection resolves to AMBIGUOUS', () => {
  const { resolveSupportState } = require(MODULE_PATH);
  assert.deepEqual(
    resolveSupportState({ selection: { status: 'ambiguous', pack: null, matchIds: ['a', 'b'] }, workflowDecision: null, mode: 'active' }),
    { state: 'AMBIGUOUS', reason: 'ambiguous-workflow' }
  );
});

test('quiet and stopped modes override matched workflow presentation', () => {
  const { resolveSupportState } = require(MODULE_PATH);
  const matched = selection('matched', { id: 'fake.one' });
  assert.equal(resolveSupportState({ selection: matched, workflowDecision: { kind: 'context-ready' }, mode: 'quiet' }).state, 'QUIET');
  assert.equal(resolveSupportState({ selection: matched, workflowDecision: { kind: 'context-ready' }, mode: 'stopped' }).state, 'STOPPED');
});

test('pack decisions map to generic support states', () => {
  const { resolveSupportState } = require(MODULE_PATH);
  const matched = selection('matched', { id: 'fake.one' });
  const cases = [
    ['reference', 'REFERENCE'],
    ['guidance', 'GUIDANCE'],
    ['context-unverified', 'CONTEXT_UNVERIFIED'],
    ['context-ready', 'CONTEXT_READY'],
  ];
  for (const [kind, expected] of cases) {
    assert.equal(resolveSupportState({ selection: matched, workflowDecision: { kind }, mode: 'active' }).state, expected);
  }
});
