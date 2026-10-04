(function initSupportController(root) {
  'use strict';

  function createSupportController({ registry, resolver }) {
    if (!registry || typeof registry.select !== 'function') {
      throw new TypeError('registry.select(context) is required.');
    }
    if (typeof resolver !== 'function') {
      throw new TypeError('resolver is required.');
    }

    function matchedPack(context) {
      const selection = registry.select(context || {});
      return selection.status === 'matched' && selection.pack ? selection.pack : null;
    }

    function evaluate({ context = {}, uiState = {}, mode = 'active' } = {}) {
      const selection = registry.select(context);
      let workflowDecision = null;

      if (selection.status === 'matched' && selection.pack) {
        const policy = selection.pack.decideWorkflow;
        workflowDecision = typeof policy === 'function'
          ? policy({ uiState, context, mode })
          : Object.freeze({
              kind: 'context-unverified',
              reason: 'workflow-policy-unavailable',
              viewModel: null,
            });
      }

      const resolved = resolver({ selection, workflowDecision, uiState, context, mode });
      const packId = selection.status === 'matched' && selection.pack ? selection.pack.id : null;
      const viewModel = workflowDecision && Object.prototype.hasOwnProperty.call(workflowDecision, 'viewModel')
        ? workflowDecision.viewModel
        : null;

      return Object.freeze({
        state: resolved.state,
        reason: resolved.reason,
        selectionStatus: selection.status,
        packId,
        matchIds: Object.freeze([...(selection.matchIds || [])]),
        workflowDecision,
        viewModel,
      });
    }

    function getReferenceOptions(context = {}) {
      const pack = matchedPack(context);
      if (!pack || typeof pack.getReferenceOptions !== 'function') return null;
      return pack.getReferenceOptions();
    }

    function getReference({ context = {}, areaId, levelCode, language, subject } = {}) {
      const pack = matchedPack(context);
      if (!pack || typeof pack.getReference !== 'function') return null;
      return pack.getReference({ areaId, levelCode, language, subject });
    }

    return Object.freeze({ evaluate, getReferenceOptions, getReference });
  }

  if (root) {
    root.PSQM = root.PSQM || {};
    root.PSQM.teacherSupport = root.PSQM.teacherSupport || {};
    root.PSQM.teacherSupport.createSupportController = createSupportController;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createSupportController };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
