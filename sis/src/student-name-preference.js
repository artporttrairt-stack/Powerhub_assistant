(function (root) {
  'use strict';

  const SAVE_HANDOFF_KEY = 'sisPrototypePtpStudentNameSaveHandoffV3';
  const PREREQUISITE_CONFIRMED_KEY = 'sisPowerTeacherFirstMiddleLastSavedV1';

  function writeValues(storage, values) {
    return new Promise((resolve) => {
      if (!storage || typeof storage.set !== 'function') return resolve(false);
      try {
        storage.set(values, () => resolve(root.chrome?.runtime?.lastError ? false : true));
      } catch {
        resolve(false);
      }
    });
  }

  function readRawKey(storage, key) {
    return new Promise((resolve) => {
      if (!storage || typeof storage.get !== 'function') return resolve(null);
      try {
        storage.get([key], (data) => {
          if (root.chrome?.runtime?.lastError) return resolve(null);
          resolve(data?.[key] ?? null);
        });
      } catch {
        resolve(null);
      }
    });
  }

  function normalizeSaveHandoff(value) {
    if (!value || typeof value !== 'object' || value.pending !== true) return null;
    if (typeof value.fingerprint !== 'string') return null;
    const fingerprint = value.fingerprint.trim();
    if (!fingerprint || fingerprint.length > 200 || /[\r\n]/.test(fingerprint)) return null;
    if (value.saveClicked !== undefined && typeof value.saveClicked !== 'boolean') return null;
    return Object.freeze(value.saveClicked === true
      ? { pending: true, fingerprint, saveClicked: true }
      : { pending: true, fingerprint });
  }

  async function readSaveHandoff(storage) {
    return normalizeSaveHandoff(await readRawKey(storage, SAVE_HANDOFF_KEY));
  }

  async function setSaveHandoff(storage, fingerprint) {
    if (typeof fingerprint !== 'string') return false;
    const normalized = fingerprint.trim();
    if (!normalized || normalized.length > 200 || /[\r\n]/.test(normalized)) return false;
    return writeValues(storage, {
      [SAVE_HANDOFF_KEY]: { pending: true, fingerprint: normalized },
    });
  }

  async function markNativeSaveClicked(storage, fingerprint) {
    const handoff = await readSaveHandoff(storage);
    if (!handoff || handoff.fingerprint !== fingerprint) return false;
    return writeValues(storage, {
      [SAVE_HANDOFF_KEY]: { pending: true, fingerprint, saveClicked: true },
    });
  }

  function clearSaveHandoff(storage) {
    return writeValues(storage, { [SAVE_HANDOFF_KEY]: null });
  }

  async function readPrerequisiteConfirmed(storage) {
    return await readRawKey(storage, PREREQUISITE_CONFIRMED_KEY) === true;
  }

  function setPrerequisiteConfirmed(storage, confirmed) {
    if (confirmed !== true && confirmed !== false) return Promise.resolve(false);
    return writeValues(storage, { [PREREQUISITE_CONFIRMED_KEY]: confirmed });
  }

  const api = Object.freeze({
    SAVE_HANDOFF_KEY,
    PREREQUISITE_CONFIRMED_KEY,
    normalizeSaveHandoff,
    readSaveHandoff,
    setSaveHandoff,
    markNativeSaveClicked,
    clearSaveHandoff,
    readPrerequisiteConfirmed,
    setPrerequisiteConfirmed,
  });
  root.SIS_STUDENT_NAME_PREFERENCE = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
