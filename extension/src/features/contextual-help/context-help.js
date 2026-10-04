(function (root) {
  "use strict";
  const hub = root.PSQM ??= {};
  if (hub.help || typeof document !== "object") return;

  const HELP_SEEN_STORAGE_KEY = "helpSeenContexts";
  const DISCOVERY_DELAY = 1500;
  const RETURN_CUE_MS = 6000;
  const ACTIVE_GUIDE_STATES = ["RUNNING", "WAITING_FOR_TARGET", "WAITING_FOR_ACTION", "VERIFYING", "STEP_COMPLETE", "PAUSED", "BLOCKED"];
  const topics = Object.freeze({
    newsfeed: { titleKey: "help.newsfeed.title", introKey: "help.newsfeed.intro", languageReference: true,
      noteKeys: ["help.newsfeed.note1", "help.newsfeed.note2"], moreKeys: ["help.newsfeed.more1"], guide: "newsfeed-create" },
    preview: { titleKey: "help.preview.title", introKey: "help.preview.intro", languageReference: true,
      noteKeys: ["help.preview.note1", "help.preview.note2"], guidesHidden: true },
    messages: { titleKey: "help.messages.title", introKey: "help.messages.intro", languageReference: true,
      noteKeys: ["help.messages.note1", "help.messages.note2"], moreKeys: ["help.messages.more2"] },
    directory: { titleKey: "help.directory.title", introKey: "help.directory.intro", noteKeys: ["help.directory.note1"] },
    "group-information": { titleKey: "help.groupInformation.title", introKey: "help.groupInformation.intro",
      noteKeys: [], moreKeys: ["help.groupInformation.more1"] },
    "group-chat": { titleKey: "help.groupChat.title", introKey: "help.groupChat.intro", languageReference: true,
      noteKeys: ["help.groupChat.note1"] },
    unknown: { titleKey: "help.unknown.title", introKey: "help.unknown.intro", noteKeys: [] }
  });

  let trigger = null, panel = null, enabled = true, initialized = false, contextKey = "";
  let helpSeenContexts = {}, discoveryTimer = null, returnCueTimer = null, positionRaf = null, triggerPinnedToMessages = false;
  const isEnabled = () => enabled && hub.features.contextualHelp !== false;
  const tr = (key, vars = {}) => hub.i18n?.t?.(key, vars) || key;
  const node = (tag, text = "") => { const el = document.createElement(tag); el.textContent = text; return el; };
  const contextDiscoveryKey = context => context?.area && context.area !== "unknown" ? context.area : null;
  const tasksForContext = context => {
    const exact = `${context?.area || "unknown"}:${context?.view || "unknown"}`;
    return (hub.helpTasks || []).filter(task => task.contexts.includes(exact) || task.contexts.includes(context?.area));
  };
  const pointerVisibleWhenHelpOpens = task => {
    // TASK7A: only Create Group Chat needs live availability. Keep the check
    // lazy and one-shot: opening ? Help reads the existing strict adapter
    // target once; no observer, polling, timer, or background scan is added.
    if (task?.pointerId !== "messages.create-group") return true;
    const definition = hub.pointerDefinitions?.[task.pointerId];
    if (!definition?.target || typeof hub.ui?.target !== "function") return false;
    const located = hub.ui.target(definition.target);
    if (!located?.verified || !located.element?.isConnected) return false;
    if (typeof hub.ui?.targetView !== "function") return false;
    const view = hub.ui.targetView(located.element);
    return view?.inView === true && view.covered !== true;
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
    panel.style.left = `${left}px`; panel.style.top = `${top}px`;
    panel.style.right = "auto"; panel.style.bottom = "auto";
  }

  function positionHelpTrigger(context = null) {
    if (!trigger?.isConnected) return;
    const margin = 16, size = Math.max(40, trigger.offsetWidth || 40, trigger.offsetHeight || 40), gap = 12;
    const width = root.innerWidth || document.documentElement.clientWidth;
    const height = root.innerHeight || document.documentElement.clientHeight;
    const activeContext = context || hub.ui.detectContext();

    // HELP-CHAT-POS-01: Messages uses one stable top-right anchor instead of
    // repeatedly scanning all native interactive controls to move the ? around.
    if (activeContext?.area === "messages") {
      triggerPinnedToMessages = true;
      const messagesRoot = document.getElementById("header-messenger-inbox-layout");
      const boundary = messagesRoot?.isConnected ? messagesRoot.getBoundingClientRect() : null;
      const rightEdge = boundary && boundary.width > 0 ? Math.min(width, boundary.right) : width;
      const topEdge = boundary && boundary.height > 0 ? Math.max(0, boundary.top) : 0;
      const left = Math.min(
        Math.max(margin, rightEdge - margin - size),
        Math.max(margin, width - margin - size)
      );
      const top = Math.min(
        Math.max(margin, topEdge + margin),
        Math.max(margin, height - margin - size)
      );
      trigger.style.left = `${left}px`; trigger.style.top = `${top}px`;
      trigger.style.right = "auto"; trigger.style.bottom = "auto";
      positionHelpPopover();
      return;
    }

    triggerPinnedToMessages = false;
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
  }

  function scheduleHelpPosition(event) {
    // A fixed Messages trigger does not need to move during nested scrolls.
    if (event?.type === "scroll" && triggerPinnedToMessages) return;
    if (positionRaf !== null) return;
    const raf = root.requestAnimationFrame || (callback => root.setTimeout(callback, 16));
    positionRaf = raf(() => { positionRaf = null; positionHelpTrigger(); });
  }

  function clearDiscoveryTimer() {
    if (discoveryTimer !== null) root.clearTimeout(discoveryTimer);
    discoveryTimer = null;
    trigger?.classList.remove("psqm-help-trigger-pulse");
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
    if (!trigger) handleContextChange();
    hub.walkthrough?.pause();
    close();
    hub.walkthrough?.setHelpVisible(true);
    const context = hub.ui.detectContext();
    const topic = context.area === "newsfeed" && context.view === "preview" ? topics.preview : topics[context.area] || topics.unknown;
    const contextTasks = tasksForContext(context);
    contextKey = `${context.area}:${context.view}`;

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
        if (!definition) item.textContent = tr(task.titleKey);
        else {
          const action = node("button", tr(task.titleKey)); action.type = "button"; action.className = "psqm-help-pointer";
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
    positionHelpTrigger(); positionHelpPopover();
    if (focus) (panel.querySelector(".psqm-help-guide") || dismiss).focus({ preventScroll: true });
  }

  function scheduleFirstUse(context) {
    if (hub.messageOnboarding?.blocksContextHelpDiscovery?.(context)) {
      clearDiscoveryTimer();
      return;
    }
    const key = contextDiscoveryKey(context);
    if (!key || helpSeenContexts[key] || panel || discoveryTimer !== null || !trigger) return;
    // Mark immediately so frequent SPA scans cannot schedule the discovery repeatedly.
    void rememberContext(key);
    trigger.classList.add("psqm-help-trigger-pulse");
    const scheduledContext = `${context.area}:${context.view}`;
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
    if (!isEnabled()) { clearDiscoveryTimer(); clearReturnCue(); close(); trigger?.remove(); trigger = null; return; }
    if (!trigger) {
      trigger = node("button", "?"); trigger.id = "psqm-help-trigger"; trigger.type = "button"; trigger.dataset.psqmUi = "help-trigger";
      trigger.lang = hub.i18n?.language?.() === "vi" ? "vi" : "en";
      trigger.setAttribute("aria-label", tr("help.launcherLabel")); trigger.setAttribute("title", tr("help.launcherLabel"));
      trigger.setAttribute("aria-controls", "psqm-help-panel"); trigger.setAttribute("aria-expanded", "false");
      trigger.addEventListener("click", () => {
        clearDiscoveryTimer();
        clearReturnCue();
        const context = hub.ui.detectContext(); void rememberContext(contextDiscoveryKey(context));
        panel ? close(true) : open();
      });
      document.body.append(trigger);
    }
    const context = hub.ui.detectContext(), key = `${context.area}:${context.view}`;
    positionHelpTrigger(context);
    if (contextKey && contextKey !== key) { clearDiscoveryTimer(); close(); }
    contextKey = key;
    scheduleFirstUse(context);
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
    });
    await hub.i18n?.initialize?.();
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
    });
    handleContextChange();
  }

  hub.help = Object.freeze({ initialize, handleContextChange, open, close, isEnabled, showReturnCue });
})(globalThis);
