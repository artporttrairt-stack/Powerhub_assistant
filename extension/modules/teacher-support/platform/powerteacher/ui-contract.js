(function initPowerTeacherUiContract(root) {
  'use strict';

  const ALLOWED_ORIGIN = 'https://vas.powerschool.com';
  const TEACHERS_PATH_PREFIX = '/teachers/';
  const SAFE_ROUTE_SEGMENTS = Object.freeze(new Set([
    'assignments',
    'classes',
    'final_grades',
    'grading',
    'scores',
    'standards',
    'students',
  ]));

  const SELECTORS = Object.freeze({
    gradingNav: '#sidebar-charms-grading',
    standardsNav: '#grading-standards-link',
    standardsContainer: '#section-mega-menu',
    standardsGrid: '#standard-final-grades',
    specialFunctions: '#special-functions',
    filterToggle: '#hide-filter',
    filterInput: '#simple-search-standard-final-grades',
    courseLabel: '.course-name',
    standardHeader: 'th.standard-column-header.standard-col',
    standardCell: 'td.standard-col',
    nativeInspector: 'body.score-inspector-score',
    nativeScoreChoice: '[role="option"], [role="button"]',
  });

  const TARGET_SELECTORS = Object.freeze({
    'grading-nav': SELECTORS.gradingNav,
    'standards-nav': SELECTORS.standardsNav,
    'special-functions': SELECTORS.specialFunctions,
    'filter-input': SELECTORS.filterInput,
  });

  function normalizeText(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function sanitizeRoutePath(rawPath) {
    if (!rawPath) return '';
    const normalized = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    return normalized
      .split('/')
      .map((segment, index) => {
        if (index === 0 || !segment) return segment;
        return SAFE_ROUTE_SEGMENTS.has(segment.toLowerCase()) ? segment.toLowerCase() : ':redacted';
      })
      .join('/');
  }

  function readRoutePath(locationLike) {
    const hash = String(locationLike && locationLike.hash || '').replace(/^#/, '');
    if (!hash) return '';
    const queryIndex = hash.indexOf('?');
    return sanitizeRoutePath(queryIndex >= 0 ? hash.slice(0, queryIndex) : hash);
  }

  function isAllowedLocation(locationLike) {
    const origin = String(locationLike && locationLike.origin || '');
    const pathname = String(locationLike && locationLike.pathname || '');
    return origin === ALLOWED_ORIGIN && pathname.startsWith(TEACHERS_PATH_PREFIX);
  }

  function isComputedVisible(node, getComputedStyle) {
    if (!node || typeof getComputedStyle !== 'function') return false;
    const style = getComputedStyle(node);
    if (!style || style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    if (typeof node.getClientRects === 'function' && node.getClientRects().length === 0) return false;
    return true;
  }

  const api = Object.freeze({
    ALLOWED_ORIGIN,
    TEACHERS_PATH_PREFIX,
    SELECTORS,
    TARGET_SELECTORS,
    normalizeText,
    readRoutePath,
    isAllowedLocation,
    isComputedVisible,
  });

  if (root) {
    root.PSQM = root.PSQM || {};
    root.PSQM.teacherSupport = root.PSQM.teacherSupport || {};
    root.PSQM.teacherSupport.powerTeacherUiContract = api;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
