(function (root) {
  'use strict';

  const dom = root.SIS_POWERTEACHER_DOM_CONTRACT
    || (typeof require === 'function' ? require('./powerteacher-dom-contract.js') : null);
  if (!dom) return;

  const CONTRACT = Object.freeze({
    origin: 'https://vas.powerschool.com',
    pathname: '/teachers/index.html',
    rootSelector: '#content-main',
  });

  function matchesLocation({ origin, pathname } = {}) {
    return origin === CONTRACT.origin && pathname === CONTRACT.pathname;
  }

  function classify({ origin, pathname, document: documentLike } = {}) {
    if (!matchesLocation({ origin, pathname })) {
      return Object.freeze({ status: dom.STATUS.UNVERIFIED, surface: null });
    }
    const rootResult = dom.queryUnique(documentLike, CONTRACT.rootSelector);
    if (rootResult.status !== dom.STATUS.FOUND) {
      return Object.freeze({ status: rootResult.status, surface: null });
    }
    return Object.freeze({ status: dom.STATUS.FOUND, surface: 'powerteacher-shell' });
  }

  const api = Object.freeze({ CONTRACT, matchesLocation, classify });
  root.SIS_POWERTEACHER_SURFACE = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
