"use strict";

const NOTIFICATION_PREFIX = "psqm-message";
const MONITOR_TAB_KEY = "notificationMonitorTabId";
let monitorQueue = Promise.resolve();

function badgeText(total) {
  if (!Number.isFinite(total) || total <= 0) return "";
  return total > 99 ? "99+" : String(total);
}

async function setUnreadBadge(tabId, total) {
  if (!tabId) return;
  await chrome.action.setBadgeBackgroundColor({ tabId, color: "#C81E1E" });
  await chrome.action.setBadgeText({ tabId, text: badgeText(total) });
}

async function resolveMonitorTabId(candidateTabId) {
  const current = await chrome.storage.session.get(MONITOR_TAB_KEY);
  const storedTabId = current[MONITOR_TAB_KEY];
  if (storedTabId) {
    try {
      const tab = await chrome.tabs.get(storedTabId);
      if (tab.url?.startsWith("https://vas.educator.powerschool.com/")) return storedTabId;
    } catch {
      // The previous monitor tab was closed.
    }
  }

  await chrome.storage.session.set({ [MONITOR_TAB_KEY]: candidateTabId });
  return candidateTabId;
}

function monitorTabId(candidateTabId) {
  const result = monitorQueue.then(() => resolveMonitorTabId(candidateTabId));
  monitorQueue = result.catch(() => {});
  return result;
}

async function notificationsAreEnabled() {
  const settings = await chrome.storage.local.get({ messageNotificationsEnabled: true });
  return settings.messageNotificationsEnabled !== false;
}

async function handleUnreadState(message, sender) {
  const tabId = sender.tab?.id;
  if (!tabId) return;

  const total = Number(message.total) || 0;
  const increase = Math.max(0, Number(message.increase) || 0);
  await setUnreadBadge(tabId, total);
  const selectedMonitorTabId = await monitorTabId(tabId);

  if (increase === 0 || message.notificationsEnabled === false) return;
  if (!await notificationsAreEnabled()) return;
  if (selectedMonitorTabId !== tabId) return;

  const plural = increase === 1 ? "message" : "messages";
  await chrome.notifications.create(`${NOTIFICATION_PREFIX}:${tabId}:${Date.now()}`, {
    type: "basic",
    iconUrl: "icon128.png",
    title: "New PowerSchool message",
    message: `You have ${increase} new unread ${plural}.`,
    contextMessage: "PowerSchool",
    priority: 2
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await chrome.storage.local.get("messageNotificationsEnabled");
  if (settings.messageNotificationsEnabled === undefined) {
    await chrome.storage.local.set({ messageNotificationsEnabled: true });
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== "PSQM_UNREAD_STATE") return false;
  handleUnreadState(message, sender).catch(() => {});
  return false;
});

chrome.notifications.onClicked.addListener(async (notificationId) => {
  if (!notificationId.startsWith(`${NOTIFICATION_PREFIX}:`)) return;
  const tabId = Number(notificationId.split(":")[1]);
  if (!Number.isFinite(tabId)) return;

  try {
    const tab = await chrome.tabs.update(tabId, { active: true });
    if (tab.windowId) await chrome.windows.update(tab.windowId, { focused: true });
  } catch {
    // The PowerSchool tab may have been closed after the notification appeared.
  }
  chrome.notifications.clear(notificationId).catch(() => {});
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const current = await chrome.storage.session.get(MONITOR_TAB_KEY);
  if (current[MONITOR_TAB_KEY] === tabId) {
    await chrome.storage.session.remove(MONITOR_TAB_KEY);
  }
});
