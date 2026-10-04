(function (root) {
  "use strict";

  const hub = root.PSQM ??= {};
  if (hub.tourResume) {
    if (typeof module === "object" && module.exports) module.exports = hub.tourResume;
    return;
  }

  const STORAGE_KEY = "tourResumeStateV1";
  const VERSION = 1;
  const EMPTY = Object.freeze({ version: VERSION, pending: false, mode: "", module: "" });
  const FIRST_TIME_MODULES = new Set(["newsfeed", "messages", "navigation"]);
  const REPLAY_MODULES = new Set(["newsfeed", "messages"]);

  function normalize(value) {
    const source = value && typeof value === "object" ? value : {};
    if (source.pending !== true) return { ...EMPTY };
    const mode = source.mode === "first-time" || source.mode === "replay" ? source.mode : "";
    const moduleId = typeof source.module === "string" ? source.module : "";
    const allowed = mode === "first-time"
      ? FIRST_TIME_MODULES.has(moduleId)
      : mode === "replay" && REPLAY_MODULES.has(moduleId);
    if (!allowed) return { ...EMPTY };
    return { version: VERSION, pending: true, mode, module: moduleId };
  }

  function shouldShowReminder(value, dismissedForSession = false) {
    return dismissedForSession !== true && normalize(value).pending === true;
  }

  function createStore(storage = root.chrome?.storage?.local) {
    async function read() {
      try {
        const result = await storage?.get?.(STORAGE_KEY);
        return normalize(result?.[STORAGE_KEY]);
      } catch (_) {
        return { ...EMPTY };
      }
    }

    async function mark(value) {
      const next = normalize({ ...value, pending: true });
      if (!next.pending) return false;
      try {
        await storage?.set?.({ [STORAGE_KEY]: next });
        return true;
      } catch (_) {
        return false;
      }
    }

    async function clear() {
      try {
        await storage?.set?.({ [STORAGE_KEY]: { ...EMPTY } });
        return true;
      } catch (_) {
        return false;
      }
    }

    return Object.freeze({ read, mark, clear });
  }

  const store = createStore();
  hub.tourResume = Object.freeze({
    STORAGE_KEY,
    VERSION,
    normalize,
    shouldShowReminder,
    createStore,
    read: store.read,
    mark: store.mark,
    clear: store.clear
  });

  if (typeof module === "object" && module.exports) module.exports = hub.tourResume;
})(globalThis);
