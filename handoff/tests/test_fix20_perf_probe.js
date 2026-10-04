#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const runtimePath = path.join(root, "src/core/runtime/content-runtime.js");
const source = fs.readFileSync(runtimePath, "utf8");

const startMarker = "  const PERF_MODULE_WARN_MS = 8;";
const endMarker = "  function scheduleScan(delayMs = 250) {";
const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);
assert.ok(start >= 0 && end > start, "perf-probe block must be present in content-runtime.js");
const probeBlock = source.slice(start, end);

function createHarness({ moduleMs = {}, loggerThrows = false, blocksOtherOnboarding = false } = {}) {
  const state = { clock: 0, calls: [], warnings: [] };
  const spend = (name) => {
    state.calls.push(name);
    state.clock += Number(moduleMs[name] || 0);
  };

  const hub = {
    languageIntro: {
      reconcile() { spend("languageIntro"); },
      blocksOtherOnboarding() { state.calls.push("languageIntro.blocksOtherOnboarding"); return blocksOtherOnboarding; }
    },
    waitChatter: { reconcile() { spend("waitChatter"); } },
    messageOnboarding: { reconcile() { spend("messageOnboarding"); } },
    integrationBridge: { reconcile() { spend("integrationBridge"); } },
    sessionTimeoutKeeper: { reconcile() { spend("sessionTimeoutKeeper"); } },
    messageModeDefault: { reconcile() { spend("messageModeDefault"); } },
    newsfeedReadiness: { reconcile() { spend("newsfeedReadiness"); } },
    communicationLanguageWarning: { reconcile() { spend("communicationLanguageWarning"); } },
    walkthrough: { handleDomChange() { spend("walkthrough"); } },
    help: { handleContextChange() { spend("help"); } }
  };

  const performance = { now: () => state.clock };
  const fakeConsole = {
    warn(message) {
      if (loggerThrows) throw new Error("logger failed");
      state.warnings.push(String(message));
    }
  };

  const factory = new Function(
    "hub",
    "performance",
    "console",
    "scanCreateGroupChatDialog",
    "scanAccountNames",
    "scanClassGroupNames",
    "ensurePostTitleHelper",
    "globalScanRunning",
    `${probeBlock}\nreturn { measureModule, runGlobalDomScan, runSharedScan, PERF_MODULE_WARN_MS, PERF_SHARED_SCAN_WARN_MS };`
  );

  const api = factory(
    hub,
    performance,
    fakeConsole,
    () => spend("groupChat"),
    () => spend("accountNames"),
    () => spend("classNames"),
    () => spend("postTitleHelper"),
    false
  );

  return { api, state };
}

function testMeasureModuleSemantics() {
  const { api, state } = createHarness();
  const sentinel = { ok: true };
  const returned = api.measureModule("returnValue", () => {
    state.clock += 1;
    return sentinel;
  });
  assert.equal(returned, sentinel, "measureModule must preserve returned object identity");

  const promise = Promise.resolve("same-promise");
  const returnedPromise = api.measureModule("promiseValue", () => {
    state.clock += 1;
    return promise;
  });
  assert.equal(returnedPromise, promise, "measureModule must not await or replace a returned Promise");
  assert.notEqual(api.measureModule.constructor.name, "AsyncFunction", "measureModule must remain synchronous");

  const expectedError = new Error("expected failure");
  let actualError;
  try {
    api.measureModule("throwValue", () => {
      state.clock += 1;
      throw expectedError;
    });
  } catch (error) {
    actualError = error;
  }
  assert.equal(actualError, expectedError, "measureModule must rethrow the exact original error");
}

function testThresholdsAndLoggerIsolation() {
  const { api, state } = createHarness();
  api.measureModule("under", () => { state.clock += 7.9; });
  assert.deepEqual(state.warnings, [], "module timing below 8ms must stay quiet");

  api.measureModule("edge", () => { state.clock += 8; });
  assert.equal(state.warnings.length, 1, "module timing at 8ms must warn");
  assert.match(state.warnings[0], /^\[Hub Assistant\]\[Perf\] edge: 8\.0ms$/u);

  const isolated = createHarness({ loggerThrows: true });
  const value = isolated.api.measureModule("loggerIsolation", () => {
    isolated.state.clock += 9;
    return 42;
  });
  assert.equal(value, 42, "diagnostic logger failure must not change a successful return");

  const expectedError = new Error("module failure");
  let actualError;
  try {
    isolated.api.measureModule("loggerIsolationThrow", () => {
      isolated.state.clock += 9;
      throw expectedError;
    });
  } catch (error) {
    actualError = error;
  }
  assert.equal(actualError, expectedError, "diagnostic logger failure must not replace module exception");
}

