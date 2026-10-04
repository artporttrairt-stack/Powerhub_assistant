(function initPowerTeacherUiContract(root) {
  'use strict';

  const EVIDENCE_STATUS = Object.freeze({
    LIVE_READ_ONLY_VERIFIED: 'LIVE_READ_ONLY_VERIFIED',
    HELP_VERIFIED: 'HELP_VERIFIED',
    UNVERIFIED: 'UNVERIFIED',
  });

  function verified(details) {
    return Object.freeze({
      evidenceStatus: EVIDENCE_STATUS.LIVE_READ_ONLY_VERIFIED,
      ...details,
    });
  }

  const items = Object.freeze({
    gradingNavigation: verified({
      selector: '#sidebar-charms-grading',
    }),
    standardsNavigation: verified({
      selector: '#grading-standards-link',
    }),
    activeStandardsView: verified({
      gradingSelector: '#sidebar-charms-grading',
      megaMenuSelector: '#section-mega-menu',
      gridSelector: '#standard-final-grades',
      requiresGradingActive: true,
      requiresStandardsSemantics: true,
      requiresGridComputedVisible: true,
      routeFamilyAloneIsSufficient: false,
    }),
    standardsGear: verified({
      selector: '#special-functions',
    }),
    filterToggle: verified({
      selector: '#hide-filter',
      stateSource: 'semantic-label',
      states: Object.freeze(['Show Filter', 'Hide Filter']),
    }),
    filterInput: verified({
      selector: '#simple-search-standard-final-grades',
      stateSource: 'computed-visibility',
      presenceAloneIsSufficient: false,
    }),
    currentCourseLabel: verified({
      selector: '.course-name',
      stateSource: 'visible-text',
      persist: false,
    }),
    ms1ResultMarker: verified({
      scopeSelector: '#standard-final-grades',
      candidateSelector: 'th.standard-column-header.standard-col',
      semanticText: 'MS1',
      semanticPrefix: 'MS1-',
      requiredSemanticIdentifiers: Object.freeze([
        'MS1-Academic',
        'MS1-Attitude',
        'MS1-Behaviour',
        'MS1-Classwork',
        'MS1-Communication',
        'MS1-Collaboratively',
        'MS1-Creativity',
        'MS1-Equipment',
      ]),
      matchMode: 'all-required-visible-identifiers',
      minComputedVisibleMatches: 8,
      maxComputedVisibleMatches: 8,
      requiresStabilizationReread: true,
    }),
    supportMountHost: verified({
      host: 'document.body',
      directChild: true,
      extensionOwnedRoot: true,
      hostStabilityOnly: true,
      implementationSmokeRequired: true,
    }),
    navigationSignals: verified({
      events: Object.freeze(['hashchange', 'popstate']),
      invalidateStaleContext: true,
      persistRawSectionIds: false,
    }),
  });

  const teacherControlPolicy = Object.freeze({
    showMe: 'highlight-only',
    syntheticNativeActionsAllowed: false,
    neverAutomate: Object.freeze([
      'grade',
      'fill',
      'save',
      'publish',
      'send',
      'write-comments',
      'toggle-flags',
      'undo-revert',
      'recalculate-final-grades',
      'revert-grades-to-calculated',
      'click-standards-gear',
      'click-show-hide-filter',
      'click-apply-clear',
      'dispatch-synthetic-native-actions',
    ]),
  });

  const POWERTEACHER_STAGE2_UI_CONTRACT = Object.freeze({ items, teacherControlPolicy });

  const CRITICAL_REQUIREMENTS = Object.freeze({
    gradingNavigation: Object.freeze(['selector']),
    standardsNavigation: Object.freeze(['selector']),
    activeStandardsView: Object.freeze(['gradingSelector', 'megaMenuSelector', 'gridSelector']),
    standardsGear: Object.freeze(['selector']),
    filterToggle: Object.freeze(['selector', 'stateSource', 'states']),
    filterInput: Object.freeze(['selector', 'stateSource']),
    ms1ResultMarker: Object.freeze(['scopeSelector', 'candidateSelector', 'requiredSemanticIdentifiers']),
    supportMountHost: Object.freeze(['host']),
    navigationSignals: Object.freeze(['events']),
  });

  function hasRequiredValue(value) {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    return value !== undefined && value !== null;
  }

  function evaluatePowerTeacherUiContract(contract) {
    const reasonCodes = [];
    const contractItems = contract && contract.items;

    for (const [key, requiredFields] of Object.entries(CRITICAL_REQUIREMENTS)) {
      const item = contractItems && contractItems[key];
      if (!item) {
        reasonCodes.push(`critical-contract-incomplete:${key}`);
        continue;
      }
      if (item.evidenceStatus === EVIDENCE_STATUS.UNVERIFIED) {
        reasonCodes.push(`critical-unverified:${key}`);
        continue;
      }
      if (!Object.values(EVIDENCE_STATUS).includes(item.evidenceStatus)
          || requiredFields.some((field) => !hasRequiredValue(item[field]))) {
        reasonCodes.push(`critical-contract-incomplete:${key}`);
      }
    }

    return Object.freeze({
      ready: reasonCodes.length === 0,
      reasonCodes: Object.freeze(reasonCodes),
    });
  }

  const api = Object.freeze({
    EVIDENCE_STATUS,
    POWERTEACHER_STAGE2_UI_CONTRACT,
    evaluatePowerTeacherUiContract,
  });

  if (root) {
    root.PSQM = root.PSQM || {};
    root.PSQM.powerTeacherUiContract = api;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
