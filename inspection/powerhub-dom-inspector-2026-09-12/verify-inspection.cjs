'use strict';

// Uses the extension project's already-installed test dependency; no install.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require(path.resolve(__dirname, '../../pilot-v1.9.0/node_modules/jsdom'));
const inspect = require('./powerschool-readonly.cjs');
const evidence = JSON.parse(fs.readFileSync(path.join(__dirname, 'evidence-summary.json'), 'utf8'));

const rejected = vm.runInNewContext(`(${inspect.toString()})({})`, {
  location: { hostname: 'example.com' },
  document: new Proxy({}, { get() { throw new Error('Out-of-scope document was accessed'); } })
});
assert.equal(rejected.blocked, 'outside-requested-host');

const dom = new JSDOM(`<!doctype html><html lang="vi"><head>
  <title>Fixture</title><meta name="viewport" content="width=device-width">
  </head><body><nav><a id="post-newsfeed" href="/">Newsfeed</a></nav>
  <main id="app-shell_main-injection-point">
    <p>PRIVATE_SENTINEL_PERSON_MESSAGE</p>
    <input id="private-field" value="PRIVATE_SENTINEL_FORM_VALUE">
    <button id="shared-across-roots">Open</button>
    <button id="hidden-control" style="display:none">Hidden</button>
    <button id="duplicate">One</button><button id="duplicate">Two</button>
    <button id="recipient-result-00000000000000000000000000-button">Private</button>
    <dynamic-component><div id="module-host"></div></dynamic-component>
    <div id="extension-host"></div>
  </main></body></html>`, { url: 'https://vas.educator.powerschool.com/' });
const { window } = dom;
const shadow = window.document.querySelector('#module-host').attachShadow({ mode: 'open' });
shadow.innerHTML = '<button id="shared-across-roots">Tool</button><input id="shadow-input"><img><img alt="">';
const extensionShadow = window.document.querySelector('#extension-host').attachShadow({ mode: 'open' });
extensionShadow.innerHTML = '<button id="third-party-private-button">PRIVATE_SENTINEL_EXTENSION</button>';
window.HTMLElement.prototype.getBoundingClientRect = function () {
  return { x: 1, y: 1, left: 1, top: 1, right: 101, bottom: 21, width: 100, height: 20 };
};
const before = { html: window.document.documentElement.outerHTML, shadow: shadow.innerHTML, extension: extensionShadow.innerHTML };
const context = {
  document: window.document, location: window.location,
  getComputedStyle: window.getComputedStyle.bind(window), innerWidth: 1200, innerHeight: 800
};
const keysBefore = Object.keys(context);
const result = vm.runInNewContext(`(${inspect.toString()})({name:'synthetic-fixture', selectors:['#shadow-input', '#shared-across-roots']})`, context);
assert.equal(result.domRoots.length, 2);
assert.equal(result.entries[0].matches, 1);
assert.equal(result.entries[1].matches, 2);
assert.ok(result.audit.duplicateIds.some(x => x.id === 'duplicate' && x.count === 2));
assert.ok(!result.audit.duplicateIds.some(x => x.id === 'shared-across-roots'));
assert.equal(result.audit.imagesMissingAltAttribute, 1);
assert.equal(result.audit.emptyAltImages, 1);
assert.ok(!result.controls.some(x => x.selector === '#hidden-control'));
assert.ok(!result.controls.some(x => x.selector === '#third-party-private-button'));
assert.ok(result.controls.some(x => x.selector === '#recipient-result-{id}-button'));
assert.ok(!JSON.stringify(result).includes('PRIVATE_SENTINEL'));
assert.deepEqual(Object.keys(context), keysBefore);
assert.equal(window.document.documentElement.outerHTML, before.html);
assert.equal(shadow.innerHTML, before.shadow);
assert.equal(extensionShadow.innerHTML, before.extension);

assert.equal(evidence.captureCount, evidence.captures.length);
assert.equal(evidence.remoteEntries.length, 9);
assert.equal(new Set(evidence.captures.map(x => x.path)).size, 5);
assert.equal(evidence.selectorChecks.length, 53);
for (const check of evidence.selectorChecks) {
  assert.ok(evidence.captures.some(c => c.surface === check.surface));
  assert.ok(Number.isInteger(check.matches) && check.matches >= 0);
}
assert.equal(evidence.classLabelObservation.rows, 10);
assert.equal(evidence.classLabelObservation.withExtensionDisplay, 8);
assert.equal(evidence.classLabelObservation.multiplePeriodBlocksWithoutExtensionDisplay, 2);
assert.equal(evidence.restoredState.composePresent, false);
assert.equal(evidence.restoredState.dialogs, 0);
window.close();
console.log('PASS: scope guard; open module shadow DOM; third-party shadow exclusion; per-root duplicate IDs; hidden controls; ID masking; omission of fixture private text/values; no DOM/global mutations; evidence consistency.');
console.log('Synthetic fixture checks are not all-account or live submission acceptance tests.');
