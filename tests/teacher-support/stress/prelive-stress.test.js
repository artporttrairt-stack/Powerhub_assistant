const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createFakeDocument } = require('../helpers/fake-dom.js');

const ROOT = path.resolve(__dirname, '../../..');
const RUNTIME_PATH = path.join(ROOT, 'extension/modules/teacher-support/runtime/support-runtime.js');
const REGISTRY_PATH = path.join(ROOT, 'extension/modules/teacher-support/core/workflow-registry.js');
const RESOLVER_PATH = path.join(ROOT, 'extension/modules/teacher-support/core/state-resolver.js');
const CONTROLLER_PATH = path.join(ROOT, 'extension/modules/teacher-support/core/support-controller.js');
const PACK_PATH = path.join(ROOT, 'extension/modules/teacher-support/packs/cam-primary/ms1/index.js');
const APPLICABILITY_PATH = path.join(ROOT, 'extension/modules/teacher-support/packs/cam-primary/ms1/applicability.js');
const ENTRY_PATH = path.join(ROOT, 'extension/modules/teacher-support/ui/entry-button.js');
const PANEL_PATH = path.join(ROOT, 'extension/modules/teacher-support/ui/assistant-panel.js');
const INSPECTOR_PATH = path.join(ROOT, 'extension/modules/teacher-support/ui/score-inspector.js');

class StressWindow {
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
    courseLabel: 'Stress Course',
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
  let onIntent = null;
  const calls = {
    entry: 0,
    panel: 0,
    inspector: 0,
    reset: 0,
    destroyed: 0,
  };

