(function initTeacherSupportStateResolver(root) {
  'use strict';

  const STATES = Object.freeze({
    NAVIGATION_REQUIRED: 'NAVIGATION_REQUIRED',
    FILTER_REQUIRED: 'FILTER_REQUIRED',
    FILTER_QUERY_REQUIRED: 'FILTER_QUERY_REQUIRED',
    WORKFLOW_CONTEXT_READY: 'WORKFLOW_CONTEXT_READY',
    QUIET: 'QUIET',
    UNVERIFIED: 'UNVERIFIED',
  });

  function normalize(value) {
    return String(value == null ? '' : value).trim().toLowerCase();
  }

  function resolveSupportState({ workflow, uiState, context: _context, mode } = {}) {
    if (mode === 'quiet') return STATES.QUIET;
    if (!workflow || !uiState || uiState.platformVerified !== true) return STATES.UNVERIFIED;

    const navigation = workflow.navigation || {};
    const targetView = navigation.targetView;
    const requiredQuery = navigation.filterQuery;

    if (!targetView || !requiredQuery) return STATES.UNVERIFIED;
    if (uiState.targetView === 'unknown') return STATES.UNVERIFIED;
    if (uiState.targetView !== targetView) return STATES.NAVIGATION_REQUIRED;

    if (uiState.filterVisible === 'unknown') return STATES.UNVERIFIED;
    if (uiState.filterVisible !== true) return STATES.FILTER_REQUIRED;

    if (uiState.filterQuery === 'unknown') return STATES.UNVERIFIED;
    if (normalize(uiState.filterQuery) !== normalize(requiredQuery)) return STATES.FILTER_QUERY_REQUIRED;

    if (uiState.workflowMarkerPresent === true) return STATES.WORKFLOW_CONTEXT_READY;
    return STATES.UNVERIFIED;
  }

  const api = Object.freeze({ STATES, resolveSupportState });
  if (root) {
    root.PSQM = root.PSQM || {};
    root.PSQM.teacherSupportStateResolver = api;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
