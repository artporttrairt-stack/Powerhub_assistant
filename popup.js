"use strict";

const notificationToggle = document.getElementById("message-notifications");
const stateOutput = document.getElementById("state");
const nicknameCountOutput = document.getElementById("nickname-count");

function nicknameCount(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return 0;
  return Object.values(value).filter((nickname) => (
    typeof nickname === "string" && nickname.trim()
  )).length;
}

function renderNicknameCount(value) {
  const count = nicknameCount(value);
  nicknameCountOutput.value = `${count} saved`;
  nicknameCountOutput.textContent = nicknameCountOutput.value;
}

function renderState(enabled) {
  notificationToggle.checked = enabled;
  stateOutput.value = enabled ? "On" : "Off";
  stateOutput.textContent = stateOutput.value;
  stateOutput.classList.toggle("is-off", !enabled);
}

async function loadSetting() {
  const settings = await chrome.storage.local.get({
    messageNotificationsEnabled: true,
    studentNicknames: {}
  });
  renderState(settings.messageNotificationsEnabled !== false);
  renderNicknameCount(settings.studentNicknames);
}

async function saveSetting() {
  const enabled = notificationToggle.checked;
  renderState(enabled);
  await chrome.storage.local.set({ messageNotificationsEnabled: enabled });
}

notificationToggle.addEventListener("change", saveSetting);
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.studentNicknames) {
    renderNicknameCount(changes.studentNicknames.newValue);
  }
});
loadSetting();
