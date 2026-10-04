((root) => {
  "use strict";

  const hub = root.PSQM ??= {};
  if (hub.integrationBridgeCore) return;

  function createController({
    firstPending = false,
    firstShown = false,
    clock = root,
    render = () => {},
    onFirstPending = () => {},
    onFirstShown = () => {}
  } = {}) {
    let activeFeed = false;
    let shownInEntry = false;
    let mode = "idle";
    let kind = "";
    let locale = null;
    let hideTimer = null;
    let pending = firstPending === true;
    let shown = firstShown === true;

    function clearHideTimer() {
      if (hideTimer !== null) clock.clearTimeout(hideTimer);
      hideTimer = null;
    }

    function emit() {
      render({ mode, kind, locale });
    }

    function hide() {
      clearHideTimer();
      mode = "idle";
      kind = "";
      emit();
    }

    function showCue(nextKind) {
      if (!activeFeed || (locale !== "en" && locale !== "vi") || shownInEntry) return;
      shownInEntry = true;
      mode = "cue";
      kind = nextKind;
      emit();
      if (nextKind === "first") {
        pending = false;
        shown = true;
        onFirstShown();
      } else {
        hideTimer = clock.setTimeout(() => {
          hideTimer = null;
          hide();
        }, 8000);
      }
    }

    function enterFeed({ eligible = false, locale: nextLocale = null } = {}) {
      if (activeFeed) {
        setLocale(nextLocale);
        return;
      }
      activeFeed = true;
      shownInEntry = false;
      locale = nextLocale === "en" || nextLocale === "vi" ? nextLocale : null;
      if (pending) showCue("first");
      else if (eligible) showCue("returning");
      else emit();
    }

    function leaveFeed() {
      activeFeed = false;
      shownInEntry = false;
      hide();
    }

    function firstRunDecision(decision) {
      if (!["explore-later", "full-tour-complete"].includes(decision) || shown || pending) return;
      pending = true;
      onFirstPending();
      if (activeFeed) showCue("first");
    }

    function applicationsOpened() {
      if (mode !== "cue") return;
      clearHideTimer();
      mode = "waiting-tile";
      emit();
    }

    function requestGuide() {
      if (!activeFeed || (locale !== "en" && locale !== "vi")) return false;
      if (mode === "tile" || mode === "waiting-tile") return true;
      clearHideTimer();
      shownInEntry = true;
      mode = "cue";
      kind = "manual";
      emit();
      return true;
    }

    function tileResolved(status) {
      if (mode !== "waiting-tile") return;
      if (status === "FOUND") {
        mode = "tile";
        emit();
      } else if (status === "AMBIGUOUS") {
        hide();
      }
    }

    function drawerClosed() {
      if (mode === "waiting-tile" || mode === "tile") hide();
    }

    function sisSelected() {
      hide();
    }

    function setLocale(nextLocale) {
      const normalized = nextLocale === "en" || nextLocale === "vi" ? nextLocale : null;
      if (normalized === locale) return;
      locale = normalized;
      if (!locale && mode !== "idle") hide();
      else if (mode !== "idle") emit();
    }

    function snapshot() {
      return Object.freeze({ activeFeed, shownInEntry, mode, kind, locale, pending, shown, timerActive: hideTimer !== null });
    }

    emit();
    return Object.freeze({ enterFeed, leaveFeed, firstRunDecision, requestGuide, applicationsOpened, tileResolved, drawerClosed, sisSelected, setLocale, dismiss: hide, snapshot, destroy: leaveFeed });
  }

  hub.integrationBridgeCore = Object.freeze({ createController });
})(globalThis);
