(function (root) {
  "use strict";

  const hub = root.PSQM ??= {};
  if (hub.languageIntro || typeof document !== "object") return;

  const createLanguageIntro = hub.languageIntroCore?.createLanguageIntro;
  const createLanguageIntroState = hub.languageIntroState?.createLanguageIntroState;
  const createLanguageIntroHubAdapter = hub.languageIntroHubAdapter?.createLanguageIntroHubAdapter;
  if (typeof createLanguageIntro !== "function"
      || typeof createLanguageIntroState !== "function"
      || typeof createLanguageIntroHubAdapter !== "function") {
    throw new Error("Language Intro modules must load before the public facade.");
  }

  const completionListeners = new Set();
  const state = createLanguageIntroState();
  const powerHub = createLanguageIntroHubAdapter();
  let controller = null;
  let mounted = false;
  let complete = false;
  let queued = false;
  let eventsInstalled = false;
  let completedLanguage = null;
  let startedFresh = false;
  let firstRunCompleted = false;

  function notifyComplete(language) {
    complete = true;
    completedLanguage = language;
    firstRunCompleted = startedFresh;
    removeTemporaryEvents();
    for (const listener of completionListeners) {
      try { listener(language); } catch (_) {}
    }
  }

  function scheduleReconcile() {
    if (!controller || complete || queued) return;
    queued = true;
    const run = () => {
      queued = false;
      controller?.reconcile?.();
    };
    if (typeof root.requestAnimationFrame === "function") root.requestAnimationFrame(run);
    else root.setTimeout(run, 0);
  }

  function handleUserDrivenChange() {
    scheduleReconcile();
  }

  function installTemporaryEvents() {
    if (eventsInstalled || complete) return;
    eventsInstalled = true;
    document.addEventListener("click", handleUserDrivenChange, true);
    document.addEventListener("change", handleUserDrivenChange, true);
    document.addEventListener("scroll", handleUserDrivenChange, true);
    root.addEventListener("resize", handleUserDrivenChange);
  }

  function removeTemporaryEvents() {
    if (!eventsInstalled) return;
    eventsInstalled = false;
    document.removeEventListener("click", handleUserDrivenChange, true);
    document.removeEventListener("change", handleUserDrivenChange, true);
    document.removeEventListener("scroll", handleUserDrivenChange, true);
    root.removeEventListener("resize", handleUserDrivenChange);
  }

  function findAvatarTarget() {
    const result = powerHub.findProfileButton();
    return result.verified ? result.element : null;
  }

  function findLanguageSettingsTarget() {
    const result = powerHub.findLanguageLocaleButton();
    return result.verified ? result.element : null;
  }

  function readReferenceLanguage() {
    const result = powerHub.readLanguageReference();
    return result.verified ? result.value : null;
  }

  function findLanguageSettingsCloseTarget() {
    const result = powerHub.findLanguageSettingsCloseTarget?.();
    return result?.verified ? result.element : null;
  }

  function isLanguageSettingsOpen() {
    return powerHub.languageSettingsOpen?.() === true;
  }

  function ensureController() {
    if (controller) return controller;
    controller = createLanguageIntro({
      documentRef: document,
      robotAssetUrl: root.chrome?.runtime?.getURL?.("assets/robot-assistant.png") || null,
      findAvatarTarget,
      findLanguageSettingsTarget,
      findLanguageSettingsCloseTarget,
      isLanguageSettingsOpen,
      readReferenceLanguage,
      loadAssistantLanguage: state.loadAssistantLanguage,
      saveAssistantLanguage: state.saveAssistantLanguage,
      onComplete: notifyComplete,
      onCancel: () => {},
    });
    return controller;
  }

  async function mount() {
    if (mounted) return controller?.getState?.() || null;
    mounted = true;
    installTemporaryEvents();
    const result = await ensureController().start();
    startedFresh = result?.skipped === false;
    scheduleReconcile();
    return result;
  }

  function reconcile() {
    return controller?.reconcile?.();
  }

  function restart() {
    complete = false;
    completedLanguage = null;
    startedFresh = true;
    firstRunCompleted = false;
    installTemporaryEvents();
    return ensureController().restart();
  }

  function destroy() {
    removeTemporaryEvents();
    controller?.destroy?.();
    controller = null;
    mounted = false;
    complete = false;
    completedLanguage = null;
    startedFresh = false;
    firstRunCompleted = false;
  }

  function blocksOtherOnboarding() {
    return !complete;
  }

  function onComplete(listener) {
    if (typeof listener !== "function") return () => {};
    completionListeners.add(listener);
    if (complete) root.queueMicrotask?.(() => listener(completedLanguage));
    return () => completionListeners.delete(listener);
  }

  function snapshot() {
    return Object.freeze({
      mounted,
      complete,
      language: completedLanguage,
      firstRunCompleted,
      eventsInstalled,
      core: controller?.getState?.() || null,
    });
  }

  hub.languageIntro = Object.freeze({
    mount,
    reconcile,
    restart,
    destroy,
    blocksOtherOnboarding,
    onComplete,
    snapshot,
  });
})(globalThis);
