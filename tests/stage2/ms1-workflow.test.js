'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { CAM_PRIMARY_MS1_WORKFLOW } = require('../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/workflow.js');
const { matchesCamPrimaryMs1 } = require('../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/applicability.js');
const { CAM_PRIMARY_MS1_SOURCES } = require('../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/sources.js');

function validContext() {
  return {
    platform: 'powerteacher', platformVerified: true,
    workflow: 'ms1', workflowVerified: true,
    department: { code: 'CAM', verified: true },
    division: { code: 'PRIMARY', verified: true },
    reportingContextVerified: true,
    sectionContextVerified: true,
    ambiguous: false,
    scale: { verified: true, codes: ['EE', 'AE', 'ME', 'BE', 'WB'] },
  };
}

test('MS1 workflow metadata stays hidden until content source gate is complete', () => {
  assert.equal(CAM_PRIMARY_MS1_WORKFLOW.id, 'cam-primary.ms1');
  assert.equal(CAM_PRIMARY_MS1_WORKFLOW.label, 'MS1 Report');
  assert.equal(CAM_PRIMARY_MS1_WORKFLOW.status, 'SOURCE_REQUIRED');
  assert.equal(CAM_PRIMARY_MS1_WORKFLOW.visibleInPicker, false);
  assert.deepEqual(CAM_PRIMARY_MS1_WORKFLOW.navigation, { targetView: 'standards', filterQuery: 'MS1' });
  assert.equal(CAM_PRIMARY_MS1_WORKFLOW.guidancePackId, 'cam-primary.ms1');
});

test('exact verified context matches', () => {
  assert.equal(matchesCamPrimaryMs1(validContext()).matched, true);
});

test('unknown department or division fails closed', () => {
  const a = validContext(); delete a.department;
  const b = validContext(); delete b.division;
  assert.equal(matchesCamPrimaryMs1(a).matched, false);
  assert.equal(matchesCamPrimaryMs1(b).matched, false);
});

test('incompatible scale and ambiguous context fail closed', () => {
  const a = validContext(); a.scale.codes = ['EE', 'AE', 'ME'];
  const b = validContext(); b.ambiguous = true;
  assert.equal(matchesCamPrimaryMs1(a).matched, false);
  assert.equal(matchesCamPrimaryMs1(b).matched, false);
});

test('stale section context after section switch fails closed', () => {
  const c = validContext(); c.sectionContextVerified = false;
  assert.equal(matchesCamPrimaryMs1(c).matched, false);
});

test('source roles distinguish canonical official from interpretive support', () => {
  assert.equal(CAM_PRIMARY_MS1_SOURCES.official.authority, 'official');
  assert.equal(CAM_PRIMARY_MS1_SOURCES.official.role, 'canonical');
  assert.equal(CAM_PRIMARY_MS1_SOURCES.interpretive.authority, 'interpretive');
  assert.equal(CAM_PRIMARY_MS1_SOURCES.interpretive.role, 'interpretive-example');
});
