(function initCamPrimaryMs1Pack(root) {
  'use strict';

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    for (const item of Object.values(value)) deepFreeze(item);
    return value;
  }

  function buildLegacyPack(matches, sourceIds) {
    return Object.freeze({
      id: 'cam-primary.ms1',
      version: '1.0.0',
      workflow: 'ms1',
      sourceIds: Object.freeze([...sourceIds]),
      applicability: matches,
    });
  }

  function resolveBrowserDependencies() {
    const p = root && root.PSQM;
    if (!p) return null;
    return {
      matches: p.camPrimaryMs1Applicability && p.camPrimaryMs1Applicability.matches,
      sourceIds: p.camPrimaryMs1Sources && p.camPrimaryMs1Sources.ids,
      areas: p.camPrimaryMs1Areas,
      levels: p.camPrimaryMs1Levels,
      official: p.camPrimaryMs1OfficialCriteria,
      plain: p.camPrimaryMs1PlainExplanations,
      evidence: p.camPrimaryMs1ClassroomEvidence,
      checklists: p.camPrimaryMs1ObservationChecklists,
      comparisons: p.camPrimaryMs1AdjacentComparisons,
      examples: p.camPrimaryMs1SubjectExamples && p.camPrimaryMs1SubjectExamples.data,
      getExample: p.camPrimaryMs1SubjectExamples && p.camPrimaryMs1SubjectExamples.get,
      copyEn: p.camPrimaryMs1CopyEn,
      copyVi: p.camPrimaryMs1CopyVi,
    };
  }

  function validateRichDependencies(deps) {
    const required = ['matches','sourceIds','areas','levels','official','plain','evidence','checklists','comparisons','examples','getExample','copyEn','copyVi'];
    return required.every((key) => deps && deps[key]);
  }

  function buildRichPack(deps) {
    if (!validateRichDependencies(deps)) throw new Error('CAM Primary MS1 guidance dependencies are unavailable.');
    const areaByKey = new Map(deps.areas.map((area) => [area.key, area]));
    const levelByCode = new Map(deps.levels.map((level) => [level.code, level]));

    function listAreas() {
      return deps.areas;
    }
    function getArea(areaKey) {
      const area = areaByKey.get(areaKey);
      if (!area) return null;
      return deepFreeze({ key: area.key, label: area.label, levels: deps.levels });
    }
    function getLevel(areaKey, levelCode) {
      const area = areaByKey.get(areaKey);
      const level = levelByCode.get(levelCode);
      if (!area || !level) return null;
      const official = deps.official[areaKey] && deps.official[areaKey][levelCode];
      const plainExplanation = deps.plain[areaKey] && deps.plain[areaKey][levelCode];
      const classroomEvidence = deps.evidence[areaKey] && deps.evidence[areaKey][levelCode];
      const observationChecklist = deps.checklists[areaKey] && deps.checklists[areaKey][levelCode];
      if (!official || !plainExplanation || !classroomEvidence || !observationChecklist) return null;
      return deepFreeze({
        area,
        level,
        official,
        plainExplanation,
        classroomEvidence,
        observationChecklist,
        teacherMakesFinalDecision: true,
      });
    }
    function getSubjectExample(areaKey, levelCode, subjectKey) {
      return deps.getExample(areaKey, levelCode, subjectKey);
    }
    function compare(areaKey, levelCode) {
      return (deps.comparisons[areaKey] && deps.comparisons[areaKey][levelCode]) || null;
    }

    return deepFreeze({
      id: 'cam-primary.ms1',
      version: '1.0.0',
      workflow: 'ms1',
      status: 'READY',
      sourceIds: [...deps.sourceIds],
      applicability: deps.matches,
      copy: { en: deps.copyEn, vi: deps.copyVi },
      listAreas,
      getArea,
      getLevel,
      getSubjectExample,
      compare,
    });
  }

  function createMs1GuidancePack(dependencies) {
    return buildRichPack(dependencies || resolveBrowserDependencies());
  }

  function createCamPrimaryMs1Pack(dependencies) {
    const deps = dependencies || resolveBrowserDependencies() || {};
    if (validateRichDependencies(deps)) return buildRichPack(deps);
    if (typeof deps.matches !== 'function') throw new Error('CAM Primary MS1 applicability is unavailable.');
    if (!Array.isArray(deps.sourceIds)) throw new Error('CAM Primary MS1 source IDs are unavailable.');
    return buildLegacyPack(deps.matches, deps.sourceIds);
  }

  if (root && root.PSQM && root.PSQM.teacherSupportPackRegistry && root.PSQM.camPrimaryMs1Applicability && root.PSQM.camPrimaryMs1Sources) {
    const registry = root.PSQM.teacherSupportPackRegistry;
    if (!registry.get('cam-primary.ms1')) registry.register(createCamPrimaryMs1Pack());
  }

  if (typeof module !== 'undefined' && module.exports) {
    const { matchesCamPrimaryMs1 } = require('./applicability.js');
    const { CAM_PRIMARY_MS1_SOURCE_IDS } = require('./sources.js');
    const { MS1_AREAS } = require('./areas.js');
    const { MS1_LEVELS } = require('./levels.js');
    const { OFFICIAL_CRITERIA } = require('./official-criteria.js');
    const { PLAIN_EXPLANATIONS } = require('./plain-explanations.js');
    const { CLASSROOM_EVIDENCE } = require('./classroom-evidence.js');
    const { OBSERVATION_CHECKLISTS } = require('./observation-checklists.js');
    const { ADJACENT_COMPARISONS } = require('./comparisons.js');
    const { SUBJECT_EXAMPLES, getSubjectExample } = require('./subject-examples/index.js');
    const { COPY_EN } = require('./copy.en.js');
    const { COPY_VI } = require('./copy.vi.js');
    const nodeDependencies = {
      matches: matchesCamPrimaryMs1,
      sourceIds: CAM_PRIMARY_MS1_SOURCE_IDS,
      areas: MS1_AREAS,
      levels: MS1_LEVELS,
      official: OFFICIAL_CRITERIA,
      plain: PLAIN_EXPLANATIONS,
      evidence: CLASSROOM_EVIDENCE,
      checklists: OBSERVATION_CHECKLISTS,
      comparisons: ADJACENT_COMPARISONS,
      examples: SUBJECT_EXAMPLES,
      getExample: getSubjectExample,
      copyEn: COPY_EN,
      copyVi: COPY_VI,
    };
    module.exports = {
      createMs1GuidancePack: () => createMs1GuidancePack(nodeDependencies),
      createCamPrimaryMs1Pack: () => createCamPrimaryMs1Pack(nodeDependencies),
    };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
