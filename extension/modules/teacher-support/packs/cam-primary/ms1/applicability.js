(function initCamPrimaryMs1Applicability(root) {
  'use strict';

  const PACK_ID = 'cam-primary.ms1';
  const FILTER_QUERY = 'MS1';
  const REQUIRED_SCALE = Object.freeze(['EE', 'AE', 'ME', 'BE', 'WB']);
  const LIVE_ALIASES = Object.freeze({
    'ms1-academic': 'academic',
    'ms1-attitude': 'attitude',
    'ms1-behaviour': 'behaviour',
    'ms1-equipment': 'equipment-resources',
  });
  const LOOKALIKE_PREFIXES = Object.freeze([
    'ms1-ta-grade',
    'ms1-ta-score',
    'ms1-vn-ranking',
    'ms1-unit1',
    'ms1-lspc',
  ]);

  function loadOfficial() {
    if (typeof module !== 'undefined' && module.exports) return require('./content/official.js');
    return root && root.PSQM && root.PSQM.teacherSupport && root.PSQM.teacherSupport.camPrimaryMs1
      && root.PSQM.teacherSupport.camPrimaryMs1.official;
  }

  function normalize(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function availability(context) {
    const matched = Boolean(context && context.requestedPackId === PACK_ID);
    return Object.freeze({
      matched,
      reason: matched ? 'explicit-pack-request' : 'pack-not-requested',
    });
  }

  function createMs1Policy(officialApi = loadOfficial()) {
    if (!officialApi || !Array.isArray(officialApi.OFFICIAL_AREAS)) {
      throw new Error('MS1 official content is unavailable.');
    }

    const areaById = new Map(officialApi.OFFICIAL_AREAS.map((area) => [area.id, area]));
    const titleToArea = new Map(officialApi.OFFICIAL_AREAS.map((area) => [normalize(area.title), area]));

    function classifyStandardHeader({ text, title, ariaLabel } = {}) {
      const candidates = [text, title, ariaLabel].map(normalize).filter(Boolean);

      for (const candidate of candidates) {
        if (LOOKALIKE_PREFIXES.some((prefix) => candidate.includes(prefix))) {
          return Object.freeze({ kind: 'lookalike', areaId: null, officialTitle: null, reason: 'explicit-lookalike' });
        }
      }

      for (const candidate of candidates) {
        const areaId = LIVE_ALIASES[candidate];
        if (areaId && areaById.has(areaId)) {
          const area = areaById.get(areaId);
          return Object.freeze({ kind: 'rubric', areaId, officialTitle: area.title, reason: 'live-approved-alias' });
        }
      }

      for (const candidate of candidates) {
        const withoutPrefix = candidate.replace(/^ms1\s*[-:]\s*/, '');
        const area = titleToArea.get(withoutPrefix) || titleToArea.get(candidate);
        if (area) {
          return Object.freeze({ kind: 'rubric', areaId: area.id, officialTitle: area.title, reason: 'exact-official-title' });
        }
      }

      return Object.freeze({ kind: 'unknown', areaId: null, officialTitle: null, reason: 'unrecognized-header' });
    }

    function isCompatibleScale(codes) {
      return Array.isArray(codes)
        && codes.length === REQUIRED_SCALE.length
        && codes.every((code, index) => code === REQUIRED_SCALE[index]);
    }

    function ineligible(reason) {
      return Object.freeze({ eligible: false, areaId: null, officialTitle: null, reason });
    }

    function evaluateContextualEligibility({ uiState, context } = {}) {
      if (!uiState || uiState.platformVerified !== true) return ineligible('platform-unverified');
      if (!uiState.standards || uiState.standards.verified !== true || uiState.standards.gridCount !== 1) {
        return ineligible('standards-unverified');
      }
      if (!context || context.contextFresh !== true) return ineligible('context-stale');
      if (!uiState.selectedCell || uiState.selectedCell.found !== true || !Number.isInteger(uiState.selectedCell.standardPosition)) {
        return ineligible('cell-unverified');
      }

      const matchingHeaders = (uiState.renderedHeaders || []).filter(
        (header) => header && header.standardPosition === uiState.selectedCell.standardPosition
      );
      if (matchingHeaders.length !== 1) return ineligible('cell-unverified');

      const classification = classifyStandardHeader(matchingHeaders[0]);
      if (classification.kind !== 'rubric') return ineligible('strand-unverified');

      if (uiState.nativeInspectorOpen !== true) return ineligible('inspector-unverified');
      if (!uiState.scale || !isCompatibleScale(uiState.scale.codes)) return ineligible('scale-incompatible');

      return Object.freeze({
        eligible: true,
        areaId: classification.areaId,
        officialTitle: classification.officialTitle,
        reason: 'eligible',
      });
    }

    function guidance(stepId, targetKey, reason) {
      return Object.freeze({
        kind: 'guidance',
        reason,
        viewModel: Object.freeze({ stepId, targetKey }),
      });
    }

    function decideWorkflow({ uiState = {}, context = {}, mode = 'active' } = {}) {
      if (mode === 'reference') {
        return Object.freeze({
          kind: 'reference',
          reason: 'teacher-requested-reference',
          viewModel: Object.freeze({ referenceOnly: true }),
        });
      }

      if (!uiState.grading || uiState.grading.active !== true) {
        return guidance('open-grading', 'grading-nav', 'grading-not-active');
      }
      if (!uiState.standards || uiState.standards.verified !== true) {
        return guidance('open-standards', 'standards-nav', 'standards-not-verified');
      }
      if (!uiState.filter || uiState.filter.visible !== true) {
        return guidance('show-filter', 'special-functions', 'filter-hidden');
      }
      if (normalize(uiState.filter.value) !== normalize(FILTER_QUERY)) {
        return guidance('enter-query', 'filter-input', 'filter-query-missing');
      }

      const eligibility = evaluateContextualEligibility({ uiState, context });
      if (!eligibility.eligible) {
        return Object.freeze({
          kind: 'context-unverified',
          reason: eligibility.reason,
          viewModel: Object.freeze({
            stepId: 'open-rubric-cell',
            targetKey: null,
            eligibility,
          }),
        });
      }

      return Object.freeze({
        kind: 'context-ready',
        reason: 'eligible',
        viewModel: Object.freeze({
          areaId: eligibility.areaId,
          officialTitle: eligibility.officialTitle,
          eligibility,
        }),
      });
    }

    return Object.freeze({
      availability,
      classifyStandardHeader,
      isCompatibleScale,
      evaluateContextualEligibility,
      decideWorkflow,
    });
  }

  const api = Object.freeze({
    PACK_ID,
    FILTER_QUERY,
    REQUIRED_SCALE,
    LIVE_ALIASES,
    LOOKALIKE_PREFIXES,
    availability,
    createMs1Policy,
  });

  if (root) {
    root.PSQM = root.PSQM || {};
    root.PSQM.teacherSupport = root.PSQM.teacherSupport || {};
    root.PSQM.teacherSupport.camPrimaryMs1 = root.PSQM.teacherSupport.camPrimaryMs1 || {};
    root.PSQM.teacherSupport.camPrimaryMs1.applicability = api;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
