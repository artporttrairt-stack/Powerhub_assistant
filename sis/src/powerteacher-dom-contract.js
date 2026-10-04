(function (root) {
  'use strict';

  const STATUS = Object.freeze({
    FOUND: 'FOUND',
    MISSING: 'MISSING',
    AMBIGUOUS: 'AMBIGUOUS',
    UNVERIFIED: 'UNVERIFIED',
  });

  function queryUnique(scope, selector) {
    if (!scope || typeof scope.querySelectorAll !== 'function' || typeof selector !== 'string' || !selector) {
      return Object.freeze({ status: STATUS.UNVERIFIED, node: null, count: null });
    }
    const nodes = Array.from(scope.querySelectorAll(selector));
    if (nodes.length === 1) return Object.freeze({ status: STATUS.FOUND, node: nodes[0], count: 1 });
    if (nodes.length === 0) return Object.freeze({ status: STATUS.MISSING, node: null, count: 0 });
    return Object.freeze({ status: STATUS.AMBIGUOUS, node: null, count: nodes.length });
  }

  const api = Object.freeze({ STATUS, queryUnique });
  root.SIS_POWERTEACHER_DOM_CONTRACT = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
