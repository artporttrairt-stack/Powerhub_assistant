'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const CONTRACT_MODULE = path.join(__dirname, '../../extension/src/platform/powerteacher/teacher-ui-contract.js');

test('Task 1 provides a dedicated PowerTeacher UI contract module', () => {
  assert.equal(fs.existsSync(CONTRACT_MODULE), true, 'teacher-ui-contract.js must exist');
});

const REQUIRED_ITEMS = [
  'gradingNavigation',
  'standardsNavigation',
  'activeStandardsView',
  'standardsGear',
  'filterToggle',
  'filterInput',
  'ms1ResultMarker',
  'supportMountHost',
  'navigationSignals',
];

test('contract exposes every Task 1 item with an explicit evidence status', () => {
  const { EVIDENCE_STATUS, POWERTEACHER_STAGE2_UI_CONTRACT } = require(CONTRACT_MODULE);
  assert.deepEqual(EVIDENCE_STATUS, {
    LIVE_READ_ONLY_VERIFIED: 'LIVE_READ_ONLY_VERIFIED',
    HELP_VERIFIED: 'HELP_VERIFIED',
    UNVERIFIED: 'UNVERIFIED',
  });
  for (const key of REQUIRED_ITEMS) {
    assert.ok(POWERTEACHER_STAGE2_UI_CONTRACT.items[key], `missing contract item: ${key}`);
    assert.ok(
      Object.values(EVIDENCE_STATUS).includes(POWERTEACHER_STAGE2_UI_CONTRACT.items[key].evidenceStatus),
      `invalid evidence status for ${key}`,
    );
  }
  assert.equal(Object.isFrozen(POWERTEACHER_STAGE2_UI_CONTRACT), true);
  assert.equal(Object.isFrozen(POWERTEACHER_STAGE2_UI_CONTRACT.items), true);
});

test('verified selectors and state rules match the G0 live evidence exactly', () => {
  const { POWERTEACHER_STAGE2_UI_CONTRACT } = require(CONTRACT_MODULE);
  const items = POWERTEACHER_STAGE2_UI_CONTRACT.items;

  assert.equal(items.gradingNavigation.selector, '#sidebar-charms-grading');
  assert.equal(items.standardsNavigation.selector, '#grading-standards-link');

  assert.equal(items.activeStandardsView.gradingSelector, '#sidebar-charms-grading');
  assert.equal(items.activeStandardsView.megaMenuSelector, '#section-mega-menu');
  assert.equal(items.activeStandardsView.gridSelector, '#standard-final-grades');
  assert.equal(items.activeStandardsView.requiresGradingActive, true);
  assert.equal(items.activeStandardsView.requiresStandardsSemantics, true);
  assert.equal(items.activeStandardsView.requiresGridComputedVisible, true);
  assert.equal(items.activeStandardsView.routeFamilyAloneIsSufficient, false);

  assert.equal(items.standardsGear.selector, '#special-functions');
  assert.equal(items.filterToggle.selector, '#hide-filter');
  assert.equal(items.filterToggle.stateSource, 'semantic-label');
  assert.deepEqual(items.filterToggle.states, ['Show Filter', 'Hide Filter']);

  assert.equal(items.filterInput.selector, '#simple-search-standard-final-grades');
  assert.equal(items.filterInput.stateSource, 'computed-visibility');
  assert.equal(items.filterInput.presenceAloneIsSufficient, false);

  assert.equal(items.ms1ResultMarker.scopeSelector, '#standard-final-grades');
  assert.equal(items.ms1ResultMarker.candidateSelector, 'th.standard-column-header.standard-col');
  assert.equal(items.ms1ResultMarker.semanticText, 'MS1');
  assert.equal(items.ms1ResultMarker.minComputedVisibleMatches, 8);
  assert.equal(items.ms1ResultMarker.maxComputedVisibleMatches, 8);
  assert.deepEqual(items.ms1ResultMarker.requiredSemanticIdentifiers, [
    'MS1-Academic',
    'MS1-Attitude',
    'MS1-Behaviour',
    'MS1-Classwork',
    'MS1-Communication',
    'MS1-Collaboratively',
    'MS1-Creativity',
    'MS1-Equipment',
  ]);
  assert.equal(items.currentCourseLabel.selector, '.course-name');
  assert.equal(items.ms1ResultMarker.requiresStabilizationReread, true);

  assert.equal(items.supportMountHost.host, 'document.body');
  assert.equal(items.supportMountHost.directChild, true);
  assert.equal(items.supportMountHost.extensionOwnedRoot, true);
  assert.equal(items.supportMountHost.hostStabilityOnly, true);
  assert.equal(items.supportMountHost.implementationSmokeRequired, true);

  assert.deepEqual(items.navigationSignals.events, ['hashchange', 'popstate']);
  assert.equal(items.navigationSignals.invalidateStaleContext, true);
  assert.equal(items.navigationSignals.persistRawSectionIds, false);
});

