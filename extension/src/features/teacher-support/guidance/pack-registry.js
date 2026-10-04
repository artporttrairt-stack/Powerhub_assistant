(function initTeacherSupportPackRegistry(root) {
  'use strict';

  function freezePack(pack) {
    return Object.freeze({
      id: pack.id,
      version: pack.version,
      workflow: pack.workflow,
      sourceIds: Object.freeze([...(pack.sourceIds || [])]),
      applicability: pack.applicability,
    });
  }

  function createPackRegistry() {
    const packs = new Map();

    function register(pack) {
      if (!pack || typeof pack.id !== 'string' || !pack.id.trim()) {
        throw new TypeError('Pack id is required.');
      }
      if (packs.has(pack.id)) {
        throw new Error(`Duplicate pack id: ${pack.id}`);
      }
      const stored = freezePack(pack);
      packs.set(stored.id, stored);
      return stored;
    }

    function get(id) {
      return packs.get(id) || null;
    }

    function list() {
      return Object.freeze([...packs.values()]);
    }

    function select(context) {
      const matches = [];
      for (const pack of packs.values()) {
        const result = pack.applicability(context);
        if (result && result.matched === true) matches.push(pack);
      }
      const matchIds = Object.freeze(matches.map((pack) => pack.id));
      if (matches.length === 0) {
        return Object.freeze({ status: 'none', pack: null, matchIds });
      }
      if (matches.length > 1) {
        return Object.freeze({ status: 'ambiguous', pack: null, matchIds });
      }
      return Object.freeze({ status: 'matched', pack: matches[0], matchIds });
    }

    function snapshot() {
      return Object.freeze({ packs: list() });
    }

    return Object.freeze({ register, get, list, select, snapshot });
  }

  if (root) {
    root.PSQM = root.PSQM || {};
    if (!root.PSQM.teacherSupportPackRegistry) {
      root.PSQM.teacherSupportPackRegistry = createPackRegistry();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createPackRegistry };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
