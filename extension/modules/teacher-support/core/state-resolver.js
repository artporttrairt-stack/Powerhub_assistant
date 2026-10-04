(function initSupportStateResolver(root) {
  'use strict';

  const KIND_TO_STATE = Object.freeze({
    reference: 'REFERENCE',
    guidance: 'GUIDANCE',
    'context-unverified': 'CONTEXT_UNVERIFIED',
    'context-ready': 'CONTEXT_READY',
  });

  function result(state, reason) {
    return Object.freeze({ state, reason });
  }

  function resolveSupportState({ selection, workflowDecision, mode } = {}) {
    if (mode === 'stopped') return result('STOPPED', 'stopped');

    const status = selection && selection.status || 'none';
    if (status === 'ambiguous') return result('AMBIGUOUS', 'ambiguous-workflow');
    if (status !== 'matched' || !selection || !selection.pack) return result('DORMANT', 'no-workflow');

    if (mode === 'quiet') return result('QUIET', 'quiet');

    const kind = workflowDecision && workflowDecision.kind;
    const state = KIND_TO_STATE[kind];
    if (!state) return result('CONTEXT_UNVERIFIED', workflowDecision && workflowDecision.reason || 'workflow-decision-unverified');
    return result(state, workflowDecision && workflowDecision.reason || kind);
  }

  if (root) {
    root.PSQM = root.PSQM || {};
    root.PSQM.teacherSupport = root.PSQM.teacherSupport || {};
    root.PSQM.teacherSupport.resolveSupportState = resolveSupportState;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { resolveSupportState };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
