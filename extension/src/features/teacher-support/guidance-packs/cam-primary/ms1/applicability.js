(function initCamPrimaryMs1Applicability(root) {
  'use strict';

  const REQUIRED_SCALE = Object.freeze(['EE', 'AE', 'ME', 'BE', 'WB']);

  function result(matched, reason) {
    return Object.freeze({ matched, reason });
  }

  function hasExactScale(scale) {
    return Boolean(
      scale &&
      scale.verified === true &&
      Array.isArray(scale.codes) &&
      scale.codes.length === REQUIRED_SCALE.length &&
      scale.codes.every((code, index) => code === REQUIRED_SCALE[index])
    );
  }

  function matchesCamPrimaryMs1(context) {
    if (!context || context.platform !== 'powerteacher' || context.platformVerified !== true) {
      return result(false, 'platform-unverified');
    }
    if (context.ambiguous === true) return result(false, 'context-ambiguous');
    if (context.sectionContextVerified === false) return result(false, 'section-context-stale');
    if (context.workflow !== 'ms1' || context.workflowVerified !== true) {
      return result(false, 'workflow-unverified');
    }
    if (!context.department || context.department.code !== 'CAM' || context.department.verified !== true) {
      return result(false, 'department-unverified');
    }
    if (!context.division || context.division.code !== 'PRIMARY' || context.division.verified !== true) {
      return result(false, 'division-unverified');
    }
    if (context.reportingContextVerified !== true) {
      return result(false, 'reporting-context-unverified');
    }
    if (!hasExactScale(context.scale)) {
      return result(false, 'scale-incompatible');
    }
    return result(true, 'verified-cam-primary-ms1');
  }

  if (root) {
    root.PSQM = root.PSQM || {};
    root.PSQM.camPrimaryMs1Applicability = Object.freeze({ matches: matchesCamPrimaryMs1 });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { matchesCamPrimaryMs1, REQUIRED_SCALE };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
