(function (root) {
  'use strict';

  const dom = root.SIS_POWERTEACHER_DOM_CONTRACT
    || (typeof require === 'function' ? require('./powerteacher-dom-contract.js') : null);
  if (!dom) return;

  const CONTRACT = Object.freeze({
    route: '#/settings/display',
    formSelector: '#content-main form.ps-page-form[role="form"]',
    controlSelector: '#student-name-display-option',
    saveSelector: '#footer-save-button',
    entrySelector: '#settings-settings_display-link',
    settingsToggleSelector: '#sidebar-charms-settings',
  });
  const REQUIRED_NAME_ORDER = 'First Middle Last';

  function combineStatus(results) {
    if (results.some((result) => result.status === dom.STATUS.AMBIGUOUS)) return dom.STATUS.AMBIGUOUS;
    if (results.some((result) => result.status === dom.STATUS.MISSING)) return dom.STATUS.MISSING;
    if (results.some((result) => result.status === dom.STATUS.UNVERIFIED)) return dom.STATUS.UNVERIFIED;
    return dom.STATUS.FOUND;
  }

  function matchesRoute(hash) {
    return hash === CONTRACT.route || (typeof hash === 'string' && hash.startsWith(`${CONTRACT.route}?`));
  }

  function inspect({ document: documentLike, hash } = {}) {
    if (!matchesRoute(hash)) {
      return Object.freeze({
        status: dom.STATUS.UNVERIFIED,
        controlStatus: dom.STATUS.UNVERIFIED,
        saveStatus: dom.STATUS.UNVERIFIED,
        savePersistence: 'UNAVAILABLE',
        prerequisiteConfirmed: false,
      });
    }
    const control = dom.queryUnique(documentLike, CONTRACT.controlSelector);
    let form = Object.freeze({ status: dom.STATUS.UNVERIFIED, node: null, count: null });
    if (control.status === dom.STATUS.FOUND) {
      const controlForm = typeof control.node?.closest === 'function'
        ? control.node.closest(CONTRACT.formSelector)
        : null;
      form = Object.freeze({
        status: controlForm ? dom.STATUS.FOUND : dom.STATUS.MISSING,
        node: controlForm || null,
        count: controlForm ? 1 : 0,
      });
    }
    const save = dom.queryUnique(documentLike, CONTRACT.saveSelector);
    return Object.freeze({
      status: combineStatus([form, control, save]),
      controlStatus: control.status,
      saveStatus: save.status,
      savePersistence: 'UNAVAILABLE',
      prerequisiteConfirmed: false,
      form: form.node,
      control: control.node,
      save: save.node,
    });
  }

  function resolveEntry(documentLike) {
    return dom.queryUnique(documentLike, CONTRACT.entrySelector);
  }

  function resolveSettingsToggle(documentLike) {
    return dom.queryUnique(documentLike, CONTRACT.settingsToggleSelector);
  }

  function clean(value) {
    return String(value ?? '').replace(/\s+/gu, ' ').trim();
  }

  function readSelectedLabel(control) {
    if (!control) return null;

    const selectedOption = control.selectedOptions?.length === 1 ? control.selectedOptions[0] : null;
    const selectedOptionText = clean(selectedOption?.textContent);
    if (selectedOptionText) return selectedOptionText;

    const ariaSelected = control.querySelector?.('[aria-selected="true"]');
    const ariaSelectedText = clean(ariaSelected?.innerText || ariaSelected?.textContent);
    if (ariaSelectedText) return ariaSelectedText;

    const rendered = typeof control.innerText === 'string' ? control.innerText : '';
    const firstRenderedLine = rendered.split(/\r?\n/u).map(clean).find(Boolean);
    if (firstRenderedLine) return firstRenderedLine;

    const text = typeof control.textContent === 'string' ? control.textContent : '';
    const firstTextLine = text.split(/\r?\n/u).map(clean).find(Boolean);
    return firstTextLine || null;
  }

  function readSelectedFingerprint(control) {
    return readSelectedLabel(control);
  }

  function isFirstMiddleLast(control) {
    return clean(readSelectedLabel(control)).toLocaleLowerCase('en-US')
      === REQUIRED_NAME_ORDER.toLocaleLowerCase('en-US');
  }

  function resolveCurrentSaveActivation({ document: documentLike, hash, target } = {}) {
    const current = inspect({ document: documentLike, hash });
    if (current.status !== dom.STATUS.FOUND) {
      return Object.freeze({ status: current.status, matched: false, save: null });
    }
    const candidate = typeof target?.closest === 'function'
      ? target.closest(CONTRACT.saveSelector)
      : null;
    const connected = candidate
      && candidate.isConnected !== false
      && candidate.ownerDocument === documentLike;
    const matched = connected && candidate === current.save;
    return Object.freeze({ status: current.status, matched, save: matched ? current.save : null });
  }

  const api = Object.freeze({
    CONTRACT,
    REQUIRED_NAME_ORDER,
    matchesRoute,
    inspect,
    resolveEntry,
    resolveSettingsToggle,
    readSelectedLabel,
    readSelectedFingerprint,
    isFirstMiddleLast,
    resolveCurrentSaveActivation,
  });
  root.SIS_POWERTEACHER_DISPLAY_SETTINGS = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
