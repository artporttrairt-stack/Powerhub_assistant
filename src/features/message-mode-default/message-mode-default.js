(function (root) {
  "use strict";

  const hub = root.PSQM ??= {};

  const SELECTORS = Object.freeze({
    composer: "#conversationRegion",
    recipientChip: '[data-testid="messenger-recipient-chip"]',
    individuallyCheckbox: "#checkbox-message-individually-checkbox"
  });

  const state = {
    composer: null,
    recipientSignature: "",
    defaultAppliedForSignature: "",
    userChoiceForSignature: "",
    internalToggle: false,
    bubble: null
  };

  function clean(value) {
    return String(value || "").trim();
  }

  function composer(doc = root.document) {
    const element = doc?.querySelector?.(SELECTORS.composer);
    return element?.isConnected ? element : null;
  }

  function recipientChips(composerElement) {
    if (!composerElement) return [];
    return [...composerElement.querySelectorAll(SELECTORS.recipientChip)]
      .filter(element => element.isConnected);
  }

  function recipientIdentity(chip, index) {
    return (
      clean(chip.id) ||
      clean(chip.getAttribute?.("data-id")) ||
      clean(chip.getAttribute?.("data-recipient-id")) ||
      `recipient-${index}`
    );
  }

  function recipientState(composerElement) {
    const chips = recipientChips(composerElement);
    const ids = chips.map(recipientIdentity).sort();

    return {
      count: chips.length,
      signature: ids.join("|")
    };
  }

  function individuallyCheckbox(composerElement) {
    if (!composerElement) return null;

    const checkbox = composerElement.querySelector(SELECTORS.individuallyCheckbox);

    if (
      !checkbox ||
      !checkbox.isConnected ||
      checkbox.type !== "checkbox" ||
      checkbox.disabled
    ) {
      return null;
    }

    return checkbox;
  }

  function safelyToggleCheckbox(checkbox, desiredState) {
    if (!checkbox || checkbox.checked === desiredState) return true;

    state.internalToggle = true;

    try {
      checkbox.click();
    } finally {
      queueMicrotask(() => {
        state.internalToggle = false;
      });
    }

    return checkbox.checked === desiredState;
  }

  function language() {
    return hub.i18n?.language?.() === "vi" ? "vi" : "en";
  }

  function strings() {
    if (language() === "vi") {
      return {
        question: "👀 Kiểm tra nhanh — nhắn riêng hay tạo nhóm?",
        separate: "Nhắn riêng từng người",
        group: "Tạo nhóm",
        close: "Đóng"
      };
    }

    return {
      question: "👀 Quick check — send separately or create a group?",
      separate: "Send separately",
      group: "Create group",
      close: "Close"
    };
  }

  function removeBubble() {
    state.bubble?.remove();
    state.bubble = null;
  }

  function createButton(doc, label, className, handler) {
    const button = doc.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", handler);
    return button;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function positionBubble(bubble, checkbox, view = root) {
    if (!bubble?.isConnected || !checkbox?.isConnected) return;

    const margin = 12;
    const gap = 10;
    const rect = checkbox.getBoundingClientRect();
    const bubbleRect = bubble.getBoundingClientRect();

    const vw = view.innerWidth || root.document?.documentElement?.clientWidth || 0;
    const vh = view.innerHeight || root.document?.documentElement?.clientHeight || 0;

    const candidates = [
      {
        left: rect.right - bubbleRect.width,
        top: rect.bottom + gap
      },
      {
        left: rect.right - bubbleRect.width,
        top: rect.top - bubbleRect.height - gap
      },
      {
        left: rect.left - bubbleRect.width - gap,
        top: rect.top + (rect.height - bubbleRect.height) / 2
      }
    ];

    function overlapArea(point) {
      const left = Math.max(point.left, rect.left);
      const top = Math.max(point.top, rect.top);
      const right = Math.min(point.left + bubbleRect.width, rect.right);
      const bottom = Math.min(point.top + bubbleRect.height, rect.bottom);
      return Math.max(0, right - left) * Math.max(0, bottom - top);
    }

    const scored = candidates.map((candidate, index) => {
      const point = {
        left: clamp(candidate.left, margin, Math.max(margin, vw - bubbleRect.width - margin)),
        top: clamp(candidate.top, margin, Math.max(margin, vh - bubbleRect.height - margin))
      };

      return {
        ...point,
        overlap: overlapArea(point),
        index
      };
    });

    scored.sort((a, b) => a.overlap - b.overlap || a.index - b.index);
    const best = scored[0];

    bubble.style.left = `${best.left}px`;
    bubble.style.top = `${best.top}px`;
    bubble.style.right = "auto";
    bubble.style.bottom = "auto";
  }

  function showDecisionBubble(composerElement, signature) {
    const doc = composerElement?.ownerDocument || root.document;
    const languageCode = language();

    if (
      state.bubble?.isConnected &&
      state.bubble.dataset.recipientSignature === signature &&
      state.bubble.dataset.language === languageCode
    ) {
      positionBubble(
        state.bubble,
        individuallyCheckbox(composerElement)
      );
      return;
    }

    removeBubble();

    const text = strings();
    const bubble = doc.createElement("section");

    bubble.className = "psqm-message-mode-choice";
    bubble.dataset.psqmUi = "message-mode-choice";
    bubble.dataset.recipientSignature = signature;
    bubble.dataset.language = languageCode;
    bubble.lang = languageCode;
    bubble.setAttribute("role", "dialog");
    bubble.setAttribute("aria-label", text.question);

    const question = doc.createElement("p");
    question.className = "psqm-message-mode-choice__question";
    question.textContent = text.question;

    const actions = doc.createElement("div");
    actions.className = "psqm-message-mode-choice__actions";

    const separateButton = createButton(
      doc,
      text.separate,
      "psqm-message-mode-choice__primary",
      () => {
        const checkbox = individuallyCheckbox(composerElement);

        if (checkbox) {
          safelyToggleCheckbox(checkbox, true);
        }

        state.userChoiceForSignature = `separate:${signature}`;
        removeBubble();
      }
    );

    const groupButton = createButton(
      doc,
      text.group,
      "psqm-message-mode-choice__secondary",
      () => {
        state.userChoiceForSignature = `group:${signature}`;

        const checkbox = individuallyCheckbox(composerElement);

        if (checkbox) {
          safelyToggleCheckbox(checkbox, false);
        }

        removeBubble();
      }
    );

    const closeButton = createButton(
      doc,
      "×",
      "psqm-message-mode-choice__close",
      () => {
        // Closing the helper keeps the safe default ON.
        state.userChoiceForSignature = `separate:${signature}`;
        removeBubble();
      }
    );

    closeButton.setAttribute("aria-label", text.close);

    actions.append(separateButton, groupButton);
    bubble.append(closeButton, question, actions);

    doc.body.append(bubble);
    state.bubble = bubble;

    positionBubble(
      bubble,
      individuallyCheckbox(composerElement)
    );
  }

  function resetComposer(nextComposer) {
    removeBubble();

    state.composer = nextComposer;
    state.recipientSignature = "";
    state.defaultAppliedForSignature = "";
    state.userChoiceForSignature = "";
    state.internalToggle = false;
  }

  function reconcile() {
    const currentComposer = composer();

    if (!currentComposer) {
      if (state.composer) resetComposer(null);
      return;
    }

    if (state.composer !== currentComposer) {
      resetComposer(currentComposer);
    }

    const recipients = recipientState(currentComposer);

    if (recipients.count < 2) {
      removeBubble();
      state.recipientSignature = recipients.signature;
      return;
    }

    const signature = recipients.signature;

    if (signature !== state.recipientSignature) {
      state.recipientSignature = signature;
      state.defaultAppliedForSignature = "";
      state.userChoiceForSignature = "";
    }

    const checkbox = individuallyCheckbox(currentComposer);
    if (!checkbox) return;

    if (state.userChoiceForSignature.endsWith(`:${signature}`)) {
      return;
    }

    if (state.defaultAppliedForSignature !== signature) {
      safelyToggleCheckbox(checkbox, true);
      state.defaultAppliedForSignature = signature;
    }

    showDecisionBubble(currentComposer, signature);
  }

  function handleNativeClick(event) {
    if (state.internalToggle) return;

    const checkbox = event.target?.closest?.(SELECTORS.individuallyCheckbox);
    if (!checkbox) return;

    const currentComposer = composer();
    if (!currentComposer) return;

    const recipients = recipientState(currentComposer);
    if (recipients.count < 2) return;

    state.userChoiceForSignature =
      `${checkbox.checked ? "separate" : "group"}:${recipients.signature}`;

    removeBubble();
  }

  function mount() {
    root.document?.addEventListener?.("click", handleNativeClick, true);
    reconcile();
  }

  function unmount() {
    root.document?.removeEventListener?.("click", handleNativeClick, true);
    resetComposer(null);
  }

  hub.messageModeDefault = Object.freeze({
    mount,
    unmount,
    reconcile,
    snapshot: () => ({
      recipientSignature: state.recipientSignature,
      defaultAppliedForSignature: state.defaultAppliedForSignature,
      userChoiceForSignature: state.userChoiceForSignature,
      internalToggle: state.internalToggle
    })
  });

  if (typeof module === "object" && module.exports) {
    module.exports = {
      SELECTORS,
      recipientState,
      safelyToggleCheckbox,
      clamp
    };
  }
})(globalThis);
