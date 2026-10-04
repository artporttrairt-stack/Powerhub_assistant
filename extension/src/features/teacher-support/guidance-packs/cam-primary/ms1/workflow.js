(function initCamPrimaryMs1Workflow(root) {
  'use strict';

  const CAM_PRIMARY_MS1_WORKFLOW = Object.freeze({
    id: 'cam-primary.ms1',
    version: '1.0.0',
    label: 'MS1 Report',
    status: 'SOURCE_REQUIRED',
    visibleInPicker: false,
    navigation: Object.freeze({ targetView: 'standards', filterQuery: 'MS1' }),
    guidancePackId: 'cam-primary.ms1',
  });

  if (root) {
    root.PSQM = root.PSQM || {};
    root.PSQM.camPrimaryMs1Workflow = CAM_PRIMARY_MS1_WORKFLOW;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { CAM_PRIMARY_MS1_WORKFLOW };
})(typeof globalThis !== 'undefined' ? globalThis : this);
