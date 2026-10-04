(function (root) {
  "use strict";
  const hub = root.PSQM ??= {};

  function computeMessagesHelpTriggerPoint({ width, height, boundary, size, margin, gap, direct = false, avoidRects = [] }) {
    const rightEdge = boundary && boundary.width > 0 ? Math.min(width, boundary.right) : width;
    const topEdge = boundary && boundary.height > 0 ? Math.max(0, boundary.top) : 0;
    const left = Math.min(
      Math.max(margin, rightEdge - margin - size),
      Math.max(margin, width - margin - size)
    );
    const maxTop = Math.max(margin, height - margin - size);
    const baseTop = Math.min(Math.max(margin, topEdge + margin), maxTop);
    if (!direct) return { left, top: baseTop };

    const usableRects = avoidRects.filter(rect => rect && rect.width > 0 && rect.height > 0);
    const belowActions = usableRects.length
      ? Math.max(...usableRects.map(rect => rect.bottom)) + gap
      : topEdge + margin + size + gap;
    return { left, top: Math.min(Math.max(baseTop, belowActions), maxTop) };
  }

  function shouldSkipDirectGuardianCueLookup({ enabled = true, panelOpen = false, context, lastIdentityKey = "" } = {}) {
    return enabled !== true
      || panelOpen === true
      || context?.area !== "messages"
      || context.view !== "direct-conversation"
      || context.directCategory !== "student"
      || !context.directIdentityKey
      || context.directIdentityKey === lastIdentityKey;
  }

  function shouldPreserveDirectGuardianCue({ context, lastIdentityKey = "" } = {}) {
    return context?.area === "messages"
      && context.view === "direct-conversation"
      && context.directCategory === "student"
      && Boolean(context.directIdentityKey)
      && context.directIdentityKey === lastIdentityKey;
  }

  function shouldShowDirectGuardianGroupCue({ context, target, view, lastIdentityKey = "" } = {}) {
    return context?.area === "messages"
      && context.view === "direct-conversation"
      && context.directCategory === "student"
      && Boolean(context.directIdentityKey)
      && context.directIdentityKey !== lastIdentityKey
      && target?.verified === true
      && target.element?.isConnected === true
      && view?.inView === true
      && view.covered !== true;
  }

  function computeDirectGuardianCuePoint({ targetRect, bubbleRect, width, height, margin = 10, gap = 10 } = {}) {
    const bubbleWidth = Math.max(0, bubbleRect?.width || 0);
    const bubbleHeight = Math.max(0, bubbleRect?.height || 0);
    const maxLeft = Math.max(margin, width - bubbleWidth - margin);
    const preferredLeft = (targetRect?.left || 0) - bubbleWidth - gap;
    const left = Math.min(Math.max(margin, preferredLeft), maxLeft);
    const below = (targetRect?.bottom || 0) + gap;
    const above = Math.max(margin, (targetRect?.top || 0) - bubbleHeight - gap);
    const top = below + bubbleHeight <= height - margin ? below : above;
    return { left, top };
  }

  function resumeStateFromStorageChange(changes = {}, currentState = null, tourResume = hub.tourResume) {
    const key = tourResume?.STORAGE_KEY;
    if (!key || !changes?.[key]) return currentState;
    return tourResume?.normalize?.(changes[key].newValue) || currentState;
  }

  const COPILOT_URL = "https://m365.cloud.microsoft/";

  function shouldResetTranslationEntry(context) {
    return Boolean(context?.area) && context.area !== "messages" && context.area !== "unknown";
  }

  function translationCueAction({
    enabled = true,
    context,
    cueShown = false,
    panelOpen = false,
    onboardingBlocked = false,
    guideActive = false,
    control
  } = {}) {
    return enabled === true
      && context?.area === "messages"
      && cueShown !== true
      && panelOpen !== true
      && onboardingBlocked !== true
      && guideActive !== true
      && control?.verified === true
      && control.view === "translated"
      ? "pulse"
      : "none";
  }

  function translationCopilotPromptAction({
    enabled = true,
    context,
    cueShown = false,
    promptShown = false,
    teacherActivated = false,
    target
  } = {}) {
    return enabled === true
      && context?.area === "messages"
      && cueShown === true
      && promptShown !== true
      && teacherActivated === true
      && target?.verified === true
      && target.view === "original"
      ? "prompt"
      : "none";
  }

  if (typeof module === "object" && module.exports) module.exports = {
    computeMessagesHelpTriggerPoint,
    shouldSkipDirectGuardianCueLookup,
    shouldPreserveDirectGuardianCue,
    shouldShowDirectGuardianGroupCue,
    computeDirectGuardianCuePoint,
    resumeStateFromStorageChange,
    shouldResetTranslationEntry,
    translationCueAction,
    translationCopilotPromptAction,
    COPILOT_URL
  };
  if (hub.help || typeof document !== "object") return;

  const HELP_SEEN_STORAGE_KEY = "helpSeenContexts";
  const DISCOVERY_DELAY = 1500;
  const RETURN_CUE_MS = 6000;
  const DIRECT_GUARDIAN_CUE_MS = 6000;
  const TRANSLATION_CUE_MS = 1500;
  const ACTIVE_GUIDE_STATES = ["RUNNING", "WAITING_FOR_TARGET", "WAITING_FOR_ACTION", "VERIFYING", "STEP_COMPLETE", "PAUSED", "BLOCKED"];
  const topics = Object.freeze({
    newsfeed: { titleKey: "help.newsfeed.title", introKey: "help.newsfeed.intro", languageReference: true,
      noteKeys: ["help.newsfeed.note1", "help.newsfeed.note2"], moreKeys: ["help.newsfeed.more1"], guide: "newsfeed-create" },
    preview: { titleKey: "help.preview.title", introKey: "help.preview.intro", languageReference: true,
      noteKeys: ["help.preview.note1", "help.preview.note2"], guidesHidden: true },
    messages: { titleKey: "help.messages.title", introKey: "help.messages.intro",
      noteKeys: ["help.messages.note1", "help.messages.note2"], moreKeys: ["help.messages.more2"] },
    "direct-message": { titleKey: "help.directMessage.title", introKey: "help.directMessage.intro", noteKeys: [] },
    directory: { titleKey: "help.directory.title", introKey: "help.directory.intro", noteKeys: ["help.directory.note1"] },
    "group-information": { titleKey: "help.groupInformation.title", introKey: "help.groupInformation.intro",
      noteKeys: [], moreKeys: ["help.groupInformation.more1"] },
    "group-chat": { titleKey: "help.groupChat.title", introKey: "help.groupChat.intro",
      noteKeys: ["help.groupChat.note1"] },
    unknown: { titleKey: "help.unknown.title", introKey: "help.unknown.intro", noteKeys: [] }
  });

  let trigger = null, panel = null, enabled = true, initialized = false, contextKey = "";
  let helpSeenContexts = {}, discoveryTimer = null, returnCueTimer = null, positionRaf = null, triggerPinnedToMessages = false;
  let resumeReminder = null, startupResumeState = null, resumeReminderDismissed = false;
  let lastMessagesTriggerPlacementSignature = "";
  let directCueTimer = null, lastDirectIdentityKey = "";
  let directGuardianCueTimer = null, directGuardianCueSpotlight = null, directGuardianCueBubble = null, lastDirectGuardianCueIdentityKey = "";
  let translationCueTimer = null, translationCueSpotlight = null, translationCueTarget = null, translationCueTargetClickHandler = null;
  let translationCueAnchorPoint = null, translationReconcileFrame = null;
  let translationCueShownThisEntry = false, translationCueTeacherActivated = false;
  let translationCopilotPrompt = null, translationCopilotPromptShownThisEntry = false, translationCopilotPromptContextKey = "";
  const isEnabled = () => enabled && hub.features.contextualHelp !== false;
  const tr = (key, vars = {}) => hub.i18n?.t?.(key, vars) || key;
  const node = (tag, text = "") => { const el = document.createElement(tag); el.textContent = text; return el; };
  const currentHelpContext = () => hub.ui.helpContext?.() || hub.ui.detectContext();
  const contextRuntimeKey = context => `${context?.area || "unknown"}:${context?.view || "unknown"}${context?.directIdentityKey ? `:${context.directIdentityKey}` : ""}`;
  const contextDiscoveryKey = context => context?.area && context.area !== "unknown" ? context.area : null;
  const tasksForContext = context => {
    const exact = `${context?.area || "unknown"}:${context?.view || "unknown"}`;
    return (hub.helpTasks || []).filter(task => task.contexts.includes(exact) || task.contexts.includes(context?.area));
  };
  const pointerVisibleWhenHelpOpens = task => {
    // Availability-sensitive pointers are checked lazily when ? Help opens.
    // This hides dead pointers without adding observers, polling, or auto-clicks.
    const livePointers = new Set([
      "messages.create-group",
      "messages.direct-information",
      "messages.direct-guardian-group"
    ]);
    if (!livePointers.has(task?.pointerId)) return true;
    const definition = hub.pointerDefinitions?.[task.pointerId];
    if (!definition?.target || typeof hub.ui?.target !== "function") return false;
    const located = hub.ui.target(definition.target);
    if (!located?.verified || !located.element?.isConnected) return false;
    if (typeof hub.ui?.targetView !== "function") return false;
    const view = hub.ui.targetView(located.element);
    return view?.inView === true && view.covered !== true;
  };
  const taskTitle = task => {
    if (!task?.nativeTitle) return tr(task?.titleKey);
    const definition = hub.pointerDefinitions?.[task.pointerId];
    const nativeLabel = definition?.target ? hub.ui.targetLabel?.(definition.target) : "";
    return nativeLabel || tr(task?.titleKey);
  };

  function rectOverlapArea(a, b, gap = 6) {
    const left = Math.max(a.left, b.left - gap), right = Math.min(a.right, b.right + gap);
    const top = Math.max(a.top, b.top - gap), bottom = Math.min(a.bottom, b.bottom + gap);
    return Math.max(0, right - left) * Math.max(0, bottom - top);
  }

  function nativeInteractiveRects() {
    const selector = "button, [role='button'], a[href], input, select, textarea";
    return [...document.querySelectorAll(selector)]
      .filter(element => !element.closest?.("[data-psqm-ui]"))
      .map(element => element.getBoundingClientRect())
      .filter(rect => rect.width > 0 && rect.height > 0
        && rect.bottom > 0 && rect.right > 0
        && rect.top < (root.innerHeight || document.documentElement.clientHeight)
        && rect.left < (root.innerWidth || document.documentElement.clientWidth));
  }

  function positionHelpPopover() {
    if (!panel?.isConnected || !trigger?.isConnected) return;
    const margin = 12, gap = 10;
    const width = root.innerWidth || document.documentElement.clientWidth;
    const height = root.innerHeight || document.documentElement.clientHeight;
    const anchor = trigger.getBoundingClientRect(), card = panel.getBoundingClientRect();
    let left = Math.min(Math.max(margin, anchor.right - card.width), Math.max(margin, width - card.width - margin));
    let top = anchor.top - card.height - gap;
    if (top < margin) top = Math.min(height - card.height - margin, anchor.bottom + gap);
    top = Math.min(Math.max(margin, top), Math.max(margin, height - card.height - margin));

    // M6H1: In a Direct message, keep Help clear of the native header actions
    // used by the Direct-message pointers (Group Information / guardian group).
    // Prefer moving the panel below those controls; if there is not enough
    // vertical room, move it to their left. No native control is clicked.
    const context = currentHelpContext();
    if (context?.area === "messages" && context.view === "direct-conversation" && typeof hub.ui?.target === "function") {
      const avoidRects = ["messages.directInformationButton", "messages.directGuardianGroupChatButton"]
        .map(key => hub.ui.target(key))
        .filter(result => result?.verified && result.element?.isConnected)
        .map(result => result.element.getBoundingClientRect())
        .filter(rect => rect.width > 0 && rect.height > 0);
      const candidate = () => ({ left, top, right: left + card.width, bottom: top + card.height });
      const overlaps = () => avoidRects.some(rect => rectOverlapArea(candidate(), rect, gap) > 0);
      if (avoidRects.length && overlaps()) {
        const below = Math.max(...avoidRects.map(rect => rect.bottom)) + gap;
        const maxTop = Math.max(margin, height - card.height - margin);
        if (below <= maxTop) top = Math.max(top, below);
        else {
          const avoidLeft = Math.min(...avoidRects.map(rect => rect.left));
          left = Math.min(left, Math.max(margin, avoidLeft - gap - card.width));
        }
      }
    }

    panel.style.left = `${left}px`; panel.style.top = `${top}px`;
    panel.style.right = "auto"; panel.style.bottom = "auto";
  }

  function positionResumeReminder() {
    if (!resumeReminder?.isConnected || !trigger?.isConnected) return;
    const margin = 12, gap = 10;
    const width = root.innerWidth || document.documentElement.clientWidth;
    const height = root.innerHeight || document.documentElement.clientHeight;
    const anchor = trigger.getBoundingClientRect();
    const card = resumeReminder.getBoundingClientRect();
    const preferLeft = anchor.left > width / 2;
    let left = preferLeft ? anchor.left - card.width - gap : anchor.right + gap;
    let top = anchor.top + (anchor.height - card.height) / 2;
    left = Math.min(Math.max(margin, left), Math.max(margin, width - card.width - margin));
    top = Math.min(Math.max(margin, top), Math.max(margin, height - card.height - margin));
    resumeReminder.style.left = `${left}px`;
    resumeReminder.style.top = `${top}px`;
  }

  function positionHelpTrigger(context = null) {
    if (!trigger?.isConnected) return;
    const margin = 16, size = Math.max(40, trigger.offsetWidth || 40, trigger.offsetHeight || 40), gap = 12;
    const width = root.innerWidth || document.documentElement.clientWidth;
    const height = root.innerHeight || document.documentElement.clientHeight;
    const activeContext = context || currentHelpContext();

    // HELP-CHAT-POS-01: Messages keeps a stable right-edge anchor. Direct
    // conversations move that anchor below verified native header actions so
    // the ? cannot cover Group Information / create-group controls.
    if (activeContext?.area === "messages") {
      triggerPinnedToMessages = true;
      const messagesRoot = document.getElementById("header-messenger-inbox-layout");
      const boundary = messagesRoot?.isConnected ? messagesRoot.getBoundingClientRect() : null;
      const isDirectConversation = activeContext?.view === "direct-conversation";
      const avoidRects = isDirectConversation && typeof hub.ui?.target === "function"
        ? ["messages.directInformationButton", "messages.directGuardianGroupChatButton"]
          .map(key => hub.ui.target(key))
          .filter(result => result?.verified && result.element?.isConnected)
          .map(result => result.element.getBoundingClientRect())
          .filter(rect => rect.width > 0 && rect.height > 0)
        : [];
      const point = computeMessagesHelpTriggerPoint({
        width, height, boundary, size, margin, gap,
        direct: activeContext?.view === "direct-conversation",
        avoidRects
      });
      const placementSignature = `${contextRuntimeKey(activeContext)}|${width}|${height}|${size}|${point.left}|${point.top}`;
      if (placementSignature === lastMessagesTriggerPlacementSignature) {
        if (panel?.isConnected) positionHelpPopover();
        positionResumeReminder();
        return;
      }
      lastMessagesTriggerPlacementSignature = placementSignature;
      trigger.style.left = `${point.left}px`; trigger.style.top = `${point.top}px`;
      trigger.style.right = "auto"; trigger.style.bottom = "auto";
      positionHelpPopover();
      positionResumeReminder();
      return;
    }

    triggerPinnedToMessages = false;
    lastMessagesTriggerPlacementSignature = "";
    const nativeRects = nativeInteractiveRects();
    const candidates = [];
    for (let top = height - margin - size; top >= margin && candidates.length < 10; top -= size + gap) {
      candidates.push({ left: Math.max(margin, width - margin - size), top });
    }
    for (let top = height - margin - size; top >= margin && candidates.length < 18; top -= size + gap) {
      candidates.push({ left: margin, top });
    }
    const score = point => {
      const candidate = { left: point.left, top: point.top, right: point.left + size, bottom: point.top + size };
      return nativeRects.reduce((total, rect) => total + rectOverlapArea(candidate, rect), 0);
    };
    const best = candidates.reduce((chosen, point) => score(point) < score(chosen) ? point : chosen,
      candidates[0] || { left: Math.max(margin, width - margin - size), top: margin });
    trigger.style.left = `${best.left}px`; trigger.style.top = `${best.top}px`;
    trigger.style.right = "auto"; trigger.style.bottom = "auto";
    positionHelpPopover();
    positionResumeReminder();
  }

  function scheduleHelpPosition(event) {
    const keepPinnedMessagesTrigger = event?.type === "scroll" && triggerPinnedToMessages;
    if (positionRaf !== null) return;
    const raf = root.requestAnimationFrame || (callback => root.setTimeout(callback, 16));
    positionRaf = raf(() => {
      positionRaf = null;
      if (!keepPinnedMessagesTrigger) positionHelpTrigger();
      if (translationCueSpotlight?.isConnected && translationCueTarget?.isConnected) {
        positionTranslationCue(translationCueTarget);
      }
      if (translationCopilotPrompt?.isConnected && translationCueTarget?.isConnected) {
        positionTranslationCopilotPrompt(translationCueTarget);
      }
    });
  }

  function clearDiscoveryTimer() {
    if (discoveryTimer !== null) root.clearTimeout(discoveryTimer);
    discoveryTimer = null;
    trigger?.classList.remove("psqm-help-trigger-pulse");
  }

  function clearDirectCue() {
    if (directCueTimer !== null) root.clearTimeout(directCueTimer);
    directCueTimer = null;
    trigger?.classList.remove("psqm-help-direct-pulse");
  }

  function pulseDirectConversation(context) {
    if (!trigger?.isConnected || context?.view !== "direct-conversation" || !context.directIdentityKey) return;
    if (context.directIdentityKey === lastDirectIdentityKey) return;
    lastDirectIdentityKey = context.directIdentityKey;
    clearDirectCue();
    // Pulse only. Never auto-open Help or start a pointer for the teacher.
    trigger.classList.add("psqm-help-direct-pulse");
    directCueTimer = root.setTimeout(() => {
      directCueTimer = null;
      trigger?.classList.remove("psqm-help-direct-pulse");
    }, 1500);
  }

  function clearDirectGuardianGroupCue({ resetIdentity = false } = {}) {
    if (directGuardianCueTimer !== null) root.clearTimeout(directGuardianCueTimer);
    directGuardianCueTimer = null;
    directGuardianCueSpotlight?.remove();
    directGuardianCueBubble?.remove();
    directGuardianCueSpotlight = null;
    directGuardianCueBubble = null;
    if (resetIdentity) lastDirectGuardianCueIdentityKey = "";
  }

  function positionDirectGuardianGroupCue(targetElement) {
    if (!targetElement?.isConnected || !directGuardianCueSpotlight?.isConnected || !directGuardianCueBubble?.isConnected) return;
    const targetRect = targetElement.getBoundingClientRect();
    directGuardianCueSpotlight.style.left = `${Math.max(0, targetRect.left - 3)}px`;
    directGuardianCueSpotlight.style.top = `${Math.max(0, targetRect.top - 3)}px`;
    directGuardianCueSpotlight.style.width = `${targetRect.width + 6}px`;
    directGuardianCueSpotlight.style.height = `${targetRect.height + 6}px`;
    const bubbleRect = directGuardianCueBubble.getBoundingClientRect();
    const point = computeDirectGuardianCuePoint({
      targetRect,
      bubbleRect,
      width: root.innerWidth || document.documentElement.clientWidth,
      height: root.innerHeight || document.documentElement.clientHeight
    });
    directGuardianCueBubble.style.left = `${point.left}px`;
    directGuardianCueBubble.style.top = `${point.top}px`;
  }

  function showDirectGuardianGroupCue(context) {
    if (shouldPreserveDirectGuardianCue({ context, lastIdentityKey: lastDirectGuardianCueIdentityKey })) return false;
    if (shouldSkipDirectGuardianCueLookup({
      enabled: isEnabled(),
      panelOpen: Boolean(panel),
      context,
      lastIdentityKey: lastDirectGuardianCueIdentityKey
    }) || typeof hub.ui?.target !== "function") {
      clearDirectGuardianGroupCue();
      return false;
    }
    const target = hub.ui.target("messages.directGuardianGroupChatButton");
    const view = typeof hub.ui?.targetView === "function" && target?.element
      ? hub.ui.targetView(target.element)
      : null;
    if (!shouldShowDirectGuardianGroupCue({
      context,
      target,
      view,
      lastIdentityKey: lastDirectGuardianCueIdentityKey
    })) {
      if (!target?.verified || !target.element?.isConnected || view?.inView !== true || view?.covered === true) clearDirectGuardianGroupCue();
      return false;
    }

    clearDirectGuardianGroupCue();
    lastDirectGuardianCueIdentityKey = context.directIdentityKey;
    directGuardianCueSpotlight = node("div");
    directGuardianCueSpotlight.className = "psqm-guide-spotlight psqm-guide-pulse psqm-direct-guardian-discovery-spotlight";
    directGuardianCueSpotlight.dataset.psqmUi = "direct-guardian-discovery";
    directGuardianCueSpotlight.setAttribute("aria-hidden", "true");

    directGuardianCueBubble = node("aside");
    directGuardianCueBubble.className = "psqm-guide-bubble psqm-direct-guardian-discovery-bubble";
    directGuardianCueBubble.dataset.psqmUi = "direct-guardian-discovery";
    directGuardianCueBubble.lang = hub.i18n?.language?.() === "vi" ? "vi" : "en";
    directGuardianCueBubble.setAttribute("role", "note");
    directGuardianCueBubble.append(node("p", tr("help.directMessage.guardianGroup.instruction")));

    document.body.append(directGuardianCueSpotlight, directGuardianCueBubble);
    positionDirectGuardianGroupCue(target.element);
    directGuardianCueTimer = root.setTimeout(() => clearDirectGuardianGroupCue(), DIRECT_GUARDIAN_CUE_MS);
    return true;
  }

  function clearTranslationCueVisual() {
    if (translationCueTimer !== null) root.clearTimeout(translationCueTimer);
    translationCueTimer = null;
    translationCueSpotlight?.remove();
    translationCueSpotlight = null;
  }

  function detachTranslationCueTargetListener() {
    if (translationCueTarget?.isConnected && translationCueTargetClickHandler) {
      translationCueTarget.removeEventListener("click", translationCueTargetClickHandler);
    }
    translationCueTargetClickHandler = null;
  }

  function clearTranslationCopilotPrompt({ preserveShown = true } = {}) {
    translationCopilotPrompt?.remove();
    translationCopilotPrompt = null;
    translationCopilotPromptContextKey = "";
    if (!preserveShown) translationCopilotPromptShownThisEntry = false;
  }

  function clearTranslationReconcileFrame() {
    if (translationReconcileFrame === null) return;
    if (typeof root.cancelAnimationFrame === "function" && typeof root.requestAnimationFrame === "function") {
      root.cancelAnimationFrame(translationReconcileFrame);
    } else {
      root.clearTimeout(translationReconcileFrame);
    }
    translationReconcileFrame = null;
  }

  function scheduleTranslationReconcile() {
    if (translationReconcileFrame !== null) return;
    const raf = root.requestAnimationFrame || (callback => root.setTimeout(callback, 16));
    translationReconcileFrame = raf(() => {
      translationReconcileFrame = null;
      reconcileTranslationCue(currentHelpContext());
    });
  }

  function translationAnchorPoint(targetElement) {
    if (!targetElement?.isConnected) return null;
    const rect = targetElement.getBoundingClientRect();
    if (!(rect.width > 0 && rect.height > 0)) return null;
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function resetTranslationEntry() {
    clearTranslationReconcileFrame();
    clearTranslationCueVisual();
    clearTranslationCopilotPrompt({ preserveShown: false });
    detachTranslationCueTargetListener();
    translationCueTarget = null;
    translationCueAnchorPoint = null;
    translationCueShownThisEntry = false;
    translationCueTeacherActivated = false;
  }

  function positionTranslationCue(targetElement) {
    if (!targetElement?.isConnected || !translationCueSpotlight?.isConnected) return;
    const rect = targetElement.getBoundingClientRect();
    translationCueSpotlight.style.left = `${Math.max(0, rect.left - 3)}px`;
    translationCueSpotlight.style.top = `${Math.max(0, rect.top - 3)}px`;
    translationCueSpotlight.style.width = `${rect.width + 6}px`;
    translationCueSpotlight.style.height = `${rect.height + 6}px`;
  }

  function positionTranslationCopilotPrompt(targetElement) {
    if (!targetElement?.isConnected || !translationCopilotPrompt?.isConnected) return;
    const targetRect = targetElement.getBoundingClientRect();
    const bubbleRect = translationCopilotPrompt.getBoundingClientRect();
    const point = computeDirectGuardianCuePoint({
      targetRect,
      bubbleRect,
      width: root.innerWidth || document.documentElement.clientWidth,
      height: root.innerHeight || document.documentElement.clientHeight
    });
    translationCopilotPrompt.style.left = `${point.left}px`;
    translationCopilotPrompt.style.top = `${point.top}px`;
  }

  function showTranslationCopilotPrompt(context, targetElement) {
    if (!targetElement?.isConnected || translationCopilotPrompt?.isConnected) return false;
    translationCopilotPromptShownThisEntry = true;
    translationCopilotPromptContextKey = contextRuntimeKey(context);

    translationCopilotPrompt = node("aside");
    translationCopilotPrompt.className = "psqm-guide-bubble psqm-translation-copilot-prompt";
    translationCopilotPrompt.dataset.psqmUi = "translation-copilot-prompt";
    translationCopilotPrompt.lang = hub.i18n?.language?.() === "vi" ? "vi" : "en";
    translationCopilotPrompt.setAttribute("role", "dialog");
    translationCopilotPrompt.setAttribute("aria-modal", "false");
    translationCopilotPrompt.setAttribute("aria-labelledby", "psqm-translation-copilot-prompt-title");

    const closeButton = node("button", "×");
    closeButton.type = "button";
    closeButton.className = "psqm-guide-bubble-exit";
    closeButton.setAttribute("aria-label", tr("help.close"));
    closeButton.addEventListener("click", () => clearTranslationCopilotPrompt());

    const title = node("p", tr("translationCue.copilotPrompt"));
    title.id = "psqm-translation-copilot-prompt-title";
    const privacy = node("p", tr("translationCue.copilotPrivacy"));
    privacy.className = "psqm-translation-copilot-privacy";

    const actions = node("div");
    actions.className = "psqm-translation-copilot-actions";
    const openCopilot = node("a", tr("translationCue.openCopilot"));
    openCopilot.className = "psqm-translation-copilot-open";
    openCopilot.href = COPILOT_URL;
    openCopilot.target = "_blank";
    openCopilot.rel = "noopener noreferrer";
    openCopilot.addEventListener("click", () => clearTranslationCopilotPrompt());
    const notNow = node("button", tr("translationCue.notNow"));
    notNow.type = "button";
    notNow.className = "psqm-translation-copilot-later";
    notNow.addEventListener("click", () => clearTranslationCopilotPrompt());
    actions.append(openCopilot, notNow);

    translationCopilotPrompt.append(closeButton, title, privacy, actions);
    document.body.append(translationCopilotPrompt);
    positionTranslationCopilotPrompt(targetElement);
    return true;
  }

  function reconcileTranslationCue(context) {
    if (shouldResetTranslationEntry(context)) {
      resetTranslationEntry();
      return;
    }
    if (context?.area !== "messages") return;

    const currentKey = contextRuntimeKey(context);
    if (translationCopilotPrompt?.isConnected
      && translationCopilotPromptContextKey
      && translationCopilotPromptContextKey !== currentKey) {
      clearTranslationCopilotPrompt();
    }

    if (translationCueShownThisEntry && translationCueTeacherActivated && !translationCopilotPromptShownThisEntry) {
      let targetState = typeof hub.ui?.messages?.translationControlState === "function" && translationCueTarget
        ? hub.ui.messages.translationControlState(translationCueTarget)
        : null;
      if (targetState?.verified !== true && translationCueAnchorPoint
        && typeof hub.ui?.messages?.translationControlAtPoint === "function") {
        const replacementState = hub.ui.messages.translationControlAtPoint(
          translationCueAnchorPoint.x,
          translationCueAnchorPoint.y
        );
        if (replacementState?.verified === true) {
          translationCueTarget = replacementState.element;
          targetState = replacementState;
        }
      }
      if (translationCopilotPromptAction({
        enabled: isEnabled(),
        context,
        cueShown: translationCueShownThisEntry,
        promptShown: translationCopilotPromptShownThisEntry,
        teacherActivated: translationCueTeacherActivated,
        target: targetState
      }) === "prompt") {
        showTranslationCopilotPrompt(context, targetState.element || translationCueTarget);
        detachTranslationCueTargetListener();
        return;
      }
    }

    if (translationCueShownThisEntry) return;
    const control = typeof hub.ui?.messages?.translationControl === "function"
      ? hub.ui.messages.translationControl()
      : null;
    const walkthroughState = hub.walkthrough?.snapshot?.();
    const guideActive = Boolean(walkthroughState && ACTIVE_GUIDE_STATES.includes(walkthroughState.status));
    const onboardingBlocked = hub.messageOnboarding?.blocksContextHelpDiscovery?.(context) === true;
    if (translationCueAction({
      enabled: isEnabled(),
      context,
      cueShown: translationCueShownThisEntry,
      panelOpen: Boolean(panel),
      onboardingBlocked,
      guideActive,
      control
    }) !== "pulse") return;

    translationCueShownThisEntry = true;
    translationCueTarget = control.element;
    translationCueAnchorPoint = translationAnchorPoint(translationCueTarget);
    translationCueTeacherActivated = false;
    translationCueTargetClickHandler = event => {
      if (event?.isTrusted !== true) return;
      translationCueTeacherActivated = true;
      translationCueAnchorPoint = translationAnchorPoint(translationCueTarget) || translationCueAnchorPoint;
      translationCueTarget.removeEventListener("click", translationCueTargetClickHandler);
      translationCueTargetClickHandler = null;
      scheduleTranslationReconcile();
    };
    translationCueTarget.addEventListener("click", translationCueTargetClickHandler);

    clearTranslationCueVisual();
    translationCueSpotlight = node("div");
    translationCueSpotlight.className = "psqm-guide-spotlight psqm-guide-pulse psqm-translation-native-spotlight";
    translationCueSpotlight.dataset.psqmUi = "translation-native-cue";
    translationCueSpotlight.setAttribute("aria-hidden", "true");
    document.body.append(translationCueSpotlight);
    positionTranslationCue(translationCueTarget);
    translationCueTimer = root.setTimeout(() => clearTranslationCueVisual(), TRANSLATION_CUE_MS);
  }

  function syncTriggerLabel() {
    if (!trigger) return;
    const base = tr("help.launcherLabel");
    const cue = returnCueTimer !== null ? tr("help.returnCue") : "";
    trigger.setAttribute("aria-label", cue ? `${base}. ${cue}` : base);
    trigger.setAttribute("title", base);
    if (cue) trigger.dataset.returnCue = cue;
    else delete trigger.dataset.returnCue;
  }

  function clearReturnCue() {
    if (returnCueTimer !== null) root.clearTimeout(returnCueTimer);
    returnCueTimer = null;
    if (!trigger) return;
    trigger.classList.remove("psqm-help-return-cue");
    delete trigger.dataset.returnCue;
    delete trigger.dataset.returnSide;
    syncTriggerLabel();
  }

  function showReturnCue() {
    if (!isEnabled() || !trigger?.isConnected) return false;
    if (returnCueTimer !== null) return true;
    // The explicit return cue supersedes first-use discovery so Help never auto-opens here.
    clearDiscoveryTimer();
    const rect = trigger.getBoundingClientRect();
    const width = root.innerWidth || document.documentElement.clientWidth;
    trigger.dataset.returnSide = rect.left < width / 2 ? "right" : "left";
    trigger.classList.add("psqm-help-return-cue");
    returnCueTimer = root.setTimeout(() => {
      returnCueTimer = null;
      trigger?.classList.remove("psqm-help-return-cue");
      if (trigger) {
        delete trigger.dataset.returnCue;
        delete trigger.dataset.returnSide;
      }
      syncTriggerLabel();
    }, RETURN_CUE_MS);
    syncTriggerLabel();
    return true;
  }

  function resumeReminderPending() {
    return hub.tourResume?.shouldShowReminder?.(startupResumeState, resumeReminderDismissed) === true;
  }

  function clearResumeReminder({ dismissForSession = false } = {}) {
    if (dismissForSession) resumeReminderDismissed = true;
    resumeReminder?.remove();
    resumeReminder = null;
    trigger?.classList.remove("psqm-tour-resume-pulse");
  }

  function showResumeReminder({ focus = false } = {}) {
    if (!isEnabled() || !trigger?.isConnected || !resumeReminderPending()) return false;
    clearDiscoveryTimer();
    clearDirectCue();
    clearDirectGuardianGroupCue();
    clearReturnCue();
    close();

    if (!resumeReminder?.isConnected) {
      resumeReminder = node("section");
      resumeReminder.id = "psqm-tour-resume-reminder";
      resumeReminder.className = "psqm-tour-resume-reminder";
      resumeReminder.dataset.psqmUi = "tour-resume-reminder";
      resumeReminder.lang = hub.i18n?.language?.() === "vi" ? "vi" : "en";
      resumeReminder.setAttribute("role", "dialog");
      resumeReminder.setAttribute("aria-labelledby", "psqm-tour-resume-reminder-title");

      const title = node("h2", tr("tourResume.title"));
      title.id = "psqm-tour-resume-reminder-title";
      const body = node("p", tr("tourResume.body"));
      const actions = node("div");
      actions.className = "psqm-tour-resume-reminder__actions";

      const continueButton = node("button", tr("tourResume.continue"));
      continueButton.type = "button";
      continueButton.className = "psqm-tour-resume-reminder__continue";
      continueButton.addEventListener("click", async () => {
        continueButton.disabled = true;
        const resumed = await hub.messageOnboarding?.resumeTourModule?.(startupResumeState);
        if (resumed === true) {
          await hub.tourResume?.clear?.();
          startupResumeState = hub.tourResume?.normalize?.(null) || null;
          clearResumeReminder();
          handleContextChange();
          return;
        }
        continueButton.disabled = false;
      });

      const laterButton = node("button", tr("tourResume.later"));
      laterButton.type = "button";
      laterButton.className = "psqm-tour-resume-reminder__later";
      laterButton.addEventListener("click", () => clearResumeReminder({ dismissForSession: true }));

      actions.append(continueButton, laterButton);
      resumeReminder.append(title, body, actions);
      document.body.append(resumeReminder);
    }

    trigger.classList.add("psqm-tour-resume-pulse");
    positionResumeReminder();
    if (focus) resumeReminder.querySelector("button")?.focus?.({ preventScroll: true });
    return true;
  }

  async function rememberContext(key) {
    if (!key || helpSeenContexts[key]) return;
    helpSeenContexts = { ...helpSeenContexts, [key]: true };
    try { await chrome.storage.local.set({ [HELP_SEEN_STORAGE_KEY]: helpSeenContexts }); } catch (_) { /* local discovery state is non-critical */ }
  }

  function close(restoreFocus = false) {
    const hadFocus = panel?.contains(document.activeElement);
    panel?.remove(); panel = null;
    trigger?.setAttribute("aria-expanded", "false");
    hub.walkthrough?.setHelpVisible(false);
    if (restoreFocus && hadFocus) trigger?.focus();
  }

  function open({ focus = true } = {}) {
    if (!isEnabled()) return;
    clearDiscoveryTimer();
    clearTranslationCopilotPrompt();
    if (!trigger) handleContextChange();
    hub.walkthrough?.pause();
    close();
    hub.walkthrough?.setHelpVisible(true);
    const context = currentHelpContext();
    const topic = context.area === "newsfeed" && context.view === "preview"
      ? topics.preview
      : context.view === "direct-conversation"
        ? topics["direct-message"]
        : topics[context.area] || topics.unknown;
    const contextTasks = tasksForContext(context);
    contextKey = contextRuntimeKey(context);

    panel = node("section");
    panel.id = "psqm-help-panel"; panel.className = "psqm-help-popover";
    panel.lang = hub.i18n?.language?.() === "vi" ? "vi" : "en";
    panel.dataset.psqmUi = "help"; panel.setAttribute("aria-labelledby", "psqm-help-heading");
    const header = node("div"); header.className = "psqm-help-header";
    const title = node("h2", tr(topic.titleKey)); title.id = "psqm-help-heading";
    const dismiss = node("button", "×"); dismiss.type = "button"; dismiss.className = "psqm-help-close"; dismiss.setAttribute("aria-label", tr("help.close"));
    dismiss.addEventListener("click", () => close(true)); header.append(title, dismiss); panel.append(header);

    if (topic.languageReference) {
      const reference = node("section");
      reference.className = "psqm-help-section psqm-help-language-reference";
      reference.setAttribute("role", "note");
      reference.setAttribute("aria-labelledby", "psqm-help-language-reference-heading");
      const referenceTitle = node("h3", tr("help.languageReference.title"));
      referenceTitle.id = "psqm-help-language-reference-heading";
      reference.append(
        referenceTitle,
        node("p", tr("help.languageReference.requirement")),
        node("p", tr("help.languageReference.settings")),
        node("p", tr("help.languageReference.details"))
      );
      panel.append(reference);
    }

    // HELP-MENU-02: each context owns its explicit tasks. Never fall back to
    // every available guide because that can expose a Newsfeed task in Messages.
    const choices = topic.guidesHidden ? [] : contextTasks
      .filter(task => task.type === "walkthrough")
      .map(task => hub.guides[task.guideId])
      .filter(guide => guide?.available);
    if (choices.length) {
      const tasks = node("section"); tasks.className = "psqm-help-section psqm-help-common-tasks";
      tasks.append(node("h3", tr("help.commonTasks")));
      for (const guide of choices) {
        const action = node("button", tr(guide.titleKey)); action.type = "button"; action.className = "psqm-help-guide";
        action.addEventListener("click", async () => {
          close();
          if (!await hub.walkthrough.start(guide.id)) { open(); panel?.append(node("p", tr("help.enableGuides"))); }
        });
        tasks.append(action);
      }
      panel.append(tasks);
    }

    const pointersForContext = contextTasks.filter(task => task.type === "pointer" && pointerVisibleWhenHelpOpens(task));
    if (pointersForContext.length) {
      const pointers = node("section"); pointers.className = "psqm-help-section psqm-help-quick-pointers";
      pointers.append(node("h3", tr("help.quickPointers")));
      if (topic.introKey) pointers.append(node("p", tr(topic.introKey)));
      const list = node("ul");
      pointersForContext.forEach(task => {
        const item = node("li"), definition = hub.pointerDefinitions?.[task.pointerId];
        if (!definition) item.textContent = taskTitle(task);
        else {
          const action = node("button", taskTitle(task)); action.type = "button"; action.className = "psqm-help-pointer";
          action.addEventListener("click", async () => {
            close();
            if (!await hub.walkthrough.startPointer(task.pointerId)) { open(); panel?.append(node("p", tr("help.pointerUnavailable"))); }
          });
          item.append(action);
        }
        list.append(item);
      });
      pointers.append(list);
      panel.append(pointers);
    }

    const tipsForContext = contextTasks.filter(task => task.type === "tip");
    if (tipsForContext.length) {
      const advanced = node("details"); advanced.className = "psqm-help-more psqm-help-advanced-tips";
      advanced.append(node("summary", tr("help.advancedTips")));
      tipsForContext.forEach(task => {
        const definition = hub.tipDefinitions?.[task.tipId], item = node("div"); item.className = "psqm-help-tip";
        item.append(node("p", tr(definition?.descriptionKey || task.titleKey)));
        if (definition?.pointerId && hub.pointerDefinitions?.[definition.pointerId]) {
          const point = node("button", tr("help.showPointer")); point.type = "button"; point.className = "psqm-help-tip-action";
          point.addEventListener("click", async () => {
            close();
            if (!await hub.walkthrough.startPointer(definition.pointerId)) { open(); panel?.append(node("p", tr("help.pointerUnavailable"))); }
          });
          item.append(point);
        }
        if (definition?.youtubeUrl) {
          const link = node("a", tr("help.openResource")); link.href = definition.youtubeUrl; link.target = "_blank"; link.rel = "noopener noreferrer";
          item.append(link);
        }
        advanced.append(item);
      });
      panel.append(advanced);
    }

    if (!choices.length && !pointersForContext.length && !tipsForContext.length && topic.introKey) {
      const empty = node("p", tr(topic.introKey)); empty.className = "psqm-help-empty"; panel.append(empty);
    }

    panel.addEventListener("keydown", event => { if (event.key === "Escape") { event.preventDefault(); close(true); } });
    document.body.append(panel); trigger.setAttribute("aria-expanded", "true");
    positionHelpTrigger();
    if (focus) (panel.querySelector(".psqm-help-guide") || dismiss).focus({ preventScroll: true });
  }

  function scheduleFirstUse(context) {
    if (resumeReminderPending()) {
      clearDiscoveryTimer();
      showResumeReminder({ focus: false });
      return;
    }
    if (hub.messageOnboarding?.blocksContextHelpDiscovery?.(context)) {
      clearDiscoveryTimer();
      clearDirectCue();
      clearDirectGuardianGroupCue();
      return;
    }
    if (context?.view === "direct-conversation") {
      clearDiscoveryTimer();
      pulseDirectConversation(context);
      showDirectGuardianGroupCue(context);
      return;
    }
    const key = contextDiscoveryKey(context);
    if (!key || helpSeenContexts[key] || panel || discoveryTimer !== null || !trigger) return;
    // Mark immediately so frequent SPA scans cannot schedule the discovery repeatedly.
    void rememberContext(key);
    trigger.classList.add("psqm-help-trigger-pulse");
    const scheduledContext = contextRuntimeKey(context);
    discoveryTimer = root.setTimeout(() => {
      discoveryTimer = null;
      trigger?.classList.remove("psqm-help-trigger-pulse");
      if (!isEnabled() || contextKey !== scheduledContext || panel) return;
      const walkthroughState = hub.walkthrough?.snapshot?.();
      if (walkthroughState && ACTIVE_GUIDE_STATES.includes(walkthroughState.status)) return;
      if (hub.messageOnboarding?.quickPointerMode?.()) {
        // Returning users launch Quick Pointers explicitly from ? Help.
        // Context discovery may pulse the Help affordance, but must never
        // start or advance a pointer on the teacher's behalf.
        return;
      }
      open({ focus: false });
    }, DISCOVERY_DELAY);
  }

  function handleContextChange() {
    if (!isEnabled()) { clearDiscoveryTimer(); clearDirectGuardianGroupCue({ resetIdentity: true }); resetTranslationEntry(); clearReturnCue(); clearResumeReminder(); close(); trigger?.remove(); trigger = null; lastMessagesTriggerPlacementSignature = ""; return; }
    if (!trigger) {
      lastMessagesTriggerPlacementSignature = "";
      trigger = node("button", "?"); trigger.id = "psqm-help-trigger"; trigger.type = "button"; trigger.dataset.psqmUi = "help-trigger";
      trigger.lang = hub.i18n?.language?.() === "vi" ? "vi" : "en";
      trigger.setAttribute("aria-label", tr("help.launcherLabel")); trigger.setAttribute("title", tr("help.launcherLabel"));
      trigger.setAttribute("aria-controls", "psqm-help-panel"); trigger.setAttribute("aria-expanded", "false");
      trigger.addEventListener("click", () => {
        clearDiscoveryTimer();
        clearDirectCue();
        clearDirectGuardianGroupCue();
        clearReturnCue();
        if (resumeReminderPending()) {
          showResumeReminder({ focus: true });
          return;
        }
        const context = currentHelpContext(); void rememberContext(contextDiscoveryKey(context));
        panel ? close(true) : open();
      });
      document.body.append(trigger);
    }
    const context = currentHelpContext(), key = contextRuntimeKey(context);
    positionHelpTrigger(context);
    reconcileTranslationCue(context);
    if (context.view !== "direct-conversation") {
      clearDirectCue();
      clearDirectGuardianGroupCue({ resetIdentity: true });
      lastDirectIdentityKey = "";
    }
    if (contextKey && contextKey !== key) { clearDiscoveryTimer(); close(); }
    contextKey = key;
    if (resumeReminderPending()) showResumeReminder({ focus: false });
    else scheduleFirstUse(context);
  }

  async function initialize() {
    if (initialized) return; initialized = true;
    chrome.runtime.onMessage.addListener((message, sender, reply) => {
      if (sender.id !== chrome.runtime.id) return false;
      if (message?.type === "PSQM_START_GUIDE") {
        hub.walkthrough.start(message.guideId).then(ok => reply({ ok })).catch(() => reply({ ok: false })); return true;
      }
      if (message?.type === "PSQM_REPLAY_WALKTHROUGH") {
        Promise.resolve(hub.messageOnboarding?.replayWalkthrough?.())
          .then(ok => reply({ ok: ok === true }))
          .catch(() => reply({ ok: false }));
        return true;
      }
      if (message?.type === "PSQM_OPEN_HELP") { open(); reply({ ok: isEnabled() }); return false; }
      return false;
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes.contextualHelpEnabled) {
        enabled = changes.contextualHelpEnabled.newValue !== false;
        handleContextChange(); hub.walkthrough?.invalidateView();
      }
      if (changes[HELP_SEEN_STORAGE_KEY]) helpSeenContexts = changes[HELP_SEEN_STORAGE_KEY].newValue || {};
      if (changes[hub.tourResume?.STORAGE_KEY]) {
        startupResumeState = resumeStateFromStorageChange(changes, startupResumeState, hub.tourResume);
        resumeReminderDismissed = false;
        if (startupResumeState?.pending !== true) clearResumeReminder();
        handleContextChange();
      }
    });
    await hub.i18n?.initialize?.();
    startupResumeState = await hub.tourResume?.read?.() || null;
    resumeReminderDismissed = false;
    try {
      const settings = await chrome.storage.local.get({ contextualHelpEnabled: true, [HELP_SEEN_STORAGE_KEY]: {} });
      enabled = settings.contextualHelpEnabled !== false;
      helpSeenContexts = settings[HELP_SEEN_STORAGE_KEY] || {};
    } catch { enabled = false; }
    root.addEventListener("resize", scheduleHelpPosition);
    document.addEventListener("scroll", scheduleHelpPosition, true);
    hub.i18n?.onChange?.(() => {
      if (trigger) {
        trigger.lang = hub.i18n?.language?.() === "vi" ? "vi" : "en";
        syncTriggerLabel();
      }
      if (panel) { close(); open({ focus: false }); }
      if (resumeReminder?.isConnected) {
        resumeReminder.remove();
        resumeReminder = null;
        showResumeReminder({ focus: false });
      }
      if (translationCopilotPrompt?.isConnected && translationCueTarget?.isConnected) {
        translationCopilotPrompt.remove();
        translationCopilotPrompt = null;
        showTranslationCopilotPrompt(currentHelpContext(), translationCueTarget);
      }
    });
    handleContextChange();
  }

  hub.help = Object.freeze({ initialize, handleContextChange, open, close, isEnabled, showReturnCue });
})(globalThis);
