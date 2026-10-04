'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { MS1_AREAS } = require('../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/areas.js');
const { MS1_LEVELS } = require('../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/levels.js');
const MODULE_PATH = path.join(__dirname, '../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/comparisons.js');

test('Task 13 adjacent comparison module exists', () => {
  assert.equal(fs.existsSync(MODULE_PATH), true);
});

test('every level compares only with immediate neighbours and preserves official wording', () => {
  const { ADJACENT_COMPARISONS } = require(MODULE_PATH);
  const codes = MS1_LEVELS.map((x) => x.code);
  for (const area of MS1_AREAS) {
    for (let index = 0; index < codes.length; index += 1) {
      const code = codes[index];
      const cell = ADJACENT_COMPARISONS[area.key][code];
      assert.equal(cell.current.code, code);
      assert.equal(cell.current.sourceId, 'cam-primary-ms1-official');
      assert.equal(cell.previous && cell.previous.code, index === 0 ? null : codes[index - 1]);
      assert.equal(cell.next && cell.next.code, index === codes.length - 1 ? null : codes[index + 1]);
      assert.equal(cell.teacherMakesFinalDecision, true);
      assert.equal(cell.recommendedLevel, null);
    }
  }
});

test('comparison source has no scoring or auto-selection rule', () => {
  const source = fs.readFileSync(MODULE_PATH, 'utf8');
  assert.doesNotMatch(source, /score|points?|ticks?|auto(?:matic)?\s*(?:grade|select|recommend)/i);
});
