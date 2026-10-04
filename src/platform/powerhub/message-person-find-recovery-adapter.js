((root) => {
  "use strict";

  const hub = root.PSQM ??= {};
  if (hub.messagePersonFindRecoveryAdapter) {
    if (typeof module === "object" && module.exports) module.exports = hub.messagePersonFindRecoveryAdapter;
    return;
  }

  const ORIGINAL_NAME_ATTR = "data-psqm-name";
  const OVERVIEW_PATH = "/";
  const DIRECTORY_PATH = "/directory";
  const DIRECTORY_INPUT_ID = "input-field-mfe-directory-text-name";
  const MESSAGES_LAYOUT_ID = "header-messenger-inbox-layout";
  const MESSAGES_BACK_BUTTON_ID = "button-layout-detail-back-button-null";
  const DIRECTORY_NAV_SELECTOR = "a#user-directory[href='/directory']";

  function normalizeSearchTerm(value) {
    return String(value || "").trim().replace(/\s+/gu, " ");
  }

  function groupMemberAttemptState({ connected, inVerifiedGroupPanel, extensionOwned, originalName } = {}) {
    const searchTerm = normalizeSearchTerm(originalName);
    const verified = connected === true
      && inVerifiedGroupPanel === true
      && extensionOwned !== true
      && Boolean(searchTerm);
    return Object.freeze({ verified, searchTerm: verified ? searchTerm : "" });
  }

  function isOverviewPath() {
    return (root.location?.pathname || "") === OVERVIEW_PATH;
  }

  function isDirectoryPath() {
    return (root.location?.pathname || "") === DIRECTORY_PATH;
  }

  function directorySurfaceState({
    pathname,
    candidateCount,
    tagName,
    type,
    connected,
    visible,
    disabled,
    readOnly,
    extensionOwned
  } = {}) {
    if (pathname !== DIRECTORY_PATH) return "MISSING";
    if (candidateCount > 1) return "AMBIGUOUS";
    if (candidateCount !== 1) return "MISSING";
    return tagName === "INPUT"
      && String(type || "").toLowerCase() === "text"
      && connected === true
      && visible === true
      && disabled !== true
      && readOnly !== true
      && extensionOwned !== true
      ? "FOUND"
      : "MISSING";
  }

  function prefillPolicy({ currentValue, searchTerm } = {}) {
    const current = normalizeSearchTerm(currentValue);
    const query = normalizeSearchTerm(searchTerm);
    if (!query) return "REFUSE";
    if (!current) return "WRITE";
    return current === query ? "ALREADY_PRESENT" : "REFUSE";
  }

  function visible(element) {
    if (!element) return false;
    const view = element.ownerDocument?.defaultView;
    let current = element;
    while (current?.nodeType === 1) {
      if (current.hidden === true
          || current.getAttribute?.("aria-hidden") === "true"
          || current.inert === true
          || current.hasAttribute?.("inert")) return false;
      if (typeof view?.getComputedStyle === "function") {
        const style = view.getComputedStyle(current);
        if (style?.display === "none"
            || style?.visibility === "hidden"
            || style?.visibility === "collapse"
            || Number(style?.opacity) === 0
            || style?.pointerEvents === "none") return false;
      }
      current = current.parentElement;
    }
    if (typeof element.getClientRects === "function" && element.getClientRects().length === 0) return false;
    return true;
  }

  function enabled(element) {
    if (!element || element.disabled === true) return false;
    try {
      if (element.matches?.(":disabled")) return false;
    } catch (_) {
      // Ignore selector support gaps and continue with explicit semantics.
    }
    let current = element;
    while (current?.nodeType === 1) {
      if (current.getAttribute?.("aria-disabled") === "true") return false;
      current = current.parentElement;
    }
    return true;
  }

  function inputFacts(input) {
    return {
      tagName: input?.tagName || "",
      type: input?.type || input?.getAttribute?.("type") || "",
      connected: input?.isConnected === true,
      visible: visible(input),
      disabled: !enabled(input),
      readOnly: input?.readOnly === true,
      extensionOwned: Boolean(input?.closest?.("[data-psqm-ui]"))
    };
  }

  function verifiedGroupMemberAttempt(element) {
    const panel = hub.ui?.messages?.groupInformationPanel?.();
    const inVerifiedGroupPanel = Boolean(panel?.verified && panel.element?.contains?.(element));
    const state = groupMemberAttemptState({
      connected: element?.isConnected === true,
      inVerifiedGroupPanel,
      extensionOwned: Boolean(element?.closest?.("[data-psqm-ui]")),
      originalName: element?.getAttribute?.(ORIGINAL_NAME_ATTR) || ""
    });
    return state.verified
      ? Object.freeze({ status: "FOUND", searchTerm: state.searchTerm, element })
      : Object.freeze({ status: "MISSING", searchTerm: "", element: null });
  }

  function verifiedDirectorySurface() {
    const doc = root.document;
    const pathname = root.location?.pathname || "";
    if (!doc?.querySelectorAll) return Object.freeze({ status: "MISSING", input: null });

    // PowerHub can briefly keep the previous micro-frontend tree mounted while
    // the Directory surface becomes visible. Count only usable, visible native
    // inputs so a hidden stale duplicate cannot turn a valid handoff into an
    // ambiguous/failure state.
    const candidates = [...doc.querySelectorAll(`#${DIRECTORY_INPUT_ID}`)]
      .filter((candidate) => {
        const facts = inputFacts(candidate);
        return candidate?.id === DIRECTORY_INPUT_ID
          && facts.tagName === "INPUT"
          && String(facts.type || "").toLowerCase() === "text"
          && facts.connected === true
          && facts.visible === true
          && facts.disabled !== true
          && facts.readOnly !== true
          && facts.extensionOwned !== true;
      });
    const input = candidates.length === 1 ? candidates[0] : null;
    const status = directorySurfaceState({ pathname, candidateCount: candidates.length, ...inputFacts(input) });
    return Object.freeze({ status, input: status === "FOUND" ? input : null });
  }

  function prefillDirectorySearch(input, searchTerm) {
    if (input?.id !== DIRECTORY_INPUT_ID) return Object.freeze({ status: "REFUSED" });
    const facts = inputFacts(input);
    const contract = directorySurfaceState({ pathname: DIRECTORY_PATH, candidateCount: 1, ...facts });
    if (contract !== "FOUND") return Object.freeze({ status: "REFUSED" });

    const query = normalizeSearchTerm(searchTerm);
    const policy = prefillPolicy({ currentValue: input.value, searchTerm: query });
    if (policy === "REFUSE") return Object.freeze({ status: "REFUSED" });
    if (policy === "ALREADY_PRESENT") return Object.freeze({ status: "ALREADY_PRESENT" });

    const view = input.ownerDocument?.defaultView;
    const InputCtor = view?.HTMLInputElement || root.HTMLInputElement;
    const EventCtor = view?.Event || root.Event;
    const descriptor = InputCtor?.prototype
      ? Object.getOwnPropertyDescriptor(InputCtor.prototype, "value")
      : null;
    if (typeof descriptor?.set !== "function" || typeof EventCtor !== "function") {
      return Object.freeze({ status: "REFUSED" });
    }

    try {
      descriptor.set.call(input, query);
      input.dispatchEvent(new EventCtor("input", { bubbles: true }));
      if (normalizeSearchTerm(input.value) !== query) {
        return Object.freeze({ status: "REFUSED" });
      }
      return Object.freeze({ status: "PREFILLED" });
    } catch (_) {
      return Object.freeze({ status: "REFUSED" });
    }
  }


  function messagesBackNavigation() {
    const doc = root.document;
    if (!doc?.querySelectorAll) return Object.freeze({ status: "MISSING", element: null });

    const layouts = [...doc.querySelectorAll(`#${MESSAGES_LAYOUT_ID}`)]
      .filter(layout => layout?.isConnected === true && visible(layout) && !layout.closest?.("[data-psqm-ui]"));
    if (layouts.length > 1) return Object.freeze({ status: "AMBIGUOUS", element: null });
    const layout = layouts[0] || null;
    if (!layout?.querySelectorAll) return Object.freeze({ status: "MISSING", element: null });

    const candidates = [...layout.querySelectorAll(`#${MESSAGES_BACK_BUTTON_ID}`)]
      .filter(element => element?.id === MESSAGES_BACK_BUTTON_ID
        && element.tagName === "BUTTON"
        && element.isConnected === true
        && layout.contains?.(element) === true
        && visible(element)
        && enabled(element)
        && !element.closest?.("[data-psqm-ui]"));
    if (candidates.length > 1) return Object.freeze({ status: "AMBIGUOUS", element: null });
    const element = candidates[0] || null;
    return Object.freeze({ status: element ? "FOUND" : "MISSING", element });
  }

  function directoryNavigation() {
    const doc = root.document;
    if (!doc?.querySelectorAll) return Object.freeze({ status: "MISSING", element: null });

    // Responsive navigation may leave a hidden duplicate in the DOM. Match the
    // shared Hub locator contract: ambiguity is based on visible native targets,
    // not on hidden/stale copies.
    const candidates = [...doc.querySelectorAll(DIRECTORY_NAV_SELECTOR)]
      .filter(element => element?.tagName === "A"
        && element.id === "user-directory"
        && element.getAttribute?.("href") === DIRECTORY_PATH
        && element.isConnected === true
        && visible(element)
        && enabled(element)
        && !element.closest?.("[data-psqm-ui]"));
    if (candidates.length > 1) return Object.freeze({ status: "AMBIGUOUS", element: null });
    const element = candidates[0] || null;
    return Object.freeze({ status: element ? "FOUND" : "MISSING", element });
  }

  const api = Object.freeze({
    ORIGINAL_NAME_ATTR,
    OVERVIEW_PATH,
    DIRECTORY_PATH,
    DIRECTORY_INPUT_ID,
    MESSAGES_LAYOUT_ID,
    MESSAGES_BACK_BUTTON_ID,
    DIRECTORY_NAV_SELECTOR,
    normalizeSearchTerm,
    groupMemberAttemptState,
    directorySurfaceState,
    isOverviewPath,
    isDirectoryPath,
    prefillPolicy,
    verifiedGroupMemberAttempt,
    verifiedDirectorySurface,
    prefillDirectorySearch,
    messagesBackNavigation,
    directoryNavigation
  });

  hub.messagePersonFindRecoveryAdapter = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(globalThis);
