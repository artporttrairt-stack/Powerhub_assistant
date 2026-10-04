'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const MODULE_PATH = path.join(__dirname, '../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/subject-examples/index.js');
const SUBJECT_DIR = path.join(__dirname, '../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/subject-examples');

test('Task 14 subject overlay modules exist separately', () => {
  assert.equal(fs.existsSync(MODULE_PATH), true);
  for (const file of ['english.js','maths.js','science.js']) assert.equal(fs.existsSync(path.join(SUBJECT_DIR, file)), true);
});

test('Academic Achievement has English Maths Science examples for all five levels', () => {
  const { SUBJECT_EXAMPLES } = require(MODULE_PATH);
  for (const level of ['EE','AE','ME','BE','WB']) {
    for (const subject of ['english','maths','science']) {
      const item = SUBJECT_EXAMPLES['academic-achievement'][level][subject];
      assert.ok(item.en && item.vi);
      assert.equal(item.sourceId, 'cam-primary-ms1-interpretive');
      assert.equal(item.illustrativeOnly, true);
      assert.equal(item.officialCutoff, false);
    }
  }
});

test('unknown subject returns no overlay and examples never masquerade as official criteria', () => {
  const { getSubjectExample } = require(MODULE_PATH);
  assert.equal(getSubjectExample('academic-achievement', 'ME', 'history'), null);
  assert.equal(getSubjectExample('communication-skills', 'ME', 'english'), null);
  const source = fs.readFileSync(MODULE_PATH, 'utf8');
  assert.doesNotMatch(source, /officialCutoff:\s*true|sourceId:\s*['"]cam-primary-ms1-official['"]/);
});
