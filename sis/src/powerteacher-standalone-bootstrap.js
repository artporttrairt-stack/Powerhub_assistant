(function (root) {
  'use strict';

  const READINESS_TIMEOUT_MS = 10000;
  const LIVENESS_HEALTH_INTERVAL_MS = 60000;
  const SIS_ORIGIN = 'https://vas.powerschool.com';
  const NAME_DISPLAY_ENABLED_KEY = 'sisVietnameseNameDisplayEnabledV1';
  const PENDING_SETUP_KEY = 'sisPrototypeDisplaySettingsOnboardingPending';
  const LEGACY_NAME_STORAGE_KEYS = Object.freeze([
    'sisPrototypePtpStudentNamePresentationEnabled',
    'sisPrototypePtpStudentNameNaturalOrderRequested',
    'sisPrototypePtpStudentNameNaturalOrderPromptPendingV2',
  ]);
  const defaultSurface = root.SIS_POWERTEACHER_SURFACE
    || (typeof require === 'function' ? require('./powerteacher-surface.js') : null);
  const defaultLocale = root.SIS_POWERTEACHER_LOCALE
    || (typeof require === 'function' ? require('./powerteacher-locale.js') : null);
  const launcherModule = root.SIS_POWERTEACHER_ASSISTANT_LAUNCHER
    || (typeof require === 'function' ? require('./powerteacher-assistant-launcher.js') : null);
  const defaultDisplayOnboarding = root.SIS_STANDALONE_DISPLAY_SETTINGS_ONBOARDING
    || (typeof require === 'function' ? require('./standalone-display-settings-onboarding.js') : null);
  const defaultPreferenceApi = root.SIS_STUDENT_NAME_PREFERENCE
    || (typeof require === 'function' ? require('./student-name-preference.js') : null);
  const defaultLifecycle = root.SIS_POWERTEACHER_LIFECYCLE?.lifecycle
    || (typeof require === 'function' ? require('./powerteacher-lifecycle.js').lifecycle : null);
  const defaultVietnameseNameDisplay = root.SISVietnameseNameDisplay
    || (typeof require === 'function' ? require('./sis-vietnamese-name-display.js') : null);

  function storageGet(storage, keys) {
    return new Promise((resolve) => {
      if (!storage || typeof storage.get !== 'function') {
        resolve({});
        return;
      }
      storage.get(keys, (data) => resolve(data || {}));
    });
  }

  function storageSet(storage, values) {
    return new Promise((resolve) => {
      if (!storage || typeof storage.set !== 'function') {
        resolve(false);
        return;
      }
      storage.set(values, () => resolve(root.chrome?.runtime?.lastError ? false : true));
    });
  }

  function storageGetChecked(storage, keys) {
    return new Promise((resolve) => {
      if (!storage || typeof storage.get !== 'function') {
        resolve({ ok: false, data: {} });
        return;
      }
      storage.get(keys, (data) => {
        resolve({
          ok: root.chrome?.runtime?.lastError ? false : true,
          data: data || {},
        });
      });
    });
  }

  function storageRemove(storage, keys) {
    return new Promise((resolve) => {
      if (!storage || typeof storage.remove !== 'function') {
        resolve(false);
        return;
      }
      storage.remove(keys, () => resolve(true));
    });
  }

  function createNameDisplayActivation({ vietnameseNameDisplay = defaultVietnameseNameDisplay } = {}) {
    async function cleanupLegacy(storage) {
      return storageRemove(storage, LEGACY_NAME_STORAGE_KEYS);
    }

    async function enabled(storage) {
      const data = await storageGet(storage, NAME_DISPLAY_ENABLED_KEY);
      return data[NAME_DISPLAY_ENABLED_KEY] === true;
    }

    async function startDisplay() {
      if (typeof vietnameseNameDisplay?.init !== 'function') return false;
      await vietnameseNameDisplay.init();
      return true;
    }

    async function activate(storage) {
      const persisted = await storageSet(storage, { [NAME_DISPLAY_ENABLED_KEY]: true });
      if (!persisted) return false;
      const verification = await storageGetChecked(storage, NAME_DISPLAY_ENABLED_KEY);
      if (!verification.ok || verification.data[NAME_DISPLAY_ENABLED_KEY] !== true) return false;
      return startDisplay();
    }

    async function resume(storage) {
      if (!await enabled(storage)) return false;
      return startDisplay();
    }

    return Object.freeze({ activate, resume, cleanupLegacy, enabled });
  }

  async function resumeNameDisplayForPage({ location, storage, vietnameseNameDisplay = defaultVietnameseNameDisplay } = {}) {
    if (location?.origin !== SIS_ORIGIN) return false;
    const activation = createNameDisplayActivation({ vietnameseNameDisplay });
    await activation.cleanupLegacy(storage);
    return activation.resume(storage);
  }


  function watchNameDisplayActivation({ location, storageChanges, vietnameseNameDisplay = defaultVietnameseNameDisplay } = {}) {
    if (location?.origin !== SIS_ORIGIN || typeof storageChanges?.addListener !== 'function') return () => {};
    const listener = (changes, areaName) => {
      if (areaName !== 'local' || changes?.[NAME_DISPLAY_ENABLED_KEY]?.newValue !== true) return;
      if (typeof vietnameseNameDisplay?.init !== 'function') return;
      Promise.resolve(vietnameseNameDisplay.init()).catch(() => {});
    };
    storageChanges.addListener(listener);
    return () => storageChanges.removeListener?.(listener);
  }

  async function startNameDisplayLivenessGuard({
    location,
    storage,
    storageChanges,
    windowLike = root.window || root,
    vietnameseNameDisplay = defaultVietnameseNameDisplay,
  } = {}) {
    if (location?.origin !== SIS_ORIGIN) return () => {};

    let stopped = false;
    let desiredState = 'UNKNOWN';
    let healthIntervalId = null;
    let initInFlight = null;
    let readInFlight = null;

    function clearHealthInterval() {
      if (healthIntervalId === null) return;
      windowLike?.clearInterval?.(healthIntervalId);
      healthIntervalId = null;
    }

    function ensureHealthInterval() {
      if (stopped || desiredState === 'DISABLED' || healthIntervalId !== null) return;
      if (typeof windowLike?.setInterval !== 'function') return;
      healthIntervalId = windowLike.setInterval(() => {
        if (desiredState === 'ENABLED') {
          void ensureRunning();
          return;
        }
        void reconcileDesiredState();
      }, LIVENESS_HEALTH_INTERVAL_MS);
    }

    function ensureRunning() {
      if (stopped || desiredState !== 'ENABLED' || typeof vietnameseNameDisplay?.init !== 'function') {
        return Promise.resolve(false);
      }
      if (initInFlight) return initInFlight;
      initInFlight = Promise.resolve()
        .then(() => vietnameseNameDisplay.init())
        .then(() => true, () => false)
        .finally(() => {
          initInFlight = null;
        });
      return initInFlight;
    }

    function setDesiredState(enabled) {
      if (stopped) return;
      desiredState = enabled === true ? 'ENABLED' : 'DISABLED';
      if (desiredState === 'DISABLED') {
        clearHealthInterval();
        return;
      }
      ensureHealthInterval();
      void ensureRunning();
    }

    function reconcileDesiredState() {
      if (stopped) return Promise.resolve(false);
      if (readInFlight) return readInFlight;
      readInFlight = storageGetChecked(storage, NAME_DISPLAY_ENABLED_KEY)
        .then((result) => {
          if (stopped) return false;
          if (!result.ok) {
            desiredState = 'UNKNOWN';
            ensureHealthInterval();
            return false;
          }
          const enabled = result.data[NAME_DISPLAY_ENABLED_KEY] === true;
          setDesiredState(enabled);
          return enabled;
        })
        .finally(() => {
          readInFlight = null;
        });
      return readInFlight;
    }

    const onStorageChanged = (changes, areaName) => {
      if (areaName !== 'local' || !Object.prototype.hasOwnProperty.call(changes || {}, NAME_DISPLAY_ENABLED_KEY)) return;
      setDesiredState(changes[NAME_DISPLAY_ENABLED_KEY]?.newValue === true);
    };
    const onPageShow = () => {
      if (desiredState === 'ENABLED') {
        void ensureRunning();
      } else if (desiredState === 'UNKNOWN') {
        void reconcileDesiredState();
      }
    };

    storageChanges?.addListener?.(onStorageChanged);
    windowLike?.addEventListener?.('pageshow', onPageShow);
    ensureHealthInterval();

    const activation = createNameDisplayActivation({ vietnameseNameDisplay });
    await activation.cleanupLegacy(storage);
    await reconcileDesiredState();

    return () => {
      if (stopped) return;
      stopped = true;
      clearHealthInterval();
      storageChanges?.removeListener?.(onStorageChanged);
      windowLike?.removeEventListener?.('pageshow', onPageShow);
    };
  }

  function createBootstrap({
    surface = defaultSurface,
    localeApi = defaultLocale,
    assistant = launcherModule?.createLauncher?.({ localeApi }),
    lifecycle = defaultLifecycle,
    displayOnboarding = defaultDisplayOnboarding,
    preferenceApi = defaultPreferenceApi,
    vietnameseNameDisplay = defaultVietnameseNameDisplay,
    nameDisplayActivation = createNameDisplayActivation({ vietnameseNameDisplay }),
  } = {}) {
    let context = null;
    let initialized = false;
    let lifecycleStarted = false;
    let readinessUnsubscribe = null;
    let readinessTimeoutId = null;
    let readinessRetryInFlight = false;
    let pendingSetupConsumed = false;


    function consumePendingSetup() {
      if (pendingSetupConsumed) return Promise.resolve(false);
      pendingSetupConsumed = true;
      const storage = context?.storage;
      if (!storage || typeof storage.get !== 'function') return Promise.resolve(false);
      return new Promise((resolve) => {
        storage.get([PENDING_SETUP_KEY], (data) => {
          const pending = data?.[PENDING_SETUP_KEY] === true;
          if (!pending || typeof storage.remove !== 'function') return resolve(pending);
          storage.remove(PENDING_SETUP_KEY, () => resolve(true));
        });
      });
    }

    function locationMatchesCurrent() {
      if (typeof surface?.matchesLocation === 'function') {
        return surface.matchesLocation({
          origin: context?.location?.origin,
          pathname: context?.location?.pathname,
        }) === true;
      }
      return classifyCurrent()?.status === 'FOUND';
    }

    function classifyCurrent() {
      return surface?.classify?.({
        origin: context?.location?.origin,
        pathname: context?.location?.pathname,
        document: context?.document,
      });
    }

    function ensureLifecycle(allowMissingContentRoot = false) {
      if (lifecycleStarted) return true;
      const started = lifecycle?.start?.({
        document: context?.document,
        windowLike: context?.windowLike,
        allowMissingContentRoot,
      }) === true;
      if (started) lifecycleStarted = true;
      return started;
    }

    function clearReadinessTimer() {
      if (readinessTimeoutId === null) return;
      if (typeof context?.windowLike?.clearTimeout === 'function') {
        context.windowLike.clearTimeout(readinessTimeoutId);
      }
      readinessTimeoutId = null;
    }

    function stopReadinessWatch({ stopLifecycle = false } = {}) {
      readinessUnsubscribe?.();
      readinessUnsubscribe = null;
      clearReadinessTimer();
      if (stopLifecycle && lifecycleStarted && !initialized) {
        lifecycle?.stop?.();
        lifecycleStarted = false;
      }
    }

    function reconcile(reason = 'change') {
      if (!context) return 'UNINITIALIZED';
      const locationVerified = locationMatchesCurrent();
      const locale = localeApi?.resolve?.(context.document);
      if (!locationVerified || !locale) {
        assistant?.remove?.();
        displayOnboarding?.stop?.();
        return !locationVerified ? 'SHELL_UNVERIFIED' : 'LOCALE_UNVERIFIED';
      }
      assistant?.reconcile?.({ document: context.document });
      return 'READY';
    }

    function reopenAssistantAfterPrerequisite() {
      assistant?.open?.();
    }

    function startDisplaySettingsWalkthrough() {
      return displayOnboarding?.start?.({
        document: context?.document,
        location: context?.location,
        storage: context?.storage,
        onPrerequisiteReady: reopenAssistantAfterPrerequisite,
      });
    }

    function startVietnameseNameDisplay() {
      if (typeof nameDisplayActivation?.activate !== 'function') return false;
      try {
        void (async () => {
          if (await nameDisplayActivation.enabled?.(context?.storage)) {
            await nameDisplayActivation.activate(context?.storage);
            return;
          }
          const prerequisiteConfirmed = await preferenceApi?.readPrerequisiteConfirmed?.(context?.storage);
          if (prerequisiteConfirmed === true) {
            await nameDisplayActivation.activate(context?.storage);
            return;
          }
          startDisplaySettingsWalkthrough();
        })().catch(() => {});
        return true;
      } catch {
        return false;
      }
    }

    async function initialize(nextContext = {}) {
      context = nextContext;
      if (!locationMatchesCurrent()) return 'SHELL_UNVERIFIED';
      if (!localeApi?.resolve?.(context.document)) return 'LOCALE_UNVERIFIED';

      if (initialized) {
        reconcile('initialize-again');
        return 'READY';
      }

      assistant?.install?.({
        document: context.document,
        onStudentNameSetup: startVietnameseNameDisplay,
      });

      ensureLifecycle(true);
      lifecycle?.subscribe?.(reconcile);
      lifecycle?.subscribe?.(displayOnboarding?.reconcile);
      initialized = true;

      const saveHandoff = await preferenceApi?.readSaveHandoff?.(context.storage);
      let restoredSave = false;
      if (saveHandoff) {
        const restored = displayOnboarding?.restoreSaveHandoff?.({
          document: context.document,
          location: context.location,
          storage: context.storage,
          handoff: saveHandoff,
          onPrerequisiteReady: reopenAssistantAfterPrerequisite,
        });
        restoredSave = restored === 'AWAITING_NATIVE_SAVE' || restored === 'WAITING_FOR_DISPLAY';
        if (!restoredSave) await preferenceApi?.clearSaveHandoff?.(context.storage);
      }

      const pendingSetup = await consumePendingSetup();
      if (pendingSetup === true && !restoredSave) {
        const alreadyEnabled = await nameDisplayActivation.enabled?.(context.storage);
        const prerequisiteConfirmed = await preferenceApi?.readPrerequisiteConfirmed?.(context.storage);
        if (alreadyEnabled !== true && prerequisiteConfirmed !== true) startDisplaySettingsWalkthrough();
      }

      reconcile('initialize');
      return 'READY';
    }

    async function retryReadiness() {
      if (readinessRetryInFlight || initialized || !context) return;
      readinessRetryInFlight = true;
      try {
        const result = await initialize(context);
        if (result === 'READY') stopReadinessWatch();
      } finally {
        readinessRetryInFlight = false;
      }
    }

    async function startWhenReady(nextContext = {}) {
      context = nextContext;
      const firstResult = await initialize(context);
      if (firstResult === 'READY') return firstResult;
      if (firstResult !== 'SHELL_UNVERIFIED' && firstResult !== 'LOCALE_UNVERIFIED') return firstResult;
      if (readinessUnsubscribe) return firstResult;

      readinessUnsubscribe = lifecycle?.subscribe?.(retryReadiness) || null;
      const started = ensureLifecycle(true);
      if (!started) {
        stopReadinessWatch();
        return firstResult;
      }

      if (typeof context?.windowLike?.setTimeout === 'function') {
        readinessTimeoutId = context.windowLike.setTimeout(() => {
          stopReadinessWatch({ stopLifecycle: true });
        }, READINESS_TIMEOUT_MS);
      }
      return firstResult;
    }

    function openGuide() {
      if (!initialized || !locationMatchesCurrent() || !localeApi?.resolve?.(context?.document)) return false;
      return assistant?.open?.() === true;
    }

    return Object.freeze({ initialize, startWhenReady, reconcile, openGuide });
  }

  const bootstrap = createBootstrap();
  const api = Object.freeze({
    SIS_ORIGIN,
    LIVENESS_HEALTH_INTERVAL_MS,
    NAME_DISPLAY_ENABLED_KEY,
    PENDING_SETUP_KEY,
    LEGACY_NAME_STORAGE_KEYS,
    createNameDisplayActivation,
    resumeNameDisplayForPage,
    watchNameDisplayActivation,
    startNameDisplayLivenessGuard,
    createBootstrap,
    bootstrap,
    initialize: bootstrap.initialize,
    startWhenReady: bootstrap.startWhenReady,
    reconcile: bootstrap.reconcile,
    openGuide: bootstrap.openGuide,
  });
  root.SIS_POWERTEACHER_STANDALONE_BOOTSTRAP = api;

  if (root.document && root.location && root.location.origin === SIS_ORIGIN) {
    const storage = root.chrome?.storage?.local;
    void startNameDisplayLivenessGuard({
      location: root.location,
      storage,
      storageChanges: root.chrome?.storage?.onChanged,
      windowLike: root.window || root,
      vietnameseNameDisplay: defaultVietnameseNameDisplay,
    }).catch(() => {});

    if (root.location.pathname === '/teachers/index.html') {
      root.chrome?.runtime?.onMessage?.addListener?.((message, sender, reply) => {
        if (sender?.id !== root.chrome.runtime.id || message?.type !== 'PSQM_OPEN_POWERTEACHER_GUIDE') return false;
        reply({ ok: bootstrap.openGuide() });
        return false;
      });
      const windowLike = root.window || root;
      bootstrap.startWhenReady({ document: root.document, location: root.location, storage, windowLike }).catch(() => {});
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
