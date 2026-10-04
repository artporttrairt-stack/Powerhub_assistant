(function (root) {
  'use strict';

  const CONTENT_SELECTOR = '#content-main';
  const DRAWER_SELECTOR = '#sidebar-charms-drawer';

  function createLifecycle() {
    const subscribers = new Set();
    let observer = null;
    let windowRef = null;
    let documentRef = null;
    let contentRoot = null;
    let drawerRoot = null;
    let rafId = null;
    let pendingReason = null;

    function flush() {
      rafId = null;
      const reason = pendingReason || 'change';
      pendingReason = null;
      for (const subscriber of subscribers) subscriber(reason);
    }

    function schedule(reason = 'change') {
      pendingReason = pendingReason || reason;
      if (!windowRef || rafId !== null) return;
      rafId = windowRef.requestAnimationFrame(flush);
    }

    function unique(selector) {
      if (!documentRef || typeof documentRef.querySelectorAll !== 'function') return null;
      const nodes = documentRef.querySelectorAll(selector);
      return nodes && nodes.length === 1 ? nodes[0] : null;
    }

    function observeSteadyRoots() {
      if (!observer || !documentRef?.documentElement) return false;
      const nextContent = unique(CONTENT_SELECTOR);
      if (!nextContent) return false;
      const nextDrawer = unique(DRAWER_SELECTOR);

      observer.disconnect();
      contentRoot = nextContent;
      drawerRoot = nextDrawer;
      observer.observe(documentRef.documentElement, {
        attributes: true,
        attributeFilter: ['lang'],
        childList: true,
        subtree: true,
      });
      observer.observe(contentRoot, {
        attributes: true,
        attributeFilter: ['class'],
        childList: true,
        subtree: true,
        characterData: true,
      });
      if (drawerRoot) {
        observer.observe(drawerRoot, {
          attributes: true,
          attributeFilter: ['aria-hidden', 'class'],
          childList: true,
          subtree: true,
          characterData: true,
        });
      }
      return true;
    }

    function onMutation(records = []) {
      const nextContent = unique(CONTENT_SELECTOR);
      if (nextContent !== contentRoot) {
        if (nextContent) observeSteadyRoots();
        else contentRoot = null;
        schedule('mutation');
        return;
      }
      if (!contentRoot || records.some((record) =>
        (record.target === documentRef.documentElement
          && record.type === 'attributes'
          && record.attributeName === 'lang')
        || contentRoot.contains?.(record.target)
        || drawerRoot?.contains?.(record.target))) {
        schedule('mutation');
      }
    }

    function onHashChange() {
      schedule('hashchange');
    }

    function onInteraction() {
      const nextDrawer = unique(DRAWER_SELECTOR);
      if (nextDrawer !== drawerRoot && observer) observeSteadyRoots();
      schedule('interaction');
    }

    return Object.freeze({
      subscribe(subscriber) {
        if (typeof subscriber !== 'function') return () => {};
        subscribers.add(subscriber);
        return () => subscribers.delete(subscriber);
      },
      start({ document: documentLike, windowLike, allowMissingContentRoot = false } = {}) {
        if (observer || !documentLike?.documentElement || typeof documentLike.querySelectorAll !== 'function' || !windowLike?.MutationObserver || typeof windowLike.requestAnimationFrame !== 'function') return false;
        documentRef = documentLike;
        windowRef = windowLike;
        observer = new windowLike.MutationObserver(onMutation);

        if (!observeSteadyRoots()) {
          if (!allowMissingContentRoot) {
            observer = null;
            documentRef = null;
            windowRef = null;
            return false;
          }
          observer.observe(documentLike.documentElement, {
            attributes: true,
            attributeFilter: ['lang'],
            childList: true,
            subtree: true,
          });
        }

        windowLike.addEventListener('hashchange', onHashChange);
        windowLike.addEventListener('click', onInteraction);
        return true;
      },
      schedule,
      stop() {
        observer?.disconnect();
        observer = null;
        contentRoot = null;
        drawerRoot = null;
        documentRef = null;
        if (windowRef) {
          windowRef.removeEventListener('hashchange', onHashChange);
          windowRef.removeEventListener('click', onInteraction);
        }
        if (windowRef && rafId !== null && typeof windowRef.cancelAnimationFrame === 'function') windowRef.cancelAnimationFrame(rafId);
        rafId = null;
        pendingReason = null;
        windowRef = null;
      },
    });
  }

  const lifecycle = createLifecycle();
  const api = Object.freeze({ CONTENT_SELECTOR, DRAWER_SELECTOR, createLifecycle, lifecycle });
  root.SIS_POWERTEACHER_LIFECYCLE = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
