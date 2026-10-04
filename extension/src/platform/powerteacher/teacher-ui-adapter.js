(function initPowerTeacherUiAdapter(root) {
  'use strict';

  const UNKNOWN = 'unknown';
  const ALLOWED_ORIGIN = 'https://vas.powerschool.com';
  const TEACHERS_PATH_PREFIX = '/teachers/';

  function textOf(element) {
    return String(element && element.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function isVisible(documentLike, element) {
    if (!element || element.isConnected === false) return false;
    try {
      const view = documentLike && documentLike.defaultView;
      const style = view && typeof view.getComputedStyle === 'function'
        ? view.getComputedStyle(element)
        : null;
      if (style && (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0')) return false;
      if (typeof element.getClientRects === 'function' && element.getClientRects().length === 0) return false;
      return true;
    } catch (_error) {
      return false;
    }
  }

  function query(documentLike, selector) {
    if (!documentLike || typeof documentLike.querySelector !== 'function' || !selector) return null;
    try {
      return documentLike.querySelector(selector);
    } catch (_error) {
      return null;
    }
  }

  function queryAll(scope, selector) {
    if (!scope || typeof scope.querySelectorAll !== 'function' || !selector) return [];
    try {
      return [...scope.querySelectorAll(selector)];
    } catch (_error) {
      return [];
    }
  }

  function hasActiveAncestor(element) {
    let current = element;
    for (let depth = 0; current && depth < 4; depth += 1) {
      if (current.classList && typeof current.classList.contains === 'function' && current.classList.contains('active')) {
        return true;
      }
      current = current.parentElement || null;
    }
    return false;
  }

  function platformVerified(documentLike) {
    const location = documentLike && documentLike.location;
    return String(location && location.origin || '') === ALLOWED_ORIGIN
      && String(location && location.pathname || '').startsWith(TEACHERS_PATH_PREFIX);
  }

  function readTeacherUiState(documentLike, contract) {
    const reasonCodes = [];
    const items = contract && contract.items;
    const platformOk = platformVerified(documentLike);

    if (!platformOk) reasonCodes.push('platform-unverified');
    if (!items) reasonCodes.push('contract-missing');

    const grading = items ? query(documentLike, items.gradingNavigation.selector) : null;
    const standardsNav = items ? query(documentLike, items.standardsNavigation.selector) : null;
    const megaMenu = items ? query(documentLike, items.activeStandardsView.megaMenuSelector) : null;
    const grid = items ? query(documentLike, items.activeStandardsView.gridSelector) : null;
    let gridAmbiguous = false;
    if (items && documentLike && typeof documentLike.querySelectorAll === 'function') {
      try {
        gridAmbiguous = documentLike.querySelectorAll(items.activeStandardsView.gridSelector).length > 1;
      } catch (_error) {
        gridAmbiguous = false;
      }
    }
    const gear = items ? query(documentLike, items.standardsGear.selector) : null;
    const filter = items ? query(documentLike, items.filterInput.selector) : null;
    const filterToggle = items && items.filterToggle ? query(documentLike, items.filterToggle.selector) : null;
    const course = items && items.currentCourseLabel ? query(documentLike, items.currentCourseLabel.selector) : null;

    const gradingAvailable = Boolean(grading && isVisible(documentLike, grading));
    const standardsNavAvailable = Boolean(standardsNav && isVisible(documentLike, standardsNav));
    const gradingActive = Boolean(grading && hasActiveAncestor(grading));
    const standardsSemantics = Boolean(megaMenu && /\bstandards\b/i.test(textOf(megaMenu)));
    const gridVisible = Boolean(grid && isVisible(documentLike, grid));

    let targetView = UNKNOWN;
    if (platformOk && items) {
      if (gradingActive && standardsSemantics) {
        if (gridAmbiguous) reasonCodes.push('standards-grid-ambiguous');
        else if (gridVisible) targetView = 'standards';
        else reasonCodes.push('standards-grid-missing');
      } else {
        targetView = 'other';
      }
    }

    let filterVisible = UNKNOWN;
    let filterQuery = UNKNOWN;
    if (filter) {
      filterVisible = isVisible(documentLike, filter);
      filterQuery = String(filter.value || '');
    }

    let workflowMarkerPresent = UNKNOWN;
    let workflowMarkerKey = null;
    let workflowMarkerEvidence = [];
    if (grid) {
      const markerContract = items && items.ms1ResultMarker;
      const required = markerContract && Array.isArray(markerContract.requiredSemanticIdentifiers)
        ? markerContract.requiredSemanticIdentifiers
        : [];
      const candidates = markerContract ? queryAll(grid, markerContract.candidateSelector) : [];
      const visibleText = candidates
        .filter((candidate) => isVisible(documentLike, candidate))
        .map((candidate) => textOf(candidate).trim())
        .filter(Boolean);
      const normalizeMarker = (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]+/g, '');
      const visibleKeys = new Set(visibleText.map(normalizeMarker));
      const aliases = markerContract && markerContract.semanticAliases || {};
      workflowMarkerEvidence = required.filter((identifier) => {
        const accepted = [identifier, ...(aliases[identifier] || [])];
        return accepted.some((candidate) => visibleKeys.has(normalizeMarker(candidate)));
      });
      if (required.length > 0 && workflowMarkerEvidence.length === required.length) {
        workflowMarkerPresent = true;
        workflowMarkerKey = 'ms1-strands';
      } else if (workflowMarkerEvidence.length === 0) {
        workflowMarkerPresent = false;
      } else {
        workflowMarkerPresent = UNKNOWN;
        reasonCodes.push('workflow-marker-incomplete');
      }
    }

    const body = documentLike && documentLike.body;
    const supportMountAvailable = Boolean(body && body.isConnected !== false);

    return Object.freeze({
      platformVerified: platformOk,
      sectionKey: UNKNOWN,
      targetView,
      gradingNavAvailable: gradingAvailable,
      standardsNavAvailable,
      settingsAvailable: Boolean(gear && isVisible(documentLike, gear)),
      filterVisible,
      filterQuery,
      filterToggleAvailable: Boolean(filterToggle && isVisible(documentLike, filterToggle)),
      filterToggleLabel: filterToggle && isVisible(documentLike, filterToggle) ? textOf(filterToggle) : null,
      workflowMarkerPresent,
      workflowMarkerKey,
      workflowMarkerEvidence: Object.freeze([...workflowMarkerEvidence]),
      courseLabel: course && isVisible(documentLike, course) ? textOf(course) : UNKNOWN,
      supportMountAvailable,
      reasonCodes: Object.freeze(reasonCodes),
    });
  }

  const api = Object.freeze({ readTeacherUiState });
  if (root) {
    root.PSQM = root.PSQM || {};
    root.PSQM.powerTeacherUiAdapter = api;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