  return {
    calls,
    emit(intent) {
      if (!onIntent) throw new Error('UI intent handler is unavailable.');
      onIntent(intent);
    },
    factories: {
      createEntryButton({ onIntent: handler }) {
        onIntent = handler;
        return {
          render() { calls.entry += 1; },
          focus() {},
          destroy() { calls.destroyed += 1; },
        };
      },
      createAssistantPanel({ onIntent: handler }) {
        onIntent = handler;
        return {
          render() { calls.panel += 1; },
          focusInitial() {},
          close() {},
          renderTargetHint() {},
          clearTargetHint() {},
          destroy() { calls.destroyed += 1; },
        };
      },
      createScoreInspector({ onIntent: handler }) {
        onIntent = handler;
        return {
          render() { calls.inspector += 1; },
          reset() { calls.reset += 1; },
          destroy() { calls.destroyed += 1; },
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
  const window = new StressWindow();
  const ui = createUiSpies();
  const registry = createWorkflowRegistry();
  registry.register(createCamPrimaryMs1Pack());
  const controller = createSupportController({ registry, resolver: resolveSupportState });

  let currentUi = initialUi;
  let currentGrid = grid || document.createElement('table');
  let readCount = 0;

  const adapter = {
    readTeacherUiState() {
      readCount += 1;
      return currentUi;
    },
    getNativeTarget() {
      return null;
    },
    getVerifiedStandardsGrid() {
      return currentGrid;
    },
    classifyNativeInteraction(target) {
      return target && target.isStandardCell
        ? { kind: 'standard-cell' }
        : { kind: 'other' };
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
    get grid() { return currentGrid; },
    get readCount() { return readCount; },
    setGrid(value) { currentGrid = value; },
    setUi(value) { currentUi = value; },
  };
}

function listenerCount(node, type) {
  const set = node && node.eventListeners && node.eventListeners.get(type);
  return set ? set.size : 0;
}

test('stress: 100 full start/reconcile/destroy cycles never accumulate roots or listeners', () => {
  const env = build();

  for (let i = 0; i < 100; i += 1) {
    env.runtime.start();
    env.runtime.start();
    env.runtime.reconcile('stress-cycle');

    assert.equal(env.document.querySelectorAll('#hub-assistant-teacher-support-root').length, 1);
    assert.equal(env.window.listenerCount('hashchange'), 1);
    assert.equal(env.window.listenerCount('popstate'), 1);
    assert.equal(listenerCount(env.grid, 'click'), 1);

    env.ui.emit('open');
    env.ui.emit('close');

    env.runtime.destroy();
    assert.equal(env.document.querySelector('#hub-assistant-teacher-support-root'), null);
    assert.equal(env.window.listenerCount('hashchange'), 0);
    assert.equal(env.window.listenerCount('popstate'), 0);
    assert.equal(listenerCount(env.grid, 'click'), 0);
  }
});

test('stress: 250 verified grid replacements detach every old delegated listener', () => {
  const env = build();
  env.runtime.start();

  let previous = env.grid;
  for (let i = 0; i < 250; i += 1) {
    const next = env.document.createElement('table');
    env.setGrid(next);
    env.runtime.reconcile('grid-churn');

    assert.equal(listenerCount(previous, 'click'), 0, `old grid leaked at iteration ${i}`);
    assert.equal(listenerCount(next, 'click'), 1, `new grid missing listener at iteration ${i}`);
    assert.equal(env.window.listenerCount('hashchange'), 1);
    assert.equal(env.window.listenerCount('popstate'), 1);
    assert.equal(env.document.querySelectorAll('#hub-assistant-teacher-support-root').length, 1);
    previous = next;
  }

  env.runtime.destroy();
  assert.equal(listenerCount(previous, 'click'), 0);
});

test('stress: 5000 irrelevant grid clicks cause no DOM reread and queue no work', () => {
  const env = build();
  env.runtime.start();
  const readsBefore = env.readCount;

  for (let i = 0; i < 5000; i += 1) {
    env.grid.dispatchEvent({ type: 'click', target: { isStandardCell: false } });
  }

  assert.equal(env.readCount, readsBefore);
  assert.equal(env.window.microtasks.length, 0);
  env.window.flushMicrotasks();
  assert.equal(env.readCount, readsBefore);
});

test('stress: 1000 paired route events coalesce to one invalidation per microtask boundary', () => {
  const env = build();
  env.runtime.start();
  const readsBefore = env.readCount;

  for (let i = 0; i < 1000; i += 1) {
    env.window.dispatch('hashchange');
    env.window.dispatch('popstate');
  }

  let snapshot = env.runtime.snapshot();
  assert.equal(snapshot.contextEpoch, 1);
  assert.equal(snapshot.contextFresh, false);
  assert.equal(snapshot.listenersBound.grid, false);
  assert.equal(env.readCount, readsBefore);
  assert.equal(env.window.microtasks.length, 1);

  env.window.flushMicrotasks();
  env.window.dispatch('hashchange');
  snapshot = env.runtime.snapshot();
  assert.equal(snapshot.contextEpoch, 2);
  assert.equal(snapshot.contextFresh, false);
  assert.equal(env.readCount, readsBefore);
});

test('stress: queued native-cell reconcile is cancelled by destroy before microtask flush', () => {
  const env = build();
  env.runtime.start();
  const readsBefore = env.readCount;

  env.grid.dispatchEvent({ type: 'click', target: { isStandardCell: true } });
  assert.equal(env.window.microtasks.length, 1);
  assert.equal(env.readCount, readsBefore);

  env.runtime.destroy();
  env.window.flushMicrotasks();

  assert.equal(env.readCount, readsBefore);
  assert.equal(env.runtime.snapshot().state, 'STOPPED');
  assert.equal(env.window.listenerCount('hashchange'), 0);
  assert.equal(env.window.listenerCount('popstate'), 0);
  assert.equal(env.document.querySelector('#hub-assistant-teacher-support-root'), null);
});

test('stress: route invalidation wins over a queued old-grid cell reconcile', () => {
  const env = build();
  env.runtime.start();
  const readsBefore = env.readCount;

  env.grid.dispatchEvent({ type: 'click', target: { isStandardCell: true } });
  env.window.dispatch('hashchange');

  assert.equal(env.runtime.snapshot().contextFresh, false);
  assert.equal(env.runtime.snapshot().listenersBound.grid, false);
  env.window.flushMicrotasks();

  assert.equal(env.readCount, readsBefore);
  assert.equal(env.runtime.snapshot().contextFresh, false);
  assert.equal(env.runtime.snapshot().state, 'CONTEXT_UNVERIFIED');
});

test('stress: replacing a grid cancels queued work from the old grid', () => {
  const env = build();
  env.runtime.start();
  const oldGrid = env.grid;
  const readsBefore = env.readCount;

  oldGrid.dispatchEvent({ type: 'click', target: { isStandardCell: true } });
  const newGrid = env.document.createElement('table');
  env.setGrid(newGrid);
  env.runtime.reconcile('replace-before-flush');

  assert.equal(env.readCount, readsBefore + 1);
  assert.equal(listenerCount(oldGrid, 'click'), 0);
  assert.equal(listenerCount(newGrid, 'click'), 1);

  env.window.flushMicrotasks();
  assert.equal(env.readCount, readsBefore + 1);
});

test('stress: 500 normalized look-alike variants remain fail-closed', () => {
  const { createCamPrimaryMs1Pack } = require(PACK_PATH);
  const { LOOKALIKE_PREFIXES } = require(APPLICABILITY_PATH);
  const pack = createCamPrimaryMs1Pack();

  let checked = 0;
  for (const prefix of LOOKALIKE_PREFIXES) {
    for (let i = 0; i < 100; i += 1) {
      const candidate = `  ${prefix.toUpperCase()}-variant-${i}  `;
      const classification = pack.classifyStandardHeader({
        text: candidate,
        title: '',
        ariaLabel: '',
      });
      assert.equal(classification.kind, 'lookalike', candidate);

      const uiState = baseUi({
        renderedHeaders: [
          { standardPosition: 0, text: candidate, title: candidate, ariaLabel: '' },
        ],
      });
      const eligibility = pack.evaluateContextualEligibility({
        uiState,
        context: { contextFresh: true },
      });
      assert.equal(eligibility.eligible, false, candidate);
      assert.equal(eligibility.reason, 'strand-unverified', candidate);
      checked += 1;
    }
  }
  assert.equal(checked, 500);
});

test('stress: 500 incompatible scale variants never become academically eligible', () => {
  const { createCamPrimaryMs1Pack } = require(PACK_PATH);
  const { REQUIRED_SCALE } = require(APPLICABILITY_PATH);
  const pack = createCamPrimaryMs1Pack();

  for (let i = 0; i < 500; i += 1) {
    const wrong = [...REQUIRED_SCALE];
    const a = i % wrong.length;
    const b = (a + 1) % wrong.length;
    [wrong[a], wrong[b]] = [wrong[b], wrong[a]];

    assert.equal(pack.isCompatibleScale(wrong), false);
    const eligibility = pack.evaluateContextualEligibility({
      uiState: baseUi({ scale: { codes: wrong } }),
      context: { contextFresh: true },
    });
    assert.equal(eligibility.eligible, false);
    assert.equal(eligibility.reason, 'scale-incompatible');
  }
});

test('stress: approved alias remains strand-local while near-matches fail closed', () => {
  const { createCamPrimaryMs1Pack } = require(PACK_PATH);
  const pack = createCamPrimaryMs1Pack();

  assert.equal(pack.classifyStandardHeader({ text: 'MS1-Academic' }).kind, 'rubric');

  const nearMatches = [
    'MS1-Academic-Extra',
    'X-MS1-Academic',
    'MS1 Academic',
    'MS1-Academic Achievement Extra',
    'Academic Achievement Extra',
    'MS1',
    '',
  ];

  for (const text of nearMatches) {
    const classification = pack.classifyStandardHeader({ text });
    assert.notEqual(classification.kind, 'rubric', text || '<empty>');

    const eligibility = pack.evaluateContextualEligibility({
      uiState: baseUi({
        renderedHeaders: [{ standardPosition: 0, text, title: '', ariaLabel: '' }],
      }),
      context: { contextFresh: true },
    });
    assert.equal(eligibility.eligible, false, text || '<empty>');
  }
});


test('stress: 1000 real owned-DOM rerenders keep one node per UI component and one target hint', () => {
  const { createEntryButton } = require(ENTRY_PATH);
  const { createAssistantPanel } = require(PANEL_PATH);
  const { createScoreInspector } = require(INSPECTOR_PATH);

  const document = createFakeDocument();
  const root = document.createElement('div');
  root.id = 'hub-assistant-teacher-support-root';
  document.body.appendChild(root);

  const entry = createEntryButton({ document, root, onIntent: () => {} });
  const panel = createAssistantPanel({
    document,
    root,
    assetUrl: 'robot.png',
    onIntent: () => {},
  });
  const inspector = createScoreInspector({ document, root, onIntent: () => {} });

  for (let i = 0; i < 1000; i += 1) {
    entry.render({
      visible: true,
      attention: i === 0,
      reducedMotion: false,
      label: 'Teacher Support',
    });

    panel.render({
      open: true,
      title: 'Support',
      message: `Cycle ${i}`,
      robotVisible: true,
      reducedMotion: false,
      actions: [
        { intent: 'guide', label: 'Guide me' },
        { intent: 'close', label: 'Close' },
      ],
    });

    inspector.render({
      mode: i % 2 === 0 ? 'contextual' : 'reference',
      referenceOnlyLabel: 'Reference only',
      officialTitle: 'Academic Achievement',
      areas: [{ id: 'academic', title: 'Academic Achievement' }],
      selectedAreaId: i % 2 === 0 ? 'academic' : null,
      levelCodes: ['EE', 'AE', 'ME', 'BE', 'WB'],
      selectedReferenceLevel: null,
      assistLanguage: 'EN',
      assistLanguages: ['EN', 'VI'],
      officialCriterion: null,
      plainExplanation: null,
      evidence: [],
      checklist: [],
      comparison: null,
      subjectExample: null,
      teacherDecisionMessage: '',
    });

    panel.renderTargetHint({ top: i, left: i, width: 40, height: 20 });

    assert.equal(root.querySelectorAll('#hub-assistant-teacher-support-entry').length, 1);
    assert.equal(root.querySelectorAll('#hub-assistant-teacher-support-panel').length, 1);
    assert.equal(root.querySelectorAll('#hub-assistant-teacher-support-inspector').length, 1);
    assert.equal(root.querySelectorAll('#hub-assistant-teacher-support-target-hint').length, 1);
  }

  panel.clearTargetHint();
  assert.equal(root.querySelector('#hub-assistant-teacher-support-target-hint'), null);
  assert.equal(root.children.length, 3);

  entry.destroy();
  panel.destroy();
  inspector.destroy();
  assert.equal(root.children.length, 0);
});
