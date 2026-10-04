(function (root) {
  'use strict';

  const defaultDisplayApi = root.SIS_POWERTEACHER_DISPLAY_SETTINGS
    || (typeof require === 'function' ? require('./powerteacher-display-settings.js') : null);
  const defaultLocaleApi = root.SIS_POWERTEACHER_LOCALE
    || (typeof require === 'function' ? require('./powerteacher-locale.js') : null);
  const defaultPreferenceApi = root.SIS_STUDENT_NAME_PREFERENCE
    || (typeof require === 'function' ? require('./student-name-preference.js') : null);
  const defaultPrerequisiteVerifier = root.SIS_POWERTEACHER_NATIVE_PREREQUISITE_VERIFIER?.verifier
    || (typeof require === 'function'
      ? require('./powerteacher-native-prerequisite-verifier.js').verifier
      : null);
  const Z = 2147483590;

  const STATES = Object.freeze({
    IDLE: 'IDLE',
    SETTINGS: 'SETTINGS',
    DISPLAY_ENTRY: 'DISPLAY_ENTRY',
    DISPLAY_CONTROL: 'DISPLAY_CONTROL',
    AWAITING_NATIVE_SAVE: 'AWAITING_NATIVE_SAVE',
    COMPLETE: 'COMPLETE',
  });

  const COPY = Object.freeze({
    en: Object.freeze({
      title: 'Student name display setup',
      settingsToggle: 'Select Settings to continue.',
      displayEntry: 'Select the native Display Settings entry to continue. The assistant will not open it for you.',
      displayControl: 'In Student Names > Display, choose First Middle Last yourself. Then select Next here.',
      displayControlWrong: 'First Middle Last must be selected before the assistant can continue.',
      saveControl: 'Select the native PowerTeacher Save button yourself. After PowerTeacher finishes saving, select I’ve saved here.',
      savedConfirm: "I've saved",
      saveFirst: 'Select the PowerTeacher Save button before confirming here.',
      saveUnconfirmed: 'PowerTeacher has not yet confirmed the saved First Middle Last setting. Wait for Save to finish, then try again.',
      unavailable: 'The expected native PowerTeacher structure is missing or ambiguous. The assistant will not guess a replacement.',
      next: 'Next',
      close: 'Close',
    }),
    vi: Object.freeze({
      title: 'Thiết lập cách hiển thị tên học sinh',
      settingsToggle: 'Chọn Cài đặt để tiếp tục.',
      displayEntry: 'Hãy tự chọn mục Cài đặt hiển thị của PowerTeacher để tiếp tục. Trợ lý sẽ không tự mở mục này.',
      displayControl: 'Trong Student Names > Display, hãy tự chọn First Middle Last. Sau đó chọn Tiếp tại đây.',
      displayControlWrong: 'Phải chọn First Middle Last trước khi Trợ lý có thể tiếp tục.',
      saveControl: 'Hãy tự nhấn nút Lưu của PowerTeacher. Sau khi PowerTeacher lưu xong, chọn Tôi đã lưu tại đây.',
      savedConfirm: 'Tôi đã lưu',
      saveFirst: 'Hãy nhấn nút Lưu của PowerTeacher trước khi xác nhận tại đây.',
      saveUnconfirmed: 'PowerTeacher chưa xác nhận thiết lập First Middle Last đã được lưu. Hãy đợi Lưu hoàn tất rồi thử lại.',
      unavailable: 'Không tìm thấy duy nhất cấu trúc PowerTeacher đã xác minh. Trợ lý sẽ không đoán điểm neo thay thế.',
      next: 'Tiếp',
      close: 'Đóng',
    }),
  });

  function createOnboarding({
    displayApi = defaultDisplayApi,
    localeApi = defaultLocaleApi,
    preferenceApi = defaultPreferenceApi,
    prerequisiteVerifier = defaultPrerequisiteVerifier,
    onPrerequisiteReady = null,
  } = {}) {
    const session = {
      active: false,
      state: STATES.IDLE,
      document: null,
      location: null,
      storage: null,
      nativeTarget: null,
      nativeHandler: null,
      saveHandoff: null,
      recoveredFromReload: false,
      saveHandoffStarting: false,
      onPrerequisiteReady,
    };

    function clearNativeHandler() {
      if (session.nativeTarget && session.nativeHandler) {
        session.nativeTarget.removeEventListener?.('click', session.nativeHandler);
      }
      session.nativeTarget = null;
      session.nativeHandler = null;
    }

    function clearUi() {
      clearNativeHandler();
      session.document?.getElementById('ai-my-pt-display-spotlight')?.remove();
      session.document?.getElementById('ai-my-pt-display-card')?.remove();
    }

    function make(tag, cssClass, label) {
      const node = session.document.createElement(tag);
      if (cssClass) node.classList.add(...cssClass.split(' ').filter(Boolean));
      if (label !== undefined) node.replaceChildren(session.document.createTextNode(String(label)));
      return node;
    }

    function button(label, cssClass, handler) {
      const node = make('button', cssClass, label);
      node.type = 'button';
      node.addEventListener('click', (event) => {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        handler();
      });
      return node;
    }

    function closeCurrent() {
      if (session.state === STATES.AWAITING_NATIVE_SAVE || session.saveHandoffStarting) {
        void preferenceApi?.clearSaveHandoff?.(session.storage);
      }
      stop();
    }

    function visible(target) {
      if (!target || typeof target.getBoundingClientRect !== 'function') return false;
      const rect = target.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }

    function position(target, spotlight, card) {
      if (!visible(target)) {
        spotlight.classList.add('ai-my-pt-hidden');
        return;
      }
      const rect = target.getBoundingClientRect();
      const pad = 6;
      spotlight.style.left = `${Math.max(4, rect.left - pad)}px`;
      spotlight.style.top = `${Math.max(4, rect.top - pad)}px`;
      spotlight.style.width = `${Math.max(8, rect.width + pad * 2)}px`;
      spotlight.style.height = `${Math.max(8, rect.height + pad * 2)}px`;
      const cardRect = card.getBoundingClientRect();
      const viewportWidth = session.document.documentElement.clientWidth || 1024;
      const viewportHeight = session.document.documentElement.clientHeight || 768;
      let left = rect.right + 18;
      if (left + cardRect.width > viewportWidth - 12) left = Math.max(12, rect.left - cardRect.width - 18);
      let top = rect.top;
      if (top + cardRect.height > viewportHeight - 12) top = Math.max(12, viewportHeight - cardRect.height - 12);
      card.style.left = `${Math.max(12, left)}px`;
      card.style.top = `${Math.max(12, top)}px`;
    }

    function floatingCardBottom() {
      const document = session.document;
      const viewportHeight = Number(document?.documentElement?.clientHeight) || 0;
      if (!viewportHeight) return 18;
      const obstructionTop = ['ai-my-pt-standalone-launcher', 'footer-save-button']
        .map((id) => document.getElementById(id))
        .filter(visible)
        .map((node) => node.getBoundingClientRect().top)
        .filter((top) => Number.isFinite(top) && top > 0 && top < viewportHeight);
      if (!obstructionTop.length) return 18;
      const clearance = Math.ceil(viewportHeight - Math.min(...obstructionTop) + 12);
      return Math.max(18, Math.min(clearance, viewportHeight - 72));
    }

    function render(message, target, actions = [], note = '') {
      clearUi();
      const locale = localeApi?.resolve?.(session.document);
      const copy = COPY[locale];
      if (!copy) return;

      const spotlight = make('div', 'ai-my-pt-tour-spotlight');
      spotlight.id = 'ai-my-pt-display-spotlight';
      spotlight.style.zIndex = String(Z);
      if (session.state === STATES.AWAITING_NATIVE_SAVE && session.saveHandoff?.saveClicked !== true) {
        spotlight.classList.add('ai-my-pt-save-spotlight');
      }
      if (!target) spotlight.classList.add('ai-my-pt-hidden');

      const card = make('section', 'ai-my-pt-card');
      card.id = 'ai-my-pt-display-card';
      card.style.zIndex = String(Z + 1);
      if (!target) {
        const bottom = floatingCardBottom();
        card.style.right = '18px';
        card.style.bottom = `${bottom}px`;
        card.style.maxHeight = `calc(100vh - ${bottom + 18}px)`;
        card.style.overflowY = 'auto';
      }
      card.setAttribute('role', 'dialog');
      card.setAttribute('aria-modal', 'false');
      card.setAttribute('aria-label', copy.title);
      card.append(make('h2', 'ai-my-pt-title', copy.title), make('p', 'ai-my-pt-intro', message));
      if (note) card.append(make('p', 'ai-my-pt-save-first', note));
      if (session.state === STATES.AWAITING_NATIVE_SAVE && session.saveHandoff?.saveClicked !== true) {
        card.append(make('p', 'ai-my-pt-save-first', copy.saveFirst));
      }
      const controls = make('div', 'ai-my-pt-controls');
      for (const action of actions) {
        const actionButton = button(action.label, action.primary ? 'ai-my-pt-btn ai-my-pt-btn-primary' : 'ai-my-pt-btn', action.run);
        actionButton.disabled = action.disabled === true;
        controls.append(actionButton);
      }
      controls.append(button(copy.close, 'ai-my-pt-btn ai-my-pt-btn-quiet', closeCurrent));
      card.append(controls);
      session.document.documentElement.append(spotlight, card);
      if (target) {
        target.scrollIntoView?.({ block: 'center', inline: 'nearest' });
        session.document.defaultView?.requestAnimationFrame?.(() => position(target, spotlight, card));
      }
    }

    function trackNativeClick(target, handler) {
      clearNativeHandler();
      if (!target || typeof target.addEventListener !== 'function') return;
      session.nativeTarget = target;
      session.nativeHandler = handler;
      target.addEventListener('click', handler, { once: true });
    }

    function trackNativeSave(target) {
      clearNativeHandler();
      if (!target || typeof target.addEventListener !== 'function') return;
      const handler = async (event) => {
        if (event?.isTrusted !== true || session.state !== STATES.AWAITING_NATIVE_SAVE) return;
        const handoff = session.saveHandoff;
        if (!handoff || handoff.saveClicked === true) return;
        const activation = displayApi?.resolveCurrentSaveActivation?.({
          document: session.document,
          hash: session.location?.hash,
          target: event.target,
        });
        const current = displayApi?.inspect?.({ document: session.document, hash: session.location?.hash });
        if (activation?.matched !== true || activation.save !== target
            || current?.status !== 'FOUND'
            || displayApi?.isFirstMiddleLast?.(current.control) !== true
            || displayApi?.readSelectedFingerprint?.(current.control) !== handoff.fingerprint) return;
        const written = await preferenceApi?.markNativeSaveClicked?.(session.storage, handoff.fingerprint);
        if (written !== true) return;
        if (!session.active || session.state !== STATES.AWAITING_NATIVE_SAVE
            || session.saveHandoff !== handoff
            || displayApi?.matchesRoute?.(session.location?.hash) !== true) {
          await preferenceApi?.clearSaveHandoff?.(session.storage);
          return;
        }
        session.saveHandoff = Object.freeze({ ...handoff, saveClicked: true });
        reconcile();
      };
      session.nativeTarget = target;
      session.nativeHandler = handler;
      target.addEventListener('click', handler);
    }

    async function confirmTeacherSaved() {
      if (session.state !== STATES.AWAITING_NATIVE_SAVE) return 'UNAVAILABLE';
      if (displayApi?.matchesRoute?.(session.location?.hash) !== true) {
        stop();
        return 'UNAVAILABLE';
      }
      if (session.saveHandoff?.saveClicked !== true) return 'SAVE_NOT_CLICKED';

      const context = { document: session.document, location: session.location };
      const currentDisplay = displayApi?.inspect?.({
        document: session.document,
        hash: session.location?.hash,
      }) || { status: 'UNVERIFIED' };
      if (currentDisplay.status !== 'FOUND' || displayApi?.isFirstMiddleLast?.(currentDisplay.control) !== true) {
        const copy = COPY[localeApi?.resolve?.(session.document)];
        if (copy) render(copy.unavailable, null);
        return 'UNAVAILABLE';
      }
      const storedHandoff = await preferenceApi?.readSaveHandoff?.(session.storage);
      if (storedHandoff?.saveClicked !== true
          || storedHandoff.fingerprint !== session.saveHandoff.fingerprint) return 'SAVE_NOT_CLICKED';

      if (session.recoveredFromReload) {
        const restored = prerequisiteVerifier?.confirmReloadedSelection?.(
          session.saveHandoff?.fingerprint,
          context,
        );
        if (restored !== 'CONFIRMED') {
          await preferenceApi?.clearSaveHandoff?.(session.storage);
          stop();
          return 'UNAVAILABLE';
        }
      } else {
        const saveEvidence = prerequisiteVerifier?.captureVerifiedSave?.(context);
        if (!saveEvidence) {
          const copy = COPY[localeApi?.resolve?.(session.document)];
          if (copy) render(copy.unavailable, null);
          return 'UNAVAILABLE';
        }
        prerequisiteVerifier?.commitVerifiedSave?.(saveEvidence, context);
        prerequisiteVerifier?.reconcile?.(context);
        if (prerequisiteVerifier?.isConfirmed?.() !== true) {
          const copy = COPY[localeApi?.resolve?.(session.document)];
          if (copy) {
            render(copy.saveControl, currentDisplay.save, [{
              label: copy.savedConfirm,
              primary: true,
              run: () => { void confirmTeacherSaved(); },
            }], copy.saveUnconfirmed);
          }
          return 'SAVE_UNCONFIRMED';
        }
      }

      const confirmed = await preferenceApi?.setPrerequisiteConfirmed?.(session.storage, true);
      if (confirmed !== true) {
        stop();
        return 'UNAVAILABLE';
      }
      await preferenceApi?.clearSaveHandoff?.(session.storage);
      session.saveHandoff = null;
      session.recoveredFromReload = false;
      session.state = STATES.COMPLETE;
      const ready = session.onPrerequisiteReady;
      stop();
      try { ready?.(); } catch {}
      return STATES.COMPLETE;
    }

    async function beginSaveHandoff() {
      if (!session.active || displayApi?.matchesRoute?.(session.location?.hash) !== true) return 'UNAVAILABLE';
      session.saveHandoffStarting = true;
      const currentDisplay = displayApi?.inspect?.({
        document: session.document,
        hash: session.location?.hash,
      }) || { status: 'UNVERIFIED' };
      if (currentDisplay.status !== 'FOUND') {
        session.saveHandoffStarting = false;
        const copy = COPY[localeApi?.resolve?.(session.document)];
        if (copy) render(copy.unavailable, null);
        return 'UNAVAILABLE';
      }
      if (displayApi?.isFirstMiddleLast?.(currentDisplay.control) !== true) {
        session.saveHandoffStarting = false;
        const copy = COPY[localeApi?.resolve?.(session.document)];
        if (copy) {
          render(copy.displayControl, currentDisplay.control, [{
            label: copy.next,
            primary: true,
            disabled: true,
            run: () => { void beginSaveHandoff(); },
          }], copy.displayControlWrong);
        }
        return 'WRONG_NAME_ORDER';
      }
      const fingerprint = displayApi?.readSelectedFingerprint?.(currentDisplay.control);
      if (!fingerprint) {
        session.saveHandoffStarting = false;
        const copy = COPY[localeApi?.resolve?.(session.document)];
        if (copy) render(copy.unavailable, null);
        return 'UNAVAILABLE';
      }

      const armed = prerequisiteVerifier?.arm?.({ document: session.document, location: session.location });
      if (armed !== 'ARMED') {
        session.saveHandoffStarting = false;
        const copy = COPY[localeApi?.resolve?.(session.document)];
        if (copy) render(copy.unavailable, null);
        return 'UNAVAILABLE';
      }
      const persisted = await preferenceApi?.setSaveHandoff?.(session.storage, fingerprint);
      if (persisted !== true) {
        session.saveHandoffStarting = false;
        prerequisiteVerifier?.reset?.();
        stop();
        return 'UNAVAILABLE';
      }
      if (!session.active || displayApi?.matchesRoute?.(session.location?.hash) !== true) {
        session.saveHandoffStarting = false;
        await preferenceApi?.clearSaveHandoff?.(session.storage);
        prerequisiteVerifier?.reset?.();
        stop();
        return 'UNAVAILABLE';
      }

      session.saveHandoffStarting = false;
      session.saveHandoff = Object.freeze({ pending: true, fingerprint });
      session.recoveredFromReload = false;
      session.state = STATES.AWAITING_NATIVE_SAVE;
      return reconcile();
    }

    function reconcile() {
      if (!session.active) return 'INACTIVE';
      const locale = localeApi?.resolve?.(session.document);
      const copy = COPY[locale];
      if (!copy) {
        clearUi();
        return 'LOCALE_UNAVAILABLE';
      }

      const hash = session.location?.hash;
      const onDisplay = displayApi?.matchesRoute?.(hash) === true;

      if (session.saveHandoffStarting && !onDisplay) {
        void preferenceApi?.clearSaveHandoff?.(session.storage);
        session.saveHandoffStarting = false;
        stop();
        return STATES.IDLE;
      }
      if (session.state === STATES.AWAITING_NATIVE_SAVE && !onDisplay) {
        void preferenceApi?.clearSaveHandoff?.(session.storage);
        session.saveHandoff = null;
        session.recoveredFromReload = false;
        stop();
        return STATES.IDLE;
      }
      if (session.state === STATES.COMPLETE) return STATES.COMPLETE;

      const displayState = displayApi?.inspect?.({ document: session.document, hash }) || { status: 'UNVERIFIED' };
      if (onDisplay) {
        if (session.state === STATES.AWAITING_NATIVE_SAVE && session.recoveredFromReload) {
          if (displayState.status === 'MISSING') {
            clearUi();
            return 'WAITING_FOR_DISPLAY';
          }
          if (displayState.status !== 'FOUND') {
            void preferenceApi?.clearSaveHandoff?.(session.storage);
            session.saveHandoff = null;
            session.recoveredFromReload = false;
            stop();
            return 'UNAVAILABLE';
          }
          const currentFingerprint = displayApi?.readSelectedFingerprint?.(displayState.control);
          if (!currentFingerprint) {
            clearUi();
            return 'WAITING_FOR_DISPLAY';
          }
          if (currentFingerprint !== session.saveHandoff?.fingerprint
              || displayApi?.isFirstMiddleLast?.(displayState.control) !== true) {
            void preferenceApi?.clearSaveHandoff?.(session.storage);
            session.saveHandoff = null;
            session.recoveredFromReload = false;
            stop();
            return 'UNAVAILABLE';
          }
        }
        if (displayState.status !== 'FOUND') {
          render(copy.unavailable, null);
          return 'UNAVAILABLE';
        }
        if (session.state === STATES.AWAITING_NATIVE_SAVE) {
          render(copy.saveControl, displayState.save, [{
            label: copy.savedConfirm,
            primary: true,
            disabled: session.saveHandoff?.saveClicked !== true,
            run: () => { void confirmTeacherSaved(); },
          }]);
          if (session.saveHandoff?.saveClicked !== true) trackNativeSave(displayState.save);
          return STATES.AWAITING_NATIVE_SAVE;
        }
        session.state = STATES.DISPLAY_CONTROL;
        const correctOrder = displayApi?.isFirstMiddleLast?.(displayState.control) === true;
        render(copy.displayControl, displayState.control, [{
          label: copy.next,
          primary: true,
          disabled: !correctOrder,
          run: () => { void beginSaveHandoff(); },
        }], correctOrder ? '' : copy.displayControlWrong);
        return STATES.DISPLAY_CONTROL;
      }

      const entry = displayApi?.resolveEntry?.(session.document) || { status: 'UNVERIFIED', node: null };
      if (entry.status === 'FOUND') {
        session.state = STATES.DISPLAY_ENTRY;
        render(copy.displayEntry, entry.node);
        trackNativeClick(entry.node, () => setTimeout(reconcile, 0));
        return STATES.DISPLAY_ENTRY;
      }

      const settings = displayApi?.resolveSettingsToggle?.(session.document) || { status: 'UNVERIFIED', node: null };
      if (settings.status === 'FOUND') {
        session.state = STATES.SETTINGS;
        render(copy.settingsToggle, settings.node);
        trackNativeClick(settings.node, () => setTimeout(reconcile, 0));
        return STATES.SETTINGS;
      }

      render(copy.unavailable, null);
      return 'UNAVAILABLE';
    }

    function start({ document: documentLike, location: locationLike, storage, onPrerequisiteReady: ready } = {}) {
      if (!documentLike || !locationLike) return 'UNAVAILABLE';
      if (!COPY[localeApi?.resolve?.(documentLike)]) return 'LOCALE_UNAVAILABLE';
      clearUi();
      session.active = true;
      session.state = STATES.SETTINGS;
      session.document = documentLike;
      session.location = locationLike;
      session.storage = storage || null;
      session.saveHandoff = null;
      session.recoveredFromReload = false;
      session.saveHandoffStarting = false;
      session.onPrerequisiteReady = typeof ready === 'function' ? ready : onPrerequisiteReady;
      return reconcile();
    }

    function restoreSaveHandoff({ document: documentLike, location: locationLike, storage, handoff, onPrerequisiteReady: ready } = {}) {
      if (!documentLike || !locationLike) return 'UNAVAILABLE';
      if (!COPY[localeApi?.resolve?.(documentLike)]) return 'LOCALE_UNAVAILABLE';
      const fingerprint = handoff?.pending === true && typeof handoff?.fingerprint === 'string'
        ? handoff.fingerprint.trim()
        : '';
      if (!fingerprint || displayApi?.matchesRoute?.(locationLike.hash) !== true) {
        void preferenceApi?.clearSaveHandoff?.(storage);
        return 'UNAVAILABLE';
      }
      const currentDisplay = displayApi?.inspect?.({ document: documentLike, hash: locationLike.hash }) || { status: 'UNVERIFIED' };
      const currentFingerprint = currentDisplay.status === 'FOUND'
        ? displayApi?.readSelectedFingerprint?.(currentDisplay.control)
        : null;
      if (currentDisplay.status !== 'FOUND' && currentDisplay.status !== 'MISSING') {
        void preferenceApi?.clearSaveHandoff?.(storage);
        return 'UNAVAILABLE';
      }
      if (currentDisplay.status === 'FOUND'
          && (currentFingerprint !== fingerprint || displayApi?.isFirstMiddleLast?.(currentDisplay.control) !== true)) {
        void preferenceApi?.clearSaveHandoff?.(storage);
        return 'UNAVAILABLE';
      }

      clearUi();
      session.active = true;
      session.state = STATES.AWAITING_NATIVE_SAVE;
      session.document = documentLike;
      session.location = locationLike;
      session.storage = storage || null;
      session.saveHandoff = Object.freeze(handoff.saveClicked === true
        ? { pending: true, fingerprint, saveClicked: true }
        : { pending: true, fingerprint });
      session.recoveredFromReload = true;
      session.saveHandoffStarting = false;
      session.onPrerequisiteReady = typeof ready === 'function' ? ready : onPrerequisiteReady;
      return currentDisplay.status === 'MISSING' || !currentFingerprint ? 'WAITING_FOR_DISPLAY' : reconcile();
    }

    function stop() {
      clearUi();
      session.active = false;
      session.state = STATES.IDLE;
      session.document = null;
      session.location = null;
      session.storage = null;
      session.saveHandoff = null;
      session.recoveredFromReload = false;
      session.saveHandoffStarting = false;
      session.onPrerequisiteReady = onPrerequisiteReady;
    }

    function isActive() {
      return session.active;
    }

    return Object.freeze({ start, restoreSaveHandoff, reconcile, stop, isActive });
  }

  const onboarding = defaultDisplayApi && defaultLocaleApi
    ? createOnboarding({
      displayApi: defaultDisplayApi,
      localeApi: defaultLocaleApi,
      preferenceApi: defaultPreferenceApi,
      prerequisiteVerifier: defaultPrerequisiteVerifier,
    })
    : null;
  const api = Object.freeze({
    COPY,
    STATES,
    createOnboarding,
    onboarding,
    start: (...args) => onboarding?.start?.(...args) ?? 'UNAVAILABLE',
    restoreSaveHandoff: (...args) => onboarding?.restoreSaveHandoff?.(...args) ?? 'UNAVAILABLE',
    reconcile: (...args) => onboarding?.reconcile?.(...args) ?? 'INACTIVE',
    stop: (...args) => onboarding?.stop?.(...args),
    isActive: (...args) => onboarding?.isActive?.(...args) ?? false,
  });
  root.SIS_STANDALONE_DISPLAY_SETTINGS_ONBOARDING = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
