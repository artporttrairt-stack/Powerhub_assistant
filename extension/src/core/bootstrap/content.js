(() => {
  "use strict";

  const startContentRuntime = () => globalThis.PSQM?.contentRuntime?.start?.();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startContentRuntime, { once: true });
  } else {
    void startContentRuntime();
  }
})();
