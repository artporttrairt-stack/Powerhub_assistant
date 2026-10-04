((root) => {
  "use strict";

  const hub = root.PSQM ??= {};
  if (hub.messagePersonFindRecoveryCore) {
    if (typeof module === "object" && module.exports) module.exports = hub.messagePersonFindRecoveryCore;
    return;
  }

  const ACTIVE_TTL_MS = 60000;
  const PHASES = Object.freeze({
    IDLE: "IDLE",
    MEMBER_PENDING: "MEMBER_PENDING",
    UNAVAILABLE_CONFIRMED: "UNAVAILABLE_CONFIRMED",
    HANDOFF_PENDING: "HANDOFF_PENDING",
    DIRECTORY_READY: "DIRECTORY_READY",
    HANDED_OFF: "HANDED_OFF"
  });

  function normalizeSearchTerm(value) {
    return String(value || "").trim().replace(/\s+/gu, " ");
  }

  function createController({
    now = () => Date.now(),
    setTimeout = root.setTimeout?.bind(root),
    clearTimeout = root.clearTimeout?.bind(root)
  } = {}) {
    let phase = PHASES.IDLE;
    let generation = 0;
    let pendingSearchTerm = "";
    let createdAt = 0;
    let contextEpoch = 0;
    let timer = null;
    let destroyed = false;

    function snapshot() {
      return Object.freeze({ phase, generation, pendingSearchTerm, createdAt, contextEpoch });
    }

    function clearTimer() {
      if (timer !== null && typeof clearTimeout === "function") clearTimeout(timer);
      timer = null;
    }

    function resetToIdle() {
      clearTimer();
      phase = PHASES.IDLE;
      pendingSearchTerm = "";
      createdAt = 0;
      contextEpoch = 0;
    }

    function armTimer() {
      clearTimer();
      if (typeof setTimeout !== "function") return;
      const activeGeneration = generation;
      timer = setTimeout(() => {
        timer = null;
        if (destroyed || phase === PHASES.IDLE || generation !== activeGeneration) return;
        resetToIdle();
      }, ACTIVE_TTL_MS);
    }

    function beginMemberAttempt(searchTerm, nextContextEpoch) {
      if (destroyed) return null;
      const normalized = normalizeSearchTerm(searchTerm);
      if (!normalized) {
        resetToIdle();
        return null;
      }
      generation += 1;
      phase = PHASES.MEMBER_PENDING;
      pendingSearchTerm = normalized;
      createdAt = Number(now()) || 0;
      contextEpoch = nextContextEpoch;
      armTimer();
      return generation;
    }

    function settleAttempt(expectedGeneration, status) {
      if (destroyed || phase !== PHASES.MEMBER_PENDING || expectedGeneration !== generation) return false;
      if (status === "unavailable") {
        phase = PHASES.UNAVAILABLE_CONFIRMED;
        return true;
      }
      resetToIdle();
      return true;
    }

    function requestHandoff(expectedGeneration) {
      if (destroyed || phase !== PHASES.UNAVAILABLE_CONFIRMED || expectedGeneration !== generation) return false;
      phase = PHASES.HANDOFF_PENDING;
      armTimer();
      return true;
    }

    function contextChanged(nextEpoch, compatibility) {
      if (destroyed || phase === PHASES.IDLE) return false;
      if (compatibility === "incompatible") {
        resetToIdle();
        return true;
      }
      if (compatibility !== "compatible") return false;
      contextEpoch = nextEpoch;
      return true;
    }

    function directoryReady(expectedGeneration, expectedContextEpoch) {
      if (destroyed
        || phase !== PHASES.HANDOFF_PENDING
        || expectedGeneration !== generation
        || expectedContextEpoch !== contextEpoch) return false;
      phase = PHASES.DIRECTORY_READY;
      return true;
    }

    function handoffSucceeded(expectedGeneration) {
      if (destroyed || phase !== PHASES.DIRECTORY_READY || expectedGeneration !== generation) return null;
      clearTimer();
      const terminal = Object.freeze({
        phase: PHASES.HANDED_OFF,
        generation,
        pendingSearchTerm: "",
        createdAt: 0,
        contextEpoch: 0
      });
      resetToIdle();
      return terminal;
    }

    function cancel() {
      if (destroyed || phase === PHASES.IDLE) return false;
      resetToIdle();
      return true;
    }

    function destroy() {
      if (destroyed) return;
      resetToIdle();
      destroyed = true;
    }

    return Object.freeze({
      beginMemberAttempt,
      settleAttempt,
      requestHandoff,
      directoryReady,
      handoffSucceeded,
      cancel,
      contextChanged,
      snapshot,
      destroy
    });
  }

  const api = Object.freeze({ ACTIVE_TTL_MS, PHASES, normalizeSearchTerm, createController });
  hub.messagePersonFindRecoveryCore = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(globalThis);
