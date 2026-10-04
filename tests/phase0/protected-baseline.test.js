'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const INVENTORY = path.join(ROOT, 'verification', 'SHA256_INVENTORY.txt');

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

test('protected 8J-R2 extension files remain byte-identical except manifest.json', () => {
  const entries = fs.readFileSync(INVENTORY, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^([a-f0-9]{64})\s+\.\/(.+)$/i);
      assert.ok(match, `Unparseable inventory line: ${line}`);
      return { digest: match[1].toLowerCase(), relativePath: match[2] };
    })
    .filter(({ relativePath }) => relativePath.startsWith('extension/'))
    .filter(({ relativePath }) => relativePath !== 'extension/manifest.json');

  assert.ok(entries.length > 0, 'Expected protected extension entries in inventory.');

  for (const { digest, relativePath } of entries) {
    const filePath = path.join(ROOT, relativePath);
    assert.ok(fs.existsSync(filePath), `Protected baseline file is missing: ${relativePath}`);
    assert.equal(sha256(filePath), digest, `Protected baseline drift: ${relativePath}`);
  }
});
