'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || process.cwd());
const modulePath = path.join(root, 'sis/src/sis-vietnamese-name-display.js');
const bootstrapPath = path.join(root, 'sis/src/powerteacher-standalone-bootstrap.js');
const launcherPath = path.join(root, 'sis/src/powerteacher-assistant-launcher.js');
const manifestPath = path.join(root, 'manifest.json');
const onboardingPolicyPath = path.join(root, 'sis/src/onboarding-policy.js');
const contentPath = path.join(root, 'sis/src/content.js');

const nameDisplay = require(modulePath);
const bootstrapModule = require(bootstrapPath);
const launcherModule = require(launcherPath);


function makeMemoryStorage(initial = {}) {
  const state = { ...initial };
  return {
    state,
    get(keys, callback) {
      const list = Array.isArray(keys) ? keys : [keys];
      const result = {};
      for (const key of list) {
        if (Object.prototype.hasOwnProperty.call(state, key)) result[key] = state[key];
      }
      callback(result);
    },
    set(values, callback) {
      Object.assign(state, values || {});
      callback?.();
    },
    remove(keys, callback) {
      for (const key of Array.isArray(keys) ? keys : [keys]) delete state[key];
      callback?.();
    },
  };
}



async function testLateOptInStorageChangeStartsDisplayOnAlreadyLoadedPage() {
  let initCalls = 0;
  let listener = null;
  const storageChanges = {
    addListener(fn) { listener = fn; },
  };
  const stop = bootstrapModule.watchNameDisplayActivation({
    location: { origin: 'https://vas.powerschool.com' },
    storageChanges,
    vietnameseNameDisplay: { init: async () => { initCalls += 1; } },
  });

  assert.strictEqual(typeof listener, 'function', 'SIS page must subscribe before the persisted opt-in can arrive');
  const storage = makeMemoryStorage();
  assert.strictEqual(await bootstrapModule.resumeNameDisplayForPage({
    location: { origin: 'https://vas.powerschool.com' },
    storage,
    vietnameseNameDisplay: { init: async () => { initCalls += 1; } },
  }), false, 'new page may initially read opt-in=false before the previous page commit lands');
  assert.strictEqual(initCalls, 0);
  listener({
    [bootstrapModule.NAME_DISPLAY_ENABLED_KEY]: { oldValue: undefined, newValue: true },
  }, 'local');
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.strictEqual(initCalls, 1, 'late opt-in commit must wake the already-loaded SIS page');
  stop?.();
}

async function testActivationRejectsStorageRuntimeError() {
  let initCalls = 0;
  const activation = bootstrapModule.createNameDisplayActivation({
    vietnameseNameDisplay: { init: async () => { initCalls += 1; } },
  });
  const previousChrome = global.chrome;
  global.chrome = { runtime: { lastError: null } };
  const storage = {
    set(values, callback) {
      global.chrome.runtime.lastError = { message: 'simulated storage failure' };
      callback?.();
      global.chrome.runtime.lastError = null;
    },
  };
  try {
    assert.strictEqual(await activation.activate(storage), false,
      'activation must fail closed when chrome.storage reports runtime.lastError');
    assert.strictEqual(initCalls, 0,
      'non-persistent opt-in must never create a page-local engine that dies after reload');
  } finally {
    global.chrome = previousChrome;
  }
}

async function testActivationRequiresPersistentStorage() {
  let initCalls = 0;
  const activation = bootstrapModule.createNameDisplayActivation({
    vietnameseNameDisplay: { init: async () => { initCalls += 1; } },
  });
  assert.strictEqual(await activation.activate(null), false, 'activation must fail closed when persistence is unavailable');
  assert.strictEqual(initCalls, 0, 'non-persistent activation must not create a page-local false success');
}

