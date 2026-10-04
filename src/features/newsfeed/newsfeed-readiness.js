(function (root) {
  "use strict";

  const hub = root.PSQM ??= {};
  if (hub.newsfeedReadiness) return;

  const AUTO_GUIDE_KEY = "newsfeedAutoGuideSeen";
  const GUIDE_ID = "newsfeed-create";
  const DEFAULT_DELAY = 1500;
  const ACTIVE_GUIDE_STATES = new Set([
    "RUNNING",
    "WAITING_FOR_TARGET",
    "WAITING_FOR_ACTION",
    "VERIFYING",
    "STEP_COMPLETE",
    "PAUSED",
    "BLOCKED"
  ]);

  const MISSING = Object.freeze([
    Object.freeze({
      flag: "titleFilled",
      target: "newsfeed.titleInput",
      textKey: "newsfeedReadiness.titleMissing"
    }),
    Object.freeze({
      flag: "bodyFilled",
      target: "newsfeed.bodyInput",
      textKey: "newsfeedReadiness.bodyMissing"
    }),
    Object.freeze({
      flag: "audienceSelected",
      target: "newsfeed.audienceControl",
      textKey: "newsfeedReadiness.audienceMissing"
    }),
    Object.freeze({
      flag: "recipientCategorySelected",
      target: "newsfeed.recipientCategoriesGroup",
      textKey: "newsfeedReadiness.categoriesMissing"
    })
  ]);

  function snapshotKey(snapshot) {
    return [
      snapshot?.titleFilled ? "1" : "0",
      snapshot?.bodyFilled ? "1" : "0",
      snapshot?.audienceSelected ? "1" : "0",
      snapshot?.recipientCategorySelected ? "1" : "0"
    ].join("");
  }

  function firstMissing(snapshot) {
    return MISSING.find(item => !snapshot?.[item.flag]) || null;
  }

  function allReady(snapshot) {
    return Boolean(snapshot)
      && snapshot.titleFilled
      && snapshot.bodyFilled
      && snapshot.audienceSelected
      && snapshot.recipientCategorySelected;
  }

  function readSnapshot(ui) {
    const keys = {
      titleFilled: "newsfeed.titleEntered",
      bodyFilled: "newsfeed.bodyEntered",
      audienceSelected: "newsfeed.audienceGroupsSelected",
      recipientCategorySelected: "newsfeed.recipientCategoriesSelected"
    };
    const result = {};
    let verified = true;

    for (const [name, key] of Object.entries(keys)) {
      const condition = ui?.condition?.(key);
      if (!condition?.verified) verified = false;
      result[name] = Boolean(condition?.verified && condition.met);
    }

    return { ...result, verified };
  }

  function createController({
    doc,
    view,
    ui,
    walkthrough,
    i18n,
    storage,
    delay = DEFAULT_DELAY,
    setTimer = (fn, ms) => view.setTimeout(fn, ms),
    clearTimer = id => view.clearTimeout(id)
  }) {
    let mounted = false;
    let composer = null;
    let composerSessionOpen = false;
    let composerCloseTimer = null;
    let reminderTimer = null;
    let reminder = null;
    let reminderMissing = null;
    let highlight = null;
    let highlightTimer = null;
    let positionRaf = null;
    let interacted = false;
    let autoSeenLoaded = false;
    let autoSeen = false;
    let autoStartInFlight = false;
    let autoAttemptedComposer = null;
    let suppressReadinessForComposer = false;
    let postHealthReminderShown = false;
    let lastReadinessBlocked = false;
    const dismissed = new Set();

    const tr = (key, vars = {}, fallback = "") =>
      i18n?.t?.(key, vars, fallback) || fallback || key;

    function clearReminderTimer() {
      if (reminderTimer !== null) clearTimer(reminderTimer);
      reminderTimer = null;
    }

    function clearComposerCloseTimer() {
      if (composerCloseTimer !== null) clearTimer(composerCloseTimer);
      composerCloseTimer = null;
    }

    function clearHighlight() {
      if (highlightTimer !== null) clearTimer(highlightTimer);
      highlightTimer = null;
      highlight?.remove();
      highlight = null;
    }

    function removeReminder() {
      reminder?.remove();
      reminder = null;
      reminderMissing = null;
    }

    function cancelPosition() {
      if (positionRaf === null) return;
      (view.cancelAnimationFrame || view.clearTimeout).call(view, positionRaf);
      positionRaf = null;
    }

    function guideActive() {
      const state = walkthrough?.snapshot?.();
      return Boolean(state && ACTIVE_GUIDE_STATES.has(state.status));
    }

    function guideBlocksReadiness() {
      const state = walkthrough?.snapshot?.();
      if (!state || !ACTIVE_GUIDE_STATES.has(state.status)) return false;
      return !(state.status === "PAUSED" && state.reason === "deferred");
    }

    function syncPostHealthFromGuide() {
      if (postHealthReminderShown) return;
      const state = walkthrough?.snapshot?.();
      if (state?.guideId !== GUIDE_ID) return;
      const steps = state.guide?.steps;
      if (!Array.isArray(steps)) return;
      const healthIndex = steps.findIndex(item => item?.id === "healthy-post");
      if (healthIndex < 0) return;
      const currentIndex = Number.isInteger(state.stepIndex)
        ? state.stepIndex
        : steps.findIndex(item => item?.id === state.stepId);
      if (currentIndex > healthIndex || (currentIndex === healthIndex && state.status === "STEP_COMPLETE")) {
        postHealthReminderShown = true;
      }
    }

    function releaseInactiveGuideSuppression() {
      if (!guideBlocksReadiness() && !autoStartInFlight) suppressReadinessForComposer = false;
    }

    function composerResult() {
      const result = ui?.newsfeed?.composer?.();
      return result?.verified && result.element?.isConnected ? result : null;
    }

    function targetFor(missing) {
      if (!missing) return null;
      const result = ui?.target?.(missing.target);
      return result?.verified && result.element?.isConnected ? result.element : null;
    }

    function targetRect(missing) {
      const target = targetFor(missing);
      return target ? target.getBoundingClientRect() : null;
    }

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    function positionReminder() {
      positionRaf = null;
      if (!reminder?.isConnected) return;

      const width = doc.documentElement?.clientWidth || view.innerWidth || 0;
      const height = doc.documentElement?.clientHeight || view.innerHeight || 0;
      const margin = width <= 480 ? 10 : 16;
      const gap = 10;
      const card = reminder.getBoundingClientRect();
      const rect = targetRect(reminderMissing);

      if (!rect) {
        reminder.style.left = `${margin}px`;
        reminder.style.top = `${Math.max(margin, height - card.height - 70)}px`;
        reminder.style.right = "auto";
        reminder.style.bottom = "auto";
        return;
      }

      const candidates = [
        { left: rect.right + gap, top: rect.top + (rect.height - card.height) / 2 },
        { left: rect.left - card.width - gap, top: rect.top + (rect.height - card.height) / 2 },
        { left: rect.left + (rect.width - card.width) / 2, top: rect.bottom + gap },
        { left: rect.left + (rect.width - card.width) / 2, top: rect.top - card.height - gap }
      ];
      const fits = point =>
        point.left >= margin
        && point.top >= margin
        && point.left + card.width <= width - margin
        && point.top + card.height <= height - margin;
      const direct = candidates.find(fits);

      let chosen = direct;
      if (!chosen) {
        const overlap = point => {
          const left = Math.max(point.left, rect.left);
          const top = Math.max(point.top, rect.top);
          const right = Math.min(point.left + card.width, rect.right);
          const bottom = Math.min(point.top + card.height, rect.bottom);
          return Math.max(0, right - left) * Math.max(0, bottom - top);
        };
        const clamped = candidates.map((candidate, index) => {
          const point = {
            left: clamp(candidate.left, margin, Math.max(margin, width - card.width - margin)),
            top: clamp(candidate.top, margin, Math.max(margin, height - card.height - margin))
          };
          return { ...point, overlap: overlap(point), index };
        });
        clamped.sort((a, b) => a.overlap - b.overlap || a.index - b.index);
        chosen = clamped[0];
      }

      reminder.style.left = `${chosen.left}px`;
      reminder.style.top = `${chosen.top}px`;
      reminder.style.right = "auto";
      reminder.style.bottom = "auto";
    }

    function schedulePosition() {
      if (!reminder?.isConnected || positionRaf !== null) return;
      const raf = view.requestAnimationFrame || (callback => view.setTimeout(callback, 16));
      positionRaf = raf(() => positionReminder());
    }

    function showTarget(missing) {
      const target = targetFor(missing);
      if (!target) return;

      target.scrollIntoView?.({ block: "center", inline: "nearest", behavior: "auto" });
      clearHighlight();

      const draw = () => {
        if (!target.isConnected) return;
        const rect = target.getBoundingClientRect();
        const box = doc.createElement("div");
        box.className = "psqm-newsfeed-readiness-highlight psqm-newsfeed-readiness-pulse";
        box.dataset.psqmUi = "newsfeed-readiness-highlight";
        box.setAttribute("aria-hidden", "true");
        box.style.left = `${Math.max(0, rect.left - 4)}px`;
        box.style.top = `${Math.max(0, rect.top - 4)}px`;
        box.style.width = `${rect.width + 8}px`;
        box.style.height = `${rect.height + 8}px`;
        doc.body.append(box);
        highlight = box;
        highlightTimer = setTimer(() => clearHighlight(), 1650);
      };

      const raf = view.requestAnimationFrame || (callback => view.setTimeout(callback, 16));
      raf(() => raf(draw));
    }

    function buildReminder(missing, key) {
      removeReminder();
      const card = doc.createElement("section");
      card.className = "psqm-newsfeed-readiness";
      card.dataset.psqmUi = "newsfeed-readiness";
      card.lang = i18n?.language?.() === "vi" ? "vi" : "en";

      const heading = doc.createElement("strong");
      heading.className = "psqm-newsfeed-readiness__heading";
      heading.textContent = tr("newsfeedReadiness.heading");

      const message = doc.createElement("p");
      message.className = "psqm-newsfeed-readiness__message";
      message.setAttribute("role", "status");
      message.setAttribute("aria-live", "polite");
      message.textContent = tr(missing.textKey);

      const actions = doc.createElement("div");
      actions.className = "psqm-newsfeed-readiness__actions";

      const show = doc.createElement("button");
      show.type = "button";
      show.className = "psqm-newsfeed-readiness__show";
      show.textContent = tr("common.showMe");
      show.addEventListener("click", () => {
        dismissed.add(key);
        showTarget(missing);
        removeReminder();
      });

      const close = doc.createElement("button");
      close.type = "button";
      close.className = "psqm-newsfeed-readiness__close";
      close.textContent = tr("common.close");
      close.addEventListener("click", () => {
        dismissed.add(key);
        removeReminder();
      });

      actions.append(show, close);
      card.append(heading, message, actions);
      doc.body.append(card);
      reminder = card;
      reminderMissing = missing;
      positionReminder();
    }

    function buildPostHealthReminder() {
      removeReminder();
      const card = doc.createElement("section");
      card.className = "psqm-newsfeed-readiness psqm-newsfeed-post-health";
      card.dataset.psqmUi = "newsfeed-post-health";
      card.lang = i18n?.language?.() === "vi" ? "vi" : "en";

      const eyebrow = doc.createElement("div");
      eyebrow.className = "psqm-newsfeed-post-health__eyebrow";
      eyebrow.textContent = tr("newsfeedReadiness.postHealthEyebrow");

      const heading = doc.createElement("strong");
      heading.className = "psqm-newsfeed-post-health__title";
      heading.textContent = tr("newsfeedReadiness.postHealthTitle");

      const lead = doc.createElement("p");
      lead.className = "psqm-newsfeed-post-health__lead";
      lead.textContent = tr("newsfeedReadiness.postHealthLead");

      const message = doc.createElement("p");
      message.className = "psqm-newsfeed-readiness__message psqm-newsfeed-post-health__body";
      message.setAttribute("role", "status");
      message.setAttribute("aria-live", "polite");
      message.textContent = tr("newsfeedReadiness.postHealthBody");

      const closing = doc.createElement("strong");
      closing.className = "psqm-newsfeed-post-health__closing";
      closing.textContent = tr("newsfeedReadiness.postHealthClosing");

      const actions = doc.createElement("div");
      actions.className = "psqm-newsfeed-readiness__actions";

      const close = doc.createElement("button");
      close.type = "button";
      close.className = "psqm-newsfeed-readiness__close";
      close.textContent = tr("newsfeedReadiness.postHealthDismiss");
      close.addEventListener("click", () => removeReminder());

      actions.append(close);
      card.append(eyebrow, heading, lead, message, closing, actions);
      doc.body.append(card);
      reminder = card;
      reminderMissing = null;
      positionReminder();
    }

    function pickerOpen() {
      const control = ui?.target?.("newsfeed.audienceControl");
      return control?.verified
        && control.element
        && String(control.element.getAttribute?.("aria-expanded") || "").toLowerCase() === "true";
    }

    function userEditingText() {
      const active = doc.activeElement;
      if (!active || !composer?.contains?.(active)) return false;
      if (active.closest?.("[data-psqm-ui]")) return true;
      return active.matches?.("input[type='text'], textarea, [contenteditable='true']") === true;
    }

    function evaluate() {
      reminderTimer = null;
      syncPostHealthFromGuide();
      releaseInactiveGuideSuppression();
      const guidanceActive = guideBlocksReadiness();
      if (!composer?.isConnected || !autoSeenLoaded || suppressReadinessForComposer || guidanceActive) {
        removeReminder();
        return;
      }

      if (!postHealthReminderShown) {
        postHealthReminderShown = true;
        if (!reminder?.isConnected) buildPostHealthReminder();
        return;
      }

      if (!interacted || pickerOpen() || userEditingText()) return;

      const snapshot = readSnapshot(ui);
      if (!snapshot.verified) return;
      if (allReady(snapshot)) {
        removeReminder();
        return;
      }

      const key = snapshotKey(snapshot);
      if (dismissed.has(key)) return;
      const missing = firstMissing(snapshot);
      if (!missing) return;

      if (reminder?.isConnected && reminderMissing?.flag === missing.flag) {
        positionReminder();
        return;
      }
      buildReminder(missing, key);
    }

    function scheduleEvaluation({ immediate = false } = {}) {
      clearReminderTimer();
      syncPostHealthFromGuide();
      releaseInactiveGuideSuppression();
      const guidanceActive = guideBlocksReadiness();
      if (!composer?.isConnected || !autoSeenLoaded || suppressReadinessForComposer || guidanceActive) {
        removeReminder();
        return;
      }
      reminderTimer = setTimer(evaluate, immediate ? 0 : delay);
    }

    function isExtensionUi(target) {
      return Boolean(target?.closest?.("[data-psqm-ui]"));
    }

    function meaningfulEvent(event) {
      if (!event?.isTrusted || isExtensionUi(event.target)) return;
      interacted = true;
      scheduleEvaluation();
    }

    function previewIntent(event) {
      if (!event?.isTrusted || isExtensionUi(event.target)) return;
      const button = event.target?.closest?.("#button-post-preview-btn");
      if (!button || button.disabled) return;
      interacted = true;
      scheduleEvaluation({ immediate: true });
    }

    function resetComposerSessionState() {
      clearReminderTimer();
      cancelPosition();
      removeReminder();
      clearHighlight();
      dismissed.clear();
      interacted = false;
      suppressReadinessForComposer = false;
      postHealthReminderShown = false;
    }

    function bindComposer(next) {
      if (composer === next) return;
      clearReminderTimer();

      if (composer) {
        composer.removeEventListener("input", meaningfulEvent);
        composer.removeEventListener("change", meaningfulEvent);
        composer.removeEventListener("focusout", meaningfulEvent);
        composer.removeEventListener("click", previewIntent, true);
      }

      composer = next;

      if (composer) {
        composer.addEventListener("input", meaningfulEvent);
        composer.addEventListener("change", meaningfulEvent);
        composer.addEventListener("focusout", meaningfulEvent);
        composer.addEventListener("click", previewIntent, true);
        schedulePosition();
        return;
      }

      cancelPosition();
      removeReminder();
      clearHighlight();
    }

    function scheduleComposerCloseConfirmation() {
      if (!composerSessionOpen || composerCloseTimer !== null) return;
      composerCloseTimer = setTimer(() => {
        composerCloseTimer = null;
        if (composerResult()) {
          reconcile();
          return;
        }
        composerSessionOpen = false;
        resetComposerSessionState();
      }, 0);
    }

    async function loadAutoSeen() {
      if (autoSeenLoaded) return;
      try {
        const settings = await storage?.get?.({ [AUTO_GUIDE_KEY]: false });
        autoSeen = settings?.[AUTO_GUIDE_KEY] === true;
      } catch (_) {
        // If durable state cannot be read, fail closed: Help remains available,
        // but do not risk auto-starting the guide on every SPA visit.
        autoSeen = true;
      }
      autoSeenLoaded = true;
    }

    async function markAutoGuideSeen() {
      if (!autoSeenLoaded) await loadAutoSeen();
      if (autoSeen) return true;
      autoSeen = true;
      try { await storage?.set?.({ [AUTO_GUIDE_KEY]: true }); } catch (_) { /* in-memory latch still prevents repeats */ }
      return true;
    }

    async function maybeStartFirstGuide() {
      if (hub.messageOnboarding?.blocksNewsfeedAutoGuide?.()) return;
      if (!autoSeenLoaded || autoSeen || autoStartInFlight || !composer?.isConnected || guideActive()) return;
      if (autoAttemptedComposer === composer) return;

      const attemptedComposer = composer;
      autoAttemptedComposer = attemptedComposer;
      suppressReadinessForComposer = true;
      autoStartInFlight = true;
      try {
        const started = await walkthrough?.start?.(GUIDE_ID);
        if (!started) {
          if (composer === attemptedComposer) {
            suppressReadinessForComposer = false;
            scheduleEvaluation({ immediate: true });
          }
          return;
        }
        await markAutoGuideSeen();
        clearReminderTimer();
        removeReminder();
      } finally {
        autoStartInFlight = false;
      }
    }

    function reconcile() {
      const result = composerResult();
      const nextComposer = result?.element || null;
      let sessionOpened = false;

      if (nextComposer) {
        clearComposerCloseTimer();
        if (!composerSessionOpen) {
          composerSessionOpen = true;
          resetComposerSessionState();
          sessionOpened = true;
        }
        bindComposer(nextComposer);
      } else {
        bindComposer(null);
        scheduleComposerCloseConfirmation();
      }

      syncPostHealthFromGuide();
      releaseInactiveGuideSuppression();
      const readinessBlocked = guideBlocksReadiness();
      const becameAvailable = lastReadinessBlocked && !readinessBlocked;
      lastReadinessBlocked = readinessBlocked;
      if (!composer) return;
      if (readinessBlocked) {
        clearReminderTimer();
        removeReminder();
      }
      void maybeStartFirstGuide();
      if (sessionOpened || becameAvailable) scheduleEvaluation({ immediate: true });
    }

    async function mount() {
      if (mounted) return;
      mounted = true;
      view.addEventListener?.("resize", schedulePosition);
      doc.addEventListener?.("scroll", schedulePosition, true);
      i18n?.onChange?.(() => {
        if (!reminder?.isConnected) return;
        if (!reminderMissing) {
          buildPostHealthReminder();
          return;
        }
        const current = readSnapshot(ui);
        const key = snapshotKey(current);
        buildReminder(reminderMissing, key);
      });
      await loadAutoSeen();
      reconcile();
    }

    function unmount() {
      if (!mounted) return;
      mounted = false;
      clearComposerCloseTimer();
      bindComposer(null);
      composerSessionOpen = false;
      resetComposerSessionState();
      view.removeEventListener?.("resize", schedulePosition);
      doc.removeEventListener?.("scroll", schedulePosition, true);
      cancelPosition();
      clearHighlight();
    }

    function snapshot() {
      return Object.freeze({
        mounted,
        composerActive: Boolean(composer?.isConnected),
        interacted,
        autoSeenLoaded,
        autoSeen,
        autoStartInFlight,
        suppressReadinessForComposer,
        reminderVisible: Boolean(reminder?.isConnected),
        dismissedCount: dismissed.size
      });
    }

    return Object.freeze({
      mount,
      unmount,
      reconcile,
      snapshot,
      markAutoGuideSeen,
      evaluateNow: evaluate
    });
  }

  if (typeof document === "object") {
    hub.newsfeedReadiness = createController({
      doc: document,
      view: root,
      ui: hub.ui,
      walkthrough: hub.walkthrough,
      i18n: hub.i18n,
      storage: root.chrome?.storage?.local
    });
  }

  if (typeof module === "object" && module.exports) {
    module.exports = {
      AUTO_GUIDE_KEY,
      GUIDE_ID,
      MISSING,
      snapshotKey,
      firstMissing,
      allReady,
      readSnapshot,
      createController
    };
  }
})(globalThis);
