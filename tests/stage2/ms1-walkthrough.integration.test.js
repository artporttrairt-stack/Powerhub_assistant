'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createWorkflowRegistry}=require('../../extension/src/features/teacher-support/registry/workflow-registry.js');
const {resolveSupportState}=require('../../extension/src/features/teacher-support/state/support-state-resolver.js');
const {createSupportController}=require('../../extension/src/features/teacher-support/controller/support-controller.js');
const {CAM_PRIMARY_MS1_WORKFLOW}=require('../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/workflow.js');
const {matchesCamPrimaryMs1,resolveSupportedSubjectKey,REQUIRED_MS1_STRANDS}=require('../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/applicability.js');
const {createMs1GuidancePack}=require('../../extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/pack.js');
const {createTeacherSupportRuntime}=require('../../extension/src/features/teacher-support/runtime/teacher-support-runtime.js');
const context=(o={})=>({platform:'powerteacher',platformVerified:true,sectionContextVerified:true,ambiguous:false,...o});
const ui=(o={})=>({platformVerified:true,targetView:'other',filterVisible:'unknown',filterQuery:'unknown',workflowMarkerPresent:'unknown',workflowMarkerKey:null,workflowMarkerEvidence:[],courseLabel:'2L8I Science (Khoa học)',reasonCodes:[],...o});
const ready=(o={})=>ui({targetView:'standards',filterVisible:true,filterQuery:'MS1',workflowMarkerPresent:true,workflowMarkerKey:'ms1-strands',workflowMarkerEvidence:[...REQUIRED_MS1_STRANDS],...o});
function setup(){const registry=createWorkflowRegistry();registry.register({...CAM_PRIMARY_MS1_WORKFLOW,applicability:matchesCamPrimaryMs1,resolveSubjectKey:resolveSupportedSubjectKey});registry.register({id:'future.hidden',version:'0',label:'Future',status:'SOURCE_REQUIRED',visibleInPicker:false,navigation:{targetView:'standards',filterQuery:'EOS'},applicability:()=>({matched:false}),guidancePackId:'future'});const calls=[],view={replaceBars:x=>calls.push(['bars',x]),highlight:x=>calls.push(['highlight',x]),collapse:()=>calls.push(['collapse'])};return{calls,controller:createSupportController({registry,resolveState:resolveSupportState,ui:view})};}
test('teacher can choose MS1 and receive navigation before rubric evidence is visible',()=>{const {controller}=setup();assert.equal(controller.selectWorkflow('cam-primary.ms1',{context:context(),uiState:ui(),mode:'guide'}).type,'SHOW_NAVIGATION_TARGET');assert.equal(controller.selectWorkflow('cam-primary.ms1',{context:context(),uiState:ui({targetView:'standards',filterVisible:false}),mode:'guide'}).type,'SHOW_FILTER_CONTROL');});
test('filter flow resumes at first incomplete semantic step and opens only on full strands',()=>{const {controller}=setup();assert.equal(controller.selectWorkflow('cam-primary.ms1',{context:context(),uiState:ui({targetView:'standards',filterVisible:true,filterQuery:''}),mode:'guide'}).type,'SHOW_FILTER_QUERY');assert.equal(controller.selectWorkflow('cam-primary.ms1',{context:context(),uiState:ready(),mode:'guide'}).type,'OPEN_TASK_PICKER');});
test('Continue auto-resolves only complete eight-strand rubric',()=>{const {controller}=setup();assert.equal(controller.continueFromHere({context:context(),uiState:ready(),mode:'guide'}).type,'OPEN_TASK_PICKER');assert.equal(controller.continueFromHere({context:context(),uiState:ready({workflowMarkerPresent:'unknown',workflowMarkerKey:null,workflowMarkerEvidence:REQUIRED_MS1_STRANDS.slice(0,7)}),mode:'guide'}).type,'SHOW_WORKFLOW_PICKER');});
test('all 8 areas and 5 levels remain source-backed and teacher-decided',()=>{const pack=createMs1GuidancePack();assert.equal(pack.listAreas().length,8);for(const area of pack.listAreas()){assert.equal(pack.getArea(area.key).levels.length,5);for(const level of ['EE','AE','ME','BE','WB']){const cell=pack.getLevel(area.key,level);assert.equal(cell.official.sourceAuthority,'official');assert.equal(cell.plainExplanation.interpretiveSourceId,'cam-primary-ms1-interpretive');assert.equal(cell.teacherMakesFinalDecision,true);}}});
test('comparison and optional subject overlay remain reachable',()=>{const pack=createMs1GuidancePack();assert.equal(pack.compare('academic-achievement','ME').previous.code,'AE');assert.ok(pack.getSubjectExample('academic-achievement','ME','science'));assert.equal(pack.getSubjectExample('academic-achievement','ME','art'),null);});
test('integration path contains no native click/write or sensitive persistence',()=>{const files=['../../extension/src/features/teacher-support/controller/support-controller.js','../../extension/src/platform/powerteacher/teacher-ui-adapter.js','../../extension/src/features/teacher-support/ui/bubble-ui.js'];const src=files.map(x=>fs.readFileSync(path.join(__dirname,x),'utf8')).join('\n');assert.doesNotMatch(src,/\.click\s*\(|dispatchEvent\s*\(|localStorage|sessionStorage|document\.cookie/);});

test('route change invalidates stale task guidance before re-reading DOM',()=>{
  let current=ready(),shown=[],handlers={};
  const root={location:{origin:'https://vas.powerschool.com',pathname:'/teachers/index.html'},addEventListener:(t,h)=>{handlers[t]=h;},removeEventListener(){}};
  const host={addEventListener(){},removeEventListener(){}};
  const view={mount:()=>host,replaceBars:x=>{shown=x;},highlight(){},collapse(){},wake(){},destroy(){}};
  const registry=createWorkflowRegistry();
  registry.register({...CAM_PRIMARY_MS1_WORKFLOW,applicability:matchesCamPrimaryMs1,resolveSubjectKey:resolveSupportedSubjectKey});
  const pack=createMs1GuidancePack(),packs={get:id=>id==='cam-primary.ms1'?pack:null};
  const controller=createSupportController({registry,resolveState:resolveSupportState,ui:view});
  const runtime=createTeacherSupportRuntime({root,documentLike:{querySelector:()=>null},contextParser:{parseLocation:()=>({platform:'powerteacher',platformVerified:true})},readUiState:()=>current,uiContract:{items:{gradingNavigation:{selector:'#g'},standardsNavigation:{selector:'#s'},standardsGear:{selector:'#gear'},filterToggle:{selector:'#toggle'},filterInput:{selector:'#filter'}}},workflowRegistry:registry,packRegistry:packs,controller,ui:view});
  runtime.start(); runtime.handleAction('workflow:cam-primary.ms1');
  assert.ok(shown.some(x=>x.id==='area:academic-achievement'));
  handlers.hashchange();
  assert.ok(shown.some(x=>x.id==='checking'));
  assert.equal(shown.some(x=>String(x.id||'').startsWith('area:')),false);
  current=ui({targetView:'other'});
  runtime.handleAction('continue');
  assert.ok(shown.some(x=>x.id==='instruction'));
});
