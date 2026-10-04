(function initCamPrimaryMs1AdjacentComparisons(root) {
  'use strict';

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    for (const item of Object.values(value)) deepFreeze(item);
    return value;
  }

  function buildAdjacentComparisons(areas, levels, officialCriteria) {
    if (!Array.isArray(areas) || !Array.isArray(levels) || !officialCriteria) {
      throw new TypeError('MS1 areas, levels, and official criteria are required.');
    }
    const matrix = {};
    for (const area of areas) {
      matrix[area.key] = {};
      for (let index = 0; index < levels.length; index += 1) {
        const currentCode = levels[index].code;
        const previousCode = index > 0 ? levels[index - 1].code : null;
        const nextCode = index < levels.length - 1 ? levels[index + 1].code : null;
        const item = (code) => code ? {
          code,
          criterion: officialCriteria[area.key][code].criterion,
          sourceId: officialCriteria[area.key][code].sourceId,
        } : null;
        matrix[area.key][currentCode] = {
          current: item(currentCode),
          previous: item(previousCode),
          next: item(nextCode),
          teacherMakesFinalDecision: true,
          recommendedLevel: null,
        };
      }
    }
    return deepFreeze(matrix);
  }

  const browser = root && root.PSQM;
  const nodeDeps = typeof module !== 'undefined' && module.exports ? {
    areas: require('./areas.js').MS1_AREAS,
    levels: require('./levels.js').MS1_LEVELS,
    official: require('./official-criteria.js').OFFICIAL_CRITERIA,
  } : null;
  const ADJACENT_COMPARISONS = buildAdjacentComparisons(
    (browser && browser.camPrimaryMs1Areas) || (nodeDeps && nodeDeps.areas),
    (browser && browser.camPrimaryMs1Levels) || (nodeDeps && nodeDeps.levels),
    (browser && browser.camPrimaryMs1OfficialCriteria) || (nodeDeps && nodeDeps.official),
  );

  if (root) {
    root.PSQM = root.PSQM || {};
    root.PSQM.camPrimaryMs1AdjacentComparisons = ADJACENT_COMPARISONS;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ADJACENT_COMPARISONS, buildAdjacentComparisons };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
