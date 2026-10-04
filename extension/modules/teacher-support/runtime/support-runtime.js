(function initTeacherSupportRuntime(rootGlobal) {
  'use strict';

  const ROOT_ID = 'hub-assistant-teacher-support-root';

  function createSupportRuntime({
    window,
    document,
    adapter,
    controller,
    ui,
    contextProvider,
    assetUrl,
  }) {
    if (!window || typeof window.addEventListener !== 'function' || typeof window.removeEventListener !== 'function') {
      throw new TypeError('window event API is required.');
    }
    if (!document || !document.body || typeof document.createElement !== 'function') {
      throw new TypeError('document.body and createElement are required.');
    }
    if (!adapter || typeof adapter.readTeacherUiState !== 'function') {
      throw new TypeError('adapter.readTeacherUiState is required.');
    }
    if (!controller || typeof controller.evaluate !== 'function') {
      throw new TypeError('controller.evaluate is required.');
    }
    if (!ui || typeof ui.createEntryButton !== 'function'
      || typeof ui.createAssistantPanel !== 'function'
      || typeof ui.createScoreInspector !== 'function') {
      throw new TypeError('Teacher Support UI factories are required.');
    }
    if (typeof contextProvider !== 'function') {
      throw new TypeError('contextProvider is required.');
    }

    let started = false;
    let state = 'STOPPED';
    let panelOpen = false;
    let quiet = false;
    let referenceMode = false;
    let contextFresh = false;
    let contextEpoch = 0;
    let selectedReferenceLevel = null;
    let selectedAreaId = null;
    let assistLanguage = null;

    let root = null;
    let entry = null;
    let panel = null;
    let inspector = null;

    let routeListenersBound = false;
    let routeInvalidationPending = false;
    let currentGrid = null;
    let currentGridHandler = null;
    let currentResult = null;
    let currentUiState = null;
    let currentAreaId = null;
    let currentOfficialTitle = '';
    let entryAttentionPending = true;

    function safeBaseContext() {
      const value = contextProvider();
      return value && typeof value === 'object' ? value : {};
    }

    function currentContext() {
      return Object.freeze({
        ...safeBaseContext(),
        contextFresh,
        contextEpoch,
      });
    }

    function getOptions() {
      if (typeof controller.getReferenceOptions !== 'function') return null;
      return controller.getReferenceOptions(currentContext());
    }

    function resetAssistLanguage() {
      const options = getOptions();
      assistLanguage = options && options.defaultAssistLanguage || null;
    }

    function snapshot() {
      return Object.freeze({
        started,
        state,
        panelOpen,
        quiet,
        referenceMode,
        contextFresh,
        contextEpoch,
        selectedReferenceLevel,
        assistLanguage,
        listenersBound: Object.freeze({
          hashchange: routeListenersBound,
          popstate: routeListenersBound,
          grid: Boolean(currentGrid && currentGridHandler),
        }),
      });
    }

    function ensureOwnedRoot() {
      if (root) return root;
      root = document.querySelector('#' + ROOT_ID);
      if (!root) {
        root = document.createElement('div');
        root.id = ROOT_ID;
        document.body.appendChild(root);
      }
      return root;
    }

    function handleIntent(intent) {
      if (!started) return;

      if (typeof intent === 'string') {
        if (intent === 'open' || intent === 'guide' || intent === 'resume') {
          panelOpen = true;
          quiet = false;
          referenceMode = false;
          reconcile(intent);
          return;
        }

        if (intent === 'reference') {
          panelOpen = true;
          quiet = false;
          referenceMode = true;
          selectedAreaId = null;
          selectedReferenceLevel = null;
          resetAssistLanguage();
          reconcile('reference');
          return;
        }

        if (intent === 'quiet') {
          quiet = true;
          panelOpen = false;
          referenceMode = false;
          selectedReferenceLevel = null;
          selectedAreaId = null;
          if (panel) panel.close();
          if (inspector) inspector.reset();
          reconcile('quiet');
          return;
        }

        if (intent === 'show-target') {
          showCurrentTarget();
          return;
        }

        if (intent === 'close') {
          panelOpen = false;
          referenceMode = false;
          if (panel) {
            panel.close();
            panel.clearTargetHint();
          }
          if (inspector) inspector.reset();
        }
        return;
      }

      if (!intent || typeof intent !== 'object') return;
      const options = getOptions() || {};
      if (intent.type === 'reference-area' && referenceMode) {
        const areas = Array.isArray(options.areas) ? options.areas : [];
        if (!areas.some((area) => area && area.id === intent.value)) return;
        selectedAreaId = intent.value;
        selectedReferenceLevel = null;
        renderInspector('reference');
        return;
      }

      if (intent.type === 'reference-level') {
        const levels = Array.isArray(options.levelCodes) ? options.levelCodes : [];
        if (!levels.includes(intent.value)) return;
        selectedReferenceLevel = intent.value;
        renderInspector(referenceMode ? 'reference' : 'contextual');
        return;
      }

      if (intent.type === 'assist-language') {
        const languages = Array.isArray(options.assistLanguages) ? options.assistLanguages : [];
        if (!languages.includes(intent.value)) return;
        assistLanguage = intent.value;
        renderInspector(referenceMode ? 'reference' : 'contextual');
      }
    }

    function ensureUi() {
      const host = ensureOwnedRoot();
      if (!entry) entry = ui.createEntryButton({ document, root: host, onIntent: handleIntent });
      if (!panel) panel = ui.createAssistantPanel({ document, root: host, assetUrl, onIntent: handleIntent });
      if (!inspector) inspector = ui.createScoreInspector({ document, root: host, onIntent: handleIntent });
    }

    function queueMicrotaskSafe(fn) {
      if (typeof window.queueMicrotask === 'function') {
        window.queueMicrotask(fn);
        return;
      }
      queueMicrotask(fn);
    }

    function unbindGrid() {
      if (currentGrid && currentGridHandler) currentGrid.removeEventListener('click', currentGridHandler);
      currentGrid = null;
      currentGridHandler = null;
    }

    function bindGrid(grid) {
      if (grid === currentGrid && currentGridHandler) return;
      unbindGrid();
      if (!grid || typeof grid.addEventListener !== 'function') return;

      currentGrid = grid;
      currentGridHandler = (event) => {
        const classification = adapter.classifyNativeInteraction(event && event.target);
        if (!classification || classification.kind !== 'standard-cell') return;
        const observedGrid = currentGrid;
        queueMicrotaskSafe(() => {
          if (!started || currentGrid !== observedGrid) return;
          reconcile('native-standard-cell');
        });
      };
      currentGrid.addEventListener('click', currentGridHandler);
    }

    function onRouteEvent() {
      if (!started || routeInvalidationPending) return;
      routeInvalidationPending = true;
      invalidate('route');
      queueMicrotaskSafe(() => {
        routeInvalidationPending = false;
      });
    }

    function bindRouteListeners() {
      if (routeListenersBound) return;
      window.addEventListener('hashchange', onRouteEvent);
      window.addEventListener('popstate', onRouteEvent);
      routeListenersBound = true;
    }

    function unbindRouteListeners() {
      if (!routeListenersBound) return;
      window.removeEventListener('hashchange', onRouteEvent);
      window.removeEventListener('popstate', onRouteEvent);
      routeListenersBound = false;
    }

    function renderEntry() {
      if (!entry) return;
      const reducedMotion = Boolean(
        typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      );
      entry.render({
        visible: true,
        attention: entryAttentionPending,
        reducedMotion,
        label: 'Teacher Support',
      });
      entryAttentionPending = false;
    }

    function panelModel(result) {
      const viewModel = result && result.viewModel || {};
      const actions = [];
      if (viewModel && viewModel.targetKey) actions.push({ intent: 'show-target', label: 'Show me' });
      actions.push(
        { intent: 'resume', label: 'Help me from here' },
        { intent: 'reference', label: 'Quick reference' },
        { intent: 'quiet', label: 'I know already' },
        { intent: 'close', label: 'Close' }
      );
      return {
        open: true,
        title: 'Teacher Support',
        message: viewModel.message || result && result.reason || '',
        robotVisible: true,
        stepId: viewModel.stepId || null,
        targetKey: viewModel.targetKey || null,
        actions,
      };
    }

    function referenceData(mode) {
      const context = currentContext();
      const options = getOptions() || {};
      const areaId = mode === 'reference' ? selectedAreaId : currentAreaId;
      let reference = null;
      if (areaId && selectedReferenceLevel && typeof controller.getReference === 'function') {
        const base = safeBaseContext();
        reference = controller.getReference({
          context,
          areaId,
          levelCode: selectedReferenceLevel,
          language: assistLanguage,
          subject: base.subject,
        });
      }

      const areas = Array.isArray(options.areas) ? options.areas : [];
      const selectedArea = areas.find((area) => area && area.id === areaId) || null;
      return {
        mode,
        referenceOnlyLabel: mode === 'reference' ? 'Reference only' : null,
        areas: mode === 'reference' ? areas : [],
        selectedAreaId: mode === 'reference' ? selectedAreaId : currentAreaId,
        officialTitle: reference && reference.officialTitle
          || currentOfficialTitle
          || selectedArea && selectedArea.title
          || '',
        levelCodes: Array.isArray(options.levelCodes) ? options.levelCodes : [],
        selectedReferenceLevel,
        assistLanguage: assistLanguage || options.defaultAssistLanguage || '',
        assistLanguages: Array.isArray(options.assistLanguages) ? options.assistLanguages : [],
        officialCriterion: reference && reference.officialCriterion || null,
        plainExplanation: reference && reference.plainExplanation || null,
        evidence: reference && reference.evidence || [],
        checklist: reference && reference.checklist || [],
        comparison: reference && reference.comparison || null,
        subjectExample: reference && reference.subjectExample || null,
        teacherDecisionMessage: reference && reference.teacherDecisionMessage || '',
      };
    }

    function renderInspector(mode) {
      if (!inspector) return;
      inspector.render(referenceData(mode));
    }

    function renderCurrentState() {
      renderEntry();
      if (!currentResult) return;

      if (currentResult.state === 'CONTEXT_READY' && panelOpen) {
        currentAreaId = currentResult.viewModel && currentResult.viewModel.areaId || null;
        currentOfficialTitle = currentResult.viewModel && currentResult.viewModel.officialTitle || '';
        panel.close();
        renderInspector('contextual');
        return;
      }

      if (currentResult.state === 'REFERENCE' && referenceMode) {
        currentAreaId = null;
        currentOfficialTitle = '';
        panel.close();
        renderInspector('reference');
        return;
      }

      if (currentResult.state === 'QUIET') {
        panel.close();
        inspector.reset();
        return;
      }

      currentAreaId = null;
      currentOfficialTitle = '';
      inspector.reset();
      if (panelOpen) panel.render(panelModel(currentResult));
    }

    function applyUiState(uiState) {
      currentUiState = uiState;
      const verifiedGrid = uiState && uiState.standards && uiState.standards.verified === true
        ? adapter.getVerifiedStandardsGrid()
        : null;
      bindGrid(verifiedGrid);

      const mode = quiet ? 'quiet' : referenceMode ? 'reference' : 'active';
      currentResult = controller.evaluate({
        context: currentContext(),
        uiState,
        mode,
      });
      state = currentResult.state;
      renderCurrentState();
      return snapshot();
    }

    function start() {
      if (started) return snapshot();
      const uiState = adapter.readTeacherUiState();
      if (!uiState || uiState.platformVerified !== true) return snapshot();

      started = true;
      state = 'DORMANT';
      contextFresh = true;
      ensureUi();
      bindRouteListeners();
      resetAssistLanguage();
      return applyUiState(uiState);
    }

    function reconcile() {
      if (!started) return snapshot();
      const uiState = adapter.readTeacherUiState();
      if (!uiState || uiState.platformVerified !== true) return destroy();
      contextFresh = true;
      return applyUiState(uiState);
    }

    function invalidate() {
      if (!started) return snapshot();
      contextFresh = false;
      contextEpoch += 1;
      selectedReferenceLevel = null;
      selectedAreaId = null;
      currentAreaId = null;
      currentOfficialTitle = '';
      currentResult = null;
      currentUiState = null;
      state = 'CONTEXT_UNVERIFIED';
      unbindGrid();
      resetAssistLanguage();
      if (panel) panel.clearTargetHint();
      if (inspector) inspector.reset();
      return snapshot();
    }

    function showCurrentTarget() {
      const targetKey = currentResult && currentResult.viewModel && currentResult.viewModel.targetKey;
      if (!targetKey || !panel) return;
      const target = adapter.getNativeTarget(targetKey);
      if (!target || typeof target.getBoundingClientRect !== 'function') return;
      const rect = target.getBoundingClientRect();
      panel.renderTargetHint({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    }

    function destroy() {
      unbindGrid();
      unbindRouteListeners();
      routeInvalidationPending = false;

      if (entry) entry.destroy();
      if (panel) panel.destroy();
      if (inspector) inspector.destroy();
      entry = null;
      panel = null;
      inspector = null;

      if (root) root.remove();
      root = null;

      started = false;
      state = 'STOPPED';
      panelOpen = false;
      quiet = false;
      referenceMode = false;
      contextFresh = false;
      selectedReferenceLevel = null;
      selectedAreaId = null;
      assistLanguage = null;
      currentResult = null;
      currentUiState = null;
      currentAreaId = null;
      currentOfficialTitle = '';
      entryAttentionPending = true;
      return snapshot();
    }

    return Object.freeze({
      start,
      reconcile,
      invalidate,
      destroy,
      snapshot,
    });
  }

  if (rootGlobal) {
    rootGlobal.PSQM = rootGlobal.PSQM || {};
    rootGlobal.PSQM.teacherSupport = rootGlobal.PSQM.teacherSupport || {};
    rootGlobal.PSQM.teacherSupport.createSupportRuntime = createSupportRuntime;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createSupportRuntime };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
