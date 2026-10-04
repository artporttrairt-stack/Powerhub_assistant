(function initCamPrimaryMs1Pack(root) {
  'use strict';

  function browserDeps() {
    const ns = root && root.PSQM && root.PSQM.teacherSupport && root.PSQM.teacherSupport.camPrimaryMs1;
    return ns && {
      official: ns.official,
      guidance: ns.guidance,
      locale: ns.locale,
      examples: ns.examples,
      sources: ns.sources,
      applicability: ns.applicability,
    };
  }

  function nodeDeps() {
    return {
      official: require('./content/official.js'),
      guidance: require('./content/guidance.js'),
      locale: require('./content/locale.js'),
      examples: require('./content/examples.js'),
      sources: require('./sources.js'),
      applicability: require('./applicability.js'),
    };
  }

  function createCamPrimaryMs1Pack(dependencies) {
    const deps = dependencies || (typeof module !== 'undefined' && module.exports ? nodeDeps() : browserDeps());
    if (!deps || !deps.official || !deps.guidance || !deps.locale || !deps.examples || !deps.sources || !deps.applicability) {
      throw new Error('CAM Primary MS1 pack dependencies are unavailable.');
    }

    const policy = deps.applicability.createMs1Policy(deps.official);
    const referenceOptions = Object.freeze({
      areas: Object.freeze(deps.official.OFFICIAL_AREAS.map((area) =>
        Object.freeze({ id: area.id, title: area.title })
      )),
      levelCodes: deps.official.LEVEL_CODES,
      assistLanguages: deps.locale.SUPPORTED_ASSIST_LANGUAGES,
      defaultAssistLanguage: deps.locale.DEFAULT_ASSIST_LANGUAGE,
    });

    function getReferenceOptions() {
      return referenceOptions;
    }

    function getReference({ areaId, levelCode, language, subject } = {}) {
      const officialCriterion = deps.official.getOfficialCriterion(areaId, levelCode);
      const guidance = deps.guidance.getGuidance(areaId, levelCode);
      if (!officialCriterion || !guidance) return null;

      const assistLanguage = deps.locale.resolveAssistLanguage(language);
      const subjectExample = areaId === 'academic'
        ? deps.examples.getSubjectExample(subject, levelCode)
        : null;

      return Object.freeze({
        areaId,
        levelCode,
        officialTitle: officialCriterion.officialTitle,
        assistLanguage,
        officialCriterion,
        plainExplanation: Object.freeze({
          sourceId: guidance.sourceId,
          text: deps.locale.getSupportText(guidance, assistLanguage),
        }),
        evidence: guidance.evidenceEn,
        checklist: guidance.observationPromptsEn || Object.freeze([]),
        comparison: Object.freeze({
          sourceId: guidance.sourceId,
          text: assistLanguage === 'VI' && guidance.comparisonVi
            ? guidance.comparisonVi
            : guidance.comparisonEn,
        }),
        subjectExample,
        teacherDecisionMessage: deps.locale.TEACHER_DECISION_MESSAGE,
      });
    }

    return Object.freeze({
      id: deps.applicability.PACK_ID,
      workflow: 'ms1',
      filterQuery: deps.applicability.FILTER_QUERY,
      sourceIds: Object.freeze([
        deps.sources.SOURCE_IDS.official,
        deps.sources.SOURCE_IDS.interpretive,
      ]),
      availability: policy.availability,
      classifyStandardHeader: policy.classifyStandardHeader,
      isCompatibleScale: policy.isCompatibleScale,
      evaluateContextualEligibility: policy.evaluateContextualEligibility,
      decideWorkflow: policy.decideWorkflow,
      getReferenceOptions,
      getReference,
    });
  }

  const api = Object.freeze({ createCamPrimaryMs1Pack });
  if (root) {
    root.PSQM = root.PSQM || {};
    root.PSQM.teacherSupport = root.PSQM.teacherSupport || {};
    root.PSQM.teacherSupport.camPrimaryMs1 = root.PSQM.teacherSupport.camPrimaryMs1 || {};
    root.PSQM.teacherSupport.camPrimaryMs1.pack = api;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
