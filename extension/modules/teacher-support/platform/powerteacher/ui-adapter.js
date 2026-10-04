(function initPowerTeacherUiAdapter(root) {
  'use strict';

  function loadContract() {
    if (typeof module !== 'undefined' && module.exports) return require('./ui-contract.js');
    if (root && root.PSQM && root.PSQM.teacherSupport && root.PSQM.teacherSupport.powerTeacherUiContract) {
      return root.PSQM.teacherSupport.powerTeacherUiContract;
    }
    throw new Error('PowerTeacher UI contract is unavailable.');
  }

  function createPowerTeacherUiAdapter({ document, location, getComputedStyle }) {
    if (!document || typeof document.querySelector !== 'function' || typeof document.querySelectorAll !== 'function') {
      throw new TypeError('document with querySelector/querySelectorAll is required.');
    }
    const contract = loadContract();
    const { SELECTORS, TARGET_SELECTORS, normalizeText, readRoutePath, isAllowedLocation, isComputedVisible } = contract;

    function visible(node) {
      return isComputedVisible(node, getComputedStyle);
    }

    function readLabel(node) {
      if (!node) return '';
      return normalizeText(
        node.textContent ||
        (typeof node.getAttribute === 'function' && node.getAttribute('aria-label')) ||
        (typeof node.getAttribute === 'function' && node.getAttribute('title')) ||
        ''
      );
    }

    function readVisibleGrids() {
      return [...document.querySelectorAll(SELECTORS.standardsGrid)].filter(visible);
    }

    function readVerifiedStandardsGrid() {
      if (!isAllowedLocation(location)) return null;
      const container = document.querySelector(SELECTORS.standardsContainer);
      if (!visible(container)) return null;
      const semanticText = normalizeText(
        (container && container.textContent) ||
        (container && typeof container.getAttribute === 'function' && container.getAttribute('aria-label')) ||
        ''
      ).toLowerCase();
      if (!semanticText.includes('standards')) return null;
      const grids = readVisibleGrids();
      return grids.length === 1 ? grids[0] : null;
    }

    function readRenderedHeaders(grid) {
      if (!grid) return Object.freeze([]);
      return Object.freeze(
        [...grid.querySelectorAll(SELECTORS.standardHeader)].map((header, standardPosition) =>
          Object.freeze({
            standardPosition,
            text: normalizeText(header && header.textContent),
            title: normalizeText(
              header && (
                header.title ||
                (typeof header.getAttribute === 'function' && header.getAttribute('title'))
              )
            ),
            ariaLabel: normalizeText(
              header && typeof header.getAttribute === 'function' && header.getAttribute('aria-label')
            ),
          })
        )
      );
    }

    function isSelectedStandardCell(cell) {
      if (!cell || !cell.classList || typeof cell.classList.contains !== 'function') return false;
      const keypad = cell.classList.contains('keypad-cell');
      const highlighted = cell.classList.contains('highlight');
      const ariaSelected = typeof cell.getAttribute === 'function' && cell.getAttribute('aria-selected') === 'true';
      const dataSelected = typeof cell.getAttribute === 'function' && cell.getAttribute('data-selected') === 'true';
      return keypad && (highlighted || ariaSelected || dataSelected);
    }

    function readSelectedCell(grid) {
      if (!grid) return Object.freeze({ found: false, standardPosition: null });
      const selected = [...grid.querySelectorAll(SELECTORS.standardCell)].filter(isSelectedStandardCell);
      if (selected.length !== 1) return Object.freeze({ found: false, standardPosition: null });
      const cell = selected[0];
      const row = cell.parentElement;
      if (!row || typeof row.querySelectorAll !== 'function') {
        return Object.freeze({ found: false, standardPosition: null });
      }
      const standardCells = [...row.querySelectorAll(SELECTORS.standardCell)];
      const standardPosition = standardCells.indexOf(cell);
      if (standardPosition < 0) return Object.freeze({ found: false, standardPosition: null });
      return Object.freeze({ found: true, standardPosition });
    }

    function readScale() {
      const inspector = document.querySelector(SELECTORS.nativeInspector);
      if (!visible(inspector)) {
        return Object.freeze({ open: false, codes: Object.freeze([]) });
      }
      const codes = [...document.querySelectorAll(SELECTORS.nativeScoreChoice)]
        .filter(visible)
        .map((node) => readLabel(node))
        .filter(Boolean);
      return Object.freeze({ open: true, codes: Object.freeze(codes) });
    }

    function readTeacherUiState() {
      const platformVerified = isAllowedLocation(location);
      const routePath = readRoutePath(location);
      const gradingNav = document.querySelector(SELECTORS.gradingNav);
      const standardsNav = document.querySelector(SELECTORS.standardsNav);
      const grid = readVerifiedStandardsGrid();
      const visibleGrids = readVisibleGrids();
      const gear = document.querySelector(SELECTORS.specialFunctions);
      const filterToggle = document.querySelector(SELECTORS.filterToggle);
      const filterInput = document.querySelector(SELECTORS.filterInput);
      const courseLabel = document.querySelector(SELECTORS.courseLabel);
      const scale = readScale();

      const gradingActive = Boolean(
        gradingNav && (
          (typeof gradingNav.getAttribute === 'function' && ['page', 'true'].includes(gradingNav.getAttribute('aria-current'))) ||
          (gradingNav.classList && typeof gradingNav.classList.contains === 'function' && gradingNav.classList.contains('active'))
        )
      );

      return Object.freeze({
        platformVerified,
        routePath,
        courseLabel: normalizeText(courseLabel && courseLabel.textContent),
        grading: Object.freeze({
          available: visible(gradingNav),
          active: gradingActive,
        }),
        standards: Object.freeze({
          available: visible(standardsNav),
          verified: Boolean(grid),
          gridCount: visibleGrids.length,
          gearVisible: visible(gear),
        }),
        filter: Object.freeze({
          visible: visible(filterInput),
          value: normalizeText(filterInput && filterInput.value),
          toggleLabel: readLabel(filterToggle),
        }),
        renderedHeaders: readRenderedHeaders(grid),
        selectedCell: readSelectedCell(grid),
        scale: Object.freeze({ codes: scale.codes }),
        nativeInspectorOpen: scale.open,
      });
    }

    function getNativeTarget(targetKey) {
      const selector = TARGET_SELECTORS[targetKey];
      if (!selector) return null;
      const target = document.querySelector(selector);
      return visible(target) ? target : null;
    }

    function getVerifiedStandardsGrid() {
      return readVerifiedStandardsGrid();
    }

    function classifyNativeInteraction(target) {
      if (!target || typeof target.closest !== 'function') return Object.freeze({ kind: 'other' });
      const cell = target.closest(SELECTORS.standardCell);
      if (!cell) return Object.freeze({ kind: 'other' });
      const grid = readVerifiedStandardsGrid();
      if (!grid) return Object.freeze({ kind: 'other' });
      if (typeof grid.contains === 'function' && !grid.contains(cell)) return Object.freeze({ kind: 'other' });
      if (typeof grid.contains !== 'function') {
        const cells = [...grid.querySelectorAll(SELECTORS.standardCell)];
        if (!cells.includes(cell)) return Object.freeze({ kind: 'other' });
      }
      return Object.freeze({ kind: 'standard-cell' });
    }

    return Object.freeze({
      readTeacherUiState,
      getNativeTarget,
      getVerifiedStandardsGrid,
      classifyNativeInteraction,
    });
  }

  if (root) {
    root.PSQM = root.PSQM || {};
    root.PSQM.teacherSupport = root.PSQM.teacherSupport || {};
    root.PSQM.teacherSupport.createPowerTeacherUiAdapter = createPowerTeacherUiAdapter;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createPowerTeacherUiAdapter };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
