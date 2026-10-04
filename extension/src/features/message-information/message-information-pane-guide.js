(function (root) {
  "use strict";

  const hub = root.PSQM ??= {};
  if (hub.messageInformationPaneGuide) return;

  const CARD_ID = "psqm-message-information-pane-guide";
  const SETTINGS_ID = "conversationSettings";
  const PANEL_SELECTOR =
    'section[data-testid="messenger-group-information-panel"][aria-labelledby="messenger-group-information-heading"]';
  const TARGET_CLASS = "psqm-message-information-pane-guide__target";
  const STEP_SELECTORS = Object.freeze([
    "#messenger-inbox__channel-settings-operator-list-accordion-toggle",
    "#messenger-inbox__channel-settings-member-list-accordion-toggle",
    "#messenger-inbox__channel-settings-member-actions-accordion-toggle",
    "#messenger-inbox__channel-notifications-toggle-input-tooltip-trigger",
    "#button-messenger-inbox__staff-create-group-from-group-button"
  ]);

  const COPY = Object.freeze({
    en: Object.freeze({
      label: "Group Information guide",
      back: "Back",
      next: "Next",
      done: "Done",
      close: "Close guide",
      step: "Step",
      finishTitle: "One last step here",
      finishBody: "Close Group Information using the X to continue.",
      steps: Object.freeze([
        Object.freeze({
          title: "Moderators",
          body: "Shows who can help manage the conversation."
        }),
        Object.freeze({
          title: "Members",
          body: "Shows who is part of the conversation."
        }),
        Object.freeze({
          title: "Message replies",
          body: "Shows whether members can reply or react."
        }),
        Object.freeze({
          title: "Pause notifications",
          body: "Need some quiet? This can pause notifications for your account without leaving the conversation."
        }),
        Object.freeze({
          title: "Create group chat",
          body: "This option also appears here in Information. No need to click it yet — I’ll show you the main button next."
        })
      ])
    }),
    vi: Object.freeze({
      label: "Hướng dẫn Group Information",
      back: "Quay lại",
      next: "Tiếp",
      done: "Hoàn tất",
      close: "Đóng hướng dẫn",
      step: "Bước",
      finishTitle: "Còn một bước ở đây",
      finishBody: "Đóng Group Information bằng nút X để tiếp tục nhé.",
      steps: Object.freeze([
        Object.freeze({
          title: "Moderators",
          body: "Cho biết ai có thể hỗ trợ quản lý cuộc trò chuyện."
        }),
        Object.freeze({
          title: "Members",
          body: "Cho biết những ai đang trong cuộc trò chuyện."
        }),
        Object.freeze({
          title: "Message replies",
          body: "Cho biết thành viên có thể trả lời hoặc thả reaction hay không."
        }),
        Object.freeze({
          title: "Pause notifications",
          body: "Cần yên tĩnh một chút? Mục này có thể tạm dừng thông báo cho tài khoản của bạn mà không rời cuộc trò chuyện."
        }),
        Object.freeze({
          title: "Create group chat",
          body: "Bạn cũng sẽ thấy lựa chọn này trong Information. Chưa cần bấm nhé — bước tiếp theo mình sẽ chỉ nút chính."
        })
      ])
    })
  });

  function stepModel(copy, index, selectors = STEP_SELECTORS) {
    const steps = Array.isArray(copy?.steps) ? copy.steps : [];
    const total = Math.min(steps.length, selectors.length);
    if (!total) return null;

    const safeIndex = Math.min(
      Math.max(Number.isInteger(index) ? index : 0, 0),
      total - 1
    );
    const step = steps[safeIndex];

    return Object.freeze({
      index: safeIndex,
      total,
      title: step.title,
      body: step.body,
      selector: selectors[safeIndex],
      progress: `${safeIndex + 1} / ${total}`,
      canGoBack: safeIndex > 0,
      isLast: safeIndex === total - 1
    });
  }

  function layoutRect(element, view = root) {
    const rect = element?.getBoundingClientRect?.();
    if (rect && rect.width > 0 && rect.height > 0) return rect;

    if (view.getComputedStyle?.(element)?.display !== "contents") return rect;

    const childRects = Array.from(element.children || [], child => {
      if (!(child instanceof view.HTMLElement) || !child.isConnected) return null;
      if (child.hidden || child.closest?.('[hidden], [aria-hidden="true"]')) return null;

      const style = view.getComputedStyle?.(child);
      if (style && (
        style.display === "none"
        || style.visibility === "hidden"
        || style.opacity === "0"
      )) return null;

      const childRect = child.getBoundingClientRect?.();
      return childRect && childRect.width > 0 && childRect.height > 0
        ? childRect
        : null;
    }).filter(Boolean);

    if (!childRects.length) return rect;

    const left = Math.min(...childRects.map(childRect => childRect.left));
    const top = Math.min(...childRects.map(childRect => childRect.top));
    const right = Math.max(...childRects.map(childRect => childRect.right));
    const bottom = Math.max(...childRects.map(childRect => childRect.bottom));

    return { left, top, right, bottom, width: right - left, height: bottom - top };
  }

  function visible(element, view = root) {
    if (!(element instanceof view.HTMLElement) || !element.isConnected) return false;
    if (element.hidden || element.closest?.('[hidden], [aria-hidden="true"]')) return false;

    const style = view.getComputedStyle?.(element);
    if (style && (
      style.display === "none"
      || style.visibility === "hidden"
      || style.opacity === "0"
    )) return false;

    const rect = layoutRect(element, view);
    return Boolean(rect && rect.width > 0 && rect.height > 0);
  }

  function language(deps) {
    return deps.i18n?.language?.() === "vi" ? "vi" : "en";
  }

  function informationReviewPhase({ panelPresent = false, panelSeen = false, reviewComplete = false } = {}) {
    if (panelPresent) return reviewComplete ? "awaiting-close" : "reviewing";
    if (!panelSeen) return "waiting-panel";
    return reviewComplete ? "review-complete-closed" : "closed-before-review";
  }

  function createController(doc = root.document, view = root, deps = hub) {
    let card = null;
    let highlightedTarget = null;
    let stepIndex = 0;
    let panelSeen = false;
    let dismissed = false;
    let reviewComplete = false;
    let reviewCompleteListener = null;

    function clearTarget() {
      highlightedTarget?.classList?.remove?.(TARGET_CLASS);
      highlightedTarget = null;
    }

    function removeCard() {
      card?.remove?.();
      card = null;
      clearTarget();
    }

    function reset() {
      removeCard();
      stepIndex = 0;
      panelSeen = false;
      dismissed = false;
      reviewComplete = false;
      reviewCompleteListener = null;
    }

    function hide() {
      removeCard();
    }

    function resolvePanel() {
      const settings = doc?.getElementById?.(SETTINGS_ID);
      if (!(settings instanceof view.HTMLElement) || !settings.isConnected) return null;

      const candidates = [];

      if (settings.matches?.(PANEL_SELECTOR)) {
        candidates.push(settings);
      }

      for (const panel of settings.querySelectorAll?.(PANEL_SELECTOR) || []) {
        if (!candidates.includes(panel)) candidates.push(panel);
      }

      const matches = candidates.filter(panel => visible(panel, view));
      return matches.length === 1 ? matches[0] : null;
    }

    function resolveStepTarget(panel, selector) {
      if (!panel || !selector) return null;
      const target = panel.matches?.(selector)
        ? panel
        : panel.querySelector?.(selector);
      return visible(target, view) ? target : null;
    }

    function resolvePanelCloseTarget(panel) {
      if (!panel) return null;
      const buttons = Array.from(panel.querySelectorAll?.("button") || [])
        .filter(button => visible(button, view));
      const matches = buttons.filter(button => {
        const aria = String(button.getAttribute?.("aria-label") || "").trim().toLowerCase();
        const title = String(button.getAttribute?.("title") || "").trim().toLowerCase();
        return [aria, title].some(value => [
          "close",
          "close group information",
          "close information",
          "dismiss"
        ].includes(value));
      });
      return matches.length === 1 ? matches[0] : null;
    }

    function position(target) {
      if (!card?.isConnected || !visible(target, view)) return;

      const viewportWidth =
        view.innerWidth || doc.documentElement?.clientWidth || 1024;
      const viewportHeight =
        view.innerHeight || doc.documentElement?.clientHeight || 768;
      const margin = 14;
      const gap = 12;
      const targetRect = layoutRect(target, view);
      const cardRect = card.getBoundingClientRect();

      const candidates = [
        {
          placement: "left",
          left: targetRect.left - cardRect.width - gap,
          top: targetRect.top + (targetRect.height - cardRect.height) / 2
        },
        {
          placement: "right",
          left: targetRect.right + gap,
          top: targetRect.top + (targetRect.height - cardRect.height) / 2
        },
        {
          placement: "below",
          left: targetRect.left + (targetRect.width - cardRect.width) / 2,
          top: targetRect.bottom + gap
        },
        {
          placement: "above",
          left: targetRect.left + (targetRect.width - cardRect.width) / 2,
          top: targetRect.top - cardRect.height - gap
        }
      ];

      const clamp = candidate => ({
        left: Math.min(
          Math.max(margin, candidate.left),
          Math.max(margin, viewportWidth - cardRect.width - margin)
        ),
        top: Math.min(
          Math.max(margin, candidate.top),
          Math.max(margin, viewportHeight - cardRect.height - margin)
        )
      });

      const overlap = candidate => {
        const right = candidate.left + cardRect.width;
        const bottom = candidate.top + cardRect.height;

        return Math.max(
          0,
          Math.min(right, targetRect.right) - Math.max(candidate.left, targetRect.left)
        ) * Math.max(
          0,
          Math.min(bottom, targetRect.bottom) - Math.max(candidate.top, targetRect.top)
        );
      };

      const placed = candidates
        .map((candidate, order) => {
          const point = clamp(candidate);
          return {
            ...point,
            placement: candidate.placement,
            overlap: overlap(point),
            order
          };
        })
        .sort((a, b) => a.overlap - b.overlap || a.order - b.order)[0];

      card.style.left = `${placed.left}px`;
      card.style.top = `${placed.top}px`;
      card.dataset.placement = placed.placement;

      const verticalOffset = Math.min(
        Math.max(18, targetRect.top + targetRect.height / 2 - placed.top),
        Math.max(18, cardRect.height - 18)
      );
      const horizontalOffset = Math.min(
        Math.max(18, targetRect.left + targetRect.width / 2 - placed.left),
        Math.max(18, cardRect.width - 18)
      );
      card.style.setProperty(
        "--psqm-information-guide-arrow-offset",
        `${["left", "right"].includes(placed.placement) ? verticalOffset : horizontalOffset}px`
      );
    }

    function renderClosePrompt(panel) {
      const languageCode = language(deps);
      const copy = COPY[languageCode];
      const target = resolvePanelCloseTarget(panel) || panel;

      if (
        card?.isConnected
        && card.dataset.phase === "awaiting-close"
        && card.dataset.language === languageCode
        && highlightedTarget === target
      ) {
        position(target);
        return;
      }

      removeCard();

      card = doc.createElement("section");
      card.id = CARD_ID;
      card.dataset.psqmUi = "1";
      card.dataset.phase = "awaiting-close";
      card.dataset.language = languageCode;
      card.lang = languageCode;
      card.setAttribute("role", "status");
      card.setAttribute("aria-live", "polite");
      card.setAttribute("aria-labelledby", `${CARD_ID}-title`);
      card.setAttribute("aria-describedby", `${CARD_ID}-body`);

      const header = doc.createElement("div");
      header.className = "psqm-message-information-pane-guide__header";

      const heading = doc.createElement("h2");
      heading.id = `${CARD_ID}-title`;
      heading.textContent = copy.finishTitle;
      header.append(heading);

      const body = doc.createElement("p");
      body.id = `${CARD_ID}-body`;
      body.className = "psqm-message-information-pane-guide__body";
      body.textContent = copy.finishBody;

      card.append(header, body);
      doc.body.append(card);

      highlightedTarget = target;
      highlightedTarget.classList?.add?.(TARGET_CLASS);
      position(target);
    }

    function render(panel) {
      if (dismissed) return;

      const languageCode = language(deps);
      const copy = COPY[languageCode];
      const model = stepModel(copy, stepIndex);
      if (!model) return;

      const target = resolveStepTarget(panel, model.selector) || panel;

      if (
        card?.isConnected
        && card.dataset.step === String(model.index + 1)
        && card.dataset.language === languageCode
        && highlightedTarget === target
      ) {
        position(target);
        return;
      }

      removeCard();

      card = doc.createElement("section");
      card.id = CARD_ID;
      card.dataset.psqmUi = "1";
      card.dataset.step = String(model.index + 1);
      card.dataset.language = languageCode;
      card.lang = languageCode;
      card.setAttribute("role", "dialog");
      card.setAttribute("aria-label", copy.label);
      card.setAttribute("aria-labelledby", `${CARD_ID}-title`);
      card.setAttribute("aria-describedby", `${CARD_ID}-body`);

      const header = doc.createElement("div");
      header.className = "psqm-message-information-pane-guide__header";

      const heading = doc.createElement("h2");
      heading.id = `${CARD_ID}-title`;
      heading.textContent = model.title;

      const progress = doc.createElement("span");
      progress.className = "psqm-message-information-pane-guide__progress";
      progress.textContent = model.progress;
      progress.setAttribute("aria-label", `${copy.step} ${model.progress}`);

      const close = doc.createElement("button");
      close.type = "button";
      close.className = "psqm-message-information-pane-guide__close";
      close.setAttribute("aria-label", copy.close);
      close.textContent = "×";
      close.addEventListener("click", () => {
        dismissed = true;
        removeCard();
      }, { once: true });

      header.append(heading, progress, close);

      const body = doc.createElement("p");
      body.id = `${CARD_ID}-body`;
      body.className = "psqm-message-information-pane-guide__body";
      body.textContent = model.body;

      const actions = doc.createElement("div");
      actions.className = "psqm-message-information-pane-guide__actions";

      const back = doc.createElement("button");
      back.type = "button";
      back.className = "psqm-message-information-pane-guide__back";
      back.textContent = copy.back;
      back.disabled = !model.canGoBack;
      back.addEventListener("click", () => {
        stepIndex = Math.max(0, stepIndex - 1);
        render(panel);
      });

      const next = doc.createElement("button");
      next.type = "button";
      next.className = "psqm-message-information-pane-guide__next";
      next.textContent = model.isLast ? copy.done : copy.next;
      next.addEventListener("click", () => {
        if (model.isLast) {
          reviewComplete = true;
          renderClosePrompt(panel);
          return;
        }

        stepIndex = Math.min(model.total - 1, stepIndex + 1);
        render(panel);
      });

      actions.append(back, next);
      card.append(header, body, actions);
      doc.body.append(card);

      highlightedTarget = target;
      highlightedTarget.classList?.add?.(TARGET_CLASS);
      position(target);
    }

    function reconcile({ active = false, onReviewComplete = null } = {}) {
      reviewCompleteListener = typeof onReviewComplete === "function"
        ? onReviewComplete
        : reviewCompleteListener;
      if (!active || !doc?.body) {
        reset();
        return Object.freeze({ phase: "inactive", panelSeen: false });
      }

      const panel = resolvePanel();
      if (panel) panelSeen = true;

      const phase = informationReviewPhase({
        panelPresent: Boolean(panel),
        panelSeen,
        reviewComplete
      });

      if (phase === "reviewing") {
        render(panel);
        return Object.freeze({ phase, panelSeen: true, panel });
      }

      if (phase === "awaiting-close") {
        renderClosePrompt(panel);
        return Object.freeze({ phase, panelSeen: true, panel });
      }

      removeCard();

      if (phase === "review-complete-closed") {
        const listener = reviewCompleteListener;
        reviewCompleteListener = null;
        if (typeof listener === "function") listener();
      }

      return Object.freeze({
        phase,
        panelSeen
      });
    }

    function snapshot() {
      const model = stepModel(COPY[language(deps)], stepIndex);
      return Object.freeze({
        panelSeen,
        dismissed,
        reviewComplete,
        cardVisible: Boolean(card?.isConnected),
        step: model ? model.index + 1 : 0,
        stepCount: model?.total || 0
      });
    }

    return Object.freeze({
      reconcile,
      resolvePanel,
      hide,
      reset,
      snapshot
    });
  }

  if (root.document) {
    hub.messageInformationPaneGuide =
      createController(root.document, root, hub);
  }

  if (typeof module === "object" && module.exports) {
    module.exports = {
      SETTINGS_ID,
      PANEL_SELECTOR,
      STEP_SELECTORS,
      COPY,
      stepModel,
      visible,
      informationReviewPhase,
      createController
    };
  }
})(globalThis);