async function testActivationPersistsAndResumesAcrossPageLoads() {
  const storage = makeMemoryStorage();
  let firstInitCalls = 0;
  const firstActivation = bootstrapModule.createNameDisplayActivation({
    vietnameseNameDisplay: { init: async () => { firstInitCalls += 1; } },
  });

  assert.strictEqual(await firstActivation.resume(storage), false, 'display must remain dormant before opt-in');
  assert.strictEqual(firstInitCalls, 0);
  assert.strictEqual(await firstActivation.activate(storage), true);
  assert.strictEqual(firstInitCalls, 1);
  assert.strictEqual(storage.state[bootstrapModule.NAME_DISPLAY_ENABLED_KEY], true, 'opt-in must survive page navigation');

  let secondInitCalls = 0;
  const secondActivation = bootstrapModule.createNameDisplayActivation({
    vietnameseNameDisplay: { init: async () => { secondInitCalls += 1; } },
  });
  assert.strictEqual(await secondActivation.resume(storage), true, 'next SIS page must resume the opted-in display engine');
  assert.strictEqual(secondInitCalls, 1);
}


async function testEnabledDisplayResumesOnNonStartSisPage() {
  const storage = makeMemoryStorage({
    [bootstrapModule.NAME_DISPLAY_ENABLED_KEY]: true,
    sisPrototypePtpStudentNameNaturalOrderRequested: true,
  });
  let initCalls = 0;
  const result = await bootstrapModule.resumeNameDisplayForPage({
    location: {
      origin: 'https://vas.powerschool.com',
      pathname: '/teachers/teacherpages/another.html',
    },
    storage,
    vietnameseNameDisplay: { init: async () => { initCalls += 1; } },
  });
  assert.strictEqual(result, true);
  assert.strictEqual(initCalls, 1, 'enabled name display must resume outside /teachers/index.html');
  assert.ok(!Object.prototype.hasOwnProperty.call(
    storage.state,
    'sisPrototypePtpStudentNameNaturalOrderRequested'
  ), 'legacy opt-in state must be removed before resuming');
}

async function testInactiveLegacyNameStateIsPurgedAndWalkthroughHandoffRemainsActive() {
  const legacyState = Object.fromEntries(
    bootstrapModule.LEGACY_NAME_STORAGE_KEYS.map((key) => [key, true])
  );
  const storage = makeMemoryStorage({ ...legacyState, unrelated: 42 });
  const activation = bootstrapModule.createNameDisplayActivation({
    vietnameseNameDisplay: { init: async () => {} },
  });
  await activation.cleanupLegacy(storage);
  for (const key of bootstrapModule.LEGACY_NAME_STORAGE_KEYS) {
    assert.ok(!Object.prototype.hasOwnProperty.call(storage.state, key), `legacy key remains: ${key}`);
  }
  assert.strictEqual(storage.state.unrelated, 42);

  const policySource = fs.readFileSync(onboardingPolicyPath, 'utf8');
  const contentSource = fs.readFileSync(contentPath, 'utf8');
  assert.ok(policySource.includes('displaySettingsOnboardingPending'), 'first-time display-settings handoff key must be active again');
  assert.ok(contentSource.includes('persistDisplaySettingsOnboardingPending'), 'grade-entry handoff must persist the restored walkthrough request');
}



async function testEngineStaysAliveUntilSectionContextAppears() {
  let currentUrl = 'https://vas.powerschool.com/teachers/index.html';
  let intervalCallback = null;
  let fetchCalls = 0;
  let applied = 0;
  const env = {
    getUrl: () => currentUrl,
    fetchRoster: async () => {
      fetchCalls += 1;
      return [{ firstname: 'Bao', middlename: 'Anh Ngoc', lastname: 'Nguyen', lastfirst: 'Nguyen, Anh Ngoc Bao' }];
    },
    applyMap: () => { applied += 1; },
    startObserver: () => () => {},
    setInterval: (fn) => { intervalCallback = fn; return 1; },
    clearInterval: () => {},
    addWindowListener: () => {},
    removeWindowListener: () => {},
    createAbortController: () => new AbortController(),
    log: () => {},
    warn: () => {},
  };

  const runtime = nameDisplay.createRuntime(env);
  await runtime.init();
  assert.strictEqual(fetchCalls, 0, 'engine should wait rather than die when the activation page has no sectionId');
  currentUrl = 'https://vas.powerschool.com/teachers/index.html?sectionId=456';
  intervalCallback();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.strictEqual(fetchCalls, 1, 'live engine must detect a later sectionId in the same document');
  assert.strictEqual(applied, 1);
  runtime.destroy();
}