test('contract contains none of the selectors or state assumptions rejected by G0', () => {
  const { POWERTEACHER_STAGE2_UI_CONTRACT } = require(CONTRACT_MODULE);
  const serialized = JSON.stringify(POWERTEACHER_STAGE2_UI_CONTRACT);
  for (const rejected of [
    '#filter-standards',
    '#show-filter',
    '.filter-bar.collapsed',
    '#sidebar-charms-settings',
    'standard-color-',
  ]) {
    assert.equal(serialized.includes(rejected), false, `rejected contract leaked: ${rejected}`);
  }
  assert.equal(/#standard-\d+/.test(serialized), false, 'numeric standard IDs must not be contracts');
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('critical contract evaluation fails closed on UNVERIFIED or incomplete evidence', () => {
  const {
    EVIDENCE_STATUS,
    POWERTEACHER_STAGE2_UI_CONTRACT,
    evaluatePowerTeacherUiContract,
  } = require(CONTRACT_MODULE);

  assert.deepEqual(evaluatePowerTeacherUiContract(POWERTEACHER_STAGE2_UI_CONTRACT), {
    ready: true,
    reasonCodes: [],
  });

  const unverified = clone(POWERTEACHER_STAGE2_UI_CONTRACT);
  unverified.items.filterInput.evidenceStatus = EVIDENCE_STATUS.UNVERIFIED;
  assert.deepEqual(evaluatePowerTeacherUiContract(unverified), {
    ready: false,
    reasonCodes: ['critical-unverified:filterInput'],
  });

  const missingSelector = clone(POWERTEACHER_STAGE2_UI_CONTRACT);
  delete missingSelector.items.standardsGear.selector;
  assert.deepEqual(evaluatePowerTeacherUiContract(missingSelector), {
    ready: false,
    reasonCodes: ['critical-contract-incomplete:standardsGear'],
  });

  const missingMarkerSelector = clone(POWERTEACHER_STAGE2_UI_CONTRACT);
  missingMarkerSelector.items.ms1ResultMarker.candidateSelector = '';
  assert.deepEqual(evaluatePowerTeacherUiContract(missingMarkerSelector), {
    ready: false,
    reasonCodes: ['critical-contract-incomplete:ms1ResultMarker'],
  });
});

test('teacher-control policy never authorizes synthetic native actions', () => {
  const { POWERTEACHER_STAGE2_UI_CONTRACT } = require(CONTRACT_MODULE);
  const policy = POWERTEACHER_STAGE2_UI_CONTRACT.teacherControlPolicy;
  assert.equal(policy.showMe, 'highlight-only');
  assert.equal(policy.syntheticNativeActionsAllowed, false);
  assert.deepEqual(policy.neverAutomate, [
    'grade',
    'fill',
    'save',
    'publish',
    'send',
    'write-comments',
    'toggle-flags',
    'undo-revert',
    'recalculate-final-grades',
    'revert-grades-to-calculated',
    'click-standards-gear',
    'click-show-hide-filter',
    'click-apply-clear',
    'dispatch-synthetic-native-actions',
  ]);
});

const CONTRACT_DOC = path.join(__dirname, '../../docs/teacher-support/POWERTEACHER_STAGE2_UI_CONTRACT.md');

test('Task 1 documentation records evidence classification, verified rules, and rejected assumptions', () => {
  assert.equal(fs.existsSync(CONTRACT_DOC), true, 'POWERTEACHER_STAGE2_UI_CONTRACT.md must exist');
  if (!fs.existsSync(CONTRACT_DOC)) return;
  const doc = fs.readFileSync(CONTRACT_DOC, 'utf8');
  for (const required of [
    'LIVE_READ_ONLY_VERIFIED',
    'HELP_VERIFIED',
    'UNVERIFIED',
    '#sidebar-charms-grading',
    '#grading-standards-link',
    '#section-mega-menu',
    '#standard-final-grades',
    '#special-functions',
    '#hide-filter',
    '#simple-search-standard-final-grades',
    'th.standard-column-header.standard-col',
    'all 8 MS1 strands',
    'MS1-Academic',
    'MS1 - Academic Achievement',
    'MS1 text alone is insufficient',
    'document.body',
    'hashchange',
    'popstate',
    'Show me = highlight only',
  ]) {
    assert.ok(doc.includes(required), `missing documented contract: ${required}`);
  }
  for (const rejected of [
    '#filter-standards',
    '#show-filter',
    '.filter-bar.collapsed',
    '#sidebar-charms-settings',
    'standard-color-*',
    'numeric standard-* IDs',
  ]) {
    assert.ok(doc.includes(rejected), `missing rejected assumption: ${rejected}`);
  }
});
