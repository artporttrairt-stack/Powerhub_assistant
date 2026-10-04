const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ADAPTER_PATH = path.resolve(__dirname, '../../../extension/modules/teacher-support/platform/powerteacher/ui-adapter.js');
const CONTRACT_PATH = path.resolve(__dirname, '../../../extension/modules/teacher-support/platform/powerteacher/ui-contract.js');

function classList(values = []) {
  const set = new Set(values);
  return { contains: (value) => set.has(value) };
}

function element({
  text = '',
  title = '',
  value = '',
  visible = true,
  attrs = {},
  classes = [],
  query = {},
  queryAll = {},
  parentElement = null,
  cellIndex = -1,
} = {}) {
  return {
    textContent: text,
    title,
    value,
    visible,
    parentElement,
    cellIndex,
    classList: classList(classes),
    getAttribute(name) {
      if (name === 'title') return title || null;
      return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null;
    },
    getClientRects() {
      return visible ? [{}] : [];
    },
    querySelector(selector) {
      return query[selector] || null;
    },
    querySelectorAll(selector) {
      return queryAll[selector] || [];
    },
    closest(selector) {
      if (selector === 'td.standard-col' && classes.includes('standard-col')) return this;
      return null;
    },
  };
}

function documentFake(map = {}, all = {}) {
  return {
    querySelector(selector) {
      return map[selector] || null;
    },
    querySelectorAll(selector) {
      return all[selector] || [];
    },
  };
}

function computedStyle(node) {
  return node && node.visible !== false
    ? { display: 'block', visibility: 'visible', opacity: '1' }
    : { display: 'none', visibility: 'hidden', opacity: '0' };
}

function adapterFor({ document, origin = 'https://vas.powerschool.com', pathname = '/teachers/index.html', hash = '#/classes/final_grades' }) {
  const { createPowerTeacherUiAdapter } = require(ADAPTER_PATH);
  return createPowerTeacherUiAdapter({
    document,
    location: { origin, pathname, hash },
    getComputedStyle: computedStyle,
  });
}

function standardsDocument({ grids = [], filterVisible = false, headers = [], rowCells = [], inspector = null, scoreChoices = [], allScoreButtons = null } = {}) {
  const standardsContainer = element({ text: 'Standards', visible: true });
  const grading = element({ text: 'Grading', visible: true, attrs: { 'aria-current': 'page' } });
  const standardsNav = element({ text: 'Standards', visible: true, attrs: { 'aria-current': 'page' } });
  const gear = element({ text: 'Special Functions', visible: true });
  const filterToggle = element({ text: filterVisible ? 'Hide Filter' : 'Show Filter', visible: true });
  const filterInput = element({ value: 'MS1', visible: filterVisible });
  const course = element({ text: 'Course label', visible: true });

  for (const grid of grids) {
    grid.querySelectorAll = (selector) => {
      if (selector === 'th.standard-column-header.standard-col') return headers;
      if (selector === 'td.standard-col') return rowCells;
      return [];
    };
  }

  return documentFake({
    '#sidebar-charms-grading': grading,
    '#grading-standards-link': standardsNav,
    '#section-mega-menu': standardsContainer,
    '#special-functions': gear,
    '#hide-filter': filterToggle,
    '#simple-search-standard-final-grades': filterInput,
    '.course-name': course,
    '#keypad-score': inspector,
  }, {
    '#standard-final-grades': grids,
    '[id^="keypad-score-"][id$="-button"]': allScoreButtons || scoreChoices,
    '[id^="keypad-score-"][id$="-button"]:not(#keypad-score-enter-button)': scoreChoices,
  });
}

test('wrong origin fails platform verification', () => {
  const adapter = adapterFor({
    document: documentFake(),
    origin: 'https://vas.educator.powerschool.com',
  });
  const state = adapter.readTeacherUiState();
  assert.equal(state.platformVerified, false);
});

test('route text alone never verifies Standards; composite visible semantics do', () => {
  const noGrid = adapterFor({ document: standardsDocument({ grids: [] }) }).readTeacherUiState();
  assert.equal(noGrid.routePath, '/classes/final_grades');
  assert.equal(noGrid.standards.verified, false);

  const grid = element({ visible: true });
  const oneGrid = adapterFor({ document: standardsDocument({ grids: [grid] }) }).readTeacherUiState();
  assert.equal(oneGrid.standards.verified, true);
  assert.equal(oneGrid.standards.gridCount, 1);

  const second = element({ visible: true });
  const duplicate = adapterFor({ document: standardsDocument({ grids: [grid, second] }) }).readTeacherUiState();
  assert.equal(duplicate.standards.verified, false);
  assert.equal(duplicate.standards.gridCount, 2);
});

