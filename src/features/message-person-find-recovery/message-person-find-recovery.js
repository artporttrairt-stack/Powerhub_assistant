((root) => {
  "use strict";

  const hub = root.PSQM ??= {};
  const CARD_ID = "psqm-message-person-find-recovery";
  const NAV_CUE_CLASS = "psqm-message-person-find-recovery-nav-cue";
  const NAV_CUE_BOX_CLASS = "psqm-message-person-find-recovery-nav-cue-box";
  const NAV_CUE_BOX_PADDING_PX = 4;
  const RECONCILE_DELAY_MS = 80;
  const HANDOFF_RETRY_DELAY_MS = 160;
  const HANDOFF_RETRY_ATTEMPTS = 75;
  const DIRECTORY_VERIFY_DELAY_MS = 160;
  const DIRECTORY_PREFILL_ATTEMPTS = 3;
  const DIRECTORY_STABLE_PASSES = 2;
  const LEGACY_RECIPIENT_INPUT_ID = "recipient-search-input";
  const LEGACY_MESSAGE_INPUT_ID = "messenger-inbox-message-input-text-field";
  const ACTIVE_GUIDANCE_WALKTHROUGH_STATES = new Set([
    "RUNNING",
    "WAITING_FOR_TARGET",
    "WAITING_FOR_ACTION",
    "VERIFYING",
    "STEP_COMPLETE",
    "PAUSED",
    "BLOCKED"
  ]);

  function viewModel(snapshot) {
    if (snapshot?.phase === "UNAVAILABLE_CONFIRMED") {
      return Object.freeze({
        mode: "action",
        titleKey: "messagePersonFindRecovery.title",
        bodyKey: "messagePersonFindRecovery.body",
        actionKey: "messagePersonFindRecovery.action",
        cancelKey: "messagePersonFindRecovery.cancel"
      });
    }
    if (snapshot?.phase === "HANDOFF_PENDING") {
      return Object.freeze({
        mode: "handoff",
        titleKey: "messagePersonFindRecovery.title",
        bodyKey: "messagePersonFindRecovery.openDirectoryCue",
        actionKey: "",
        cancelKey: "messagePersonFindRecovery.cancel"
      });
    }
    return Object.freeze({ mode: "none" });
  }

  function handoffCueModel({
    onDirectoryPath = false,
    onOverviewPath = false,
    backStatus = "",
    directoryStatus = "",
    backAcknowledged = false
  } = {}) {
    if (onDirectoryPath) {
      return Object.freeze({ stage: "directory-page", bodyKey: "messagePersonFindRecovery.openDirectoryCue" });
    }
    if (backAcknowledged) {
      if (onOverviewPath && directoryStatus === "FOUND") {
        return Object.freeze({ stage: "directory", bodyKey: "messagePersonFindRecovery.openDirectoryCue" });
      }
      return Object.freeze({
        stage: onOverviewPath ? "overview-wait" : "transition",
        bodyKey: onOverviewPath ? "messagePersonFindRecovery.openDirectoryCue" : "messagePersonFindRecovery.goBackCue"
      });
    }
    if (backStatus === "FOUND") {
      return Object.freeze({ stage: "back", bodyKey: "messagePersonFindRecovery.goBackCue" });
    }
    if (onOverviewPath && directoryStatus === "FOUND") {
      return Object.freeze({ stage: "directory", bodyKey: "messagePersonFindRecovery.openDirectoryCue" });
    }
    return Object.freeze({
      stage: onOverviewPath ? "overview-wait" : "transition",
      bodyKey: onOverviewPath ? "messagePersonFindRecovery.openDirectoryCue" : "messagePersonFindRecovery.goBackCue"
    });
  }

  function guidanceOwnerConflict({
    walkthroughState = null,
    walkthroughUiVisible = false,
    onboardingState = null,
    informationState = null,
    helpPanelOpen = false
  } = {}) {
    const walkthroughStatus = String(walkthroughState?.status || "");
    if (walkthroughStatus === "PAUSED") {
      if (walkthroughUiVisible === true) return "walkthrough";
    } else if (ACTIVE_GUIDANCE_WALKTHROUGH_STATES.has(walkthroughStatus)) {
      return "walkthrough";
    }

    if (onboardingState) {
      const onboardingActive = (onboardingState.mounted === true && onboardingState.stateLoaded === false)
        || onboardingState.cardVisible === true
        || onboardingState.spotlightVisible === true
        || onboardingState.tourStatus === "active"
        || onboardingState.replayActive === true
        || onboardingState.firstTimeMapOpen === true
        || onboardingState.firstTimeMapSelection === true
        || onboardingState.pendingStartConversation === true
        || (Boolean(onboardingState.audienceIntroStage) && onboardingState.audienceIntroStage !== "done");
      if (onboardingActive) return "onboarding";
    }

    if (informationState?.cardVisible === true) return "information-guide";

    if (helpPanelOpen === true) return "help";
    return "";
  }

  function guidanceSurfaceVisible(element) {
    if (!element || element.isConnected !== true || element.hidden === true || element.getAttribute?.("aria-hidden") === "true") return false;
    const view = element.ownerDocument?.defaultView || root;
    if (typeof view?.getComputedStyle === "function") {
      const style = view.getComputedStyle(element);
      if (style?.display === "none" || style?.visibility === "hidden" || Number(style?.opacity) === 0) return false;
    }
    if (typeof element.getBoundingClientRect === "function") {
      const rect = element.getBoundingClientRect();
      if (!(rect.width > 0 && rect.height > 0)) return false;
    }
    return true;
  }

  function visibleGuidanceConflict(doc) {
    if (!doc?.getElementById) return "";
    const surfaces = [
      ["psqm-guide-panel", "walkthrough"],
      ["psqm-guide-bubble", "walkthrough"],
      ["psqm-message-onboarding-card", "onboarding"],
      ["psqm-message-onboarding-spotlight", "onboarding"],
      ["psqm-message-information-pane-guide", "information-guide"],
      ["psqm-help-panel", "help"],
      ["psqm-integration-bridge-cue", "integration-bridge"]
    ];
    for (const [id, reason] of surfaces) {
      if (guidanceSurfaceVisible(doc.getElementById(id))) return reason;
    }
    return "";
  }

  function normalizeSearchTerm(value) {
    return String(value || "").trim().replace(/\s+/gu, " ");
  }

  function normalizeContext(value) {
    if (!value || value.verified !== true) return Object.freeze({ verified: false, key: "", area: "unknown" });
    return Object.freeze({
      verified: true,
      key: String(value.key || ""),
      area: String(value.area || "unknown")
    });
  }

  function createCoordinator({ core, adapter, getContext = () => null, onChange = () => {} } = {}) {
    if (!core || !adapter) throw new Error("Recovery coordinator requires core and adapter");
    let contextEpoch = 0;
    let lockedContextKey = "";
    let directoryPrefillGeneration = 0;
    let directoryPrefillAttempts = 0;
    let directoryStablePasses = 0;
    let destroyed = false;

    function snapshot() {
      return core.snapshot();
    }

    function emit(kind, detail = "") {
      onChange(Object.freeze({ kind, detail, snapshot: snapshot() }));
    }

    function context() {
      return normalizeContext(getContext());
    }

    function resetDirectoryPrefill() {
      directoryPrefillGeneration = 0;
      directoryPrefillAttempts = 0;
      directoryStablePasses = 0;
    }

    function directoryValuePolicy(input, searchTerm) {
      if (typeof adapter.prefillPolicy === "function") {
        return adapter.prefillPolicy({ currentValue: input?.value, searchTerm });
      }
      const current = normalizeSearchTerm(input?.value);
      const query = normalizeSearchTerm(searchTerm);
      if (!query) return "REFUSE";
      if (!current) return "WRITE";
      return current === query ? "ALREADY_PRESENT" : "REFUSE";
    }

    function completeDirectoryHandoff() {
      contextEpoch += 1;
      core.contextChanged(contextEpoch, "compatible");
      const active = snapshot();
      if (!core.directoryReady(active.generation, contextEpoch)) return fail("directory-state-rejected");
      const ready = snapshot();
      if (!core.handoffSucceeded(ready.generation)) return fail("directory-handoff-rejected");
      resetDirectoryPrefill();
      lockedContextKey = "";
      emit("handed-off");
      return "HANDED_OFF";
    }

    function verifyRetainedDirectoryValue() {
      // A single sample can race with a delayed controlled-input reset. Require
      // two consecutive retained samples after our first write before declaring
      // the handoff complete. Pre-existing matching text needs no write check.
      if (directoryPrefillAttempts === 0) return completeDirectoryHandoff();
      directoryStablePasses += 1;
      if (directoryStablePasses < DIRECTORY_STABLE_PASSES) return "VERIFYING_DIRECTORY";
      return completeDirectoryHandoff();
    }

    function beginGroupInformationAttempt(searchTerm) {
      if (destroyed) return null;
      lockedContextKey = "";
      resetDirectoryPrefill();
      const generation = core.beginMemberAttempt(searchTerm, contextEpoch);
      if (generation !== null) emit("begin");
      return generation;
    }

    function settleGroupInformationAttempt(generation, status) {
      if (destroyed) return false;
      const accepted = core.settleAttempt(generation, status);
      if (!accepted) return false;
      if (status === "unavailable") {
        const current = context();
        lockedContextKey = current.verified ? current.key : "";
        emit("unavailable");
      } else {
        lockedContextKey = "";
        emit("settled", status);
      }
      return true;
    }

    function offerUnavailable(searchTerm) {
      if (destroyed) return null;
      const generation = beginGroupInformationAttempt(searchTerm);
      if (generation === null) return null;
      return settleGroupInformationAttempt(generation, "unavailable") ? generation : null;
    }

    function requestHandoff(generation = snapshot().generation) {
      if (destroyed) return false;
      const accepted = core.requestHandoff(generation);
      if (accepted) {
        directoryPrefillGeneration = generation;
        directoryPrefillAttempts = 0;
        directoryStablePasses = 0;
        emit("handoff-requested");
      }
      return accepted;
    }

    function cancel(reason = "cancel") {
      if (destroyed) return false;
      const accepted = core.cancel(reason);
      if (accepted) {
        lockedContextKey = "";
        resetDirectoryPrefill();
        emit("cancel", reason);
      }
      return accepted;
    }

    function fail(reason) {
      core.cancel(reason);
      lockedContextKey = "";
      resetDirectoryPrefill();
      emit("failure", reason);
      return "FAILED";
    }

    function reconcile() {
      if (destroyed) return "DESTROYED";
      const state = snapshot();
      if (state.phase === "IDLE") return "IDLE";
      const current = context();

      if (state.phase === "MEMBER_PENDING") {
        if (current.verified && !["group-information", "messages"].includes(current.area)) {
          cancel("context-change");
          return "CANCELLED";
        }
        return "WAITING";
      }

      if (state.phase === "UNAVAILABLE_CONFIRMED") {
        if (lockedContextKey && current.verified && current.key !== lockedContextKey) {
          cancel("context-change");
          return "CANCELLED";
        }
        return "WAITING";
      }

      if (state.phase !== "HANDOFF_PENDING") return "WAITING";

      const onDirectoryPath = adapter.isDirectoryPath?.() === true;
      if (!onDirectoryPath) {
        const back = adapter.messagesBackNavigation?.();
        if (back?.status === "FOUND") return "WAITING_BACK";

        const onOverviewPath = adapter.isOverviewPath?.() === true;
        if (onOverviewPath) {
          const directoryNav = adapter.directoryNavigation?.();
          if (directoryNav?.status === "AMBIGUOUS") return fail("directory-navigation-ambiguous");
          if (directoryNav?.status === "FOUND") return "WAITING_DIRECTORY";
          return "WAITING";
        }

        if (lockedContextKey && current.verified && current.key !== lockedContextKey && current.area !== "directory") {
          cancel("context-change");
          return "CANCELLED";
        }
        return "WAITING";
      }

      const surface = adapter.verifiedDirectorySurface();
      if (surface?.status === "AMBIGUOUS") return fail("directory-ambiguous");
      if (surface?.status !== "FOUND" || !surface.input) return "WAITING";

      const active = snapshot();
      if (directoryPrefillGeneration !== active.generation) {
        directoryPrefillGeneration = active.generation;
        directoryPrefillAttempts = 0;
        directoryStablePasses = 0;
      }

      const policy = directoryValuePolicy(surface.input, active.pendingSearchTerm);
      if (policy === "ALREADY_PRESENT") return verifyRetainedDirectoryValue();
      if (policy !== "WRITE") return fail("directory-prefill-conflict");
      directoryStablePasses = 0;
      if (directoryPrefillAttempts >= DIRECTORY_PREFILL_ATTEMPTS) {
        return fail("directory-prefill-not-retained");
      }

      const result = adapter.prefillDirectorySearch(surface.input, active.pendingSearchTerm);
      if (result?.status === "ALREADY_PRESENT") return verifyRetainedDirectoryValue();
      if (result?.status !== "PREFILLED") return fail("directory-prefill-refused");
      directoryPrefillAttempts += 1;
      return "VERIFYING_DIRECTORY";
    }

    function destroy() {
      if (destroyed) return;
      core.destroy();
      lockedContextKey = "";
      resetDirectoryPrefill();
      destroyed = true;
      emit("destroy");
    }

    return Object.freeze({
      beginGroupInformationAttempt,
      settleGroupInformationAttempt,
      offerUnavailable,
      requestHandoff,
      reconcile,
      cancel,
      snapshot,
      destroy
    });
  }

  function createController({
    doc,
    view = root,
    ui,
    i18n,
    coreApi,
    adapter,
    MutationObserverCtor = view.MutationObserver
  } = {}) {
    let mounted = false;
    let observer = null;
    let observerWatching = false;
    let reconcileTimer = null;
    let expiryTimer = null;
    let removeLanguageChange = null;
    let card = null;
    let cuedNavigation = null;
    let cuedNavigationClickHandler = null;
    let cuedNavigationStage = "";
    let navigationCueBox = null;
    let navigationCueFrame = null;
    let handoffRetryRemaining = 0;
    let failureVisible = false;
    let unavailableOriginEpoch = 0;
    let activeUnavailableOriginEpoch = 0;
    let backNavigationAcknowledged = false;

    const core = coreApi?.createController?.();
    if (!core) throw new Error("Message person recovery core unavailable");

    function currentContext() {
      const raw = ui?.helpContext?.() || ui?.detectContext?.();
      const verified = raw?.confidence === "high";
      if (!verified) return { verified: false, key: "", area: "unknown" };
      const key = [raw.area || "unknown", raw.view || "unknown", raw.directIdentityKey || ""].join(":");
      return { verified: true, key, area: raw.area || "unknown" };
    }

    function guidanceConflictReason() {
      try {
        const walkthroughPanel = doc.getElementById?.("psqm-guide-panel");
        const walkthroughBubble = doc.getElementById?.("psqm-guide-bubble");
        const walkthroughUiVisible = [walkthroughPanel, walkthroughBubble].some(element =>
          element?.isConnected === true && element.hidden !== true
        );
        return guidanceOwnerConflict({
          walkthroughState: hub.walkthrough?.snapshot?.() || null,
          walkthroughUiVisible,
          onboardingState: hub.messageOnboarding?.snapshot?.() || null,
          informationState: hub.messageInformationPaneGuide?.snapshot?.() || null,
          helpPanelOpen: Boolean(doc.getElementById?.("psqm-help-panel")?.isConnected)
        });
      } catch (_) {
        return "guidance-state-unknown";
      }
    }

    function clearReconcileTimer() {
      if (reconcileTimer !== null) view.clearTimeout?.(reconcileTimer);
      reconcileTimer = null;
    }

    function clearExpiryTimer() {
      if (expiryTimer !== null) view.clearTimeout?.(expiryTimer);
      expiryTimer = null;
    }

    function startObserver() {
      if (!mounted || observerWatching || !observer || !(doc.body || doc.documentElement)) return;
      observer.observe(doc.body || doc.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["id", "href", "type", "class", "style", "hidden", "aria-hidden", "aria-disabled", "inert", "disabled", "readonly"]
      });
      observerWatching = true;
    }

    function stopObserver() {
      if (!observerWatching) return;
      observer?.disconnect?.();
      observerWatching = false;
      clearReconcileTimer();
    }

    function removeCard() {
      card?.remove?.();
      card = null;
    }

    function clearHandoffRetry() {
      handoffRetryRemaining = 0;
    }

    function armHandoffRetry() {
      handoffRetryRemaining = HANDOFF_RETRY_ATTEMPTS;
    }

    function clearNavigationCueFrame() {
      if (navigationCueFrame !== null) view.cancelAnimationFrame?.(navigationCueFrame);
      navigationCueFrame = null;
    }

    function removeNavigationCueBox() {
      clearNavigationCueFrame();
      navigationCueBox?.remove?.();
      navigationCueBox = null;
    }

    function ensureNavigationCueBox() {
      if (navigationCueBox?.isConnected) return navigationCueBox;
      const host = doc.body || doc.documentElement;
      if (!host?.append) return null;
      navigationCueBox = doc.createElement("div");
      navigationCueBox.className = NAV_CUE_BOX_CLASS;
      navigationCueBox.setAttribute("data-psqm-ui", "message-person-find-recovery-nav-cue");
      navigationCueBox.setAttribute("aria-hidden", "true");
      navigationCueBox.hidden = true;
      host.append(navigationCueBox);
      return navigationCueBox;
    }

    function setCueBoxLength(property, value) {
      if (!navigationCueBox) return;
      const next = `${Math.round(value * 100) / 100}px`;
      if (navigationCueBox.style[property] !== next) navigationCueBox.style[property] = next;
    }

    function updateNavigationCueBox() {
      navigationCueFrame = null;
      const box = navigationCueBox;
      const target = cuedNavigation;
      if (!mounted || !box || !target?.isConnected || typeof target.getBoundingClientRect !== "function") {
        if (box && box.hidden !== true) box.hidden = true;
        return;
      }

      const rect = target.getBoundingClientRect();
      if (!(rect.width > 0 && rect.height > 0)) {
        if (box.hidden !== true) box.hidden = true;
        return;
      }

      const viewportWidth = Number(view.innerWidth) || Number(doc.documentElement?.clientWidth) || Number.POSITIVE_INFINITY;
      const viewportHeight = Number(view.innerHeight) || Number(doc.documentElement?.clientHeight) || Number.POSITIVE_INFINITY;
      const edge = 1;
      const left = Math.max(edge, rect.left - NAV_CUE_BOX_PADDING_PX);
      const top = Math.max(edge, rect.top - NAV_CUE_BOX_PADDING_PX);
      const right = Math.min(viewportWidth - edge, rect.right + NAV_CUE_BOX_PADDING_PX);
      const bottom = Math.min(viewportHeight - edge, rect.bottom + NAV_CUE_BOX_PADDING_PX);
      const width = right - left;
      const height = bottom - top;
      if (!(width > 0 && height > 0)) {
        if (box.hidden !== true) box.hidden = true;
        return;
      }

      setCueBoxLength("left", left);
      setCueBoxLength("top", top);
      setCueBoxLength("width", width);
      setCueBoxLength("height", height);
      if (box.hidden === true) box.hidden = false;
    }

    function scheduleNavigationCueBox() {
      if (!mounted || !cuedNavigation) return;
      ensureNavigationCueBox();
      if (!navigationCueBox || navigationCueFrame !== null) return;
      if (typeof view.requestAnimationFrame === "function") {
        navigationCueFrame = view.requestAnimationFrame(updateNavigationCueBox);
      } else updateNavigationCueBox();
    }

    function onNavigationCueGeometrySignal() {
      scheduleNavigationCueBox();
    }

    function clearDirectoryCue() {
      if (cuedNavigation && cuedNavigationClickHandler) {
        cuedNavigation.removeEventListener?.("click", cuedNavigationClickHandler);
      }
      if (cuedNavigation) cuedNavigation.classList?.remove?.(NAV_CUE_CLASS);
      cuedNavigation = null;
      cuedNavigationClickHandler = null;
      cuedNavigationStage = "";
      removeNavigationCueBox();
    }

    function setNavigationCue(target, stage) {
      if (!target) {
        clearDirectoryCue();
        return;
      }

      // Keep the cue stable across reconcile renders. Removing and re-adding the
      // class restarted the CSS animation and also woke the MutationObserver,
      // creating an 80 ms render loop that made the pulse appear frozen.
      if (cuedNavigation === target && cuedNavigationStage === stage) {
        if (!target.classList?.contains?.(NAV_CUE_CLASS)) target.classList?.add?.(NAV_CUE_CLASS);
        scheduleNavigationCueBox();
        return;
      }

      clearDirectoryCue();
      cuedNavigation = target;
      cuedNavigationStage = stage;
      cuedNavigation.classList?.add?.(NAV_CUE_CLASS);
      scheduleNavigationCueBox();

      if (stage !== "back") return;
      cuedNavigationClickHandler = (event) => {
        if (event?.isTrusted === false) return;
        backNavigationAcknowledged = true;
        armHandoffRetry();
        clearDirectoryCue();
        removeCard();
        scheduleReconcile();
      };
      cuedNavigation.addEventListener?.("click", cuedNavigationClickHandler);
    }

    function clearUi() {
      backNavigationAcknowledged = false;
      clearHandoffRetry();
      clearDirectoryCue();
      removeCard();
    }

    function ensureCard() {
      if (card?.isConnected) return card;
      card = doc.createElement("section");
      card.id = CARD_ID;
      card.setAttribute("data-psqm-ui", "message-person-find-recovery");
      card.setAttribute("role", "status");
      card.setAttribute("aria-live", "polite");

      const title = doc.createElement("strong");
      title.className = "psqm-message-person-find-recovery-title";
      const body = doc.createElement("p");
      body.className = "psqm-message-person-find-recovery-body";
      const actions = doc.createElement("div");
      actions.className = "psqm-message-person-find-recovery-actions";
      const primary = doc.createElement("button");
      primary.type = "button";
      primary.className = "psqm-message-person-find-recovery-primary";
      primary.addEventListener("click", () => {
        const generation = coordinator.snapshot().generation;
        if (!coordinator.requestHandoff(generation)) return;
        failureVisible = false;
        armExpiryRender();
        // requestHandoff emits synchronously and already renders the handoff UI.
        // Avoid a second immediate render, which used to restart the pulse.
        scheduleReconcile();
      });
      const cancel = doc.createElement("button");
      cancel.type = "button";
      cancel.className = "psqm-message-person-find-recovery-cancel";
      cancel.addEventListener("click", () => {
        coordinator.cancel("not-now");
        failureVisible = false;
        clearExpiryTimer();
        clearUi();
      });
      actions.append(primary, cancel);
      card.append(title, body, actions);

      const recipient = backNavigationAcknowledged ? null : ui?.messages?.recipientInput?.();
      const anchor = recipient?.verified ? recipient.element : null;
      const host = anchor?.parentElement;
      if (host?.insertAdjacentElement) host.insertAdjacentElement("afterend", card);
      else doc.body?.append?.(card);
      return card;
    }

    function cueHandoffNavigation() {
      const onDirectoryPath = adapter.isDirectoryPath?.() === true;
      const onOverviewPath = adapter.isOverviewPath?.() === true;
      const back = adapter.messagesBackNavigation?.() || { status: "MISSING", element: null };
      const directory = adapter.directoryNavigation?.() || { status: "MISSING", element: null };
      const model = handoffCueModel({
        onDirectoryPath,
        onOverviewPath,
        backStatus: back.status,
        directoryStatus: directory.status,
        backAcknowledged: backNavigationAcknowledged
      });
      const target = model.stage === "back" ? back.element : model.stage === "directory" ? directory.element : null;
      setNavigationCue(target, model.stage);
      return model;
    }

    function text(key, fallback = "") {
      return i18n?.t?.(key, {}, fallback) || fallback || key;
    }

    function setNodeText(node, value) {
      if (!node) return;
      const next = String(value ?? "");
      if (node.textContent !== next) node.textContent = next;
    }

    function setNodeHidden(node, value) {
      if (!node) return;
      const next = value === true;
      if (node.hidden !== next) node.hidden = next;
    }

    function setPanelMode(panel, mode) {
      if (panel?.dataset?.mode !== mode) panel.dataset.mode = mode;
    }

    function renderFailure() {
      clearDirectoryCue();
      const panel = ensureCard();
      setPanelMode(panel, "failure");
      const title = panel.querySelector?.(".psqm-message-person-find-recovery-title");
      const body = panel.querySelector?.(".psqm-message-person-find-recovery-body");
      const primary = panel.querySelector?.(".psqm-message-person-find-recovery-primary");
      const cancel = panel.querySelector?.(".psqm-message-person-find-recovery-cancel");
      setNodeText(title, text("messagePersonFindRecovery.title"));
      setNodeText(body, text("messagePersonFindRecovery.failure"));
      setNodeHidden(primary, true);
      setNodeHidden(cancel, false);
      setNodeText(cancel, text("common.close", "Close"));
    }

    function render() {
      if (!mounted) return;
      const state = coordinator.snapshot();
      if (failureVisible) {
        renderFailure();
        return;
      }
      const model = viewModel(state);
      if (model.mode === "none") {
        clearUi();
        return;
      }

      let bodyKey = model.bodyKey;
      if (model.mode === "handoff") {
        bodyKey = cueHandoffNavigation().bodyKey;
      } else clearDirectoryCue();

      const panel = ensureCard();
      setPanelMode(panel, model.mode);
      const title = panel.querySelector?.(".psqm-message-person-find-recovery-title");
      const body = panel.querySelector?.(".psqm-message-person-find-recovery-body");
      const primary = panel.querySelector?.(".psqm-message-person-find-recovery-primary");
      const cancel = panel.querySelector?.(".psqm-message-person-find-recovery-cancel");
      setNodeText(title, text(model.titleKey));
      setNodeText(body, text(bodyKey));
      setNodeHidden(primary, !model.actionKey);
      if (model.actionKey) setNodeText(primary, text(model.actionKey));
      setNodeHidden(cancel, false);
      setNodeText(cancel, text(model.cancelKey));
    }

    const coordinator = createCoordinator({
      core,
      adapter,
      getContext: currentContext,
      onChange: (event) => {
        failureVisible = event.kind === "failure";
        if (["settled", "cancel", "handed-off", "destroy"].includes(event.kind)) {
          clearExpiryTimer();
          clearHandoffRetry();
        }
        syncObserver();
        render();
      }
    });

    function yieldToGuidanceConflict() {
      const state = coordinator.snapshot();
      if (state.phase === "IDLE") return "";

      if (state.phase === "HANDOFF_PENDING") {
        const visibleReason = visibleGuidanceConflict(doc);
        if (!visibleReason) return "";
        failureVisible = false;
        clearDirectoryCue();
        removeCard();
        return visibleReason;
      }

      const reason = guidanceConflictReason();
      if (!reason) return "";
      activeUnavailableOriginEpoch = 0;
      coordinator.cancel(`guidance-owner:${reason}`);
      failureVisible = false;
      clearExpiryTimer();
      clearUi();
      return reason;
    }

    function syncObserver() {
      if (coordinator.snapshot().phase === "IDLE") stopObserver();
      else startObserver();
    }

    function scheduleReconcile(delay = RECONCILE_DELAY_MS) {
      if (!mounted || coordinator.snapshot().phase === "IDLE" || reconcileTimer !== null) return;
      reconcileTimer = view.setTimeout?.(() => {
        reconcileTimer = null;
        reconcile();
      }, Math.max(0, Number(delay) || 0)) ?? null;
    }

    function armExpiryRender() {
      clearExpiryTimer();
      expiryTimer = view.setTimeout?.(() => {
        expiryTimer = null;
        failureVisible = false;
        syncObserver();
        render();
      }, (coreApi?.ACTIVE_TTL_MS || 60000) + RECONCILE_DELAY_MS) ?? null;
    }

    function captureUnavailableOrigin() {
      if (!mounted) return null;
      if (guidanceConflictReason()) {
        activeUnavailableOriginEpoch = 0;
        return null;
      }
      const panel = ui?.messages?.groupInformationPanel?.();
      if (!panel?.verified || !panel.element || panel.element.isConnected === false) return null;
      activeUnavailableOriginEpoch = ++unavailableOriginEpoch;
      return Object.freeze({ epoch: activeUnavailableOriginEpoch });
    }

    function consumeUnavailableOrigin(token) {
      const epoch = Number(token?.epoch) || 0;
      if (!epoch || epoch !== activeUnavailableOriginEpoch) return false;
      activeUnavailableOriginEpoch = 0;
      return true;
    }

    function releaseUnavailableOrigin(token) {
      if (!mounted) return false;
      return consumeUnavailableOrigin(token);
    }

    function legacyUnavailableCompletionSurfaceVerified() {
      const recipient = ui?.messages?.recipientInput?.()?.element;
      const message = ui?.messages?.messageInput?.()?.element;
      return recipient?.id === LEGACY_RECIPIENT_INPUT_ID
        && message?.id === LEGACY_MESSAGE_INPUT_ID
        && recipient.isConnected !== false
        && message.isConnected !== false;
    }

    function beginGroupInformationAttempt(searchTerm) {
      if (!mounted) return null;
      failureVisible = false;
      clearUi();
      const generation = coordinator.beginGroupInformationAttempt(searchTerm);
      if (generation !== null) armExpiryRender();
      return generation;
    }

    function settleGroupInformationAttempt(generation, status) {
      if (!mounted) return false;
      const accepted = coordinator.settleGroupInformationAttempt(generation, status);
      if (accepted) {
        if (status !== "unavailable") clearExpiryTimer();
        // The coordinator emits synchronously and already renders the accepted state.
        scheduleReconcile();
      }
      return accepted;
    }

    function offerUnavailable(searchTerm, originToken) {
      if (!mounted || !consumeUnavailableOrigin(originToken)) return null;
      if (guidanceConflictReason()) return null;
      if (!legacyUnavailableCompletionSurfaceVerified()) return null;
      const generation = beginGroupInformationAttempt(searchTerm);
      if (generation === null) return null;
      return settleGroupInformationAttempt(generation, "unavailable") ? generation : null;
    }

    function reconcile() {
      if (!mounted) return "UNMOUNTED";
      if (yieldToGuidanceConflict()) return "CANCELLED_GUIDANCE";
      const result = coordinator.reconcile();
      if (["HANDED_OFF", "CANCELLED", "IDLE", "FAILED"].includes(result)) {
        clearExpiryTimer();
        clearHandoffRetry();
      }
      render();

      // DOM mutations can be coalesced while the Messages surface is closing.
      // A short bounded retry bridge prevents a lost wake-up between Back and
      // the feed navigation becoming ready, then stops as soon as Directory is
      // found and pulsing (WAITING_DIRECTORY).
      const state = coordinator.snapshot();
      if (result === "VERIFYING_DIRECTORY") {
        scheduleReconcile(DIRECTORY_VERIFY_DELAY_MS);
      } else if (backNavigationAcknowledged
          && state.phase === "HANDOFF_PENDING"
          && ["WAITING", "WAITING_BACK"].includes(result)
          && handoffRetryRemaining > 0) {
        handoffRetryRemaining -= 1;
        scheduleReconcile(HANDOFF_RETRY_DELAY_MS);
      }
      return result;
    }

    function onRouteSignal() {
      if (!mounted || coordinator.snapshot().phase !== "HANDOFF_PENDING") return;
      if (backNavigationAcknowledged) armHandoffRetry();
      scheduleReconcile(0);
    }

    function inspect() {
      const back = adapter.messagesBackNavigation?.() || { status: "MISSING" };
      const directory = adapter.directoryNavigation?.() || { status: "MISSING" };
      const state = coordinator.snapshot();
      return Object.freeze({
        pathname: String(view.location?.pathname || ""),
        phase: state.phase,
        generation: state.generation,
        pendingSearchTerm: state.pendingSearchTerm,
        backNavigationAcknowledged,
        handoffRetryRemaining,
        cueStage: cuedNavigationStage,
        cueConnected: cuedNavigation?.isConnected === true,
        cueBoxConnected: navigationCueBox?.isConnected === true,
        cueBoxVisible: navigationCueBox?.isConnected === true && navigationCueBox.hidden !== true,
        backStatus: String(back.status || "MISSING"),
        directoryStatus: String(directory.status || "MISSING"),
        onOverviewPath: adapter.isOverviewPath?.() === true,
        onDirectoryPath: adapter.isDirectoryPath?.() === true
      });
    }

    function onPageHide() {
      activeUnavailableOriginEpoch = 0;
      coordinator.cancel("pagehide");
      failureVisible = false;
      clearExpiryTimer();
      clearUi();
    }

    function mount() {
      if (mounted) return;
      mounted = true;
      removeLanguageChange = i18n?.onChange?.(() => render()) || null;
      view.addEventListener?.("pagehide", onPageHide);
      view.addEventListener?.("popstate", onRouteSignal);
      view.addEventListener?.("hashchange", onRouteSignal);
      view.addEventListener?.("resize", onNavigationCueGeometrySignal);
      view.addEventListener?.("scroll", onNavigationCueGeometrySignal, true);
      view.visualViewport?.addEventListener?.("resize", onNavigationCueGeometrySignal);
      view.visualViewport?.addEventListener?.("scroll", onNavigationCueGeometrySignal);
      if (typeof MutationObserverCtor === "function") {
        observer = new MutationObserverCtor(() => {
          if (yieldToGuidanceConflict()) return;
          scheduleReconcile();
        });
      }
      syncObserver();
      render();
    }

    function destroy() {
      if (!mounted) return;
      activeUnavailableOriginEpoch = 0;
      stopObserver();
      mounted = false;
      observer = null;
      removeLanguageChange?.();
      removeLanguageChange = null;
      view.removeEventListener?.("pagehide", onPageHide);
      view.removeEventListener?.("popstate", onRouteSignal);
      view.removeEventListener?.("hashchange", onRouteSignal);
      view.removeEventListener?.("resize", onNavigationCueGeometrySignal);
      view.removeEventListener?.("scroll", onNavigationCueGeometrySignal, true);
      view.visualViewport?.removeEventListener?.("resize", onNavigationCueGeometrySignal);
      view.visualViewport?.removeEventListener?.("scroll", onNavigationCueGeometrySignal);
      clearReconcileTimer();
      clearExpiryTimer();
      coordinator.destroy();
      failureVisible = false;
      clearUi();
    }

    return Object.freeze({
      mount,
      captureUnavailableOrigin,
      releaseUnavailableOrigin,
      beginGroupInformationAttempt,
      settleGroupInformationAttempt,
      offerUnavailable,
      reconcile,
      inspect,
      destroy,
      snapshot: coordinator.snapshot
    });
  }

  if (typeof document === "object" && hub.messagePersonFindRecoveryCore && hub.messagePersonFindRecoveryAdapter && !hub.messagePersonFindRecovery) {
    hub.messagePersonFindRecovery = createController({
      doc: document,
      view: root,
      ui: hub.ui,
      i18n: hub.i18n,
      coreApi: hub.messagePersonFindRecoveryCore,
      adapter: hub.messagePersonFindRecoveryAdapter
    });
  }

  if (typeof module === "object" && module.exports) {
    module.exports = Object.freeze({
      CARD_ID,
      NAV_CUE_CLASS,
      NAV_CUE_BOX_CLASS,
      NAV_CUE_BOX_PADDING_PX,
      RECONCILE_DELAY_MS,
      HANDOFF_RETRY_DELAY_MS,
      HANDOFF_RETRY_ATTEMPTS,
      DIRECTORY_VERIFY_DELAY_MS,
      DIRECTORY_PREFILL_ATTEMPTS,
      DIRECTORY_STABLE_PASSES,
      viewModel,
      handoffCueModel,
      guidanceOwnerConflict,
      guidanceSurfaceVisible,
      visibleGuidanceConflict,
      createCoordinator,
      createController
    });
  }
})(globalThis);
