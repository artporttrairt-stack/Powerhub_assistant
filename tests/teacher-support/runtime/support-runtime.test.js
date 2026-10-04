const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createFakeDocument } = require('../helpers/fake-dom.js');

const RUNTIME_PATH = path.resolve(__dirname, '../../../extension/modules/teacher-support/runtime/support-runtime.js');
const REGISTRY_PATH = path.resolve(__dirname, '../../../extension/modules/teacher-support/core/workflow-registry.js');
const RESOLVER_PATH = path.resolve(__dirname, '../../../extension/modules/teacher-support/core/state-resolver.js');
const CONTROLLER_PATH = path.resolve(__dirname, '../../../extension/modules/teacher-support/core/support-controller.js');
const PACK_PATH = path.resolve(__dirname, '../../../extension/modules/teacher-support/packs/cam-primary/ms1/index.js');

class FakeWindow {
  constructor() {
    this.listeners = new Map();
    this.microtasks = [];
    this.location = {
      origin: 'https://vas.powerschool.com',
      pathname: '/teachers/index.html',
      hash: '#/classes/final_grades',
    };
  }

  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(handler);
  }

  removeEventListener(type, handler) {
    const set = this.listeners.get(type);
    if (set) set.delete(handler);
  }

  dispatch(type) {
    const handlers = this.listeners.get(type);
    if (handlers) for (const handler of [...handlers]) handler({ type });
  }

  listenerCount(type) {
    const set = this.listeners.get(type);
    return set ? set.size : 0;
  }

  queueMicrotask(fn) {
    this.microtasks.push(fn);
  }

  flushMicrotasks() {
    while (this.microtasks.length) this.microtasks.shift()();
  }

  matchMedia() {
    return { matches: false };
  }
}

function baseUi(overrides = {}) {
  return {
    platformVerified: true,
    routePath: '/classes/final_grades',
    courseLabel: '2L7I English',
    grading: { available: true, active: true },
    standards: { available: true, verified: true, gridCount: 1, gearVisible: true },
    filter: { visible: true, value: 'MS1', toggleLabel: 'Hide Filter' },
    renderedHeaders: [
      { standardPosition: 0, text: 'MS1-Academic', title: 'MS1 - Academic Achievement', ariaLabel: '' },
    ],
    selectedCell: { found: true, standardPosition: 0 },
    scale: { codes: ['EE', 'AE', 'ME', 'BE', 'WB'] },
    nativeInspectorOpen: true,
    ...overrides,
  };
}

function createUiSpies() {
  const calls = {
    entry: [],
    panel: [],
    inspector: [],
    hints: [],
    panelClose: 0,
    panelClearHint: 0,
    inspectorReset: 0,
    destroyed: [],
  };
  let onIntent = null;

  return {
    calls,
    emit(intent) {
      if (!onIntent) throw new Error('UI intent handler is not bound.');
      onIntent(intent);
    },
    factories: {
      createEntryButton({ onIntent: handler }) {
        onIntent = handler;
        return {
          render(model) { calls.entry.push(model); },
          focus() {},
          destroy() { calls.destroyed.push('entry'); },
        };
      },
      createAssistantPanel({ onIntent: handler }) {
        onIntent = handler;
        return {
          render(model) { calls.panel.push(model); },
          focusInitial() {},
          close() { calls.panelClose += 1; },
          renderTargetHint(rect) { calls.hints.push({ ...rect }); },
          clearTargetHint() { calls.panelClearHint += 1; },
          destroy() { calls.destroyed.push('panel'); },
        };
      },
      createScoreInspector({ onIntent: handler }) {
        onIntent = handler;
        return {
          render(model) { calls.inspector.push(model); },
          reset() { calls.inspectorReset += 1; },
          destroy() { calls.destroyed.push('inspector'); },
        };
      },
    },
  };
}