test('filter visibility comes from computed input visibility, not toggle presence', () => {
  const grid = element({ visible: true });
  const hidden = adapterFor({ document: standardsDocument({ grids: [grid], filterVisible: false }) }).readTeacherUiState();
  assert.equal(hidden.filter.visible, false);
  assert.equal(hidden.filter.toggleLabel, 'Show Filter');

  const shown = adapterFor({ document: standardsDocument({ grids: [grid], filterVisible: true }) }).readTeacherUiState();
  assert.equal(shown.filter.visible, true);
  assert.equal(shown.filter.value, 'MS1');
  assert.equal(shown.filter.toggleLabel, 'Hide Filter');
});

test('rendered headers remain raw platform semantics with relative positions only', () => {
  const grid = element({ visible: true });
  const headers = [
    element({ text: 'MS1-Academic', title: 'MS1 - Academic Achievement' }),
    element({ text: 'MS1-TA-Grade', title: 'Teacher assessment' }),
  ];
  const state = adapterFor({ document: standardsDocument({ grids: [grid], headers }) }).readTeacherUiState();

  assert.deepEqual(state.renderedHeaders, [
    { standardPosition: 0, text: 'MS1-Academic', title: 'MS1 - Academic Achievement', ariaLabel: '' },
    { standardPosition: 1, text: 'MS1-TA-Grade', title: 'Teacher assessment', ariaLabel: '' },
  ]);
  assert.equal(Object.hasOwn(state.renderedHeaders[0], 'kind'), false);
  assert.equal(Object.hasOwn(state.renderedHeaders[0], 'areaId'), false);
  assert.equal(Object.hasOwn(state, 'selectedStrand'), false);
});

test('selected cell uses relative standard-column position and ignores absolute cellIndex', () => {
  const grid = element({ visible: true });
  const row = element();
  const first = element({ classes: ['standard-col', 'keypad-cell'], parentElement: row, cellIndex: 7 });
  const selected = element({
    classes: ['standard-col', 'keypad-cell', 'highlight'],
    parentElement: row,
    cellIndex: 12,
    attrs: { 'aria-selected': 'true' },
  });
  row.querySelectorAll = (selector) => selector === 'td.standard-col' ? [first, selected] : [];
  const headers = [element({ text: 'H1' }), element({ text: 'H2' })];
  const state = adapterFor({
    document: standardsDocument({ grids: [grid], headers, rowCells: [first, selected] }),
  }).readTeacherUiState();

  assert.deepEqual(state.selectedCell, { found: true, standardPosition: 1 });
  assert.notEqual(selected.cellIndex, 1);
});

test('native inspector reports observed option codes from verified keypad score controls without judging compatibility', () => {
  const grid = element({ visible: true });
  const options = ['EE', 'AE', 'ME', 'BE', 'WB'].map((code) => element({ text: code, attrs: { role: 'button' } }));
  const enter = element({ text: 'Enter', attrs: { role: 'button' } });
  const inspector = element({ visible: true });
  const state = adapterFor({
    document: standardsDocument({
      grids: [grid],
      inspector,
      scoreChoices: options,
      allScoreButtons: [...options, enter],
    }),
  }).readTeacherUiState();

  assert.equal(state.nativeInspectorOpen, true);
  assert.deepEqual(state.scale.codes, ['EE', 'AE', 'ME', 'BE', 'WB']);
  assert.equal(Object.hasOwn(state.scale, 'verified'), false);
});

test('PowerTeacher contract uses only G0-verified generic keypad score selectors', () => {
  const source = fs.readFileSync(CONTRACT_PATH, 'utf8');
  assert.equal(source.includes('body.score-inspector-score'), false);
  assert.match(source, /#keypad-score/);
  assert.match(source, /\[id\^="keypad-score-"\]\[id\$="-button"\]/);
  assert.match(source, /:not\(#keypad-score-enter-button\)/);
  for (const token of ['keypad-score-EE-button', 'keypad-score-AE-button', 'keypad-score-ME-button', 'keypad-score-BE-button', 'keypad-score-WB-button']) {
    assert.equal(source.includes(token), false, token);
  }
});

test('generic platform source contains no MS1 academic classification policy', () => {
  const source = fs.readFileSync(CONTRACT_PATH, 'utf8') + '\n' + fs.readFileSync(ADAPTER_PATH, 'utf8');
  const forbidden = [
    'MS1-Academic',
    'Academic Achievement',
    'MS1-TA-Grade',
    'MS1-VN-Ranking',
    "'EE'",
    "'AE'",
    "'ME'",
    "'BE'",
    "'WB'",
  ];
  for (const token of forbidden) {
    assert.equal(source.includes(token), false, `generic platform contains pack policy token: ${token}`);
  }
});
