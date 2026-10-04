(function (root) {
  "use strict";
  const hub = root.PSQM ??= {};
  if (hub.walkthrough) return;
  const TERMINAL = new Set(["IDLE", "CANCELLED", "COMPLETED"]);

  function getScrollableParent(element, doc) {
    let current = element?.parentElement;
    while (current && current !== doc.body) {
      const style = doc.defaultView?.getComputedStyle?.(current);
      const overflowY = style?.overflowY;
      if (current.scrollHeight > current.clientHeight && ["auto", "scroll", "overlay"].includes(overflowY)) return current;
      current = current.parentElement;
    }
    return doc.scrollingElement || doc.documentElement;
  }

  function getScrollPosition(container, doc) {
    if (container === doc.scrollingElement || container === doc.documentElement || container === doc.body) {
      return doc.defaultView?.scrollY || doc.documentElement?.scrollTop || 0;
    }
    return container?.scrollTop || 0;
  }

  function waitForScrollToSettle(container, doc, quietTime = 160, maxWait = 1400) {
    const view = doc.defaultView;
    if (!view?.requestAnimationFrame) return Promise.resolve();
    return new Promise(resolve => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        if (hardTimer !== null) view.clearTimeout?.(hardTimer);
        resolve();
      };
      const hardTimer = view.setTimeout?.(finish, maxWait) ?? null;
      let previous = getScrollPosition(container, doc), stableSince = view.performance?.now?.() ?? Date.now();
      const startedAt = stableSince;
      function check() {
        if (settled) return;
        const now = view.performance?.now?.() ?? Date.now();
        const current = getScrollPosition(container, doc);
        if (Math.abs(current - previous) < 1) {
          if (now - stableSince >= quietTime || now - startedAt >= maxWait) { finish(); return; }
        } else {
          previous = current; stableSince = now;
        }
        view.requestAnimationFrame(check);
      }
      view.requestAnimationFrame(check);
    });
  }

  async function revealTargetIntoView(target, doc) {
    if (!target?.isConnected) return false;
    const container = getScrollableParent(target, doc);
    if (container === doc.scrollingElement || container === doc.documentElement || container === doc.body) {
      target.scrollIntoView?.({ behavior: "smooth", block: "center", inline: "nearest" });
    } else {
      const targetRect = target.getBoundingClientRect(), containerRect = container.getBoundingClientRect();
      const nextTop = container.scrollTop + targetRect.top - containerRect.top - container.clientHeight / 2 + targetRect.height / 2;
      if (typeof container.scrollTo === "function") container.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
      else target.scrollIntoView?.({ behavior: "smooth", block: "center", inline: "nearest" });
    }
    await waitForScrollToSettle(container, doc);
    return true;
  }

  function computeBubblePosition(targetRect, bubbleRect, viewport, gap = 10, margin = 10, options = {}) {
    const width = bubbleRect.width, height = bubbleRect.height;
    const preferLeft = options?.preferLeft === true;
    const centeredLeft = targetRect.left + (targetRect.width - width) / 2;
    const below = { left: centeredLeft, top: targetRect.bottom + gap };
    const above = { left: centeredLeft, top: targetRect.top - height - gap };
    const right = { left: targetRect.right + gap, top: targetRect.top + (targetRect.height - height) / 2 };
    const left = preferLeft
      ? { left: margin, top: targetRect.top + (targetRect.height - height) / 2 }
      : { left: targetRect.left - width - gap, top: targetRect.top + (targetRect.height - height) / 2 };
    const bySide = { left, below, above, right };
    const defaults = preferLeft ? ["left", "below", "above", "right"] : ["below", "above", "right", "left"];
    const requested = Array.isArray(options?.preferredSides)
      ? options.preferredSides.filter(side => Object.hasOwn(bySide, side))
      : [];
    const sides = [...new Set([...requested, ...defaults])];
    const candidates = sides.map(side => bySide[side]);
    const fits = point => point.left >= margin && point.top >= margin
      && point.left + width <= viewport.width - margin && point.top + height <= viewport.height - margin;
    const clamp = point => ({
      left: Math.min(Math.max(margin, point.left), Math.max(margin, viewport.width - width - margin)),
      top: Math.min(Math.max(margin, point.top), Math.max(margin, viewport.height - height - margin))
    });
    const overlapArea = point => {
      const overlapLeft = Math.max(point.left, targetRect.left);
      const overlapTop = Math.max(point.top, targetRect.top);
      const overlapRight = Math.min(point.left + width, targetRect.right);
      const overlapBottom = Math.min(point.top + height, targetRect.bottom);
      return Math.max(0, overlapRight - overlapLeft) * Math.max(0, overlapBottom - overlapTop);
    };

    // A Newsfeed left-rail candidate is only accepted when it actually stays
    // clear of the live target. Narrow screens therefore fall back naturally.
    const direct = candidates.find(point => fits(point) && overlapArea(point) === 0);
    if (direct) return direct;

    // If no ideal side fits, clamping the first candidate can push the bubble
    // back over the native target. Compare all four clamped sides and prefer
    // the one that obscures the least target area.
    const clamped = candidates.map((candidate, index) => {
      const point = clamp(candidate);
      const displacement = Math.abs(point.left - candidate.left) + Math.abs(point.top - candidate.top);
      return { ...point, overlap: overlapArea(point), displacement, index };
    });
    clamped.sort((a, b) => a.overlap - b.overlap || a.displacement - b.displacement || a.index - b.index);
    return { left: clamped[0].left, top: clamped[0].top };
  }

  const NEWSFEED_LEFT_PREFERRED_STEPS = new Set([
    "title",
    "body",
    "audience-groups",
    "audience-recipients-reminder",
    "preview"
  ]);

  function prefersNewsfeedLeftRail(state) {
    return state?.guideId === "newsfeed-create" && NEWSFEED_LEFT_PREFERRED_STEPS.has(state?.stepId);
  }

  const RIGHT_HEADER_TARGETS = new Set(["messages.informationButton", "messages.groupChatButton"]);
  const INFORMATION_PANEL_TARGETS = new Set([
    "messages.informationModerators",
    "messages.informationMembers",
    "messages.informationReplies",
    "messages.informationNotifications",
    "messages.informationCreateGroup"
  ]);
  const LEFT_CLASS_LIST_TARGETS = new Set(["messages.classesToggle", "messages.classList"]);

  function bubblePlacementOptions(state) {
    if (prefersNewsfeedLeftRail(state)) return { preferLeft: true };
    const target = state?.step?.target;
    if (INFORMATION_PANEL_TARGETS.has(target)) return { preferredSides: ["left", "above", "below", "right"] };
    if (RIGHT_HEADER_TARGETS.has(target)) return { preferredSides: ["left", "below", "above", "right"] };
    if (LEFT_CLASS_LIST_TARGETS.has(target)) return { preferredSides: ["right", "below", "above", "left"] };
    return {};
  }

  function usableTargetResult(result) {
    return Boolean(result?.verified && result.element?.isConnected === true);
  }

  function shouldDrawSpotlight(state) {
    return state?.step?.showSpotlight !== false;
  }

  function shouldCancelOnDismiss(state) {
    return state?.status !== "COMPLETED";
  }

  function shouldConfirmFullWalkthroughExit(state, onboardingState = {}) {
    const fullWalkthroughActive = onboardingState?.tourStatus === "active"
      || onboardingState?.replayActive === true
      || onboardingState?.firstTimeMapSelection === true;
    if (!fullWalkthroughActive || !shouldCancelOnDismiss(state)) return false;
    if (state?.status === "STEP_COMPLETE") return false;
    if (String(state?.guideId || "").startsWith("pointer:")) return false;
    // Task 6B final handoff close is an intentional finish path, not a mid-tour exit.
    if (state?.step?.expectedAction === "handoff") return false;
    return true;
  }

  function shouldDismissOnboardingPointerCompletion(state, onboardingPointerGuideId = "") {
    return Boolean(onboardingPointerGuideId
      && state?.guideId === onboardingPointerGuideId
      && state?.status === "COMPLETED");
  }

  function shouldSuppressPausedGuideForFirstTimeMap(state, onboardingState = {}) {
    return onboardingState?.firstTimeMapOpen === true
      && state?.status === "PAUSED"
      && state?.reason === "restored";
  }

  function shouldResumeFirstTimeMapGuide(current, guideId, onboardingState = {}) {
    return onboardingState?.firstTimeMapSelection === true
      && current?.status === "PAUSED"
      && current?.reason === "restored"
      && current?.guideId === guideId;
  }

  function shouldSuppressCompletedGuide(state, completionDismissed) {
    return completionDismissed === true && state?.status === "COMPLETED";
  }

  function resolveStepPresentation(step, tr = key => key) {
    const presentation = step?.presentation;
    if (presentation?.kind !== "post-health") return null;
    return Object.freeze({
      kind: "post-health",
      eyebrow: tr(presentation.eyebrowKey),
      title: tr(presentation.titleKey),
      lead: tr(presentation.leadKey),
      body: tr(presentation.bodyKey),
      closing: tr(presentation.closingKey),
    });
  }

  function shouldUseCompactBubble(state, context, existing, targetReady) {
    if (!targetReady || context?.blocked || existing || state?.status !== "WAITING_FOR_ACTION" || !state.step?.target || state.step.reviewRequired) return false;
    if (state.step.manualAdvance === true) return false;
    return ["click", "input", "change", "reminder"].includes(state.step.expectedAction);
  }

  function shouldAutoAdvanceReminder(state) {
    return state?.status === "WAITING_FOR_ACTION"
      && state?.step?.expectedAction === "reminder"
      && state.step.manualAdvance !== true;
  }

  function shouldShowManualReminderAdvance(state) {
    return state?.status === "WAITING_FOR_ACTION"
      && state?.step?.expectedAction === "reminder"
      && state.step.manualAdvance === true;
  }

  function reminderChangeTouchesTarget(state, targetResult, eventTarget) {
    if (state?.status !== "WAITING_FOR_ACTION"
      || state?.step?.expectedAction !== "reminder"
      || state?.step?.settleOnChange !== true
      || !usableTargetResult(targetResult)
      || !eventTarget) return false;
    return targetResult.element === eventTarget || Boolean(targetResult.element.contains?.(eventTarget));
  }

  function createRevealCoordinator({ getState, resolveTarget, revealTarget, onReady = () => { }, onReset = () => { } }) {
    let revision = 0, activeKey = "", readyKey = "", activePromise = null, serial = 0;
    const identities = new WeakMap();
    function identity(target) {
      if (!target || (typeof target !== "object" && typeof target !== "function")) return "none";
      if (!identities.has(target)) identities.set(target, ++serial);
      return identities.get(target);
    }
    function keyFor(state, target) { return `${state?.guideId || ""}:${state?.stepId || ""}:${identity(target)}`; }
    function reset() {
      if (!activeKey && !readyKey && !activePromise) return;
      revision++; activeKey = readyKey = ""; activePromise = null; onReset();
    }
    function isReady(state, target) { return target?.isConnected === true && readyKey === keyFor(state, target); }
    function ensure(state, targetResult) {
      const target = usableTargetResult(targetResult) ? targetResult.element : null;
      if (!target) { reset(); return Promise.resolve(false); }
      const key = keyFor(state, target);
      if (readyKey === key) return Promise.resolve(true);
      if (activeKey === key && activePromise) return activePromise;
      if ((readyKey && readyKey !== key) || (activeKey && activeKey !== key)) reset();
      const myRevision = ++revision;
      activeKey = key;
      activePromise = (async () => {
        try { await revealTarget(target); }
        catch (_) {
          if (myRevision === revision) { activeKey = ""; activePromise = null; }
          return false;
        }
        if (myRevision !== revision) return false;
        const latest = getState(), fresh = resolveTarget(latest);
        if (latest?.guideId !== state?.guideId || latest?.stepId !== state?.stepId
          || !usableTargetResult(fresh) || fresh.element !== target || target.isConnected !== true) {
          if (myRevision === revision) { activeKey = ""; activePromise = null; }
          return false;
        }
        readyKey = key; activeKey = ""; activePromise = null; onReady(target, latest); return true;
      })();
      return activePromise;
    }
    return Object.freeze({ ensure, reset, isReady });
  }

  function createEngine({ guides, ui, persist = () => { }, onChange = () => { }, now = Date.now,
    setTimer = setTimeout, clearTimer = clearTimeout, targetTimeout = 15000, resultTimeout = 20000, completeDelay = 350 }) {
    let state = { status: "IDLE", guideId: null, stepId: null, startedAt: 0, updatedAt: 0 };
    let reason = "", seenAction = false, timeout = null, transition = null, timerKind = null, pendingRouteStepId = null;
    // Quick Pointers are transient overlays. They may temporarily replace the
    // in-memory engine state, but they must never replace persisted full-guide progress.
    let transientGuide = false, suspendedState = null, suspendedReason = "";
    // Review freshness stays in memory; progress persistence contains no preview data.
    let writes = Promise.resolve(), reviewRevision = 0, reviewToken, reviewTokenKnown = false;
    const guide = () => guides[state.guideId];
    const step = () => guide()?.steps.find(item => item.id === state.stepId);
    function snapshot() { return { ...state, reason, reviewRevision, step: step(), guide: guide(), stepIndex: guide()?.steps.findIndex(item => item.id === state.stepId) ?? -1 }; }
    function save() {
      if (transientGuide) return;
      const payload = { ...state };
      writes = writes.catch(() => { }).then(() => persist(payload)).catch(() => { });
    }
    function emit(status, why = "") {
      if (state.status === status && reason === why) return;
      state = { ...state, status, updatedAt: now() }; reason = why;
      if (transientGuide && TERMINAL.has(status)) {
        onChange(snapshot());
        transientGuide = false;
        if (suspendedState) {
          state = { ...suspendedState, updatedAt: now() };
          reason = suspendedReason;
          suspendedState = null; suspendedReason = "";
          save(); onChange(snapshot());
        }
        return;
      }
      save(); onChange(snapshot());
    }
    function clearWait() { if (timeout !== null) clearTimer(timeout); timeout = null; timerKind = null; }
    function clearTimers() { clearWait(); if (transition !== null) clearTimer(transition); transition = null; }
    function block(why = "target-missing") { clearTimers(); seenAction = false; emit("BLOCKED", why); }
    function resetReview() { reviewRevision++; reviewToken = undefined; reviewTokenKnown = false; }
    function guardStep() {
      const current = step();
      if (!current?.requires) return true;
      const required = ui.condition(current.requires), token = ui.reviewToken?.();
      if (!required.verified) {
        if (current.verification !== "observed") { block("requires-live-verification"); return false; }
        resetReview();
        const destination = guide().steps.find(item => item.id === current.returnTo);
        if (destination) state = { ...state, stepId: destination.id };
        block("state-not-ready"); return false;
      }
      if (!required.met || (reviewTokenKnown && ui.reviewToken && token !== reviewToken)) {
        const paused = state.status === "PAUSED", destination = guide().steps.find(item => item.id === current.returnTo);
        resetReview(); clearTimers(); seenAction = false;
        if (!destination) { block("target-missing"); return false; }
        state = { ...state, stepId: destination.id };
        emit(paused ? "PAUSED" : "RUNNING", "review-reset");
        if (!paused) inspect();
        return false;
      }
      reviewToken = token; reviewTokenKnown = true; return true;
    }
    function completionStillValid() {
      const current = step();
      const following = guide().steps[guide().steps.findIndex(item => item.id === current.id) + 1];
      if (!current.reviewRequired && !current.requires && following?.requires !== current.completeWhen) return true;
      if (!current.completeWhen || ["acknowledge", "checklist", "handoff"].includes(current.expectedAction)) return true;
      const condition = ui.condition(current.completeWhen);
      if (!condition.verified) { block("state-not-ready"); return false; }
      if (!condition.met) { clearTimers(); seenAction = false; emit("RUNNING"); inspect(); return false; }
      return true;
    }
    function arm(kind, duration) {
      if (timerKind === kind) return;
      clearWait(); timerKind = kind;
      timeout = setTimer(() => { timeout = null; timerKind = null; block(kind === "target" ? "target-missing" : "result-not-confirmed"); }, duration);
    }
    function next() {
      if (ui.guideContext?.(state.guideId, state.stepId)?.blocked) { block("wrong-context"); return; }
      if (!guardStep() || !completionStillValid()) return;
      clearTimers(); seenAction = false;
      const currentGuide = guide();
      const index = currentGuide.steps.findIndex(item => item.id === state.stepId);
      const nextStepId = pendingRouteStepId || currentGuide.steps.find(item => item.id === state.stepId)?.nextStepId;
      pendingRouteStepId = null;
      const nextIndex = nextStepId ? currentGuide.steps.findIndex(item => item.id === nextStepId) : index + 1;
      if (nextIndex < 0) { block("unknown-step"); return; }
      if (nextIndex >= currentGuide.steps.length) { emit("COMPLETED"); return; }
      state = { ...state, stepId: currentGuide.steps[nextIndex].id };
      emit("RUNNING"); inspect();
    }
    function complete() {
      clearTimers(); emit("STEP_COMPLETE");
      transition = setTimer(() => { transition = null; if (state.status === "STEP_COMPLETE") next(); }, completeDelay);
    }
    function inspect() {
      if (TERMINAL.has(state.status)) return;
      if (state.status === "PAUSED") { guardStep(); return; }
      if (ui.guideContext?.(state.guideId, state.stepId)?.blocked) { block("wrong-context"); return; }
      if (!guardStep()) return;
      if (state.status === "STEP_COMPLETE") { completionStillValid(); return; }
      if (state.status === "BLOCKED" && !["wrong-context", "state-not-ready"].includes(reason)) return;
      if (["wrong-context", "state-not-ready"].includes(reason)) emit("RUNNING");
      const current = step();
      if (!current) { block("unknown-step"); return; }
      if (current.verification !== "observed") { block("requires-live-verification"); return; }
      if (["acknowledge", "choice", "checklist", "handoff"].includes(current.expectedAction)) { clearWait(); emit("WAITING_FOR_ACTION"); return; }
      if (current.expectedAction === "reminder") {
        const target = ui.target(current.target);
        if (!usableTargetResult(target)) {
          if (current.nonBlocking) { complete(); return; }
          emit("WAITING_FOR_TARGET"); arm("target", targetTimeout); return;
        }
        clearWait(); emit("WAITING_FOR_ACTION"); return;
      }
      const condition = ui.condition(current.completeWhen);
      if (!condition.verified) { block("state-not-ready"); return; }
      if (!current.reviewRequired && condition.met && (seenAction || current.allowExisting)) { complete(); return; }
      if (seenAction) { emit("VERIFYING"); arm("result", resultTimeout); return; }
      const target = ui.target(current.target);
      if (!usableTargetResult(target)) { emit("WAITING_FOR_TARGET"); arm("target", targetTimeout); return; }
      clearWait(); emit("WAITING_FOR_ACTION");
    }
    function startAt(guideId, stepId = "") {
      const selected = guides[guideId];
      if (!selected?.available || !selected.steps.length) return false;
      const selectedStep = stepId ? selected.steps.find(item => item.id === stepId) : selected.steps[0];
      if (!selectedStep) return false;
      clearTimers(); resetReview(); seenAction = false; reason = ""; pendingRouteStepId = null;
      state = { status: "IDLE", guideId, stepId: selectedStep.id, startedAt: now(), updatedAt: now() };
      emit("RUNNING"); inspect(); return true;
    }
    function start(guideId) { return startAt(guideId); }
    function startTransientAt(guideId, stepId = "") {
      const selected = guides[guideId];
      const selectedStep = stepId ? selected?.steps?.find(item => item.id === stepId) : selected?.steps?.[0];
      if (!selected?.available || !selectedStep) return false;
      if (!transientGuide && state.guideId && !TERMINAL.has(state.status)) {
        suspendedState = { ...state };
        suspendedReason = reason;
      }
      transientGuide = true;
      return startAt(guideId, selectedStep.id);
    }
    function startTransient(guideId) { return startTransientAt(guideId); }
    function handleAction(type, eventTarget) {
      if (!["WAITING_FOR_ACTION", "WAITING_FOR_TARGET"].includes(state.status)) return;
      if (ui.guideContext?.(state.guideId, state.stepId)?.blocked) { inspect(); return; }
      if (!guardStep()) return;
      const current = step();
      if (current.expectedAction === "handoff" && current.closeOnAction === type) {
        const target = ui.target(current.target);
        if (usableTargetResult(target) && (target.element === eventTarget || target.element.contains?.(eventTarget))) cancel();
        return;
      }
      if (current.reviewRequired || ["review", "handoff"].includes(current.expectedAction)) return;
      if (current.expectedAction !== type) return;
      const target = ui.target(current.target);
      if (!usableTargetResult(target) || !(target.element === eventTarget || target.element.contains?.(eventTarget))) return;
      seenAction = true; inspect();
    }
    function acknowledge(value = 0) {
      if (state.status !== "WAITING_FOR_ACTION") return;
      if (ui.guideContext?.(state.guideId, state.stepId)?.blocked) { inspect(); return; }
      if (!guardStep()) return;
      const current = step();
      if (current.expectedAction === "choice") {
        const routes = current.choiceRoutes || {};
        if (!Object.hasOwn(routes, value)) return;
        pendingRouteStepId = routes[value] || null;
        complete();
        return;
      }
      if (current.expectedAction === "acknowledge" || current.expectedAction === "reminder") complete();
      else if (current.expectedAction === "checklist" && value === current.checklist.length) complete();
      else if (current.confirmExisting) {
        const result = ui.condition(current.completeWhen);
        if (result.verified && result.met) complete();
      }
    }
    function cancel() { clearTimers(); seenAction = false; emit("CANCELLED"); }
    function defer() { if (!TERMINAL.has(state.status)) { clearTimers(); seenAction = false; emit("PAUSED", "deferred"); } }
    function pause() {
      if (state.status === "PAUSED") return;
      if (!TERMINAL.has(state.status)) { clearTimers(); seenAction = false; emit("PAUSED"); }
    }
    function resume() { if (["PAUSED", "BLOCKED"].includes(state.status)) { clearTimers(); seenAction = false; emit("RUNNING"); inspect(); } }
    function restore(saved) {
      const selected = guides[saved?.guideId];
      if (!selected?.available || !selected.steps.some(item => item.id === saved.stepId) || TERMINAL.has(saved.status)) return false;
      const savedIndex = selected.steps.findIndex(item => item.id === saved.stepId);
      const restoredStep = selected.steps[savedIndex].expectedAction === "handoff"
        ? selected.steps.slice(0, savedIndex).reverse().find(item => item.expectedAction === "checklist") : selected.steps[savedIndex];
      if (!restoredStep) return false;
      clearTimers(); resetReview(); seenAction = false;
      state = {
        status: "IDLE", guideId: saved.guideId, stepId: restoredStep.id,
        startedAt: Number.isFinite(saved.startedAt) ? saved.startedAt : now(), updatedAt: now()
      };
      emit("PAUSED", "restored"); return true;
    }
    return Object.freeze({ start, startTransient, startTransientAt, inspect, handleAction, acknowledge, cancel, defer, pause, resume, restore, block, snapshot, flush: () => writes });
  }

  function createPointerGuides(definitions = {}) {
    return Object.freeze(Object.fromEntries(Object.values(definitions).map(definition => {
      const id = `pointer:${definition.id}`;
      const steps = definition.steps?.length ? definition.steps : [{
        id: "point",
        target: definition.target,
        instructionKey: definition.instructionKey,
        expectedAction: "reminder",
        completeWhen: null,
        durationMs: definition.durationMs,
        showSpotlight: definition.showSpotlight
      }];
      return [id, Object.freeze({
        id,
        titleKey: definition.titleKey,
        descriptionKey: definition.instructionKey,
        autoDismiss: definition.autoDismiss === true,
        status: "pointer",
        available: true,
        resources: [],
        verification: Object.freeze({ status: "observed", schoolSourcesVerified: false }),
        steps: Object.freeze(steps.map(step => Object.freeze({
          id: step.id,
          target: step.target,
          instructionKey: step.instructionKey,
          expectedAction: step.expectedAction,
          completeWhen: step.completeWhen ?? null,
          sourceIds: Object.freeze(["BRIEF-32", "BRIEF-36"]),
          risk: "low",
          verification: "observed",
          fallbackKey: "guide.newsfeed.fallback",
          nonBlocking: step.nonBlocking === true,
          choices: step.choices ? Object.freeze(step.choices.map(choice => Object.freeze({ ...choice }))) : null,
          choiceRoutes: step.choiceRoutes ? Object.freeze({ ...step.choiceRoutes }) : null,
          nextStepId: step.nextStepId || null,
          durationMs: step.durationMs,
          manualAdvance: step.manualAdvance === true,
          showSpotlight: step.showSpotlight !== false,
          allowExisting: step.allowExisting === true
        })))
      })];
    })));
  }

  function createController(doc) {
    let panel = null, spotlight = null, bubble = null, engine = null, initialized = null, enabled = true, raf = null;
    let focusReturn = null, renderKey = "", helpVisible = false, minimized = false;
    let completionDismissed = false, exitConfirmationVisible = false, deferredDismissed = false;
    let onboardingPointerGuideId = "";
    let checksRevision = null, revealCoordinator = null, pulsedTarget = null, pulsedStep = "";
    let reminderTimer = null, reminderTimerKey = "";
    const checkedItems = new Set();
    const tr = (key, vars = {}, fallback = "") => hub.i18n?.t?.(key, vars, fallback) || fallback || key || "";
    function element(tag, className, text) {
      const node = doc.createElement(tag); if (className) node.className = className;
      if (text) node.textContent = text; return node;
    }
    function button(label, action, className = "") {
      const node = element("button", className, label); node.type = "button";
      node.addEventListener("click", action); return node;
    }
    function fullWalkthroughState() {
      return hub.messageOnboarding?.snapshot?.() || {};
    }
    function dismissExitConfirmation() {
      if (!exitConfirmationVisible) return;
      exitConfirmationVisible = false; renderKey = "";
      if (engine) render(engine.snapshot());
    }
    function exitForNow() {
      if (!engine) return;
      exitConfirmationVisible = false;
      deferredDismissed = true;
      engine.defer();
      remove();
      hub.help?.showReturnCue?.();
    }
    function renderExitConfirmation(state) {
      if (!panel) return;
      clearPresentationVisuals();
      const languageCode = hub.i18n?.language?.() === "vi" ? "vi" : "en";
      panel.lang = languageCode;
      const header = element("div", "psqm-guide-header");
      const title = element("h2", "", tr("walkthrough.exitConfirmTitle"));
      title.id = "psqm-guide-title";
      header.append(title);
      const body = element("p", "psqm-guide-instruction", tr("walkthrough.exitConfirmBody"));
      const actions = element("div", "psqm-guide-actions");
      actions.append(
        button(tr("walkthrough.keepGoing"), dismissExitConfirmation, "psqm-guide-primary"),
        button(tr("walkthrough.exitForNow"), exitForNow)
      );
      panel.replaceChildren(header, body, actions);
      panel.hidden = false;
      panel.classList.remove("psqm-guide-minimized");
      if (bubble) bubble.hidden = true;
      if (spotlight) spotlight.hidden = true;
      actions.querySelector?.("button")?.focus?.({ preventScroll: true });
      schedulePosition();
    }
    function requestGuideExit(state) {
      if (exitConfirmationVisible) { dismissExitConfirmation(); return; }
      if (shouldConfirmFullWalkthroughExit(state, fullWalkthroughState())) {
        exitConfirmationVisible = true; renderKey = ""; render(state); return;
      }
      engine.cancel();
    }
    function currentTarget(state, resolvedContext = undefined) {
      const context = resolvedContext === undefined ? hub.ui.guideContext(state.guideId, state.stepId) : resolvedContext;
      return hub.ui.target(context?.blocked ? context.target : state.step?.target);
    }
    function clearReminderTimer() {
      if (reminderTimer !== null) doc.defaultView.clearTimeout(reminderTimer);
      reminderTimer = null; reminderTimerKey = "";
    }
    function clearPresentationVisuals() {
      clearReminderTimer();
      if (spotlight) { spotlight.hidden = true; spotlight.classList.remove("psqm-guide-pulse"); }
      if (bubble) bubble.hidden = true;
      pulsedTarget = null; pulsedStep = "";
    }
    function ensureRevealCoordinator() {
      if (revealCoordinator) return revealCoordinator;
      revealCoordinator = createRevealCoordinator({
        getState: () => engine?.snapshot(),
        resolveTarget: state => currentTarget(state),
        revealTarget: target => revealTargetIntoView(target, doc),
        onReady: () => { renderKey = ""; if (engine) render(engine.snapshot()); schedulePosition(); },
        onReset: clearPresentationVisuals
      });
      return revealCoordinator;
    }
    function showTarget() {
      const state = engine.snapshot(), target = currentTarget(state);
      if (!usableTargetResult(target)) { engine.inspect(); schedulePosition(); return; }
      // Recovery only: reveal the verified control, never click, edit, or move native focus.
      const reveal = ensureRevealCoordinator(); reveal.reset(); reveal.ensure(state, target);
    }
    function conversationInformationUnavailable(state, targetUsable, context) {
      if (targetUsable || context?.blocked) return false;
      if (state?.guideId !== "message-class-info" || state?.stepId !== "information") return false;
      return hub.ui?.detectContext?.()?.area === "messages";
    }
    function position() {
      raf = null;
      if (!spotlight || !panel || !engine) return;
      const state = engine.snapshot();
      if (helpVisible || ["PAUSED", "COMPLETED", "CANCELLED", "STEP_COMPLETE", "VERIFYING"].includes(state.status)) {
        clearPresentationVisuals(); panel.hidden = helpVisible; placePanel(); return;
      }
      const context = hub.ui.guideContext(state.guideId, state.stepId), target = currentTarget(state, context);
      const targetUsable = usableTargetResult(target), view = hub.ui.targetView(targetUsable ? target.element : null);
      const condition = state.step?.confirmExisting && hub.ui.condition(state.step.completeWhen);
      const existing = condition?.verified && condition.met;
      const ready = targetUsable && ensureRevealCoordinator().isReady(state, target.element);
      const compact = shouldUseCompactBubble(state, context, existing, ready && view.inView && !view.covered);
      const note = panel.querySelector('.psqm-guide-location'), show = panel.querySelector('[data-guide-show]');
      if (show) show.hidden = !targetUsable;
      if (note) {
        note.textContent = targetUsable && !view.inView
          ? tr("walkthrough.offscreen")
          : view.covered ? tr("walkthrough.covered") : '';
        note.hidden = !note.textContent;
      }
      panel.hidden = helpVisible || compact;
      if (bubble) bubble.hidden = helpVisible || !compact;
      spotlight.hidden = !shouldDrawSpotlight(state) || !ready || !view.inView || view.covered;
      const rect = view.rect;
      if (!compact) placePanel(view.inView ? rect : null);
      const stepKey = `${state.guideId}:${state.stepId}`;
      if (rect && !spotlight.hidden) {
        spotlight.style.left = `${Math.max(0, rect.left - 3)}px`; spotlight.style.top = `${Math.max(0, rect.top - 3)}px`;
        spotlight.style.width = `${rect.width + 6}px`; spotlight.style.height = `${rect.height + 6}px`;
        if (pulsedTarget !== target.element || pulsedStep !== stepKey) {
          spotlight.classList.remove("psqm-guide-pulse"); void spotlight.offsetWidth; spotlight.classList.add("psqm-guide-pulse");
          pulsedTarget = target.element; pulsedStep = stepKey;
        }
      } else {
        spotlight.classList.remove("psqm-guide-pulse");
        pulsedTarget = null; pulsedStep = "";
      }
      if (shouldAutoAdvanceReminder(state)) {
        const timerKey = `${stepKey}:${target.element === pulsedTarget}`;
        if (reminderTimerKey !== timerKey) {
          clearReminderTimer(); reminderTimerKey = timerKey;
          const delay = Number.isFinite(state.step.durationMs) ? state.step.durationMs : 1500;
          reminderTimer = doc.defaultView.setTimeout(() => {
            reminderTimer = null;
            const latest = engine?.snapshot();
            if (latest?.guideId === state.guideId && latest?.stepId === state.stepId
              && shouldAutoAdvanceReminder(latest)) {
              engine.acknowledge();
            }
          }, delay);
        }
      } else clearReminderTimer();
      if (compact && bubble && rect) {
        const placement = bubblePlacementOptions(state);
        const preferredMaxWidth = placement.preferLeft ? "200px" : "";
        if (bubble.style.maxWidth !== preferredMaxWidth) bubble.style.maxWidth = preferredMaxWidth;
        const bubbleRect = bubble.getBoundingClientRect();
        const width = doc.documentElement.clientWidth || doc.defaultView.innerWidth;
        const height = doc.documentElement.clientHeight || doc.defaultView.innerHeight;
        const point = computeBubblePosition(rect, bubbleRect, { width, height }, 10, 10, placement);
        bubble.style.left = `${point.left}px`; bubble.style.top = `${point.top}px`;
      }
    }
    function placePanel(rect = null) {
      const card = panel.getBoundingClientRect();
      const width = doc.documentElement.clientWidth || doc.defaultView.innerWidth;
      const height = doc.documentElement.clientHeight || doc.defaultView.innerHeight;
      const margin = width <= 480 ? 10 : 16;
      const right = Math.max(margin, width - card.width - margin);
      const bottom = Math.max(margin, height - card.height - 66);
      const positions = [{ left: right, top: bottom }, { left: margin, top: bottom }, { left: right, top: margin }, { left: margin, top: margin }];
      const overlap = p => !rect ? 0 : Math.max(0, Math.min(p.left + card.width, rect.right + 10) - Math.max(p.left, rect.left - 10))
        * Math.max(0, Math.min(p.top + card.height, rect.bottom + 10) - Math.max(p.top, rect.top - 10));
      const best = positions.reduce((a, b) => overlap(b) < overlap(a) ? b : a);
      panel.style.left = `${best.left}px`; panel.style.top = `${best.top}px`; panel.style.right = 'auto'; panel.style.bottom = 'auto';
    }
    function schedulePosition() { if (raf === null) raf = doc.defaultView.requestAnimationFrame(position); }
    function remove() {
      revealCoordinator?.reset();
      panel?.remove(); spotlight?.remove(); bubble?.remove(); panel = spotlight = bubble = null; renderKey = ""; minimized = false; exitConfirmationVisible = false;
      if (raf !== null) doc.defaultView.cancelAnimationFrame(raf); raf = null;
    }
    function render(state) {
      if (checksRevision !== state.reviewRevision) { checkedItems.clear(); checksRevision = state.reviewRevision; }
      if (shouldSuppressPausedGuideForFirstTimeMap(state, fullWalkthroughState())) { remove(); return; }
      if (deferredDismissed && state.status === "PAUSED" && state.reason === "deferred") { remove(); return; }
      if (exitConfirmationVisible) { renderExitConfirmation(state); return; }
      if (state.status === "COMPLETED" && state.guide?.autoDismiss === true) { remove(); return; }
      if (shouldSuppressCompletedGuide(state, completionDismissed)) { remove(); return; }
      if (TERMINAL.has(state.status) && state.status !== "COMPLETED") { remove(); return; }
      const context = hub.ui.guideContext(state.guideId, state.stepId);
      const condition = state.step?.confirmExisting && hub.ui.condition(state.step.completeWhen);
      const existing = condition?.verified && condition.met;
      const target = currentTarget(state, context), reveal = ensureRevealCoordinator();
      const targetUsable = usableTargetResult(target);
      const informationUnavailable = conversationInformationUnavailable(state, targetUsable, context);
      const canReveal = !helpVisible && targetUsable
        && !["PAUSED", "COMPLETED", "CANCELLED", "STEP_COMPLETE", "VERIFYING"].includes(state.status);
      if (canReveal) reveal.ensure(state, target); else reveal.reset();
      const view = hub.ui.targetView(targetUsable ? target.element : null), readyInView = targetUsable && reveal.isReady(state, target.element) && view.inView && !view.covered;
      const compact = shouldUseCompactBubble(state, context, existing, readyInView);
      const key = `${state.guideId}:${state.stepId}:${state.status}:${state.reason}:${Boolean(existing)}:${context?.instruction}:${minimized}:${state.reviewRevision}:${compact}`;
      if (key === renderKey) { schedulePosition(); return; }
      renderKey = key;
      if (!panel) {
        panel = element("section", "psqm-guide-panel"); panel.id = "psqm-guide-panel";
        panel.dataset.psqmUi = "walkthrough"; panel.setAttribute("aria-labelledby", "psqm-guide-title");
        spotlight = element("div", "psqm-guide-spotlight"); spotlight.dataset.psqmUi = "spotlight"; spotlight.setAttribute("aria-hidden", "true");
        bubble = element("aside", "psqm-guide-bubble"); bubble.id = "psqm-guide-bubble"; bubble.dataset.psqmUi = "bubble"; bubble.hidden = true;
        doc.body.append(spotlight, panel, bubble);
      }
      const languageCode = hub.i18n?.language?.() === "vi" ? "vi" : "en";
      panel.lang = languageCode;
      bubble.lang = languageCode;
      const header = element("div", "psqm-guide-header");
      const title = element("h2", "", tr(state.guide.titleKey, {}, state.guide.title || "")); title.id = "psqm-guide-title";
      const stop = state.guide.steps.findIndex(step => step.verification !== 'observed');
      const progressTotal = stop < 0 ? state.guide.steps.length : stop + 1;
      const progress = element("span", "psqm-guide-progress", `${state.stepIndex + 1} / ${progressTotal}`);
      const toggle = button(minimized ? tr('common.expand') : tr('common.minimize'), () => { minimized = !minimized; render(engine.snapshot()); });
      toggle.className = 'psqm-guide-toggle'; toggle.setAttribute('aria-expanded', String(!minimized));
      header.append(title, progress, toggle);
      const gated = state.status === 'BLOCKED' && state.reason === 'requires-live-verification';
      const presentation = state.status === "COMPLETED" ? null : resolveStepPresentation(state.step, tr);
      const instruction = element("p", presentation ? "psqm-guide-instruction psqm-newsfeed-post-health__body" : "psqm-guide-instruction",
        presentation?.body || (state.status === "COMPLETED" ? tr("walkthrough.complete")
          : context?.blocked ? tr(context.instructionKey, {}, context.instruction || "")
            : gated ? tr(state.step.fallbackKey, {}, state.step.fallback || "")
              : tr(state.step.instructionKey, {}, state.step.instruction || "")));
      const statusText = {
        RUNNING: tr("walkthrough.checking"),
        WAITING_FOR_TARGET: informationUnavailable ? tr("walkthrough.conversationInformationUnavailable") : tr("walkthrough.waitingField"),
        WAITING_FOR_ACTION: "",
        VERIFYING: tr("walkthrough.checking"),
        STEP_COMPLETE: tr("walkthrough.done"),
        BLOCKED: gated
          ? tr("walkthrough.continuePowerSchool")
          : context?.blocked ? tr("walkthrough.returnNewsfeed")
            : informationUnavailable ? tr("walkthrough.conversationInformationUnavailable")
              : state.reason === "state-not-ready" ? tr("walkthrough.pageNotReady")
                : tr("walkthrough.fieldNotFound"),
        PAUSED: tr("walkthrough.paused"),
        COMPLETED: tr("walkthrough.done")
      };
      const status = element("p", "psqm-guide-status", statusText[state.status] ?? state.status);
      status.hidden = !status.textContent;
      status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite");
      const content = [header];
      if (presentation) {
        content.push(
          element("div", "psqm-newsfeed-post-health__eyebrow", presentation.eyebrow),
          element("strong", "psqm-newsfeed-post-health__title", presentation.title),
          element("p", "psqm-newsfeed-post-health__lead", presentation.lead),
          instruction,
          element("strong", "psqm-newsfeed-post-health__closing", presentation.closing),
        );
      } else {
        content.push(instruction);
      }
      content.push(status);
      if (state.status === "BLOCKED" && !gated && !context?.blocked && !informationUnavailable) content.push(element("p", "psqm-guide-note",
        state.reason === 'state-not-ready' ? tr("walkthrough.notePage")
          : state.reason === 'result-not-confirmed' ? tr("walkthrough.noteEntry")
            : tr("walkthrough.noteScreen")));
      const locationNote = element('p', 'psqm-guide-location'); locationNote.setAttribute('role', 'status'); locationNote.hidden = true; content.push(locationNote);
      const actions = element("div", "psqm-guide-actions");
      if (state.status === "WAITING_FOR_ACTION") {
        if (state.step.expectedAction === "acknowledge") actions.append(button(state.step.actionLabel ? state.step.actionLabel : tr(state.step.actionLabelKey || "common.continue"), () => engine.acknowledge(), "psqm-guide-primary"));
        else if (shouldShowManualReminderAdvance(state)) actions.append(button(tr("common.next"), () => engine.acknowledge(), "psqm-guide-primary"));
        else if (state.step.expectedAction === "choice") {
          for (const choice of state.step.choices || []) {
            actions.append(button(tr(choice.labelKey || choice.label || choice.id), () => engine.acknowledge(choice.id), choice.primary ? "psqm-guide-primary" : ""));
          }
        }
        else if (state.step.expectedAction === "checklist") {
          const checks = element("div", "psqm-guide-checks");
          state.step.checklist.forEach((text, index) => {
            const label = element("label"); const input = doc.createElement("input"); input.type = "checkbox";
            input.checked = checkedItems.has(index);
            input.addEventListener("change", () => {
              engine.inspect();
              const current = engine.snapshot();
              if (current.stepId !== state.stepId || current.reviewRevision !== state.reviewRevision) return;
              if (input.checked) checkedItems.add(index); else checkedItems.delete(index);
            });
            label.append(input, doc.createTextNode(tr(text))); checks.append(label);
          });
          content.push(checks);
          const continueButton = button(tr("walkthrough.checksComplete"), () => engine.acknowledge(checkedItems.size), "psqm-guide-primary");
          continueButton.disabled = checkedItems.size !== state.step.checklist.length;
          checks.addEventListener("change", () => { continueButton.disabled = checkedItems.size !== state.step.checklist.length; });
          actions.append(continueButton);
        } else if (existing) {
          actions.append(button(state.step.actionLabel ? state.step.actionLabel : tr(state.step.actionLabelKey || "walkthrough.useText"), () => engine.acknowledge()));
        }
      }
      if (state.status === "PAUSED") actions.append(button(tr("common.resume"), () => engine.resume(), "psqm-guide-primary"));
      else if (state.status === "BLOCKED") {
        if (!gated && !context?.blocked) actions.append(button(tr("common.retry"), () => engine.resume()));
        if (!context?.blocked && hub.help?.isEnabled()) actions.append(button(tr("common.help"), () => hub.help.open()));
      }
      else if (!["COMPLETED", "STEP_COMPLETE"].includes(state.status)) { const pause = button(tr("common.pause"), () => engine.pause()); pause.className = 'psqm-guide-secondary'; actions.append(pause); }
      if (!["PAUSED", "COMPLETED", "STEP_COMPLETE"].includes(state.status) && (state.step.target || context?.target)) {
        const show = button(tr("common.showMe"), showTarget, "psqm-guide-primary"); show.dataset.guideShow = ''; actions.prepend(show);
      }
      actions.append(button(gated
        ? tr("walkthrough.finishPowerSchool")
        : state.step.expectedAction === "handoff" ? tr("walkthrough.closeGuide")
          : state.status === "COMPLETED" ? tr("common.close")
            : tr("common.exit"), () => {
              const hadFocus = panel?.contains(doc.activeElement);
              if (shouldCancelOnDismiss(state)) requestGuideExit(state);
              else {
                completionDismissed = true;
                remove();
                hub.messageOnboarding?.handleWalkthroughState?.({ ...state, uiDismissed: true });
              }
              if (hadFocus && !exitConfirmationVisible && focusReturn?.isConnected) focusReturn.focus();
            }));
      content.push(actions);
      const refocus = panel.contains(doc.activeElement);
      const toggleFocused = doc.activeElement?.classList.contains('psqm-guide-toggle');
      panel.replaceChildren(...content); panel.hidden = helpVisible || compact;
      panel.classList.toggle('psqm-guide-minimized', minimized);
      panel.classList.toggle('psqm-newsfeed-post-health', presentation?.kind === 'post-health');
      const bubbleInstruction = element("p", "psqm-guide-bubble-instruction", instruction.textContent);
      bubbleInstruction.setAttribute("role", "status"); bubbleInstruction.setAttribute("aria-live", "polite");
      const bubbleProgress = element("span", "psqm-guide-bubble-progress", tr("walkthrough.stepProgress", { current: state.stepIndex + 1, total: progressTotal }));
      const bubbleExit = button("×", () => {
        const hadFocus = bubble?.contains(doc.activeElement); requestGuideExit(state);
        if (hadFocus && !exitConfirmationVisible && focusReturn?.isConnected) focusReturn.focus();
      }, "psqm-guide-bubble-exit");
      bubbleExit.setAttribute("aria-label", tr("walkthrough.exitGuide"));
      bubble.replaceChildren(bubbleInstruction, bubbleProgress, bubbleExit); bubble.hidden = helpVisible || !compact;
      if (refocus && !compact) panel.querySelector(toggleFocused ? '.psqm-guide-toggle' : '.psqm-guide-actions button:not(:disabled)')?.focus({ preventScroll: true });
      schedulePosition();
    }
    async function initialize() {
      if (initialized) return initialized;
      initialized = (async () => {
        const settings = await chrome.storage.local.get({ walkthroughEnabled: true });
        enabled = settings.walkthroughEnabled !== false && hub.features.walkthroughs !== false;
        const runtimeGuides = Object.freeze({ ...hub.guides, ...createPointerGuides(hub.pointerDefinitions) });
        engine = createEngine({
          guides: runtimeGuides, ui: hub.ui,
          persist: state => chrome.runtime.sendMessage({ type: "PSQM_GUIDE_SAVE", state }),
          onChange: state => {
            render(state);
            if (shouldDismissOnboardingPointerCompletion(state, onboardingPointerGuideId)) {
              remove();
              onboardingPointerGuideId = "";
              hub.messageOnboarding?.handleWalkthroughState?.({ ...state, uiDismissed: true });
              return;
            }
            hub.messageOnboarding?.handleWalkthroughState?.(state);
            if (onboardingPointerGuideId && state?.guideId === onboardingPointerGuideId && state?.status === "CANCELLED") {
              onboardingPointerGuideId = "";
            }
          }
        });
        ensureRevealCoordinator();
        for (const type of ["click", "input", "change"]) doc.addEventListener(type, event => {
          if (!enabled || event.target.closest?.("[data-psqm-ui]")) return;

          const before = engine.snapshot();
          if (type === "change" && reminderChangeTouchesTarget(before, currentTarget(before), event.target)) {
            clearReminderTimer();
            schedulePosition();
          }

          if (event.isTrusted) engine.handleAction(type, event.target);
          // Native checkbox properties can change without a DOM mutation.
          render(engine.snapshot());
        }, true);
        doc.addEventListener("keydown", event => {
          if (event.key === "Escape" && event.target.closest?.("#psqm-guide-panel, #psqm-guide-bubble")) {
            event.preventDefault();
            if (exitConfirmationVisible) dismissExitConfirmation();
            else requestGuideExit(engine.snapshot());
            if (!exitConfirmationVisible && focusReturn?.isConnected) focusReturn.focus();
          }
        });
        doc.defaultView.addEventListener("resize", schedulePosition);
        doc.addEventListener("scroll", schedulePosition, true);
        doc.defaultView.addEventListener("popstate", () => { engine.inspect(); schedulePosition(); });
        chrome.storage.onChanged.addListener((changes, area) => {
          if (area === "local" && changes.walkthroughEnabled) {
            enabled = changes.walkthroughEnabled.newValue !== false && hub.features.walkthroughs !== false;
            if (!enabled) engine.cancel();
          }
        });
        hub.i18n?.onChange?.(() => {
          renderKey = "";
          if (engine) render(engine.snapshot());
        });
        // A worker reconnect failure must not cause listener registration to repeat.
        const saved = await chrome.runtime.sendMessage({ type: "PSQM_GUIDE_GET" }).catch(() => null);
        if (enabled && saved?.ok && saved.state) engine.restore(saved.state);
      })().catch(() => { initialized = null; });
      return initialized;
    }
    async function begin(id, transient = false, startStepId = "") {
      await initialize();
      if (!engine || !enabled) return false;
      focusReturn = doc.activeElement;
      minimized = false;
      hub.help?.close();
      const current = engine.snapshot();
      const onboardingState = fullWalkthroughState();
      const deferred = deferredDismissed && current?.status === "PAUSED" && current?.reason === "deferred";
      const restoredMapGuide = !transient && shouldResumeFirstTimeMapGuide(current, id, onboardingState);
      let started;
      if (!transient && deferred && current.guideId === id) {
        deferredDismissed = false;
        engine.resume();
        started = true;
      } else if (restoredMapGuide) {
        engine.resume();
        started = true;
      } else if (!transient && deferred) {
        // Preserve the deferred Full Walkthrough while a Help-menu task runs.
        started = engine.startTransient(id);
      } else {
        started = transient
          ? (startStepId ? engine.startTransientAt(id, startStepId) : engine.startTransient(id))
          : engine.start(id);
      }
      if (started) {
        completionDismissed = false;
        exitConfirmationVisible = false;
        panel?.querySelector(".psqm-guide-actions button:not(:disabled)")?.focus({ preventScroll: true });
      }
      return started;
    }
    async function start(id) { return begin(id, false); }
    async function startPointer(pointerId) {
      const task = hub.helpTasks?.find(item => item.type === "pointer" && item.pointerId === pointerId);
      const context = hub.ui.detectContext(), exact = `${context.area}:${context.view}`;
      if (!task || !hub.pointerDefinitions?.[pointerId]
        || (!task.contexts.includes(exact) && !task.contexts.includes(context.area))) return false;
      return begin(`pointer:${pointerId}`, true);
    }
    async function startPointerFromOnboarding(pointerId) {
      if (!hub.pointerDefinitions?.[pointerId]) return false;
      const guideId = `pointer:${pointerId}`;
      onboardingPointerGuideId = guideId;
      const started = await begin(guideId, true);
      if (!started && onboardingPointerGuideId === guideId) onboardingPointerGuideId = "";
      return started;
    }
    async function startPointerFromOnboardingAt(pointerId, startStepId = "") {
      if (!startStepId) return startPointerFromOnboarding(pointerId);
      if (!hub.pointerDefinitions?.[pointerId]) return false;
      const guideId = `pointer:${pointerId}`;
      onboardingPointerGuideId = guideId;
      const started = await begin(guideId, true, startStepId);
      if (!started && onboardingPointerGuideId === guideId) onboardingPointerGuideId = "";
      return started;
    }
    return Object.freeze({
      initialize, start, startPointer, startPointerFromOnboarding, startPointerFromOnboardingAt,
      handleDomChange: () => { engine?.inspect(); if (engine) render(engine.snapshot()); schedulePosition(); },
      pause: () => engine?.pause(),
      setHelpVisible: visible => {
        helpVisible = visible;
        if (visible) ensureRevealCoordinator().reset();
        if (panel) panel.hidden = visible; if (bubble) bubble.hidden = true; if (spotlight && visible) spotlight.hidden = true;
        if (!visible && engine) { renderKey = ""; render(engine.snapshot()); }
      },
      cancel: () => engine?.cancel(), snapshot: () => engine?.snapshot(),
      invalidateView: () => { renderKey = ""; if (engine) render(engine.snapshot()); }
    });
  }
  hub.walkthrough = typeof document === "object" ? createController(document) : null;
  if (typeof module === "object" && module.exports) module.exports = { createEngine, createPointerGuides, createRevealCoordinator, getScrollableParent, computeBubblePosition, bubblePlacementOptions, usableTargetResult, shouldUseCompactBubble, shouldAutoAdvanceReminder, shouldShowManualReminderAdvance, shouldDrawSpotlight, shouldCancelOnDismiss, shouldConfirmFullWalkthroughExit, shouldDismissOnboardingPointerCompletion, shouldSuppressPausedGuideForFirstTimeMap, shouldResumeFirstTimeMapGuide, shouldSuppressCompletedGuide, resolveStepPresentation, waitForScrollToSettle, reminderChangeTouchesTarget, prefersNewsfeedLeftRail };
})(globalThis);
