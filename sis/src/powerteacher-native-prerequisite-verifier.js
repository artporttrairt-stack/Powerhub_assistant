(function (root) {
  'use strict';

  const defaultDisplayApi = root.SIS_POWERTEACHER_DISPLAY_SETTINGS
    || (typeof require === 'function' ? require('./powerteacher-display-settings.js') : null);

  const STATUS = Object.freeze({
    UNCONFIRMED: 'UNCONFIRMED',
    ARMED: 'ARMED',
    SAVE_OBSERVED: 'SAVE_OBSERVED',
    CONFIRMED: 'CONFIRMED',
    INVALIDATED: 'INVALIDATED',
  });

  function createVerifier({ displayApi = defaultDisplayApi } = {}) {
    let status = STATUS.UNCONFIRMED;
    let fingerprint = null;
    let armedForm = null;
    let armedControl = null;
    let armedWasDirty = false;
    let armedWasPristine = false;
    let saveObserved = false;
    let leftAfterSave = false;
    let armId = 0;

    function reset() {
      status = STATUS.UNCONFIRMED;
      fingerprint = null;
      armedForm = null;
      armedControl = null;
      armedWasDirty = false;
      armedWasPristine = false;
      saveObserved = false;
      leftAfterSave = false;
    }

    function current(context) {
      const hash = context?.location?.hash;
      const inspected = displayApi?.inspect?.({ document: context?.document, hash }) || { status: 'UNVERIFIED' };
      const currentFingerprint = inspected.status === 'FOUND'
        ? displayApi?.readSelectedFingerprint?.(inspected.control)
        : null;
      return { hash, inspected, currentFingerprint };
    }

    function arm(context) {
      const { inspected, currentFingerprint } = current(context);
      if (inspected.status !== 'FOUND' || !currentFingerprint) {
        reset();
        return status;
      }
      armId += 1;
      fingerprint = currentFingerprint;
      armedForm = inspected.form;
      armedControl = inspected.control;
      armedWasDirty = inspected.form?.classList?.contains?.('ng-dirty') === true;
      armedWasPristine = !armedWasDirty
        && inspected.form?.classList?.contains?.('ng-pristine') === true;
      saveObserved = false;
      leftAfterSave = false;
      status = STATUS.ARMED;
      return status;
    }

    function captureVerifiedSave(context) {
      if (status !== STATUS.ARMED) return null;
      const { inspected, currentFingerprint } = current(context);
      if (inspected.status !== 'FOUND' || currentFingerprint !== fingerprint) return null;
      return Object.freeze({ armId, fingerprint: currentFingerprint });
    }

    function commitVerifiedSave(evidence, context) {
      if (status !== STATUS.ARMED) return status;
      if (!evidence || evidence.armId !== armId || evidence.fingerprint !== fingerprint) return status;
      saveObserved = true;
      status = STATUS.SAVE_OBSERVED;
      return reconcile(context);
    }

    function confirmReloadedSelection(expectedFingerprint, context) {
      if (typeof expectedFingerprint !== 'string' || !expectedFingerprint.trim()) {
        reset();
        status = STATUS.INVALIDATED;
        return status;
      }
      const { inspected, currentFingerprint } = current(context);
      if (inspected.status !== 'FOUND' || currentFingerprint !== expectedFingerprint.trim()) {
        reset();
        status = STATUS.INVALIDATED;
        return status;
      }
      fingerprint = currentFingerprint;
      armedForm = inspected.form;
      armedControl = inspected.control;
      armedWasDirty = false;
      armedWasPristine = true;
      saveObserved = true;
      leftAfterSave = true;
      status = STATUS.CONFIRMED;
      return status;
    }

    function reconcile(context) {
      if (status === STATUS.INVALIDATED) return status;
      const hash = context?.location?.hash;
      const onDisplay = displayApi?.matchesRoute?.(hash) === true;
      if (!onDisplay) {
        if (saveObserved) leftAfterSave = true;
        return status;
      }

      const { inspected, currentFingerprint } = current(context);
      if (status === STATUS.CONFIRMED) {
        if (inspected.status !== 'FOUND' || currentFingerprint !== fingerprint) {
          status = STATUS.INVALIDATED;
        }
        return status;
      }
      if (!saveObserved || inspected.status !== 'FOUND' || currentFingerprint !== fingerprint) return status;

      const becamePristine = armedWasDirty
        && inspected.form?.classList?.contains?.('ng-pristine') === true;
      const remainedPristine = armedWasPristine
        && inspected.form === armedForm
        && inspected.control === armedControl
        && inspected.form?.classList?.contains?.('ng-pristine') === true;
      const rerendered = inspected.form !== armedForm || inspected.control !== armedControl;
      if (becamePristine || remainedPristine || rerendered || leftAfterSave) status = STATUS.CONFIRMED;
      return status;
    }

    return Object.freeze({
      arm,
      captureVerifiedSave,
      commitVerifiedSave,
      confirmReloadedSelection,
      reconcile,
      reset,
      isConfirmed: () => status === STATUS.CONFIRMED,
      getStatus: () => status,
    });
  }

  const verifier = createVerifier();
  const api = Object.freeze({ STATUS, createVerifier, verifier });
  root.SIS_POWERTEACHER_NATIVE_PREREQUISITE_VERIFIER = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
