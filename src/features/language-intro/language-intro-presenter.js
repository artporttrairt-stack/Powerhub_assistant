(function (root) {
  "use strict";

  const hub = root.PSQM ??= {};
  if (hub.languageIntroPresenter) return;

  const OWNED_ROOT_ATTRIBUTE = "data-phi-language-intro-root";
  const ACTION_FOCUS_STATES = new Set([
    "welcome",
    "reference-found",
    "reference-missing",
    "choose-assistant",
    "error",
  ]);

  function setText(element, text) {
    element.textContent = text ?? "";
    return element;
  }

  function makeElement(documentRef, tagName, className, text = "") {
    const element = documentRef.createElement(tagName);
    element.className = className;
    if (text) setText(element, text);
    return element;
  }

  function pointerStyle(rect) {
    return [
      `--phi-target-top:${Math.round(rect.top)}px`,
      `--phi-target-left:${Math.round(rect.left)}px`,
      `--phi-target-width:${Math.round(rect.width)}px`,
      `--phi-target-height:${Math.round(rect.height)}px`,
    ].join(";") + ";";
  }

  function createRobotPresenter({ documentRef = globalThis.document, robotAssetUrl = null } = {}) {
    if (!documentRef?.createElement || !documentRef?.body) {
      throw new TypeError("createRobotPresenter requires a document-like object with body and createElement().");
    }

    let presenterRoot = null;
    let robotImage = null;
    let currentModel = null;
    let primaryAction = null;
    let assetAvailable = true;
    let hasSpeech = false;
    let destroyed = false;

    const handleKeydown = (event) => {
      if (event.key !== "Escape" || typeof currentModel?.onEscape !== "function") return;
      event.preventDefault?.();
      currentModel.onEscape();
    };

    function ensureRoot() {
      if (presenterRoot?.isConnected) return presenterRoot;
      presenterRoot = documentRef.createElement("div");
      presenterRoot.className = "phi-language-intro";
      presenterRoot.setAttribute(OWNED_ROOT_ATTRIBUTE, "");
      presenterRoot.dataset.psqmUi = "language-intro";
      presenterRoot.addEventListener("keydown", handleKeydown);
      documentRef.body.append(presenterRoot);
      destroyed = false;
      return presenterRoot;
    }

    function createRobot() {
      const robot = makeElement(documentRef, "div", "phi-robot");
      robot.setAttribute("aria-hidden", "true");

      if (robotAssetUrl) {
        robotImage = documentRef.createElement("img");
        robotImage.className = "phi-robot-image";
        robotImage.src = robotAssetUrl;
        robotImage.alt = "";
        robotImage.addEventListener("error", handleAssetError);
        robot.append(robotImage);
      } else {
        const fallback = makeElement(documentRef, "span", "phi-robot-fallback", "🤖");
        robot.append(fallback);
      }

      return robot;
    }

    function handleAssetError() {
      assetAvailable = false;
      if (robotImage) robotImage.hidden = true;
      presenterRoot?.classList.add("phi-asset-missing");
    }

    function createSpeech(model) {
      const speech = makeElement(documentRef, "section", "phi-speech");
      const title = makeElement(documentRef, "h2", "phi-speech-title");
      title.setAttribute("id", "phi-language-intro-title");
      const titleEn = makeElement(documentRef, "span", "phi-copy-en", model.titleEn);
      const titleVi = makeElement(documentRef, "span", "phi-copy-vi", model.titleVi);
      titleEn.lang = "en";
      titleVi.lang = "vi";
      title.append(
        titleEn,
        titleVi,
      );

      const body = makeElement(documentRef, "div", "phi-speech-body");
      const bodyEn = makeElement(documentRef, "p", "phi-copy-en", model.bodyEn);
      const bodyVi = makeElement(documentRef, "p", "phi-copy-vi", model.bodyVi);
      bodyEn.lang = "en";
      bodyVi.lang = "vi";
      body.append(
        bodyEn,
        bodyVi,
      );

      const actions = makeElement(documentRef, "div", "phi-actions");
      primaryAction = null;
      for (const action of model.actions ?? []) {
        const button = makeElement(documentRef, "button", `phi-action phi-action-${action.kind ?? "secondary"}`, action.label);
        button.type = "button";
        button.disabled = Boolean(action.disabled);
        button.dataset.action = action.id;
        button.addEventListener("click", () => {
          if (!button.disabled) action.onPress?.();
        });
        if (!primaryAction && action.kind === "primary" && !button.disabled) primaryAction = button;
        actions.append(button);
      }

      speech.append(title, body, actions);
      hasSpeech = true;
      return speech;
    }

    function createPointer(rect) {
      if (!rect) return null;
      const pointer = makeElement(documentRef, "div", "phi-target-pointer");
      pointer.setAttribute("aria-hidden", "true");
      pointer.setAttribute("style", pointerStyle(rect));
      return pointer;
    }

    function createLauncher(model) {
      const launcher = makeElement(
        documentRef,
        "button",
        "phi-launcher",
        model.titleEn && model.titleVi ? `${model.titleEn} / ${model.titleVi}` : "Language guide / Hướng dẫn ngôn ngữ",
      );
      launcher.type = "button";
      launcher.setAttribute("aria-label", launcher.textContent);
      launcher.addEventListener("click", () => model.actions?.[0]?.onPress?.());
      primaryAction = launcher;
      hasSpeech = false;
      return launcher;
    }

    function render(model) {
      if (!model || typeof model.state !== "string") {
        throw new TypeError("presenter.render() requires a render model with a state.");
      }

      currentModel = model;
      const ownedRoot = ensureRoot();
      ownedRoot.className = `phi-language-intro phi-state-${model.state}`;
      ownedRoot.dataset.state = model.state;

      if (model.state === "minimized") {
        ownedRoot.removeAttribute("role");
        ownedRoot.removeAttribute("aria-labelledby");
        ownedRoot.replaceChildren(createLauncher(model));
        return;
      }

      ownedRoot.setAttribute("role", "dialog");
      ownedRoot.setAttribute("aria-modal", "false");
      ownedRoot.setAttribute("aria-labelledby", "phi-language-intro-title");

      const frame = makeElement(documentRef, "div", "phi-frame");
      frame.append(createRobot(), createSpeech(model));
      const pointer = createPointer(model.targetRect);
      ownedRoot.replaceChildren(...(pointer ? [frame, pointer] : [frame]));

      if (ACTION_FOCUS_STATES.has(model.state) && primaryAction) primaryAction.focus();
    }

    function focusPrimaryAction() {
      primaryAction?.focus();
    }

    function destroy() {
      if (!presenterRoot) return;
      presenterRoot.removeEventListener("keydown", handleKeydown);
      robotImage?.removeEventListener("error", handleAssetError);
      presenterRoot.remove();
      presenterRoot = null;
      robotImage = null;
      currentModel = null;
      primaryAction = null;
      hasSpeech = false;
      destroyed = true;
    }

    function getSnapshot() {
      return Object.freeze({
        state: currentModel?.state ?? null,
        assetAvailable,
        hasSpeech,
        rootConnected: Boolean(presenterRoot?.isConnected),
        destroyed,
      });
    }

    function simulateAssetErrorForTest() {
      handleAssetError();
    }

    return Object.freeze({
      render,
      focusPrimaryAction,
      destroy,
      getSnapshot,
      simulateAssetErrorForTest,
    });
  }

  hub.languageIntroPresenter = Object.freeze({ createRobotPresenter });
})(globalThis);
