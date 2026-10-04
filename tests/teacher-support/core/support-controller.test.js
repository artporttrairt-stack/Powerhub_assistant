const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const CONTROLLER_PATH = path.resolve(__dirname, '../../../extension/modules/teacher-support/core/support-controller.js');
const RESOLVER_PATH = path.resolve(__dirname, '../../../extension/modules/teacher-support/core/state-resolver.js');
const REGISTRY_PATH = path.resolve(__dirname, '../../../extension/modules/teacher-support/core/workflow-registry.js');

function build({ decisionKind = 'context-unverified', requested = 'fake.second' } = {}) {
  const { createWorkflowRegistry } = require(REGISTRY_PATH);
  const { resolveSupportState } = require(RESOLVER_PATH);
  const { createSupportController } = require(CONTROLLER_PATH);
  const registry = createWorkflowRegistry();
  const calls = [];
  registry.register({
    id: 'fake.second',
    workflow: 'fake',
    availability(context) {
      return { matched: context.requestedPackId === requested, reason: 'explicit' };
    },
    decideWorkflow(args) {
      calls.push(args);
      return {
        kind: decisionKind,
        reason: `fake-${decisionKind}`,
        viewModel: { screen: decisionKind },
      };
    },
    getReferenceOptions() {
      return {
        areas: [{ id: 'area-one', title: 'Area One' }],
        levelCodes: ['L1', 'L2'],
        assistLanguages: ['A', 'B'],
        defaultAssistLanguage: 'A',
      };
    },
    getReference(args) {
      return { ...args, source: 'fake-pack' };
    },
  });
  return { controller: createSupportController({ registry, resolver: resolveSupportState }), calls };
}

test('controller returns DORMANT when no pack is available', () => {
  const { controller } = build();
  const result = controller.evaluate({ context: { requestedPackId: 'other' }, uiState: {}, mode: 'active' });
  assert.equal(result.state, 'DORMANT');
  assert.equal(result.packId, null);
  assert.equal(result.workflowDecision, null);
});

test('controller never turns availability into academic readiness by itself', () => {
  const { controller } = build({ decisionKind: 'context-unverified' });
  const result = controller.evaluate({
    context: { requestedPackId: 'fake.second', academicEligible: true },
    uiState: { platformVerified: true },
    mode: 'active',
  });
  assert.equal(result.selectionStatus, 'matched');
  assert.equal(result.packId, 'fake.second');
  assert.equal(result.state, 'CONTEXT_UNVERIFIED');
});

test('controller passes semantic state/context/mode to selected pack policy', () => {
  const { controller, calls } = build({ decisionKind: 'guidance' });
  const context = { requestedPackId: 'fake.second', epoch: 3 };
  const uiState = { platformVerified: true, standards: { verified: false } };
  const result = controller.evaluate({ context, uiState, mode: 'active' });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].context, context);
  assert.equal(calls[0].uiState, uiState);
  assert.equal(calls[0].mode, 'active');
  assert.equal(result.state, 'GUIDANCE');
  assert.deepEqual(result.viewModel, { screen: 'guidance' });
});

test('a fake second workflow reaches CONTEXT_READY without core changes', () => {
  const { controller } = build({ decisionKind: 'context-ready' });
  const result = controller.evaluate({ context: { requestedPackId: 'fake.second' }, uiState: {}, mode: 'active' });
  assert.equal(result.state, 'CONTEXT_READY');
});

test('controller exposes selected pack reference options without leaking the pack to runtime', () => {
  const { controller } = build();
  assert.deepEqual(controller.getReferenceOptions({ requestedPackId: 'fake.second' }), {
    areas: [{ id: 'area-one', title: 'Area One' }],
    levelCodes: ['L1', 'L2'],
    assistLanguages: ['A', 'B'],
    defaultAssistLanguage: 'A',
  });
  assert.equal(controller.getReferenceOptions({ requestedPackId: 'other' }), null);
});

test('controller resolves reference content through the selected pack only', () => {
  const { controller } = build();
  assert.deepEqual(controller.getReference({
    context: { requestedPackId: 'fake.second' },
    areaId: 'area-one',
    levelCode: 'L2',
    language: 'B',
    subject: 'demo',
  }), {
    areaId: 'area-one',
    levelCode: 'L2',
    language: 'B',
    subject: 'demo',
    source: 'fake-pack',
  });
  assert.equal(controller.getReference({
    context: { requestedPackId: 'other' },
    areaId: 'area-one',
    levelCode: 'L1',
  }), null);
});

test('generic core source contains no MS1 academic policy', () => {
  const source = fs.readFileSync(CONTROLLER_PATH, 'utf8') + '\n' + fs.readFileSync(RESOLVER_PATH, 'utf8');
  const forbidden = ['MS1-', 'Academic Achievement', 'MS1-TA-Grade', "'EE'", "'AE'", "'ME'", "'BE'", "'WB'", '#standard-final-grades'];
  for (const token of forbidden) assert.equal(source.includes(token), false, `generic core contains pack/platform token: ${token}`);
});
