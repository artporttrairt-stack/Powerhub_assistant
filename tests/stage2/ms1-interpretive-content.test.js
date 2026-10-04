'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { MS1_AREAS } = require('../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/areas.js');
const { MS1_LEVELS } = require('../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/levels.js');

const BASE = '../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1';
const plainPath = path.join(__dirname, BASE, 'plain-explanations.js');
const evidencePath = path.join(__dirname, BASE, 'classroom-evidence.js');
const checklistPath = path.join(__dirname, BASE, 'observation-checklists.js');

test('Task 11-12 interpretive modules exist', () => {
  assert.equal(fs.existsSync(plainPath), true);
  assert.equal(fs.existsSync(evidencePath), true);
  assert.equal(fs.existsSync(checklistPath), true);
});

test('every plain explanation is bilingual and traces to official + interpretive sources', () => {
  const { PLAIN_EXPLANATIONS } = require(plainPath);
  for (const area of MS1_AREAS) for (const level of MS1_LEVELS) {
    const cell = PLAIN_EXPLANATIONS[area.key][level.code];
    assert.deepEqual(cell.derivedFrom, ['cam-primary-ms1-official']);
    assert.equal(cell.interpretiveSourceId, 'cam-primary-ms1-interpretive');
    assert.ok(cell.text.en && cell.text.vi);
    assert.equal(cell.recommendsLevel, false);
  }
});

test('every classroom-evidence cell has observable sourced evidence, not a score rule', () => {
  const { CLASSROOM_EVIDENCE } = require(evidencePath);
  for (const area of MS1_AREAS) for (const level of MS1_LEVELS) {
    const cell = CLASSROOM_EVIDENCE[area.key][level.code];
    assert.deepEqual(cell.derivedFrom, ['cam-primary-ms1-official']);
    assert.equal(cell.interpretiveSourceId, 'cam-primary-ms1-interpretive');
    assert.equal(cell.items.length, 5);
    assert.ok(cell.items.every((item) => typeof item === 'string' && item.length > 8));
  }
  const serialized = JSON.stringify(CLASSROOM_EVIDENCE);
  assert.doesNotMatch(serialized, /\b[1-5]\s*\/\s*5\s*=|ticks?\s*=|points?\s*=|score\s*>=|recommend(?:s|ed)?\s+(EE|AE|ME|BE|WB)/i);
});

test('observation checklists are questions, source-traced, and never scoring', () => {
  const { OBSERVATION_CHECKLISTS } = require(checklistPath);
  for (const area of MS1_AREAS) for (const level of MS1_LEVELS) {
    const cell = OBSERVATION_CHECKLISTS[area.key][level.code];
    assert.deepEqual(cell.derivedFrom, ['cam-primary-ms1-official']);
    assert.equal(cell.interpretiveSourceId, 'cam-primary-ms1-interpretive');
    assert.equal(cell.items.length, 5);
    assert.ok(cell.items.every((item) => item.endsWith('?')));
    assert.equal(cell.scoring, false);
  }
  const serialized = JSON.stringify(OBSERVATION_CHECKLISTS);
  assert.doesNotMatch(serialized, /\b[1-5]\s*\/\s*5\s*=|ticks?\s*=|points?\s*=|auto(?:matic)?\s*(?:grade|level)|Hub recommends/i);
});
