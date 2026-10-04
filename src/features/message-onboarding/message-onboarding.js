(function (root) {
  "use strict";

  const hub = root.PSQM ??= {};
  if (hub.messageOnboarding) return;
  const onboardingProgress = hub.onboardingProgress;
  if (!onboardingProgress) throw new Error("Onboarding progress must load before Message Onboarding.");
  const WALKTHROUGH_MODULES = Object.freeze(onboardingProgress.MODULE_ORDER.filter(id => id !== "language"));
  const FIRST_TIME_MAP_MODULES = Object.freeze(["newsfeed", "messages", "navigation"]);
  const NEWSFEED_GUIDE_ID = "newsfeed-create";
  const NAVIGATION_POINTER_ID = "newsfeed.discover-navigation";
  const NAVIGATION_STEP_IDS = Object.freeze(["directory", "groups", "powerbuddy-tools", "observations", "resource-links"]);

  const STATE_KEY = "messageOnboardingV1";
  const STATE_VERSION = 1;
  const STEP_AVAILABILITY = "availability";
  const STEP_CLASSES = "classes";
  const STEP_OPENING = "opening";
  const STEP_WAIT_CONVERSATION = "wait-conversation";
  const STEP_INFORMATION = "information";
  const STEP_GROUP_CHAT = "group-chat";
  const STEP_GROUP_CHAT_OPEN = "group-chat-open";
  const GROUP_CHAT_GUIDE_ID = "message-multi";
  const GROUP_CHAT_GUIDE_FINAL_STEP = "stop";
  const CLASSES_TOGGLE_ID = "messenger-inbox__conversation-list-classes-accordion-toggle";
  const CONVERSATION_REGION_ID = "conversationRegion";
  const MESSAGE_EDITOR_ID = "messenger-inbox-message-input-text-field";
  const CLASS_TABS_SELECTOR = '[aria-label="class tabs"]';
  const TOGGLE_ID = "checkbox-messenger-inbox__teacher-availability__use-messaging-toggle";
  const SET_AVAILABILITY_ID = "neon-popper-button-set-availability-button";
  const MESSAGES_NAV_ID = "button-header-messenger-inbox";
  const CARD_ID = "psqm-message-onboarding-card";
  const SPOTLIGHT_ID = "psqm-message-onboarding-spotlight";
  const SUCCESS_MS = 2200;

  const DEFAULT_STATE = Object.freeze({
    version: STATE_VERSION,
    welcomeSeen: false,
    entryChoice: "",
    step: STEP_AVAILABILITY,
    availabilityGuided: false,
    openingChoice: "",
    informationSeen: false,
    navigationProgress: Object.freeze({ stepId: "", completed: false }),
    completed: false,
    ...onboardingProgress.createProgress()
  });

  function normalizeState(value, { progressMode = "pending" } = {}) {
    const source = value && typeof value === "object" ? value : {};
    const validSteps = [
      STEP_AVAILABILITY,
      STEP_CLASSES,
      STEP_OPENING,
      STEP_WAIT_CONVERSATION,
      STEP_INFORMATION,
      STEP_GROUP_CHAT,
      STEP_GROUP_CHAT_OPEN
    ];
    const step = validSteps.includes(source.step) ? source.step : STEP_AVAILABILITY;
    const entryChoice = ["newsfeed", "messages", "navigation", "dismissed"].includes(source.entryChoice)
      ? source.entryChoice
      : "";
    const openingChoice = ["automatic", "manual", "existing-draft"].includes(source.openingChoice)
      ? source.openingChoice
      : "";
    const navigationSource = source.navigationProgress && typeof source.navigationProgress === "object"
      ? source.navigationProgress
      : {};
    const navigationStepId = NAVIGATION_STEP_IDS.includes(navigationSource.stepId) ? navigationSource.stepId : "";
    const navigationKnown = navigationSource.known === true;
    const navigationProgress = navigationKnown
      ? { stepId: navigationStepId, completed: false, known: true }
      : { stepId: navigationStepId, completed: navigationStepId ? navigationSource.completed === true : false };
    return {
      version: STATE_VERSION,
      welcomeSeen: source.welcomeSeen === true,
      entryChoice,
      step,
      availabilityGuided: source.availabilityGuided === true || step !== STEP_AVAILABILITY,
      openingChoice,
      informationSeen: source.informationSeen === true || [STEP_GROUP_CHAT, STEP_GROUP_CHAT_OPEN].includes(step),
      navigationProgress,
      completed: source.completed === true,
      ...onboardingProgress.normalizeProgress(source, { fallbackMode: progressMode })
    };
  }

  function initialStateForStorage({ hasStoredState, storedState, firstRunCompleted }) {
    if (hasStoredState) {
      const progressMode = onboardingProgress.hasProgress(storedState) ? "pending" : "legacy";
      return normalizeState(storedState, { progressMode });
    }
    if (firstRunCompleted) {
      const progress = onboardingProgress.createProgress();
      return normalizeState({
        ...DEFAULT_STATE,
        welcomeSeen: false,
        entryChoice: "",
        completed: false,
        ...progress,
        tourSteps: { ...progress.tourSteps, language: "completed" }
      });
    }
    return normalizeState({
      ...DEFAULT_STATE,
      welcomeSeen: true,
      entryChoice: "dismissed",
      completed: true,
      ...onboardingProgress.createProgress("legacy")
    });
  }

  function firstTimeMapState(value) {
    const progress = normalizeState(value);
    return progress.completed !== true
      && progress.tourStatus === "pending"
      && progress.tourSteps.language === "completed";
  }

  function resolveTourResumeContext(value, { replayStepIndex = -1 } = {}) {
    const replayModule = Number.isInteger(replayStepIndex) ? WALKTHROUGH_MODULES[replayStepIndex] : "";
    if (["newsfeed", "messages"].includes(replayModule)) {
      return { mode: "replay", module: replayModule };
    }
    const progress = normalizeState(value);
    if (firstTimeMapState(progress)
      && progress.welcomeSeen === true
      && FIRST_TIME_MAP_MODULES.includes(progress.entryChoice)) {
      return { mode: "first-time", module: progress.entryChoice };
    }
    return null;
  }

  function resumeContextForWalkthroughExitIntent(value, snapshot = {}, { replayStepIndex = -1 } = {}) {
    const context = resolveTourResumeContext(value, { replayStepIndex });
    if (!context) return null;
    const activeStatuses = new Set(["RUNNING", "WAITING_FOR_TARGET", "WAITING_FOR_ACTION", "VERIFYING", "PAUSED", "BLOCKED"]);
    if (!activeStatuses.has(snapshot?.status)) return null;
    if (context.module === "messages" && snapshot?.guideId === GROUP_CHAT_GUIDE_ID) return context;
    if (context.mode === "first-time" && context.module === "newsfeed" && snapshot?.guideId === NEWSFEED_GUIDE_ID) return context;
    return null;
  }

  function resumeContextForWalkthroughExit(value, snapshot = {}, { replayStepIndex = -1 } = {}) {
    const context = resolveTourResumeContext(value, { replayStepIndex });
    if (!context) return null;
    if (context.module === "messages"
      && snapshot?.guideId === GROUP_CHAT_GUIDE_ID
      && snapshot?.status === "PAUSED"
      && snapshot?.reason === "deferred") return context;
    if (context.mode !== "first-time") return null;
    if (context.module === "newsfeed"
      && snapshot?.guideId === NEWSFEED_GUIDE_ID
      && snapshot?.status === "PAUSED"
      && snapshot?.reason === "deferred") return context;
    if (context.module === "navigation"
      && snapshot?.guideId === `pointer:${NAVIGATION_POINTER_ID}`
      && snapshot?.status === "CANCELLED") return context;
    return null;
  }

  function replayIndexForResume(value) {
    if (value?.pending !== true || value?.mode !== "replay" || !["newsfeed", "messages"].includes(value?.module)) return -1;
    return WALKTHROUGH_MODULES.indexOf(value.module);
  }

  function beginFirstTimeMapModule(value, moduleId) {
    const progress = normalizeState(value);
    if (!firstTimeMapState(progress) || !FIRST_TIME_MAP_MODULES.includes(moduleId)) return progress;
    const tourSteps = { ...progress.tourSteps };
    if (["newsfeed", "messages"].includes(moduleId) && tourSteps[moduleId] === "pending") {
      tourSteps[moduleId] = "active";
    }
    return {
      ...progress,
      welcomeSeen: true,
      entryChoice: moduleId,
      completed: false,
      tourStatus: "pending",
      tourStep: "",
      tourSteps
    };
  }

  function returnToFirstTimeMap(value, moduleId, moduleStatus = "active") {
    const progress = normalizeState(value);
    if (!firstTimeMapState(progress) || !FIRST_TIME_MAP_MODULES.includes(moduleId)) return progress;
    const tourSteps = { ...progress.tourSteps };
    if (["newsfeed", "messages"].includes(moduleId)) {
      const current = tourSteps[moduleId];
      const preserveFinished = ["completed", "known"].includes(current) && moduleStatus === "active";
      if (!preserveFinished && ["active", "completed", "known"].includes(moduleStatus)) {
        tourSteps[moduleId] = moduleStatus;
      }
    }
    return resolveFirstTimeMap({
      ...progress,
      welcomeSeen: false,
      entryChoice: "",
      completed: false,
      tourStatus: "pending",
      tourStep: "",
      tourSteps
    });
  }

  function deferredGuideBlocksFirstTimeMap(value, snapshot = {}) {
    if (firstTimeMapState(value)
      && snapshot?.status === "PAUSED"
      && ["deferred", "restored"].includes(snapshot?.reason)) return false;
    return guideSnapshotActive(snapshot);
  }

  function firstTimeMapExternalGuideActive(value) {
    const progress = normalizeState(value);
    return firstTimeMapState(progress)
      && progress.welcomeSeen === true
      && ["newsfeed", "navigation"].includes(progress.entryChoice);
  }

  function firstTimeMapWalkthroughResult(snapshot = {}) {
    if (snapshot?.status === "COMPLETED" && snapshot?.uiDismissed === true) return "completed";
    if (snapshot?.status === "CANCELLED" && snapshot?.step?.expectedAction === "handoff") return "completed";
    if (snapshot?.status === "CANCELLED") return "active";
    if (snapshot?.status === "PAUSED" && ["deferred", "restored"].includes(snapshot?.reason)) return "active";
    return "";
  }

  function shouldCancelDeferredGuideOnExploreLater(snapshot = {}) {
    return snapshot?.status === "PAUSED" && ["deferred", "restored"].includes(snapshot?.reason);
  }

  function firstTimeMapHasProgress(value) {
    const progress = normalizeState(value);
    return ["newsfeed", "messages"].some(id => progress.tourSteps[id] !== "pending")
      || Boolean(progress.navigationProgress.stepId);
  }

  function firstTimeMapRequiresNewsfeed(value, context = {}) {
    if (!firstTimeMapState(value) || !firstTimeMapHasProgress(value)) return false;
    return !(context?.area === "newsfeed" && context?.view === "feed");
  }

  function resolveReturnToNewsfeedTarget(ui) {
    const result = ui?.target?.("navigation.backButton");
    return result?.verified && result.element?.isConnected === true ? result.element : null;
  }

  function firstTimeMapProgressRefreshNeeded(value, snapshot = {}) {
    const progress = normalizeState(value);
    return firstTimeMapState(progress)
      && progress.welcomeSeen === false
      && progress.tourSteps.newsfeed !== "pending"
      && snapshot?.guideId === NEWSFEED_GUIDE_ID
      && snapshot?.status === "PAUSED"
      && snapshot?.reason === "restored"
      && Number.isInteger(snapshot?.stepIndex)
      && snapshot.stepIndex >= 0;
  }

  function newsfeedMapProgress(value, snapshot = {}) {
    const progress = normalizeState(value);
    const moduleStatus = progress.tourSteps.newsfeed;
    const total = snapshot?.guideId === NEWSFEED_GUIDE_ID && Array.isArray(snapshot?.guide?.steps)
      ? snapshot.guide.steps.length
      : 11;
    if (moduleStatus === "known") return { status: "known", current: total, total };
    if (moduleStatus === "completed") return { status: "completed", current: total, total };
    if (moduleStatus === "pending") return { status: "not-started", current: 0, total };
    const current = snapshot?.guideId === NEWSFEED_GUIDE_ID && Number.isInteger(snapshot?.stepIndex) && snapshot.stepIndex >= 0
      ? Math.min(snapshot.stepIndex + 1, total)
      : 1;
    return { status: "continue", current, total };
  }

  function messagesMapProgress(value) {
    const progress = normalizeState(value);
    const moduleStatus = progress.tourSteps.messages;
    if (moduleStatus === "known") return { status: "known", current: 5, total: 5 };
    if (moduleStatus === "completed") return { status: "completed", current: 5, total: 5 };
    if (moduleStatus === "pending") return { status: "not-started", current: 0, total: 5 };
    const milestoneByStep = {
      [STEP_AVAILABILITY]: 1,
      [STEP_CLASSES]: 2,
      [STEP_OPENING]: 3,
      [STEP_WAIT_CONVERSATION]: 3,
      [STEP_INFORMATION]: 4,
      [STEP_GROUP_CHAT]: 5,
      [STEP_GROUP_CHAT_OPEN]: 5
    };
    return { status: "continue", current: milestoneByStep[progress.step] || 1, total: 5 };
  }

  function navigationMapProgress(value) {
    const progress = normalizeState(value);
    const stepId = progress.navigationProgress.stepId;
    if (progress.navigationProgress.known === true) {
      return { status: "known", current: NAVIGATION_STEP_IDS.length, total: NAVIGATION_STEP_IDS.length };
    }
    if (!stepId) return { status: "not-started", current: 0, total: NAVIGATION_STEP_IDS.length };
    const current = NAVIGATION_STEP_IDS.indexOf(stepId) + 1;
    if (progress.navigationProgress.completed === true) {
      return { status: "completed", current: NAVIGATION_STEP_IDS.length, total: NAVIGATION_STEP_IDS.length };
    }
    return { status: "continue", current, total: NAVIGATION_STEP_IDS.length };
  }

  function navigationProgressFromSnapshot(snapshot = {}, fallback = { stepId: "", completed: false }) {
    if (snapshot?.guideId !== `pointer:${NAVIGATION_POINTER_ID}` || !NAVIGATION_STEP_IDS.includes(snapshot?.stepId)) {
      return { ...fallback };
    }
    return {
      stepId: snapshot.stepId,
      completed: snapshot.status === "COMPLETED"
    };
  }

  function firstTimeMapResolved(value) {
    const progress = normalizeState(value);
    const newsfeedResolved = ["completed", "known"].includes(progress.tourSteps.newsfeed);
    const messagesResolved = ["completed", "known"].includes(progress.tourSteps.messages);
    const navigationResolved = progress.navigationProgress.completed === true || progress.navigationProgress.known === true;
    return newsfeedResolved && messagesResolved && navigationResolved;
  }

  function resolveFirstTimeMap(value) {
    const progress = normalizeState(value);
    if (!firstTimeMapResolved(progress)) return progress;
    return {
      ...progress,
      welcomeSeen: true,
      entryChoice: "",
      completed: true,
      tourStatus: "completed",
      tourStep: ""
    };
  }

  function markFirstTimeMapKnown(value, moduleId) {
    const progress = normalizeState(value);
    if (!FIRST_TIME_MAP_MODULES.includes(moduleId)) return progress;
    let next = {
      ...progress,
      welcomeSeen: false,
      entryChoice: "",
      completed: false,
      tourStatus: "pending",
      tourStep: ""
    };
    if (["newsfeed", "messages"].includes(moduleId)) {
      next = { ...next, tourSteps: { ...next.tourSteps, [moduleId]: "known" } };
    } else {
      next = {
        ...next,
        navigationProgress: { ...next.navigationProgress, completed: false, known: true }
      };
    }
    return resolveFirstTimeMap(next);
  }

  function shouldContinueFirstTimeMap(value) {
    const progress = normalizeState(value);
    if (progress.tourStatus === "legacy-completed") return false;
    if (progress.completed === true && progress.tourStatus === "completed") return false;
    return progress.tourSteps.language === "completed" && !firstTimeMapResolved(progress);
  }

  function resumeFirstTimeMap(value) {
    const progress = normalizeState(value);
    if (!shouldContinueFirstTimeMap(progress)) return progress;
    if (firstTimeMapState(progress)
      && progress.welcomeSeen === true
      && FIRST_TIME_MAP_MODULES.includes(progress.entryChoice)) return progress;
    return {
      ...progress,
      welcomeSeen: false,
      entryChoice: "",
      completed: false,
      tourStatus: "pending",
      tourStep: ""
    };
  }

  function availabilityView({ toggleVisible = false, toggleChecked = false, setAvailabilityVisible = false } = {}) {
    if (toggleVisible) return toggleChecked ? "already-on" : "toggle-off";
    if (setAvailabilityVisible) return "choose-set-availability";
    return "open-tools";
  }

  function availabilityCompletionState({ toggleVisible = false, toggleChecked = false, pending = false } = {}) {
    if (toggleVisible) {
      return { pending: Boolean(toggleChecked), shouldAdvance: false };
    }
    return { pending: Boolean(pending), shouldAdvance: Boolean(pending) };
  }

  function openingDraftForLanguage(language, drafts = {}) {
    return drafts[language] || drafts.en || "";
  }

  function cleanText(value) {
    return String(value ?? "").replace(/\s+/gu, " ").trim();
  }

  function classOpeningReady({ classTabsVisible = false, editorValid = false } = {}) {
    return Boolean(classTabsVisible && editorValid);
  }

  function guideSnapshotActive(snapshot) {
    return ["RUNNING", "WAITING_FOR_TARGET", "WAITING_FOR_ACTION", "VERIFYING", "STEP_COMPLETE", "PAUSED", "BLOCKED"]
      .includes(snapshot?.status);
  }

  function classStepDestination(classState) {
    return classState?.verified === true && classState.active === true ? STEP_OPENING : STEP_CLASSES;
  }

  function classesInstructionState({ classActive = false, toggleExpanded = "", classListVisible = false } = {}) {
    if (classActive === true) return "active";
    if (toggleExpanded === "true") return classListVisible ? "choose-class" : "waiting-list";
    return "open-classes";
  }

  function shouldHoldAudienceClassRecovery({
    audienceIntroStage = "",
    audienceIntroClassTitle = "",
    audienceTabTransitionPending = false
  } = {}) {
    if (!audienceIntroStage || !audienceIntroClassTitle) return false;
    return audienceTabTransitionPending === true || audienceIntroStage !== "done";
  }

  function nextAudienceIntroStage(stage, selectedAudience) {
    const current = [
      "students",
      "guardians",
      "guardians-info",
      "everyone",
      "everyone-info",
      "return-students",
      "done"
    ].includes(stage)
      ? stage
      : "students";
    if (current === "guardians" && selectedAudience === "guardians") return "guardians-info";
    if (current === "everyone" && selectedAudience === "everyone") return "everyone-info";
    if (current === "return-students" && selectedAudience === "students") return "done";
    return current;
  }

  function groupChatCompletionAllowed({ completed = false, dialogOpen = false } = {}) {
    return completed !== true && dialogOpen === true;
  }

  function informationStepComplete(result = {}) {
    return result?.phase === "review-complete-closed";
  }

  function audienceConversationReminderState({ conversation, completed = false, snoozedKeys = new Set() } = {}) {
    if (completed !== true || conversation?.verified !== true || conversation.empty !== true || !conversation.key) {
      return { show: false, key: "", audience: conversation?.audience || "" };
    }
    if (snoozedKeys?.has?.(conversation.key)) {
      return { show: false, key: conversation.key, audience: conversation.audience || "" };
    }
    return { show: true, key: conversation.key, audience: conversation.audience || "" };
  }

  function groupChatTaskCompletionAllowed(snapshot = {}, activeRunStartedAt = 0) {
    return Number(activeRunStartedAt) > 0
      && Number(snapshot?.startedAt) === Number(activeRunStartedAt)
      && snapshot?.guideId === GROUP_CHAT_GUIDE_ID
      && snapshot?.stepId === GROUP_CHAT_GUIDE_FINAL_STEP
      && ["CANCELLED", "COMPLETED"].includes(snapshot?.status);
  }

  function groupChatHelpHandoffActive(value) {
    const progress = normalizeState(value);
    return firstTimeMapState(progress)
      && progress.welcomeSeen === true
      && progress.entryChoice === "messages"
      && progress.step === STEP_GROUP_CHAT_OPEN
      && progress.tourSteps.messages === "completed";
  }

  function createController({
    doc,
    view = root,
    storage = root.chrome?.storage?.local,
    ui = hub.ui,
    waitChatter = hub.waitChatter,
    walkthrough = hub.walkthrough,
    i18n = hub.i18n,
    tourResume = hub.tourResume
  } = {}) {
    let mounted = false;
    let stateLoaded = false;
    let state = normalizeState();
    let card = null;
    let spotlight = null;
    let spotlightTarget = null;
    let lastView = "";
    let snoozedArea = "";
    let currentArea = "";
    let availabilityListenerBound = false;
    let availabilityCompletionPending = false;
    let startConversationListenerBound = false;
    let informationButtonListenerBound = false;
    let successTimer = null;
    let openingInserted = false;
    let openingStatus = "";
    let pendingStartConversationCard = null;
    let activeStartConversationCard = null;
    let audienceIntroStage = "";
    let audienceIntroClassTitle = "";
    let audienceInformationTargetSeen = false;
    let audienceTabTransitionPending = false;
    let audienceTabTarget = null;
    let audienceTabHandler = null;
    const audienceInitiateSnoozedKeys = new Set();
    let audienceInitiateOpeningKey = "";
    let audienceEmptyCandidateKey = "";
    let audienceEmptyCandidateCount = 0;
    let audienceReminderTimer = null;
    let replayStepIndex = -1;
    let replayMessageFlowActive = false;
    let replaySavedState = null;
    let removeLanguageChange = null;
    let mapTransitionPending = false;
    let groupChatGuideStartedAt = 0;
    const startConversationCardsSeen = new WeakSet();

    const tr = (key, vars = {}) => i18n?.t?.(key, vars) || key;

    function visible(element) {
      if (!(element instanceof Element) || !element.isConnected) return false;
      if (element.hidden || element.getAttribute("aria-hidden") === "true") return false;
      const style = view.getComputedStyle?.(element);
      if (style && (style.display === "none" || style.visibility === "hidden")) return false;
      const rect = element.getBoundingClientRect?.();
      return Boolean(rect && rect.width > 0 && rect.height > 0);
    }

    function waitChatterVisible() {
      return Boolean(waitChatter?.snapshot?.()?.visible);
    }

    function guideActive() {
      return guideSnapshotActive(walkthrough?.snapshot?.());
    }

    function currentTourResumeContext() {
      return resolveTourResumeContext(state, { replayStepIndex });
    }

    async function markTourResume(context = currentTourResumeContext()) {
      if (!context) return false;
      return await tourResume?.mark?.(context) === true;
    }

    async function prepareTourResumeExit(snapshot = walkthrough?.snapshot?.()) {
      const context = resumeContextForWalkthroughExitIntent(state, snapshot, { replayStepIndex });
      if (!context) return false;
      return await markTourResume(context);
    }

    async function clearTourResumeIfMatches(context) {
      if (!context || typeof tourResume?.read !== "function") return false;
      const saved = await tourResume.read();
      if (saved?.pending !== true || saved.mode !== context.mode || saved.module !== context.module) return false;
      return await tourResume.clear?.() === true;
    }

    async function exitMessagesModuleForResume() {
      const context = currentTourResumeContext();
      if (!context || context.module !== "messages") return false;
      await markTourResume(context);
      if (context.mode === "replay") {
        stopReplay();
        return true;
      }
      return await returnMapSelection("messages", "active");
    }

    function messagesContext() {
      const context = ui?.detectContext?.() || { area: "unknown", view: "unknown", confidence: "none" };
      return context;
    }

    async function persist(next = state) {
      state = normalizeState(next);
      if (replayMessageFlowActive) return state;
      try { await storage?.set?.({ [STATE_KEY]: state }); } catch (_) { /* in-memory state remains usable */ }
      return state;
    }

    async function load() {
      try {
        const result = await storage?.get?.(STATE_KEY);
        const hasStoredState = Boolean(result && Object.prototype.hasOwnProperty.call(result, STATE_KEY));
        const storedState = hasStoredState ? result[STATE_KEY] : null;
        state = initialStateForStorage({
          hasStoredState,
          storedState,
          firstRunCompleted: hub.languageIntro?.snapshot?.().firstRunCompleted === true
        });
        if (!hasStoredState) await storage?.set?.({ [STATE_KEY]: state });
      } catch (_) {
        state = initialStateForStorage({ hasStoredState: false, storedState: null, firstRunCompleted: false });
      }
      stateLoaded = true;
    }

    function clearSuccessTimer() {
      if (successTimer !== null) view.clearTimeout(successTimer);
      successTimer = null;
    }

    function clearAudienceReminderTimer() {
      if (audienceReminderTimer !== null) view.clearTimeout(audienceReminderTimer);
      audienceReminderTimer = null;
    }

    function resetAudienceEmptyCandidate() {
      audienceEmptyCandidateKey = "";
      audienceEmptyCandidateCount = 0;
      clearAudienceReminderTimer();
    }

    function scheduleAudienceReminderReconcile() {
      if (audienceReminderTimer !== null) return;
      audienceReminderTimer = view.setTimeout(() => {
        audienceReminderTimer = null;
        reconcile();
      }, 120);
    }

    function removeSpotlight() {
      spotlight?.remove();
      spotlight = null;
      spotlightTarget = null;
    }

    function clearAudienceTabAdvance() {
      if (audienceTabTarget && audienceTabHandler) {
        audienceTabTarget.removeEventListener("click", audienceTabHandler);
      }
      audienceTabTarget = null;
      audienceTabHandler = null;
    }

    function bindAudienceTabAdvance(target, audience) {
      clearAudienceTabAdvance();
      if (!visible(target)) return;
      audienceTabTarget = target;
      audienceTabHandler = () => {
        const next = nextAudienceIntroStage(audienceIntroStage, audience);
        if (next === audienceIntroStage) return;
        audienceTabTransitionPending = true;
        audienceIntroStage = next;
        removeCard();
        view.setTimeout(() => reconcile(), 0);
      };
      audienceTabTarget.addEventListener("click", audienceTabHandler);
    }

    function removeCard() {
      clearAudienceTabAdvance();
      card?.remove();
      card = null;
      lastView = "";
      removeSpotlight();
    }

    function ensureSpotlight(target) {
      if (!visible(target)) {
        removeSpotlight();
        return;
      }
      if (!spotlight?.isConnected) {
        spotlight = doc.createElement("div");
        spotlight.id = SPOTLIGHT_ID;
        spotlight.dataset.psqmUi = "message-onboarding-spotlight";
        spotlight.setAttribute("aria-hidden", "true");
        doc.body.append(spotlight);
      }
      spotlightTarget = target;
      const rect = target.getBoundingClientRect();
      const gap = 5;
      spotlight.style.left = `${Math.max(2, rect.left - gap)}px`;
      spotlight.style.top = `${Math.max(2, rect.top - gap)}px`;
      spotlight.style.width = `${Math.max(4, rect.width + gap * 2)}px`;
      spotlight.style.height = `${Math.max(4, rect.height + gap * 2)}px`;
    }

    function positionCard(target = null, { preferRight = false, preferLeft = false } = {}) {
      if (!card?.isConnected) return;
      const vw = view.innerWidth || doc.documentElement.clientWidth || 1024;
      const vh = view.innerHeight || doc.documentElement.clientHeight || 768;
      const margin = 14;
      const gap = 12;
      const rect = card.getBoundingClientRect();

      if (!visible(target)) {
        card.style.left = `${Math.max(margin, (vw - rect.width) / 2)}px`;
        card.style.top = `${Math.max(margin, Math.min(88, vh - rect.height - margin))}px`;
        return;
      }

      const t = target.getBoundingClientRect();
      const below = { left: t.left, top: t.bottom + gap };
      const right = { left: t.right + gap, top: t.top };
      const left = { left: t.left - rect.width - gap, top: t.top };
      const above = { left: t.left, top: t.top - rect.height - gap };
      const bySide = { left, below, above, right };
      const sides = preferLeft
        ? ["left", "below", "above", "right"]
        : preferRight ? ["right", "below", "above", "left"] : ["below", "right", "left", "above"];
      const candidates = sides.map(side => bySide[side]);

      const clamp = candidate => ({
        left: Math.min(Math.max(margin, candidate.left), Math.max(margin, vw - rect.width - margin)),
        top: Math.min(Math.max(margin, candidate.top), Math.max(margin, vh - rect.height - margin))
      });
      const overlap = candidate => {
        const c = { left: candidate.left, top: candidate.top, right: candidate.left + rect.width, bottom: candidate.top + rect.height };
        return Math.max(0, Math.min(c.right, t.right) - Math.max(c.left, t.left))
          * Math.max(0, Math.min(c.bottom, t.bottom) - Math.max(c.top, t.top));
      };
      const placed = candidates
        .map((candidate, index) => {
          const point = clamp(candidate);
          return { ...point, overlap: overlap(point), order: index };
        })
        .sort((a, b) => a.overlap - b.overlap || a.order - b.order)[0];

      card.style.left = `${placed.left}px`;
      card.style.top = `${placed.top}px`;
    }

    function button(label, className, onClick) {
      const el = doc.createElement("button");
      el.type = "button";
      el.className = className;
      el.textContent = label;
      el.addEventListener("click", onClick);
      return el;
    }

    function render(viewKey, {
      title,
      body,
      note = "",
      target = null,
      primary = null,
      secondary = null,
      actions: suppliedActions = null,
      closable = true,
      onClose = null,
      preferRight = false,
      preferLeft = false,
      pulseTarget = true
    } = {}) {
      if (lastView === viewKey && card?.isConnected) {
        if (pulseTarget) ensureSpotlight(target);
        else removeSpotlight();
        positionCard(target, { preferRight, preferLeft });
        return;
      }
      removeCard();

      card = doc.createElement("section");
      card.id = CARD_ID;
      card.dataset.psqmUi = "message-onboarding";
      card.lang = i18n?.language?.() === "vi" ? "vi" : "en";
      card.setAttribute("role", "dialog");
      card.setAttribute("aria-labelledby", `${CARD_ID}-title`);

      const header = doc.createElement("div");
      header.className = "psqm-message-onboarding__header";
      const heading = doc.createElement("h2");
      heading.id = `${CARD_ID}-title`;
      heading.textContent = title;
      header.append(heading);

      if (closable) {
        const close = button("×", "psqm-message-onboarding__close", async () => {
          activeStartConversationCard = null;
          if (typeof onClose === "function") {
            onClose();
            removeCard();
            return;
          }
          if (replayActive()) {
            const resumeContext = currentTourResumeContext();
            if (resumeContext) {
              await markTourResume(resumeContext);
              stopReplay();
              return;
            }
          }
          if (firstTimeMapState(state) && state.entryChoice === "messages") {
            await markTourResume({ mode: "first-time", module: "messages" });
            await returnMapSelection("messages", "active");
            removeCard();
            return;
          }
          if (!state.welcomeSeen) {
            void persist({ ...state, welcomeSeen: true, entryChoice: "dismissed" });
          }
          snoozedArea = currentArea || "unknown";
          removeCard();
        });
        close.setAttribute("aria-label", tr("common.close"));
        header.append(close);
      }

      const message = doc.createElement("p");
      message.className = "psqm-message-onboarding__body";
      message.textContent = body;
      card.append(header, message);

      if (note) {
        const noteElement = doc.createElement("p");
        noteElement.className = "psqm-message-onboarding__note";
        noteElement.textContent = note;
        card.append(noteElement);
      }

      const actionDefinitions = Array.isArray(suppliedActions)
        ? suppliedActions
        : [
          primary ? { ...primary, kind: "primary" } : null,
          secondary ? { ...secondary, kind: "secondary" } : null
        ].filter(Boolean);
      if (actionDefinitions.length) {
        const actions = doc.createElement("div");
        actions.className = "psqm-message-onboarding__actions";
        for (const action of actionDefinitions) {
          const className = action.kind === "primary"
            ? "psqm-message-onboarding__primary"
            : "psqm-message-onboarding__secondary";
          actions.append(button(action.label, className, action.action));
        }
        card.append(actions);
      }

      doc.body.append(card);
      lastView = viewKey;
      if (pulseTarget) ensureSpotlight(target);
      else removeSpotlight();
      positionCard(target, { preferRight, preferLeft });
    }

    function tourTarget(moduleId) {
      const targetKey = moduleId === "newsfeed"
        ? "newsfeed.navigation"
        : moduleId === "messages" ? "messages.navigation" : "";
      if (!targetKey) return null;
      const result = ui?.target?.(targetKey);
      return result?.verified && result.element?.isConnected ? result.element : null;
    }

    function showTourComplete(onDismissed) {
      render("tour-complete", {
        title: tr("firstTimeTour.completeTitle"),
        body: tr("firstTimeTour.completeBody"),
        closable: false
      });
      clearSuccessTimer();
      successTimer = view.setTimeout(() => {
        successTimer = null;
        removeCard();
        hub.help?.handleContextChange?.();
        hub.help?.showReturnCue?.();
        onDismissed?.();
      }, SUCCESS_MS);
    }

    async function finishTourModule(moduleStatus) {
      if (state.tourStatus !== "active" || !state.tourStep) return;
      const next = onboardingProgress.setModuleStatus(state, state.tourStep, moduleStatus);
      await persist({
        ...state,
        ...next,
        welcomeSeen: true,
        completed: next.tourStatus === "completed"
      });
      removeCard();
      if (next.tourStatus === "completed") {
        showTourComplete(() => hub.integrationBridge?.onOnboardingDecision?.("full-tour-complete"));
      }
      else reconcile();
    }

    async function skipEntireTour() {
      const next = onboardingProgress.skipTour(state);
      await persist({
        ...state,
        ...next,
        welcomeSeen: true,
        entryChoice: state.entryChoice || "dismissed",
        completed: true
      });
      await tourResume?.clear?.();
      removeCard();
      hub.help?.handleContextChange?.();
    }

    function renderTourStep() {
      const moduleId = state.tourStep;
      const index = WALKTHROUGH_MODULES.indexOf(moduleId);
      if (index < 0) {
        void skipEntireTour();
        return;
      }
      if (moduleId === "messages") {
        renderMessagesFlow();
        return;
      }
      render(`tour-${moduleId}`, {
        title: tr("firstTimeTour.title", {
          current: index + 1,
          total: WALKTHROUGH_MODULES.length
        }),
        body: tr(`firstTimeTour.${moduleId}Body`),
        target: tourTarget(moduleId),
        closable: false,
        actions: [
          {
            label: tr(moduleId === "review" ? "firstTimeTour.complete" : "common.continue"),
            kind: "primary",
            action: () => void finishTourModule("completed")
          },
          {
            label: tr("firstTimeTour.knowThis"),
            action: () => void finishTourModule("known")
          },
          {
            label: tr("firstTimeTour.skipTour"),
            action: () => void skipEntireTour()
          }
        ]
      });
    }

    function replayActive() {
      return replayStepIndex >= 0 && replayStepIndex < WALKTHROUGH_MODULES.length;
    }

    function beginReplayMessageFlow() {
      if (replayMessageFlowActive) return;
      replaySavedState = state;
      replayMessageFlowActive = true;
      state = normalizeState({
        ...state,
        entryChoice: "messages",
        step: STEP_AVAILABILITY,
        availabilityGuided: false,
        openingChoice: "",
        informationSeen: false,
        completed: false
      });
      pendingStartConversationCard = null;
      activeStartConversationCard = null;
      audienceIntroStage = "";
      audienceIntroClassTitle = "";
      audienceInformationTargetSeen = false;
      audienceTabTransitionPending = false;
      openingInserted = false;
      openingStatus = "";
    }

    function restoreReplayMessageState() {
      if (!replayMessageFlowActive) return;
      if (replaySavedState) state = replaySavedState;
      replaySavedState = null;
      replayMessageFlowActive = false;
      pendingStartConversationCard = null;
      activeStartConversationCard = null;
      audienceIntroStage = "";
      audienceIntroClassTitle = "";
      audienceInformationTargetSeen = false;
      audienceTabTransitionPending = false;
      openingInserted = false;
      openingStatus = "";
      unbindAvailabilityListener();
      hub.messageInformationPaneGuide?.reset?.();
      removeCard();
    }

    function stopReplay() {
      if (!replayActive()) return false;
      restoreReplayMessageState();
      replayStepIndex = -1;
      removeCard();
      hub.help?.handleContextChange?.();
      return true;
    }

    function advanceReplayStep() {
      if (!replayActive()) return false;
      restoreReplayMessageState();
      replayStepIndex += 1;
      removeCard();
      if (!replayActive()) {
        replayStepIndex = -1;
        showTourComplete();
      } else {
        reconcile();
      }
      return true;
    }

    function renderReplayStep() {
      const moduleId = WALKTHROUGH_MODULES[replayStepIndex];
      if (!moduleId) {
        stopReplay();
        return;
      }
      const replayModule = moduleId;
      if (replayModule === "messages") {
        beginReplayMessageFlow();
        renderMessagesFlow();
        return;
      }
      render(`replay-tour-${moduleId}`, {
        title: tr("firstTimeTour.title", {
          current: replayStepIndex + 1,
          total: WALKTHROUGH_MODULES.length
        }),
        body: tr(`firstTimeTour.${moduleId}Body`),
        target: tourTarget(moduleId),
        closable: false,
        actions: [
          {
            label: tr(moduleId === "review" ? "firstTimeTour.complete" : "common.continue"),
            kind: "primary",
            action: advanceReplayStep
          },
          {
            label: tr("firstTimeTour.knowThis"),
            action: advanceReplayStep
          },
          {
            label: tr("firstTimeTour.skipTour"),
            action: stopReplay
          }
        ]
      });
    }

    async function replayWalkthrough() {
      if (!mounted || !stateLoaded || hub.languageIntro?.blocksOtherOnboarding?.()) return false;
      if (shouldContinueFirstTimeMap(state)) {
        if (shouldCancelDeferredGuideOnExploreLater(walkthrough?.snapshot?.())) walkthrough?.cancel?.();
        clearSuccessTimer();
        await persist(resumeFirstTimeMap(state));
        snoozedArea = "";
        removeCard();
        reconcile();
        return true;
      }
      if (state.tourStatus === "active" || replayActive()) {
        reconcile();
        return true;
      }
      if (guideActive()) return true;
      clearSuccessTimer();
      await tourResume?.clear?.();
      replayStepIndex = 0;
      removeCard();
      reconcile();
      return true;
    }

    async function resumeTourModule(value) {
      if (!mounted || !stateLoaded || hub.languageIntro?.blocksOtherOnboarding?.()) return false;
      const resumeState = tourResume?.normalize?.(value) || value;
      if (resumeState?.pending !== true) return false;

      clearSuccessTimer();
      snoozedArea = "";

      if (resumeState.mode === "first-time") {
        if (!firstTimeMapState(state) || !FIRST_TIME_MAP_MODULES.includes(resumeState.module)) return false;
        if (resumeState.module === "newsfeed") {
          if (guideActive()) walkthrough?.cancel?.();
          return await chooseNewsfeed();
        }
        if (resumeState.module === "messages") {
          const guideState = walkthrough?.snapshot?.() || {};
          const resumeGroupChatSubstep = [STEP_GROUP_CHAT, STEP_GROUP_CHAT_OPEN].includes(state.step)
            && guideState.guideId === GROUP_CHAT_GUIDE_ID
            && guideState.status === "PAUSED"
            && ["deferred", "restored"].includes(guideState.reason);

          if (!resumeGroupChatSubstep && guideActive()) walkthrough?.cancel?.();

          await persist(beginFirstTimeMapModule(state, "messages"));
          snoozedArea = "";
          removeCard();

          if (resumeGroupChatSubstep) {
            const resumed = await walkthrough?.start?.(GROUP_CHAT_GUIDE_ID);
            if (resumed !== true) {
              await returnMapSelection("messages", "active");
              return false;
            }
          }

          await clearTourResumeIfMatches({ mode: "first-time", module: "messages" });
          reconcile();
          return true;
        }
        if (resumeState.module === "navigation") {
          if (guideActive()) walkthrough?.cancel?.();
          await persist({ ...state, navigationProgress: { stepId: "", completed: false } });
          return await chooseNavigation();
        }
        return false;
      }

      const replayIndex = replayIndexForResume(resumeState);
      if (replayIndex < 0 || !onboardingProgress.isReturning(state)) return false;
      if (guideActive()) walkthrough?.cancel?.();
      restoreReplayMessageState();
      replayStepIndex = replayIndex;
      removeCard();
      reconcile();
      await clearTourResumeIfMatches({ mode: "replay", module: resumeState.module });
      return true;
    }

    function mapSelectionActive(moduleId = "") {
      return firstTimeMapState(state)
        && state.welcomeSeen === true
        && FIRST_TIME_MAP_MODULES.includes(state.entryChoice)
        && (!moduleId || state.entryChoice === moduleId);
    }

    async function returnMapSelection(moduleId, moduleStatus = "active", statePatch = {}) {
      if (mapTransitionPending || !mapSelectionActive(moduleId)) return false;
      mapTransitionPending = true;
      try {
        await persist(returnToFirstTimeMap({ ...state, ...statePatch }, moduleId, moduleStatus));
        if (["completed", "known"].includes(moduleStatus)) {
          await clearTourResumeIfMatches({ mode: "first-time", module: moduleId });
        }
        snoozedArea = "";
        removeCard();
        hub.messageInformationPaneGuide?.reset?.();
        reconcile();
        return true;
      } finally {
        mapTransitionPending = false;
      }
    }

    async function handleWalkthroughState(snapshot) {
      if (mapTransitionPending || !snapshot) return;
      const resumeContext = resumeContextForWalkthroughExit(state, snapshot, { replayStepIndex });
      if (resumeContext?.module === "messages") {
        await markTourResume(resumeContext);
        if (resumeContext.mode === "replay") stopReplay();
        else await returnMapSelection("messages", "active");
        return;
      }
      if (firstTimeMapProgressRefreshNeeded(state, snapshot)) {
        lastView = "";
        reconcile();
        return;
      }
      const moduleId = state.entryChoice;
      if (!mapSelectionActive(moduleId) || !["newsfeed", "navigation"].includes(moduleId)) return;
      const expectedGuideId = moduleId === "newsfeed" ? NEWSFEED_GUIDE_ID : `pointer:${NAVIGATION_POINTER_ID}`;
      if (snapshot.guideId !== expectedGuideId) return;
      if (resumeContext) await markTourResume(resumeContext);
      const result = firstTimeMapWalkthroughResult(snapshot);
      if (moduleId === "navigation") {
        const navigationProgress = navigationProgressFromSnapshot(snapshot, state.navigationProgress);
        if (result) {
          await returnMapSelection(moduleId, result, { navigationProgress });
          return;
        }
        if (navigationProgress.stepId !== state.navigationProgress.stepId
          || navigationProgress.completed !== state.navigationProgress.completed) {
          void persist({ ...state, navigationProgress });
        }
        return;
      }
      if (result) await returnMapSelection(moduleId, result);
    }

    async function chooseNewsfeed() {
      const mapChoice = firstTimeMapState(state);
      await persist(mapChoice
        ? beginFirstTimeMapModule(state, "newsfeed")
        : { ...state, welcomeSeen: true, entryChoice: "newsfeed" });
      removeCard();
      const started = await walkthrough?.start?.(NEWSFEED_GUIDE_ID);
      if (!started && mapChoice) {
        await returnMapSelection("newsfeed", "active");
        return false;
      }
      if (started) {
        await clearTourResumeIfMatches({ mode: "first-time", module: "newsfeed" });
        await hub.newsfeedReadiness?.markAutoGuideSeen?.();
      }
      hub.newsfeedReadiness?.reconcile?.();
      return started === true;
    }

    async function chooseMessages() {
      const mapChoice = firstTimeMapState(state);
      await persist(mapChoice
        ? { ...beginFirstTimeMapModule(state, "messages"), step: STEP_AVAILABILITY }
        : { ...state, welcomeSeen: true, entryChoice: "messages", step: STEP_AVAILABILITY });
      await clearTourResumeIfMatches({ mode: "first-time", module: "messages" });
      snoozedArea = "";
      reconcile();
      return true;
    }

    async function chooseNavigation() {
      if (!firstTimeMapState(state)) return false;
      const resumeStepId = state.navigationProgress.completed ? "" : state.navigationProgress.stepId;
      await persist(beginFirstTimeMapModule(state, "navigation"));
      removeCard();
      const started = resumeStepId
        ? await walkthrough?.startPointerFromOnboardingAt?.(NAVIGATION_POINTER_ID, resumeStepId)
        : await walkthrough?.startPointerFromOnboarding?.(NAVIGATION_POINTER_ID);
      if (!started) {
        await returnMapSelection("navigation", "active");
        return false;
      }
      await clearTourResumeIfMatches({ mode: "first-time", module: "navigation" });
      return true;
    }

    async function exploreLater() {
      if (shouldCancelDeferredGuideOnExploreLater(walkthrough?.snapshot?.())) walkthrough?.cancel?.();
      await skipEntireTour();
      hub.integrationBridge?.onOnboardingDecision?.("explore-later");
    }

    async function advanceAvailability({ announce = true } = {}) {
      if (state.step !== STEP_AVAILABILITY) return;
      availabilityCompletionPending = false;
      audienceIntroStage = "";
      audienceIntroClassTitle = "";
      audienceInformationTargetSeen = false;
      audienceTabTransitionPending = false;
      await persist({ ...state, availabilityGuided: true, step: STEP_CLASSES });
      unbindAvailabilityListener();
      removeSpotlight();

      if (!announce) {
        removeCard();
        return;
      }

      render("availability-ready", {
        title: tr("messageOnboarding.availabilityReadyTitle"),
        body: tr("messageOnboarding.availabilityAlreadyOn"),
        closable: false
      });
      clearSuccessTimer();
      successTimer = view.setTimeout(() => {
        successTimer = null;
        removeCard();
        reconcile();
      }, SUCCESS_MS);
    }

    function handleAvailabilityChange(event) {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.id !== TOGGLE_ID) return;
      availabilityCompletionPending = target.checked === true;
      removeCard();
      removeSpotlight();
      reconcile();
    }

    function bindAvailabilityListener() {
      if (availabilityListenerBound) return;
      availabilityListenerBound = true;
      doc.addEventListener("change", handleAvailabilityChange, true);
    }

    function unbindAvailabilityListener() {
      if (!availabilityListenerBound) return;
      availabilityListenerBound = false;
      doc.removeEventListener("change", handleAvailabilityChange, true);
    }

    function handleStartConversationClick(event) {
      const audienceTab = event.target?.closest?.(
        "#class-group-tabs-tab-students, #class-group-tabs-tab-guardians, #class-group-tabs-tab-everyone"
      );
      if (audienceTab) {
        resetAudienceEmptyCandidate();
        if (audienceInitiateOpeningKey) {
          audienceInitiateOpeningKey = "";
          openingInserted = false;
          openingStatus = "";
          removeCard();
        }
        view.setTimeout(() => reconcile(), 0);
      }

      const card = ui?.messages?.startConversationCardFromTarget?.(event.target);
      if (!card?.verified || !card.element || startConversationCardsSeen.has(card.element)) return;
      pendingStartConversationCard = card.element;
      reconcile();
    }

    function bindStartConversationListener() {
      if (startConversationListenerBound) return;
      startConversationListenerBound = true;
      doc.addEventListener("click", handleStartConversationClick, true);
    }

    function unbindStartConversationListener() {
      if (!startConversationListenerBound) return;
      startConversationListenerBound = false;
      doc.removeEventListener("click", handleStartConversationClick, true);
    }

    function informationHandoffEligible() {
      return guidedMessagesFlowActive()
        && [STEP_CLASSES, STEP_OPENING, STEP_WAIT_CONVERSATION, STEP_INFORMATION].includes(state.step);
    }

    function handleInformationButtonClick(event) {
      if (event?.isTrusted === false || !informationHandoffEligible()) return;
      const target = informationButton();
      if (!target || !(event.target === target || target.contains?.(event.target))) return;

      // PowerHub removes or hides the class composer before the Group Information
      // panel satisfies its full DOM contract. Advance synchronously on the verified
      // native click so the transition cannot be mistaken for a lost class context.
      if (state.step !== STEP_INFORMATION) void persist({ ...state, step: STEP_INFORMATION });
      removeCard();
      view.setTimeout(() => reconcile(), 0);
    }

    function bindInformationButtonListener() {
      if (informationButtonListenerBound) return;
      informationButtonListenerBound = true;
      doc.addEventListener("click", handleInformationButtonClick, true);
    }

    function unbindInformationButtonListener() {
      if (!informationButtonListenerBound) return;
      informationButtonListenerBound = false;
      doc.removeEventListener("click", handleInformationButtonClick, true);
    }

    function progressLabel(baseKey, progress) {
      const status = progress.status === "completed"
        ? tr("messageOnboarding.progressCompleted")
        : progress.status === "known"
          ? tr("messageOnboarding.progressKnown")
          : progress.status === "continue"
            ? tr("messageOnboarding.progressContinue", { current: progress.current, total: progress.total })
            : tr("messageOnboarding.progressNotStarted");
      return `${tr(baseKey)} · ${status}`;
    }

    async function knowMapModule(moduleId) {
      if (!firstTimeMapState(state) || !FIRST_TIME_MAP_MODULES.includes(moduleId)) return false;
      const next = markFirstTimeMapKnown(state, moduleId);
      if (next.completed && shouldCancelDeferredGuideOnExploreLater(walkthrough?.snapshot?.())) walkthrough?.cancel?.();
      await persist(next);
      await clearTourResumeIfMatches({ mode: "first-time", module: moduleId });
      removeCard();
      if (next.completed) hub.help?.handleContextChange?.();
      else reconcile();
      return true;
    }

    function renderWelcome() {
      const walkthroughSnapshot = walkthrough?.snapshot?.() || {};
      const newsfeedProgress = newsfeedMapProgress(state, walkthroughSnapshot);
      const messagesProgress = messagesMapProgress(state);
      const navigationProgress = navigationMapProgress(state);
      const actions = [
        { label: progressLabel("messageOnboarding.newsfeedChoice", newsfeedProgress), kind: "primary", action: () => void chooseNewsfeed() },
        ...(newsfeedProgress.status === "completed" || newsfeedProgress.status === "known" ? [] : [
          { label: `${tr("messageOnboarding.newsfeedChoice")} · ${tr("messageOnboarding.knowThisAlready")}`, action: () => void knowMapModule("newsfeed") }
        ]),
        { label: progressLabel("messageOnboarding.messagesChoice", messagesProgress), action: () => void chooseMessages() },
        ...(messagesProgress.status === "completed" || messagesProgress.status === "known" ? [] : [
          { label: `${tr("messageOnboarding.messagesChoice")} · ${tr("messageOnboarding.knowThisAlready")}`, action: () => void knowMapModule("messages") }
        ]),
        { label: progressLabel("messageOnboarding.navigationChoice", navigationProgress), action: () => void chooseNavigation() },
        ...(navigationProgress.status === "completed" || navigationProgress.status === "known" ? [] : [
          { label: `${tr("messageOnboarding.navigationChoice")} · ${tr("messageOnboarding.knowThisAlready")}`, action: () => void knowMapModule("navigation") }
        ]),
        { label: tr("messageOnboarding.exploreLaterChoice"), action: () => void exploreLater() }
      ];
      render("welcome", {
        title: tr("messageOnboarding.welcomeTitle"),
        body: tr("messageOnboarding.welcomeBody"),
        closable: false,
        pulseTarget: false,
        actions
      });
    }

    function renderReturnToNewsfeed() {
      render("return-to-newsfeed", {
        title: tr("messageOnboarding.returnNewsfeedTitle"),
        body: tr("messageOnboarding.returnNewsfeedBody"),
        target: resolveReturnToNewsfeedTarget(ui),
        closable: false,
        actions: [
          { label: tr("messageOnboarding.exploreLaterChoice"), action: () => void exploreLater() }
        ]
      });
    }

    function renderMessagesNavigation() {
      const nav = doc.getElementById(MESSAGES_NAV_ID);
      render("open-messages", {
        title: tr("messageOnboarding.messagesSetupTitle"),
        body: tr("messageOnboarding.openMessages"),
        target: visible(nav) ? nav : null
      });
    }

    function messagingToolsButton() {
      const result = ui?.messages?.toolsButton?.();
      return result?.verified && visible(result.element) ? result.element : null;
    }

    function activeClassState() {
      const result = ui?.messages?.classConversationActive?.();
      return result && typeof result === "object"
        ? result
        : { active: false, verified: false, reason: "class-contract-unavailable" };
    }

    function activeClassComposer() {
      const classState = activeClassState();
      if (!classState.verified || !classState.active) return null;

      const region = classState.region || doc.getElementById(CONVERSATION_REGION_ID);
      if (!(region instanceof HTMLElement) || !region.isConnected) return null;

      const editor = region.querySelector(`#${MESSAGE_EDITOR_ID}`);
      const inspection = hub.conversationOpening?.inspect?.(editor);
      if (!inspection?.ok) return null;

      return { region, classTabs: classState.element || null, editor, inspection };
    }

    function startConversationCard() {
      const result = ui?.messages?.startConversationCard?.();
      return result?.verified && visible(result.element) ? result.element : null;
    }

    function guidedMessagesFlowActive() {
      return replayMessageFlowActive
        || (state.tourStatus === "active" && state.tourStep === "messages")
        || (!state.completed && state.welcomeSeen && state.entryChoice === "messages");
    }

    function messageLearningWalkthroughActive() {
      return replayMessageFlowActive
        || (state.tourStatus === "active" && state.tourStep === "messages")
        || mapSelectionActive("messages");
    }

    function beginAudienceInformationHandoff() {
      if (!messageLearningWalkthroughActive()
        || audienceIntroStage !== "done"
        || !audienceInformationTargetSeen) return false;

      audienceTabTransitionPending = false;
      if (state.step !== STEP_INFORMATION) void persist({ ...state, step: STEP_INFORMATION });
      renderInformationStep(messagesContext());
      return true;
    }

    function renderInitiateConversation(startCard = startConversationCard()) {
      if (!startCard) return false;
      render("initiate-conversation", {
        title: tr("messageOnboarding.initiateConversationTitle"),
        body: tr("messageOnboarding.initiateConversationBody"),
        note: tr("messageOnboarding.openingConversationNote"),
        target: startCard,
        preferRight: true,
        closable: false
      });
      return true;
    }

    function classAudienceTabs() {
      return {
        students: ui?.messages?.classStudentsTab?.(),
        guardians: ui?.messages?.classGuardiansTab?.(),
        everyone: ui?.messages?.classEveryoneTab?.()
      };
    }

    function renderAudienceIntro() {
      const tabs = classAudienceTabs();
      if (!audienceIntroStage) audienceIntroStage = "students";

      if (audienceIntroStage === "done") return true;

      if (audienceIntroStage === "students") {
        const target = tabs.students?.verified ? tabs.students.element : null;
        render("audience-students", {
          title: tr("messageOnboarding.audienceStudentsTitle"),
          body: tr("messageOnboarding.audienceStudentsBody"),
          target,
          closable: false,
          primary: {
            label: tr("common.continue"),
            action: () => {
              audienceIntroStage = "guardians";
              removeCard();
              reconcile();
            }
          }
        });
        return false;
      }

      if (audienceIntroStage === "guardians") {
        const target = tabs.guardians?.verified ? tabs.guardians.element : null;
        render("audience-guardians", {
          title: tr("messageOnboarding.audienceGuardiansTitle"),
          body: tr("messageOnboarding.audienceGuardiansActionBody"),
          target,
          closable: false
        });
        bindAudienceTabAdvance(target, "guardians");
        return false;
      }

      if (audienceIntroStage === "guardians-info") {
        const target = tabs.guardians?.verified ? tabs.guardians.element : null;
        if (!tabs.guardians?.verified || tabs.guardians.selected !== true) {
          removeCard();
          return false;
        }
        audienceTabTransitionPending = false;
        render("audience-guardians-info", {
          title: tr("messageOnboarding.audienceGuardiansTitle"),
          body: tr("messageOnboarding.audienceGuardiansBody"),
          target,
          closable: false,
          pulseTarget: false,
          primary: {
            label: tr("common.continue"),
            action: () => {
              audienceIntroStage = "everyone";
              removeCard();
              reconcile();
            }
          }
        });
        return false;
      }

      if (audienceIntroStage === "everyone") {
        const target = tabs.everyone?.verified ? tabs.everyone.element : null;
        render("audience-everyone", {
          title: tr("messageOnboarding.audienceEveryoneTitle"),
          body: tr("messageOnboarding.audienceEveryoneActionBody"),
          target,
          closable: false
        });
        bindAudienceTabAdvance(target, "everyone");
        return false;
      }

      if (audienceIntroStage === "everyone-info") {
        const target = tabs.everyone?.verified ? tabs.everyone.element : null;
        if (!tabs.everyone?.verified || tabs.everyone.selected !== true) {
          removeCard();
          return false;
        }
        audienceTabTransitionPending = false;
        render("audience-everyone-info", {
          title: tr("messageOnboarding.audienceEveryoneTitle"),
          body: tr("messageOnboarding.audienceEveryoneBody"),
          target,
          closable: false,
          pulseTarget: false,
          primary: {
            label: tr("common.continue"),
            action: () => {
              audienceIntroStage = "return-students";
              removeCard();
              reconcile();
            }
          }
        });
        return false;
      }

      const target = tabs.students?.verified ? tabs.students.element : null;
      render("audience-return-students", {
        title: tr("messageOnboarding.audienceReturnStudentsTitle"),
        body: tr("messageOnboarding.audienceReturnStudentsBody"),
        target,
        closable: false
      });
      bindAudienceTabAdvance(target, "students");
      return false;
    }

    function renderClasses() {
      const classState = activeClassState();
      if (classStepDestination(classState) === STEP_OPENING) {
        if (!audienceIntroClassTitle) {
          audienceIntroClassTitle = cleanText(classState.heading?.textContent);
        }

        // Keep verified forward evidence while the audience lesson is still
        // stable; PowerHub can hide this target before its next reconcile.
        if (messageLearningWalkthroughActive() && informationButton()) {
          audienceInformationTargetSeen = true;
        }

        if (audienceIntroStage !== "done" && !renderAudienceIntro()) return;

        if (beginAudienceInformationHandoff()) return;

        if (audienceIntroStage === "done") audienceTabTransitionPending = false;
        void persist({ ...state, step: STEP_OPENING });
        const startCard = startConversationCard();
        if (startCard) {
          renderInitiateConversation(startCard);
          return;
        }
        const active = activeClassComposer();
        if (active) renderOpening(active);
        else removeCard();
        return;
      }

      if (beginAudienceInformationHandoff()) return;

      if (shouldHoldAudienceClassRecovery({
        audienceIntroStage,
        audienceIntroClassTitle,
        audienceTabTransitionPending
      })) {
        removeCard();
        return;
      }

      const classesToggle = doc.getElementById(CLASSES_TOGGLE_ID);
      const classList = ui?.messages?.classList?.();
      const instruction = classesInstructionState({
        classActive: false,
        toggleExpanded: classesToggle?.getAttribute?.("aria-expanded") || "",
        classListVisible: Boolean(classList?.verified && visible(classList.element))
      });

      if (instruction === "waiting-list") {
        removeCard();
        return;
      }

      if (instruction === "choose-class") {
        render("classes-choose", {
          title: tr("messageOnboarding.classesChooseTitle"),
          body: tr("messageOnboarding.classesChooseBody"),
          target: classList?.verified ? classList.element : null,
          preferRight: true
        });
        return;
      }

      render("classes", {
        title: tr("messageOnboarding.classesTitle"),
        body: tr("messageOnboarding.classesBody"),
        target: visible(classesToggle) ? classesToggle : null,
        preferRight: true
      });
    }

    function finishAudienceOpeningSession({ snooze = true } = {}) {
      if (snooze && audienceInitiateOpeningKey) audienceInitiateSnoozedKeys.add(audienceInitiateOpeningKey);
      audienceInitiateOpeningKey = "";
      openingInserted = false;
      openingStatus = "";
      resetAudienceEmptyCandidate();
      removeCard();
    }

    async function chooseManualOpening() {
      if (state.completed && audienceInitiateOpeningKey) {
        finishAudienceOpeningSession();
        return;
      }
      openingInserted = false;
      openingStatus = "";
      await persist({ ...state, step: STEP_WAIT_CONVERSATION, openingChoice: "manual" });
      removeCard();
    }

    async function keepExistingDraft() {
      if (state.completed && audienceInitiateOpeningKey) {
        finishAudienceOpeningSession();
        return;
      }
      openingInserted = false;
      openingStatus = "";
      await persist({ ...state, step: STEP_WAIT_CONVERSATION, openingChoice: "existing-draft" });
      removeCard();
    }

    function undoAutomaticOpening(editor) {
      const result = hub.conversationOpening?.undo?.(editor);
      if (result?.ok) {
        openingInserted = false;
        openingStatus = "";
        removeCard();
        reconcile();
        return;
      }

      openingStatus = result?.reason === "CONTENT_CHANGED"
        ? tr("messageOnboarding.openingUndoChanged")
        : tr("messageOnboarding.openingUndoUnavailable");
      lastView = "";
      renderOpening(activeClassComposer());
    }

    function insertAutomaticOpening(active) {
      if (!active?.editor) return;

      const language = i18n?.language?.() || "en";
      const draft = openingDraftForLanguage(language, hub.conversationOpening?.drafts);
      const result = hub.conversationOpening?.insert?.(active.editor, draft);

      if (result?.ok) {
        openingInserted = true;
        openingStatus = "";
        lastView = "";
        renderOpening(activeClassComposer());
        return;
      }

      if (result?.reason === "EXISTING_DRAFT") {
        openingInserted = false;
        openingStatus = "";
        lastView = "";
        renderOpening(activeClassComposer());
        return;
      }

      openingStatus = tr("messageOnboarding.openingInsertFailed");
      lastView = "";
      renderOpening(activeClassComposer());
    }

    async function continueAfterAutomaticOpening() {
      if (state.completed && audienceInitiateOpeningKey) {
        finishAudienceOpeningSession();
        return;
      }
      openingInserted = false;
      openingStatus = "";
      await persist({ ...state, step: STEP_WAIT_CONVERSATION, openingChoice: "automatic" });
      removeCard();
    }

    function renderOpening(active = activeClassComposer()) {
      const startCard = startConversationCard();
      if (!activeStartConversationCard && !pendingStartConversationCard
        && startCard && !startConversationCardsSeen.has(startCard)) {
        renderInitiateConversation(startCard);
        return;
      }
      if (!active) {
        const classState = activeClassState();
        if (classState.verified && classState.active) {
          // Class is already open, but the editor is not ready yet.
          // Stay in STEP_OPENING and reuse the existing shared scheduler.
          removeCard();
          return;
        }

        openingInserted = false;
        openingStatus = "";
        void persist({ ...state, step: STEP_CLASSES });
        renderClasses();
        return;
      }

      const inspection = hub.conversationOpening?.inspect?.(active.editor);
      if (!inspection?.ok) {
        removeCard();
        return;
      }

      if (openingInserted) {
        render("opening-inserted", {
          title: tr("messageOnboarding.openingReadyTitle"),
          body: openingStatus || tr("messageOnboarding.openingReadyBody"),
          note: tr("messageOnboarding.openingConversationNote"),
          target: active.editor,
          onClose: state.completed && audienceInitiateOpeningKey
            ? () => finishAudienceOpeningSession()
            : null,
          primary: {
            label: tr("messageOnboarding.openingUndo"),
            action: () => undoAutomaticOpening(active.editor)
          },
          secondary: {
            label: tr("messageOnboarding.openingContinue"),
            action: () => void continueAfterAutomaticOpening()
          }
        });
        return;
      }

      if (inspection.hasMeaningfulText) {
        render("opening-existing-draft", {
          title: tr("messageOnboarding.openingExistingTitle"),
          body: openingStatus || tr("messageOnboarding.openingExistingBody"),
          note: tr("messageOnboarding.openingConversationNote"),
          target: active.editor,
          onClose: state.completed && audienceInitiateOpeningKey
            ? () => finishAudienceOpeningSession()
            : null,
          primary: {
            label: tr("messageOnboarding.openingKeepDraft"),
            action: () => void keepExistingDraft()
          }
        });
        return;
      }

      render("opening-choice", {
        title: tr("messageOnboarding.openingTitle"),
        body: openingStatus || tr("messageOnboarding.openingBody"),
        note: tr("messageOnboarding.openingConversationNote"),
        target: active.editor,
        onClose: state.completed && audienceInitiateOpeningKey
          ? () => finishAudienceOpeningSession()
          : null,
        primary: {
          label: tr("messageOnboarding.openingInsert"),
          action: () => insertAutomaticOpening(active)
        },
        secondary: {
          label: tr("messageOnboarding.openingWriteOwn"),
          action: () => void chooseManualOpening()
        }
      });
    }

    function renderStartedConversation(active = activeClassComposer()) {
      if (!active) return false;

      if (activeStartConversationCard) {
        const observed = ui?.messages?.startConversationCardFromTarget?.(activeStartConversationCard);
        const activeTitle = cleanText(active.region.querySelector("#conversationHeading")?.textContent);
        const cardTitle = cleanText(activeStartConversationCard.querySelector("button[data-testid='messenger-channel-preview']")?.textContent);
        if (observed?.verified && observed.element === activeStartConversationCard
          && cardTitle && activeTitle && cardTitle === activeTitle) {
          return true;
        }
        activeStartConversationCard = null;
        removeCard();
      }

      if (!pendingStartConversationCard) return false;

      const card = pendingStartConversationCard;
      const title = cleanText(card.querySelector("button[data-testid='messenger-channel-preview']")?.textContent);
      const activeTitle = cleanText(active.region.querySelector("#conversationHeading")?.textContent);
      if (!title || !activeTitle || title !== activeTitle) return false;

      const inspection = hub.conversationOpening?.inspect?.(active.editor);
      if (!inspection?.ok) return false;

      pendingStartConversationCard = null;
      activeStartConversationCard = card;
      startConversationCardsSeen.add(card);

      if (inspection.hasMeaningfulText) {
        render("opening-existing-draft", {
          title: tr("messageOnboarding.openingExistingTitle"),
          body: tr("messageOnboarding.openingExistingBody"),
          note: tr("messageOnboarding.openingConversationNote"),
          target: active.editor,
          primary: {
            label: tr("messageOnboarding.openingKeepDraft"),
            action: () => {
              activeStartConversationCard = null;
              if (guidedMessagesFlowActive()) void keepExistingDraft();
              else removeCard();
            }
          }
        });
        return true;
      }

      render("start-conversation-choice", {
        title: tr("messageOnboarding.openingTitle"),
        body: tr("messageOnboarding.openingBody"),
        note: tr("messageOnboarding.openingConversationNote"),
        target: active.editor,
        primary: {
          label: tr("messageOnboarding.openingInsert"),
          action: () => {
            activeStartConversationCard = null;
            if (guidedMessagesFlowActive()) insertAutomaticOpening(active);
            else {
              insertAutomaticOpening(active);
              removeCard();
            }
          }
        },
        secondary: {
          label: tr("messageOnboarding.openingWriteOwn"),
          action: () => {
            activeStartConversationCard = null;
            if (guidedMessagesFlowActive()) void chooseManualOpening();
            else removeCard();
          }
        }
      });
      return true;
    }

    function informationButton() {
      const result = ui?.messages?.informationButton?.();
      return result?.verified && visible(result.element) ? result.element : null;
    }

    function groupChatButton() {
      const result = ui?.messages?.groupChatButton?.();
      return result?.verified && visible(result.element) ? result.element : null;
    }

    function groupChatDialogOpen() {
      const result = ui?.messages?.groupChatDialog?.();
      return Boolean(result?.verified && visible(result.element));
    }

    async function startGroupChatGuide() {
      const started = await walkthrough?.start?.(GROUP_CHAT_GUIDE_ID);
      if (!started) return false;
      const startedState = walkthrough?.snapshot?.() || {};
      groupChatGuideStartedAt = startedState.guideId === GROUP_CHAT_GUIDE_ID
        ? Number(startedState.startedAt) || 0
        : 0;
      return true;
    }

    function renderGroupChatTaskResume() {
      render("group-chat-task-resume", {
        title: tr("guide.messageMulti.title"),
        body: tr("guide.messageMulti.description"),
        closable: false,
        primary: {
          label: tr("common.continue"),
          action: () => {
            removeCard();
            void startGroupChatGuide();
          }
        }
      });
    }

    async function completeAfterGroupChatOpen() {
      if (!groupChatCompletionAllowed({ completed: state.completed, dialogOpen: groupChatDialogOpen() })) return false;
      if (state.step !== STEP_GROUP_CHAT_OPEN) {
        await persist({ ...state, step: STEP_GROUP_CHAT_OPEN, informationSeen: true });
      }

      if (groupChatHelpHandoffActive(state)) {
        removeCard();
        return true;
      }

      const guideState = walkthrough?.snapshot?.() || {};
      if (guideState.guideId === GROUP_CHAT_GUIDE_ID && guideSnapshotActive(guideState)) {
        groupChatGuideStartedAt = Number(guideState.startedAt) || 0;
        removeCard();
        return true;
      }

      if (groupChatTaskCompletionAllowed(guideState, groupChatGuideStartedAt)) {
        groupChatGuideStartedAt = 0;
        return completeMessagesFlow();
      }

      if (guideState.guideId === GROUP_CHAT_GUIDE_ID
        && guideState.status === "CANCELLED"
        && Number(guideState.startedAt) === groupChatGuideStartedAt
        && groupChatGuideStartedAt > 0) {
        renderGroupChatTaskResume();
        return true;
      }

      const started = await startGroupChatGuide();
      if (started) {
        removeCard();
        return true;
      }

      renderGroupChatTaskResume();
      return false;
    }

    async function advanceToInformation() {
      if (state.step !== STEP_WAIT_CONVERSATION) return;
      await persist({ ...state, step: STEP_INFORMATION });
      removeCard();
      reconcile();
    }

    async function continueWithoutInformation() {
      if (state.step !== STEP_WAIT_CONVERSATION) return;
      await persist({ ...state, step: STEP_GROUP_CHAT, informationSeen: false });
      removeCard();
      reconcile();
    }

    function renderInformationWaiting() {
      render("information-waiting", {
        title: tr("messageOnboarding.informationTitle"),
        body: tr("messageOnboarding.informationUnavailableBody"),
        note: tr("messageOnboarding.informationNoSendNote"),
        closable: false,
        primary: {
          label: tr("messageOnboarding.informationContinueLearning"),
          action: () => void continueWithoutInformation()
        }
      });
    }

    async function advanceFromInformationReview() {
      if (state.step !== STEP_INFORMATION) return false;
      const context = messagesContext();
      const classState = ui?.messages?.classConversationActive?.();
      if (context.area !== "messages" || !classState?.verified || classState.active !== true) return false;

      hub.messageInformationPaneGuide?.reset?.();
      const persistPending = persist({ ...state, step: STEP_GROUP_CHAT, informationSeen: true });
      renderGroupChatStep(messagesContext());
      await persistPending;
      return true;
    }

    function renderInformationStep(context = messagesContext()) {
      const paneGuide = hub.messageInformationPaneGuide;
      const result = paneGuide?.reconcile?.({
        active: true,
        onReviewComplete: () => void advanceFromInformationReview(),
        onDismiss: () => void exitMessagesModuleForResume()
      });

      if (result?.phase === "reviewing") {
        removeCard();
        if (!state.informationSeen) {
          void persist({ ...state, informationSeen: true });
        }
        return;
      }

      if (informationStepComplete(result)) {
        void advanceFromInformationReview();
        return;
      }

      const target = informationButton();
      if (!target) {
        if (messageLearningWalkthroughActive()
          && audienceIntroStage === "done"
          && audienceInformationTargetSeen) {
          // This is the native handoff gap, not an unavailable feature.
          removeCard();
          return;
        }
        render("information-unavailable", {
          title: tr("messageOnboarding.informationTitle"),
          body: tr("messageOnboarding.informationUnavailableBody")
        });
        return;
      }

      render("information-button", {
        title: tr("messageOnboarding.informationTitle"),
        body: tr("messageOnboarding.informationBody"),
        target,
        preferLeft: true
      });
    }

    async function completeMessagesFlow() {
      if (replayMessageFlowActive) {
        advanceReplayStep();
        return true;
      }
      if (mapSelectionActive("messages")) {
        if (groupChatDialogOpen()) {
          await persist({
            ...state,
            step: STEP_GROUP_CHAT_OPEN,
            tourSteps: { ...state.tourSteps, messages: "completed" }
          });
          removeCard();
          hub.messageInformationPaneGuide?.reset?.();
          hub.help?.handleContextChange?.();
          hub.help?.open?.({ focus: false });
          return true;
        }
        await returnMapSelection("messages", "completed");
        return true;
      }
      if (state.tourStatus === "active" && state.tourStep === "messages") {
        await finishTourModule("completed");
        return true;
      }
      await persist({ ...state, completed: true });
      removeCard();
      hub.messageInformationPaneGuide?.reset?.();
      return true;
    }

    function renderGroupChatStep(context = messagesContext()) {
      if (context.area === "group-chat") {
        void completeAfterGroupChatOpen();
        removeCard();
        return;
      }

      const target = groupChatButton();
      if (!target) {
        render("group-chat-unavailable", {
          title: tr("messageOnboarding.groupChatTitle"),
          body: tr("messageOnboarding.groupChatUnavailableBody"),
          closable: false,
          primary: {
            label: tr("common.continue"),
            action: () => void completeMessagesFlow()
          }
        });
        return;
      }

      render("group-chat-button", {
        title: tr("messageOnboarding.groupChatTitle"),
        body: tr("messageOnboarding.groupChatBody"),
        target,
        preferLeft: true
      });
    }

    function renderAvailability() {
      bindAvailabilityListener();

      const toggle = doc.getElementById(TOGGLE_ID);
      const toggleVisible = visible(toggle);
      const completion = availabilityCompletionState({
        toggleVisible,
        toggleChecked: toggleVisible && toggle instanceof HTMLInputElement && toggle.checked,
        pending: availabilityCompletionPending
      });
      availabilityCompletionPending = completion.pending;

      if (completion.shouldAdvance) {
        void advanceAvailability({ announce: false }).then(() => reconcile());
        return;
      }

      if (toggleVisible && toggle instanceof HTMLInputElement && toggle.checked) {
        removeCard();
        removeSpotlight();
        return;
      }

      const setAvailability = doc.getElementById(SET_AVAILABILITY_ID);
      const stage = availabilityView({
        toggleVisible,
        toggleChecked: toggleVisible && Boolean(toggle?.checked),
        setAvailabilityVisible: visible(setAvailability)
      });

      if (stage === "toggle-off") {
        render("availability-toggle", {
          title: tr("messageOnboarding.availabilityTitle"),
          body: tr("messageOnboarding.availabilityOff"),
          target: toggle
        });
        return;
      }

      if (stage === "choose-set-availability") {
        render("availability-menu-item", {
          title: tr("messageOnboarding.availabilityTitle"),
          body: tr("messageOnboarding.chooseSetAvailability"),
          target: setAvailability
        });
        return;
      }

      const toolsButton = messagingToolsButton();
      render("availability-tools", {
        title: tr("messageOnboarding.availabilityTitle"),
        body: tr("messageOnboarding.openAvailability"),
        target: visible(toolsButton) ? toolsButton : null
      });
    }

    function currentAudienceConversation() {
      const result = ui?.messages?.classAudienceConversation?.();
      return result && typeof result === "object"
        ? result
        : { verified: false, audience: "", empty: false, started: false, key: "", reason: "audience-state-unavailable" };
    }

    function renderCompletedAudienceInitiate() {
      const conversation = currentAudienceConversation();
      const decision = audienceConversationReminderState({
        conversation,
        completed: state.completed,
        snoozedKeys: audienceInitiateSnoozedKeys
      });

      if (!decision.show) {
        if (audienceInitiateOpeningKey && audienceInitiateOpeningKey !== conversation.key) {
          audienceInitiateOpeningKey = "";
          openingInserted = false;
          openingStatus = "";
        }
        resetAudienceEmptyCandidate();
        return false;
      }

      if (audienceInitiateOpeningKey === decision.key) {
        resetAudienceEmptyCandidate();
        renderOpening(activeClassComposer());
        return true;
      }

      if (audienceEmptyCandidateKey !== decision.key) {
        audienceEmptyCandidateKey = decision.key;
        audienceEmptyCandidateCount = 1;
        removeCard();
        scheduleAudienceReminderReconcile();
        return true;
      }

      audienceEmptyCandidateCount += 1;
      if (audienceEmptyCandidateCount < 2) {
        removeCard();
        scheduleAudienceReminderReconcile();
        return true;
      }
      clearAudienceReminderTimer();

      render(`audience-initiate-${decision.audience}`, {
        title: tr("messageOnboarding.initiateConversationTitle"),
        body: tr("messageOnboarding.audienceInitiateConversationBody"),
        note: tr("messageOnboarding.openingConversationNote"),
        target: conversation.element?.isConnected ? conversation.element : conversation.editor,
        preferRight: true,
        onClose: () => {
          audienceInitiateSnoozedKeys.add(decision.key);
          resetAudienceEmptyCandidate();
        },
        primary: {
          label: tr("common.continue"),
          action: () => {
            audienceInitiateOpeningKey = decision.key;
            resetAudienceEmptyCandidate();
            removeCard();
            renderOpening(activeClassComposer());
          }
        }
      });
      return true;
    }

    function renderMessagesFlow() {
      const context = messagesContext();
      if (currentArea && currentArea !== context.area) snoozedArea = "";
      currentArea = context.area;

      if (renderStartedConversation()) return;
      if (pendingStartConversationCard) {
        removeCard();
        return;
      }

      if (state.step === STEP_INFORMATION) {
        unbindAvailabilityListener();
        renderInformationStep(context);
        return;
      }

      hub.messageInformationPaneGuide?.reset?.();

      if (state.step === STEP_GROUP_CHAT && ["messages", "group-chat"].includes(context.area)) {
        unbindAvailabilityListener();
        renderGroupChatStep(context);
        return;
      }

      if (state.step === STEP_GROUP_CHAT_OPEN) {
        unbindAvailabilityListener();
        if (context.area === "group-chat") void completeAfterGroupChatOpen();
        else void persist({ ...state, step: STEP_GROUP_CHAT });
        removeCard();
        return;
      }

      if (context.area !== "messages") {
        unbindAvailabilityListener();
        if (snoozedArea !== currentArea) renderMessagesNavigation();
        else removeCard();
        return;
      }

      if (snoozedArea === "messages") {
        removeCard();
        return;
      }

      if (state.step === STEP_AVAILABILITY) {
        renderAvailability();
        return;
      }

      unbindAvailabilityListener();

      if (state.step === STEP_CLASSES) {
        renderClasses();
        return;
      }

      if (state.step === STEP_OPENING) {
        renderOpening();
        return;
      }

      if (state.step === STEP_WAIT_CONVERSATION) {
        if (informationButton()) void advanceToInformation();
        else renderInformationWaiting();
      }
    }

    function reconcile() {
      if (!mounted || !stateLoaded) return;

      if (hub.languageIntro?.blocksOtherOnboarding?.()) {
        unbindAvailabilityListener();
        removeCard();
        hub.messageInformationPaneGuide?.hide?.();
        return;
      }

      if (successTimer !== null) return;

      const guideSnapshot = walkthrough?.snapshot?.();
      const guideBlocks = deferredGuideBlocksFirstTimeMap(state, guideSnapshot);
      if (waitChatterVisible() || guideBlocks) {
        removeCard();
        hub.messageInformationPaneGuide?.hide?.();
        return;
      }

      if (replayActive()) {
        unbindAvailabilityListener();
        hub.messageInformationPaneGuide?.hide?.();
        renderReplayStep();
        return;
      }

      if (state.tourStatus === "active") {
        unbindAvailabilityListener();
        hub.messageInformationPaneGuide?.hide?.();
        renderTourStep();
        return;
      }

      const context = messagesContext();
      if (currentArea && currentArea !== context.area) snoozedArea = "";
      currentArea = context.area;

      if (groupChatHelpHandoffActive(state)) {
        unbindAvailabilityListener();
        hub.messageInformationPaneGuide?.hide?.();
        if (context.area === "group-chat" && groupChatDialogOpen()) {
          removeCard();
          return;
        }
        hub.help?.close?.();
        void returnMapSelection("messages", "completed");
        return;
      }

      if (firstTimeMapState(state) && firstTimeMapResolved(state)) {
        void persist(resolveFirstTimeMap(state));
        removeCard();
        return;
      }

      if (firstTimeMapState(state) && !state.welcomeSeen) {
        unbindAvailabilityListener();
        hub.messageInformationPaneGuide?.hide?.();
        if (firstTimeMapRequiresNewsfeed(state, context)) renderReturnToNewsfeed();
        else renderWelcome();
        return;
      }

      if (renderStartedConversation()) return;
      if (pendingStartConversationCard) {
        removeCard();
        return;
      }

      if (mapTransitionPending || firstTimeMapExternalGuideActive(state)) {
        removeCard();
        return;
      }

      if (state.completed) {
        unbindAvailabilityListener();
        hub.messageInformationPaneGuide?.reset?.();
        if (context.area === "messages" && renderCompletedAudienceInitiate()) return;
        removeCard();
        return;
      }

      // Preserve the legacy direct-entry behavior, but never bypass the first-time map.
      if (context.area === "messages" && !state.welcomeSeen && !firstTimeMapState(state)) {
        void persist({ ...state, welcomeSeen: true, entryChoice: "messages", step: STEP_AVAILABILITY });
      }

      if (!state.welcomeSeen) {
        if (snoozedArea !== currentArea) renderWelcome();
        return;
      }

      renderMessagesFlow();
    }

    async function mount() {
      if (mounted) return;
      mounted = true;
      bindStartConversationListener();
      bindInformationButtonListener();
      removeLanguageChange = i18n?.onChange?.(() => {
        lastView = "";
        reconcile();
      }) || null;
      await load();
      reconcile();
      hub.newsfeedReadiness?.reconcile?.();
      hub.help?.handleContextChange?.();
    }

    function unmount() {
      if (!mounted) return;
      mounted = false;
      unbindStartConversationListener();
      unbindInformationButtonListener();
      pendingStartConversationCard = null;
      activeStartConversationCard = null;
      audienceIntroStage = "";
      audienceIntroClassTitle = "";
      audienceInformationTargetSeen = false;
      audienceTabTransitionPending = false;
      clearSuccessTimer();
      clearAudienceReminderTimer();
      audienceInitiateSnoozedKeys.clear();
      audienceInitiateOpeningKey = "";
      audienceEmptyCandidateKey = "";
      audienceEmptyCandidateCount = 0;
      restoreReplayMessageState();
      replayStepIndex = -1;
      removeLanguageChange?.();
      removeLanguageChange = null;
      unbindAvailabilityListener();
      removeCard();
    }

    function blocksContextHelpDiscovery(context) {
      if (hub.languageIntro?.blocksOtherOnboarding?.()) return true;
      if (!stateLoaded) return true;
      if (replayActive()) return true;
      if (state.tourStatus === "active") return true;
      if (!state.welcomeSeen) return true;
      return context?.area === "messages" && !state.completed;
    }

    function blocksNewsfeedAutoGuide() {
      if (hub.languageIntro?.blocksOtherOnboarding?.()) return true;
      if (!stateLoaded) return true;
      if (replayActive()) return true;
      if (state.tourStatus === "active") return true;
      if (state.completed && onboardingProgress.isReturning(state)) return true;
      return !state.welcomeSeen || state.entryChoice !== "newsfeed";
    }

    function quickPointerMode() {
      return stateLoaded && !replayActive() && state.completed && onboardingProgress.isReturning(state);
    }

    function snapshot() {
      return Object.freeze({
        mounted,
        stateLoaded,
        welcomeSeen: state.welcomeSeen,
        entryChoice: state.entryChoice,
        step: state.step,
        availabilityGuided: state.availabilityGuided,
        openingChoice: state.openingChoice,
        openingInserted,
        openingStatus,
        informationSeen: state.informationSeen,
        navigationProgress: Object.freeze({ ...state.navigationProgress }),
        completed: state.completed,
        onboardingVersion: state.onboardingVersion,
        tourStatus: state.tourStatus,
        tourStep: state.tourStep,
        tourSteps: Object.freeze({ ...state.tourSteps }),
        replayActive: replayActive(),
        replayStep: replayActive() ? WALKTHROUGH_MODULES[replayStepIndex] : "",
        replayMessageFlowActive,
        quickPointerMode: quickPointerMode(),
        firstTimeMapOpen: firstTimeMapState(state) && state.welcomeSeen === false,
        firstTimeMapSelection: mapSelectionActive(),
        firstTimeMapChoice: mapSelectionActive() ? state.entryChoice : "",
        cardVisible: Boolean(card?.isConnected),
        spotlightVisible: Boolean(spotlight?.isConnected),
        currentArea,
        availabilityListenerBound,
        startConversationListenerBound,
        informationButtonListenerBound,
        pendingStartConversation: Boolean(pendingStartConversationCard),
        audienceIntroStage,
        audienceInformationTargetSeen
      });
    }

    return Object.freeze({
      mount,
      unmount,
      reconcile,
      snapshot,
      replayWalkthrough,
      resumeTourModule,
      prepareTourResumeExit,
      quickPointerMode,
      handleWalkthroughState,
      blocksContextHelpDiscovery,
      blocksNewsfeedAutoGuide
    });
  }

  if (typeof document === "object") {
    hub.messageOnboarding = createController({ doc: document });
  }

  if (typeof module === "object" && module.exports) {
    module.exports = {
      STATE_KEY,
      STATE_VERSION,
      STEP_AVAILABILITY,
      STEP_CLASSES,
      STEP_OPENING,
      STEP_WAIT_CONVERSATION,
      STEP_INFORMATION,
      STEP_GROUP_CHAT,
      STEP_GROUP_CHAT_OPEN,
      DEFAULT_STATE,
      normalizeState,
      availabilityView,
      openingDraftForLanguage,
      classOpeningReady,
      guideSnapshotActive,
      classStepDestination,
      classesInstructionState,
      shouldHoldAudienceClassRecovery,
      nextAudienceIntroStage,
      informationStepComplete,
      audienceConversationReminderState,
      groupChatCompletionAllowed,
      groupChatTaskCompletionAllowed,
      availabilityCompletionState,
      initialStateForStorage,
      firstTimeMapState,
      beginFirstTimeMapModule,
      returnToFirstTimeMap,
      deferredGuideBlocksFirstTimeMap,
      firstTimeMapExternalGuideActive,
      firstTimeMapWalkthroughResult,
      shouldCancelDeferredGuideOnExploreLater,
      firstTimeMapHasProgress,
      firstTimeMapRequiresNewsfeed,
      resolveReturnToNewsfeedTarget,
      firstTimeMapProgressRefreshNeeded,
      newsfeedMapProgress,
      messagesMapProgress,
      navigationMapProgress,
      navigationProgressFromSnapshot,
      firstTimeMapResolved,
      resolveFirstTimeMap,
      markFirstTimeMapKnown,
      shouldContinueFirstTimeMap,
      resumeFirstTimeMap,
      resolveTourResumeContext,
      resumeContextForWalkthroughExitIntent,
      resumeContextForWalkthroughExit,
      replayIndexForResume,
      createController
    };
  }
})(globalThis);
