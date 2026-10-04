(function initTeacherSupportLifecycle(root) {
  'use strict';

  function createSupportLifecycle({ getContext, packRegistry, onReady } = {}) {
    if (typeof getContext !== 'function') throw new TypeError('getContext is required.');
    if (!packRegistry || typeof packRegistry.select !== 'function') throw new TypeError('packRegistry.select is required.');

    let started = false;
    let state = 'DORMANT';
    let selectionStatus = 'none';
    let packId = null;
    let matchIds = Object.freeze([]);
    let lastReadyPack = null;

    function snapshot() {
      return Object.freeze({
        state,
        selectionStatus,
        packId,
        matchIds,
      });
    }

    function applySelection(selection) {
      selectionStatus = selection && selection.status || 'none';
      matchIds = Object.freeze([...(selection && selection.matchIds || [])]);
      packId = null;

      if (selectionStatus === 'ambiguous') {
        state = 'AMBIGUOUS';
        lastReadyPack = null;
        return snapshot();
      }

      if (selectionStatus === 'matched' && selection.pack) {
        state = 'READY';
        packId = selection.pack.id || null;
        if (typeof onReady === 'function' && selection.pack !== lastReadyPack) {
          onReady(selection.pack);
        }
        lastReadyPack = selection.pack;
        return snapshot();
      }

      state = 'DORMANT';
      lastReadyPack = null;
      return snapshot();
    }

    function reconcile(context) {
      if (state === 'STOPPED') return snapshot();
      const currentContext = context === undefined ? getContext() : context;
      return applySelection(packRegistry.select(currentContext));
    }

    function start() {
      if (state === 'STOPPED' || started) return snapshot();
      started = true;
      return reconcile(getContext());
    }

    function stop() {
      started = false;
      state = 'STOPPED';
      selectionStatus = 'none';
      packId = null;
      matchIds = Object.freeze([]);
      lastReadyPack = null;
      return snapshot();
    }

    return Object.freeze({ start, reconcile, stop, snapshot });
  }

  if (
    root &&
    root.location &&
    root.PSQM &&
    root.PSQM.powerTeacherContext &&
    root.PSQM.teacherSupportPackRegistry &&
    !root.PSQM.teacherSupportLifecycle
  ) {
    root.PSQM.teacherSupportLifecycle = createSupportLifecycle({
      getContext: () => root.PSQM.powerTeacherContext.parseLocation(root.location),
      packRegistry: root.PSQM.teacherSupportPackRegistry,
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createSupportLifecycle };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
