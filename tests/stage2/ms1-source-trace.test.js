'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { MS1_AREAS } = require('../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/areas.js');
const { MS1_LEVELS } = require('../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/levels.js');
const { OFFICIAL_CRITERIA } = require('../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/official-criteria.js');

const SOURCE_ID = 'cam-primary-ms1-official';

test('every source-backed area and level has one official criterion with trace', () => {
  for (const area of MS1_AREAS) {
    assert.ok(OFFICIAL_CRITERIA[area.key], `missing area ${area.key}`);
    for (const level of MS1_LEVELS) {
      const cell = OFFICIAL_CRITERIA[area.key][level.code];
      assert.ok(cell, `missing ${area.key}/${level.code}`);
      assert.equal(typeof cell.criterion, 'string');
      assert.ok(cell.criterion.trim().length > 0);
      assert.equal(cell.sourceId, SOURCE_ID);
      assert.equal(cell.sourceAuthority, 'official');
      assert.equal(cell.supported, true);
    }
  }
});

test('official matrix contains no extra or missing area/level keys', () => {
  assert.deepEqual(Object.keys(OFFICIAL_CRITERIA), MS1_AREAS.map((x) => x.key));
  for (const area of MS1_AREAS) assert.deepEqual(Object.keys(OFFICIAL_CRITERIA[area.key]), MS1_LEVELS.map((x) => x.code));
});

test('official criteria layer cannot be overridden by interpretive source', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/official-criteria.js'), 'utf8');
  assert.doesNotMatch(source, /cam-primary-ms1-interpretive|All Levels Complete Bilingual/);
  assert.equal(Object.isFrozen(OFFICIAL_CRITERIA), true);
  for (const area of MS1_AREAS) assert.equal(Object.isFrozen(OFFICIAL_CRITERIA[area.key]), true);
});