function build({ initialUi = baseUi(), grid = null } = {}) {
  const { createSupportRuntime } = require(RUNTIME_PATH);
  const { createWorkflowRegistry } = require(REGISTRY_PATH);
  const { resolveSupportState } = require(RESOLVER_PATH);
  const { createSupportController } = require(CONTROLLER_PATH);
  const { createCamPrimaryMs1Pack } = require(PACK_PATH);

  const document = createFakeDocument();
  const window = new FakeWindow();
  const ui = createUiSpies();
  const registry = createWorkflowRegistry();
  registry.register(createCamPrimaryMs1Pack());
  const controller = createSupportController({ registry, resolver: resolveSupportState });

  let currentUi = initialUi;
  let currentGrid = grid;
  let readCount = 0;
  const nativeTargets = new Map();

  const adapter = {
    readTeacherUiState() {
      readCount += 1;
      return currentUi;
    },
    getNativeTarget(key) {
      return nativeTargets.get(key) || null;
    },
    getVerifiedStandardsGrid() {
      return currentGrid;
    },
    classifyNativeInteraction(target) {
      return target && target.isStandardCell ? { kind: 'standard-cell' } : { kind: 'other' };
    },
  };

  const runtime = createSupportRuntime({
    window,
    document,
    adapter,
    controller,
    ui: ui.factories,
    contextProvider: () => ({ requestedPackId: 'cam-primary.ms1', subject: 'English' }),
    assetUrl: 'robot.png',
  });

  return {
    runtime,
    window,
    document,
    ui,
    adapter,
    nativeTargets,
    get readCount() { return readCount; },
    setUi(value) { currentUi = value; },
    setGrid(value) { currentGrid = value; },
  };
}

test('wrong platform does not mount runtime UI or listeners', () => {
  const env = build({ initialUi: baseUi({ platformVerified: false }) });
  const snapshot = env.runtime.start();
  assert.equal(snapshot.started, false);
  assert.equal(env.document.querySelector('#hub-assistant-teacher-support-root'), null);
  assert.equal(env.window.listenerCount('hashchange'), 0);
  assert.equal(env.window.listenerCount('popstate'), 0);
});

test('start is idempotent and destroy removes one owned lifecycle boundary', () => {
  const env = build();
  env.runtime.start();
  env.runtime.start();
  env.runtime.reconcile('explicit');

  assert.equal(env.document.querySelectorAll('#hub-assistant-teacher-support-root').length, 1);
  assert.equal(env.window.listenerCount('hashchange'), 1);
  assert.equal(env.window.listenerCount('popstate'), 1);

  const stopped = env.runtime.destroy();
  assert.equal(stopped.started, false);
  assert.equal(stopped.state, 'STOPPED');
  assert.equal(env.document.querySelector('#hub-assistant-teacher-support-root'), null);
  assert.equal(env.window.listenerCount('hashchange'), 0);
  assert.equal(env.window.listenerCount('popstate'), 0);
  assert.deepEqual(env.ui.calls.destroyed.sort(), ['entry', 'inspector', 'panel']);
});

