(function initCamPrimaryMs1CopyEn(root) {
  'use strict';
  const COPY_EN = Object.freeze({
    officialCriterion: 'OFFICIAL CRITERION',
    interpretiveExample: 'EXAMPLE TO HELP YOU INTERPRET',
    classroomEvidence: 'Classroom evidence to consider',
    observationChecklist: 'Observation questions',
    compareWith: 'Compare with the adjacent level',
    subjectExample: 'Subject example',
    back: 'Back',
    quickReference: 'Quick reference',
    teacherDecision: 'Use the evidence to compare levels; the teacher makes the final decision.',
  });
  if (root) { root.PSQM = root.PSQM || {}; root.PSQM.camPrimaryMs1CopyEn = COPY_EN; }
  if (typeof module !== 'undefined' && module.exports) module.exports = { COPY_EN };
})(typeof globalThis !== 'undefined' ? globalThis : this);
