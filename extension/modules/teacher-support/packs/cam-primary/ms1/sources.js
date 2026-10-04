(function initCamPrimaryMs1Sources(root) {
  'use strict';

  const SOURCE_IDS = Object.freeze({
    official: 'cam-primary-ms1-official',
    interpretive: 'cam-primary-ms1-interpretive',
  });
  const SOURCES = Object.freeze({
    official: Object.freeze({
      id: SOURCE_IDS.official,
      role: 'canonical',
      title: 'MS1 Report Teacher Guidance',
    }),
    interpretive: Object.freeze({
      id: SOURCE_IDS.interpretive,
      role: 'interpretive-example',
      title: 'MS1 All Levels Complete Bilingual',
    }),
  });

  const api = Object.freeze({ SOURCE_IDS, SOURCES });
  if (root) {
    root.PSQM = root.PSQM || {};
    root.PSQM.teacherSupport = root.PSQM.teacherSupport || {};
    root.PSQM.teacherSupport.camPrimaryMs1 = root.PSQM.teacherSupport.camPrimaryMs1 || {};
    root.PSQM.teacherSupport.camPrimaryMs1.sources = api;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
