(function initCamPrimaryMs1Locale(root) {
  'use strict';

  const DEFAULT_ASSIST_LANGUAGE = 'EN';
  const SUPPORTED_ASSIST_LANGUAGES = Object.freeze(['EN', 'VI']);
  const TEACHER_DECISION_MESSAGE = 'Use the evidence to compare levels. You make the final judgement.';

  function resolveAssistLanguage(value) {
    const normalized = String(value || '').trim().toUpperCase();
    return normalized === 'VI' ? 'VI' : DEFAULT_ASSIST_LANGUAGE;
  }

  function getSupportText(guidance, language) {
    if (!guidance) return '';
    const resolved = resolveAssistLanguage(language);
    if (resolved === 'VI' && typeof guidance.supportVi === 'string' && guidance.supportVi.trim()) {
      return guidance.supportVi;
    }
    return String(guidance.explanationEn || '');
  }

  const api = Object.freeze({
    DEFAULT_ASSIST_LANGUAGE,
    SUPPORTED_ASSIST_LANGUAGES,
    TEACHER_DECISION_MESSAGE,
    resolveAssistLanguage,
    getSupportText,
  });

  if (root) {
    root.PSQM = root.PSQM || {};
    root.PSQM.teacherSupport = root.PSQM.teacherSupport || {};
    root.PSQM.teacherSupport.camPrimaryMs1 = root.PSQM.teacherSupport.camPrimaryMs1 || {};
    root.PSQM.teacherSupport.camPrimaryMs1.locale = api;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
