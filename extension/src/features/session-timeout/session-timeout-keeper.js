(function (root) {
  "use strict";

  const hub = root.PSQM ??= {};

  const IDS = Object.freeze({
    container: "container-id",
    stay: "button-neon-session-timeout-warning-stay-signed-in",
    signOut: "button-neon-session-timeout-warning-sign-out"
  });

  const HOST_TAG = "neon-4_4_0-session-timeout-warning";
  const DIALOG_SELECTOR = 'section.neon-dialog[role="dialog"]';
  const TITLE_TEXT = "Session Timeout";
  const STAY_TEXT = "Stay Signed In";
  const SIGN_OUT_TEXT = "Sign out";

  let lastOutcome = "idle";

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function nativeButtonText(button) {
    return cleanText(button?.textContent);
  }

  function resolveValidatedTarget(doc = root.document) {
    if (!doc?.getElementById) return null;

    const stayButton = doc.getElementById(IDS.stay);
    if (!stayButton?.isConnected || String(stayButton.tagName || "").toUpperCase() !== "BUTTON") {
      return null;
    }

    if (nativeButtonText(stayButton) !== STAY_TEXT) return null;

    const dialog = stayButton.closest?.(DIALOG_SELECTOR);
    if (!dialog?.isConnected) return null;

    const host = dialog.closest?.(HOST_TAG);
    if (!host?.isConnected || String(host.localName || "").toLowerCase() !== HOST_TAG) {
      return null;
    }

    if (host.parentElement?.id !== IDS.container) return null;

    const signOutButton = dialog.querySelector?.(`#${IDS.signOut}`);
    if (!signOutButton?.isConnected || String(signOutButton.tagName || "").toUpperCase() !== "BUTTON") {
      return null;
    }

    if (nativeButtonText(signOutButton) !== SIGN_OUT_TEXT) return null;

    const labelledBy = cleanText(dialog.getAttribute?.("aria-labelledby"));
    if (!labelledBy) return null;

    const title = doc.getElementById(labelledBy);
    if (
      !title?.isConnected ||
      !dialog.contains?.(title) ||
      title.getAttribute?.("role") !== "heading" ||
      cleanText(title.textContent) !== TITLE_TEXT
    ) {
      return null;
    }

    return Object.freeze({
      host,
      dialog,
      title,
      stayButton,
      signOutButton
    });
  }

  function clearVerifyTimer() {
  }

  function scheduleOneShotVerification() {
  }

  function reconcile() {
    resolveValidatedTarget();
    return false;
  }

  function mount() {
    // No observer/listener is created here. This catches a timeout dialog that
    // may already be mounted when the extension content script starts.
    reconcile();
  }

  function unmount() {
    clearVerifyTimer();
  }

  hub.sessionTimeoutKeeper = Object.freeze({
    mount,
    unmount,
    reconcile,
    snapshot: () => Object.freeze({ lastOutcome })
  });

  if (typeof module === "object" && module.exports) {
    module.exports = {
      IDS,
      HOST_TAG,
      DIALOG_SELECTOR,
      resolveValidatedTarget,
      cleanText
    };
  }
})(globalThis);
