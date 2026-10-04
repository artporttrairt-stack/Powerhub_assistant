const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../../..');
const MODULE_ROOT = path.join(ROOT, 'extension/modules/teacher-support');

function walk(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir).sort()) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

test('canonical Teacher Support runtime has no forbidden recurring, network, storage, or native-action primitives', () => {
  const runtimeFiles = walk(MODULE_ROOT).filter((file) => file.endsWith('.js'));
  const source = runtimeFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
  for (const token of [
    'MutationObserver',
    'setInterval',
    'XMLHttpRequest',
    'WebSocket',
    'navigator.sendBeacon',
    'localStorage',
    'sessionStorage',
    'chrome.storage',
    '.click(',
    'dispatchEvent(',
  ]) {
    assert.equal(source.includes(token), false, token);
  }
  assert.equal(/\bfetch\s*\(/.test(source), false, 'fetch(');
});

test('generic core runtime UI and adapter contain no MS1 academic policy constants', () => {
  const genericRoots = ['core', 'runtime', 'ui', 'platform'].map((name) => path.join(MODULE_ROOT, name));
  const source = genericRoots
    .flatMap((dir) => walk(dir))
    .filter((file) => file.endsWith('.js'))
    .map((file) => fs.readFileSync(file, 'utf8'))
    .join('\n');

  for (const token of [
    'MS1-Academic',
    'MS1-Attitude',
    'MS1-Behaviour',
    'MS1-Equipment',
    'MS1-TA-Grade',
    'MS1-TA-Score',
    'MS1-VN-Ranking',
    'Academic Achievement',
    'Completion of classwork/Homework',
  ]) {
    assert.equal(source.includes(token), false, token);
  }
});

test('runtime owns only bounded route listeners and no document-wide native click listener', () => {
  const source = fs.readFileSync(path.join(MODULE_ROOT, 'runtime/support-runtime.js'), 'utf8');
  assert.equal((source.match(/addEventListener\('hashchange'/g) || []).length, 1);
  assert.equal((source.match(/addEventListener\('popstate'/g) || []).length, 1);
  assert.equal(source.includes("document.addEventListener('click'"), false);
  assert.equal(source.includes('document.addEventListener("click"'), false);
  assert.equal(source.includes('requestAnimationFrame'), false);
});

test('Teacher Support CSS has no infinite animation', () => {
  const css = fs.readFileSync(path.join(MODULE_ROOT, 'ui/teacher-support.css'), 'utf8');
  assert.equal(/\binfinite\b/i.test(css), false);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test('canonical runtime has no Angular/internal-service or consequential native action vocabulary', () => {
  const files = walk(MODULE_ROOT).filter((file) => file.endsWith('.js'));
  const source = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
  for (const token of [
    '$scope',
    'angular.element',
    'Recalculate Final Grades',
    'Publish Grades',
    'Fill Grades',
  ]) {
    assert.equal(source.includes(token), false, token);
  }
});
