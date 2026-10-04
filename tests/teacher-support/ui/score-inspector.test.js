const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createFakeDocument } = require('../helpers/fake-dom.js');

const INSPECTOR_PATH = path.resolve(__dirname, '../../../extension/modules/teacher-support/ui/score-inspector.js');
const PANEL_PATH = path.resolve(__dirname, '../../../extension/modules/teacher-support/ui/assistant-panel.js');

function setup() {
  const document = createFakeDocument();
  const root = document.createElement('div');
  root.id = 'hub-assistant-teacher-support-root';
  document.body.appendChild(root);
  return { document, root };
}

function model(overrides = {}) {
  return {
    mode: 'contextual',
    officialTitle: 'Verified Strand',
    levelCodes: ['EE', 'AE', 'ME', 'BE', 'WB'],
    selectedReferenceLevel: null,
    assistLanguage: 'EN',
    assistLanguages: ['EN', 'VI'],
    officialCriterion: { criterion: 'Official criterion text.' },
    plainExplanation: { text: 'Plain explanation.' },
    evidence: ['Evidence one.'],
    checklist: ['Observation one?'],
    comparison: { text: 'Adjacent comparison.' },
    subjectExample: { textEn: 'Subject example.', textVi: 'Ví dụ môn học.' },
    teacherDecisionMessage: 'Use the evidence to compare levels. You make the final judgement.',
    ...overrides,
  };
}

function collectText(node) {
  const parts = [node.textContent || ''];
  for (const child of node.children || []) parts.push(collectText(child));
  return parts.join(' ');
}

test('contextual inspector shows verified title and reference levels without a default selection', () => {
  const { createScoreInspector } = require(INSPECTOR_PATH);
  const { document, root } = setup();
  const intents = [];
  const inspector = createScoreInspector({ document, root, onIntent: (intent) => intents.push(intent) });

  inspector.render(model());

  assert.equal(root.querySelector('.ha-ts-inspector-title').textContent, 'Verified Strand');
  const levels = root.querySelectorAll('[data-reference-level]');
  assert.deepEqual(levels.map((node) => node.textContent), ['EE', 'AE', 'ME', 'BE', 'WB']);
  assert.ok(levels.every((node) => node.getAttribute('aria-pressed') === 'false'));
  assert.equal(root.querySelector('.ha-ts-area-picker'), null);

  levels[0].dispatchEvent({ type: 'click' });
  assert.deepEqual(intents, [{ type: 'reference-level', value: 'EE' }]);
});

test('content ladder renders in the required order and never adds recommendation language', () => {
  const { createScoreInspector } = require(INSPECTOR_PATH);
  const { document, root } = setup();
  const inspector = createScoreInspector({ document, root, onIntent: () => {} });

  inspector.render(model());

  const steps = root.querySelectorAll('[data-content-step]').map((node) => node.getAttribute('data-content-step'));
  assert.deepEqual(steps, [
    'official',
    'explanation',
    'evidence',
    'observation',
    'subject-example',
    'comparison',
    'decision',
  ]);

  const text = collectText(root);
  for (const forbidden of ['Recommended grade', 'Hub thinks', 'confidence %', 'scoring formula']) {
    assert.equal(text.includes(forbidden), false, forbidden);
  }
});

test('assist language changes only after an explicit support intent', () => {
  const { createScoreInspector } = require(INSPECTOR_PATH);
  const { document, root } = setup();
  const intents = [];
  const inspector = createScoreInspector({ document, root, onIntent: (intent) => intents.push(intent) });

  inspector.render(model());
  const languages = root.querySelectorAll('[data-assist-language]');
  assert.deepEqual(languages.map((node) => node.textContent), ['EN', 'VI']);
  assert.equal(languages[0].getAttribute('aria-pressed'), 'true');
  assert.equal(languages[1].getAttribute('aria-pressed'), 'false');

  languages[1].dispatchEvent({ type: 'click' });
  assert.deepEqual(intents, [{ type: 'assist-language', value: 'VI' }]);
  assert.equal(languages[0].getAttribute('aria-pressed'), 'true');
});

test('unknown subject renders no borrowed subject example', () => {
  const { createScoreInspector } = require(INSPECTOR_PATH);
  const { document, root } = setup();
  const inspector = createScoreInspector({ document, root, onIntent: () => {} });

  inspector.render(model({ subjectExample: null }));

  assert.equal(root.querySelector('[data-content-step="subject-example"]'), null);
});

test('quick reference is visibly reference-only and emits only Hub reference intents', () => {
  const { createScoreInspector } = require(INSPECTOR_PATH);
  const { document, root } = setup();
  const intents = [];
  const inspector = createScoreInspector({ document, root, onIntent: (intent) => intents.push(intent) });

  inspector.render(model({
    mode: 'reference',
    referenceOnlyLabel: 'Reference only',
    officialTitle: 'Reference area',
  }));

  assert.equal(root.querySelector('.ha-ts-reference-only').textContent, 'Reference only');
  root.querySelectorAll('[data-reference-level]')[2].dispatchEvent({ type: 'click' });
  assert.deepEqual(intents, [{ type: 'reference-level', value: 'ME' }]);
});

test('target hint renders only from a supplied rectangle and can be cleared', () => {
  const { createAssistantPanel } = require(PANEL_PATH);
  const { document, root } = setup();
  const panel = createAssistantPanel({ document, root, assetUrl: 'robot.png', onIntent: () => {} });

  panel.renderTargetHint({ top: 10, left: 20, width: 100, height: 30 });
  const hint = root.querySelector('#hub-assistant-teacher-support-target-hint');
  assert.ok(hint);
  assert.equal(hint.style.top, '10px');
  assert.equal(hint.style.left, '20px');
  assert.equal(hint.style.width, '100px');
  assert.equal(hint.style.height, '30px');

  panel.clearTargetHint();
  assert.equal(root.querySelector('#hub-assistant-teacher-support-target-hint'), null);
});

test('generic inspector and panel source contain no platform mutation or MS1 academic policy', () => {
  const source = fs.readFileSync(INSPECTOR_PATH, 'utf8') + '\n' + fs.readFileSync(PANEL_PATH, 'utf8');
  for (const forbidden of [
    'MS1-',
    'Academic Achievement',
    'MS1-TA-Grade',
    '#standard-final-grades',
    'navigator.language',
    'localStorage',
    'chrome.storage',
    'scrollIntoView',
    '.click(',
    'dispatchEvent(',
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});

test('reset and destroy remove inspector-owned presentation state', () => {
  const { createScoreInspector } = require(INSPECTOR_PATH);
  const { document, root } = setup();
  const inspector = createScoreInspector({ document, root, onIntent: () => {} });
  inspector.render(model());
  assert.ok(root.querySelector('#hub-assistant-teacher-support-inspector'));

  inspector.reset();
  assert.equal(root.querySelector('#hub-assistant-teacher-support-inspector').hidden, true);

  inspector.destroy();
  assert.equal(root.querySelector('#hub-assistant-teacher-support-inspector'), null);
});
