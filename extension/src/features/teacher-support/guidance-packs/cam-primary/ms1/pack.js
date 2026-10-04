(function initCamPrimaryMs1Pack(root) {
  'use strict';

  function buildPack(matches, sourceIds) {
    return Object.freeze({
      id: 'cam-primary.ms1',
      version: '1.0.0',
      workflow: 'ms1',
      sourceIds: Object.freeze([...sourceIds]),
      applicability: matches,
    });
  }

  function createCamPrimaryMs1Pack(dependencies) {
    const deps = dependencies || {};
    const matches = deps.matches || (
      root && root.PSQM && root.PSQM.camPrimaryMs1Applicability && root.PSQM.camPrimaryMs1Applicability.matches
    );
    const sourceIds = deps.sourceIds || (
      root && root.PSQM && root.PSQM.camPrimaryMs1Sources && root.PSQM.camPrimaryMs1Sources.ids
    );
    if (typeof matches !== 'function') throw new Error('CAM Primary MS1 applicability is unavailable.');
    if (!Array.isArray(sourceIds)) throw new Error('CAM Primary MS1 source IDs are unavailable.');
    return buildPack(matches, sourceIds);
  }

  if (root && root.PSQM && root.PSQM.teacherSupportPackRegistry && root.PSQM.camPrimaryMs1Applicability && root.PSQM.camPrimaryMs1Sources) {
    const registry = root.PSQM.teacherSupportPackRegistry;
    if (!registry.get('cam-primary.ms1')) registry.register(createCamPrimaryMs1Pack());
  }

  if (typeof module !== 'undefined' && module.exports) {
    const { matchesCamPrimaryMs1 } = require('./applicability.js');
    const { CAM_PRIMARY_MS1_SOURCE_IDS } = require('./sources.js');
    module.exports = {
      createCamPrimaryMs1Pack: () => createCamPrimaryMs1Pack({
        matches: matchesCamPrimaryMs1,
        sourceIds: CAM_PRIMARY_MS1_SOURCE_IDS,
      }),
    };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