function testNoDeferredNameMessagingInActiveSisSource() {
  const sourceDir = path.join(root, 'sis/src');
  const forbidden = [
    'naturalOrderDeferred',
    'future version',
    'phiên bản sau',
    'sẽ có đổi tên',
  ];
  for (const file of fs.readdirSync(sourceDir).filter(name => name.endsWith('.js'))) {
    const source = fs.readFileSync(path.join(sourceDir, file), 'utf8').toLowerCase();
    for (const phrase of forbidden) {
      assert.ok(!source.includes(phrase.toLowerCase()), `deferred-name messaging remains active in ${file}: ${phrase}`);
    }
  }
}

async function testFormatting() {
  assert.strictEqual(
    nameDisplay.buildVietnameseDisplayName({ lastname: 'Nguyen', middlename: 'Anh Ngoc', firstname: 'Bao' }),
    'Nguyen Anh Ngoc Bao'
  );

  const map = nameDisplay.buildNameMap([
    { firstname: 'An', middlename: '', lastname: 'Nguyen', lastfirst: 'Nguyen, An' },
    { firstname: 'Van', middlename: 'An', lastname: 'Nguyen', lastfirst: 'Nguyen, An Van' },
  ]);
  assert.strictEqual(map.get('Nguyen, An Van'), 'Nguyen An Van');
  assert.strictEqual(map.get('Van An Nguyen'), 'Nguyen An Van');
  assert.strictEqual(nameDisplay.transformText('Van An Nguyen', map), 'Nguyen An Van');
}

async function testRetryAfterTemporaryRosterFailure() {
  let fetchCalls = 0;
  let intervalCallback = null;
  let applied = 0;
  const env = {
    getUrl: () => 'https://vas.powerschool.com/teachers/index.html?sectionId=123',
    fetchRoster: async () => {
      fetchCalls += 1;
      if (fetchCalls === 1) throw new Error('temporary');
      return [{ firstname: 'Bao', middlename: 'Anh Ngoc', lastname: 'Nguyen', lastfirst: 'Nguyen, Anh Ngoc Bao' }];
    },
    applyMap: () => { applied += 1; },
    startObserver: () => () => {},
    setInterval: (fn) => { intervalCallback = fn; return 1; },
    clearInterval: () => {},
    addWindowListener: () => {},
    removeWindowListener: () => {},
    createAbortController: () => new AbortController(),
    log: () => {},
    warn: () => {},
  };

  const runtime = nameDisplay.createRuntime(env);
  await runtime.init();
  assert.strictEqual(fetchCalls, 1);
  assert.strictEqual(applied, 0);
  intervalCallback();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.strictEqual(fetchCalls, 2);
  assert.strictEqual(applied, 1);
  runtime.destroy();
}



