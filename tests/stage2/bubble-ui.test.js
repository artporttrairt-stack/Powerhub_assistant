'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createBubbleUi } = require('../../extension/src/features/teacher-support/ui/bubble-ui.js');

function node(tag = 'div') {
  return {
    tagName: tag.toUpperCase(), id: '', className: '', textContent: '', dataset: {}, parentNode: null,
    children: [], listeners: new Map(),
    appendChild(child) { if (child.parentNode) child.parentNode.removeChild(child); child.parentNode = this; this.children.push(child); return child; },
    removeChild(child) { const i = this.children.indexOf(child); if (i >= 0) this.children.splice(i, 1); child.parentNode = null; },
    remove() { if (this.parentNode) this.parentNode.removeChild(this); },
    replaceChildren(...kids) { for (const c of this.children) c.parentNode = null; this.children = []; kids.forEach((c) => this.appendChild(c)); },
    addEventListener(type, fn) { const list = this.listeners.get(type) || []; list.push(fn); this.listeners.set(type, list); },
    removeEventListener(type, fn) { const list = this.listeners.get(type) || []; this.listeners.set(type, list.filter((x) => x !== fn)); },
    querySelectorAll(selector) {
      const out = [];
      const match = (el) => selector.startsWith('.') ? String(el.className).split(/\s+/).includes(selector.slice(1)) : selector.startsWith('#') ? el.id === selector.slice(1) : false;
      const visit = (el) => { for (const c of el.children) { if (match(c)) out.push(c); visit(c); } };
      visit(this); return out;
    },
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; },
  };
}

function fakeDocument() {
  const body = node('body');
  return {
    body,
    createElement: (tag) => node(tag),
    getElementById(id) { return body.querySelector(`#${id}`); },
  };
}

test('repeated mount creates one extension-owned direct body child', () => {
  const doc = fakeDocument();
  const ui = createBubbleUi(doc);
  const a = ui.mount(); const b = ui.mount();
  assert.equal(a, b);
  assert.equal(doc.body.children.length, 1);
  assert.equal(a.parentNode, doc.body);
});

test('replaceBars replaces instead of duplicating flat bars', () => {
  const doc = fakeDocument(); const ui = createBubbleUi(doc); ui.mount();
  ui.showBars([{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]);
  assert.equal(doc.body.querySelectorAll('.hub-support-bar').length, 2);
  ui.replaceBars([{ id: 'c', label: 'C' }]);
  assert.equal(doc.body.querySelectorAll('.hub-support-bar').length, 1);
  assert.equal(doc.body.querySelector('.hub-support-bar').textContent, 'C');
});

test('collapse and wake do not accumulate listeners', () => {
  const doc = fakeDocument(); const ui = createBubbleUi(doc); const root = ui.mount();
  ui.collapse(); ui.wake(); ui.collapse(); ui.wake();
  const wake = root.querySelector('.hub-support-wake');
  assert.equal((wake.listeners.get('click') || []).length, 1);
});

test('highlight owns exactly one highlight and never clicks native target', () => {
  const doc = fakeDocument(); const ui = createBubbleUi(doc); ui.mount();
  let clicks = 0;
  const nativeA = { click() { clicks += 1; } };
  const nativeB = { click() { clicks += 1; } };
  ui.highlight(nativeA); ui.highlight(nativeB);
  assert.equal(doc.body.querySelectorAll('.hub-support-highlight').length, 1);
  assert.equal(clicks, 0);
});

test('destroy removes owned DOM and listeners', () => {
  const doc = fakeDocument(); const ui = createBubbleUi(doc); const root = ui.mount();
  ui.showBars([{ id: 'a', label: 'A' }]); ui.collapse();
  const wake = root.querySelector('.hub-support-wake');
  assert.equal((wake.listeners.get('click') || []).length, 1);
  ui.destroy();
  assert.equal(doc.body.children.length, 0);
  assert.equal((wake.listeners.get('click') || []).length, 0);
});

test('CSS preserves flat separate-bar visual lock', () => {
  const css = fs.readFileSync(path.join(__dirname, '../../extension/src/features/teacher-support/ui/bubble-ui.css'), 'utf8');
  assert.match(css, /220ms/);
  assert.match(css, /position:\s*fixed/);
  assert.match(css, /right:/);
  assert.match(css, /bottom:/);
  assert.doesNotMatch(css, /backdrop-filter|100vw|side-panel/i);
});
