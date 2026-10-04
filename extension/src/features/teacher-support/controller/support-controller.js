(function initTeacherSupportController(root) {
  'use strict';
  const COMMANDS = Object.freeze({ SHOW_WORKFLOW_PICKER:'SHOW_WORKFLOW_PICKER', SHOW_NAVIGATION_TARGET:'SHOW_NAVIGATION_TARGET', SHOW_FILTER_CONTROL:'SHOW_FILTER_CONTROL', SHOW_FILTER_QUERY:'SHOW_FILTER_QUERY', OPEN_TASK_PICKER:'OPEN_TASK_PICKER', OPEN_REFERENCE:'OPEN_REFERENCE', COLLAPSE:'COLLAPSE' });
  function createSupportController({ registry, resolveState, ui }) {
    if (!registry || typeof registry.listVisible !== 'function' || typeof registry.select !== 'function') throw new TypeError('Workflow registry is required.');
    if (typeof resolveState !== 'function') throw new TypeError('State resolver is required.');
    function makeCommand(type, details={}) { return Object.freeze({type,...details}); }
    function withUiState(inputs={}) { return Object.freeze({ ...(inputs.context || {}), uiState: inputs.uiState }); }
    function showWorkflowPicker() { const workflows=registry.listVisible(); if(ui&&typeof ui.replaceBars==='function') ui.replaceBars(workflows.map(workflow=>({id:workflow.id,label:workflow.label}))); return makeCommand(COMMANDS.SHOW_WORKFLOW_PICKER,{workflows}); }
    function commandFor(workflow, inputs={}) {
      if(!workflow||workflow.status!=='READY') return showWorkflowPicker();
      const state=resolveState({workflow,...inputs});
      if(state==='NAVIGATION_REQUIRED') return makeCommand(COMMANDS.SHOW_NAVIGATION_TARGET,{workflowId:workflow.id,target:workflow.navigation&&workflow.navigation.targetView});
      if(state==='FILTER_REQUIRED') return makeCommand(COMMANDS.SHOW_FILTER_CONTROL,{workflowId:workflow.id});
      if(state==='FILTER_QUERY_REQUIRED') return makeCommand(COMMANDS.SHOW_FILTER_QUERY,{workflowId:workflow.id,query:workflow.navigation&&workflow.navigation.filterQuery});
      if(state==='WORKFLOW_CONTEXT_READY') {
        const applicability=workflow.applicability(withUiState(inputs));
        if(!applicability||applicability.matched!==true) return showWorkflowPicker();
        return makeCommand(COMMANDS.OPEN_TASK_PICKER,{workflowId:workflow.id,guidancePackId:workflow.guidancePackId});
      }
      if(state==='QUIET'){ if(ui&&typeof ui.collapse==='function') ui.collapse(); return makeCommand(COMMANDS.COLLAPSE); }
      return showWorkflowPicker();
    }
    function continueFromHere(inputs={}) { const selection=registry.select(withUiState(inputs)); if(!selection||selection.status!=='matched') return showWorkflowPicker(); return commandFor(selection.workflow,inputs); }
    function selectWorkflow(id,inputs={}) { const workflow=typeof registry.get==='function'?registry.get(id):null; if(!workflow||workflow.status!=='READY'||typeof workflow.applicability!=='function') return showWorkflowPicker(); return commandFor(workflow,inputs); }
    function quickReference(){return makeCommand(COMMANDS.OPEN_REFERENCE);}
    function knowAlready(){if(ui&&typeof ui.collapse==='function')ui.collapse();return makeCommand(COMMANDS.COLLAPSE);}
    function showMe(target){if(ui&&typeof ui.highlight==='function')ui.highlight(target);return makeCommand(COMMANDS.SHOW_NAVIGATION_TARGET,{target,mode:'highlight-only'});}
    return Object.freeze({showWorkflowPicker,continueFromHere,selectWorkflow,quickReference,knowAlready,showMe});
  }
  const api=Object.freeze({COMMANDS,createSupportController});
  if(root){root.PSQM=root.PSQM||{};root.PSQM.teacherSupportController=api;}
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
