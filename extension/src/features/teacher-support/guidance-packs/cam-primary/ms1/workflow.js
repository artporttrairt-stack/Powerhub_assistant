(function initCamPrimaryMs1Workflow(root) {
  'use strict';

  const CAM_PRIMARY_MS1_WORKFLOW = Object.freeze({
    id: 'cam-primary.ms1',
    version: '1.0.0',
    label: 'MS1 Report',
    status: 'READY',
    visibleInPicker: true,
    allowNavigationBeforeApplicability: true,
    navigation: Object.freeze({ targetView: 'standards', filterQuery: 'MS1' }),
    guidancePackId: 'cam-primary.ms1',
  });

  if (root) {
    root.PSQM = root.PSQM || {};
    root.PSQM.camPrimaryMs1Workflow = CAM_PRIMARY_MS1_WORKFLOW;
    const registry = root.PSQM.teacherSupportWorkflowRegistry;
    const applicability = root.PSQM.camPrimaryMs1Applicability;
    if (registry && applicability && typeof applicability.matches === 'function' && !registry.get(CAM_PRIMARY_MS1_WORKFLOW.id)) {
      registry.register({
        ...CAM_PRIMARY_MS1_WORKFLOW,
        applicability: applicability.matches,
        resolveSubjectKey: applicability.resolveSubjectKey,
      });
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { CAM_PRIMARY_MS1_WORKFLOW };
})(typeof globalThis !== 'undefined' ? globalThis : this);