function testSharedScanOrderAndSyncExecution() {
  const { api, state } = createHarness();
  const result = api.runSharedScan();
  assert.equal(result, undefined, "normal shared scan return stays undefined");
  assert.notEqual(api.runSharedScan.constructor.name, "AsyncFunction", "runSharedScan must remain synchronous");
  assert.deepEqual(state.calls, [
    "languageIntro",
    "languageIntro.blocksOtherOnboarding",
    "waitChatter",
    "messageOnboarding",
    "integrationBridge",
    "sessionTimeoutKeeper",
    "groupChat",
    "accountNames",
    "classNames",
    "postTitleHelper",
    "messageModeDefault",
    "newsfeedReadiness",
    "communicationLanguageWarning",
    "walkthrough",
    "help"
  ], "instrumentation must preserve normal-path call order");
}

function testBlockedOnboardingOrder() {
  const { api, state } = createHarness({ blocksOtherOnboarding: true });
  const result = api.runSharedScan();
  assert.equal(result, undefined, "blocked onboarding early return stays undefined");
  assert.deepEqual(state.calls, [
    "languageIntro",
    "languageIntro.blocksOtherOnboarding",
    "waitChatter",
    "messageOnboarding",
    "communicationLanguageWarning"
  ], "instrumentation must preserve blocked-onboarding early-return path");
}

function testFullScanThresholdWithSmallModules() {
  const names = [
    "languageIntro", "waitChatter", "messageOnboarding", "integrationBridge",
    "sessionTimeoutKeeper", "groupChat", "accountNames", "classNames",
    "postTitleHelper", "messageModeDefault", "newsfeedReadiness",
    "communicationLanguageWarning", "walkthrough", "help"
  ];
  const moduleMs = Object.fromEntries(names.map((name) => [name, 1.2]));
  const { api, state } = createHarness({ moduleMs });
  api.runSharedScan();

  const fullWarnings = state.warnings.filter((line) => line.includes("Full scan"));
  const leafWarnings = state.warnings.filter((line) => !line.includes("Full scan"));
  assert.equal(fullWarnings.length, 1, "aggregate synchronous scan >=16ms must warn once");
  assert.equal(leafWarnings.length, 0, "individual modules below 8ms must remain quiet");
}

function testModuleWarningAndExceptionPropagation() {
  const { api, state } = createHarness({ moduleMs: { accountNames: 8 } });
  api.runSharedScan();
  assert.ok(state.warnings.some((line) => line.includes("accountNames: 8.0ms")), "heavy accountNames module must be identified");

  const failing = createHarness();
  const expectedError = new Error("account scan failed");
  const original = failing.api.runGlobalDomScan;
  // Validate shared-scan wrapper exception behavior directly through measureModule;
  // runGlobalDomScan itself is also protected by its existing try/finally state reset.
  let actualError;
  try {
    failing.api.measureModule("failingModule", () => { throw expectedError; });
  } catch (error) {
    actualError = error;
  }
  assert.equal(actualError, expectedError, "wrapped module exception identity must be preserved");
  assert.equal(typeof original, "function");
}

function testObserverAndSchedulerRemainUnchanged() {
  assert.ok(source.includes("function scheduleScan(delayMs = 250)"), "250ms debounce default must remain unchanged");
  assert.ok(source.includes('attributeFilter: ["hidden", "aria-expanded", "class", "style"]'), "observer attribute filter must remain unchanged");
  assert.ok(source.includes("new MutationObserver(records =>"), "shared MutationObserver architecture must remain present");
  assert.ok(!probeBlock.includes("await "), "perf probe must not add await to shared scan block");
  assert.ok(!probeBlock.includes("async function runSharedScan"), "runSharedScan must not become async");
  assert.ok(!probeBlock.includes("isScanning") && !probeBlock.includes("rerunRequested"), "prototype must not add a global single-flight guard");
}

const tests = [
  testMeasureModuleSemantics,
  testThresholdsAndLoggerIsolation,
  testSharedScanOrderAndSyncExecution,
  testBlockedOnboardingOrder,
  testFullScanThresholdWithSmallModules,
  testModuleWarningAndExceptionPropagation,
  testObserverAndSchedulerRemainUnchanged
];

for (const test of tests) {
  test();
  process.stdout.write(`PASS ${test.name}\n`);
}
process.stdout.write(`PASS ${tests.length}/${tests.length} FIX20 perf-probe tests\n`);
