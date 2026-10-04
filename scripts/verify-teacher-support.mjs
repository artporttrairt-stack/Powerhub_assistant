import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist', 'ms1-lab');
const PROTECTED_BASE = 'bcd9cb7996247c1f32706c9b41449ac947e7bb15';

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function run(label, command, args) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    console.error(`FAIL ${label}`);
    process.exit(result.status || 1);
  }
  console.log(`PASS ${label}`);
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function validateChecksums() {
  const sumsPath = join(DIST, 'SHA256SUMS.txt');
  const lines = readFileSync(sumsPath, 'utf8').trim().split('\n').filter(Boolean);
  for (const line of lines) {
    const separator = line.indexOf('  ');
    if (separator < 1) throw new Error(`Invalid checksum line: ${line}`);
    const expected = line.slice(0, separator);
    const name = line.slice(separator + 2);
    const file = join(DIST, ...name.split('/'));
    if (!existsSync(file)) throw new Error(`Missing generated file: ${name}`);
    const actual = sha256(file);
    if (actual !== expected) throw new Error(`Checksum mismatch: ${name}`);
  }
  console.log(`PASS checksums ${lines.length} files`);
}

run('protected Phase 0 verification', 'npm', ['run', 'verify:phase0']);
run('Teacher Support tests', 'npm', ['run', 'test:teacher-support']);

const syntaxFiles = [
  ...walk(join(ROOT, 'extension', 'modules', 'teacher-support')),
  ...walk(join(ROOT, 'tests', 'teacher-support')),
  join(ROOT, 'tools', 'build-ms1-lab.mjs'),
  join(ROOT, 'scripts', 'run-teacher-support-tests.mjs'),
  join(ROOT, 'scripts', 'verify-teacher-support.mjs'),
]
  .filter((file) => existsSync(file) && (file.endsWith('.js') || file.endsWith('.mjs')))
  .sort();

for (const file of syntaxFiles) {
  run(`syntax ${relative(ROOT, file)}`, process.execPath, ['--check', file]);
}
console.log(`PASS syntax ${syntaxFiles.length} files`);

run('Lab build #1', 'npm', ['run', 'build:ms1-lab']);
validateChecksums();
const firstSums = readFileSync(join(DIST, 'SHA256SUMS.txt'), 'utf8');

run('Lab build #2', 'npm', ['run', 'build:ms1-lab']);
validateChecksums();
const secondSums = readFileSync(join(DIST, 'SHA256SUMS.txt'), 'utf8');
if (secondSums !== firstSums) {
  console.error('FAIL deterministic Lab build: SHA256SUMS.txt changed between identical-source builds');
  process.exit(1);
}
console.log('PASS deterministic Lab build');

run('protected production diff', 'git', [
  'diff',
  '--binary',
  '--exit-code',
  PROTECTED_BASE,
  '--',
  'extension/manifest.json',
  'extension/src',
  'extension/assets',
]);

console.log('PASS verify:teacher-support');
