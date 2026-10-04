'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { MS1_AREAS } = require('../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/areas.js');
const { MS1_LEVELS } = require('../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/levels.js');

const EXPECTED_AREAS = [
  ['academic-achievement', 'Academic Achievement'],
  ['attitude-towards-learning', 'Attitude Towards Learning'],
  ['behaviour-personal-development', 'Behaviour and Personal Development'],
  ['completion-classwork-homework-secondary', 'Completion of classwork/Homework (Secondary)'],
  ['communication-skills', 'Communication Skills'],
  ['working-collaboratively', 'Working Collaboratively'],
  ['creativity-critical-thinking', 'Creativity and Critical thinking'],
  ['equipment-resources', 'Equipment and Resources'],
];

test('all 8 official source-backed areas exist in deterministic source order', () => {
  assert.deepEqual(MS1_AREAS.map((x) => [x.key, x.label]), EXPECTED_AREAS);
  assert.equal(Object.isFrozen(MS1_AREAS), true);
});

test('EE AE ME BE WB exist in deterministic order', () => {
  assert.deepEqual(MS1_LEVELS.map((x) => x.code), ['EE', 'AE', 'ME', 'BE', 'WB']);
  assert.deepEqual(MS1_LEVELS.map((x) => x.label), ['Exceeding Expectations', 'Above Expectations', 'Meeting Expectations', 'Below Expectations', 'Well Below Expectations']);
});

test('generic core contains no MS1 area or level dataset', () => {
  const roots = [
    '../../extension/src/features/teacher-support/registry/workflow-registry.js',
    '../../extension/src/features/teacher-support/state/support-state-resolver.js',
    '../../extension/src/features/teacher-support/controller/support-controller.js',
  ];
  for (const relative of roots) {
    const source = fs.readFileSync(path.join(__dirname, relative), 'utf8');
    assert.doesNotMatch(source, /Academic Achievement|Attitude Towards Learning|Equipment and Resources|Exceeding Expectations|Well Below Expectations/);
  }
});
