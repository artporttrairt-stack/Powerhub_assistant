(function (root) {
  'use strict';

  const TARGET_SELECTOR = '#navPowerTeacherPro';

  function resolvePowerTeacherProTarget(domRoot) {
    if (!domRoot || typeof domRoot.querySelectorAll !== 'function') {
      return { status: 'MISSING', target: null };
    }
    const matches = domRoot.querySelectorAll(TARGET_SELECTOR);
    if (matches.length === 0) return { status: 'MISSING', target: null };
    if (matches.length > 1) return { status: 'AMBIGUOUS', target: null };
    return { status: 'FOUND', target: matches[0] };
  }

  const api = Object.freeze({
    TARGET_SELECTOR,
    resolvePowerTeacherProTarget,
  });

  root.SIS_GRADE_ENTRY_HANDOFF = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
