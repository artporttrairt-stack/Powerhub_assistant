(function (root) {
  "use strict";

  const hub = root.PSQM ??= {};
  if (hub.guideRegistry) return;

  // These references identify sections of the supplied brief, not invented SOP rule IDs.
  hub.guideSources = Object.freeze({
    "BRIEF-23": { title: "Supplied upgrade specification — section 23: Newsfeed", status: "user-supplied-brief", schoolSourceVerified: false, url: null },
    "BRIEF-24": { title: "Supplied upgrade specification — section 24: Parent messaging", status: "user-supplied-brief", schoolSourceVerified: false, url: null },
    "BRIEF-28": { title: "Supplied upgrade specification — section 28: Resource sharing", status: "user-supplied-brief", schoolSourceVerified: false, url: null },
    "BRIEF-32": { title: "Supplied upgrade specification — section 32: Contextual help", status: "user-supplied-brief", schoolSourceVerified: false, url: null },
    "BRIEF-36": { title: "Supplied upgrade specification — section 36: Observe-only walkthrough", status: "user-supplied-brief", schoolSourceVerified: false, url: null },
  });

  const fragments = new Map();
  const guideOrder = new WeakMap();
  const taskOrder = new WeakMap();
  let fallbackOrder = 1000000;

  function deepFreeze(value) {
    Object.values(value).forEach((child) => {
      if (child && typeof child === "object" && !Object.isFrozen(child)) deepFreeze(child);
    });
    return Object.freeze(value);
  }

  function helpTask(task) {
    const result = Object.freeze({
      id: task.id,
      contexts: Object.freeze([...task.contexts]),
      type: task.type,
      guideId: task.guideId || null,
      pointerId: task.pointerId || null,
      tipId: task.tipId || null,
      titleKey: task.titleKey,
      nativeTitle: task.nativeTitle === true,
    });
    taskOrder.set(result, Number.isInteger(task.order) ? task.order : fallbackOrder++);
    return result;
  }

  function guideDefinition(definition, order) {
    const result = { ...definition };
    guideOrder.set(result, Number.isInteger(order) ? order : fallbackOrder++);
    return result;
  }

  function pointerDefinition(definition) {
    return Object.freeze({
      id: definition.id,
      target: definition.target,
      instructionKey: definition.instructionKey,
      titleKey: definition.titleKey,
      durationMs: definition.durationMs || 1800,
      showSpotlight: definition.showSpotlight !== false,
      autoDismiss: definition.autoDismiss === true,
      steps: definition.steps ? Object.freeze(definition.steps.map(step => Object.freeze({ ...step }))) : null,
    });
  }

  function tipDefinition(definition) {
    return Object.freeze({
      id: definition.id,
      descriptionKey: definition.descriptionKey,
      youtubeUrl: definition.youtubeUrl || null,
      microGuideId: definition.microGuideId || null,
      pointerId: definition.pointerId || null,
    });
  }

  function publish() {
    const guides = {};
    const helpTasks = [];
    const pointerDefinitions = {};
    const tipDefinitions = {};
    const guideEntries = [];
    for (const fragment of fragments.values()) {
      guideEntries.push(...Object.entries(fragment.guides));
      helpTasks.push(...fragment.helpTasks);
      Object.assign(pointerDefinitions, fragment.pointerDefinitions);
      Object.assign(tipDefinitions, fragment.tipDefinitions);
    }
    guideEntries.sort((left, right) => (guideOrder.get(left[1]) || 0) - (guideOrder.get(right[1]) || 0));
    helpTasks.sort((left, right) => (taskOrder.get(left) || 0) - (taskOrder.get(right) || 0));
    for (const [id, guide] of guideEntries) guides[id] = guide;
    hub.guides = deepFreeze(guides);
    hub.helpTasks = Object.freeze(helpTasks);
    hub.pointerDefinitions = deepFreeze(pointerDefinitions);
    hub.tipDefinitions = deepFreeze(tipDefinitions);
  }

  function assertNoCollisions(namespace, fragment) {
    const existingTaskIds = new Set(hub.helpTasks.map((task) => task.id));
    for (const id of Object.keys(fragment.guides)) {
      if (Object.hasOwn(hub.guides, id)) throw new Error(`Duplicate guide id ${id} from ${namespace}.`);
    }
    for (const task of fragment.helpTasks) {
      if (existingTaskIds.has(task.id)) throw new Error(`Duplicate help task id ${task.id} from ${namespace}.`);
      existingTaskIds.add(task.id);
    }
    for (const id of Object.keys(fragment.pointerDefinitions)) {
      if (Object.hasOwn(hub.pointerDefinitions, id)) throw new Error(`Duplicate pointer id ${id} from ${namespace}.`);
    }
    for (const id of Object.keys(fragment.tipDefinitions)) {
      if (Object.hasOwn(hub.tipDefinitions, id)) throw new Error(`Duplicate tip id ${id} from ${namespace}.`);
    }
  }

  function register(namespace, definition = {}) {
    if (typeof namespace !== "string" || !namespace.trim()) throw new TypeError("Guide definition namespace is required.");
    if (fragments.has(namespace)) throw new Error(`Guide definition namespace already registered: ${namespace}.`);
    const fragment = {
      guides: { ...(definition.guides || {}) },
      helpTasks: [...(definition.helpTasks || [])],
      pointerDefinitions: { ...(definition.pointerDefinitions || {}) },
      tipDefinitions: { ...(definition.tipDefinitions || {}) },
    };
    assertNoCollisions(namespace, fragment);
    fragments.set(namespace, deepFreeze(fragment));
    publish();
    return fragments.get(namespace);
  }

  function get(id) {
    return hub.guides[id] || null;
  }

  function list() {
    return Object.freeze(Object.values(hub.guides));
  }

  function snapshot() {
    return Object.freeze({
      namespaces: Object.freeze([...fragments.keys()]),
      guides: Object.freeze(Object.keys(hub.guides)),
      helpTasks: hub.helpTasks.length,
      pointers: Object.keys(hub.pointerDefinitions).length,
      tips: Object.keys(hub.tipDefinitions).length,
    });
  }

  hub.guideRegistry = Object.freeze({
    register,
    get,
    list,
    snapshot,
    guideDefinition,
    helpTask,
    pointerDefinition,
    tipDefinition,
  });
  publish();

  if (typeof root.importScripts === "function") {
    root.importScripts(
      "../features/guidance/guides/newsfeed-guides.js",
      "../features/guidance/guides/message-guides.js",
      "../features/guidance/guides/group-chat-guides.js",
    );
  }

  if (typeof module === "object" && module.exports) {
    const exported = {};
    Object.defineProperties(exported, {
      guides: { enumerable: true, get: () => hub.guides },
      helpTasks: { enumerable: true, get: () => hub.helpTasks },
      pointerDefinitions: { enumerable: true, get: () => hub.pointerDefinitions },
      tipDefinitions: { enumerable: true, get: () => hub.tipDefinitions },
      sources: { enumerable: true, get: () => hub.guideSources },
      registry: { enumerable: true, get: () => hub.guideRegistry },
    });
    module.exports = exported;
  }
})(globalThis);
