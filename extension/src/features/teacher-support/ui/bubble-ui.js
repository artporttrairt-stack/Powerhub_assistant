(function initTeacherSupportBubbleUi(root) {
  'use strict';

  const ROOT_ID = 'hub-teacher-support-root';
  const BAR_CLASS = 'hub-support-bar';
  const HIGHLIGHT_CLASS = 'hub-support-highlight';

  function createBubbleUi(documentLike, options = {}) {
    let rootNode = null;
    let barsNode = null;
    let wakeNode = null;
    let robotNode = null;
    let highlightNode = null;
    let wakeListener = null;

    function mount() {
      if (rootNode && rootNode.parentNode) return rootNode;
      const existing = documentLike && documentLike.getElementById && documentLike.getElementById(ROOT_ID);
      if (existing) {
        rootNode = existing;
        barsNode = rootNode.querySelector && rootNode.querySelector('.hub-support-bars');
        wakeNode = rootNode.querySelector && rootNode.querySelector('.hub-support-wake');
        return rootNode;
      }
      if (!documentLike || !documentLike.body || typeof documentLike.createElement !== 'function') return null;
      rootNode = documentLike.createElement('div');
      rootNode.id = ROOT_ID;
      rootNode.className = 'hub-support-root';
      barsNode = documentLike.createElement('div');
      barsNode.className = 'hub-support-bars';
      wakeNode = documentLike.createElement('button');
      wakeNode.className = 'hub-support-wake';
      wakeNode.textContent = 'Hub';
      if (wakeNode.dataset) wakeNode.dataset.itemId = 'wake';
      rootNode.appendChild(barsNode);
      rootNode.appendChild(wakeNode);
      if (options.robotUrl) {
        robotNode = documentLike.createElement('img');
        robotNode.className = 'hub-support-robot';
        robotNode.alt = '';
        robotNode.src = options.robotUrl;
        rootNode.appendChild(robotNode);
      }
      documentLike.body.appendChild(rootNode);
      ensureWakeListener();
      return rootNode;
    }

    function ensureWakeListener() {
      if (!wakeNode || wakeListener) return;
      wakeListener = () => wake();
      wakeNode.addEventListener('click', wakeListener);
    }

    function makeBar(item) {
      const bar = documentLike.createElement('button');
      bar.className = BAR_CLASS;
      bar.textContent = String(item && (item.label || item.text || item.id) || '');
      if (bar.dataset) bar.dataset.itemId = String(item && item.id || '');
      return bar;
    }

    function showBars(items) {
      mount();
      for (const item of items || []) barsNode.appendChild(makeBar(item));
      return barsNode;
    }

    function replaceBars(items) {
      mount();
      if (typeof barsNode.replaceChildren === 'function') barsNode.replaceChildren();
      else while (barsNode.children && barsNode.children.length) barsNode.removeChild(barsNode.children[0]);
      return showBars(items);
    }

    function highlight(target) {
      mount();
      if (highlightNode) highlightNode.remove();
      highlightNode = documentLike.createElement('div');
      highlightNode.className = HIGHLIGHT_CLASS;
      if (highlightNode.dataset) highlightNode.dataset.targetPresent = target ? 'true' : 'false';
      rootNode.appendChild(highlightNode);
      return highlightNode;
    }

    function collapse() {
      mount();
      rootNode.className = 'hub-support-root is-collapsed';
      ensureWakeListener();
    }

    function wake() {
      mount();
      rootNode.className = 'hub-support-root';
      ensureWakeListener();
    }

    function destroy() {
      if (wakeNode && wakeListener) wakeNode.removeEventListener('click', wakeListener);
      wakeListener = null;
      if (highlightNode) highlightNode.remove();
      highlightNode = null;
      if (rootNode) rootNode.remove();
      rootNode = null;
      barsNode = null;
      wakeNode = null;
      robotNode = null;
    }

    return Object.freeze({ mount, showBars, replaceBars, highlight, collapse, wake, destroy });
  }

  const api = Object.freeze({ createBubbleUi });
  if (root) {
    root.PSQM = root.PSQM || {};
    root.PSQM.teacherSupportBubbleUi = api;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
