((root) => {
  "use strict";

  const hub = root.PSQM ??= {};
  if (hub.integrationBridgeNative) return;

  const HUB_ORIGIN = "https://vas.educator.powerschool.com";
  const DRAWER_ID = "mfe-application-menu-app-menu-drawer";
  const CUE_ID = "psqm-integration-bridge-cue";
  const LAUNCHER_CLASS = "psqm-integration-bridge-launcher";
  const TILE_CLASS = "psqm-integration-bridge-tile";
  const PENDING_KEY = "integrationBridge.firstTutorialPendingV1";
  const SHOWN_KEY = "integrationBridge.firstTutorialShownV1";
  const COPY = Object.freeze({
    en: Object.freeze({
      question: "Would you like to access Student Management?",
      launcher: "Use the Applications menu to open PowerSchool SIS.",
      tile: "Select PowerSchool SIS to open Student Management.",
      close: "Close"
    }),
    vi: Object.freeze({
      question: "Bạn có muốn truy cập Quản lý học sinh?",
      launcher: "Nhấn vào biểu tượng Ứng dụng để mở PowerSchool SIS.",
      tile: "Nhấn PowerSchool SIS để mở Quản lý học sinh.",
      close: "Đóng"
    })
  });

  function isVisible(element, view = root) {
    if (!element?.isConnected || typeof element.getBoundingClientRect !== "function") return false;
    const style = view.getComputedStyle?.(element);
    if (style && (style.display === "none" || style.visibility === "hidden")) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function resolveLauncher(doc, visible = isVisible) {
    const candidates = [...doc.querySelectorAll("button#button-header-application-menu")];
    if (candidates.length > 1) return { status: "AMBIGUOUS", element: null };
    if (candidates.length !== 1 || !visible(candidates[0])) return { status: "MISSING", element: null };
    return { status: "FOUND", element: candidates[0] };
  }

  function resolveDrawer(doc, visible = isVisible) {
    const candidates = [...doc.querySelectorAll(`#${DRAWER_ID}`)];
    if (candidates.length > 1) return { status: "AMBIGUOUS", element: null };
    if (candidates.length !== 1) return { status: "MISSING", element: null };
    const drawer = candidates[0];
    const dialog = drawer.querySelector('[role="dialog"]');
    const heading = drawer.querySelector("#mfe-application-menu-app-menu-drawer-aria-labelledby-target");
    if (!dialog || !heading || !visible(dialog)) return { status: "MISSING", element: null };
    return { status: "FOUND", element: drawer };
  }

  function resolveTile(drawer, visible = isVisible) {
    const markers = drawer.querySelectorAll('[aria-label="Resource link, PowerSchool SIS"], [data-tooltip-text="PowerSchool SIS"]');
    const targets = new Set();
    for (const marker of markers) {
      const target = marker.closest?.('.mfe-application-menu-app-menu-icon-text-container[tabindex="0"]');
      if (target && visible(target)) targets.add(target);
    }
    if (targets.size > 1) return { status: "AMBIGUOUS", element: null };
    if (targets.size !== 1) return { status: "MISSING", element: null };
    return { status: "FOUND", element: [...targets][0] };
  }

  function recoveryOwnsGuidance(snapshot) {
    return snapshot?.phase === "UNAVAILABLE_CONFIRMED" || snapshot?.phase === "HANDOFF_PENDING";
  }

  hub.integrationBridgeNative = Object.freeze({ resolveLauncher, resolveDrawer, resolveTile, recoveryOwnsGuidance });

  const doc = root.document;
  if (!doc || !hub.integrationBridgeCore) return;
  if (hub.integrationBridge) return;

  let controller = null;
  let mountPromise = null;
  let mounted = false;
  let pendingDecision = "";
  let launcher = null;
  let drawer = null;
  let tile = null;
  let cue = null;
  let writeQueue = Promise.resolve();

  function enqueueStorage(value) {
    writeQueue = writeQueue.then(() => root.chrome.storage.local.set(value)).catch(() => {});
  }

  function normalizeLocale(value) {
    const code = String(value || "").toLowerCase().replace("_", "-");
    if (code === "en" || code.startsWith("en-")) return "en";
    if (code === "vi" || code.startsWith("vi-")) return "vi";
    return null;
  }

  function verifiedLocale() {
    const native = normalizeLocale(doc.documentElement?.getAttribute("lang"));
    const assistant = hub.i18n?.language?.();
    return native && native === assistant ? native : null;
  }

  function clearTile() {
    if (tile) {
      tile.classList.remove(TILE_CLASS);
      tile.removeEventListener("click", onTileSelected);
      tile = null;
    }
  }

  function clearDrawer() {
    clearTile();
    if (drawer) {
      drawer.querySelector("#button-mfe-application-menu-app-menu-drawer-close-dialog")
        ?.removeEventListener("click", onDrawerClosed);
      drawer = null;
    }
  }

  function clearLauncher() {
    if (launcher) {
      launcher.classList.remove(LAUNCHER_CLASS);
      launcher.removeEventListener("click", onApplicationsClicked);
      launcher = null;
    }
  }

  function removeCue() {
    cue?.remove();
    cue = null;
  }

  function ensureCue() {
    if (cue?.isConnected) return cue;
    cue = doc.createElement("section");
    cue.id = CUE_ID;
    cue.setAttribute("data-psqm-ui", "integration-bridge");
    cue.setAttribute("role", "status");
    cue.setAttribute("aria-live", "polite");
    const title = doc.createElement("h2");
    title.className = "psqm-integration-bridge-title";
    const body = doc.createElement("p");
    body.className = "psqm-integration-bridge-body";
    const close = doc.createElement("button");
    close.className = "psqm-integration-bridge-close";
    close.type = "button";
    close.addEventListener("click", () => {
      controller?.dismiss();
      clearDrawer();
    });
    cue.append(title, body, close);
    doc.documentElement.append(cue);
    return cue;
  }

  function render(state) {
    launcher?.classList.toggle(LAUNCHER_CLASS, state.mode === "cue");
    tile?.classList.toggle(TILE_CLASS, state.mode === "tile");
    if (state.mode === "idle" || !COPY[state.locale]) {
      clearDrawer();
      removeCue();
      return;
    }
    const copy = COPY[state.locale];
    const panel = ensureCue();
    panel.querySelector(".psqm-integration-bridge-title").textContent = copy.question;
    panel.querySelector(".psqm-integration-bridge-body").textContent = state.mode === "tile" ? copy.tile : copy.launcher;
    const close = panel.querySelector(".psqm-integration-bridge-close");
    close.textContent = copy.close;
    close.setAttribute("aria-label", copy.close);
  }

  function onApplicationsClicked(event) {
    if (event.isTrusted === false) return;
    controller?.applicationsOpened();
  }

  function onDrawerClosed() {
    controller?.drawerClosed();
    clearDrawer();
  }

  function onTileSelected(event) {
    if (event.isTrusted === false) return;
    controller?.sisSelected();
    clearDrawer();
  }

  function bindLauncher(target) {
    if (launcher === target) return;
    clearLauncher();
    launcher = target;
    launcher.addEventListener("click", onApplicationsClicked);
    launcher.classList.toggle(LAUNCHER_CLASS, controller?.snapshot().mode === "cue" && cue?.isConnected === true);
  }

  function bindDrawer(target) {
    if (drawer === target) return;
    clearDrawer();
    drawer = target;
    drawer.querySelector("#button-mfe-application-menu-app-menu-drawer-close-dialog")
      ?.addEventListener("click", onDrawerClosed);
  }

  function bindTile(target) {
    if (tile === target) return;
    clearTile();
    tile = target;
    tile.addEventListener("click", onTileSelected);
  }

  function reconcileDrawer() {
    const mode = controller?.snapshot().mode;
    if (mode !== "waiting-tile" && mode !== "tile") return;
    const foundDrawer = resolveDrawer(doc);
    if (foundDrawer.status === "AMBIGUOUS") {
      controller.dismiss();
      return;
    }
    if (foundDrawer.status !== "FOUND") {
      if (mode === "tile" || launcher?.getAttribute("aria-expanded") === "false") controller.drawerClosed();
      return;
    }
    bindDrawer(foundDrawer.element);
    const foundTile = resolveTile(foundDrawer.element);
    if (foundTile.status === "FOUND") {
      bindTile(foundTile.element);
      controller.tileResolved("FOUND");
    } else if (foundTile.status === "AMBIGUOUS") {
      controller.tileResolved("AMBIGUOUS");
    } else if (mode === "tile") {
      controller.drawerClosed();
    }
  }

  function reconcile() {
    if (!mounted || !controller) return;
    if (recoveryOwnsGuidance(hub.messagePersonFindRecovery?.snapshot?.())) {
      const state = controller.snapshot();
      if (state.activeFeed || state.mode !== "idle") controller.leaveFeed();
      clearLauncher();
      clearDrawer();
      removeCue();
      return;
    }
    const context = hub.ui?.detectContext?.();
    const feed = root.location?.origin === HUB_ORIGIN
      && context?.area === "newsfeed" && context?.view === "feed" && context?.confidence === "high";
    if (!feed) {
      if (root.location?.pathname !== "/" || context?.confidence === "high") {
        controller.leaveFeed();
        clearLauncher();
        clearDrawer();
      }
      return;
    }
    const target = resolveLauncher(doc);
    if (target.status !== "FOUND") {
      if (target.status === "AMBIGUOUS") controller.enterFeed({ eligible: false, locale: null });
      if (controller.snapshot().activeFeed) controller.dismiss();
      clearLauncher();
      clearDrawer();
      return;
    }
    const onboarding = hub.messageOnboarding?.snapshot?.();
    if (onboarding?.stateLoaded !== true) return;
    bindLauncher(target.element);
    controller.enterFeed({ eligible: onboarding?.stateLoaded === true && onboarding?.quickPointerMode === true, locale: verifiedLocale() });
    reconcileDrawer();
  }

  async function mount() {
    if (mountPromise) return mountPromise;
    mountPromise = (async () => {
      try {
        const saved = await root.chrome.storage.local.get([PENDING_KEY, SHOWN_KEY]);
        controller = hub.integrationBridgeCore.createController({
          firstPending: saved?.[PENDING_KEY] === true,
          firstShown: saved?.[SHOWN_KEY] === true,
          render,
          onFirstPending: () => enqueueStorage({ [PENDING_KEY]: true }),
          onFirstShown: () => enqueueStorage({ [PENDING_KEY]: false, [SHOWN_KEY]: true })
        });
        mounted = true;
        if (pendingDecision) controller.firstRunDecision(pendingDecision);
        pendingDecision = "";
        reconcile();
      } catch (_) {
        mounted = false;
      }
    })();
    return mountPromise;
  }

  function onOnboardingDecision(decision) {
    if (!["explore-later", "full-tour-complete"].includes(decision)) return;
    if (!controller) pendingDecision = decision;
    else {
      controller.firstRunDecision(decision);
      reconcile();
    }
  }

  function requestGuide() {
    reconcile();
    if (!controller?.requestGuide()) return false;
    if (resolveDrawer(doc).status === "FOUND") {
      controller.applicationsOpened();
      reconcileDrawer();
    }
    return true;
  }

  function destroy() {
    mounted = false;
    controller?.destroy();
    clearDrawer();
    clearLauncher();
    removeCue();
  }

  hub.integrationBridge = Object.freeze({ mount, reconcile, onOnboardingDecision, requestGuide, destroy, snapshot: () => controller?.snapshot() });
  root.chrome?.runtime?.onMessage?.addListener?.((message, sender, reply) => {
    if (sender?.id !== root.chrome.runtime.id || message?.type !== "PSQM_OPEN_POWERTEACHER_GUIDE") return false;
    reply({ ok: requestGuide() });
    return false;
  });
})(globalThis);
