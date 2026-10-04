const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const MODULE_PATH = path.resolve(__dirname, '../../../extension/modules/teacher-support/core/workflow-registry.js');

function loadRegistry() {
  return require(MODULE_PATH);
}

function pack(id, workflow, matched) {
  return {
    id,
    workflow,
    availability() {
      return { matched, reason: matched ? 'available' : 'unavailable' };
    },
  };
}

test('registry rejects duplicate pack ids', () => {
  const { createWorkflowRegistry } = loadRegistry();
  const registry = createWorkflowRegistry();
  registry.register(pack('demo.one', 'one', true));
  assert.throws(() => registry.register(pack('demo.one', 'one', true)), /Duplicate pack id/);
});

test('registry returns none when no packs are available', () => {
  const { createWorkflowRegistry } = loadRegistry();
  const registry = createWorkflowRegistry();
  registry.register(pack('demo.one', 'one', false));
  assert.deepEqual(registry.select({}), { status: 'none', pack: null, matchIds: [] });
});

test('registry returns one matched pack by availability only', () => {
  const { createWorkflowRegistry } = loadRegistry();
  const registry = createWorkflowRegistry();
  const available = registry.register(pack('demo.one', 'one', true));
  const selection = registry.select({ academicEligible: false });
  assert.equal(selection.status, 'matched');
  assert.equal(selection.pack, available);
  assert.deepEqual(selection.matchIds, ['demo.one']);
});

test('registry fails closed on ambiguous availability matches', () => {
  const { createWorkflowRegistry } = loadRegistry();
  const registry = createWorkflowRegistry();
  registry.register(pack('demo.one', 'one', true));
  registry.register(pack('demo.two', 'two', true));
  const selection = registry.select({});
  assert.equal(selection.status, 'ambiguous');
  assert.equal(selection.pack, null);
  assert.deepEqual(selection.matchIds, ['demo.one', 'demo.two']);
});

test('a fake second workflow can be added without registry changes', () => {
  const { createWorkflowRegistry } = loadRegistry();
  const registry = createWorkflowRegistry();
  registry.register({
    id: 'fake.second',
    workflow: 'fake',
    availability(context) {
      return { matched: context.requestedPackId === 'fake.second', reason: 'fake' };
    },
  });
  assert.equal(registry.select({ requestedPackId: 'fake.second' }).pack.id, 'fake.second');
});

test('generic registry source contains no MS1 academic policy', () => {
  const source = fs.readFileSync(MODULE_PATH, 'utf8');
  const forbidden = ['MS1-Academic', 'Academic Achievement', 'MS1-TA-Grade', 'EE', 'AE', 'ME', 'BE', 'WB'];
  for (const token of forbidden) assert.equal(source.includes(token), false, `forbidden generic token: ${token}`);
});
