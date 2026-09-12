/**
 * ============================================================
 * POWERHUB HIGHLIGHT ENGINE
 * File: powerhub_highlight.js
 * Hiệu ứng: flash, spotlight, scroll, tooltip, pulse
 * ============================================================
 */

(function (global) {
  "use strict";

  // ─────────────────────────────────────────────
  // STYLE INJECTION — chỉ inject 1 lần
  // ─────────────────────────────────────────────
  const STYLE_ID = "ph-highlight-styles";

  function _injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      /* Flash animation */
      @keyframes ph-flash {
        0%   { outline: 4px solid #FFD700; background: rgba(255,215,0,0.25); }
        25%  { outline: 4px solid #FF6B00; background: rgba(255,107,0,0.30); }
        50%  { outline: 4px solid #FFD700; background: rgba(255,215,0,0.25); }
        75%  { outline: 4px solid #FF6B00; background: rgba(255,107,0,0.30); }
        100% { outline: 4px solid transparent; background: transparent; }
      }

      /* Pulse border animation */
      @keyframes ph-pulse {
        0%   { box-shadow: 0 0 0 0 rgba(0,120,212,0.7); }
        70%  { box-shadow: 0 0 0 12px rgba(0,120,212,0); }
        100% { box-shadow: 0 0 0 0 rgba(0,120,212,0); }
      }

      /* Ripple */
      @keyframes ph-ripple {
        0%   { transform: scale(1); opacity: 1; }
        100% { transform: scale(1.08); opacity: 0; }
      }

      /* Fade in tooltip */
      @keyframes ph-fadein {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      /* Highlight class */
      .ph-highlighted {
        outline: 3px solid #0078d4 !important;
        outline-offset: 3px !important;
        animation: ph-pulse 1.2s ease-in-out 3 !important;
        position: relative !important;
        z-index: 9998 !important;
      }

      /* Flash class */
      .ph-flashing {
        animation: ph-flash 0.5s ease-in-out 4 !important;
        position: relative !important;
        z-index: 9998 !important;
      }

      /* Spotlight overlay */
      #ph-spotlight-overlay {
        position: fixed;
        top: 0; left: 0;
        width: 100vw; height: 100vh;
        z-index: 9990;
        pointer-events: none;
        transition: all 0.3s ease;
      }

      /* Tooltip */
      .ph-tooltip {
        position: absolute;
        background: #0078d4;
        color: #fff;
        font-family: "Segoe UI", sans-serif;
        font-size: 13px;
        font-weight: 500;
        padding: 8px 14px;
        border-radius: 6px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.25);
        z-index: 99999;
        pointer-events: none;
        max-width: 280px;
        line-height: 1.5;
        animation: ph-fadein 0.25s ease forwards;
        white-space: pre-line;
      }
      .ph-tooltip::before {
        content: "";
        position: absolute;
        top: -7px; left: 16px;
        border-width: 0 7px 7px 7px;
        border-style: solid;
        border-color: transparent transparent #0078d4 transparent;
      }

      /* Scroll marker */
      .ph-scroll-marker {
        outline: 3px dashed #FF6B00 !important;
        outline-offset: 4px !important;
        animation: ph-pulse 1s ease 5 !important;
      }

      /* Step badge */
      .ph-step-badge {
        position: absolute;
        top: -12px;
        left: -12px;
        width: 26px;
        height: 26px;
        background: #0078d4;
        color: #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
        font-family: "Segoe UI", sans-serif;
        z-index: 99999;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────

  function _resolveEl(selectorOrEl) {
    if (typeof selectorOrEl === "string") {
      return document.querySelector(selectorOrEl);
    }
    return selectorOrEl;
  }

  function _clearClass(cls) {
    document.querySelectorAll(`.${cls}`).forEach((el) => {
      el.classList.remove(cls);
    });
  }

  function _removeAll(selector) {
    document.querySelectorAll(selector).forEach((el) => el.remove());
  }

  // ─────────────────────────────────────────────
  // PUBLIC API — PHHighlight
  // ─────────────────────────────────────────────
  const PHHighlight = {

    /**
     * Chớp sáng element (flash vàng-cam)
     * @param {string|Element} selector
     * @param {number} times - số lần chớp (default 4)
     */
    flash(selector, times = 4) {
      _injectStyles();
      const el = _resolveEl(selector);
      if (!el) {
        console.warn(`[PHHighlight] flash: không tìm thấy "${selector}"`);
        return;
      }
      el.classList.remove("ph-flashing");
      void el.offsetWidth; // reset animation
      el.classList.add("ph-flashing");
      el.style.setProperty(
        "animation",
        `ph-flash 0.5s ease-in-out ${times} !important`
      );
      const duration = times * 500 + 200;
      setTimeout(() => {
        el.classList.remove("ph-flashing");
        el.style.removeProperty("animation");
      }, duration);
      console.info(`[PHHighlight] flash → ${selector}`);
    },

    /**
     * Highlight element với pulse border xanh
     * @param {string|Element} selector
     * @param {boolean} persist - giữ highlight không tắt
     */
    highlight(selector, persist = false) {
      _injectStyles();
      const el = _resolveEl(selector);
      if (!el) return;
      el.classList.add("ph-highlighted");
      if (!persist) {
        setTimeout(() => el.classList.remove("ph-highlighted"), 4000);
      }
      console.info(`[PHHighlight] highlight → ${selector}`);
    },

    /**
     * Spotlight: tối toàn trang, chỉ sáng element được chọn
     * @param {string|Element} selector
     * @param {number} duration - ms trước khi tắt (0 = giữ mãi)
     */
    spotlight(selector, duration = 4000) {
      _injectStyles();
      const el = _resolveEl(selector);
      if (!el) return;

      // Xóa spotlight cũ
      this.clearSpotlight();

      const rect = el.getBoundingClientRect();
      const PAD = 12;

      // Tạo SVG mask overlay
      const overlay = document.createElement("div");
      overlay.id = "ph-spotlight-overlay";

      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "100%");

      const defs = document.createElementNS(svgNS, "defs");
      const mask = document.createElementNS(svgNS, "mask");
      mask.setAttribute("id", "ph-spotlight-mask");

      const fullRect = document.createElementNS(svgNS, "rect");
      fullRect.setAttribute("fill", "white");
      fullRect.setAttribute("x", "0");
      fullRect.setAttribute("y", "0");
      fullRect.setAttribute("width", "100%");
      fullRect.setAttribute("height", "100%");

      const hole = document.createElementNS(svgNS, "rect");
      hole.setAttribute("fill", "black");
      hole.setAttribute("rx", "6");
      hole.setAttribute("x", String(rect.left - PAD));
      hole.setAttribute("y", String(rect.top - PAD));
      hole.setAttribute("width", String(rect.width + PAD * 2));
      hole.setAttribute("height", String(rect.height + PAD * 2));

      mask.appendChild(fullRect);
      mask.appendChild(hole);
      defs.appendChild(mask);
      svg.appendChild(defs);

      const darken = document.createElementNS(svgNS, "rect");
      darken.setAttribute("fill", "rgba(0,0,0,0.62)");
      darken.setAttribute("x", "0");
      darken.setAttribute("y", "0");
      darken.setAttribute("width", "100%");
      darken.setAttribute("height", "100%");
      darken.setAttribute("mask", "url(#ph-spotlight-mask)");

      svg.appendChild(darken);
      overlay.appendChild(svg);
      document.body.appendChild(overlay);

      // Viền sáng xung quanh element
      el.classList.add("ph-highlighted");

      if (duration > 0) {
        setTimeout(() => {
          this.clearSpotlight();
          el.classList.remove("ph-highlighted");
        }, duration);
      }

      console.info(`[PHHighlight] spotlight → ${selector}`);
    },

    /**
     * Cuộn trang đến element + highlight
     * @param {string|Element} selector
     * @param {string} behavior - "smooth" | "instant"
     * @param {boolean} doHighlight - có highlight sau khi cuộn không
     */
    scrollTo(selector, behavior = "smooth", doHighlight = true) {
      _injectStyles();
      const el = _resolveEl(selector);
      if (!el) {
        console.warn(`[PHHighlight] scrollTo: không tìm thấy "${selector}"`);
        return;
      }
      el.scrollIntoView({ behavior, block: "center" });
      el.classList.add("ph-scroll-marker");

      if (doHighlight) {
        setTimeout(() => {
          el.classList.remove("ph-scroll-marker");
          this.flash(el, 3);
        }, behavior === "smooth" ? 700 : 100);
      } else {
        setTimeout(() => el.classList.remove("ph-scroll-marker"), 2000);
      }

      console.info(`[PHHighlight] scrollTo → ${selector}`);
    },

    /**
     * Hiển thị tooltip hướng dẫn bên dưới element
     * @param {string|Element} selector
     * @param {string} message - nội dung hướng dẫn
     * @param {number} duration - ms (0 = giữ mãi)
     * @param {string} position - "bottom" | "top" | "right"
     */
    tooltip(selector, message, duration = 5000, position = "bottom") {
      _injectStyles();
      const el = _resolveEl(selector);
      if (!el) return;

      // Xóa tooltip cũ của element này
      const oldTip = el.querySelector(".ph-tooltip");
      if (oldTip) oldTip.remove();

      const rect = el.getBoundingClientRect();
      const tip = document.createElement("div");
      tip.className = "ph-tooltip";
      tip.textContent = message;

      // Đặt tooltip tương đối với document
      tip.style.position = "fixed";
      tip.style.zIndex = "99999";
      tip.style.pointerEvents = "none";

      if (position === "bottom") {
        tip.style.top = `${rect.bottom + 10}px`;
        tip.style.left = `${rect.left}px`;
      } else if (position === "top") {
        tip.style.bottom = `${window.innerHeight - rect.top + 10}px`;
        tip.style.left = `${rect.left}px`;
        tip.style.setProperty("animation", "ph-fadein 0.25s ease forwards");
      } else if (position === "right") {
        tip.style.top = `${rect.top}px`;
        tip.style.left = `${rect.right + 10}px`;
      }

      document.body.appendChild(tip);

      if (duration > 0) {
        setTimeout(() => tip.remove(), duration);
      }

      console.info(`[PHHighlight] tooltip → ${selector}: "${message}"`);
      return tip;
    },

    /**
     * Thêm số thứ tự (step badge) lên element
     * @param {string|Element} selector
     * @param {number} step - số hiển thị
     * @param {string} color - màu badge (hex)
     */
    addStepBadge(selector, step, color = "#0078d4") {
      _injectStyles();
      const el = _resolveEl(selector);
      if (!el) return;

      const badge = document.createElement("div");
      badge.className = "ph-step-badge";
      badge.textContent = step;
      badge.style.background = color;

      const pos = getComputedStyle(el).position;
      if (pos === "static") el.style.position = "relative";

      el.appendChild(badge);
      console.info(`[PHHighlight] addStepBadge(${step}) → ${selector}`);
      return badge;
    },

    /**
     * Xóa spotlight overlay
     */
    clearSpotlight() {
      const overlay = document.getElementById("ph-spotlight-overlay");
      if (overlay) overlay.remove();
    },

    /**
     * Xóa toàn bộ hiệu ứng trên trang
     */
    clear() {
      _clearClass("ph-highlighted");
      _clearClass("ph-flashing");
      _clearClass("ph-scroll-marker");
      _removeAll(".ph-tooltip");
      _removeAll(".ph-step-badge");
      this.clearSpotlight();
      console.info("[PHHighlight] Đã xóa toàn bộ hiệu ứng.");
    },

    version: "1.0.0",
  };

  global.PHHighlight = PHHighlight;
  console.info(
    `%c[PHHighlight v${PHHighlight.version}] Loaded ✓`,
    "color: #107c10; font-weight: bold;"
  );
})(window);
