(function (root) {
  "use strict";

  const hub = root.PSQM ??= {};
  if (hub.communicationLanguageWarning) return;

  const WARNING_ID = "psqm-communication-language-warning";
  const MIN_WORDS = 5;
  const MIN_LETTERS = 24;
  const INPUT_DEBOUNCE_MS = 500;
  const DISMISS_WORD_DELTA = 3;
  const DISMISS_LETTER_DELTA = 12;
  const VIETNAMESE_MARKS = /[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/iu;
  const VIETNAMESE_WORDS = new Set([
    "bài", "bạn", "các", "cảm", "cho", "chúng", "của", "để", "được", "giáo",
    "hãy", "học", "hôm", "huynh", "không", "khi", "là", "lòng", "một", "ngày",
    "nhà", "những", "ơn", "phụ", "quý", "sinh", "thông", "trong", "tuần", "và",
    "về", "viên", "với", "vui", "xin"
  ]);
  const ENGLISH_WORDS = new Set([
    "a", "an", "and", "are", "attached", "be", "before", "class", "for", "from",
    "guardian", "guardians", "in", "is", "message", "of", "on", "our", "parent",
    "parents", "please", "review", "school", "student", "students", "thank", "that",
    "the", "this", "to", "today", "tomorrow", "we", "week", "will", "with", "you", "your"
  ]);

  function hubLanguageFamily(code) {
    const family = String(code || "").replace(/-/gu, "_").split("_")[0].toLowerCase();
    return ["en", "vi"].includes(family) ? family : "";
  }

  function analyzeCommunicationLanguage(value) {
    const cleaned = String(value || "")
      .replace(/https?:\/\/\S+|www\.\S+|\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/giu, " ")
      .replace(/[\u200b-\u200d\ufeff]/gu, " ");
    const words = cleaned.toLocaleLowerCase("vi").match(/\p{L}+/gu) || [];
    const letters = words.reduce((total, word) => total + word.length, 0);
    if (words.length < MIN_WORDS || letters < MIN_LETTERS) {
      return { meaningful: false, code: "", confidence: "none", wordCount: words.length, letterCount: letters };
    }

    const vietnameseMarks = words.filter(word => VIETNAMESE_MARKS.test(word)).length;
    const vietnameseWords = words.filter(word => VIETNAMESE_WORDS.has(word)).length;
    const englishWords = words.filter(word => ENGLISH_WORDS.has(word)).length;
    const vietnameseStrong = (vietnameseMarks >= 2 && vietnameseWords >= 1) || vietnameseWords >= 4;
    const englishStrong = englishWords >= 4 && vietnameseMarks === 0 && vietnameseWords <= 1;

    if (vietnameseStrong && englishWords >= 4) {
      return { meaningful: true, code: "", confidence: "ambiguous", wordCount: words.length, letterCount: letters };
    }
    if (vietnameseStrong) {
      return { meaningful: true, code: "vi", confidence: "high", wordCount: words.length, letterCount: letters };
    }
    if (englishStrong) {
      return { meaningful: true, code: "en", confidence: "high", wordCount: words.length, letterCount: letters };
    }
    return { meaningful: true, code: "", confidence: "ambiguous", wordCount: words.length, letterCount: letters };
  }

  function languageWarningState({ expected = null, analysis = null, kind = "message" } = {}) {
    if (analysis?.meaningful !== true) return { type: "none", kind };
    if (!expected?.code) return { type: "none", kind };
    const expectedFamily = hubLanguageFamily(expected.code);
    if (!expectedFamily) return { type: "none", kind };
    if (!analysis.code || analysis.confidence !== "high") return { type: "none", kind };
    if (analysis.code === expectedFamily) return { type: "none", kind };
    return { type: "mismatch", kind, expected, expectedFamily, detected: analysis.code, analysis };
  }

  function shouldSuppressDismissedWarning(dismissed, state) {
    if (!dismissed || state?.type !== "mismatch") return false;
    if (dismissed.kind !== state.kind
      || dismissed.expectedFamily !== state.expectedFamily
      || dismissed.detected !== state.detected) return false;
    const wordDelta = Math.abs((state.analysis?.wordCount || 0) - dismissed.wordCount);
    const letterDelta = Math.abs((state.analysis?.letterCount || 0) - dismissed.letterCount);
    return wordDelta < DISMISS_WORD_DELTA && letterDelta < DISMISS_LETTER_DELTA;
  }

  function warningPosition(targetRect, cardRect, viewport, gap = 8, margin = 8) {
    const viewportWidth = Math.max(0, Number(viewport?.width) || 0);
    const viewportHeight = Math.max(0, Number(viewport?.height) || 0);
    const cardWidth = Math.max(0, Number(cardRect?.width) || 0);
    const cardHeight = Math.max(0, Number(cardRect?.height) || 0);
    const targetLeft = Number(targetRect?.left) || 0;
    const targetTop = Number(targetRect?.top) || 0;
    const targetRight = Number(targetRect?.right) || targetLeft;
    const targetBottom = Number(targetRect?.bottom) || targetTop;
    const targetWidth = Math.max(0, Number(targetRect?.width) || targetRight - targetLeft);
    const maxLeft = Math.max(margin, viewportWidth - cardWidth - margin);
    const left = Math.min(maxLeft, Math.max(margin, targetLeft + (targetWidth / 2) - (cardWidth / 2)));
    const above = targetTop - cardHeight - gap;
    const below = targetBottom + gap;
    const top = above >= margin
      ? above
      : Math.min(Math.max(margin, below), Math.max(margin, viewportHeight - cardHeight - margin));
    return { left, top };
  }

  function surfaceFromUi(ui) {
    const context = ui?.detectContext?.();
    if (context?.area === "newsfeed" && context.view === "compose") {
      const composer = ui?.newsfeed?.composer?.();
      const title = ui?.newsfeed?.titleInput?.();
      const body = ui?.newsfeed?.bodyInput?.();
      if (composer?.verified && composer.element?.isConnected
        && title?.verified && title.element?.isConnected
        && body?.verified && body.element?.isConnected) {
        return { kind: "post", root: composer.element, title: title.element, body: body.element };
      }
      return null;
    }
    if (context?.area === "messages") {
      const editor = ui?.messages?.messageInput?.();
      if (editor?.verified && editor.element?.isConnected) {
        return { kind: "message", root: editor.element, title: null, body: editor.element };
      }
    }
    return null;
  }

  function surfaceText(surface) {
    if (!surface) return "";
    const title = surface.title && "value" in surface.title ? surface.title.value : "";
    return `${title || ""} ${surface.body?.textContent || ""}`.trim();
  }

  function createController({ doc, ui, i18n, view = root, debounceMs = INPUT_DEBOUNCE_MS } = {}) {
    let mounted = false;
    let surface = null;
    let nativeDialog = null;
    let openingLanguage = null;
    let candidateLanguage = null;
    let confirmedLanguage = null;
    let observedLanguage = null;
    let warning = null;
    let warningKey = "";
    let removeLanguageChange = null;
    let evaluationTimer = null;
    let positionFrame = null;
    let dismissedWarning = null;

    const tr = (key, vars = {}) => i18n?.t?.(key, vars) || key;
    const languageName = code => tr(code === "vi" ? "languageWarning.vietnamese" : "languageWarning.english");

    function clearEvaluationTimer() {
      if (evaluationTimer === null) return;
      view.clearTimeout(evaluationTimer);
      evaluationTimer = null;
    }

    function removeWarning() {
      warning?.remove();
      warning = null;
      warningKey = "";
    }

    function clearPositionFrame() {
      if (positionFrame === null) return;
      view.cancelAnimationFrame?.(positionFrame);
      positionFrame = null;
    }

    function positionWarning() {
      const anchor = surface?.body || surface?.root;
      if (!warning?.isConnected || !anchor?.getBoundingClientRect || !warning.getBoundingClientRect) return;
      const targetRect = anchor.getBoundingClientRect();
      const cardRect = warning.getBoundingClientRect();
      if (!targetRect || !cardRect || !cardRect.width || !cardRect.height) return;
      const viewport = {
        width: view.innerWidth || doc.documentElement?.clientWidth || 0,
        height: view.innerHeight || doc.documentElement?.clientHeight || 0
      };
      const position = warningPosition(targetRect, cardRect, viewport);
      warning.style.left = `${Math.round(position.left)}px`;
      warning.style.top = `${Math.round(position.top)}px`;
      warning.style.bottom = "auto";
      warning.style.transform = "none";
    }

    function schedulePositionWarning() {
      if (positionFrame !== null) return;
      if (typeof view.requestAnimationFrame !== "function") {
        positionWarning();
        return;
      }
      positionFrame = view.requestAnimationFrame(() => {
        positionFrame = null;
        positionWarning();
      });
    }

    function renderWarning(state) {
      if (!state || state.type === "none") {
        removeWarning();
        return;
      }
      const key = [
        state.type,
        state.kind,
        state.expected?.code || "",
        state.expected?.source || "",
        state.detected || "",
        i18n?.language?.() || "en"
      ].join(":");
      if (warning?.isConnected && warningKey === key) {
        positionWarning();
        return;
      }
      removeWarning();

      const card = doc.createElement("section");
      card.id = WARNING_ID;
      card.className = `psqm-language-warning psqm-language-warning--${state.type}`;
      card.dataset.psqmUi = "communication-language-warning";
      card.lang = i18n?.language?.() === "vi" ? "vi" : "en";
      card.setAttribute("role", "status");
      card.setAttribute("aria-live", "polite");
      card.setAttribute("aria-atomic", "true");

      const header = doc.createElement("div");
      header.className = "psqm-language-warning__header";
      const icon = doc.createElement("span");
      icon.className = "psqm-language-warning__icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = "⚠";
      const heading = doc.createElement("strong");
      heading.className = "psqm-language-warning__heading";
      heading.textContent = state.type === "mismatch"
        ? tr(state.kind === "post" ? "languageWarning.postTitle" : "languageWarning.messageTitle")
        : tr("languageWarning.title");
      const close = doc.createElement("button");
      close.className = "psqm-language-warning__close";
      close.type = "button";
      close.setAttribute("aria-label", tr("common.close"));
      close.textContent = "×";
      close.addEventListener("click", () => {
        dismissedWarning = {
          kind: state.kind,
          expectedFamily: state.expectedFamily,
          detected: state.detected,
          wordCount: state.analysis?.wordCount || 0,
          letterCount: state.analysis?.letterCount || 0
        };
        removeWarning();
      });
      const message = doc.createElement("p");
      message.className = "psqm-language-warning__message";
      if (state.type === "sync") {
        message.textContent = tr("languageWarning.sync");
      } else if (state.type === "unsupported") {
        message.textContent = tr("languageWarning.unsupported", {
          language: state.expected?.label || state.expected?.code || ""
        });
      } else {
        const keyName = state.expected?.source === "native"
          ? "languageWarning.nativeMismatch"
          : "languageWarning.confirmedMismatch";
        message.textContent = tr(keyName, {
          detected: languageName(state.detected),
          expected: languageName(state.expectedFamily)
        });
      }
      header.append(icon, heading, close);
      card.append(header, message);
      doc.body.append(card);
      warning = card;
      warningKey = key;
      positionWarning();
    }

    function referenceLanguage() {
      if (observedLanguage?.code) return { ...observedLanguage, source: "native" };
      const assistantCode = hubLanguageFamily(i18n?.language?.());
      return assistantCode
        ? { code: assistantCode, label: languageName(assistantCode), source: "assistant" }
        : null;
    }

    function referenceSignature() {
      const reference = referenceLanguage();
      return `${reference?.code || ""}:${reference?.source || ""}`;
    }

    function evaluate() {
      if (hub.languageIntro?.blocksOtherOnboarding?.()) {
        removeWarning();
        return;
      }
      if (!surface?.root?.isConnected) {
        removeWarning();
        return;
      }
      const analysis = analyzeCommunicationLanguage(surfaceText(surface));
      const state = languageWarningState({ expected: referenceLanguage(), analysis, kind: surface.kind });
      if (state.type !== "mismatch") dismissedWarning = null;
      if (shouldSuppressDismissedWarning(dismissedWarning, state)) {
        removeWarning();
        return;
      }
      renderWarning(state);
    }

    function scheduleEvaluation() {
      clearEvaluationTimer();
      evaluationTimer = view.setTimeout(() => {
        evaluationTimer = null;
        evaluate();
      }, debounceMs);
    }

    function selectionValue() {
      const result = ui?.languageLocale?.selection?.();
      return result?.verified && result.code
        ? { code: result.code, label: result.label || result.code }
        : null;
    }

    function nativeDialogClick(event) {
      if (!event?.isTrusted) return;
      const confirm = ui?.languageLocale?.confirmButton?.();
      const button = confirm?.verified ? confirm.element : null;
      if (!button || button.disabled || button.getAttribute("aria-disabled") === "true") return;
      if (event.target !== button && !button.contains(event.target)) return;
      confirmedLanguage = selectionValue() || candidateLanguage;
    }

    function closeNativeDialog() {
      if (nativeDialog) nativeDialog.removeEventListener("click", nativeDialogClick, true);
      if (confirmedLanguage?.code) observedLanguage = confirmedLanguage;
      nativeDialog = null;
      openingLanguage = null;
      candidateLanguage = null;
      confirmedLanguage = null;
    }

    function captureNativeLanguage() {
      const dialogResult = ui?.languageLocale?.dialog?.();
      const nextDialog = dialogResult?.verified && dialogResult.element?.isConnected
        ? dialogResult.element
        : null;
      if (nativeDialog && nativeDialog !== nextDialog) closeNativeDialog();
      if (!nextDialog) return;
      if (nativeDialog !== nextDialog) {
        nativeDialog = nextDialog;
        nativeDialog.addEventListener("click", nativeDialogClick, true);
      }

      const current = selectionValue();
      if (!current) return;
      candidateLanguage = current;
      if (!openingLanguage) {
        openingLanguage = current;
        observedLanguage = current;
      }
    }

    function bindSurface(next) {
      if (surface?.root === next?.root && surface?.kind === next?.kind) {
        surface = next;
        return false;
      }
      clearEvaluationTimer();
      if (surface?.root) {
        surface.root.removeEventListener("input", scheduleEvaluation);
        surface.root.removeEventListener("change", scheduleEvaluation);
      }
      surface = next;
      dismissedWarning = null;
      removeWarning();
      if (surface?.root) {
        surface.root.addEventListener("input", scheduleEvaluation);
        surface.root.addEventListener("change", scheduleEvaluation);
      }
      return true;
    }

    function reconcile() {
      if (hub.languageIntro?.blocksOtherOnboarding?.()) {
        bindSurface(null);
        closeNativeDialog();
        removeWarning();
        return;
      }
      const referenceBefore = referenceSignature();
      captureNativeLanguage();
      const referenceChanged = referenceBefore !== referenceSignature();
      const surfaceChanged = bindSurface(surfaceFromUi(ui));
      if ((surfaceChanged && surface?.root) || referenceChanged) evaluate();
    }

    function mount() {
      if (mounted) return;
      mounted = true;
      removeLanguageChange = i18n?.onChange?.(() => evaluate()) || null;
      view.addEventListener?.("resize", schedulePositionWarning);
      doc.addEventListener?.("scroll", schedulePositionWarning, true);
      reconcile();
    }

    function unmount() {
      if (!mounted) return;
      mounted = false;
      bindSurface(null);
      closeNativeDialog();
      removeLanguageChange?.();
      removeLanguageChange = null;
      view.removeEventListener?.("resize", schedulePositionWarning);
      doc.removeEventListener?.("scroll", schedulePositionWarning, true);
      clearPositionFrame();
      observedLanguage = null;
      dismissedWarning = null;
    }

    function snapshot() {
      return Object.freeze({
        mounted,
        surface: surface?.kind || "",
        languageObserved: Boolean(observedLanguage?.code),
        languageCode: referenceLanguage()?.code || "",
        languageSource: referenceLanguage()?.source || "",
        warningType: warning?.isConnected ? warning.className.split("--")[1] || "" : ""
      });
    }

    return Object.freeze({ mount, unmount, reconcile, snapshot, evaluateNow: evaluate });
  }

  if (typeof document === "object") {
    hub.communicationLanguageWarning = createController({
      doc: document,
      ui: hub.ui,
      i18n: hub.i18n
    });
  }

  if (typeof module === "object" && module.exports) {
    module.exports = {
      WARNING_ID,
      MIN_WORDS,
      MIN_LETTERS,
      INPUT_DEBOUNCE_MS,
      DISMISS_WORD_DELTA,
      DISMISS_LETTER_DELTA,
      hubLanguageFamily,
      analyzeCommunicationLanguage,
      languageWarningState,
      shouldSuppressDismissedWarning,
      warningPosition,
      surfaceText,
      createController
    };
  }
})(globalThis);
