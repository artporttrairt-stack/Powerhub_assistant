const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '../..');
const FIXTURE = path.join(ROOT, 'tests/teacher-support/fixtures/powerteacher-g0.json');
const PROTECTED_BASE = 'bcd9cb7996247c1f32706c9b41449ac947e7bb15';

test('G0 fixture is sanitized and pins the approved semantic evidence', () => {
  const raw = fs.readFileSync(FIXTURE, 'utf8');
  const data = JSON.parse(raw);

  assert.equal(data.platform.routePath, '/classes/final_grades');
  assert.equal(data.filter.queryAloneIsEligibility, false);
  assert.deepEqual(data.nativeScale.codes, ['EE', 'AE', 'ME', 'BE', 'WB']);
  assert.deepEqual(data.liveApprovedAliases, [
    'MS1-Academic',
    'MS1-Attitude',
    'MS1-Behaviour',
    'MS1-Equipment',
  ]);
  assert.ok(data.lookalikes.includes('MS1-TA-Grade'));
  assert.ok(data.lookalikes.includes('MS1-TA-Score'));
  assert.ok(data.lookalikes.includes('MS1-VN-Ranking'));
  assert.ok(data.lookalikes.includes('MS1-Unit1'));
  assert.ok(data.lookalikes.includes('MS1-LSPC'));
  assert.equal(data.selectedCell.rawIdentityStored, false);
  assert.equal(data.classSwitch.routePathBefore, data.classSwitch.routePathAfter);
  assert.equal(data.classSwitch.filterValuePersisted, 'MS1');
  assert.equal(data.classSwitch.courseLabelChanged, true);

  const forbidden = [
    'sectionId',
    'studentId',
    'teacherId',
    'personId',
    'userId',
    'email',
    'cookie',
    'token',
    'auth',
    'scoreValue',
    'gradeValue'
  ];
  const lower = raw.toLowerCase();
  for (const key of forbidden) {
    assert.equal(lower.includes(key.toLowerCase()), false, `fixture contains forbidden identity/value key: ${key}`);
  }
});

test('protected production files are byte-identical to the approved base', () => {
  assert.doesNotThrow(() => {
    execFileSync('git', [
      'diff',
      '--binary',
      '--exit-code',
      PROTECTED_BASE,
      '--',
      'extension/manifest.json',
      'extension/src',
      'extension/assets',
    ], { cwd: ROOT, stdio: 'pipe' });
  });
});
