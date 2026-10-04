(function (root) {
  'use strict';

  function normalize(lang) {
    const normalized = typeof lang === 'string'
      ? lang.trim().toLowerCase().replace(/_/g, '-')
      : '';
    if (normalized === 'en' || normalized.startsWith('en-')) return 'en';
    if (normalized === 'vi' || normalized.startsWith('vi-')) return 'vi';
    return null;
  }

  function resolve(documentLike) {
    return normalize(documentLike?.documentElement?.lang);
  }

  const api = Object.freeze({ normalize, resolve });
  root.SIS_POWERTEACHER_LOCALE = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
