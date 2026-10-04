const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const GUIDANCE_PATH = path.resolve(__dirname, '../../../../../extension/modules/teacher-support/packs/cam-primary/ms1/content/guidance.js');
const LOCALE_PATH = path.resolve(__dirname, '../../../../../extension/modules/teacher-support/packs/cam-primary/ms1/content/locale.js');
const EXAMPLES_PATH = path.resolve(__dirname, '../../../../../extension/modules/teacher-support/packs/cam-primary/ms1/content/examples.js');
const OFFICIAL_PATH = path.resolve(__dirname, '../../../../../extension/modules/teacher-support/packs/cam-primary/ms1/content/official.js');

test('every official cell has source-backed interpretive guidance', () => {
  const { LEVEL_CODES, OFFICIAL_AREAS } = require(OFFICIAL_PATH);
  const { GUIDANCE, INTERPRETIVE_SOURCE_ID } = require(GUIDANCE_PATH);
  assert.equal(INTERPRETIVE_SOURCE_ID, 'cam-primary-ms1-interpretive');

  let cells = 0;
  for (const area of OFFICIAL_AREAS) {
    for (const code of LEVEL_CODES) {
      const item = GUIDANCE[area.id][code];
      cells += 1;
      assert.equal(item.areaId, area.id);
      assert.equal(item.levelCode, code);
      assert.equal(item.sourceId, 'cam-primary-ms1-interpretive');
      assert.ok(item.explanationEn.length > 0);
      assert.equal(item.evidenceEn.length, 5);
      assert.ok(item.evidenceEn.every(Boolean));
      assert.ok(item.supportVi.length > 0);
      assert.ok(item.comparisonEn.length > 0);
    }
  }
  assert.equal(cells, 40);
});

test('locale support is explicit MS1-only EN/VI and defaults to EN', () => {
  const { DEFAULT_ASSIST_LANGUAGE, SUPPORTED_ASSIST_LANGUAGES, resolveAssistLanguage, TEACHER_DECISION_MESSAGE } = require(LOCALE_PATH);
  assert.equal(DEFAULT_ASSIST_LANGUAGE, 'EN');
  assert.deepEqual(SUPPORTED_ASSIST_LANGUAGES, ['EN', 'VI']);
  assert.equal(resolveAssistLanguage(), 'EN');
  assert.equal(resolveAssistLanguage('VI'), 'VI');
  assert.equal(resolveAssistLanguage('vi'), 'VI');
  assert.equal(resolveAssistLanguage('fr'), 'EN');
  assert.equal(TEACHER_DECISION_MESSAGE, 'Use the evidence to compare levels. You make the final judgement.');
});

test('unsupported VI material is not synthesized by locale helpers', () => {
  const { getSupportText } = require(LOCALE_PATH);
  const guidance = { explanationEn: 'English source-backed text.', supportVi: '' };
  assert.equal(getSupportText(guidance, 'VI'), 'English source-backed text.');
});

test('subject examples are limited to source-backed English Maths Science and five levels', () => {
  const { SUBJECT_EXAMPLES, getSubjectExample } = require(EXAMPLES_PATH);
  assert.deepEqual(Object.keys(SUBJECT_EXAMPLES).sort(), ['english', 'maths', 'science']);
  for (const subject of ['english', 'maths', 'science']) {
    assert.deepEqual(Object.keys(SUBJECT_EXAMPLES[subject]), ['EE', 'AE', 'ME', 'BE', 'WB']);
    for (const code of ['EE', 'AE', 'ME', 'BE', 'WB']) {
      const example = getSubjectExample(subject, code);
      assert.equal(example.sourceId, 'cam-primary-ms1-interpretive');
      assert.ok(example.textEn.length > 0);
      assert.ok(example.textVi.length > 0);
      assert.equal(example.officialCutoff, false);
    }
  }
  assert.equal(getSubjectExample('history', 'ME'), null);
  assert.equal(getSubjectExample('english', 'X'), null);
});

test('guidance source does not express automated recommendation language', () => {
  const { GUIDANCE } = require(GUIDANCE_PATH);
  const serialized = JSON.stringify(GUIDANCE).toLowerCase();
  for (const forbidden of ['recommended grade', 'hub thinks', 'confidence percentage', 'score cutoff']) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});
