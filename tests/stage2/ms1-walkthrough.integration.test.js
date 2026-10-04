'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createWorkflowRegistry } = require('../../extension/src/features/teacher-support/registry/workflow-registry.js');
const { resolveSupportState } = require('../../extension/src/features/teacher-support/state/support-state-resolver.js');
const { createSupportController } = require('../../extension/src/features/teacher-support/controller/support-controller.js');
const { CAM_PRIMARY_MS1_WORKFLOW } = require('../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/workflow.js');
const { matchesCamPrimaryMs1 } = require('../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/applicability.js');
const { createMs1GuidancePack } = require('../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/pack.js');

function context(overrides = {}) {
  return {
    platform: 'powerteacher', platformVerified: true,
    workflow: 'ms1', workflowVerified: true,
    department: { code: 'CAM', verified: true },
    division: { code: 'PRIMARY', verified: true },
    reportingContextVerified: true, sectionContextVerified: true, ambiguous: false,
    scale: { verified: true, codes: ['EE','AE','ME','BE','WB'] },
    ...overrides,
  };
}
function uiState(overrides = {}) {
  return {
    platformVerified: true, targetView: 'other', filterVisible: 'unknown',
    filterQuery: 'unknown', workflowMarkerPresent: 'unknown', reasonCodes: [],
    ...overrides,
  };
}
function setup() {
  const registry = createWorkflowRegistry();
  registry.register({ ...CAM_PRIMARY_MS1_WORKFLOW, applicability: matchesCamPrimaryMs1 });
  registry.register({
    id: 'future.hidden', version: '0', label: 'Future', status: 'SOURCE_REQUIRED', visibleInPicker: false,
    navigation: { targetView: 'standards', filterQuery: 'EOS' }, applicability: () => ({ matched: false }), guidancePackId: 'future',
  });
  const calls = [];
  const ui = { replaceBars: (x) => calls.push(['bars', x]), highlight: (x) => calls.push(['highlight', x]), collapse: () => calls.push(['collapse']) };
  return { registry, calls, controller: createSupportController({ registry, resolveState: resolveSupportState, ui }) };
}

test('entry from Assignments or Grading asks for navigation; already Standards skips it', () => {
  const { controller } = setup(); const c = context();
  assert.equal(controller.continueFromHere({ context: c, uiState: uiState(), mode: 'guide' }).type, 'SHOW_NAVIGATION_TARGET');
  assert.equal(controller.continueFromHere({ context: c, uiState: uiState({ gradingNavAvailable: true }), mode: 'guide' }).type, 'SHOW_NAVIGATION_TARGET');
  assert.equal(controller.continueFromHere({ context: c, uiState: uiState({ targetView: 'standards', filterVisible: false }), mode: 'guide' }).type, 'SHOW_FILTER_CONTROL');
});

test('filter-open and already-MS1 states resume at the first incomplete semantic step', () => {
  const { controller } = setup(); const c = context();
  assert.equal(controller.continueFromHere({ context: c, uiState: uiState({ targetView: 'standards', filterVisible: true, filterQuery: '' }), mode: 'guide' }).type, 'SHOW_FILTER_QUERY');
  assert.equal(controller.continueFromHere({ context: c, uiState: uiState({ targetView: 'standards', filterVisible: true, filterQuery: 'MS1', workflowMarkerPresent: true }), mode: 'guide' }).type, 'OPEN_TASK_PICKER');
});

test('unknown CAM context and stale section fail closed to picker', () => {
  const { controller } = setup();
  const unknown = context(); delete unknown.department;
  assert.equal(controller.continueFromHere({ context: unknown, uiState: uiState(), mode: 'guide' }).type, 'SHOW_WORKFLOW_PICKER');
  assert.equal(controller.continueFromHere({ context: context({ sectionContextVerified: false }), uiState: uiState(), mode: 'guide' }).type, 'SHOW_WORKFLOW_PICKER');
});

test('workflow picker exposes only real READY MS1 workflow', () => {
  const { controller } = setup();
  const command = controller.showWorkflowPicker();
  assert.deepEqual(command.workflows.map((x) => x.id), ['cam-primary.ms1']);
});

test('all 8 areas and all 5 levels are reachable with distinct official and interpretive layers', () => {
  const pack = createMs1GuidancePack();
  assert.equal(pack.listAreas().length, 8);
  for (const area of pack.listAreas()) {
    assert.equal(pack.getArea(area.key).levels.length, 5);
    for (const level of ['EE','AE','ME','BE','WB']) {
      const cell = pack.getLevel(area.key, level);
      assert.ok(cell.official.criterion);
      assert.ok(cell.plainExplanation.text.en);
      assert.equal(cell.official.sourceAuthority, 'official');
      assert.equal(cell.plainExplanation.interpretiveSourceId, 'cam-primary-ms1-interpretive');
      assert.equal(cell.teacherMakesFinalDecision, true);
    }
  }
});

test('comparison is reachable and subject overlay is optional', () => {
  const pack = createMs1GuidancePack();
  assert.equal(pack.compare('academic-achievement', 'ME').previous.code, 'AE');
  assert.ok(pack.getSubjectExample('academic-achievement', 'ME', 'english'));
  assert.equal(pack.getSubjectExample('academic-achievement', 'ME', 'art'), null);
});

test('collapse/wake workflow remains resumable without persisting native section ids', () => {
  const { controller, calls } = setup();
  assert.equal(controller.knowAlready().type, 'COLLAPSE');
  assert.deepEqual(calls.at(-1), ['collapse']);
  const resumed = controller.continueFromHere({ context: context(), uiState: uiState({ targetView: 'standards', filterVisible: true, filterQuery: 'MS1', workflowMarkerPresent: true }), mode: 'guide' });
  assert.equal(resumed.type, 'OPEN_TASK_PICKER');
});

test('integration path contains no native click/write or sensitive persistence', () => {
  const files = [
    '../../extension/src/features/teacher-support/controller/support-controller.js',
    '../../extension/src/platform/powerteacher/teacher-ui-adapter.js',
    '../../extension/src/features/teacher-support/ui/bubble-ui.js',
  ];
  const source = files.map((f) => fs.readFileSync(path.join(__dirname, f), 'utf8')).join('\n');
  assert.doesNotMatch(source, /\.click\s*\(|dispatchEvent\s*\(|localStorage|sessionStorage|document\.cookie/);
});
