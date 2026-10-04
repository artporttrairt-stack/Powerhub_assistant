/* Compatibility facade for the established Language Intro core surface. */
(function (root) {
  "use strict";

  const hub = root.PSQM ??= {};
  if (hub.languageIntroCore) return;

  const copy = hub.languageIntroCopy;
  const controller = hub.languageIntroController;
  const presenter = hub.languageIntroPresenter;
  if (!copy || typeof controller?.createLanguageIntro !== "function"
      || typeof presenter?.createRobotPresenter !== "function") {
    throw new Error("Language Intro modules must load before the core compatibility facade.");
  }

  hub.languageIntroCore = Object.freeze({
    ASSISTANT_LANGUAGES: copy.ASSISTANT_LANGUAGES,
    createLanguageIntro: controller.createLanguageIntro,
    createRobotPresenter: presenter.createRobotPresenter,
  });
})(globalThis);
