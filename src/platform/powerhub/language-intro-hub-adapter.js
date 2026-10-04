(function (root) {
  "use strict";

  const hub = root.PSQM ??= {};
  if (hub.languageIntroHubAdapter) return;

  const PROFILE_BUTTON_ID = "neon-avatar-button-header-user-profile-button";
  const SETTINGS_BUTTON_ID = "neon-popper-button-header-user-profile-menu-item-language-locale-settings-button";

  const clean = (value) => String(value || "").replace(/\s+/gu, " ").trim();
  const verifiedTarget = (element, evidence) => Object.freeze({ verified: true, element, evidence });
  const missingTarget = (reason) => Object.freeze({ verified: false, element: null, reason });
  const verifiedValue = (value, evidence) => Object.freeze({ verified: true, value, evidence });
  const missingValue = (reason) => Object.freeze({ verified: false, value: null, reason });

  function createLanguageIntroHubAdapter({
    documentRef = root.document,
    view = root,
    getUi = () => hub.ui,
  } = {}) {
    function visible(element) {
      if (!(element instanceof view.Element) || !element.isConnected) return false;
      if (element.hidden || element.getAttribute("aria-hidden") === "true") return false;
      const style = view.getComputedStyle?.(element);
      if (style && (style.display === "none" || style.visibility === "hidden" || style.opacity === "0")) return false;
      const rect = element.getBoundingClientRect?.();
      return Boolean(rect && rect.width > 0 && rect.height > 0);
    }

    function uniqueNativeButtonById(id) {
      const matches = [...documentRef.querySelectorAll("#" + id)]
        .filter(element => element instanceof view.HTMLButtonElement);
      return matches.length === 1 ? matches[0] : null;
    }

    function findProfileButton() {
      const element = uniqueNativeButtonById(PROFILE_BUTTON_ID);
      return element
        && visible(element)
        ? verifiedTarget(element, "stable-profile-button-id")
        : missingTarget("profile-button-not-verified");
    }

    function findLanguageLocaleButton() {
      const element = uniqueNativeButtonById(SETTINGS_BUTTON_ID);
      return element
        && element.getAttribute("role") === "menuitem"
        && visible(element)
        ? verifiedTarget(element, "stable-language-locale-button-id-role")
        : missingTarget("language-locale-button-not-verified");
    }

    function readLanguageReference() {
      const selection = getUi()?.languageLocale?.selection?.();
      if (!selection?.verified || !selection.code) return missingValue("native-language-selection-not-verified");
      const family = String(selection.code).replace(/-/gu, "_").split("_")[0].toLowerCase();
      return ["en", "vi"].includes(family)
        ? verifiedValue(family, "verified-native-language-selection")
        : missingValue("native-language-family-unsupported");
    }

    function languageSettingsOpen() {
      const dialog = getUi()?.languageLocale?.dialog?.();
      return Boolean(dialog?.verified && dialog.element && visible(dialog.element));
    }

    function findLanguageSettingsCloseTarget() {
      const dialog = getUi()?.languageLocale?.dialog?.();
      if (!dialog?.verified || !dialog.element || !visible(dialog.element)) {
        return missingTarget("language-settings-dialog-not-verified");
      }
      const matches = [...dialog.element.querySelectorAll("button, [role='button']")].filter((element) => {
        if (!visible(element)) return false;
        const name = clean(
          element.getAttribute("aria-label")
          || element.getAttribute("title")
          || element.textContent
        );
        return [
          "Close",
          "Close dialog",
          "Dismiss",
          "Close Language settings",
          "Close Language & locale settings"
        ].includes(name);
      });
      return matches.length === 1
        ? verifiedTarget(matches[0], "verified-language-settings-close-control")
        : missingTarget(matches.length ? "ambiguous-language-settings-close-control" : "language-settings-close-control-missing");
    }

    return Object.freeze({
      findProfileButton,
      findLanguageLocaleButton,
      readLanguageReference,
      findLanguageSettingsCloseTarget,
      languageSettingsOpen,
    });
  }

  hub.languageIntroHubAdapter = Object.freeze({
    PROFILE_BUTTON_ID,
    SETTINGS_BUTTON_ID,
    createLanguageIntroHubAdapter,
  });
})(globalThis);
