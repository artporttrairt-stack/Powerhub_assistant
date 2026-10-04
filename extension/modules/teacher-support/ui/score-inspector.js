(function initTeacherSupportScoreInspector(rootGlobal) {
  'use strict';

  function createScoreInspector({ document, root, onIntent }) {
    if (!document || !root) throw new TypeError('document and root are required.');
    if (typeof onIntent !== 'function') throw new TypeError('onIntent is required.');

    let inspector = null;

    function ensureInspector() {
      if (inspector) return inspector;
      inspector = document.createElement('section');
      inspector.id = 'hub-assistant-teacher-support-inspector';
      inspector.classList.add('ha-ts-inspector');
      root.appendChild(inspector);
      return inspector;
    }

    function textNode(tagName, className, text) {
      const node = document.createElement(tagName);
      if (className) node.classList.add(className);
      node.textContent = String(text || '');
      return node;
    }

    function appendStep(parent, step, label, content) {
      if (content == null || content === '') return null;
      const section = document.createElement('section');
      section.classList.add('ha-ts-content-step');
      section.setAttribute('data-content-step', step);
      section.appendChild(textNode('h4', 'ha-ts-content-label', label));

      if (Array.isArray(content)) {
        const list = document.createElement('ul');
        for (const value of content) {
          const item = document.createElement('li');
          item.textContent = String(value);
          list.appendChild(item);
        }
        section.appendChild(list);
      } else {
        section.appendChild(textNode('p', 'ha-ts-content-text', content));
      }

      parent.appendChild(section);
      return section;
    }

    function renderAreaControls(parent, viewModel) {
      if (viewModel.mode !== 'reference') return;
      const areas = Array.isArray(viewModel.areas) ? viewModel.areas : [];
      if (!areas.length) return;
      const controls = document.createElement('div');
      controls.classList.add('ha-ts-reference-areas');
      const selected = viewModel.selectedAreaId || null;
      for (const area of areas) {
        if (!area || typeof area.id !== 'string') continue;
        const button = document.createElement('button');
        button.type = 'button';
        button.classList.add('ha-ts-reference-area');
        button.setAttribute('data-reference-area', area.id);
        button.setAttribute('aria-pressed', area.id === selected ? 'true' : 'false');
        button.textContent = String(area.title || area.id);
        button.addEventListener('click', () => onIntent({ type: 'reference-area', value: area.id }));
        controls.appendChild(button);
      }
      parent.appendChild(controls);
    }

    function renderReferenceControls(parent, viewModel) {
      const controls = document.createElement('div');
      controls.classList.add('ha-ts-reference-levels');
      const selected = viewModel.selectedReferenceLevel || null;
      for (const code of Array.isArray(viewModel.levelCodes) ? viewModel.levelCodes : []) {
        const button = document.createElement('button');
        button.type = 'button';
        button.classList.add('ha-ts-reference-level');
        button.setAttribute('data-reference-level', code);
        button.setAttribute('aria-pressed', code === selected ? 'true' : 'false');
        button.textContent = String(code);
        button.addEventListener('click', () => onIntent({ type: 'reference-level', value: code }));
        controls.appendChild(button);
      }
      parent.appendChild(controls);
    }

    function renderLanguageControls(parent, viewModel) {
      const options = Array.isArray(viewModel.assistLanguages) ? viewModel.assistLanguages : [];
      if (!options.length) return;
      const controls = document.createElement('div');
      controls.classList.add('ha-ts-assist-languages');
      const active = viewModel.assistLanguage || options[0] || '';
      for (const language of options) {
        const button = document.createElement('button');
        button.type = 'button';
        button.classList.add('ha-ts-assist-language');
        button.setAttribute('data-assist-language', language);
        button.setAttribute('aria-pressed', language === active ? 'true' : 'false');
        button.textContent = String(language);
        button.addEventListener('click', () => onIntent({ type: 'assist-language', value: language }));
        controls.appendChild(button);
      }
      parent.appendChild(controls);
    }

    function subjectText(subjectExample, language) {
      if (!subjectExample) return null;
      if (language === 'VI' && subjectExample.textVi) return subjectExample.textVi;
      return subjectExample.textEn || subjectExample.text || null;
    }

    function render(viewModel = {}) {
      const node = ensureInspector();
      node.hidden = false;
      node.replaceChildren();

      if (viewModel.mode === 'reference') {
        node.appendChild(textNode(
          'p',
          'ha-ts-reference-only',
          viewModel.referenceOnlyLabel || 'Reference only'
        ));
        renderAreaControls(node, viewModel);
      }

      node.appendChild(textNode('h3', 'ha-ts-inspector-title', viewModel.officialTitle));
      renderReferenceControls(node, viewModel);
      renderLanguageControls(node, viewModel);

      const criterion = viewModel.officialCriterion && (
        viewModel.officialCriterion.criterion || viewModel.officialCriterion.text
      );
      appendStep(node, 'official', 'OFFICIAL CRITERION', criterion);

      const explanation = viewModel.plainExplanation && (
        viewModel.plainExplanation.text || viewModel.plainExplanation.explanation
      );
      appendStep(node, 'explanation', 'Explanation', explanation);
      appendStep(node, 'evidence', 'Classroom evidence', viewModel.evidence || []);
      appendStep(node, 'observation', 'Observation prompts', viewModel.checklist || []);

      const example = subjectText(viewModel.subjectExample, viewModel.assistLanguage);
      if (example) appendStep(node, 'subject-example', 'Subject example', example);

      const comparison = viewModel.comparison && (
        viewModel.comparison.text || viewModel.comparison.comparison
      );
      appendStep(node, 'comparison', 'Adjacent comparison', comparison);
      appendStep(node, 'decision', 'Teacher decision', viewModel.teacherDecisionMessage);

      return node;
    }

    function reset() {
      if (!inspector) return;
      inspector.hidden = true;
      inspector.replaceChildren();
    }

    function destroy() {
      if (!inspector) return;
      inspector.remove();
      inspector = null;
    }

    return Object.freeze({ render, reset, destroy });
  }

  if (rootGlobal) {
    rootGlobal.PSQM = rootGlobal.PSQM || {};
    rootGlobal.PSQM.teacherSupport = rootGlobal.PSQM.teacherSupport || {};
    rootGlobal.PSQM.teacherSupport.createScoreInspector = createScoreInspector;
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { createScoreInspector };
})(typeof globalThis !== 'undefined' ? globalThis : this);
