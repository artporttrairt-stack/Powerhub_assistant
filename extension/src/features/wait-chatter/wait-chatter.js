(function (root) {
  "use strict";

  const hub = root.PSQM ??= {};
  if (hub.waitChatter) return;

  const FIRST_DELAY_MS = 1800;
  const ROTATE_DELAY_MS = 4500;
  const MAX_MESSAGES = 3;
  const MESSAGE_KEYS = Object.freeze([
    "hello",
    "coffee",
    "scenic",
    "backup",
    "recipients",
    "sharepoint",
    "photos",
    "autosave",
    "stage",
    "signal"
  ]);

  function pickMessageKeys(pool = MESSAGE_KEYS, count = MAX_MESSAGES, random = Math.random) {
    const items = [...pool];
    const priority = ["hello", "backup", "sharepoint"];
    const picked = [];

    for (const key of priority) {
      const index = items.indexOf(key);
      if (index >= 0) {
        picked.push(key);
        items.splice(index, 1);
      }
    }

    for (let index = items.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
    }

    return [...picked, ...items].slice(0, Math.max(0, Math.min(count, picked.length + items.length)));
  }

  function isReadyForArea(doc, area) {
    if (!doc) return true;
    if (area === "newsfeed") {
      // A Newsfeed route can expose the New post button before the feed itself
      // has finished rendering. Prefer the already-verified adapter condition
      // so WAIT-CHAT stays visible through the real Newsfeed loading screen.
      // Composer/preview are independently considered ready because they are
      // complete user-facing Newsfeed surfaces.
      if (
        doc.getElementById("compose-view-layout")
        || doc.querySelector('[data-testid="post-newsfeed-modal"]')
      ) return true;

      const pageState = hub.ui?.condition?.("newsfeed.pageVisible");
      if (pageState?.verified) return Boolean(pageState.met);

      // Standalone/fallback path used before the UI adapter is available.
      return Boolean(doc.getElementById("button-post-compose-btn"));
    }
    if (area === "messages") {
      return Boolean(
        doc.getElementById("conversationListRegion")
        || doc.getElementById("conversationRegion")
        || doc.getElementById("button-new-conversation-button")
        || doc.getElementById("recipient-search-input")
        || doc.getElementById("messenger-inbox-message-input-text-field")
      );
    }
    return true;
  }

  function createWaitChatter(doc, location) {
    if (!doc || !location) return null;

    let mounted = false;
    let area = null;
    let timer = null;
    let messageKeys = [];
    let messageIndex = -1;
    let card = null;
    let title = null;
    let body = null;

    const tr = (key, vars = {}, fallback = "") => hub.i18n?.t?.(key, vars, fallback) || fallback || key || "";

    function clearTimer() {
      if (timer !== null) doc.defaultView.clearTimeout(timer);
      timer = null;
    }

    function removeCard() {
      card?.remove();
      card = title = body = null;
    }

    function stop() {
      clearTimer();
      area = null;
      messageKeys = [];
      messageIndex = -1;
      removeCard();
    }

    function teacherIsTyping() {
      const active = doc.activeElement;
      return Boolean(active && (
        active.matches?.("input, textarea")
        || active.isContentEditable
        || active.getAttribute?.("contenteditable") === "true"
      ));
    }

    function walkthroughIsVisible() {
      const guide = doc.querySelector("#psqm-guide-panel:not([hidden]), #psqm-guide-bubble:not([hidden])");
      return Boolean(guide);
    }

    function nativeErrorVisible() {
      const alert = doc.querySelector('[role="alert"], [data-testid*="error"]');
      if (!alert) return false;
      const text = String(alert.textContent || "").replace(/\s+/gu, " ").trim();
      return /\b(?:error|failed|unavailable)\b|(?:lỗi|không thể tải)/iu.test(text);
    }

    function shouldStopCurrent() {
      if (!area) return true;
      if (doc.hidden || teacherIsTyping() || walkthroughIsVisible() || nativeErrorVisible()) return true;
      if (area === "newsfeed" && location.pathname !== "/") return true;
      return isReadyForArea(doc, area);
    }

    function ensureCard() {
      if (card?.isConnected) return card;
      card = doc.createElement("aside");
      card.id = "psqm-wait-chatter";
      card.className = "psqm-wait-chatter";
      card.dataset.psqmUi = "wait-chatter";
      card.setAttribute("role", "status");
      card.setAttribute("aria-live", "polite");
      card.setAttribute("aria-atomic", "true");

      const message = doc.createElement("div");
      message.className = "psqm-wait-chatter__message";
      title = doc.createElement("strong");
      title.className = "psqm-wait-chatter__title";
      body = doc.createElement("span");
      body.className = "psqm-wait-chatter__body";
      message.append(title, body);
      card.append(message);
      doc.body.append(card);
      return card;
    }

    function renderMessage(key) {
      ensureCard();
      card.lang = hub.i18n?.language?.() === "vi" ? "vi" : "en";
      title.textContent = tr(`waitChat.${key}.title`);
      body.textContent = tr(`waitChat.${key}.body`);

      const reduceMotion = doc.defaultView.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      const message = card.querySelector(".psqm-wait-chatter__message");
      if (!reduceMotion && typeof message?.animate === "function") {
        message.animate(
          [
            { opacity: 0, transform: "translateY(10px)" },
            { opacity: 1, transform: "translateY(0)" }
          ],
          { duration: 240, easing: "ease-out" }
        );
      }
    }

    function schedule(delay, callback) {
      clearTimer();
      timer = doc.defaultView.setTimeout(() => {
        timer = null;
        callback();
      }, delay);
    }

    function advance() {
      if (shouldStopCurrent()) {
        stop();
        return;
      }

      messageIndex += 1;
      if (messageIndex >= messageKeys.length) {
        clearTimer();
        return;
      }

      renderMessage(messageKeys[messageIndex]);
      if (messageIndex < messageKeys.length - 1) {
        schedule(ROTATE_DELAY_MS, advance);
      }
    }

    function begin(nextArea) {
      if (hub.languageIntro?.blocksOtherOnboarding?.()) return false;
      if (!["newsfeed", "messages"].includes(nextArea)) return false;
      if (isReadyForArea(doc, nextArea) || doc.hidden || teacherIsTyping() || walkthroughIsVisible() || nativeErrorVisible()) {
        if (area === nextArea) stop();
        return false;
      }
      if (area === nextArea) return true;

      stop();
      area = nextArea;
      messageKeys = pickMessageKeys();
      messageIndex = -1;
      schedule(FIRST_DELAY_MS, advance);
      return true;
    }

    function reconcile() {
      if (hub.languageIntro?.blocksOtherOnboarding?.()) {
        stop();
        return;
      }
      if (area) {
        if (shouldStopCurrent()) stop();
        return;
      }
      if (location.pathname === "/" && !isReadyForArea(doc, "newsfeed")) begin("newsfeed");
    }

    function handleNavigationIntent(event) {
      const target = event.target?.closest?.("a, button, [role='button']");
      if (!target) return;

      if (target.matches("#button-header-messenger-inbox")) {
        begin("messages");
        return;
      }

      if (target.matches("a#post-newsfeed[href='/']")) {
        begin("newsfeed");
        return;
      }

      if (target.matches("a#user-directory[href='/directory']")) stop();
    }

    function mount() {
      if (mounted) return;
      mounted = true;
      doc.addEventListener("click", handleNavigationIntent, true);
      hub.i18n?.onChange?.(() => {
        if (area && messageIndex >= 0 && messageKeys[messageIndex]) renderMessage(messageKeys[messageIndex]);
      });
      reconcile();
    }

    return Object.freeze({
      mount,
      reconcile,
      stop,
      begin,
      snapshot: () => Object.freeze({
        area,
        visible: Boolean(card?.isConnected),
        messageIndex,
        timerPending: timer !== null
      })
    });
  }

  hub.waitChatter = typeof document === "object" ? createWaitChatter(document, root.location) : null;

  if (typeof module === "object" && module.exports) {
    module.exports = {
      createWaitChatter,
      isReadyForArea,
      pickMessageKeys,
      MESSAGE_KEYS,
      FIRST_DELAY_MS,
      ROTATE_DELAY_MS,
      MAX_MESSAGES
    };
  }
})(globalThis);
