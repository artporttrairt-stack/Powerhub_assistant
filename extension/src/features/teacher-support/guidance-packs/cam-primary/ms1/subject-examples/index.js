(function initCamPrimaryMs1SubjectExamples(root) {
  'use strict';
  const nodeDeps = typeof module !== 'undefined' && module.exports ? {
    english: require('./english.js').ENGLISH_EXAMPLES,
    maths: require('./maths.js').MATHS_EXAMPLES,
    science: require('./science.js').SCIENCE_EXAMPLES,
  } : null;
  const p = root && root.PSQM;
  const bySubject = {
    english: (p && p.camPrimaryMs1EnglishExamples) || (nodeDeps && nodeDeps.english),
    maths: (p && p.camPrimaryMs1MathsExamples) || (nodeDeps && nodeDeps.maths),
    science: (p && p.camPrimaryMs1ScienceExamples) || (nodeDeps && nodeDeps.science),
  };
  const levels = ['EE','AE','ME','BE','WB'];
  const academic = {};
  for (const level of levels) {
    academic[level] = Object.freeze({
      english: bySubject.english[level], maths: bySubject.maths[level], science: bySubject.science[level],
    });
  }
  const SUBJECT_EXAMPLES = Object.freeze({ 'academic-achievement': Object.freeze(academic) });
  function getSubjectExample(areaKey, levelCode, subjectKey) {
    const area = SUBJECT_EXAMPLES[areaKey]; const level = area && area[levelCode];
    return (level && level[subjectKey]) || null;
  }
  if (root) { root.PSQM = root.PSQM || {}; root.PSQM.camPrimaryMs1SubjectExamples = Object.freeze({ data: SUBJECT_EXAMPLES, get: getSubjectExample }); }
  if (typeof module !== 'undefined' && module.exports) module.exports = { SUBJECT_EXAMPLES, getSubjectExample };
})(typeof globalThis !== 'undefined' ? globalThis : this);
