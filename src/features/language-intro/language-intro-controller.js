(function (root) {
  "use strict";

  const hub = root.PSQM ??= {};
  if (hub.languageIntroController) return;

  const copy = hub.languageIntroCopy;
  const presenterModule = hub.languageIntroPresenter;
  if (!copy || typeof presenterModule?.createRobotPresenter !== "function") {
    throw new Error("Language Intro copy and presenter modules must load before the controller.");
  }

  const {
    ASSISTANT_LANGUAGES,
    REFERENCE_LABELS,
    COPY,
    isSupportedLanguage,
    bilingualLabel,
    format,
  } = copy;
  const { createRobotPresenter } = presenterModule;

  const REQUIRED_CALLBACKS = [
    "findAvatarTarget",
    "findLanguageSettingsTarget",
    "readReferenceLanguage",
    "loadAssistantLanguage",
    "saveAssistantLanguage",
    "onComplete",
    "onCancel",
  ];

  function validateOptions(options) {
    for (const name of REQUIRED_CALLBACKS) {
      if (typeof options[name] !== "function") {
        throw new TypeError(`createLanguageIntro requires a ${name}() callback.`);
      }
    }
  }

  function safeCall(callback, fallback = null) {
    try {
      return callback();
    } catch {
      return fallback;
    }
  }

  function readRect(target) {
    if (!target || target.isConnected === false || typeof target.getBoundingClientRect !== "function") return null;
    try {
      const rect = target.getBoundingClientRect();
      if (!rect) return null;
      return Object.freeze({
        top: Number(rect.top) || 0,
        left: Number(rect.left) || 0,
        right: Number(rect.right) || 0,
        bottom: Number(rect.bottom) || 0,
        width: Number(rect.width) || 0,
        height: Number(rect.height) || 0,
      });
    } catch {
      return null;
    }
  }

  function createLanguageIntro(options = {}) {
    validateOptions(options);

    const presenter = options.presenter ?? createRobotPresenter({
      documentRef: options.documentRef,
      robotAssetUrl: options.robotAssetUrl,
    });

    let lifecycle = 0;
    let destroyed = false;
    let avatarMeasured = false;
    let settingsMeasured = false;
    let restoreState = "welcome";
    let current = {
      state: "idle",
      referenceLanguage: null,
      assistantLanguage: null,
      manualSelection: false,
      error: null,
      targetRect: null,
    };

    const setState = (patch) => {
      current = { ...current, ...patch };
    };

    const invokeHost = (callback, ...args) => {
      try {
        return callback(...args);
      } catch {
        return undefined;
      }
    };

    const languageReferenceKnown = () => isSupportedLanguage(current.referenceLanguage);
    const languageChoiceAllowed = () => languageReferenceKnown() || current.manualSelection === true;

    const choiceActions = () => {
      if (!languageChoiceAllowed()) return [];
      const preferredLanguage = languageReferenceKnown()
        ? current.referenceLanguage
        : ASSISTANT_LANGUAGES[0];
      return ASSISTANT_LANGUAGES.map((language) => ({
        id: `choose-${language}`,
        label: bilingualLabel(COPY.languageChoices[language]),
        kind: language === preferredLanguage ? "primary" : "secondary",
        onPress: () => chooseAssistantLanguage(language),
      }));
    };

    const deferAction = () => ({
      id: "defer",
      label: bilingualLabel(COPY.actions.defer),
      kind: "secondary",
      onPress: defer,
    });

    const minimizeAction = () => ({
      id: "minimize",
      label: bilingualLabel(COPY.actions.minimize),
      kind: "secondary",
      onPress: minimize,
    });

    function modelForCurrent() {
      const common = {
        state: current.state,
        targetRect: current.targetRect,
        onEscape: minimize,
        actions: [],
      };

      if (current.state === "welcome") {
        return {
          ...common,
          ...COPY.welcome,
          actions: [{
            id: "start",
            label: bilingualLabel(COPY.actions.start),
            kind: "primary",
            onPress: beginGuidance,
          }],
        };
      }

      if (current.state === "point-avatar") {
        return { ...common, ...COPY.pointAvatar, actions: [minimizeAction()] };
      }

      if (current.state === "point-language-settings") {
        return { ...common, ...COPY.pointLanguageSettings, actions: [minimizeAction()] };
      }

      if (current.state === "waiting-reference") {
        return { ...common, ...COPY.waitingReference, actions: [minimizeAction()] };
      }

      if (current.state === "reference-found") {
        const labels = REFERENCE_LABELS[current.referenceLanguage];
        return {
          ...common,
          titleEn: COPY.referenceFound.titleEn,
          titleVi: COPY.referenceFound.titleVi,
          bodyEn: format(COPY.referenceFound.bodyEn, { referenceEn: labels.en }),
          bodyVi: format(COPY.referenceFound.bodyVi, { referenceVi: labels.vi }),
          actions: [...choiceActions(), deferAction()],
        };
      }

      if (current.state === "reference-missing") {
        return {
          ...common,
          ...COPY.referenceMissing,
          actions: [
            {
              id: "retry",
              label: bilingualLabel(COPY.actions.retry),
              kind: "primary",
              onPress: retryReference,
            },
            ...choiceActions().map((action) => ({ ...action, kind: "secondary" })),
            deferAction(),
          ],
        };
      }

      if (current.state === "saving") {
        return { ...common, ...COPY.saving, actions: [] };
      }

      if (current.state === "close-language-settings") {
        return {
          ...common,
          ...COPY.closeLanguageSettings,
          onEscape: null,
          actions: [],
        };
      }

      if (current.state === "error") {
        return {
          ...common,
          ...COPY.error,
          bodyEn: `${COPY.error.bodyEn} ${current.error ?? ""}`.trim(),
          actions: [...choiceActions(), deferAction()],
        };
      }

      if (current.state === "minimized") {
        return {
          ...common,
          titleEn: COPY.minimized.labelEn,
          titleVi: COPY.minimized.labelVi,
          bodyEn: "",
          bodyVi: "",
          onEscape: null,
          actions: [{ id: "restore", label: bilingualLabel(COPY.actions.restore), kind: "primary", onPress: restore }],
        };
      }

      return { ...common, ...COPY.chooseAssistant, actions: [...choiceActions(), deferAction()] };
    }

    function render() {
      if (!destroyed && current.state !== "complete" && current.state !== "idle") {
        presenter.render(modelForCurrent());
      }
    }

    async function start() {
      if (destroyed) return { skipped: true, language: null };
      const token = ++lifecycle;
      let persisted = null;
      try {
        persisted = await options.loadAssistantLanguage();
      } catch {
        persisted = null;
      }

      if (destroyed || token !== lifecycle) return { skipped: true, language: null };

      if (isSupportedLanguage(persisted)) {
        setState({
          state: "complete",
          assistantLanguage: persisted,
          referenceLanguage: null,
          manualSelection: false,
          targetRect: null,
          error: null,
        });
        invokeHost(options.onComplete, persisted);
        return { skipped: true, language: persisted };
      }

      setState({
        state: "welcome",
        assistantLanguage: null,
        referenceLanguage: null,
        manualSelection: false,
        targetRect: null,
        error: null,
      });
      render();
      return { skipped: false, language: null };
    }

    function beginGuidance() {
      if (destroyed) return;
      avatarMeasured = false;
      settingsMeasured = false;
      setState({ state: "point-avatar", targetRect: null, error: null });
      render();
    }

    function reconcile() {
      if (destroyed) return undefined;

      if (current.state === "point-avatar") {
        const avatarRect = readRect(safeCall(options.findAvatarTarget));
        const settingsRect = readRect(safeCall(options.findLanguageSettingsTarget));

        if (avatarMeasured && settingsRect) {
          settingsMeasured = true;
          setState({ state: "point-language-settings", targetRect: settingsRect });
          render();
          return undefined;
        }

        if (avatarRect) avatarMeasured = true;
        setState({ targetRect: avatarRect });
        render();
        return undefined;
      }

      if (current.state === "point-language-settings") {
        const settingsRect = readRect(safeCall(options.findLanguageSettingsTarget));
        if (settingsRect) {
          settingsMeasured = true;
          setState({ targetRect: settingsRect });
          render();
          return undefined;
        }

        if (settingsMeasured) return discoverReference();
      }

      if (current.state === "close-language-settings") {
        const settingsOpen = typeof options.isLanguageSettingsOpen === "function"
          ? safeCall(options.isLanguageSettingsOpen, false) === true
          : false;
        if (!settingsOpen) {
          finishLanguageChoice(current.assistantLanguage);
          return undefined;
        }
        const closeRect = readRect(safeCall(options.findLanguageSettingsCloseTarget));
        setState({ targetRect: closeRect });
        render();
      }

      return undefined;
    }

    async function discoverReference() {
      if (destroyed) return null;
      const token = lifecycle;
      setState({ state: "waiting-reference", targetRect: null, error: null });
      render();

      let value = null;
      try {
        value = await options.readReferenceLanguage();
      } catch (error) {
        if (!destroyed && token === lifecycle) setState({ error: error instanceof Error ? error.message : String(error) });
      }

      if (destroyed || token !== lifecycle) return null;
      if (isSupportedLanguage(value)) {
        setState({ state: "reference-found", referenceLanguage: value, manualSelection: false, targetRect: null });
      } else {
        setState({ state: "reference-missing", referenceLanguage: null, manualSelection: true, targetRect: null });
      }
      render();
      return current.referenceLanguage;
    }

    function retryReference() {
      return discoverReference();
    }

    function finishLanguageChoice(language) {
      if (destroyed || !isSupportedLanguage(language)) return false;
      setState({ state: "complete", assistantLanguage: language, error: null, targetRect: null });
      presenter.destroy();
      invokeHost(options.onComplete, language);
      return true;
    }

    async function chooseAssistantLanguage(language) {
      if (destroyed || !isSupportedLanguage(language) || !languageChoiceAllowed()) return false;
      const token = ++lifecycle;
      setState({ state: "saving", error: null, targetRect: null });
      render();

      try {
        await options.saveAssistantLanguage(language);
      } catch (error) {
        if (destroyed || token !== lifecycle) return false;
        setState({
          state: "error",
          assistantLanguage: null,
          error: error instanceof Error ? error.message : String(error),
        });
        render();
        return false;
      }

      if (destroyed || token !== lifecycle) return false;
      const settingsOpen = typeof options.isLanguageSettingsOpen === "function"
        ? safeCall(options.isLanguageSettingsOpen, false) === true
        : false;
      if (!settingsOpen) return finishLanguageChoice(language);

      const closeRect = readRect(safeCall(options.findLanguageSettingsCloseTarget));
      setState({
        state: "close-language-settings",
        assistantLanguage: language,
        error: null,
        targetRect: closeRect,
      });
      render();
      return true;
    }

    function defer() {
      if (destroyed) return false;
      const changed = minimize();
      if (changed) invokeHost(options.onCancel);
      return changed;
    }

    function minimize() {
      if (destroyed || ["idle", "complete", "minimized"].includes(current.state)) return false;
      restoreState = current.state === "saving" ? "welcome" : current.state;
      setState({ state: "minimized", targetRect: null });
      render();
      return true;
    }

    function restore() {
      if (destroyed || current.state !== "minimized") return false;
      setState({ state: restoreState || "welcome", targetRect: null });
      render();
      return true;
    }

    function restart() {
      if (destroyed) return false;
      lifecycle += 1;
      avatarMeasured = false;
      settingsMeasured = false;
      restoreState = "welcome";
      setState({
        state: "welcome",
        referenceLanguage: null,
        assistantLanguage: null,
        manualSelection: false,
        error: null,
        targetRect: null,
      });
      render();
      return true;
    }

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      lifecycle += 1;
      setState({ state: "destroyed", targetRect: null });
      presenter.destroy();
    }

    function getState() {
      return Object.freeze({
        state: current.state,
        destroyed,
        referenceLanguage: current.referenceLanguage,
        assistantLanguage: current.assistantLanguage,
        manualSelection: current.manualSelection,
        error: current.error,
        targetRect: current.targetRect ? Object.freeze({ ...current.targetRect }) : null,
      });
    }

    return Object.freeze({
      start,
      reconcile,
      retryReference,
      minimize,
      restore,
      restart,
      destroy,
      getState,
    });
  }

  hub.languageIntroController = Object.freeze({ createLanguageIntro });
})(globalThis);
