/*
 * Read-only PowerSchool adaptation of the attached PowerHub DOM Inspector.
 * This is a function for an approved browser evaluator, NOT a script loader.
 * The body was used for the later live captures on 2026-09-12.
 * No DOM writes, page globals, network requests, listeners or storage access.
 * Descriptive selectors are not guaranteed unique or directly replayable.
 * Output is reduced, not a general-purpose anonymization guarantee: review
 * site-defined navigation labels and attribute-derived identifiers before sharing.
 */
module.exports = (options = {}) => {
  if (location.hostname !== 'vas.educator.powerschool.com') return {blocked:'outside-requested-host'};
  const roots=[{node:document,path:'document'}];
  for(let i=0;i<roots.length&&i<12;i++) for(const el of roots[i].node.querySelectorAll('*')) {
    if(el.shadowRoot && (i>0||el.closest('dynamic-component'))) roots.push({node:el.shadowRoot,path:roots[i].path+' > '+el.tagName.toLowerCase()+'::shadow'});
  }
  const select = s => roots.flatMap(root=>[...root.node.querySelectorAll(s)]);
  const safeId = s => (s||'').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,'{id}').replace(/\b[0-9A-HJKMNP-TV-Z]{26}\b/g,'{id}');
  const selector = el => el.id?'#'+safeId(el.id):el.tagName.toLowerCase()+(el.getAttribute('role')?'[role="'+el.getAttribute('role')+'"]':'')+[...el.classList].slice(0,2).map(c=>'.'+safeId(c)).join('');
  const rendered = el => {const r=el.getBoundingClientRect(),s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0'&&r.width>0&&r.height>0;};
  const serialize = el => {const r=el.getBoundingClientRect();return {tag:el.tagName.toLowerCase(),selector:selector(el),role:el.getAttribute('role'),type:el.getAttribute('type'),rendered:rendered(el),inViewport:r.bottom>0&&r.right>0&&r.top<innerHeight&&r.left<innerWidth,childCount:el.children.length,rect:{x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)}};};
  const tree = (el,depth=2) => ({...serialize(el),children:depth?[...el.children].filter(c=>!['SCRIPT','STYLE','SVG'].includes(c.tagName)).slice(0,20).map(c=>tree(c,depth-1)):[]});
  const all=select('*'),controls=select('button,input,select,textarea,[contenteditable="true"],[role="combobox"],[role="tab"]').filter(rendered),images=select('img');
  const duplicates=[];for(const root of roots){const ids=new Map();for(const el of root.node.querySelectorAll('[id]'))ids.set(el.id,(ids.get(el.id)||0)+1);for(const[id,n]of ids)if(n>1)duplicates.push({id:safeId(id),count:n,root:root.path});}
  const root=select(options.root||'main')[0]||document.body;
  return {
    surface:options.name,url:location.origin+location.pathname,title:document.title,
    viewport:{width:innerWidth,height:innerHeight},lang:document.documentElement.lang,
    elementCount:all.length,domRoots:roots.map(r=>({path:r.path,elements:r.node.querySelectorAll('*').length})),
    customTags:[...new Set(all.map(e=>e.tagName.toLowerCase()).filter(t=>t.includes('-')))],
    navigation:[...document.querySelectorAll('nav a,[role="navigation"] a')].map(a=>({selector:selector(a),label:a.getAttribute('aria-label')||a.textContent.trim(),path:(a.getAttribute('href')||'').split('?')[0]})),
    tree:tree(root),controls:controls.slice(0,90).map(serialize),
    entries:(options.selectors||[]).map(s=>({selector:s,matches:select(s).length,elements:select(s).slice(0,8).map(serialize)})),
    assets:{scripts:select('script[src]').map(e=>e.src.split('?')[0]),styles:select('link[rel="stylesheet"]').map(e=>e.href.split('?')[0])},
    audit:{hasMain:select('main,[role="main"]').length>0,hasNavigation:select('nav,[role="navigation"]').length>0,hasTitle:!!document.title,hasViewport:!!document.querySelector('meta[name="viewport"]'),images:images.length,imagesMissingAltAttribute:images.filter(e=>!e.hasAttribute('alt')).length,emptyAltImages:images.filter(e=>e.hasAttribute('alt')&&!e.alt).length,duplicateIds:duplicates,visibleEmptyHeadings:select('h1,h2,h3,h4,h5,h6').filter(e=>rendered(e)&&!e.textContent.trim()).length,sharePointWebParts:select('[data-sp-feature-tag*="webPart"]').length},
    limits:{maxControls:90,maxChildren:20,treeDepth:2,personalText:'omitted',formValues:'omitted',renderedDoesNotProveClickable:true,shadowScope:'open roots hosted by dynamic-component',iframeBodies:'not traversed'}
  };
};
