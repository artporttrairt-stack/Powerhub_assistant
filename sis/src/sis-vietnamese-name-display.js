(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.SISVietnameseNameDisplay = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SKIP_TAGS = new Set([
    'SCRIPT',
    'STYLE',
    'NOSCRIPT',
    'TEMPLATE',
    'TEXTAREA',
    'INPUT',
    'SELECT',
    'OPTION'
  ]);

  function normalizePart(value) {
    return (value || '').trim().replace(/\s+/g, ' ');
  }

  function buildVietnameseDisplayName(student) {
    return [student && student.lastname, student && student.middlename, student && student.firstname]
      .map(normalizePart)
      .filter(Boolean)
      .join(' ');
  }

  function getSectionId(url) {
    const source = typeof url === 'string'
      ? url
      : (typeof location !== 'undefined' ? location.href : '');
    const match = source.match(/[?&]sectionId=(\d+)(?:[&#]|$)/i);
    return match ? match[1] : null;
  }

  function buildNameMap(data) {
    const map = new Map();
    if (!Array.isArray(data)) return map;

    data.forEach(student => {
      const correct = buildVietnameseDisplayName(student);
      const nativeLastFirst = normalizePart(student && student.lastfirst);
      if (!correct) return;

      if (nativeLastFirst) {
        map.set(nativeLastFirst, correct);

        const commaFree = nativeLastFirst
          .replace(',', '')
          .replace(/\s+/g, ' ')
          .trim();
        if (commaFree && commaFree !== nativeLastFirst) {
          map.set(commaFree, correct);
        }
      }

      const nativeFirstMiddleLast = [
        student && student.firstname,
        student && student.middlename,
        student && student.lastname
      ]
        .map(normalizePart)
        .filter(Boolean)
        .join(' ');

      if (nativeFirstMiddleLast) {
        map.set(nativeFirstMiddleLast, correct);
      }
    });

    return map;
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function transformText(text, map) {
    if (typeof text !== 'string' || !map || map.size === 0) return text;

    const replacements = Array.from(map.entries())
      .filter(([nativeName, displayName]) => nativeName && displayName && nativeName !== displayName)
      .sort((left, right) => right[0].length - left[0].length);
    if (replacements.length === 0) return text;

    const replacementMap = new Map(replacements);
    const pattern = new RegExp(replacements.map(([nativeName]) => escapeRegExp(nativeName)).join('|'), 'g');
    return text.replace(pattern, nativeName => replacementMap.get(nativeName) || nativeName);
  }

  function shouldAcceptRoster(currentGeneration, currentSectionId, responseGeneration, responseSectionId) {
    return currentGeneration === responseGeneration && currentSectionId === responseSectionId;
  }

  function shouldSkipElement(element) {
    if (!element) return false;
    const tagName = String(element.tagName || '').toUpperCase();
    if (SKIP_TAGS.has(tagName) || element.isContentEditable === true || element.hidden === true) {
      return true;
    }
    if (typeof element.getAttribute === 'function') {
      const ariaHidden = element.getAttribute('aria-hidden');
      if (String(ariaHidden).toLowerCase() === 'true') return true;
      const contentEditable = element.getAttribute('contenteditable');
      if (contentEditable === '' || String(contentEditable).toLowerCase() === 'true') return true;
    }
    return false;
  }

  function hasProtectedAncestor(element) {
    let current = element;
    while (current) {
      if (shouldSkipElement(current)) return true;
      current = current.parentElement || null;
    }
    return false;
  }

  function fixTextNode(node, map) {
    if (!node || node.nodeType !== 3 || hasProtectedAncestor(node.parentElement)) return false;
    const before = node.textContent;
    const after = transformText(before, map);
    if (after === before) return false;
    node.textContent = after;
    return true;
  }

  function transformDomRoot(rootNode, map) {
    if (!rootNode || !map || map.size === 0) return 0;

    if (rootNode.nodeType === 3) {
      return fixTextNode(rootNode, map) ? 1 : 0;
    }

    if (rootNode.nodeType === 1 && shouldSkipElement(rootNode)) return 0;

    const doc = rootNode.ownerDocument || (rootNode.nodeType === 9 ? rootNode : null) ||
      (typeof document !== 'undefined' ? document : null);
    if (!doc || typeof doc.createTreeWalker !== 'function') return 0;

    const showText = typeof NodeFilter !== 'undefined' ? NodeFilter.SHOW_TEXT : 4;
    const walker = doc.createTreeWalker(rootNode, showText, null);
    let changed = 0;
    let node;
    while ((node = walker.nextNode())) {
      if (fixTextNode(node, map)) changed += 1;
    }
    return changed;
  }

  const MAX_ROSTER_RETRIES = 3;
  const RETRY_COOLDOWN_MS = 30000;

  function createRuntime(env) {
    let initialized = false;
    let initPromise = null;
    let currentSectionId = null;
    let generation = 0;
    let nameMap = new Map();
    let activeController = null;
    let stopObserver = null;
    let intervalId = null;
    let retryFailures = 0;
    let retryPending = false;
    let retryAfterMs = 0;

    const onNavigation = () => {
      void syncContext(false);
    };

    const onPageHide = () => {
      invalidateContext(null);
    };

    const onPageShow = () => {
      void syncContext(true);
    };

    function abortActiveRequest() {
      if (activeController) {
        activeController.abort();
        activeController = null;
      }
    }

    function invalidateContext(nextSectionId, { resetRetries = true } = {}) {
      generation += 1;
      abortActiveRequest();
      currentSectionId = nextSectionId;
      nameMap = new Map();
      if (resetRetries) {
        retryFailures = 0;
        retryPending = false;
        retryAfterMs = 0;
      }
    }

    async function syncContext(force) {
      const sectionId = getSectionId(env.getUrl());

      if (!sectionId) {
        if (currentSectionId !== null || nameMap.size > 0 || activeController) {
          invalidateContext(null);
        }
        env.log(`[SIS VN Name] No sectionId in current URL; waiting for a section context: ${env.getUrl()}`);
        return;
      }

      const sameSection = sectionId === currentSectionId;
      if (!force && sameSection) {
        if (!retryPending) return;
        const now = typeof env.now === 'function' ? Number(env.now()) || 0 : Date.now();
        if (retryAfterMs > now) return;
      }

      invalidateContext(sectionId, { resetRetries: force || !sameSection });
      retryPending = false;
      retryAfterMs = 0;
      const requestGeneration = generation;
      const requestSectionId = sectionId;
      const controller = env.createAbortController();
      activeController = controller;

      try {
        const data = await env.fetchRoster(sectionId, controller.signal);
        if (!shouldAcceptRoster(generation, currentSectionId, requestGeneration, requestSectionId)) return;

        activeController = null;
        retryFailures = 0;
        retryPending = false;
        retryAfterMs = 0;
        nameMap = buildNameMap(data);
        env.applyMap(nameMap);
        env.log(`[SIS VN Name] Loaded ${Array.isArray(data) ? data.length : 0} roster entries for section ${sectionId}`);
      } catch (error) {
        if (controller.signal && controller.signal.aborted) return;
        if (!shouldAcceptRoster(generation, currentSectionId, requestGeneration, requestSectionId)) return;
        activeController = null;
        nameMap = new Map();
        retryFailures += 1;
        retryPending = true;
        if (retryFailures > MAX_ROSTER_RETRIES) {
          const now = typeof env.now === 'function' ? Number(env.now()) || 0 : Date.now();
          retryAfterMs = now + RETRY_COOLDOWN_MS;
        }
        env.warn(`[SIS VN Name] Roster load failed for section ${sectionId}: ${error && error.message ? error.message : String(error)}`);
      }
    }

    function handleObservedRoots(roots) {
      const observedSectionId = getSectionId(env.getUrl());
      if (observedSectionId !== currentSectionId) {
        void syncContext(false);
        return;
      }
      if (nameMap.size === 0 || !Array.isArray(roots)) return;
      roots.forEach(root => env.applyMap(nameMap, root));
    }

    function init() {
      if (initPromise) return initPromise;
      if (initialized) return Promise.resolve();

      initPromise = (async () => {
        let nextStopObserver = null;
        let nextIntervalId = null;
        const addedListeners = [];
        try {
          nextStopObserver = env.startObserver(handleObservedRoots);
          nextIntervalId = env.setInterval(onNavigation, 1000);
          const listeners = [
            ['popstate', onNavigation],
            ['hashchange', onNavigation],
            ['pagehide', onPageHide],
            ['pageshow', onPageShow],
          ];
          for (const [type, listener] of listeners) {
            env.addWindowListener(type, listener);
            addedListeners.push([type, listener]);
          }

          stopObserver = nextStopObserver;
          intervalId = nextIntervalId;
          initialized = true;
          await syncContext(true);
        } catch (error) {
          if (typeof nextStopObserver === 'function') nextStopObserver();
          if (nextIntervalId !== null) env.clearInterval(nextIntervalId);
          for (let index = addedListeners.length - 1; index >= 0; index -= 1) {
            const [type, listener] = addedListeners[index];
            env.removeWindowListener(type, listener);
          }
          stopObserver = null;
          intervalId = null;
          initialized = false;
          invalidateContext(null);
          throw error;
        }
      })().finally(() => {
        initPromise = null;
      });

      return initPromise;
    }

    async function refresh() {
      if (!initialized) return init();
      await syncContext(true);
    }

    function destroy() {
      if (!initialized) return;
      initialized = false;
      invalidateContext(null);
      if (stopObserver) {
        stopObserver();
        stopObserver = null;
      }
      if (intervalId !== null) {
        env.clearInterval(intervalId);
        intervalId = null;
      }
      env.removeWindowListener('popstate', onNavigation);
      env.removeWindowListener('hashchange', onNavigation);
      env.removeWindowListener('pagehide', onPageHide);
      env.removeWindowListener('pageshow', onPageShow);
    }

    return { init, refresh, destroy };
  }

  function createBrowserEnvironment() {
    return {
      getUrl: () => location.href,
      fetchRoster: async (sectionId, signal) => {
        const response = await fetch(
          `${location.origin}/ws/xte/student?section_ids=${encodeURIComponent(sectionId)}&status=A,P`,
          { credentials: 'include', signal }
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      },
      applyMap: (map, rootNode) => {
        const root = rootNode || document.body;
        if (!root) return;
        transformDomRoot(root, map);
      },
      startObserver: callback => {
        if (!document.body || typeof MutationObserver === 'undefined') return () => {};
        const observer = new MutationObserver(mutations => {
          const roots = [];
          mutations.forEach(mutation => {
            if (mutation.type === 'characterData') {
              roots.push(mutation.target);
              return;
            }
            mutation.addedNodes.forEach(node => roots.push(node));
          });
          if (roots.length > 0) callback(roots);
        });
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true
        });
        return () => observer.disconnect();
      },
      setInterval: (fn, ms) => window.setInterval(fn, ms),
      clearInterval: id => window.clearInterval(id),
      addWindowListener: (type, fn) => window.addEventListener(type, fn),
      removeWindowListener: (type, fn) => window.removeEventListener(type, fn),
      createAbortController: () => new AbortController(),
      log: message => console.log(message),
      warn: message => console.warn(message)
    };
  }

  let browserRuntime = null;

  function init() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return Promise.resolve();
    if (!browserRuntime) browserRuntime = createRuntime(createBrowserEnvironment());
    return browserRuntime.init();
  }

  function refresh() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return Promise.resolve();
    if (!browserRuntime) browserRuntime = createRuntime(createBrowserEnvironment());
    return browserRuntime.refresh();
  }

  function destroy() {
    if (!browserRuntime) return;
    browserRuntime.destroy();
    browserRuntime = null;
  }

  return {
    init,
    refresh,
    destroy,
    buildVietnameseDisplayName,
    getSectionId,
    buildNameMap,
    transformText,
    shouldAcceptRoster,
    shouldSkipElement,
    createRuntime
  };
});
