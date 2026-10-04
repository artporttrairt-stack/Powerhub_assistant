(function initCamPrimaryMs1Guidance(root) {
  'use strict';

  const INTERPRETIVE_SOURCE_ID = 'cam-primary-ms1-interpretive';
  const RAW = {};
  // __DATA__

  const AREA_PROMPTS = Object.freeze({
    academic: Object.freeze(['Does the student understand and apply knowledge?']),
    attitude: Object.freeze(['Does the student want to learn and show genuine effort?']),
    behaviour: Object.freeze(['Does the student behave appropriately and manage themselves well?']),
    'classwork-homework': Object.freeze(['Does the student submit complete, on-time, quality work consistently?']),
    communication: Object.freeze(['Can the student express ideas clearly and appropriately?']),
    collaboration: Object.freeze(['Does the student contribute positively in group and partner situations?']),
    'creativity-critical-thinking': Object.freeze(['Does the student think beyond the obvious and generate original ideas?']),
    'equipment-resources': Object.freeze(['Is the student consistently well-prepared with the right materials?']),
  });

  const GUIDANCE = {};
  for (const [areaId, area] of Object.entries(RAW)) {
    GUIDANCE[areaId] = {};
    for (const [levelCode, values] of Object.entries(area.levels)) {
      GUIDANCE[areaId][levelCode] = {
        areaId,
        levelCode,
        sourceId: INTERPRETIVE_SOURCE_ID,
        explanationEn: values[0],
        evidenceEn: values[1],
        supportVi: values[2],
        observationPromptsEn: AREA_PROMPTS[areaId] || [],
        comparisonEn: area.comparisonEn,
        comparisonVi: area.comparisonVi,
      };
    }
  }

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
    return value;
  }
  deepFreeze(GUIDANCE);

  function getGuidance(areaId, levelCode) {
    return GUIDANCE[areaId] && GUIDANCE[areaId][levelCode] || null;
  }

  const api = Object.freeze({ INTERPRETIVE_SOURCE_ID, GUIDANCE, getGuidance });
  if (root) {
    root.PSQM = root.PSQM || {};
    root.PSQM.teacherSupport = root.PSQM.teacherSupport || {};
    root.PSQM.teacherSupport.camPrimaryMs1 = root.PSQM.teacherSupport.camPrimaryMs1 || {};
    root.PSQM.teacherSupport.camPrimaryMs1.guidance = api;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
