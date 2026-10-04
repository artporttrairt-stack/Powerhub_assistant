(function (root) {
  "use strict";

  const hub = root.PSQM ??= {};
  if (hub.onboardingProgress) return;

  const ONBOARDING_VERSION = 1;
  const MODULE_ORDER = Object.freeze(["language", "newsfeed", "messages", "review"]);
  const MODULE_STATUSES = new Set(["pending", "active", "completed", "known"]);
  const TOUR_STATUSES = new Set(["pending", "active", "completed", "skipped", "legacy-completed"]);

  function stepsFor(mode = "pending") {
    const steps = {
      language: mode === "fresh" || mode === "legacy" ? "completed" : "pending",
      newsfeed: mode === "fresh" ? "active" : "pending",
      messages: "pending",
      review: "pending",
    };
    return steps;
  }

  function createProgress(mode = "pending") {
    if (mode === "fresh") {
      return {
        onboardingVersion: ONBOARDING_VERSION,
        tourStatus: "active",
        tourStep: "newsfeed",
        tourSteps: stepsFor("fresh"),
      };
    }
    if (mode === "legacy") {
      return {
        onboardingVersion: ONBOARDING_VERSION,
        tourStatus: "legacy-completed",
        tourStep: "",
        tourSteps: stepsFor("legacy"),
      };
    }
    return {
      onboardingVersion: ONBOARDING_VERSION,
      tourStatus: "pending",
      tourStep: "",
      tourSteps: stepsFor(),
    };
  }

  function hasProgress(value) {
    return Boolean(value && typeof value === "object"
      && Number.isInteger(value.onboardingVersion)
      && TOUR_STATUSES.has(value.tourStatus)
      && value.tourSteps && typeof value.tourSteps === "object");
  }

  function normalizeProgress(value, { fallbackMode = "pending" } = {}) {
    if (!hasProgress(value)) return createProgress(fallbackMode);

    const steps = Object.fromEntries(MODULE_ORDER.map((id) => [
      id,
      MODULE_STATUSES.has(value.tourSteps[id]) ? value.tourSteps[id] : "pending",
    ]));
    const tourStep = MODULE_ORDER.includes(value.tourStep) ? value.tourStep : "";
    return {
      onboardingVersion: ONBOARDING_VERSION,
      tourStatus: value.tourStatus,
      tourStep,
      tourSteps: steps,
    };
  }

  function setModuleStatus(value, moduleId, moduleStatus) {
    const progress = normalizeProgress(value);
    if (!MODULE_ORDER.includes(moduleId) || !MODULE_STATUSES.has(moduleStatus)) return progress;

    const index = MODULE_ORDER.indexOf(moduleId);
    const nextModule = MODULE_ORDER[index + 1] || "";
    const tourSteps = { ...progress.tourSteps, [moduleId]: moduleStatus };
    if (nextModule && tourSteps[nextModule] === "pending") tourSteps[nextModule] = "active";

    return {
      ...progress,
      tourStatus: nextModule ? "active" : "completed",
      tourStep: nextModule,
      tourSteps,
    };
  }

  function skipTour(value) {
    const progress = normalizeProgress(value);
    const tourSteps = Object.fromEntries(Object.entries(progress.tourSteps)
      .map(([id, status]) => [id, status === "active" ? "pending" : status]));
    return { ...progress, tourStatus: "skipped", tourSteps };
  }

  function isReturning(value) {
    return ["completed", "skipped", "legacy-completed"].includes(normalizeProgress(value).tourStatus);
  }

  hub.onboardingProgress = Object.freeze({
    ONBOARDING_VERSION,
    MODULE_ORDER,
    createProgress,
    hasProgress,
    normalizeProgress,
    setModuleStatus,
    skipTour,
    isReturning,
  });

  if (typeof module === "object" && module.exports) {
    module.exports = hub.onboardingProgress;
  }
})(globalThis);
