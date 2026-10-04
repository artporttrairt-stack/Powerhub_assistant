(function initPowerTeacherContext(root) {
  'use strict';

  const ALLOWED_ORIGIN = 'https://vas.powerschool.com';
  const TEACHERS_PATH_PREFIX = '/teachers/';

  function makeContext({ originVerified, pathVerified, routePath, sectionPresent, reason }) {
    const platformVerified = originVerified && pathVerified;
    return Object.freeze({
      platform: platformVerified ? 'powerteacher' : 'unknown',
      platformVerified,
      originVerified,
      pathVerified,
      routePath,
      sectionPresent,
      reason,
    });
  }

  function parseHashRoute(hashValue) {
    const hash = String(hashValue || '').replace(/^#/, '');
    if (!hash) return { routePath: '', sectionPresent: false };
    const queryIndex = hash.indexOf('?');
    const rawPath = queryIndex >= 0 ? hash.slice(0, queryIndex) : hash;
    const rawQuery = queryIndex >= 0 ? hash.slice(queryIndex + 1) : '';
    const routePath = rawPath ? (rawPath.startsWith('/') ? rawPath : `/${rawPath}`) : '';
    const sectionPresent = new URLSearchParams(rawQuery).has('sectionId');
    return { routePath, sectionPresent };
  }

  function parsePowerTeacherLocation(locationLike) {
    const origin = String(locationLike && locationLike.origin || '');
    const pathname = String(locationLike && locationLike.pathname || '');
    const originVerified = origin === ALLOWED_ORIGIN;
    const pathVerified = pathname.startsWith(TEACHERS_PATH_PREFIX);
    const { routePath, sectionPresent } = parseHashRoute(locationLike && locationLike.hash);

    let reason = 'unverified-powerteacher-location';
    if (!originVerified) reason = 'origin-mismatch';
    else if (!pathVerified) reason = 'path-mismatch';
    else reason = 'verified-powerteacher-location';

    return makeContext({ originVerified, pathVerified, routePath, sectionPresent, reason });
  }

  const api = Object.freeze({ parseLocation: parsePowerTeacherLocation });

  if (root) {
    root.PSQM = root.PSQM || {};
    root.PSQM.powerTeacherContext = api;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parsePowerTeacherLocation };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
