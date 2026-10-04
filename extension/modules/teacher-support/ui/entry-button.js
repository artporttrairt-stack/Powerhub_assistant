(function initTeacherSupportEntryButton(rootGlobal) {
  'use strict';

  function createEntryButton({ document, root, onIntent }) {
    if (!document || !root) throw new TypeError('document and root are required.');
    if (typeof onIntent !== 'function') throw new TypeError('onIntent is required.');

    let button = null;
    let attentionConsumed = false;

    function ensureButton() {
      if (button) return button;
      button = document.createElement('button');
      button.id = 'hub-assistant-teacher-support-entry';
      button.type = 'button';
      button.classList.add('ha-ts-entry');
      button.textContent = '?';
      button.addEventListener('click', () => {
        attentionConsumed = true;
        button.classList.remove('ha-ts-attention');
        onIntent('open');
      });
      root.appendChild(button);
      return button;
    }

    function render(model = {}) {
      const node = ensureButton();
      node.hidden = model.visible === false;
      node.setAttribute('aria-label', String(model.label || 'Teacher Support'));
      const shouldAnimate = Boolean(model.attention) && model.reducedMotion !== true && !attentionConsumed;
      node.classList.toggle('ha-ts-attention', shouldAnimate);
      return node;
    }

    function focus() {
      if (button) button.focus();
    }

    function destroy() {
      if (button) button.remove();
      button = null;
    }

    return Object.freeze({ render, focus, destroy });
  }

  if (rootGlobal) {
    rootGlobal.PSQM = rootGlobal.PSQM || {};
    rootGlobal.PSQM.teacherSupport = rootGlobal.PSQM.teacherSupport || {};
    rootGlobal.PSQM.teacherSupport.createEntryButton = createEntryButton;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { createEntryButton };
})(typeof globalThis !== 'undefined' ? globalThis : this);