test('teacher-led walkthrough follows pack-produced states and show-target only highlights', () => {
  const env = build({
    initialUi: baseUi({
      grading: { available: true, active: false },
      standards: { available: false, verified: false, gridCount: 0, gearVisible: false },
      filter: { visible: false, value: '', toggleLabel: 'Show Filter' },
      renderedHeaders: [],
      selectedCell: { found: false, standardPosition: null },
      scale: { codes: [] },
      nativeInspectorOpen: false,
    }),
  });
  const target = env.document.createElement('button');
  let rectReads = 0;
  target.getBoundingClientRect = () => {
    rectReads += 1;
    return { top: 1, left: 2, width: 30, height: 40 };
  };
  env.nativeTargets.set('grading-nav', target);

  env.runtime.start();
  env.ui.emit('open');
  assert.equal(env.runtime.snapshot().state, 'GUIDANCE');
  assert.equal(env.ui.calls.panel.at(-1).stepId, 'open-grading');

  env.ui.emit('show-target');
  assert.equal(rectReads, 1);
  assert.deepEqual(env.ui.calls.hints.at(-1), { top: 1, left: 2, width: 30, height: 40 });

  env.setUi(baseUi({
    standards: { available: true, verified: false, gridCount: 0, gearVisible: false },
    filter: { visible: false, value: '', toggleLabel: 'Show Filter' },
    renderedHeaders: [],
    selectedCell: { found: false, standardPosition: null },
    scale: { codes: [] },
    nativeInspectorOpen: false,
  }));
  env.ui.emit('resume');
  assert.equal(env.ui.calls.panel.at(-1).stepId, 'open-standards');

  env.setUi(baseUi({
    filter: { visible: false, value: '', toggleLabel: 'Show Filter' },
    renderedHeaders: [],
    selectedCell: { found: false, standardPosition: null },
    scale: { codes: [] },
    nativeInspectorOpen: false,
  }));
  env.ui.emit('resume');
  assert.equal(env.ui.calls.panel.at(-1).stepId, 'show-filter');

  env.setUi(baseUi({
    filter: { visible: true, value: '', toggleLabel: 'Hide Filter' },
    renderedHeaders: [],
    selectedCell: { found: false, standardPosition: null },
    scale: { codes: [] },
    nativeInspectorOpen: false,
  }));
  env.ui.emit('resume');
  assert.equal(env.ui.calls.panel.at(-1).stepId, 'enter-query');

  env.setUi(baseUi({
    renderedHeaders: [{ standardPosition: 0, text: 'MS1-TA-Grade', title: 'MS1-TA-Grade', ariaLabel: '' }],
    selectedCell: { found: false, standardPosition: null },
    scale: { codes: [] },
    nativeInspectorOpen: false,
  }));
  env.ui.emit('resume');
  assert.equal(env.runtime.snapshot().state, 'CONTEXT_UNVERIFIED');
  assert.equal(env.ui.calls.inspector.length, 0);
});

test('Quick Reference works before eligibility and Hub reference controls stay ephemeral', () => {
  const env = build({
    initialUi: baseUi({
      renderedHeaders: [],
      selectedCell: { found: false, standardPosition: null },
      scale: { codes: [] },
      nativeInspectorOpen: false,
    }),
  });

  env.runtime.start();
  env.ui.emit('reference');
  let snapshot = env.runtime.snapshot();
  assert.equal(snapshot.state, 'REFERENCE');
  assert.equal(snapshot.referenceMode, true);
  assert.equal(env.ui.calls.inspector.at(-1).mode, 'reference');
  assert.equal(env.ui.calls.inspector.at(-1).areas.length, 8);

  env.ui.emit({ type: 'reference-area', value: 'academic' });
  env.ui.emit({ type: 'reference-level', value: 'ME' });
  snapshot = env.runtime.snapshot();
  assert.equal(snapshot.selectedReferenceLevel, 'ME');
  assert.equal(env.ui.calls.inspector.at(-1).officialCriterion.levelCode, 'ME');

  env.ui.emit({ type: 'assist-language', value: 'VI' });
  snapshot = env.runtime.snapshot();
  assert.equal(snapshot.assistLanguage, 'VI');
  assert.equal(env.ui.calls.inspector.at(-1).assistLanguage, 'VI');
  assert.equal(env.readCount, 2);
});

test('verified contextual cell opens inspector and reference changes never mutate native UI', () => {
  const env = build();
  env.runtime.start();
  env.ui.emit('open');

  assert.equal(env.runtime.snapshot().state, 'CONTEXT_READY');
  let model = env.ui.calls.inspector.at(-1);
  assert.equal(model.mode, 'contextual');
  assert.equal(model.officialTitle, 'Academic Achievement');
  assert.deepEqual(model.levelCodes, ['EE', 'AE', 'ME', 'BE', 'WB']);
  assert.equal(model.selectedReferenceLevel, null);

  env.ui.emit({ type: 'reference-level', value: 'AE' });
  model = env.ui.calls.inspector.at(-1);
  assert.equal(model.selectedReferenceLevel, 'AE');
  assert.equal(model.officialCriterion.levelCode, 'AE');
  assert.equal(env.runtime.snapshot().selectedReferenceLevel, 'AE');
});

