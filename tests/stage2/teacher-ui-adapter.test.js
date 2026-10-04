'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { POWERTEACHER_STAGE2_UI_CONTRACT } = require('../../extension/src/platform/powerteacher/teacher-ui-contract.js');
const { readTeacherUiState } = require('../../extension/src/platform/powerteacher/teacher-ui-adapter.js');

function element({ text = '', value = '', visible = true, active = false } = {}) {
  const parent = active ? { classList: { contains: (name) => name === 'active' }, parentElement: null } : null;
  return {
    textContent: text,
    value,
    parentElement: parent,
    isConnected: true,
    getClientRects: () => visible ? [{}] : [],
  };
}

function fakeDocument({
  origin = 'https://vas.powerschool.com',
  pathname = '/teachers/index.html',
  grading = false,
  gradingActive = false,
  standardsNav = false,
  standardsSemantics = false,
  grid = false,
  gear = false,
  filter = 'absent',
  filterQuery = '',
  markerTexts = [],
  body = true,
} = {}) {
  const map = new Map();
  if (grading) map.set('#sidebar-charms-grading', element({ text: 'GRADING', active: gradingActive }));
  if (standardsNav) map.set('#grading-standards-link', element({ text: 'STANDARDS' }));
  if (standardsSemantics) map.set('#section-mega-menu', element({ text: 'STANDARDS' }));
  if (grid) map.set('#standard-final-grades', element({ visible: true }));
  if (gear) map.set('#special-functions', element({ visible: true }));
  if (filter !== 'absent') map.set('#simple-search-standard-final-grades', element({ visible: filter === 'visible', value: filterQuery }));
  const scope = map.get('#standard-final-grades');
  if (scope) {
    scope.querySelectorAll = () => markerTexts.map((text) => element({ text, visible: true }));
  }
  return {
    location: { origin, pathname },
    body: body ? { isConnected: true } : null,
    defaultView: {
      getComputedStyle: (el) => ({
        display: el.getClientRects().length ? 'block' : 'none',
        visibility: 'visible',
        opacity: '1',
      }),
    },
    querySelector: (selector) => map.get(selector) || null,
  };
}

test('normal Assignments page is platform-verified but not Standards-ready', () => {
  const state = readTeacherUiState(fakeDocument({ grading: true }), POWERTEACHER_STAGE2_UI_CONTRACT);
  assert.equal(state.platformVerified, true);
  assert.equal(state.sectionKey, 'unknown');
  assert.equal(state.targetView, 'other');
  assert.equal(state.gradingNavAvailable, true);
  assert.equal(state.standardsNavAvailable, false);
  assert.equal(state.filterVisible, 'unknown');
});

test('Grading state exposes Standards navigation without claiming active Standards view', () => {
  const state = readTeacherUiState(fakeDocument({ grading: true, gradingActive: true, standardsNav: true }), POWERTEACHER_STAGE2_UI_CONTRACT);
  assert.equal(state.targetView, 'other');
  assert.equal(state.gradingNavAvailable, true);
  assert.equal(state.standardsNavAvailable, true);
});

test('Standards active uses composite verified signals and reports hidden filter', () => {
  const state = readTeacherUiState(fakeDocument({
    grading: true, gradingActive: true, standardsNav: true, standardsSemantics: true, grid: true, gear: true, filter: 'hidden',
  }), POWERTEACHER_STAGE2_UI_CONTRACT);
  assert.equal(state.targetView, 'standards');
  assert.equal(state.settingsAvailable, true);
  assert.equal(state.filterVisible, false);
  assert.equal(state.filterQuery, '');
  assert.equal(state.workflowMarkerPresent, false);
  assert.equal(state.supportMountAvailable, true);
});

test('visible filter and MS1 semantic header are re-read from current DOM', () => {
  const hidden = fakeDocument({ grading: true, gradingActive: true, standardsSemantics: true, grid: true, filter: 'hidden' });
  const visible = fakeDocument({ grading: true, gradingActive: true, standardsSemantics: true, grid: true, filter: 'visible', filterQuery: 'MS1', markerTexts: ['MS1 Reading'] });
  assert.equal(readTeacherUiState(hidden, POWERTEACHER_STAGE2_UI_CONTRACT).filterVisible, false);
  const reread = readTeacherUiState(visible, POWERTEACHER_STAGE2_UI_CONTRACT);
  assert.equal(reread.filterVisible, true);
  assert.equal(reread.filterQuery, 'MS1');
  assert.equal(reread.workflowMarkerPresent, true);
});

test('missing critical target remains unknown instead of guessed', () => {
  const state = readTeacherUiState(fakeDocument({ grading: true, gradingActive: true, standardsSemantics: true, grid: false }), POWERTEACHER_STAGE2_UI_CONTRACT);
  assert.equal(state.targetView, 'unknown');
  assert.equal(state.workflowMarkerPresent, 'unknown');
  assert.ok(state.reasonCodes.includes('standards-grid-missing'));
});

test('invalid platform fails closed', () => {
  const state = readTeacherUiState(fakeDocument({ origin: 'https://example.com', grading: true }), POWERTEACHER_STAGE2_UI_CONTRACT);
  assert.equal(state.platformVerified, false);
  assert.equal(state.targetView, 'unknown');
  assert.ok(state.reasonCodes.includes('platform-unverified'));
});

test('adapter source is read-only: no click, native dispatch, or storage writes', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../extension/src/platform/powerteacher/teacher-ui-adapter.js'), 'utf8');
  assert.doesNotMatch(source, /\.click\s*\(/);
  assert.doesNotMatch(source, /dispatchEvent\s*\(/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|document\.cookie/);
});

test('ambiguous duplicate Standards grid fails closed', () => {
  const doc = fakeDocument({ grading: true, gradingActive: true, standardsSemantics: true, grid: true });
  const original = doc.querySelector;
  doc.querySelectorAll = (selector) => selector === '#standard-final-grades'
    ? [element({ visible: true }), element({ visible: true })]
    : (original(selector) ? [original(selector)] : []);
  const state = readTeacherUiState(doc, POWERTEACHER_STAGE2_UI_CONTRACT);
  assert.equal(state.targetView, 'unknown');
  assert.ok(state.reasonCodes.includes('standards-grid-ambiguous'));
});
