(function initCamPrimaryMs1Levels(root) {
  'use strict';

  const MS1_LEVELS = Object.freeze([
    Object.freeze({ code: 'EE', label: 'Exceeding Expectations' }),
    Object.freeze({ code: 'AE', label: 'Above Expectations' }),
    Object.freeze({ code: 'ME', label: 'Meeting Expectations' }),
    Object.freeze({ code: 'BE', label: 'Below Expectations' }),
    Object.freeze({ code: 'WB', label: 'Well Below Expectations' }),
  ]);

  if (root) {
    root.PSQM = root.PSQM || {};
    root.PSQM.camPrimaryMs1Levels = MS1_LEVELS;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { MS1_LEVELS };
})(typeof globalThis !== 'undefined' ? globalThis : this);
