'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const RUNTIME_FILES = [
  'extension/src/platform/powerteacher/teacher-context.js',
  'extension/src/features/teacher-support/guidance/pack-registry.js',
  'extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/applicability.js',
  'extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/sources.js',
  'extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/pack.js',
  'extension/src/features/teacher-support/runtime/support-lifecycle.js',
  'extension/src/core/bootstrap/teacher-support-content.js',
];
const FORBIDDEN = [
  'MutationObserver', 'setInterval', 'setTimeout(', 'requestAnimationFrame(',
  'addEventListener(', 'document.querySelectorAll(', 'document.querySelector(',
  'fetch(', 'XMLHttpRequest', 'WebSocket', 'chrome.storage.local.set',
  'chrome.storage.session.set', '.click(', 'dispatchEvent('
];

function violations(source) {
  return FORBIDDEN.filter((token) => source.includes(token));
}

test('static matcher detects controlled observer and native-click fixture violations', () => {
  const found = violations('new MutationObserver(cb); button.click();');
  assert.ok(found.includes('MutationObserver'));
  assert.ok(found.includes('.click('));
});

test('Phase 0 Teacher Support runtime has no observers timers listeners storage network DOM scans or native actions', () => {
  for (const relativePath of RUNTIME_FILES) {
    const source = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
    assert.deepEqual(violations(source), [], `${relativePath} contains forbidden token(s)`);
    assert.equal(/console\.(?:log|debug)\s*\(/.test(source), false, `${relativePath} contains debug logging`);
    assert.equal(source.includes('9750'), false, `${relativePath} leaks fixture section id`);
  }
});

test('PowerTeacher runtime contains only the allowed full origin constant and no raw full URLs', () => {
  const urls = [];
  for (const relativePath of RUNTIME_FILES) {
    const source = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
    urls.push(...(source.match(/https:\/\/[^'"`\s)]+/g) || []).map((url) => ({ relativePath, url })));
  }
  assert.deepEqual(urls, [{ relativePath: 'extension/src/platform/powerteacher/teacher-context.js', url: 'https://vas.powerschool.com' }]);
});