test('verified Standards grid has at most one delegated cell boundary and reconciles after native click', () => {
  const document = createFakeDocument();
  const grid1 = document.createElement('table');
  const grid2 = document.createElement('table');
  const env = build({ grid: grid1 });

  env.runtime.start();
  assert.equal(grid1.eventListeners.get('click').size, 1);
  env.runtime.reconcile('repeat');
  assert.equal(grid1.eventListeners.get('click').size, 1);

  const beforeOther = env.readCount;
  grid1.dispatchEvent({ type: 'click', target: { isStandardCell: false } });
  env.window.flushMicrotasks();
  assert.equal(env.readCount, beforeOther);

  const beforeCell = env.readCount;
  grid1.dispatchEvent({ type: 'click', target: { isStandardCell: true } });
  assert.equal(env.readCount, beforeCell);
  env.window.flushMicrotasks();
  assert.equal(env.readCount, beforeCell + 1);

  env.setGrid(grid2);
  env.runtime.reconcile('grid-replaced');
  assert.equal(grid1.eventListeners.get('click').size, 0);
  assert.equal(grid2.eventListeners.get('click').size, 1);
});

test('same-path route events invalidate once and persisted filter does not preserve eligibility', () => {
  const document = createFakeDocument();
  const grid1 = document.createElement('table');
  const grid2 = document.createElement('table');
  const env = build({ grid: grid1 });

  env.runtime.start();
  env.ui.emit('open');
  env.ui.emit({ type: 'reference-level', value: 'AE' });
  env.ui.emit({ type: 'assist-language', value: 'VI' });
  const readsBeforeRoute = env.readCount;

  env.window.dispatch('hashchange');
  env.window.dispatch('popstate');

  let snapshot = env.runtime.snapshot();
  assert.equal(snapshot.contextFresh, false);
  assert.equal(snapshot.contextEpoch, 1);
  assert.equal(snapshot.selectedReferenceLevel, null);
  assert.equal(snapshot.assistLanguage, 'EN');
  assert.equal(env.readCount, readsBeforeRoute);
  assert.equal(grid1.eventListeners.get('click').size, 0);
  assert.ok(env.ui.calls.inspectorReset > 0);

  env.window.flushMicrotasks();

  env.setGrid(grid2);
  env.setUi(baseUi({
    routePath: '/classes/final_grades',
    courseLabel: '2L8I English',
    filter: { visible: true, value: 'MS1', toggleLabel: 'Hide Filter' },
    renderedHeaders: [{ standardPosition: 0, text: 'MS1-TA-Grade', title: 'MS1-TA-Grade', ariaLabel: '' }],
    selectedCell: { found: false, standardPosition: null },
    scale: { codes: [] },
    nativeInspectorOpen: false,
  }));

  env.ui.emit('resume');
  snapshot = env.runtime.snapshot();
  assert.equal(snapshot.contextFresh, true);
  assert.equal(snapshot.state, 'CONTEXT_UNVERIFIED');
  assert.equal(grid2.eventListeners.get('click').size, 1);
});

test('runtime source has no recurring work, storage, network, observer, or native action synthesis', () => {
  const source = fs.readFileSync(RUNTIME_PATH, 'utf8');
  for (const forbidden of [
    'MutationObserver',
    'setInterval',
    'requestAnimationFrame',
    'fetch(',
    'XMLHttpRequest',
    'WebSocket',
    'localStorage',
    'sessionStorage',
    'chrome.storage',
    '.click(',
    'dispatchEvent(',
    "document.addEventListener('click'",
    'document.addEventListener("click"',
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});
