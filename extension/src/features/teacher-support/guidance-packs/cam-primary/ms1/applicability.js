(function initCamPrimaryMs1Applicability(root) {
  'use strict';

  const REQUIRED_SCALE = Object.freeze(['EE', 'AE', 'ME', 'BE', 'WB']);
  const REQUIRED_MS1_STRANDS = Object.freeze([
    'MS1-Academic',
    'MS1-Attitude',
    'MS1-Behaviour',
    'MS1-Classwork',
    'MS1-Communication',
    'MS1-Collaboratively',
    'MS1-Creativity',
    'MS1-Equipment',
  ]);

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

  function resolveSupportedSubjectKey(courseLabel) {
    const label = String(courseLabel || '');
    if (/\bEnglish\b/i.test(label)) return 'english';
    if (/\b(?:Maths|Mathematics)\b/i.test(label)) return 'maths';
    if (/\bScience\b/i.test(label)) return 'science';
    return null;
  }

  function matchesLegacyVerifiedContext(context) {
    if (context.workflow !== 'ms1' || context.workflowVerified !== true) return result(false, 'workflow-unverified');
    if (!context.department || context.department.code !== 'CAM' || context.department.verified !== true) return result(false, 'department-unverified');
    if (!context.division || context.division.code !== 'PRIMARY' || context.division.verified !== true) return result(false, 'division-unverified');
    if (context.reportingContextVerified !== true) return result(false, 'reporting-context-unverified');
    if (!hasExactScale(context.scale)) return result(false, 'scale-incompatible');
    return result(true, 'verified-cam-primary-ms1');
  }

  function hasExactStrandEvidence(evidence) {
    if (!Array.isArray(evidence) || evidence.length !== REQUIRED_MS1_STRANDS.length) return false;
    const normalized = new Set(evidence.map((item) => String(item).trim().toUpperCase()));
    return REQUIRED_MS1_STRANDS.every((item) => normalized.has(item.toUpperCase()));
  }

  function matchesSemanticUiContext(context) {
    const ui = context.uiState;
    if (!ui || ui.workflowMarkerPresent !== true) return result(false, 'workflow-marker-unverified');
    if (ui.workflowMarkerKey !== 'ms1-strands') return result(false, 'workflow-marker-incompatible');
    if (!hasExactStrandEvidence(ui.workflowMarkerEvidence)) return result(false, 'workflow-strands-incomplete');
    return result(true, 'verified-ms1-strands');
  }

  function matchesCamPrimaryMs1(context) {
    if (!context || context.platform !== 'powerteacher' || context.platformVerified !== true) return result(false, 'platform-unverified');
    if (context.ambiguous === true) return result(false, 'context-ambiguous');
    if (context.sectionContextVerified === false) return result(false, 'section-context-stale');
    if (context.uiState !== undefined) return matchesSemanticUiContext(context);
    return matchesLegacyVerifiedContext(context);
  }

  if (root) {
    root.PSQM = root.PSQM || {};
    root.PSQM.camPrimaryMs1Applicability = Object.freeze({
      matches: matchesCamPrimaryMs1,
      resolveSubjectKey: resolveSupportedSubjectKey,
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      matchesCamPrimaryMs1,
      REQUIRED_SCALE,
      REQUIRED_MS1_STRANDS,
      resolveSupportedSubjectKey,
    };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
