const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '../../..');
const BUILDER = path.join(ROOT, 'tools/build-ms1-lab.mjs');
const DIST = path.join(ROOT, 'dist/ms1-lab');

before(() => {
  const result = spawnSync(process.execPath, [BUILDER], { cwd: ROOT, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(['Lab builder failed.', result.stdout, result.stderr].filter(Boolean).join('\n'));
  }
});

test('standalone Lab manifest is exact, isolated, and has no production runtime graph', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(DIST, 'manifest.json'), 'utf8'));
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.name, 'Hub Assistant — MS1 Lab');
  assert.equal(manifest.version, '0.1.0');
  assert.deepEqual(manifest.permissions || [], []);
  assert.deepEqual(manifest.host_permissions || [], ['https://vas.powerschool.com/teachers/*']);
  assert.equal(manifest.background, undefined);
  assert.equal(manifest.action, undefined);
  assert.equal(manifest.content_scripts.length, 1);
  assert.deepEqual(manifest.content_scripts[0].matches, ['https://vas.powerschool.com/teachers/*']);
  assert.deepEqual(manifest.content_scripts[0].css, ['modules/teacher-support/ui/teacher-support.css']);
  assert.equal(manifest.content_scripts[0].js.at(-1), 'lab-bootstrap.js');
  assert.equal(manifest.content_scripts[0].js.some((file) => file.startsWith('src/')), false);
  assert.equal(manifest.content_scripts[0].js.some((file) => file.includes('powerhub')), false);
});

test('Lab copies one canonical generic engine, one MS1 pack, and local robot asset', () => {
  assert.equal(fs.existsSync(path.join(DIST, 'modules/teacher-support/core/workflow-registry.js')), true);
  assert.equal(fs.existsSync(path.join(DIST, 'modules/teacher-support/runtime/support-runtime.js')), true);
  assert.equal(fs.existsSync(path.join(DIST, 'modules/teacher-support/packs/cam-primary/ms1/index.js')), true);
  assert.equal(fs.existsSync(path.join(DIST, 'assets/robot-assistant.png')), true);
  assert.equal(fs.existsSync(path.join(DIST, 'src')), false);

  const manifest = JSON.parse(fs.readFileSync(path.join(DIST, 'manifest.json'), 'utf8'));
  assert.deepEqual(manifest.web_accessible_resources, [{
    resources: ['assets/robot-assistant.png'],
    matches: ['https://vas.powerschool.com/teachers/*'],
  }]);
});

test('generated bootstrap wires only canonical modules and explicit trusted Lab pack selection', () => {
  const bootstrap = fs.readFileSync(path.join(DIST, 'lab-bootstrap.js'), 'utf8');
  assert.match(bootstrap, /createWorkflowRegistry/);
  assert.match(bootstrap, /createCamPrimaryMs1Pack/);
  assert.match(bootstrap, /createPowerTeacherUiAdapter/);
  assert.match(bootstrap, /createSupportController/);
  assert.match(bootstrap, /createSupportRuntime/);
  assert.match(bootstrap, /requestedPackId:\s*['"]cam-primary\.ms1['"]/);
  assert.equal(bootstrap.includes('extension/src/'), false);
  assert.equal(bootstrap.includes('teacherSupportLifecycle'), false);
});

test('BUILD_INFO is timestamp-free and checksums cover every generated file except themselves', () => {
  const infoText = fs.readFileSync(path.join(DIST, 'BUILD_INFO.json'), 'utf8');
  const info = JSON.parse(infoText);
  assert.equal(info.protectedBase, 'bcd9cb7996247c1f32706c9b41449ac947e7bb15');
  assert.equal(info.sourceSpec, 'docs/superpowers/specs/2026-10-05-teacher-support-generic-engine-isolated-lab-design.md');
  assert.equal(info.sourcePlan, 'docs/superpowers/plans/2026-10-05-teacher-support-generic-engine-isolated-lab.md');
  assert.equal(info.labVersion, '0.1.0');
  assert.match(info.sourceCommit, /^[0-9a-f]{40}$/);
  assert.equal(/timestamp|builtAt|createdAt/i.test(infoText), false);

  const sums = fs.readFileSync(path.join(DIST, 'SHA256SUMS.txt'), 'utf8').trim().split('\n');
  assert.equal(sums.some((line) => line.endsWith('  SHA256SUMS.txt')), false);
  const paths = sums.map((line) => line.slice(line.indexOf('  ') + 2));
  assert.deepEqual(paths, [...paths].sort());
  assert.ok(paths.includes('manifest.json'));
  assert.ok(paths.includes('BUILD_INFO.json'));
  assert.ok(paths.includes('lab-bootstrap.js'));
});

test('builder never creates or overwrites a Store ZIP path', () => {
  const top = fs.readdirSync(ROOT);
  assert.equal(top.some((name) => /ms1.*\.zip$/i.test(name)), false);
  assert.equal(fs.existsSync(path.join(DIST, 'Hub_Assistant.zip')), false);
});
