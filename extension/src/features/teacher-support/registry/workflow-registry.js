(function initTeacherSupportWorkflowRegistry(root) {
  'use strict';

  function freezeWorkflow(workflow) {
    return Object.freeze({
      ...workflow,
      visibleInPicker: workflow.visibleInPicker === true,
      navigation: workflow.navigation || null,
      guidancePackId: workflow.guidancePackId || null,
    });
  }

  function createWorkflowRegistry() {
    const workflows = new Map();

    function register(workflow) {
      if (!workflow || typeof workflow.id !== 'string' || !workflow.id.trim()) {
        throw new TypeError('Workflow id is required.');
      }
      if (workflows.has(workflow.id)) {
        throw new Error(`Duplicate workflow id: ${workflow.id}`);
      }
      if (typeof workflow.applicability !== 'function') {
        throw new TypeError('Workflow applicability function is required.');
      }
      const stored = freezeWorkflow(workflow);
      workflows.set(stored.id, stored);
      return stored;
    }

    function get(id) {
      return workflows.get(id) || null;
    }

    function list() {
      return Object.freeze([...workflows.values()]);
    }

    function listVisible() {
      return Object.freeze(
        [...workflows.values()].filter(
          (workflow) => workflow.status === 'READY' && workflow.visibleInPicker === true,
        ),
      );
    }

    function select(context) {
      const matches = [];
      for (const workflow of workflows.values()) {
        const result = workflow.applicability(context);
        if (result && result.matched === true) matches.push(workflow);
      }
      const matchIds = Object.freeze(matches.map((workflow) => workflow.id));
      if (matches.length === 0) {
        return Object.freeze({ status: 'none', workflow: null, matchIds });
      }
      if (matches.length > 1) {
        return Object.freeze({ status: 'ambiguous', workflow: null, matchIds });
      }
      return Object.freeze({ status: 'matched', workflow: matches[0], matchIds });
    }

    return Object.freeze({ register, get, list, listVisible, select });
  }

  if (root) {
    root.PSQM = root.PSQM || {};
    if (!root.PSQM.teacherSupportWorkflowRegistry) {
      root.PSQM.teacherSupportWorkflowRegistry = createWorkflowRegistry();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createWorkflowRegistry };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
