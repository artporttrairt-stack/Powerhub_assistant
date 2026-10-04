'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createWorkflowRegistry } = require('../../extension/src/features/teacher-support/registry/workflow-registry.js');
const { resolveSupportState } = require('../../extension/src/features/teacher-support/state/support-state-resolver.js');
const { createSupportController } = require('../../extension/src/features/teacher-support/controller/support-controller.js');

function wf(id, { status = 'READY', visibleInPicker = true, matched = false, query = 'TARGET' } = {}) {
  return {
    id, version: '1.0.0', label: id, status, visibleInPicker,
    navigation: { targetView: 'standards', filterQuery: query },
    applicability: () => ({ matched, reason: 'fixture' }), guidancePackId: `${id}-pack`,
  };
}
function uiState(overrides = {}) { return { platformVerified: true, targetView: 'other', filterVisible: 'unknown', filterQuery: 'unknown', workflowMarkerPresent: 'unknown', ...overrides }; }
function uiSpy() { const calls = []; return { calls, replaceBars: (x) => calls.push(['replaceBars', x]), highlight: (x) => calls.push(['highlight', x]), collapse: () => calls.push(['collapse']), wake: () => calls.push(['wake']) }; }

function setup(...workflows) {
  const registry = createWorkflowRegistry(); workflows.forEach((x) => registry.register(x));
  const ui = uiSpy();
  return { registry, ui, controller: createSupportController({ registry, resolveState: resolveSupportState, ui }) };
}

test('workflow picker renders registry-visible workflows only', () => {
  const { controller } = setup(wf('ready'), wf('source', { status: 'SOURCE_REQUIRED' }), wf('hidden', { visibleInPicker: false }));
  const command = controller.showWorkflowPicker();
  assert.equal(command.type, 'SHOW_WORKFLOW_PICKER');
  assert.deepEqual(command.workflows.map((x) => x.id), ['ready']);
});

test('Continue from where I am resumes the uniquely applicable READY workflow', () => {
  const { controller } = setup(wf('pilot', { matched: true }));
  const command = controller.continueFromHere({ context: {}, uiState: uiState({ targetView: 'standards', filterVisible: false }), mode: 'guide' });
  assert.equal(command.type, 'SHOW_FILTER_CONTROL');
  assert.equal(command.workflowId, 'pilot');
});

test('selected READY workflow follows generic resolver commands', () => {
  const { controller } = setup(wf('pilot'));
  assert.equal(controller.selectWorkflow('pilot', { uiState: uiState(), context: {}, mode: 'guide' }).type, 'SHOW_NAVIGATION_TARGET');
  assert.equal(controller.selectWorkflow('pilot', { uiState: uiState({ targetView: 'standards', filterVisible: true, filterQuery: '' }), context: {}, mode: 'guide' }).type, 'SHOW_FILTER_QUERY');
  assert.equal(controller.selectWorkflow('pilot', { uiState: uiState({ targetView: 'standards', filterVisible: true, filterQuery: 'TARGET', workflowMarkerPresent: true }), context: {}, mode: 'guide' }).type, 'OPEN_TASK_PICKER');
});

test('Quick reference opens reference and I know already collapses', () => {
  const { controller, ui } = setup(wf('pilot'));
  assert.deepEqual(controller.quickReference(), { type: 'OPEN_REFERENCE' });
  assert.deepEqual(controller.knowAlready(), { type: 'COLLAPSE' });
  assert.deepEqual(ui.calls.at(-1), ['collapse']);
});

test('Show me highlights only and never invokes native target', () => {
  const { controller, ui } = setup(wf('pilot'));
  let clicks = 0; const target = { click() { clicks += 1; } };
  const command = controller.showMe(target);
  assert.equal(command.type, 'SHOW_NAVIGATION_TARGET');
  assert.equal(command.mode, 'highlight-only');
  assert.deepEqual(ui.calls.at(-1), ['highlight', target]);
  assert.equal(clicks, 0);
});

test('fake workflow works with unchanged controller', () => {
  const { controller } = setup(wf('future-grade7-music', { query: 'EOS' }));
  const command = controller.selectWorkflow('future-grade7-music', { uiState: uiState({ targetView: 'standards', filterVisible: true, filterQuery: 'EOS', workflowMarkerPresent: true }), context: {}, mode: 'guide' });
  assert.equal(command.type, 'OPEN_TASK_PICKER');
  assert.equal(command.workflowId, 'future-grade7-music');
});

test('unsupported workflow never enters workflow-specific guidance', () => {
  const { controller } = setup(wf('unsupported', { status: 'UNSUPPORTED', visibleInPicker: true, matched: true }));
  assert.equal(controller.selectWorkflow('unsupported', { uiState: uiState(), context: {}, mode: 'guide' }).type, 'SHOW_WORKFLOW_PICKER');
  assert.equal(controller.continueFromHere({ context: {}, uiState: uiState(), mode: 'guide' }).type, 'SHOW_WORKFLOW_PICKER');
});

test('controller source contains only semantic actions, no synthetic native actions or seed workflow names', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../extension/src/features/teacher-support/controller/support-controller.js'), 'utf8');
  assert.doesNotMatch(source, /\.click\s*\(|dispatchEvent\s*\(|localStorage|sessionStorage/);
  assert.doesNotMatch(source, /\bMS1\b|CAM Primary|Grade 7|Music|\bEOS\b/);
});
