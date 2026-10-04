const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const INDEX_PATH = path.resolve(__dirname, '../../../../../extension/modules/teacher-support/packs/cam-primary/ms1/index.js');

function pack() {
  return require(INDEX_PATH).createCamPrimaryMs1Pack();
}

function baseUi(overrides = {}) {
  return {
    platformVerified: true,
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

test('explicit trusted Lab context selects the pack before academic context exists', () => {
  const p = pack();
  assert.deepEqual(p.availability({ requestedPackId: 'cam-primary.ms1' }), {
    matched: true,
    reason: 'explicit-pack-request',
  });
  assert.deepEqual(p.availability({ requestedPackId: 'other', filter: 'MS1' }), {
    matched: false,
    reason: 'pack-not-requested',
  });
});

test('only approved live aliases classify as aliases', () => {
  const p = pack();
  const cases = [
    ['MS1-Academic', 'academic'],
    ['MS1-Attitude', 'attitude'],
    ['MS1-Behaviour', 'behaviour'],
    ['MS1-Equipment', 'equipment-resources'],
  ];
  for (const [text, areaId] of cases) {
    const result = p.classifyStandardHeader({ text, title: '' });
    assert.equal(result.kind, 'rubric');
    assert.equal(result.areaId, areaId);
  }

  for (const guessed of ['MS1-Classwork', 'MS1-Communication', 'MS1-Collaboratively', 'MS1-Creativity']) {
    const result = p.classifyStandardHeader({ text: guessed, title: '' });
    assert.notEqual(result.kind, 'rubric', guessed);
  }
});

test('exact normalized official titles identify every official category', () => {
  const p = pack();
  const titles = [
    ['Academic Achievement', 'academic'],
    ['Attitude Towards Learning', 'attitude'],
    ['Behaviour and Personal Development', 'behaviour'],
    ['Completion of classwork/Homework (Secondary)', 'classwork-homework'],
    ['Communication Skills', 'communication'],
    ['Working Collaboratively', 'collaboration'],
    ['Creativity and Critical thinking', 'creativity-critical-thinking'],
    ['Equipment and Resources', 'equipment-resources'],
  ];
  for (const [title, areaId] of titles) {
    const result = p.classifyStandardHeader({ text: '', title: `MS1 - ${title}` });
    assert.equal(result.kind, 'rubric', title);
    assert.equal(result.areaId, areaId);
    assert.equal(result.officialTitle, title);
  }
});

test('MS1 look-alikes and generic ambiguous text fail closed', () => {
  const p = pack();
  for (const text of ['MS1-TA-Grade', 'MS1-TA-Score', 'MS1-VN-Ranking', 'MS1-Unit1', 'MS1-LSPC']) {
    const result = p.classifyStandardHeader({ text, title: text });
    assert.equal(result.kind, 'lookalike', text);
    assert.equal(result.areaId, null);
  }
  assert.equal(p.classifyStandardHeader({ text: 'MS1', title: '' }).kind, 'unknown');
});

test('native scale compatibility requires exact ordered five-level scale', () => {
  const p = pack();
  assert.equal(p.isCompatibleScale(['EE', 'AE', 'ME', 'BE', 'WB']), true);
  assert.equal(p.isCompatibleScale(['AE', 'EE', 'ME', 'BE', 'WB']), false);
  assert.equal(p.isCompatibleScale(['EE', 'AE', 'ME', 'BE']), false);
  assert.equal(p.isCompatibleScale(['EE', 'AE', 'ME', 'BE', 'WB', 'X']), false);
});

test('strict contextual eligibility is strand-local and pagination-aware', () => {
  const p = pack();
  const result = p.evaluateContextualEligibility({
    uiState: baseUi(),
    context: { contextFresh: true },
  });
  assert.deepEqual(result, {
    eligible: true,
    areaId: 'academic',
    officialTitle: 'Academic Achievement',
    reason: 'eligible',
  });
});

test('eligibility does not require all eight categories simultaneously', () => {
  const p = pack();
  const uiState = baseUi({
    renderedHeaders: [
      { standardPosition: 4, text: 'MS1-Equipment', title: 'MS1 - Equipment and Resources', ariaLabel: '' },
    ],
    selectedCell: { found: true, standardPosition: 4 },
  });
  const result = p.evaluateContextualEligibility({ uiState, context: { contextFresh: true } });
  assert.equal(result.eligible, true);
  assert.equal(result.areaId, 'equipment-resources');
});

test('each academic gate failure fails closed independently', () => {
  const p = pack();
  const cases = [
    [baseUi({ platformVerified: false }), { contextFresh: true }, 'platform-unverified'],
    [baseUi({ standards: { available: true, verified: false, gridCount: 0, gearVisible: false } }), { contextFresh: true }, 'standards-unverified'],
    [baseUi({ standards: { available: true, verified: false, gridCount: 2, gearVisible: true } }), { contextFresh: true }, 'standards-unverified'],
    [baseUi({ renderedHeaders: [{ standardPosition: 0, text: 'MS1-TA-Grade', title: 'MS1-TA-Grade', ariaLabel: '' }] }), { contextFresh: true }, 'strand-unverified'],
    [baseUi({ selectedCell: { found: false, standardPosition: null } }), { contextFresh: true }, 'cell-unverified'],
    [baseUi({ selectedCell: { found: true, standardPosition: 1 } }), { contextFresh: true }, 'cell-unverified'],
    [baseUi({ nativeInspectorOpen: false }), { contextFresh: true }, 'inspector-unverified'],
    [baseUi({ scale: { codes: ['A', 'B'] } }), { contextFresh: true }, 'scale-incompatible'],
    [baseUi(), { contextFresh: false }, 'context-stale'],
  ];
  for (const [uiState, context, reason] of cases) {
    const result = p.evaluateContextualEligibility({ uiState, context });
    assert.equal(result.eligible, false, reason);
    assert.equal(result.reason, reason);
  }
});

test('workflow selection and strict academic eligibility remain separate', () => {
  const p = pack();
  const genericFilterOnly = baseUi({
    renderedHeaders: [{ standardPosition: 0, text: 'MS1-TA-Grade', title: 'MS1-TA-Grade', ariaLabel: '' }],
    selectedCell: { found: false, standardPosition: null },
    nativeInspectorOpen: false,
    scale: { codes: [] },
  });
  assert.equal(p.availability({ requestedPackId: 'cam-primary.ms1' }).matched, true);
  assert.equal(p.evaluateContextualEligibility({ uiState: genericFilterOnly, context: { contextFresh: true } }).eligible, false);
});

test('workflow decisions provide navigation/reference before context readiness', () => {
  const p = pack();

  assert.equal(p.decideWorkflow({ uiState: baseUi(), context: { contextFresh: true }, mode: 'reference' }).kind, 'reference');

  const needGrading = p.decideWorkflow({
    uiState: baseUi({ grading: { available: true, active: false }, standards: { available: false, verified: false, gridCount: 0, gearVisible: false } }),
    context: { contextFresh: true },
    mode: 'active',
  });
  assert.equal(needGrading.kind, 'guidance');
  assert.equal(needGrading.viewModel.stepId, 'open-grading');

  const needStandards = p.decideWorkflow({
    uiState: baseUi({ standards: { available: true, verified: false, gridCount: 0, gearVisible: false } }),
    context: { contextFresh: true },
    mode: 'active',
  });
  assert.equal(needStandards.viewModel.stepId, 'open-standards');

  const needFilter = p.decideWorkflow({
    uiState: baseUi({ filter: { visible: false, value: '', toggleLabel: 'Show Filter' }, selectedCell: { found: false, standardPosition: null }, nativeInspectorOpen: false, scale: { codes: [] } }),
    context: { contextFresh: true },
    mode: 'active',
  });
  assert.equal(needFilter.viewModel.stepId, 'show-filter');

  const needQuery = p.decideWorkflow({
    uiState: baseUi({ filter: { visible: true, value: '', toggleLabel: 'Hide Filter' }, selectedCell: { found: false, standardPosition: null }, nativeInspectorOpen: false, scale: { codes: [] } }),
    context: { contextFresh: true },
    mode: 'active',
  });
  assert.equal(needQuery.viewModel.stepId, 'enter-query');

  const unverified = p.decideWorkflow({
    uiState: baseUi({ selectedCell: { found: false, standardPosition: null }, nativeInspectorOpen: false, scale: { codes: [] } }),
    context: { contextFresh: true },
    mode: 'active',
  });
  assert.equal(unverified.kind, 'context-unverified');

  const ready = p.decideWorkflow({ uiState: baseUi(), context: { contextFresh: true }, mode: 'active' });
  assert.equal(ready.kind, 'context-ready');
  assert.equal(ready.viewModel.areaId, 'academic');
});


test('pack exposes immutable generic reference options for controller/runtime composition', () => {
  const p = pack();
  const options = p.getReferenceOptions();
  assert.deepEqual(options.levelCodes, ['EE', 'AE', 'ME', 'BE', 'WB']);
  assert.deepEqual(options.assistLanguages, ['EN', 'VI']);
  assert.equal(options.defaultAssistLanguage, 'EN');
  assert.equal(options.introTitle, 'Need help with MS1?');
  assert.equal(options.areas.length, 8);
  assert.deepEqual(options.areas[0], { id: 'academic', title: 'Academic Achievement' });
  assert.equal(Object.isFrozen(options), true);
  assert.equal(Object.isFrozen(options.areas), true);
});
