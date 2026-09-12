/**
 * ============================================================
 * POWERHUB DOM INSPECTOR — Core Engine
 * File: powerhub_inspector.js
 * Version: 1.0.0
 * Scope: Read-only DOM inspection for PowerHub / SharePoint pages
 * ============================================================
 */

(function (global) {
  "use strict";

  // ─────────────────────────────────────────────
  // SECURITY GUARD — chỉ chạy trên domain hợp lệ
  // ─────────────────────────────────────────────
  const ALLOWED_DOMAINS = [
    "sharepoint.com",
    "vas.edu.vn",
    "localhost",
  ];

  function _isDomainAllowed() {
    return ALLOWED_DOMAINS.some((d) => location.hostname.endsWith(d));
  }

  if (!_isDomainAllowed()) {
    console.warn("[PHInspector] Domain không được phép. Skill dừng lại.");
    return;
  }

  // ─────────────────────────────────────────────
  // HELPER FUNCTIONS
  // ─────────────────────────────────────────────

  /**
   * Lấy tất cả attributes của một element dưới dạng object
   */
  function _getAttributes(el) {
    const attrs = {};
    for (const attr of el.attributes) {
      attrs[attr.name] = attr.value;
    }
    return attrs;
  }

  /**
   * Lấy text trực tiếp của element (không bao gồm con)
   */
  function _getDirectText(el) {
    let text = "";
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent.trim();
      }
    }
    return text;
  }

  /**
   * Kiểm tra element có đang visible trong viewport không
   */
  function _isVisible(el) {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  /**
   * Tạo CSS selector duy nhất cho element
   */
  function _buildSelector(el) {
    if (el.id) return `#${CSS.escape(el.id)}`;
    const parts = [];
    let current = el;
    while (current && current !== document.body) {
      let part = current.tagName.toLowerCase();
      if (current.id) {
        part = `#${CSS.escape(current.id)}`;
        parts.unshift(part);
        break;
      }
      if (current.className) {
        const cls = [...current.classList]
          .filter((c) => !/^\d/.test(c))
          .slice(0, 2)
          .map((c) => `.${CSS.escape(c)}`)
          .join("");
        part += cls;
      }
      const siblings = current.parentElement
        ? [...current.parentElement.children].filter(
            (s) => s.tagName === current.tagName
          )
        : [];
      if (siblings.length > 1) {
        const idx = siblings.indexOf(current) + 1;
        part += `:nth-of-type(${idx})`;
      }
      parts.unshift(part);
      current = current.parentElement;
    }
    return parts.join(" > ");
  }

  /**
   * Serialize 1 element thành object JSON
   */
  function _serializeElement(el, depth = 0, maxDepth = 2) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return null;
    const rect = el.getBoundingClientRect();
    const result = {
      tag: el.tagName,
      selector: _buildSelector(el),
      id: el.id || null,
      classes: [...el.classList],
      text: (el.innerText || "").trim().slice(0, 200),
      directText: _getDirectText(el),
      attributes: _getAttributes(el),
      visible: _isVisible(el),
      rect: {
        top: Math.round(rect.top + scrollY),
        left: Math.round(rect.left + scrollX),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      childCount: el.children.length,
      role: el.getAttribute("role") || null,
      ariaLabel: el.getAttribute("aria-label") || null,
      dataAutomationId: el.getAttribute("data-automation-id") || null,
    };
    if (depth < maxDepth && el.children.length > 0) {
      result.children = [...el.children]
        .slice(0, 20) // giới hạn tối đa 20 con mỗi level
        .map((child) => _serializeElement(child, depth + 1, maxDepth))
        .filter(Boolean);
    }
    return result;
  }

  // ─────────────────────────────────────────────
  // POWERHUB COMMON SELECTORS
  // ─────────────────────────────────────────────
  const PH_SELECTORS = {
    canvasZone:       '[data-automation-id="CanvasZone"]',
    webPartTitle:     '[data-automation-id="webPartTitle"]',
    pageHeader:       '[data-automation-id="pageHeader"]',
    webParts:         '[data-sp-feature-tag*="webPart"]',
    navigation:       '[role="navigation"]',
    searchBox:        '.ms-SearchBox',
    feedCard:         '.ms-FeedCard',
    richText:         '.ckeditor-sp-rte',
    topBar:           '.od-TopBar',
    controlZone:      '.ControlZone',
    siteHeader:       '#spSiteHeader',
    quickLaunch:      '#ms-designer-ribbon',
    commandBar:       '.ms-CommandBar',
    heroWebPart:      '[data-sp-web-part-id*="hero"]',
    newsWebPart:      '[data-sp-web-part-id*="news"]',
    linksWebPart:     '[data-sp-web-part-id*="quickLinks"]',
  };

  // ─────────────────────────────────────────────
  // PUBLIC API — PHInspector
  // ─────────────────────────────────────────────
  const PHInspector = {

    /**
     * Inspect một element theo CSS selector
     * @param {string} selector
     * @param {number} depth - độ sâu DOM tree (0-5, default 2)
     * @returns {object|null}
     */
    inspect(selector, depth = 2) {
      const el = document.querySelector(selector);
      if (!el) {
        console.warn(`[PHInspector] Không tìm thấy: "${selector}"`);
        return { error: `Không tìm thấy element: ${selector}` };
      }
      const result = _serializeElement(el, 0, depth);
      console.info("[PHInspector] inspect →", result);
      return result;
    },

    /**
     * Query nhiều elements theo CSS selector
     * @param {string} selector
     * @param {number} limit - số lượng tối đa (default 10)
     * @returns {object[]}
     */
    query(selector, limit = 10) {
      const els = [...document.querySelectorAll(selector)].slice(0, limit);
      if (els.length === 0) {
        console.warn(`[PHInspector] query không có kết quả: "${selector}"`);
        return [];
      }
      const results = els.map((el) => _serializeElement(el, 0, 1));
      console.info(`[PHInspector] query (${results.length}) →`, results);
      return results;
    },

    /**
     * Tìm elements chứa đoạn text (case-insensitive)
     * @param {string} text
     * @param {string} scope - selector giới hạn vùng tìm (optional)
     * @returns {object[]}
     */
    findByText(text, scope = "*") {
      const lower = text.toLowerCase();
      const all = [...document.querySelectorAll(scope)];
      const matches = all
        .filter(
          (el) =>
            el.children.length < 5 && // lá hoặc gần lá
            (el.innerText || "").toLowerCase().includes(lower)
        )
        .slice(0, 15);
      const results = matches.map((el) => _serializeElement(el, 0, 1));
      console.info(`[PHInspector] findByText("${text}") →`, results);
      return results;
    },

    /**
     * Lấy toàn bộ PowerHub webparts trên trang
     * @returns {object[]}
     */
    getWebParts() {
      return this.query(PH_SELECTORS.webParts, 30);
    },

    /**
     * Lấy navigation links
     * @returns {object[]}
     */
    getNavigation() {
      const navEl = document.querySelector(PH_SELECTORS.navigation);
      if (!navEl) return [];
      const links = [...navEl.querySelectorAll("a")].map((a) => ({
        text: a.innerText.trim(),
        href: a.href,
        visible: _isVisible(a),
        selector: _buildSelector(a),
      }));
      console.info("[PHInspector] getNavigation →", links);
      return links;
    },

    /**
     * Trích cây DOM từ root element
     * @param {string} rootSelector - default: body
     * @param {number} depth - độ sâu (1-5)
     * @returns {object}
     */
    extractTree(rootSelector = "body", depth = 3) {
      const root = document.querySelector(rootSelector);
      if (!root) return { error: `Không tìm thấy root: ${rootSelector}` };
      return _serializeElement(root, 0, Math.min(depth, 5));
    },

    /**
     * Lấy thông tin trang PowerHub hiện tại
     * @returns {object}
     */
    getPageInfo() {
      const info = {
        url: location.href,
        title: document.title,
        timestamp: new Date().toISOString(),
        viewport: { width: innerWidth, height: innerHeight },
        scrollPosition: { x: scrollX, y: scrollY },
        totalHeight: document.documentElement.scrollHeight,
        webPartCount: document.querySelectorAll(PH_SELECTORS.webParts).length,
        hasNavigation: !!document.querySelector(PH_SELECTORS.navigation),
        hasSearchBox: !!document.querySelector(PH_SELECTORS.searchBox),
        hasHero: !!document.querySelector(PH_SELECTORS.heroWebPart),
        hasNews: !!document.querySelector(PH_SELECTORS.newsWebPart),
        sharepointVersion: (
          document.querySelector('meta[name="SPSiteUrl"]') || {}
        ).content || "unknown",
      };
      console.info("[PHInspector] getPageInfo →", info);
      return info;
    },

    /**
     * Inspect element tại tọa độ x, y trong viewport
     * @param {number} x
     * @param {number} y
     * @returns {object|null}
     */
    inspectAt(x, y) {
      const el = document.elementFromPoint(x, y);
      if (!el) return null;
      return _serializeElement(el, 0, 2);
    },

    /**
     * Expose selectors chuẩn PowerHub để agent dùng
     */
    selectors: PH_SELECTORS,

    version: "1.0.0",
  };

  // Export ra global
  global.PHInspector = PHInspector;
  console.info(
    `%c[PHInspector v${PHInspector.version}] Loaded ✓`,
    "color: #0078d4; font-weight: bold;"
  );
})(window);
