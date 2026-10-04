const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createFakeDocument } = require('../helpers/fake-dom.js');

const ENTRY_PATH = path.resolve(__dirname, '../../../extension/modules/teacher-support/ui/entry-button.js');
const PANEL_PATH = path.resolve(__dirname, '../../../extension/modules/teacher-support/ui/assistant-panel.js');
const CSS_PATH = path.resolve(__dirname, '../../../extension/modules/teacher-support/ui/teacher-support.css');

function setup() {
  const document = createFakeDocument();
  const root = document.createElement('div');
  root.id = 'hub-assistant-teacher-support-root';
  document.body.appendChild(root);
  return { document, root };
}

test('entry is one semantic keyboard-focusable button inside the owned root', () => {
  const { createEntryButton } = require(ENTRY_PATH);
  const { document, root } = setup();
  const intents = [];
  const entry = createEntryButton({ document, root, onIntent: (intent) => intents.push(intent) });

  entry.render({ visible: true, attention: true, reducedMotion: false, label: 'Teacher Support' });
  entry.render({ visible: true, attention: true, reducedMotion: false, label: 'Teacher Support' });

  const nodes = root.querySelectorAll('#hub-assistant-teacher-support-entry');
  assert.equal(nodes.length, 1);
  assert.equal(nodes[0].tagName, 'BUTTON');
  assert.equal(nodes[0].getAttribute('aria-label'), 'Teacher Support');
  assert.equal(nodes[0].classList.contains('ha-ts-attention'), true);
});

test('first-entry attention is consumed on interaction and never restarts on rerender', () => {
  const { createEntryButton } = require(ENTRY_PATH);
  const { document, root } = setup();
  const intents = [];
  const entry = createEntryButton({ document, root, onIntent: (intent) => intents.push(intent) });

  entry.render({ visible: true, attention: true, reducedMotion: false, label: 'Teacher Support' });
  const button = root.querySelector('#hub-assistant-teacher-support-entry');
  button.dispatchEvent({ type: 'click' });
  assert.deepEqual(intents, ['open']);
  assert.equal(button.classList.contains('ha-ts-attention'), false);

  entry.render({ visible: true, attention: true, reducedMotion: false, label: 'Teacher Support' });
  assert.equal(button.classList.contains('ha-ts-attention'), false);
});

test('reduced-motion entry never applies movement attention class', () => {
  const { createEntryButton } = require(ENTRY_PATH);
  const { document, root } = setup();
  const entry = createEntryButton({ document, root, onIntent: () => {} });
  entry.render({ visible: true, attention: true, reducedMotion: true, label: 'Teacher Support' });
  assert.equal(root.querySelector('#hub-assistant-teacher-support-entry').classList.contains('ha-ts-attention'), false);
});

test('panel actions emit semantic intents only', () => {
  const { createAssistantPanel } = require(PANEL_PATH);
  const { document, root } = setup();
  const intents = [];
  const panel = createAssistantPanel({
    document,
    root,
    assetUrl: 'chrome-extension://test/assets/robot-assistant.png',
    onIntent: (intent) => intents.push(intent),
  });

  panel.render({
    open: true,
    title: 'How can I help?',
    message: 'Choose a safe next step.',
    robotVisible: true,
    actions: [
      { intent: 'guide', label: 'Guide me' },
      { intent: 'reference', label: 'Quick reference' },
    ],
  });

  root.querySelector('[data-intent="guide"]').dispatchEvent({ type: 'click' });
  root.querySelector('[data-intent="reference"]').dispatchEvent({ type: 'click' });
  assert.deepEqual(intents, ['guide', 'reference']);
});

test('Escape closes panel and returns focus to entry when focus is inside panel', () => {
  const { createEntryButton } = require(ENTRY_PATH);
  const { createAssistantPanel } = require(PANEL_PATH);
  const { document, root } = setup();
  const intents = [];
  const entry = createEntryButton({ document, root, onIntent: (intent) => intents.push(intent) });
  entry.render({ visible: true, attention: false, reducedMotion: false, label: 'Teacher Support' });

  const panel = createAssistantPanel({ document, root, assetUrl: 'robot.png', onIntent: (intent) => intents.push(intent) });
  panel.render({
    open: true,
    title: 'Support',
    message: 'Message',
    robotVisible: true,
    actions: [{ intent: 'guide', label: 'Guide me' }],
  });

  const action = root.querySelector('[data-intent="guide"]');
  action.focus();
  root.querySelector('#hub-assistant-teacher-support-panel').dispatchEvent({ type: 'keydown', key: 'Escape' });

  assert.equal(intents.at(-1), 'close');
  assert.equal(document.activeElement, root.querySelector('#hub-assistant-teacher-support-entry'));
});

test('robot image failure leaves panel text and actions usable', () => {
  const { createAssistantPanel } = require(PANEL_PATH);
  const { document, root } = setup();
  const panel = createAssistantPanel({ document, root, assetUrl: 'missing.png', onIntent: () => {} });
  panel.render({
    open: true,
    title: 'Support',
    message: 'Text remains available.',
    robotVisible: true,
    actions: [{ intent: 'guide', label: 'Guide me' }],
  });

  const img = root.querySelector('.ha-ts-robot');
  img.dispatchEvent({ type: 'error' });
  assert.equal(img.hidden, true);
  assert.equal(root.querySelector('.ha-ts-panel-message').textContent, 'Text remains available.');
  assert.ok(root.querySelector('[data-intent="guide"]'));
});

test('generic UI source contains no MS1 academic policy', () => {
  const source = fs.readFileSync(ENTRY_PATH, 'utf8') + '\n' + fs.readFileSync(PANEL_PATH, 'utf8');
  for (const token of ['MS1-', 'Academic Achievement', 'MS1-TA-Grade', 'EE', 'AE', 'ME', 'BE', 'WB', '#standard-final-grades']) {
    assert.equal(source.includes(token), false, token);
  }
});

test('CSS contains finite motion, focus visibility, and reduced-motion override', () => {
  const css = fs.readFileSync(CSS_PATH, 'utf8');
  assert.match(css, /\.ha-ts-attention/);
  assert.match(css, /\.ha-ts-robot-bounce/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.equal(/\binfinite\b/i.test(css), false);
});


test('robot bounce is applied only on a closed-to-open panel transition', () => {
  const { createAssistantPanel } = require(PANEL_PATH);
  const { document, root } = setup();
  const panel = createAssistantPanel({ document, root, assetUrl: 'robot.png', onIntent: () => {} });
  const model = {
    open: true,
    title: 'Support',
    message: 'Message',
    robotVisible: true,
    reducedMotion: false,
    actions: [{ intent: 'guide', label: 'Guide me' }],
  };

  panel.render(model);
  assert.equal(root.querySelector('.ha-ts-robot').classList.contains('ha-ts-robot-bounce'), true);

  panel.render(model);
  assert.equal(root.querySelector('.ha-ts-robot').classList.contains('ha-ts-robot-bounce'), false);

  panel.close();
  panel.render(model);
  assert.equal(root.querySelector('.ha-ts-robot').classList.contains('ha-ts-robot-bounce'), true);

  panel.close();
  panel.render({ ...model, reducedMotion: true });
  assert.equal(root.querySelector('.ha-ts-robot').classList.contains('ha-ts-robot-bounce'), false);
});

test('panel CSS provides an opaque readable card surface', () => {
  const css = fs.readFileSync(CSS_PATH, 'utf8');
  assert.match(css, /\.ha-ts-panel[\s\S]*background:/);
  assert.match(css, /\.ha-ts-panel[\s\S]*box-shadow:/);
});
