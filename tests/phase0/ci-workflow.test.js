'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const WORKFLOW = path.join(ROOT, '.github', 'workflows', 'phase0.yml');

test('GitHub Actions enforces the Phase 0 verifier on pushes and pull requests', () => {
  assert.equal(fs.existsSync(WORKFLOW), true, 'Missing .github/workflows/phase0.yml');
  const workflow = fs.readFileSync(WORKFLOW, 'utf8');
  assert.match(workflow, /\bpull_request\s*:/);
  assert.match(workflow, /\bpush\s*:/);
  assert.match(workflow, /node-version:\s*['"]?22['"]?/);
  assert.match(workflow, /run:\s*npm run verify:phase0/);
  assert.doesNotMatch(workflow, /continue-on-error:\s*true/);
});

test('Phase 0 verifier runs again after merges pushed to main', () => {
  const workflow = fs.readFileSync(WORKFLOW, 'utf8');
  const pushBlock = workflow.match(/\bpush\s*:\s*\n\s+branches\s*:\s*\n((?:\s+-\s+[^\n]+\n)+)/);
  assert.ok(pushBlock, 'Missing push.branches block in Phase 0 workflow');
  assert.match(pushBlock[1], /^\s+-\s+main\s*$/m);
});
