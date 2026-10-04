"use strict";

const defaults = {
  contextualHelpEnabled: true,
  walkthroughEnabled: true,
  nameDisplayMode: "auto",
  uiLanguage: null,
  robotLanguageIntroCompleteV1: false,
  messageOnboardingV1: null
};
const fields = {
  contextualHelpEnabled: "contextual-help",
  walkthroughEnabled: "walkthroughs",
  nameDisplayMode: "name-display-mode"
};
const statusOutput = document.getElementById("status");
let saveQueue = Promise.resolve();

const tr = (key, vars = {}) => PSQM.i18n.t(key, vars);

const ONBOARDING_STATE_KEY = "messageOnboardingV1";

function walkthroughAreaStatus(status) {
  if (status === "known") return "known";
  if (status === "completed") return "completed";
  if (status === "active") return "in-progress";
  return "not-started";
}

function walkthroughDashboardState(value) {
  const source = value && typeof value === "object" ? value : null;
  if (!source || source.tourStatus === "legacy-completed") {
    return {
      mode: "replay",
      visible: false,
      areas: { newsfeed: "not-started", messages: "not-started", navigation: "not-started" }
    };
  }
  const tourSteps = source.tourSteps && typeof source.tourSteps === "object" ? source.tourSteps : {};
  const navigation = source.navigationProgress && typeof source.navigationProgress === "object"
    ? source.navigationProgress
    : {};
  const areas = {
    newsfeed: walkthroughAreaStatus(tourSteps.newsfeed),
    messages: walkthroughAreaStatus(tourSteps.messages),
    navigation: navigation.known === true
      ? "known"
      : navigation.completed === true
        ? "completed"
        : navigation.stepId
          ? "in-progress"
          : "not-started"
  };
  const resolved = Object.values(areas).every(status => status === "completed" || status === "known");
  const completedState = source.completed === true && source.tourStatus === "completed";
  return { mode: resolved || completedState ? "replay" : "continue", visible: true, areas };
}

function walkthroughStatusLabel(status) {
  const key = status === "known"
    ? "popup.walkthroughKnown"
    : status === "completed"
      ? "popup.walkthroughCompleted"
      : status === "in-progress"
        ? "popup.walkthroughInProgress"
        : "popup.walkthroughNotStarted";
  return tr(key);
}

function renderWalkthroughDashboard(value) {
  const dashboard = walkthroughDashboardState(value);
  const action = document.getElementById("replay-walkthrough");
  action.textContent = tr(dashboard.mode === "continue" ? "popup.continueWalkthrough" : "popup.replayWalkthrough");
  const summary = document.getElementById("walkthrough-summary");
  summary.hidden = !dashboard.visible;
  document.getElementById("walkthrough-newsfeed-status").textContent = walkthroughStatusLabel(dashboard.areas.newsfeed);
  document.getElementById("walkthrough-messages-status").textContent = walkthroughStatusLabel(dashboard.areas.messages);
  document.getElementById("walkthrough-navigation-status").textContent = walkthroughStatusLabel(dashboard.areas.navigation);
  return dashboard;
}


async function loadSettings() {
  await PSQM.i18n.initialize();
  const settings = await chrome.storage.local.get(defaults);
  const language = PSQM.i18n.language();
  const languageSetupComplete = Boolean(language && settings.robotLanguageIntroCompleteV1 === true);

  document.getElementById("language-first-use").hidden = languageSetupComplete;
  document.getElementById("ui-language").value = language || "en";
  document.getElementById("ui-language").disabled = !languageSetupComplete;
  PSQM.i18n.applyDocument(document);

  for (const [key, id] of Object.entries(fields)) {
    const field = document.getElementById(id);
    if (key === "nameDisplayMode") field.value = PSQM.identity.modes.includes(settings[key]) ? settings[key] : "auto";
    else field.checked = settings[key] !== false;
  }

  renderWalkthroughDashboard(settings[ONBOARDING_STATE_KEY]);
  document.getElementById("replay-walkthrough").disabled = !languageSetupComplete || settings.walkthroughEnabled === false;
  document.getElementById("open-help").disabled = !languageSetupComplete || settings.contextualHelpEnabled === false;
}

for (const [key, id] of Object.entries(fields)) {
  document.getElementById(id).addEventListener("change", event => {
    const value = key === "nameDisplayMode" ? event.target.value : event.target.checked;
    saveQueue = saveQueue.catch(() => {}).then(() => chrome.storage.local.set({ [key]: value })).then(() => {
      statusOutput.textContent = tr("common.saved");
      return loadSettings();
    }).catch(() => {
      statusOutput.textContent = tr("common.couldNotSave");
    });
  });
}

document.getElementById("ui-language").addEventListener("change", async event => {
  try {
    await PSQM.i18n.setLanguage(event.target.value);
    statusOutput.textContent = tr("common.saved");
    await loadSettings();
  } catch {
    statusOutput.textContent = tr("common.couldNotSave");
  }
});

async function sendToPowerSchool(message) {
  statusOutput.textContent = tr("popup.opening");
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url?.startsWith("https://vas.educator.powerschool.com/")) {
      statusOutput.textContent = tr("popup.openPowerSchool");
      return;
    }
    const result = await chrome.tabs.sendMessage(tab.id, message);
    statusOutput.textContent = result?.ok
      ? tr("popup.openedPowerSchool")
      : tr("popup.enableGuides");
  } catch {
    statusOutput.textContent = tr("popup.reloadPowerSchool");
  }
}

document.getElementById("replay-walkthrough").addEventListener("click", () =>
  sendToPowerSchool({ type: "PSQM_REPLAY_WALKTHROUGH" }));
document.getElementById("open-help").addEventListener("click", () =>
  sendToPowerSchool({ type: "PSQM_OPEN_HELP" }));

PSQM.i18n.onChange(() => {
  PSQM.i18n.applyDocument(document);
  loadSettings().catch(() => {});
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && Object.keys(changes).some(key => Object.hasOwn(defaults, key))) {
    loadSettings().catch(() => {});
  }
});

loadSettings().catch(() => {
  statusOutput.textContent = tr("popup.loadFailed");
});

if (typeof module === "object" && module.exports) {
  module.exports = { walkthroughDashboardState };
}
