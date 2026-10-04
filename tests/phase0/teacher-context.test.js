'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parsePowerTeacherLocation } = require('../../extension/src/platform/powerteacher/teacher-context.js');

function loc(url) {
  const u = new URL(url);
  return { origin: u.origin, pathname: u.pathname, hash: u.hash, search: u.search, href: u.href };
}

test('rejects PowerHub origin as PowerTeacher', () => {
  const result = parsePowerTeacherLocation(loc('https://vas.educator.powerschool.com/teachers/index.html'));
  assert.equal(result.platformVerified, false);
  assert.equal(result.reason, 'origin-mismatch');
});

test('rejects valid origin outside /teachers/', () => {
  const result = parsePowerTeacherLocation(loc('https://vas.powerschool.com/admin/home.html'));
  assert.equal(result.platformVerified, false);
  assert.equal(result.reason, 'path-mismatch');
});

test('returns only sanitized route path and section presence for valid PowerTeacher URL', () => {
  const result = parsePowerTeacherLocation(loc('https://vas.powerschool.com/teachers/index.html#/classes/assignments?sectionId=9750'));
  assert.equal(result.platform, 'powerteacher');
  assert.equal(result.platformVerified, true);
  assert.equal(result.originVerified, true);
  assert.equal(result.pathVerified, true);
  assert.equal(result.routePath, '/classes/assignments');
  assert.equal(result.sectionPresent, true);
  assert.equal(result.reason, 'verified-powerteacher-location');
  assert.equal(Object.isFrozen(result), true);
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes('9750'), false);
  assert.equal(serialized.includes('sectionId'), false);
  assert.equal(serialized.includes('https://'), false);
  assert.equal(serialized.includes('?'), false);
});

test('valid PowerTeacher route without sectionId reports sectionPresent false', () => {
  const result = parsePowerTeacherLocation(loc('https://vas.powerschool.com/teachers/index.html#/classes/assignments'));
  assert.equal(result.platformVerified, true);
  assert.equal(result.routePath, '/classes/assignments');
  assert.equal(result.sectionPresent, false);
});

test('redacts identifier-like hash path segments from routePath', () => {
  const result = parsePowerTeacherLocation(loc('https://vas.powerschool.com/teachers/index.html#/classes/9750/assignments/550e8400-e29b-41d4-a716-446655440000?studentId=12345'));
  assert.equal(result.platformVerified, true);
  assert.equal(result.routePath, '/classes/:redacted/assignments/:redacted');
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes('9750'), false);
  assert.equal(serialized.includes('550e8400-e29b-41d4-a716-446655440000'), false);
  assert.equal(serialized.includes('12345'), false);
  assert.equal(serialized.includes('studentId'), false);
});
