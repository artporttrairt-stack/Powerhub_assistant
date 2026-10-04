(() => {
  'use strict';

  const policy = globalThis.SIS_POWERTEACHER_ONBOARDING_POLICY;
  const config = globalThis.SIS_START_PAGE_TOUR_CONFIG;
  const gradeEntry = globalThis.SIS_GRADE_ENTRY_HANDOFF;
  if (!policy || !config || !gradeEntry) return;

  const { STORAGE_KEYS } = policy;
  const count = (selector, root = document) => root.querySelectorAll(selector).length;

  const hubSurface = policy.isVerifiedHubSurface({
    pathname: location.pathname,
    count: (selector) => count(selector),
  });

  const writeHubLocale = () => {
    const locale = policy.normalizeHubLocale(document.documentElement.lang);
    if (!locale) return;
    chrome.storage.local.set({ [STORAGE_KEYS.hubLocale]: locale });
  };

  const hubUiState = {
    locale: null,
    alreadyKnown: false,
    discoveryPending: false,
    startPageTourCompleted: false,
    panelMode: null,
  };

  const setHubText = (node, value) => {
    node.replaceChildren(document.createTextNode(String(value)));
  };

  const makeHubNode = (tag, cssClass, label) => {
    const node = document.createElement(tag);
    if (cssClass) node.classList.add(...cssClass.split(' ').filter(Boolean));
    if (label !== undefined) setHubText(node, label);
    return node;
  };

  const clearHubPanel = () => {
    document.getElementById('ai-my-hub-pt-modal-shield')?.remove();
    document.getElementById('ai-my-hub-pt-modal')?.remove();
    hubUiState.panelMode = null;
  };

  const hubButton = (label, cssClass, handler) => {
    const button = makeHubNode('button', cssClass, label);
    button.type = 'button';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      handler();
    });
    return button;
  };

  const persistHubKnown = () => new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.powerTeacherAlreadyKnown]: true }, resolve);
  });

  const persistDiscoveryPending = () => new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.powerTeacherDiscoveryPending]: true }, resolve);
  });

  const clearHubDiscoveryPending = () => new Promise((resolve) => {
    chrome.storage.local.remove(STORAGE_KEYS.powerTeacherDiscoveryPending, resolve);
  });

  const buildHubPanel = (copyBlock, title, body) => {
    clearHubPanel();
    const shield = makeHubNode('div', 'ai-my-pt-modal-shield');
    shield.id = 'ai-my-hub-pt-modal-shield';
    shield.style.zIndex = '2147483603';
    const panel = makeHubNode('section', 'ai-my-pt-modal');
    panel.id = 'ai-my-hub-pt-modal';
    panel.style.zIndex = '2147483604';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', title);
    panel.append(
      makeHubNode('div', 'ai-my-pt-eyebrow', 'PowerTeacher'),
      makeHubNode('h2', 'ai-my-pt-title', title),
      makeHubNode('p', 'ai-my-pt-intro', body),
    );
    document.documentElement.append(shield, panel);
    return { panel, copyBlock };
  };

  const showHubContinueCue = () => {
    const c = policy.getOnboardingCopy(hubUiState.locale);
    if (!c) return;
    hubUiState.panelMode = 'continue';
    const { panel } = buildHubPanel(c, c.title, c.openPowerTeacher);
    const controls = makeHubNode('div', 'ai-my-pt-controls');
    controls.append(hubButton(c.close, 'ai-my-pt-btn ai-my-pt-btn-primary', clearHubPanel));
    panel.append(controls);
    hubUiState.panelMode = 'continue';
  };

  const showHubDiscoveryPrompt = () => {
    const c = policy.getOnboardingCopy(hubUiState.locale);
    if (!c) return;
    const { panel } = buildHubPanel(c, c.title, c.body);
    const choices = makeHubNode('div', 'ai-my-pt-choice-stack');

    choices.append(
      hubButton(c.yes, 'ai-my-pt-btn ai-my-pt-btn-primary', async () => {
        const effect = policy.reduceHubDiscoveryChoice('yes');
        if (!effect.close) return;
        clearHubPanel();
        if (effect.persistDiscoveryPending) {
          await persistDiscoveryPending();
          hubUiState.discoveryPending = true;
        }
        showHubContinueCue();
      }),
      hubButton(c.later, 'ai-my-pt-btn', () => {
        const effect = policy.reduceHubDiscoveryChoice('later');
        if (effect.close) clearHubPanel();
      }),
      hubButton(c.alreadyKnown, 'ai-my-pt-btn ai-my-pt-btn-quiet', async () => {
        const effect = policy.reduceHubDiscoveryChoice('already-known');
        if (!effect.close) return;
        clearHubPanel();
        if (effect.persistAlreadyKnown) {
          await persistHubKnown();
          await clearHubDiscoveryPending();
          hubUiState.alreadyKnown = true;
          hubUiState.discoveryPending = false;
        }
      }),
    );
    panel.append(choices);
    hubUiState.panelMode = 'prompt';
  };

  const installHubLauncher = () => {
    if (document.getElementById('ai-my-hub-powerteacher-guide-launcher')) return;
    const c = policy.getOnboardingCopy(hubUiState.locale);
    if (!c) return;
    const launcher = makeHubNode('button', 'ai-my-pt-launcher', c.launcher);
    launcher.id = 'ai-my-hub-powerteacher-guide-launcher';
    launcher.type = 'button';
    launcher.style.zIndex = '2147483599';
    launcher.addEventListener('click', () => {
      if (hubUiState.alreadyKnown || hubUiState.discoveryPending || hubUiState.startPageTourCompleted) showHubContinueCue();
      else showHubDiscoveryPrompt();
    });
    document.documentElement.append(launcher);
  };

  const refreshHubUiLanguage = () => {
    const nextLocale = policy.normalizeHubLocale(document.documentElement.lang);
    if (!nextLocale || nextLocale === hubUiState.locale) return;
    hubUiState.locale = nextLocale;
    writeHubLocale();
    const launcher = document.getElementById('ai-my-hub-powerteacher-guide-launcher');
    const c = policy.getOnboardingCopy(nextLocale);
    if (launcher && c) setHubText(launcher, c.launcher);
    if (hubUiState.panelMode === 'prompt') showHubDiscoveryPrompt();
    else if (hubUiState.panelMode === 'continue') showHubContinueCue();
  };

  const initializeHubSurface = async () => {
    hubUiState.locale = policy.normalizeHubLocale(document.documentElement.lang);
    if (!hubUiState.locale) return;
    writeHubLocale();

    const stored = await new Promise((resolve) => {
      chrome.storage.local.get(
        [
          STORAGE_KEYS.powerTeacherAlreadyKnown,
          STORAGE_KEYS.powerTeacherDiscoveryPending,
          STORAGE_KEYS.startPageTourCompleted,
        ],
        (data) => resolve(data || {}),
      );
    });
    hubUiState.alreadyKnown = stored[STORAGE_KEYS.powerTeacherAlreadyKnown] === true;
    hubUiState.discoveryPending = stored[STORAGE_KEYS.powerTeacherDiscoveryPending] === true;
    hubUiState.startPageTourCompleted = stored[STORAGE_KEYS.startPageTourCompleted] === true;

    installHubLauncher();
    if (hubUiState.discoveryPending) {
      setTimeout(showHubContinueCue, 200);
    } else if (policy.shouldAutoShowHubDiscovery({
      alreadyKnown: hubUiState.alreadyKnown,
      startPageTourCompleted: hubUiState.startPageTourCompleted,
    })) {
      setTimeout(showHubDiscoveryPrompt, 200);
    }

    const localeObserver = new MutationObserver(refreshHubUiLanguage);
    localeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang'],
    });
  };

  if (hubSurface) {
    initializeHubSurface();
    return;
  }

  if (location.pathname !== config.startPagePath) return;
  if (count(`#${config.tableId}`) !== 1) return;
  if (document.getElementById('ai-my-powerteacher-guide-launcher')) return;

  const Z = 2147483600;
  const state = {
    hubLocale: null,
    storedHubLocale: null,
    testLocale: 'en',
    alreadyKnown: false,
    discoveryPending: false,
    startPageTourCompleted: false,
    gradeEntryAlreadyKnown: false,
    onboardingPresented: false,
    active: false,
    diagnosticsOpen: false,
    stepIndex: 0,
    currentTarget: null,
    tourEntryMode: 'manual',
    pendingTourEntryMode: 'manual',
    gradeHandoffActive: false,
    gradeTarget: null,
    gradeTargetClickHandler: null,
  };

  const setText = (node, value) => {
    node.replaceChildren(document.createTextNode(String(value)));
  };

  const make = (tag, cssClass, label) => {
    const node = document.createElement(tag);
    if (cssClass) node.classList.add(...cssClass.split(' ').filter(Boolean));
    if (label !== undefined) setText(node, label);
    return node;
  };

  const visible = (node) => {
    if (!node || typeof node.getBoundingClientRect !== 'function') return false;
    const rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  const guidanceLocale = () => policy.resolvePrototypeGuidanceLocale({
    hubLocale: state.hubLocale,
    testLocale: state.testLocale,
  });
  const copy = () => policy.getOnboardingCopy(guidanceLocale());

  const getStoredState = () => new Promise((resolve) => {
    chrome.storage.local.get(
      [
        STORAGE_KEYS.hubLocale,
        STORAGE_KEYS.powerTeacherAlreadyKnown,
        STORAGE_KEYS.powerTeacherDiscoveryPending,
        STORAGE_KEYS.startPageTourCompleted,
        STORAGE_KEYS.gradeEntryAlreadyKnown,
      ],
      (data) => resolve(data || {}),
    );
  });

  const persistAlreadyKnown = () => new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.powerTeacherAlreadyKnown]: true }, resolve);
  });

  const persistStartPageTourCompleted = () => new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.startPageTourCompleted]: true }, resolve);
  });

  const persistGradeEntryAlreadyKnown = () => new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.gradeEntryAlreadyKnown]: true }, resolve);
  });

  const persistDisplaySettingsOnboardingPending = () => new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.displaySettingsOnboardingPending]: true }, resolve);
  });

  const clearDiscoveryPending = () => new Promise((resolve) => {
    chrome.storage.local.remove(STORAGE_KEYS.powerTeacherDiscoveryPending, resolve);
  });

  const removeById = (id) => {
    const node = document.getElementById(id);
    if (node) node.remove();
  };

  const clearModal = () => {
    removeById('ai-my-pt-modal-shield');
    removeById('ai-my-pt-modal');
  };

  const clearTourChrome = () => {
    removeById('ai-my-pt-tour-shield');
    removeById('ai-my-pt-tour-spotlight');
    removeById('ai-my-pt-tour-card');
    state.currentTarget = null;
  };

  const clearDiagnostics = () => {
    removeById('ai-my-pt-diagnostics-shield');
    removeById('ai-my-pt-diagnostics');
    state.diagnosticsOpen = false;
  };

  const clearGradeHandoff = () => {
    if (state.gradeTarget && state.gradeTargetClickHandler) {
      state.gradeTarget.removeEventListener('click', state.gradeTargetClickHandler);
    }
    removeById('ai-my-pt-grade-spotlight');
    removeById('ai-my-pt-grade-card');
    state.gradeHandoffActive = false;
    state.gradeTarget = null;
    state.gradeTargetClickHandler = null;
  };

  const stopTour = () => {
    state.active = false;
    clearTourChrome();
  };

  const resolveTable = () => {
    const tables = document.querySelectorAll(`#${config.tableId}`);
    if (tables.length === 0) return { status: 'MISSING', target: null };
    if (tables.length > 1) return { status: 'AMBIGUOUS', target: null };
    const table = tables[0];
    const headers = table.querySelectorAll('th');
    if (headers.length !== config.expectedHeaderCount) {
      return { status: 'STRUCTURE_MISMATCH', target: null };
    }
    return { status: 'FOUND', target: table, headers };
  };

  const resolveNavigation = () => {
    const matches = document.querySelectorAll('#navHome');
    if (matches.length === 0) return { status: 'MISSING', target: null };
    if (matches.length > 1) return { status: 'AMBIGUOUS', target: null };
    const home = matches[0];
    const region = home.closest('nav, ul') || home.parentElement || home;
    return { status: visible(region) ? 'FOUND' : 'MISSING', target: visible(region) ? region : null };
  };

  const resolveHeader = (cellIndex) => {
    const base = resolveTable();
    if (base.status !== 'FOUND') return base;
    const header = base.headers[cellIndex] || null;
    if (!header || !visible(header)) return { status: 'MISSING', target: null };
    return { status: 'FOUND', target: header };
  };

  const resolveActionColumn = (cellIndex) => {
    const base = resolveTable();
    if (base.status !== 'FOUND') return base;
    const header = base.headers[cellIndex] || null;
    if (!header) return { status: 'MISSING', target: null };

    const controls = [];
    for (const body of base.target.tBodies) {
      for (const row of body.rows) {
        const cell = row.cells[cellIndex];
        if (!cell) continue;
        for (const candidate of cell.querySelectorAll('a, button, [role="button"]')) {
          if (visible(candidate)) controls.push(candidate);
        }
      }
    }

    if (controls.length > 0) return { status: 'FOUND', target: controls[0] };
    if (visible(header)) return { status: 'FOUND', target: header };
    return { status: 'MISSING', target: null };
  };

  const resolveStep = (step) => {
    if (step.anchor.kind === 'navigation') return resolveNavigation();
    if (step.anchor.kind === 'header') return resolveHeader(step.anchor.cellIndex);
    if (step.anchor.kind === 'action-column') return resolveActionColumn(step.anchor.cellIndex);
    return { status: 'MISSING', target: null };
  };

  const audit = () => config.steps.map((step) => ({ step, result: resolveStep(step) }));

  const statusLabel = (status) => {
    const c = copy();
    if (!c) return status;
    if (status === 'FOUND') return c.found;
    if (status === 'AMBIGUOUS') return c.ambiguous;
    if (status === 'STRUCTURE_MISMATCH') return c.mismatch;
    return c.missing;
  };

  const makeButton = (label, cssClass, handler) => {
    const button = make('button', cssClass, label);
    button.type = 'button';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      handler();
    });
    return button;
  };

  const setPrototypeTestLocale = (locale) => {
    if (state.hubLocale) return;
    state.testLocale = locale === 'vi' ? 'vi' : 'en';
    refreshLauncherLabel();
  };

  const renderPrototypeLocaleControls = (rerender) => {
    if (state.hubLocale) return null;
    const c = copy();
    if (!c) return null;
    const row = make('div', 'ai-my-pt-test-locale');
    row.append(make('span', 'ai-my-pt-test-locale-label', c.testLanguage));
    const buttons = make('div', 'ai-my-pt-test-locale-buttons');
    buttons.append(
      makeButton('EN', state.testLocale === 'en' ? 'ai-my-pt-btn ai-my-pt-btn-primary' : 'ai-my-pt-btn', () => {
        setPrototypeTestLocale('en');
        rerender();
      }),
      makeButton('VI', state.testLocale === 'vi' ? 'ai-my-pt-btn ai-my-pt-btn-primary' : 'ai-my-pt-btn', () => {
        setPrototypeTestLocale('vi');
        rerender();
      }),
    );
    row.append(buttons);
    return row;
  };

  const positionGradeHandoff = () => {
    if (!state.gradeHandoffActive || !state.gradeTarget) return;
    const spotlight = document.getElementById('ai-my-pt-grade-spotlight');
    const card = document.getElementById('ai-my-pt-grade-card');
    if (!spotlight || !card) return;
    const rect = state.gradeTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const pad = 6;
    spotlight.style.left = `${Math.max(4, rect.left - pad)}px`;
    spotlight.style.top = `${Math.max(4, rect.top - pad)}px`;
    spotlight.style.width = `${Math.min(innerWidth - 8, rect.width + pad * 2)}px`;
    spotlight.style.height = `${Math.min(innerHeight - 8, rect.height + pad * 2)}px`;

    const cardRect = card.getBoundingClientRect();
    let left = rect.right + 18;
    if (left + cardRect.width > innerWidth - 12) left = Math.max(12, rect.left - cardRect.width - 18);
    let top = rect.top;
    if (top + cardRect.height > innerHeight - 12) top = Math.max(12, innerHeight - cardRect.height - 12);
    card.style.left = `${Math.max(12, left)}px`;
    card.style.top = `${Math.max(12, top)}px`;
  };

  const showGradeEntryHandoff = () => {
    clearModal();
    clearGradeHandoff();
    const c = copy();
    if (!c) return;
    const resolved = gradeEntry.resolvePowerTeacherProTarget(document);
    if (resolved.status !== 'FOUND' || !visible(resolved.target)) {
      const shield = make('div', 'ai-my-pt-modal-shield');
      shield.id = 'ai-my-pt-modal-shield';
      shield.style.zIndex = String(Z + 3);
      const panel = make('section', 'ai-my-pt-modal');
      panel.id = 'ai-my-pt-modal';
      panel.style.zIndex = String(Z + 4);
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      panel.setAttribute('aria-label', c.gradeEntryTitle);
      panel.append(
        make('h2', 'ai-my-pt-title', c.gradeEntryTitle),
        make('p', 'ai-my-pt-warning', c.gradeEntryUnavailable),
      );
      const controls = make('div', 'ai-my-pt-controls');
      controls.append(makeButton(c.close, 'ai-my-pt-btn ai-my-pt-btn-primary', clearModal));
      panel.append(controls);
      document.documentElement.append(shield, panel);
      return;
    }

    state.gradeHandoffActive = true;
    state.gradeTarget = resolved.target;
    const spotlight = make('div', 'ai-my-pt-tour-spotlight');
    spotlight.id = 'ai-my-pt-grade-spotlight';
    spotlight.style.zIndex = String(Z + 1);
    const card = make('section', 'ai-my-pt-card');
    card.id = 'ai-my-pt-grade-card';
    card.style.zIndex = String(Z + 2);
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'false');
    card.setAttribute('aria-label', c.gradeEntryTitle);
    card.append(
      make('h2', 'ai-my-pt-title', c.gradeEntryTitle),
      make('p', 'ai-my-pt-intro', c.gradeEntryHandoff),
    );
    const controls = make('div', 'ai-my-pt-controls');
    controls.append(makeButton(c.close, 'ai-my-pt-btn ai-my-pt-btn-quiet', clearGradeHandoff));
    card.append(controls);
    state.gradeTargetClickHandler = () => clearGradeHandoff();
    state.gradeTarget.addEventListener('click', state.gradeTargetClickHandler, { once: true });
    document.documentElement.append(spotlight, card);
    requestAnimationFrame(positionGradeHandoff);
  };

  const handleGradeEntryChoice = async (choice) => {
    const effect = policy.reduceGradeEntryChoice(choice);
    if (!effect.close) return;
    clearModal();
    if (effect.persistAlreadyKnown) {
      await persistGradeEntryAlreadyKnown();
      state.gradeEntryAlreadyKnown = true;
    }
    if (effect.showHandoff) {
      await persistDisplaySettingsOnboardingPending();
      showGradeEntryHandoff();
    }
  };

  const showGradeEntryPrompt = () => {
    clearModal();
    clearGradeHandoff();
    const c = copy();
    if (!c) return;
    const shield = make('div', 'ai-my-pt-modal-shield');
    shield.id = 'ai-my-pt-modal-shield';
    shield.style.zIndex = String(Z + 3);
    const panel = make('section', 'ai-my-pt-modal');
    panel.id = 'ai-my-pt-modal';
    panel.style.zIndex = String(Z + 4);
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', c.gradeEntryTitle);
    panel.append(
      make('div', 'ai-my-pt-eyebrow', 'PowerTeacher Pro'),
      make('h2', 'ai-my-pt-title', c.gradeEntryTitle),
      make('p', 'ai-my-pt-intro', c.gradeEntryBody),
    );
    const localeControls = renderPrototypeLocaleControls(showGradeEntryPrompt);
    if (localeControls) panel.append(localeControls);
    const choices = make('div', 'ai-my-pt-choice-stack');
    choices.append(
      makeButton(c.yes, 'ai-my-pt-btn ai-my-pt-btn-primary', () => handleGradeEntryChoice('yes')),
      makeButton(c.later, 'ai-my-pt-btn', () => handleGradeEntryChoice('later')),
      makeButton(c.alreadyKnown, 'ai-my-pt-btn ai-my-pt-btn-quiet', () => handleGradeEntryChoice('already-known')),
    );
    panel.append(choices);
    document.documentElement.append(shield, panel);
  };

  const positionSpotlight = () => {
    const target = state.currentTarget;
    const spotlight = document.getElementById('ai-my-pt-tour-spotlight');
    const card = document.getElementById('ai-my-pt-tour-card');
    if (!target || !spotlight || !card) return;
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const pad = 6;
    spotlight.style.left = `${Math.max(4, rect.left - pad)}px`;
    spotlight.style.top = `${Math.max(4, rect.top - pad)}px`;
    spotlight.style.width = `${Math.min(innerWidth - 8, rect.width + pad * 2)}px`;
    spotlight.style.height = `${Math.min(innerHeight - 8, rect.height + pad * 2)}px`;

    const cardRect = card.getBoundingClientRect();
    let left = rect.right + 18;
    if (left + cardRect.width > innerWidth - 12) left = Math.max(12, rect.left - cardRect.width - 18);
    let top = rect.top;
    if (top + cardRect.height > innerHeight - 12) top = Math.max(12, innerHeight - cardRect.height - 12);
    card.style.left = `${Math.max(12, left)}px`;
    card.style.top = `${Math.max(12, top)}px`;
  };

  const renderStep = () => {
    clearTourChrome();
    if (!state.active) return;
    const locale = guidanceLocale();
    const c = copy();
    if (!locale || !c) {
      stopTour();
      return;
    }

    const step = config.steps[state.stepIndex];
    const wording = step[locale];
    const resolved = resolveStep(step);

    const shield = make('div', 'ai-my-pt-tour-shield');
    shield.id = 'ai-my-pt-tour-shield';
    shield.style.zIndex = String(Z);
    shield.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
    }, true);

    const spotlight = make('div', 'ai-my-pt-tour-spotlight');
    spotlight.id = 'ai-my-pt-tour-spotlight';
    spotlight.style.zIndex = String(Z + 1);
    if (resolved.status !== 'FOUND') spotlight.classList.add('ai-my-pt-hidden');

    const card = make('section', 'ai-my-pt-card');
    card.id = 'ai-my-pt-tour-card';
    card.style.zIndex = String(Z + 2);
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-label', wording.title);

    card.append(
      make('div', 'ai-my-pt-progress', `${c.step} ${state.stepIndex + 1} / ${config.steps.length}`),
      make('h2', 'ai-my-pt-title', wording.title),
    );

    if (resolved.status === 'FOUND') {
      if (wording.lines.length > 0) {
        const list = make('ul', 'ai-my-pt-lines');
        for (const line of wording.lines) list.append(make('li', '', line));
        card.append(list);
      }
      state.currentTarget = resolved.target;
    } else {
      card.append(
        make('p', 'ai-my-pt-warning', c.unavailable),
        make('div', 'ai-my-pt-status', statusLabel(resolved.status)),
      );
      state.currentTarget = null;
    }

    const controls = make('div', 'ai-my-pt-controls');
    controls.append(makeButton(c.exit, 'ai-my-pt-btn ai-my-pt-btn-quiet', stopTour));
    controls.append(make('span', 'ai-my-pt-spacer'));
    if (state.stepIndex > 0) {
      controls.append(makeButton(c.back, 'ai-my-pt-btn', () => {
        state.stepIndex -= 1;
        renderStep();
      }));
    }
    if (state.stepIndex < config.steps.length - 1) {
      controls.append(makeButton(c.next, 'ai-my-pt-btn ai-my-pt-btn-primary', () => {
        state.stepIndex += 1;
        renderStep();
      }));
    } else {
      controls.append(makeButton(c.done, 'ai-my-pt-btn ai-my-pt-btn-primary', completeTour));
    }
    card.append(controls);
    document.documentElement.append(shield, spotlight, card);
    requestAnimationFrame(positionSpotlight);
  };

  const completeTour = async () => {
    const completedMode = state.tourEntryMode;
    const offerGradeEntry = policy.shouldOfferGradeEntry({
      tourEntryMode: state.tourEntryMode,
      gradeEntryAlreadyKnown: state.gradeEntryAlreadyKnown,
    });
    stopTour();
    if (state.tourEntryMode === 'first-time' && !state.startPageTourCompleted) {
      await persistStartPageTourCompleted();
      state.startPageTourCompleted = true;
    }
    state.tourEntryMode = 'manual';
    if (completedMode === 'first-time' && offerGradeEntry) {
      setTimeout(showGradeEntryPrompt, 120);
    }
  };

  const startTour = (entryMode = 'manual') => {
    clearModal();
    clearDiagnostics();
    clearGradeHandoff();
    state.tourEntryMode = entryMode === 'first-time' ? 'first-time' : 'manual';
    state.active = true;
    state.stepIndex = 0;
    renderStep();
  };

  const showDiagnostics = () => {
    clearModal();
    stopTour();
    clearDiagnostics();
    const locale = guidanceLocale();
    const c = copy();
    if (!locale || !c) return;
    state.diagnosticsOpen = true;
    const results = audit();

    const shield = make('div', 'ai-my-pt-modal-shield');
    shield.id = 'ai-my-pt-diagnostics-shield';
    shield.style.zIndex = String(Z + 3);
    const panel = make('section', 'ai-my-pt-modal');
    panel.id = 'ai-my-pt-diagnostics';
    panel.style.zIndex = String(Z + 4);
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', c.diagnosticsTitle);

    panel.append(
      make('h2', 'ai-my-pt-title', c.diagnosticsTitle),
      make('p', 'ai-my-pt-intro', c.diagnosticsIntro),
    );
    const localeControls = renderPrototypeLocaleControls(showDiagnostics);
    if (localeControls) panel.append(localeControls);

    const list = make('ol', 'ai-my-pt-audit-list');
    for (const entry of results) {
      const item = make('li', 'ai-my-pt-audit-item');
      item.append(
        make('span', 'ai-my-pt-audit-name', entry.step[locale].title),
        make('span', 'ai-my-pt-audit-status', statusLabel(entry.result.status)),
      );
      list.append(item);
    }
    panel.append(list);

    const controls = make('div', 'ai-my-pt-controls');
    controls.append(
      makeButton(c.close, 'ai-my-pt-btn ai-my-pt-btn-quiet', clearDiagnostics),
      makeButton(c.start, 'ai-my-pt-btn ai-my-pt-btn-primary', () => preflightAndStart(state.pendingTourEntryMode)),
    );
    panel.append(controls);
    document.documentElement.append(shield, panel);
  };

  const preflightAndStart = (entryMode = 'manual') => {
    state.pendingTourEntryMode = entryMode === 'first-time' ? 'first-time' : 'manual';
    const results = audit();
    if (results.every((entry) => entry.result.status === 'FOUND')) startTour(state.pendingTourEntryMode);
    else showDiagnostics();
  };

  const handleChoice = async (choice) => {
    const effect = policy.reduceOnboardingChoice(choice);
    if (!effect.close) return;
    clearModal();
    if (effect.persistAlreadyKnown) {
      await persistAlreadyKnown();
      state.alreadyKnown = true;
    }
    if (effect.startTour) preflightAndStart('manual');
  };

  const showOnboarding = () => {
    clearModal();
    const c = copy();
    if (!c) return;
    state.onboardingPresented = true;
    const shield = make('div', 'ai-my-pt-modal-shield');
    shield.id = 'ai-my-pt-modal-shield';
    shield.style.zIndex = String(Z + 3);
    const panel = make('section', 'ai-my-pt-modal');
    panel.id = 'ai-my-pt-modal';
    panel.style.zIndex = String(Z + 4);
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', c.title);
    panel.append(
      make('div', 'ai-my-pt-eyebrow', 'PowerTeacher'),
      make('h2', 'ai-my-pt-title', c.title),
      make('p', 'ai-my-pt-intro', c.body),
    );
    const localeControls = renderPrototypeLocaleControls(showOnboarding);
    if (localeControls) panel.append(localeControls);
    const choices = make('div', 'ai-my-pt-choice-stack');
    choices.append(
      makeButton(c.yes, 'ai-my-pt-btn ai-my-pt-btn-primary', () => handleChoice('yes')),
      makeButton(c.later, 'ai-my-pt-btn', () => handleChoice('later')),
      makeButton(c.alreadyKnown, 'ai-my-pt-btn ai-my-pt-btn-quiet', () => handleChoice('already-known')),
    );
    panel.append(choices);
    document.documentElement.append(shield, panel);
  };

  const openFromLauncher = () => {
    state.pendingTourEntryMode = 'manual';
    showDiagnostics();
  };

  const refreshLauncherLabel = () => {
    const launcher = document.getElementById('ai-my-powerteacher-guide-launcher');
    if (!launcher) return;
    const c = copy();
    if (c) setText(launcher, c.launcher);
    const hide = document.getElementById('ai-my-powerteacher-guide-hide');
    if (hide && c) hide.setAttribute('aria-label', c.hideGuide);
  };

  const installLauncher = () => {
    const c = copy();
    const label = c ? c.launcher : 'PowerTeacher Guide';
    const launcher = make('button', 'ai-my-pt-launcher', label);
    launcher.id = 'ai-my-powerteacher-guide-launcher';
    launcher.type = 'button';
    launcher.addEventListener('click', openFromLauncher);
    const controls = make('div', 'ai-my-pt-launcher-controls');
    controls.id = 'ai-my-powerteacher-guide-controls';
    controls.style.zIndex = String(Z - 1);
    const hide = make('button', 'ai-my-pt-launcher-hide', '×');
    hide.id = 'ai-my-powerteacher-guide-hide';
    hide.type = 'button';
    hide.setAttribute('aria-label', c?.hideGuide || 'Hide PowerTeacher Guide until reload');
    hide.addEventListener('click', () => {
      controls.remove();
      clearDiagnostics();
    });
    controls.append(launcher, hide);
    document.documentElement.append(controls);
  };

  chrome.runtime?.onMessage?.addListener?.((message, sender, reply) => {
    if (sender?.id !== chrome.runtime.id || message?.type !== 'PSQM_OPEN_POWERTEACHER_GUIDE') return false;
    const valid = location.origin === 'https://vas.powerschool.com'
      && location.pathname === config.startPagePath && count(`#${config.tableId}`) === 1;
    if (valid) openFromLauncher();
    reply({ ok: valid });
    return false;
  });

  const applyHubLocaleChange = (storedLocale) => {
    state.storedHubLocale = policy.resolveGuidanceLocale({ hubLocale: storedLocale });
    const nextLocale = policy.resolveStartPageLocale({
      nativeLang: document.documentElement.lang,
      storedHubLocale: state.storedHubLocale,
    });
    if (nextLocale === state.hubLocale) return;
    const restartFirstTime = state.active && state.tourEntryMode === 'first-time' && !state.startPageTourCompleted;
    state.hubLocale = nextLocale;
    stopTour();
    clearDiagnostics();
    clearModal();
    clearGradeHandoff();
    refreshLauncherLabel();
    if (restartFirstTime && !state.alreadyKnown) {
      setTimeout(() => preflightAndStart('first-time'), 100);
    }
  };

  const initialize = async () => {
    const stored = await getStoredState();
    state.storedHubLocale = policy.resolveGuidanceLocale({ hubLocale: stored[STORAGE_KEYS.hubLocale] });
    state.hubLocale = policy.resolveStartPageLocale({
      nativeLang: document.documentElement.lang,
      storedHubLocale: state.storedHubLocale,
    });
    state.alreadyKnown = stored[STORAGE_KEYS.powerTeacherAlreadyKnown] === true;
    state.discoveryPending = stored[STORAGE_KEYS.powerTeacherDiscoveryPending] === true;
    state.startPageTourCompleted = stored[STORAGE_KEYS.startPageTourCompleted] === true;
    state.gradeEntryAlreadyKnown = stored[STORAGE_KEYS.gradeEntryAlreadyKnown] === true;
    installLauncher();
    new MutationObserver(() => applyHubLocaleChange(state.storedHubLocale)).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang'],
    });

    if (state.discoveryPending) {
      await clearDiscoveryPending();
      state.discoveryPending = false;
    }

    const autoRunFirstTime = policy.shouldAutoRunStartPageTour({
      alreadyKnown: state.alreadyKnown,
      startPageTourCompleted: state.startPageTourCompleted,
    });
    if (autoRunFirstTime) {
      setTimeout(() => preflightAndStart('first-time'), 250);
      return;
    }

    if (!state.alreadyKnown && stored[STORAGE_KEYS.powerTeacherDiscoveryPending] === true) {
      setTimeout(() => preflightAndStart('manual'), 250);
    }
  };

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    const localeChange = changes[STORAGE_KEYS.hubLocale];
    if (localeChange) applyHubLocaleChange(localeChange.newValue);
    const knownChange = changes[STORAGE_KEYS.powerTeacherAlreadyKnown];
    if (knownChange) state.alreadyKnown = knownChange.newValue === true;
    const pendingChange = changes[STORAGE_KEYS.powerTeacherDiscoveryPending];
    if (pendingChange) state.discoveryPending = pendingChange.newValue === true;
    const completedChange = changes[STORAGE_KEYS.startPageTourCompleted];
    if (completedChange) state.startPageTourCompleted = completedChange.newValue === true;
    const gradeKnownChange = changes[STORAGE_KEYS.gradeEntryAlreadyKnown];
    if (gradeKnownChange) state.gradeEntryAlreadyKnown = gradeKnownChange.newValue === true;
  });

  addEventListener('resize', () => {
    if (state.active) requestAnimationFrame(positionSpotlight);
    if (state.gradeHandoffActive) requestAnimationFrame(positionGradeHandoff);
  }, { passive: true });
  addEventListener('scroll', () => {
    if (state.active) requestAnimationFrame(positionSpotlight);
    if (state.gradeHandoffActive) requestAnimationFrame(positionGradeHandoff);
  }, { passive: true, capture: true });
  addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (state.active) stopTour();
    else if (state.gradeHandoffActive) clearGradeHandoff();
    else if (state.diagnosticsOpen) clearDiagnostics();
    else clearModal();
  }, true);

  initialize();
})();
