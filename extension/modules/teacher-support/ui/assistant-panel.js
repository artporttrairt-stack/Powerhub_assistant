(function initTeacherSupportAssistantPanel(rootGlobal) {
  'use strict';

  function createAssistantPanel({ document, root, assetUrl, onIntent }) {
    if (!document || !root) throw new TypeError('document and root are required.');
    if (typeof onIntent !== 'function') throw new TypeError('onIntent is required.');

    let panel = null;
    let firstAction = null;
    let targetHint = null;
    let wasOpen = false;

    function focusEntry() {
      const entry = root.querySelector('#hub-assistant-teacher-support-entry');
      if (entry) entry.focus();
    }

    function handleKeydown(event) {
      if (!event || event.key !== 'Escape') return;
      if (!panel || !panel.contains(document.activeElement)) return;
      event.preventDefault();
      onIntent('close');
      focusEntry();
    }

    function ensurePanel() {
      if (panel) return panel;
      panel = document.createElement('section');
      panel.id = 'hub-assistant-teacher-support-panel';
      panel.classList.add('ha-ts-panel');
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'false');
      panel.addEventListener('keydown', handleKeydown);
      root.appendChild(panel);
      return panel;
    }

    function makeText(tagName, className, text) {
      const node = document.createElement(tagName);
      node.classList.add(className);
      node.textContent = String(text || '');
      return node;
    }

    function render(model = {}) {
      const node = ensurePanel();
      const isOpen = model.open === true;
      const opening = isOpen && !wasOpen;
      node.hidden = !isOpen;
      node.replaceChildren();
      firstAction = null;

      if (model.robotVisible) {
        const image = document.createElement('img');
        image.classList.add('ha-ts-robot');
        if (opening && model.reducedMotion !== true) image.classList.add('ha-ts-robot-bounce');
        image.src = String(assetUrl || '');
        image.alt = '';
        image.setAttribute('aria-hidden', 'true');
        image.addEventListener('error', () => {
          image.hidden = true;
        });
        node.appendChild(image);
      }

      const title = makeText('h2', 'ha-ts-panel-title', model.title);
      title.id = 'hub-assistant-teacher-support-panel-title';
      node.setAttribute('aria-labelledby', title.id);
      node.appendChild(title);
      node.appendChild(makeText('p', 'ha-ts-panel-message', model.message));

      const actions = document.createElement('div');
      actions.classList.add('ha-ts-panel-actions');
      for (const action of Array.isArray(model.actions) ? model.actions : []) {
        if (!action || typeof action.intent !== 'string') continue;
        const button = document.createElement('button');
        button.type = 'button';
        button.classList.add('ha-ts-action');
        button.setAttribute('data-intent', action.intent);
        button.textContent = String(action.label || action.intent);
        button.addEventListener('click', () => onIntent(action.intent));
        actions.appendChild(button);
        if (!firstAction) firstAction = button;
      }
      node.appendChild(actions);
      wasOpen = isOpen;
      return node;
    }

    function focusInitial() {
      if (firstAction) firstAction.focus();
    }

    function close() {
      if (panel) panel.hidden = true;
      wasOpen = false;
      focusEntry();
    }

    function clearTargetHint() {
      if (targetHint) targetHint.remove();
      targetHint = null;
    }

    function renderTargetHint(rect) {
      clearTargetHint();
      if (!rect) return null;

      const top = Number(rect.top);
      const left = Number(rect.left);
      const width = Number(rect.width);
      const height = Number(rect.height);
      if (![top, left, width, height].every(Number.isFinite)) return null;

      targetHint = document.createElement('div');
      targetHint.id = 'hub-assistant-teacher-support-target-hint';
      targetHint.classList.add('ha-ts-target-hint');
      targetHint.setAttribute('aria-hidden', 'true');
      targetHint.style.top = `${top}px`;
      targetHint.style.left = `${left}px`;
      targetHint.style.width = `${Math.max(0, width)}px`;
      targetHint.style.height = `${Math.max(0, height)}px`;
      root.appendChild(targetHint);
      return targetHint;
    }

    function destroy() {
      clearTargetHint();
      if (!panel) return;
      panel.removeEventListener('keydown', handleKeydown);
      panel.remove();
      panel = null;
      firstAction = null;
      wasOpen = false;
    }

    return Object.freeze({
      render,
      focusInitial,
      close,
      renderTargetHint,
      clearTargetHint,
      destroy,
    });
  }

  if (rootGlobal) {
    rootGlobal.PSQM = rootGlobal.PSQM || {};
    rootGlobal.PSQM.teacherSupport = rootGlobal.PSQM.teacherSupport || {};
    rootGlobal.PSQM.teacherSupport.createAssistantPanel = createAssistantPanel;
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { createAssistantPanel };
})(typeof globalThis !== 'undefined' ? globalThis : this);
