(function (root) {
  "use strict";

  const hub = root.PSQM ??= {};
  if (hub.languageIntroState) return;

  const COMPLETE_KEY = "robotLanguageIntroCompleteV1";
  const SUPPORTED_LANGUAGES = Object.freeze(["en", "vi"]);

  function createLanguageIntroState({
    i18n = hub.i18n,
    storage = root.chrome?.storage?.local,
  } = {}) {
    async function loadAssistantLanguage() {
      await i18n?.initialize?.();
      const stored = await storage?.get?.({ [COMPLETE_KEY]: false });
      if (stored?.[COMPLETE_KEY] !== true) return null;
      const language = i18n?.language?.();
      return SUPPORTED_LANGUAGES.includes(language) ? language : null;
    }

    async function saveAssistantLanguage(language) {
      if (!SUPPORTED_LANGUAGES.includes(language)) throw new TypeError("Unsupported Assistant language.");
      await i18n?.setLanguage?.(language);
      await storage?.set?.({ [COMPLETE_KEY]: true });
    }

    return Object.freeze({ loadAssistantLanguage, saveAssistantLanguage });
  }

  hub.languageIntroState = Object.freeze({ COMPLETE_KEY, createLanguageIntroState });
})(globalThis);
