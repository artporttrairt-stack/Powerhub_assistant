'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const PACK_PATH = path.join(__dirname, '../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/pack.js');
const { MS1_AREAS } = require('../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/areas.js');
const { MS1_LEVELS } = require('../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/levels.js');

test('Task 16 assembled pack exports new interface and preserves Phase 0 factory', () => {
  const mod = require(PACK_PATH);
  assert.equal(typeof mod.createMs1GuidancePack, 'function');
  assert.equal(typeof mod.createCamPrimaryMs1Pack, 'function');
});

test('pack exposes complete source-backed area/level matrix as read-only data', () => {
  const { createMs1GuidancePack } = require(PACK_PATH);
  const pack = createMs1GuidancePack();
  assert.equal(pack.id, 'cam-primary.ms1');
  assert.equal(pack.status, 'READY');
  assert.equal(Object.isFrozen(pack), true);
  assert.deepEqual(pack.listAreas().map((x) => x.key), MS1_AREAS.map((x) => x.key));
  for (const area of MS1_AREAS) {
    const areaView = pack.getArea(area.key);
    assert.equal(areaView.key, area.key);
    assert.deepEqual(areaView.levels.map((x) => x.code), MS1_LEVELS.map((x) => x.code));
    for (const level of MS1_LEVELS) {
      const cell = pack.getLevel(area.key, level.code);
      assert.equal(cell.official.sourceId, 'cam-primary-ms1-official');
      assert.deepEqual(cell.plainExplanation.derivedFrom, ['cam-primary-ms1-official']);
      assert.deepEqual(cell.classroomEvidence.derivedFrom, ['cam-primary-ms1-official']);
      assert.equal(cell.observationChecklist.scoring, false);
      assert.equal(cell.teacherMakesFinalDecision, true);
    }
  }
});

test('unknown area/level fail safely and unknown subject omits only overlay', () => {
  const { createMs1GuidancePack } = require(PACK_PATH);
  const pack = createMs1GuidancePack();
  assert.equal(pack.getArea('not-real'), null);
  assert.equal(pack.getLevel('academic-achievement', 'ZZ'), null);
  assert.equal(pack.getSubjectExample('academic-achievement', 'ME', 'history'), null);
  assert.ok(pack.getLevel('academic-achievement', 'ME'));
  assert.ok(pack.getSubjectExample('academic-achievement', 'ME', 'maths'));
});

test('comparison is adjacent-only and teacher decision remains manual', () => {
  const { createMs1GuidancePack } = require(PACK_PATH);
  const pack = createMs1GuidancePack();
  const compare = pack.compare('academic-achievement', 'ME');
  assert.equal(compare.previous.code, 'AE');
  assert.equal(compare.next.code, 'BE');
  assert.equal(compare.teacherMakesFinalDecision, true);
  assert.equal(compare.recommendedLevel, null);
});

test('assembled pack has no DOM, storage, network, or native-action access', () => {
  const source = fs.readFileSync(PACK_PATH, 'utf8');
  assert.doesNotMatch(source, /document\.|window\.|querySelector|localStorage|sessionStorage|document\.cookie|fetch\s*\(|XMLHttpRequest|\.click\s*\(|dispatchEvent\s*\(/);
});

test('workflow becomes picker-visible only after assembled content gate is green', () => {
  const { CAM_PRIMARY_MS1_WORKFLOW } = require('../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/workflow.js');
  assert.equal(CAM_PRIMARY_MS1_WORKFLOW.status, 'READY');
  assert.equal(CAM_PRIMARY_MS1_WORKFLOW.visibleInPicker, true);
});
