'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveSupportState } = require('../../extension/src/features/teacher-support/state/support-state-resolver.js');

function workflow(overrides = {}) {
  return {
    id: 'fixture-workflow',
    navigation: { targetView: 'standards', filterQuery: 'TARGET' },
    ...overrides,
  };
}

function ui(overrides = {}) {
  return {
    platformVerified: true,
    targetView: 'other',
    filterVisible: 'unknown',
    filterQuery: 'unknown',
    workflowMarkerPresent: 'unknown',
    reasonCodes: [],
    ...overrides,
  };
}

test('default page requires navigation', () => {
  assert.equal(resolveSupportState({ workflow: workflow(), uiState: ui(), context: {}, mode: 'guide' }), 'NAVIGATION_REQUIRED');
});

test('Standards active skips early navigation and asks for filter when hidden', () => {
  assert.equal(resolveSupportState({ workflow: workflow(), uiState: ui({ targetView: 'standards', filterVisible: false }), context: {}, mode: 'guide' }), 'FILTER_REQUIRED');
});

test('visible filter with missing query requires filter query', () => {
  assert.equal(resolveSupportState({ workflow: workflow(), uiState: ui({ targetView: 'standards', filterVisible: true, filterQuery: '' }), context: {}, mode: 'guide' }), 'FILTER_QUERY_REQUIRED');
});

test('verified workflow marker reaches workflow context ready', () => {
  assert.equal(resolveSupportState({ workflow: workflow(), uiState: ui({ targetView: 'standards', filterVisible: true, filterQuery: 'TARGET', workflowMarkerPresent: true }), context: {}, mode: 'guide' }), 'WORKFLOW_CONTEXT_READY');
});

test('ambiguous or unverified context fails closed', () => {
  assert.equal(resolveSupportState({ workflow: workflow(), uiState: ui({ targetView: 'unknown', reasonCodes: ['standards-grid-ambiguous'] }), context: {}, mode: 'guide' }), 'UNVERIFIED');
  assert.equal(resolveSupportState({ workflow: workflow(), uiState: ui({ platformVerified: false }), context: {}, mode: 'guide' }), 'UNVERIFIED');
});

test('quiet mode wins without mutating workflow state', () => {
  assert.equal(resolveSupportState({ workflow: workflow(), uiState: ui(), context: {}, mode: 'quiet' }), 'QUIET');
});

test('fake non-MS1 workflow uses same resolver through metadata only', () => {
  const eos = workflow({ id: 'future-eos', navigation: { targetView: 'standards', filterQuery: 'EOS' } });
  assert.equal(resolveSupportState({ workflow: eos, uiState: ui({ targetView: 'standards', filterVisible: true, filterQuery: 'EOS', workflowMarkerPresent: true }), context: { grade: 7, subject: 'Music' }, mode: 'guide' }), 'WORKFLOW_CONTEXT_READY');
});

test('unknown filter or marker state never guesses readiness', () => {
  assert.equal(resolveSupportState({ workflow: workflow(), uiState: ui({ targetView: 'standards', filterVisible: 'unknown' }), context: {}, mode: 'guide' }), 'UNVERIFIED');
  assert.equal(resolveSupportState({ workflow: workflow(), uiState: ui({ targetView: 'standards', filterVisible: true, filterQuery: 'TARGET', workflowMarkerPresent: 'unknown' }), context: {}, mode: 'guide' }), 'UNVERIFIED');
});
