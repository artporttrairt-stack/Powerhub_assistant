'use strict';

const assert = require('assert');
const path = require('path');

const root = path.resolve(process.argv[2] || process.cwd());
const bootstrap = require(path.join(root, 'sis/src/powerteacher-standalone-bootstrap.js'));
const nameDisplay = require(path.join(root, 'sis/src/sis-vietnamese-name-display.js'));

function makeStorage(initial) {
  const state = { ...initial };
  return {
    get(keys, callback) {
      const list = Array.isArray(keys) ? keys : [keys];
      const out = {};
      for (const key of list) if (Object.prototype.hasOwnProperty.call(state, key)) out[key] = state[key];
      callback(out);
    },
    set(values, callback) { Object.assign(state, values || {}); callback?.(); },
    remove(keys, callback) {
      for (const key of Array.isArray(keys) ? keys : [keys]) delete state[key];
      callback?.();
    },
  };
}

async function testGuardEventStormBudget() {
  let storageListener = null;
  const storageChanges = {
    addListener(fn) { storageListener = fn; },
    removeListener() {},
  };
  const listeners = new Map();
  let intervalCallback = null;
  let intervalMs = null;
  let intervalsCreated = 0;
  const windowLike = {
    addEventListener(type, fn) { listeners.set(type, fn); },
    removeEventListener(type) { listeners.delete(type); },
    setInterval(fn, ms) {
      intervalsCreated += 1;
      intervalCallback = fn;
      intervalMs = ms;
      return 1;
    },
    clearInterval() {},
  };
  const storage = makeStorage({ [bootstrap.NAME_DISPLAY_ENABLED_KEY]: true });

  let initCalls = 0;
  let release = null;
  const blockedInit = new Promise(resolve => { release = resolve; });
  const runtime = {
    init() {
      initCalls += 1;
      return initCalls === 1 ? blockedInit : Promise.resolve();
    },
  };

  const stop = await bootstrap.startNameDisplayLivenessGuard({
    location: { origin: bootstrap.SIS_ORIGIN },
    storage,
    storageChanges,
    windowLike,
    vietnameseNameDisplay: runtime,
  });

  assert.ok(intervalMs >= 60000, 'watchdog must remain sparse');
  assert.strictEqual(intervalsCreated, 1, 'guard must allocate a single watchdog interval');
  assert.strictEqual(initCalls, 1, 'enabled guard starts one init attempt');

  const iterations = 10000;
  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i += 1) {
    listeners.get('pageshow')?.();
    intervalCallback?.();
    storageListener?.({
      [bootstrap.NAME_DISPLAY_ENABLED_KEY]: { oldValue: false, newValue: true },
    }, 'local');
  }
  const durationMs = Number(process.hrtime.bigint() - start) / 1e6;

  assert.strictEqual(initCalls, 1, '30k recovery triggers must coalesce while init is in flight');
  assert.strictEqual(intervalsCreated, 1, 'event storms must not allocate extra timers');
  assert.ok(durationMs < 1000, `guard trigger storm exceeded budget: ${durationMs.toFixed(2)}ms`);

  release();
  await blockedInit;
  stop();
  return { iterations, triggerCount: iterations * 3, durationMs, initCalls, intervalsCreated, intervalMs };
}

async function testRuntimeConcurrentInitBudget() {
  let observerStarts = 0;
  let intervalStarts = 0;
  let listenerAdds = 0;
  let releaseRoster = null;
  const roster = new Promise(resolve => { releaseRoster = resolve; });
  const env = {
    getUrl: () => 'https://vas.powerschool.com/teachers/index.html?sectionId=123',
    fetchRoster: async () => roster,
    applyMap: () => {},
    startObserver: () => { observerStarts += 1; return () => {}; },
    setInterval: () => { intervalStarts += 1; return 11; },
    clearInterval: () => {},
    addWindowListener: () => { listenerAdds += 1; },
    removeWindowListener: () => {},
    createAbortController: () => new AbortController(),
    log: () => {},
    warn: () => {},
  };
  const runtime = nameDisplay.createRuntime(env);
  const calls = Array.from({ length: 1000 }, () => runtime.init());
  assert.ok(calls.every(promise => promise === calls[0]), 'concurrent init calls must share one in-flight promise');
  assert.strictEqual(observerStarts, 1, 'concurrent init must install one observer');
  assert.strictEqual(intervalStarts, 1, 'concurrent init must install one navigation timer');
  assert.strictEqual(listenerAdds, 4, 'concurrent init must install one listener set');
  releaseRoster([]);
  await Promise.all(calls);
  runtime.destroy();
  return { concurrentCalls: calls.length, observerStarts, intervalStarts, listenerAdds };
}

(async () => {
  const guard = await testGuardEventStormBudget();
  const runtime = await testRuntimeConcurrentInitBudget();
  console.log(JSON.stringify({ suite: 'SIS liveness performance budget', status: 'PASS', guard, runtime }, null, 2));
})().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
