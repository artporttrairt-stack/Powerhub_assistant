(function initCamPrimaryMs1ObservationChecklists(root) {
  'use strict';

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    for (const item of Object.values(value)) deepFreeze(item);
    return value;
  }

  function buildObservationChecklists(classroomEvidence) {
    if (!classroomEvidence || typeof classroomEvidence !== 'object') {
      throw new TypeError('CAM Primary MS1 classroom evidence is required.');
    }
    const matrix = {};
    for (const [areaKey, levels] of Object.entries(classroomEvidence)) {
      matrix[areaKey] = {};
      for (const [levelCode, cell] of Object.entries(levels)) {
        matrix[areaKey][levelCode] = {
          derivedFrom: cell.derivedFrom,
          interpretiveSourceId: cell.interpretiveSourceId,
          items: cell.items.map((item) => `Have I observed this classroom evidence consistently enough to compare with the official criterion: ${String(item).replace(/[.]+$/, '')}?`),
          scoring: false,
        };
      }
    }
    return deepFreeze(matrix);
  }

  const browserEvidence = root && root.PSQM && root.PSQM.camPrimaryMs1ClassroomEvidence;
  const nodeEvidence = typeof module !== 'undefined' && module.exports
    ? require('./classroom-evidence.js').CLASSROOM_EVIDENCE
    : null;
  const OBSERVATION_CHECKLISTS = buildObservationChecklists(browserEvidence || nodeEvidence);

  if (root) {
    root.PSQM = root.PSQM || {};
    root.PSQM.camPrimaryMs1ObservationChecklists = OBSERVATION_CHECKLISTS;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OBSERVATION_CHECKLISTS, buildObservationChecklists };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