async function testRosterRecoveryContinuesAfterFastRetryBudget() {
  let now = 0;
  let fetchCalls = 0;
  let intervalCallback = null;
  let applied = 0;
  const env = {
    getUrl: () => 'https://vas.powerschool.com/teachers/index.html?sectionId=123',
    fetchRoster: async () => {
      fetchCalls += 1;
      if (fetchCalls <= 5) throw new Error(`temporary-${fetchCalls}`);
      return [{ firstname: 'Bao', middlename: 'Anh Ngoc', lastname: 'Nguyen', lastfirst: 'Nguyen, Anh Ngoc Bao' }];
    },
    applyMap: () => { applied += 1; },
    startObserver: () => () => {},
    setInterval: (fn) => { intervalCallback = fn; return 1; },
    clearInterval: () => {},
    addWindowListener: () => {},
    removeWindowListener: () => {},
    createAbortController: () => new AbortController(),
    now: () => now,
    log: () => {},
    warn: () => {},
  };

  const runtime = nameDisplay.createRuntime(env);
  await runtime.init();
  for (let i = 0; i < 3; i += 1) {
    intervalCallback();
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  assert.strictEqual(fetchCalls, 4, 'engine should use the fast retry budget first');

  for (let i = 0; i < 3; i += 1) {
    intervalCallback();
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  assert.strictEqual(fetchCalls, 4, 'after the fast retry budget the engine should cool down instead of hammering the roster API');

  now = 30000;
  intervalCallback();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.strictEqual(fetchCalls, 5, 'engine must retry again after cooldown instead of becoming permanently dormant');

  now = 60000;
  intervalCallback();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.strictEqual(fetchCalls, 6, 'engine must keep periodic recovery attempts until the roster API returns');
  assert.strictEqual(applied, 1, 'a later successful roster response must reactivate visible-name rewriting');
  runtime.destroy();
}

async function testClickGatedActivation() {
  let activation = null;
  let initCalls = 0;
  const assistant = {
    install({ onStudentNameSetup }) { activation = onStudentNameSetup; return 'INSTALLED'; },
    reconcile() { return 'READY'; },
    remove() {},
    open() { return true; },
  };
  const lifecycle = {
    start() { return true; },
    subscribe() { return () => {}; },
    stop() {},
  };
  const bootstrap = bootstrapModule.createBootstrap({
    surface: { matchesLocation: () => true },
    localeApi: { resolve: () => 'vi' },
    assistant,
    lifecycle,
    vietnameseNameDisplay: { init: async () => { initCalls += 1; } },
  });

  const storage = makeMemoryStorage({ sisPowerTeacherFirstMiddleLastSavedV1: true });
  const result = await bootstrap.initialize({
    document: {},
    location: { origin: 'https://vas.powerschool.com', pathname: '/teachers/index.html', hash: '' },
    storage,
    windowLike: {},
  });
  assert.strictEqual(result, 'READY');
  assert.strictEqual(initCalls, 0, 'name module must not auto-start during bootstrap');
  assert.strictEqual(typeof activation, 'function');
  assert.strictEqual(activation(), true);
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.strictEqual(initCalls, 1, 'name module must start only after the user action');
  assert.strictEqual(storage.state[bootstrapModule.NAME_DISPLAY_ENABLED_KEY], true, 'user action must persist before activation');
}

async function testFirstTimeGradeEntryPendingStartsRestoredWalkthrough() {
  let walkthroughStarts = 0;
  let initCalls = 0;
  const displayOnboarding = {
    start() { walkthroughStarts += 1; return 'SETTINGS'; },
    reconcile() { return 'INACTIVE'; },
    restoreSaveHandoff() { return 'UNAVAILABLE'; },
    stop() {},
  };
  const lifecycle = { start() { return true; }, subscribe() { return () => {}; }, stop() {} };
  const assistant = { install() { return 'INSTALLED'; }, reconcile() { return 'READY'; }, remove() {}, open() { return true; } };
  const bootstrap = bootstrapModule.createBootstrap({
    surface: { matchesLocation: () => true },
    localeApi: { resolve: () => 'en' },
    assistant,
    displayOnboarding,
    lifecycle,
    vietnameseNameDisplay: { init: async () => { initCalls += 1; } },
  });
  const storage = makeMemoryStorage({
    sisPrototypeDisplaySettingsOnboardingPending: true,
  });
  await bootstrap.initialize({
    document: {},
    location: { origin: 'https://vas.powerschool.com', pathname: '/teachers/index.html', hash: '' },
    storage,
    windowLike: {},
  });
  assert.strictEqual(walkthroughStarts, 1, 'first-time grade-entry handoff must auto-start the restored walkthrough');
  assert.strictEqual(initCalls, 0, 'first-time walkthrough must not bypass the native prerequisite');
  assert.ok(!Object.prototype.hasOwnProperty.call(storage.state, 'sisPrototypeDisplaySettingsOnboardingPending'), 'pending handoff must be consumed once');
}

async function testActivationIsGatedBySavedFirstMiddleLast() {
  let action = null;
  let ready = null;
  let walkthroughStarts = 0;
  let panelOpens = 0;
  let initCalls = 0;
  const assistant = {
    install({ onStudentNameSetup }) { action = onStudentNameSetup; return 'INSTALLED'; },
    reconcile() { return 'READY'; },
    remove() {},
    open() { panelOpens += 1; return true; },
  };
  const displayOnboarding = {
    start({ onPrerequisiteReady }) {
      walkthroughStarts += 1;
      ready = onPrerequisiteReady;
      return 'SETTINGS';
    },
    reconcile() { return 'INACTIVE'; },
    restoreSaveHandoff() { return 'UNAVAILABLE'; },
    stop() {},
  };
  const preferenceApi = {
    async readPrerequisiteConfirmed(storage) {
      return storage.state.sisPowerTeacherFirstMiddleLastSavedV1 === true;
    },
    async readSaveHandoff() { return null; },
    async clearSaveHandoff() { return true; },
  };
  const lifecycle = {
    start() { return true; },
    subscribe() { return () => {}; },
    stop() {},
  };
  const bootstrap = bootstrapModule.createBootstrap({
    surface: { matchesLocation: () => true },
    localeApi: { resolve: () => 'en' },
    assistant,
    displayOnboarding,
    preferenceApi,
    lifecycle,
    vietnameseNameDisplay: { init: async () => { initCalls += 1; } },
  });
  const storage = makeMemoryStorage();
  await bootstrap.initialize({
    document: {},
    location: { origin: 'https://vas.powerschool.com', pathname: '/teachers/index.html', hash: '' },
    storage,
    windowLike: {},
  });

  assert.strictEqual(action(), true);
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.strictEqual(walkthroughStarts, 1, 'missing prerequisite must start the restored walkthrough');
  assert.strictEqual(initCalls, 0, 'name engine must remain dormant before First Middle Last is saved');
  assert.strictEqual(storage.state[bootstrapModule.NAME_DISPLAY_ENABLED_KEY], undefined, 'failed prerequisite must not persist opt-in');

  ready();
  assert.strictEqual(panelOpens, 1, 'finishing the prerequisite must return to the existing PowerTeacher Assistant panel');

  storage.state.sisPowerTeacherFirstMiddleLastSavedV1 = true;
  assert.strictEqual(action(), true);
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.strictEqual(initCalls, 1, 'saved First Middle Last prerequisite must allow the current SIS name engine');
  assert.strictEqual(storage.state[bootstrapModule.NAME_DISPLAY_ENABLED_KEY], true);
}


async function testActivationRequiresPersistedReadBackBeforeInit() {
  let initCalls = 0;
  const activation = bootstrapModule.createNameDisplayActivation({
    vietnameseNameDisplay: { init: async () => { initCalls += 1; } },
  });
  const storage = {
    set(values, callback) { callback?.(); },
    get(keys, callback) {
      callback({ [bootstrapModule.NAME_DISPLAY_ENABLED_KEY]: false });
    },
  };

  assert.strictEqual(await activation.activate(storage), false,
    'activation must verify the persisted opt-in by reading it back before init');
  assert.strictEqual(initCalls, 0,
    'read-back mismatch must not create a page-local engine that can disappear after reload');
}

async function testRuntimeInitRetriesAfterSetupFailure() {
  let observerStarts = 0;
  let intervalStarts = 0;
  let listenerAdds = 0;
  const env = {
    getUrl: () => 'https://vas.powerschool.com/teachers/index.html',
    fetchRoster: async () => [],
    applyMap: () => {},
    startObserver: () => {
      observerStarts += 1;
      if (observerStarts === 1) throw new Error('simulated observer setup failure');
      return () => {};
    },
    setInterval: () => { intervalStarts += 1; return 1; },
    clearInterval: () => {},
    addWindowListener: () => { listenerAdds += 1; },
    removeWindowListener: () => {},
    createAbortController: () => new AbortController(),
    log: () => {},
    warn: () => {},
  };

  const runtime = nameDisplay.createRuntime(env);
  await assert.rejects(runtime.init(), /simulated observer setup failure/,
    'first setup failure must surface to the caller');
  await runtime.init();
  assert.strictEqual(observerStarts, 2,
    'a failed initialization must not poison the runtime; the next init must retry setup');
  assert.strictEqual(intervalStarts, 1,
    'the successful retry must install exactly one navigation interval');
  assert.strictEqual(listenerAdds, 4,
    'the successful retry must install one copy of each runtime listener');
  runtime.destroy();
}

async function testLivenessGuardIsSparseAndCoalescesRecovery() {
  assert.ok(bootstrapModule.LIVENESS_HEALTH_INTERVAL_MS >= 60000,
    'liveness watchdog must remain sparse and never become a fast poll');

  let storageListener = null;
  const storageChanges = {
    addListener(fn) { storageListener = fn; },
    removeListener() {},
  };
  const pageListeners = new Map();
  let intervalCallback = null;
  let intervalMs = null;
  let clearedIntervals = 0;
  const windowLike = {
    addEventListener(type, fn) { pageListeners.set(type, fn); },
    removeEventListener(type) { pageListeners.delete(type); },
    setInterval(fn, ms) { intervalCallback = fn; intervalMs = ms; return 7; },
    clearInterval() { clearedIntervals += 1; },
  };
  const storage = makeMemoryStorage({
    [bootstrapModule.NAME_DISPLAY_ENABLED_KEY]: true,
  });

  let initCalls = 0;
  let releaseInit = null;
  const firstInit = new Promise(resolve => { releaseInit = resolve; });
  const vietnameseNameDisplay = {
    init() {
      initCalls += 1;
      return initCalls === 1 ? firstInit : Promise.resolve();
    },
  };

  const stop = await bootstrapModule.startNameDisplayLivenessGuard({
    location: { origin: 'https://vas.powerschool.com' },
    storage,
    storageChanges,
    windowLike,
    vietnameseNameDisplay,
  });

  assert.strictEqual(typeof stop, 'function');
  assert.strictEqual(typeof storageListener, 'function');
  assert.strictEqual(intervalMs, bootstrapModule.LIVENESS_HEALTH_INTERVAL_MS,
    'enabled liveness guard must use only the sparse watchdog interval');
  assert.strictEqual(pageListeners.has('pageshow'), true,
    'pageshow must be able to revive an opted-in module after browser lifecycle restoration');
  assert.strictEqual(initCalls, 1, 'initial enabled state should start one recovery attempt');

  for (let i = 0; i < 1000; i += 1) {
    pageListeners.get('pageshow')?.();
    intervalCallback?.();
    storageListener({
      [bootstrapModule.NAME_DISPLAY_ENABLED_KEY]: { oldValue: false, newValue: true },
    }, 'local');
  }
  assert.strictEqual(initCalls, 1,
    'event storms while recovery is in flight must coalesce into one init attempt');

  releaseInit();
  await new Promise(resolve => setTimeout(resolve, 0));
  intervalCallback?.();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.strictEqual(initCalls, 2,
    'a later sparse watchdog tick must be able to retry/revive the module');

  storageListener({
    [bootstrapModule.NAME_DISPLAY_ENABLED_KEY]: { oldValue: true, newValue: false },
  }, 'local');
  assert.ok(clearedIntervals >= 1, 'explicit disable must disarm the watchdog');
  stop();
}


function testPersistedPreferenceKeyRemainsUpgradeCompatible() {
  assert.strictEqual(
    bootstrapModule.NAME_DISPLAY_ENABLED_KEY,
    'sisVietnameseNameDisplayEnabledV1',
    'future builds must preserve or explicitly migrate the live-passed persisted opt-in key'
  );
}

function testManifestCleanup() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const sisEntry = manifest.content_scripts.find(entry => entry.matches.includes('https://vas.powerschool.com/*'));
  assert.ok(sisEntry);
  const js = sisEntry.js;
  const added = 'sis/src/sis-vietnamese-name-display.js';
  assert.ok(js.includes(added));
  assert.ok(js.indexOf(added) < js.indexOf('sis/src/powerteacher-standalone-bootstrap.js'));

  const restoredWalkthrough = [
    'sis/src/powerteacher-display-settings.js',
    'sis/src/student-name-preference.js',
    'sis/src/powerteacher-native-prerequisite-verifier.js',
    'sis/src/standalone-display-settings-onboarding.js',
  ];
  for (const item of restoredWalkthrough) {
    assert.ok(js.includes(item), `restored walkthrough manifest reference missing: ${item}`);
    assert.ok(fs.existsSync(path.join(root, item)), `restored walkthrough file missing: ${item}`);
  }
  const legacyEngine = [
    'sis/src/student-name-surface-registry.js',
    'sis/src/student-name-policy.js',
    'sis/src/student-name-presentation-engine.js',
    'sis/src/powerteacher-student-name-adapters.js',
    'sis/src/ptp-student-name-runtime.js',
  ];
  for (const item of legacyEngine) {
    assert.ok(!js.includes(item), `legacy engine manifest reference remains: ${item}`);
    assert.ok(!fs.existsSync(path.join(root, item)), `legacy engine file remains: ${item}`);
  }
  assert.ok(!sisEntry.css.includes('sis/src/student-name-presentation.css'));
  assert.ok(!fs.existsSync(path.join(root, 'sis/src/student-name-presentation.css')));
}

function testLauncherCopy() {
  assert.strictEqual(
    launcherModule.COPY.vi.studentNameSetup,
    'Tôi muốn đổi tên tự nhiên sang tiếng Việt'
  );
}

async function main() {
  await testFormatting();
  await testRetryAfterTemporaryRosterFailure();
  await testRosterRecoveryContinuesAfterFastRetryBudget();
  await testEngineStaysAliveUntilSectionContextAppears();
  await testClickGatedActivation();
  await testActivationIsGatedBySavedFirstMiddleLast();
  await testFirstTimeGradeEntryPendingStartsRestoredWalkthrough();
  await testLateOptInStorageChangeStartsDisplayOnAlreadyLoadedPage();
  await testActivationRejectsStorageRuntimeError();
  await testActivationRequiresPersistedReadBackBeforeInit();
  await testActivationRequiresPersistentStorage();
  await testActivationPersistsAndResumesAcrossPageLoads();
  await testInactiveLegacyNameStateIsPurgedAndWalkthroughHandoffRemainsActive();
  await testEnabledDisplayResumesOnNonStartSisPage();
  await testRuntimeInitRetriesAfterSetupFailure();
  await testLivenessGuardIsSparseAndCoalescesRecovery();
  testPersistedPreferenceKeyRemainsUpgradeCompatible();
  testManifestCleanup();
  testNoDeferredNameMessagingInActiveSisSource();
  testLauncherCopy();
  console.log('SIS Vietnamese-name merge: PASS');
}

main().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
