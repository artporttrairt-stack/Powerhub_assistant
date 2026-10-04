'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createWorkflowRegistry } = require('../../extension/src/features/teacher-support/registry/workflow-registry.js');

function workflow(id, status, visibleInPicker) {
  return {
    id,
    version: '1.0.0',
    label: id,
    status,
    visibleInPicker,
    navigation: {},
    applicability: () => ({ matched: false, reason: 'fixture' }),
    guidancePackId: `${id}-pack`,
  };
}

test('READY + visibleInPicker appears in picker', () => {
  const r = createWorkflowRegistry();
  r.register(workflow('ready', 'READY', true));
  assert.deepEqual(r.listVisible().map((w) => w.id), ['ready']);
});

test('SOURCE_REQUIRED and hidden READY workflows do not appear', () => {
  const r = createWorkflowRegistry();
  r.register(workflow('source-required', 'SOURCE_REQUIRED', true));
  r.register(workflow('hidden-ready', 'READY', false));
  assert.deepEqual(r.listVisible(), []);
});

test('registry source contains no hardcoded reporting-window list', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../extension/src/features/teacher-support/registry/workflow-registry.js'), 'utf8');
  assert.doesNotMatch(source, /\bMS1\b|\bEOS\b|\bMS2\b|\bEOY\b|Baseline/);
});
