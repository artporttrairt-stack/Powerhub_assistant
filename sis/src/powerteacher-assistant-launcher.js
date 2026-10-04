(function (root) {
  'use strict';

  const COPY = Object.freeze({
    en: Object.freeze({
      launcher: 'PowerTeacher Assistant',
      title: 'PowerTeacher Assistant',
      studentNameSetup: 'Use natural Vietnamese student names',
      close: 'Close',
      hideLauncher: 'Hide PowerTeacher Assistant until reload',
    }),
    vi: Object.freeze({
      launcher: 'Trợ lý PowerTeacher',
      title: 'Trợ lý PowerTeacher',
      studentNameSetup: 'Tôi muốn đổi tên tự nhiên sang tiếng Việt',
      close: 'Đóng',
      hideLauncher: 'Ẩn Trợ lý PowerTeacher đến khi tải lại trang',
    }),
  });

  function createLauncher({ localeApi = root.SIS_POWERTEACHER_LOCALE } = {}) {
    const DEFAULT_RIGHT_PX = 18;
    const DEFAULT_BOTTOM_PX = 18;
    const SAVE_GAP_PX = 12;
    let currentDocument = null;
    let startStudentNameSetup = null;
    let ownedLauncher = null;
    let hiddenDocument = null;

    function make(tag, className, label) {
      const node = currentDocument.createElement(tag);
      if (className) node.classList.add(...className.split(' ').filter(Boolean));
      if (label !== undefined) node.replaceChildren(currentDocument.createTextNode(String(label)));
      return node;
    }

    function removePanel() {
      currentDocument?.getElementById('ai-my-pt-standalone-panel')?.remove();
    }

    function remove() {
      removePanel();
      currentDocument?.getElementById('ai-my-pt-standalone-controls')?.remove();
      currentDocument?.getElementById('ai-my-pt-standalone-launcher')?.remove();
      ownedLauncher = null;
      currentDocument = null;
      startStudentNameSetup = null;
    }

    function isInstalled() {
      return Boolean(currentDocument?.getElementById('ai-my-pt-standalone-launcher'));
    }

    function positionLauncherSafely(launcher, documentLike = currentDocument) {
      if (!launcher) return 'UNAVAILABLE';
      launcher.style.right = `${DEFAULT_RIGHT_PX}px`;
      launcher.style.top = '';
      launcher.style.bottom = `${DEFAULT_BOTTOM_PX}px`;

      const saves = typeof documentLike?.querySelectorAll === 'function'
        ? Array.from(documentLike.querySelectorAll('#footer-save-button'))
        : [];
      if (saves.length !== 1 || typeof saves[0]?.getBoundingClientRect !== 'function') return 'DEFAULT';

      const rect = saves[0].getBoundingClientRect();
      const viewportHeight = Number(documentLike?.documentElement?.clientHeight) || 0;
      if (!viewportHeight || !Number.isFinite(rect?.top)) return 'DEFAULT';

      const safeBottom = Math.ceil(viewportHeight - rect.top + SAVE_GAP_PX);
      if (safeBottom <= DEFAULT_BOTTOM_PX || safeBottom >= viewportHeight - 44) return 'DEFAULT';
      launcher.style.bottom = `${safeBottom}px`;
      return 'ABOVE_SAVE';
    }

    function openPanel(locale) {
      removePanel();
      const copy = COPY[locale];
      if (!copy || !currentDocument) return;

      const panel = make('section', 'ai-my-pt-card', undefined);
      panel.id = 'ai-my-pt-standalone-panel';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'false');
      panel.setAttribute('aria-label', copy.title);
      panel.style.right = '18px';
      panel.style.bottom = '72px';
      panel.style.zIndex = '2147483598';

      const title = make('h2', 'ai-my-pt-title', copy.title);
      const controls = make('div', 'ai-my-pt-controls', undefined);
      const action = make('button', 'ai-my-pt-btn ai-my-pt-btn-primary', copy.studentNameSetup);
      action.id = 'ai-my-pt-student-name-setup-action';
      action.type = 'button';
      action.addEventListener('click', (event) => {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        removePanel();
        startStudentNameSetup?.();
      });
      const close = make('button', 'ai-my-pt-btn ai-my-pt-btn-quiet', copy.close);
      close.type = 'button';
      close.addEventListener('click', (event) => {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        removePanel();
      });
      controls.append(action, close);
      panel.append(title, controls);
      currentDocument.documentElement.append(panel);
    }

    function install({ document, onStudentNameSetup } = {}) {
      const locale = localeApi?.resolve?.(document);
      if (!COPY[locale]) {
        remove();
        return 'LOCALE_UNAVAILABLE';
      }
      currentDocument = document;
      startStudentNameSetup = typeof onStudentNameSetup === 'function' ? onStudentNameSetup : null;
      if (hiddenDocument === document) return 'HIDDEN';

      const existingLauncher = document.getElementById('ai-my-pt-standalone-launcher');
      if (existingLauncher === ownedLauncher && ownedLauncher) return 'ALREADY_INSTALLED';
      if (existingLauncher) {
        removePanel();
        document.getElementById('ai-my-pt-standalone-controls')?.remove();
        existingLauncher.remove();
      }

      const launcher = make('button', 'ai-my-pt-launcher', COPY[locale].launcher);
      launcher.id = 'ai-my-pt-standalone-launcher';
      launcher.type = 'button';
      launcher.setAttribute('aria-label', COPY[locale].launcher);
      launcher.addEventListener('click', (event) => {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        const liveLocale = localeApi?.resolve?.(currentDocument);
        if (!COPY[liveLocale]) {
          remove();
          return;
        }
        if (currentDocument.getElementById('ai-my-pt-standalone-panel')) removePanel();
        else openPanel(liveLocale);
      });
      const controls = make('div', 'ai-my-pt-launcher-controls');
      controls.id = 'ai-my-pt-standalone-controls';
      controls.style.zIndex = '2147483599';
      const hide = make('button', 'ai-my-pt-launcher-hide', '×');
      hide.id = 'ai-my-pt-standalone-hide';
      hide.type = 'button';
      hide.setAttribute('aria-label', COPY[locale].hideLauncher);
      hide.addEventListener('click', (event) => {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        hiddenDocument = currentDocument;
        removePanel();
        controls.remove();
      });
      controls.append(launcher, hide);
      document.documentElement.append(controls);
      ownedLauncher = launcher;
      positionLauncherSafely(controls, document);
      return 'INSTALLED';
    }

    function open() {
      const locale = localeApi?.resolve?.(currentDocument);
      if (!currentDocument || !COPY[locale]) return false;
      openPanel(locale);
      return true;
    }

    function reconcile({ document = currentDocument } = {}) {
      const locale = localeApi?.resolve?.(document);
      if (!COPY[locale]) {
        remove();
        return 'LOCALE_UNAVAILABLE';
      }
      currentDocument = document;
      if (hiddenDocument === document) return 'HIDDEN';
      const launcher = document?.getElementById('ai-my-pt-standalone-launcher');
      if (launcher) {
        launcher.replaceChildren(document.createTextNode(COPY[locale].launcher));
        launcher.setAttribute('aria-label', COPY[locale].launcher);
        const controls = document.getElementById('ai-my-pt-standalone-controls');
        const hide = document.getElementById('ai-my-pt-standalone-hide');
        hide?.setAttribute('aria-label', COPY[locale].hideLauncher);
        if (controls) positionLauncherSafely(controls, document);
      }
      const panel = document?.getElementById('ai-my-pt-standalone-panel');
      if (panel) openPanel(locale);
      return 'READY';
    }

    return Object.freeze({ install, reconcile, remove, isInstalled, open });
  }

  const api = Object.freeze({ COPY, createLauncher });
  root.SIS_POWERTEACHER_ASSISTANT_LAUNCHER = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
