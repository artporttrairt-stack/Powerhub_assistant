'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { matchesCamPrimaryMs1, REQUIRED_SCALE } = require('../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/applicability.js');
const { createCamPrimaryMs1Pack } = require('../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/pack.js');
const { CAM_PRIMARY_MS1_SOURCE_IDS, CAM_PRIMARY_MS1_SOURCES } = require('../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/sources.js');

function validContext() {
  return {
    platform: 'powerteacher', platformVerified: true,
    workflow: 'ms1', workflowVerified: true,
    department: { code: 'CAM', verified: true },
    division: { code: 'PRIMARY', verified: true },
    reportingContextVerified: true,
    scale: { verified: true, codes: ['EE', 'AE', 'ME', 'BE', 'WB'] },
  };
}

test('MS1 workflow token alone does not activate CAM Primary pack', () => {
  assert.equal(matchesCamPrimaryMs1({ workflow: 'ms1' }).matched, false);
});

test('unknown department fails closed', () => {
  const c = validContext(); delete c.department;
  assert.equal(matchesCamPrimaryMs1(c).matched, false);
});

test('CAM with unknown division fails closed', () => {
  const c = validContext(); delete c.division;
  assert.equal(matchesCamPrimaryMs1(c).matched, false);
});

test('Primary with unverified department evidence fails closed', () => {
  const c = validContext(); c.department.verified = false;
  assert.equal(matchesCamPrimaryMs1(c).matched, false);
});

test('wrong scale order or content fails closed', () => {
  const c = validContext(); c.scale.codes = ['EE', 'AE', 'BE', 'ME', 'WB'];
  assert.equal(matchesCamPrimaryMs1(c).matched, false);
});

test('unverified reporting context fails closed', () => {
  const c = validContext(); c.reportingContextVerified = false;
  assert.equal(matchesCamPrimaryMs1(c).matched, false);
});

test('wrong platform fails closed', () => {
  const c = validContext(); c.platform = 'powerhub'; c.platformVerified = true;
  assert.equal(matchesCamPrimaryMs1(c).matched, false);
});

test('only fully verified CAM Primary MS1 context matches', () => {
  const result = matchesCamPrimaryMs1(validContext());
  assert.deepEqual(result, { matched: true, reason: 'verified-cam-primary-ms1' });
  assert.deepEqual([...REQUIRED_SCALE], ['EE', 'AE', 'ME', 'BE', 'WB']);
});

test('pack contract has exact id version workflow and source ids', () => {
  const p = createCamPrimaryMs1Pack();
  assert.equal(p.id, 'cam-primary.ms1');
  assert.equal(p.version, '1.0.0');
  assert.equal(p.workflow, 'ms1');
  assert.deepEqual([...p.sourceIds], ['cam-primary-ms1-official', 'cam-primary-ms1-interpretive']);
  assert.deepEqual([...CAM_PRIMARY_MS1_SOURCE_IDS], ['cam-primary-ms1-official', 'cam-primary-ms1-interpretive']);
  assert.equal(CAM_PRIMARY_MS1_SOURCES.official.title, 'MS1 Report Teacher Guidance');
  assert.equal(CAM_PRIMARY_MS1_SOURCES.interpretive.title, 'MS1 All Levels Complete Bilingual');
});
