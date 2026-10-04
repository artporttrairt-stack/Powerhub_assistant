'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const EN = path.join(__dirname, '../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/copy.en.js');
const VI = path.join(__dirname, '../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/copy.vi.js');

test('Task 15 EN/VI copy modules exist', () => {
  assert.equal(fs.existsSync(EN), true);
  assert.equal(fs.existsSync(VI), true);
});

test('English copy contains required concise labels', () => {
  const { COPY_EN } = require(EN);
  assert.equal(COPY_EN.officialCriterion, 'OFFICIAL CRITERION');
  assert.equal(COPY_EN.interpretiveExample, 'EXAMPLE TO HELP YOU INTERPRET');
  assert.match(COPY_EN.compareWith, /^Compare with/);
  assert.equal(COPY_EN.back, 'Back');
  assert.equal(COPY_EN.quickReference, 'Quick reference');
  assert.match(COPY_EN.teacherDecision, /teacher|you decide/i);
});

test('Vietnamese copy has aligned labels without replacing source authority', () => {
  const { COPY_VI } = require(VI);
  for (const key of ['officialCriterion','interpretiveExample','compareWith','back','quickReference','teacherDecision']) {
    assert.equal(typeof COPY_VI[key], 'string');
    assert.ok(COPY_VI[key].length > 1);
  }
  assert.match(COPY_VI.teacherDecision, /giáo viên|thầy cô|bạn quyết định/i);
});

test('copy remains concise and contains no automatic grading language', () => {
  const { COPY_EN } = require(EN); const { COPY_VI } = require(VI);
  for (const value of [...Object.values(COPY_EN), ...Object.values(COPY_VI)]) assert.ok(value.length <= 120);
  assert.doesNotMatch(JSON.stringify({ COPY_EN, COPY_VI }), /auto(?:matic)?\s*(?:grade|select)|Hub recommends|chấm tự động|tự động chọn/i);
});
