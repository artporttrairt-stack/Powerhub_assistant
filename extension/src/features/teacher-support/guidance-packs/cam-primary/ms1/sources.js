(function initCamPrimaryMs1Sources(root) {
  'use strict';

  const CAM_PRIMARY_MS1_SOURCE_IDS = Object.freeze([
    'cam-primary-ms1-official',
    'cam-primary-ms1-interpretive',
  ]);

  const CAM_PRIMARY_MS1_SOURCES = Object.freeze({
    official: Object.freeze({
      id: 'cam-primary-ms1-official',
      role: 'canonical',
      authority: 'official',
      title: 'MS1 Report Teacher Guidance',
    }),
    interpretive: Object.freeze({
      id: 'cam-primary-ms1-interpretive',
      role: 'interpretive-example',
      authority: 'interpretive',
      title: 'MS1 All Levels Complete Bilingual',
    }),
  });

  if (root) {
    root.PSQM = root.PSQM || {};
    root.PSQM.camPrimaryMs1Sources = Object.freeze({
      ids: CAM_PRIMARY_MS1_SOURCE_IDS,
      definitions: CAM_PRIMARY_MS1_SOURCES,
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CAM_PRIMARY_MS1_SOURCE_IDS, CAM_PRIMARY_MS1_SOURCES };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
