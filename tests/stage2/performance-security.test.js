'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function walk(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name); const stat = fs.statSync(full);
    if (stat.isDirectory()) out.push(...walk(full)); else if (full.endsWith('.js')) out.push(full);
  }
  return out;
}
const STAGE2_ROOTS = [
  path.join(__dirname, '../../extension/src/features/teacher-support'),
  path.join(__dirname, '../../extension/src/platform/powerteacher'),
];
const files = STAGE2_ROOTS.flatMap((dir) => walk(dir));
const source = files.map((file) => `\n// ${file}\n${fs.readFileSync(file, 'utf8')}`).join('\n');

test('Stage 2 adds no broad observer or polling architecture', () => {
  assert.doesNotMatch(source, /new\s+MutationObserver\s*\(/);
  assert.doesNotMatch(source, /setInterval\s*\(/);
});

test('guidance packs perform no network or sensitive persistence', () => {
  const packRoot = path.join(__dirname, '../../extension/src/features/teacher-support/guidance-packs');
  const packSource = walk(packRoot).map((file) => fs.readFileSync(file, 'utf8')).join('\n');
  assert.doesNotMatch(packSource, /\bfetch\s*\(|XMLHttpRequest|WebSocket|navigator\.sendBeacon/);
  assert.doesNotMatch(packSource, /localStorage|sessionStorage|document\.cookie|indexedDB/);
});

test('Stage 2 never triggers synthetic consequential native actions', () => {
  assert.doesNotMatch(source, /\.click\s*\(|dispatchEvent\s*\(|\.submit\s*\(/);
});

test('PowerTeacher querySelectorAll use is scoped to semantic result markers', () => {
  const adapter = fs.readFileSync(path.join(__dirname, '../../extension/src/platform/powerteacher/teacher-ui-adapter.js'), 'utf8');
  const calls = [...adapter.matchAll(/querySelectorAll\(([^)]*)\)/g)].map((m) => m[1]);
  assert.ok(calls.length <= 2, `unexpected querySelectorAll growth: ${calls.length}`);
  assert.doesNotMatch(adapter, /querySelectorAll\s*\(\s*['"]\*['"]\s*\)/);
});

test('20 workflow registrations remain data-only with no watcher/listener multiplication', () => {
  const registrySource = fs.readFileSync(path.join(__dirname, '../../extension/src/features/teacher-support/registry/workflow-registry.js'), 'utf8');
  assert.doesNotMatch(registrySource, /addEventListener|MutationObserver|setInterval|setTimeout/);
});
