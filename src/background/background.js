"use strict";

importScripts("../platform/browser/i18n.js", "../state/identity/identity.js", "../features/guidance/guide-registry.js");

const GUIDE_KEY_PREFIX = "psqmWalkthrough:";
const LEGACY_NICKNAME_KEYS = ["studentNicknames", "studentProfiles", "psqmStorageVersion"];
const GUIDANCE_STATUSES = new Set(["IDLE", "RUNNING", "WAITING_FOR_TARGET", "WAITING_FOR_ACTION", "VERIFYING", "STEP_COMPLETE", "BLOCKED", "PAUSED", "CANCELLED", "COMPLETED"]);
let assistantQueue = Promise.resolve();

function isPowerSchoolSender(sender) {
  if (sender.id !== chrome.runtime.id || !Number.isInteger(sender.tab?.id) || sender.frameId !== 0) return false;
  try { return new URL(sender.url).origin === "https://vas.educator.powerschool.com"; } catch { return false; }
}

function safeProgress(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (Object.keys(value).some(key => !["guideId", "stepId", "status", "startedAt", "updatedAt"].includes(key))) return null;
  const guide = PSQM.guides[value.guideId];
  if (!guide?.available || !guide.steps.some(step => step.id === value.stepId) || !GUIDANCE_STATUSES.has(value.status)) return null;
  if (!Number.isFinite(value.startedAt) || value.startedAt <= 0 || value.startedAt > Date.now() + 300000) return null;
  return { guideId: guide.id, stepId: value.stepId, status: value.status, startedAt: value.startedAt, updatedAt: Date.now() };
}

async function handleAssistantMessage(message, sender) {
  if (!isPowerSchoolSender(sender)) return { ok: false };
  const key = `${GUIDE_KEY_PREFIX}${sender.tab.id}`;
  if (message.type === "PSQM_GUIDE_GET") {
    const stored = await chrome.storage.session.get(key);
    return { ok: true, state: safeProgress(stored[key]) };
  }
  if (message.type === "PSQM_GUIDE_SAVE") {
    const state = safeProgress(message.state);
    if (!state) return { ok: false };
    if (["IDLE", "CANCELLED", "COMPLETED"].includes(state.status)) await chrome.storage.session.remove(key);
    else await chrome.storage.session.set({ [key]: state });
    return { ok: true };
  }
  return { ok: false };
}

chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (!["PSQM_GUIDE_GET", "PSQM_GUIDE_SAVE"].includes(message?.type)) return false;
  const job = assistantQueue.then(() => handleAssistantMessage(message, sender));
  assistantQueue = job.catch(() => {});
  job.then(reply).catch(() => reply({ ok: false }));
  return true;
});


chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.remove(LEGACY_NICKNAME_KEYS).catch(() => {});
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  // Queue cleanup after any in-flight progress write for this tab.
  const cleanup = assistantQueue.then(() => chrome.storage.session.remove(`${GUIDE_KEY_PREFIX}${tabId}`));
  assistantQueue = cleanup.catch(() => {});
  await cleanup;
});
