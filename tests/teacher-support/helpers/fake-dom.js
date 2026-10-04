class FakeClassList {
  constructor(owner) {
    this.owner = owner;
    this.values = new Set();
  }
  add(...names) { for (const name of names.filter(Boolean)) this.values.add(name); }
  remove(...names) { for (const name of names) this.values.delete(name); }
  contains(name) { return this.values.has(name); }
  toggle(name, force) {
    const next = force === undefined ? !this.values.has(name) : Boolean(force);
    if (next) this.values.add(name); else this.values.delete(name);
    return next;
  }
  toString() { return [...this.values].join(' '); }
}

class FakeElement {
  constructor(document, tagName) {
    this.ownerDocument = document;
    this.tagName = String(tagName || 'div').toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.parentElement = null;
    this.attributes = new Map();
    this.classList = new FakeClassList(this);
    this.dataset = {};
    this.style = {};
    this.eventListeners = new Map();
    this.textContent = '';
    this.hidden = false;
    this.type = '';
    this.id = '';
    this.src = '';
    this.alt = '';
  }

  appendChild(child) {
    child.parentNode = this;
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index >= 0) this.children.splice(index, 1);
    child.parentNode = null;
    child.parentElement = null;
    return child;
  }

  remove() {
    if (this.parentNode) this.parentNode.removeChild(this);
  }

  replaceChildren(...children) {
    for (const child of this.children) {
      child.parentNode = null;
      child.parentElement = null;
    }
    this.children = [];
    for (const child of children) this.appendChild(child);
  }

  setAttribute(name, value) {
    const stringValue = String(value);
    this.attributes.set(name, stringValue);
    if (name === 'id') this.id = stringValue;
    if (name === 'class') {
      this.classList.values = new Set(stringValue.split(/\s+/).filter(Boolean));
    }
    if (name.startsWith('data-')) {
      const key = name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      this.dataset[key] = stringValue;
    }
  }

  getAttribute(name) {
    if (name === 'id' && this.id) return this.id;
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  addEventListener(type, handler) {
    if (!this.eventListeners.has(type)) this.eventListeners.set(type, new Set());
    this.eventListeners.get(type).add(handler);
  }

  removeEventListener(type, handler) {
    const set = this.eventListeners.get(type);
    if (set) set.delete(handler);
  }

  dispatchEvent(event) {
    const e = event || {};
    e.type = e.type || '';
    e.target = e.target || this;
    e.currentTarget = this;
    e.defaultPrevented = false;
    e.preventDefault = e.preventDefault || (() => { e.defaultPrevented = true; });
    e.stopPropagation = e.stopPropagation || (() => {});
    const handlers = this.eventListeners.get(e.type);
    if (handlers) for (const handler of [...handlers]) handler(e);
    return !e.defaultPrevented;
  }

  focus() {
    this.ownerDocument.activeElement = this;
  }

  contains(node) {
    if (node === this) return true;
    return this.children.some((child) => child.contains(node));
  }

  matches(selector) {
    selector = String(selector).trim();
    if (!selector) return false;
    if (selector.startsWith('#')) return this.id === selector.slice(1);
    if (selector.startsWith('.')) return this.classList.contains(selector.slice(1));
    const attr = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
    if (attr) {
      const value = this.getAttribute(attr[1]);
      return attr[2] === undefined ? value !== null : value === attr[2];
    }
    return this.tagName.toLowerCase() === selector.toLowerCase();
  }

  querySelectorAll(selector) {
    const result = [];
    function walk(node) {
      for (const child of node.children) {
        if (child.matches(selector)) result.push(child);
        walk(child);
      }
    }
    walk(this);
    return result;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
}

class FakeDocument {
  constructor() {
    this.activeElement = null;
    this.body = new FakeElement(this, 'body');
  }
  createElement(tagName) { return new FakeElement(this, tagName); }
  querySelector(selector) {
    if (this.body.matches(selector)) return this.body;
    return this.body.querySelector(selector);
  }
  querySelectorAll(selector) {
    const result = this.body.matches(selector) ? [this.body] : [];
    return result.concat(this.body.querySelectorAll(selector));
  }
}

function createFakeDocument() {
  return new FakeDocument();
}

module.exports = { FakeDocument, FakeElement, createFakeDocument };
