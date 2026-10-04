(function initCamPrimaryMs1Areas(root) {
  'use strict';

  const MS1_AREAS = Object.freeze([
    Object.freeze({ key: 'academic-achievement', label: 'Academic Achievement' }),
    Object.freeze({ key: 'attitude-towards-learning', label: 'Attitude Towards Learning' }),
    Object.freeze({ key: 'behaviour-personal-development', label: 'Behaviour and Personal Development' }),
    Object.freeze({ key: 'completion-classwork-homework-secondary', label: 'Completion of classwork/Homework (Secondary)' }),
    Object.freeze({ key: 'communication-skills', label: 'Communication Skills' }),
    Object.freeze({ key: 'working-collaboratively', label: 'Working Collaboratively' }),
    Object.freeze({ key: 'creativity-critical-thinking', label: 'Creativity and Critical thinking' }),
    Object.freeze({ key: 'equipment-resources', label: 'Equipment and Resources' }),
  ]);

  if (root) {
    root.PSQM = root.PSQM || {};
    root.PSQM.camPrimaryMs1Areas = MS1_AREAS;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { MS1_AREAS };
})(typeof globalThis !== 'undefined' ? globalThis : this);
