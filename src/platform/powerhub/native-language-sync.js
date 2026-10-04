(function (root) {
  "use strict";

  const hub = root.PSQM ??= {};

  function normalizeNativeLanguage(value) {
    const family = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/_/gu, "-")
      .split("-")[0];
    return family === "en" || family === "vi" ? family : null;
  }

  function createNativeLanguageSync({
    doc = root.document,
    i18n = hub.i18n,
    MutationObserverCtor = root.MutationObserver
  } = {}) {
    let started = false;
    let observer = null;
    let raw = "";
    let language = null;

    function snapshot() {
      return Object.freeze({
        started,
        raw,
        language: language || "",
        verified: Boolean(language)
      });
    }

    async function syncNow() {
      raw = String(doc?.documentElement?.getAttribute?.("lang") || "").trim();
      language = normalizeNativeLanguage(raw);
      i18n?.setRuntimeLanguageAuthority?.(language);

      if (!language) return null;
      if (i18n?.language?.() === language) return language;
      try {
        await i18n?.setLanguage?.(language);
      } catch (error) {
        if (i18n?.language?.() !== language) throw error;
      }
      return language;
    }

    async function start() {
      if (!started) {
        started = true;
        const element = doc?.documentElement;
        if (element && typeof MutationObserverCtor === "function") {
          observer = new MutationObserverCtor(() => {
            void syncNow();
          });
          observer.observe(element, {
            attributes: true,
            attributeFilter: ["lang"]
          });
        }
      }
      await syncNow();
      return snapshot();
    }

    return Object.freeze({ start, syncNow, snapshot });
  }

  hub.nativeLanguageSync ??= createNativeLanguageSync();

  if (typeof module === "object" && module.exports) {
    module.exports = { normalizeNativeLanguage, createNativeLanguageSync };
  }
})(globalThis);
