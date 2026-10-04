import {
  cpSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const DIST = resolve(ROOT, 'dist/ms1-lab');
const MODULE_SOURCE = resolve(ROOT, 'extension/modules/teacher-support');
const MODULE_TARGET = resolve(DIST, 'modules/teacher-support');
const ASSET_SOURCE = resolve(ROOT, 'extension/assets/robot-assistant.png');
const ASSET_TARGET = resolve(DIST, 'assets/robot-assistant.png');

const PROTECTED_BASE = 'bcd9cb7996247c1f32706c9b41449ac947e7bb15';
const SOURCE_SPEC = 'docs/superpowers/specs/2026-10-05-teacher-support-generic-engine-isolated-lab-design.md';
const SOURCE_PLAN = 'docs/superpowers/plans/2026-10-05-teacher-support-generic-engine-isolated-lab.md';
const LAB_VERSION = '0.1.0';
const POWERTEACHER_MATCH = 'https://vas.powerschool.com/teachers/*';

const SCRIPT_ORDER = Object.freeze([
  'modules/teacher-support/core/workflow-registry.js',
  'modules/teacher-support/core/state-resolver.js',
  'modules/teacher-support/core/support-controller.js',
  'modules/teacher-support/platform/powerteacher/ui-contract.js',
  'modules/teacher-support/platform/powerteacher/ui-adapter.js',
  'modules/teacher-support/packs/cam-primary/ms1/sources.js',
  'modules/teacher-support/packs/cam-primary/ms1/content/official.js',
  'modules/teacher-support/packs/cam-primary/ms1/content/guidance.js',
  'modules/teacher-support/packs/cam-primary/ms1/content/locale.js',
  'modules/teacher-support/packs/cam-primary/ms1/content/examples.js',
  'modules/teacher-support/packs/cam-primary/ms1/applicability.js',
  'modules/teacher-support/packs/cam-primary/ms1/index.js',
  'modules/teacher-support/ui/entry-button.js',
  'modules/teacher-support/ui/assistant-panel.js',
  'modules/teacher-support/ui/score-inspector.js',
  'modules/teacher-support/runtime/support-runtime.js',
  'lab-bootstrap.js',
]);

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function walk(dir) {
  const files = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function sourceCommit() {
  return execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim();
}

function bootstrapSource() {
  return `(function startMs1Lab(root) {
  'use strict';

  const ns = root.PSQM && root.PSQM.teacherSupport;
  if (!ns) throw new Error('Teacher Support modules are unavailable.');

  const registry = ns.createWorkflowRegistry();
  registry.register(ns.camPrimaryMs1.pack.createCamPrimaryMs1Pack());

  const adapter = ns.createPowerTeacherUiAdapter({
    document: root.document,
    location: root.location,
    getComputedStyle: root.getComputedStyle.bind(root),
  });

  const controller = ns.createSupportController({
    registry,
    resolver: ns.resolveSupportState,
  });

  const runtime = ns.createSupportRuntime({
    window: root,
    document: root.document,
    adapter,
    controller,
    ui: {
      createEntryButton: ns.createEntryButton,
      createAssistantPanel: ns.createAssistantPanel,
      createScoreInspector: ns.createScoreInspector,
    },
    contextProvider: () => Object.freeze({
      requestedPackId: 'cam-primary.ms1',
      subject: null,
    }),
    assetUrl: root.chrome.runtime.getURL('assets/robot-assistant.png'),
  });

  ns.labRuntime = runtime;
  runtime.start();
})(globalThis);
`;
}

rmSync(DIST, { recursive: true, force: true });
mkdirSync(MODULE_TARGET, { recursive: true });
mkdirSync(dirname(ASSET_TARGET), { recursive: true });

cpSync(MODULE_SOURCE, MODULE_TARGET, { recursive: true });
cpSync(ASSET_SOURCE, ASSET_TARGET);

writeFileSync(resolve(DIST, 'lab-bootstrap.js'), bootstrapSource(), 'utf8');

writeJson(resolve(DIST, 'manifest.json'), {
  manifest_version: 3,
  name: 'Hub Assistant — MS1 Lab',
  version: LAB_VERSION,
  description: 'Isolated Teacher Support development Lab for authorized PowerTeacher validation.',
  permissions: [],
  host_permissions: [POWERTEACHER_MATCH],
  content_scripts: [{
    matches: [POWERTEACHER_MATCH],
    js: SCRIPT_ORDER,
    css: ['modules/teacher-support/ui/teacher-support.css'],
    run_at: 'document_idle',
  }],
  web_accessible_resources: [{
    resources: ['assets/robot-assistant.png'],
    matches: [POWERTEACHER_MATCH],
  }],
});

writeJson(resolve(DIST, 'BUILD_INFO.json'), {
  protectedBase: PROTECTED_BASE,
  sourceSpec: SOURCE_SPEC,
  sourcePlan: SOURCE_PLAN,
  sourceCommit: sourceCommit(),
  labVersion: LAB_VERSION,
});

const generated = walk(DIST)
  .filter((file) => relative(DIST, file).replaceAll('\\', '/') !== 'SHA256SUMS.txt')
  .map((file) => ({
    file,
    name: relative(DIST, file).replaceAll('\\', '/'),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const checksumText = generated
  .map(({ file, name }) => `${sha256(file)}  ${name}`)
  .join('\n') + '\n';
writeFileSync(resolve(DIST, 'SHA256SUMS.txt'), checksumText, 'utf8');

console.log(`Built ${DIST}`);
console.log(`Files: ${generated.length + 1}`);
