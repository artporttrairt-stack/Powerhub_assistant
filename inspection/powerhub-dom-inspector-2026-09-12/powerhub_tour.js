/**
 * ============================================================
 * POWERHUB GUIDED TOUR ENGINE
 * File: powerhub_tour.js
 * Chức năng: Dẫn user qua từng bước tương tác với PowerHub
 *            Tự động scroll + highlight + tooltip theo thứ tự
 * ============================================================
 */

(function (global) {
  "use strict";

  // ─────────────────────────────────────────────
  // TOUR UI STYLES
  // ─────────────────────────────────────────────
  const TOUR_STYLE_ID = "ph-tour-styles";

  function _injectTourStyles() {
    if (document.getElementById(TOUR_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = TOUR_STYLE_ID;
    style.textContent = `
      #ph-tour-panel {
        position: fixed;
        bottom: 28px;
        right: 28px;
        width: 320px;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.22);
        z-index: 999999;
        font-family: "Segoe UI", sans-serif;
        overflow: hidden;
        border: 1px solid #e0e0e0;
        animation: ph-slide-up 0.3s ease;
      }
      @keyframes ph-slide-up {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      #ph-tour-header {
        background: #0078d4;
        color: #fff;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      #ph-tour-header .ph-tour-title {
        font-size: 14px;
        font-weight: 600;
      }
      #ph-tour-header .ph-tour-close {
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
        opacity: 0.8;
        background: none;
        border: none;
        color: #fff;
        padding: 0 4px;
      }
      #ph-tour-header .ph-tour-close:hover { opacity: 1; }
      #ph-tour-progress-bar-wrap {
        height: 4px;
        background: #e0e0e0;
      }
      #ph-tour-progress-bar {
        height: 4px;
        background: #0078d4;
        transition: width 0.4s ease;
      }
      #ph-tour-body {
        padding: 16px;
      }
      #ph-tour-step-label {
        font-size: 11px;
        color: #888;
        margin-bottom: 6px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      #ph-tour-step-title {
        font-size: 15px;
        font-weight: 700;
        color: #1a1a1a;
        margin-bottom: 8px;
      }
      #ph-tour-step-desc {
        font-size: 13px;
        color: #444;
        line-height: 1.6;
        margin-bottom: 14px;
        min-height: 40px;
      }
      #ph-tour-actions {
        display: flex;
        gap: 8px;
        align-items: center;
        justify-content: space-between;
      }
      .ph-tour-btn {
        padding: 8px 16px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        font-family: "Segoe UI", sans-serif;
        transition: all 0.15s ease;
      }
      .ph-tour-btn-primary {
        background: #0078d4;
        color: #fff;
      }
      .ph-tour-btn-primary:hover { background: #005a9e; }
      .ph-tour-btn-secondary {
        background: #f3f3f3;
        color: #333;
      }
      .ph-tour-btn-secondary:hover { background: #e0e0e0; }
      .ph-tour-btn-finish {
        background: #107c10;
        color: #fff;
      }
      .ph-tour-btn-finish:hover { background: #0b5a0b; }
      #ph-tour-skip {
        font-size: 12px;
        color: #999;
        text-decoration: underline;
        cursor: pointer;
        background: none;
        border: none;
        font-family: "Segoe UI", sans-serif;
      }
      #ph-tour-skip:hover { color: #555; }

      /* Target ring — viền xanh quanh element đang được tour */
      .ph-tour-target {
        outline: 3px solid #0078d4 !important;
        outline-offset: 4px !important;
        box-shadow: 0 0 0 8px rgba(0,120,212,0.15) !important;
        position: relative !important;
        z-index: 9999 !important;
        transition: outline 0.3s, box-shadow 0.3s !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ─────────────────────────────────────────────
  // TOUR STATE
  // ─────────────────────────────────────────────
  let _tourSteps   = [];
  let _currentIdx  = 0;
  let _panel       = null;
  let _onFinishCb  = null;

  // ─────────────────────────────────────────────
  // BUILT-IN TOURS
  // ─────────────────────────────────────────────
  const BUILTIN_TOURS = {

    /**
     * Tour giới thiệu PowerHub cho giáo viên mới
     */
    teacherOnboarding: [
      {
        title: "Chào mừng đến PowerHub 👋",
        description:
          "Đây là trung tâm thông tin và tài nguyên của trường. Hãy để chúng tôi dẫn bạn qua các phần chính!",
        selector: null, // không highlight gì
        scrollTo: false,
      },
      {
        title: "Navigation Menu",
        description:
          "Thanh điều hướng này giúp bạn di chuyển giữa các khu vực: Tài nguyên dạy học, Thông báo, Lịch sự kiện...",
        selector: '[role="navigation"]',
        scrollTo: true,
      },
      {
        title: "Tìm kiếm nhanh",
        description:
          "Dùng ô tìm kiếm để tìm bất kỳ tài liệu, bài đăng hoặc trang nào trong PowerHub.",
        selector: '.ms-SearchBox, [aria-label*="search" i], input[type="search"]',
        scrollTo: true,
      },
      {
        title: "Khu vực tin tức & thông báo",
        description:
          "Các thông báo quan trọng từ Ban Giám Hiệu và các bộ phận sẽ xuất hiện tại đây.",
        selector: '[data-sp-web-part-id*="news"], .ms-FeedCard',
        scrollTo: true,
        fallback: '[data-automation-id="CanvasZone"]',
      },
      {
        title: "Quick Links — Truy cập nhanh",
        description:
          "Các link tắt đến: PowerSchool, Microsoft Teams, Student Planner, Email, OneDrive...",
        selector: '[data-sp-web-part-id*="quickLinks"]',
        scrollTo: true,
        fallback: '[data-sp-feature-tag*="webPart"]',
      },
      {
        title: "🎉 Hoàn tất!",
        description:
          "Bạn đã xem xong phần giới thiệu PowerHub. Khám phá thêm bằng cách click vào các mục trên Navigation hoặc dùng ô tìm kiếm.",
        selector: null,
        scrollTo: false,
        isLast: true,
      },
    ],

    /**
     * Tour hướng dẫn gửi tin nhắn cho phụ huynh (theo yêu cầu user)
     */
    messagingParents: [
      {
        title: "Bước 1 — Tìm phụ huynh",
        description:
          "Vào mục 'Phụ huynh & Học sinh' hoặc dùng ô tìm kiếm, gõ tên học sinh để tìm phụ huynh.",
        selector: '.ms-SearchBox, [aria-label*="search" i]',
        scrollTo: true,
      },
      {
        title: "Bước 2 — Chọn phụ huynh",
        description:
          "Click vào tên phụ huynh trong kết quả tìm kiếm. Bạn sẽ thấy thông tin liên hệ và lịch sử tin nhắn.",
        selector: '[data-automation-id="CanvasZone"]',
        scrollTo: true,
      },
      {
        title: "Bước 3 — Gửi tin nhắn",
        description:
          "Click nút 'New Message' hoặc 'Gửi tin nhắn'. Nhập nội dung và nhấn Send. Tin nhắn sẽ được gửi qua email và hiển thị trong PowerHub.",
        selector: 'button[aria-label*="message" i], button[aria-label*="compose" i], [role="button"]',
        scrollTo: true,
        fallback: '[data-automation-id="pageHeader"]',
      },
      {
        title: "Bước 4 — Gửi cho nhiều phụ huynh",
        description:
          "Để gửi cùng một tin nhắn cho nhiều phụ huynh: chọn nhiều người trước khi click 'New Message', hoặc tạo nhóm liên lạc trong mục Group.",
        selector: null,
        scrollTo: false,
        isLast: true,
      },
    ],
  };

  // ─────────────────────────────────────────────
  // INTERNAL — Build Panel UI
  // ─────────────────────────────────────────────
  function _createPanel() {
    if (_panel) _panel.remove();
    const panel = document.createElement("div");
    panel.id = "ph-tour-panel";
    panel.innerHTML = `
      <div id="ph-tour-header">
        <span class="ph-tour-title">🗺️ PowerHub Tour</span>
        <button class="ph-tour-close" title="Đóng tour">✕</button>
      </div>
      <div id="ph-tour-progress-bar-wrap">
        <div id="ph-tour-progress-bar" style="width:0%"></div>
      </div>
      <div id="ph-tour-body">
        <div id="ph-tour-step-label"></div>
        <div id="ph-tour-step-title"></div>
        <div id="ph-tour-step-desc"></div>
        <div id="ph-tour-actions">
          <button id="ph-tour-skip" class="ph-tour-btn">Bỏ qua tour</button>
          <div style="display:flex;gap:8px">
            <button id="ph-tour-prev" class="ph-tour-btn ph-tour-btn-secondary">← Trước</button>
            <button id="ph-tour-next" class="ph-tour-btn ph-tour-btn-primary">Tiếp →</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(panel);
    _panel = panel;

    panel.querySelector(".ph-tour-close").onclick = () => PHTour.stop();
    panel.querySelector("#ph-tour-skip").onclick   = () => PHTour.stop();
    panel.querySelector("#ph-tour-prev").onclick   = () => PHTour.prev();
    panel.querySelector("#ph-tour-next").onclick   = () => PHTour.next();
  }

  function _renderStep(idx) {
    if (!_panel) return;
    const step  = _tourSteps[idx];
    const total = _tourSteps.length;
    const pct   = Math.round(((idx + 1) / total) * 100);

    // Update progress bar
    _panel.querySelector("#ph-tour-progress-bar").style.width = `${pct}%`;

    // Update text
    _panel.querySelector("#ph-tour-step-label").textContent = `Bước ${idx + 1} / ${total}`;
    _panel.querySelector("#ph-tour-step-title").textContent  = step.title;
    _panel.querySelector("#ph-tour-step-desc").textContent   = step.description;

    // Prev button
    const prevBtn = _panel.querySelector("#ph-tour-prev");
    prevBtn.disabled = idx === 0;
    prevBtn.style.opacity = idx === 0 ? "0.4" : "1";

    // Next button — đổi thành Finish ở bước cuối
    const nextBtn = _panel.querySelector("#ph-tour-next");
    if (step.isLast || idx === total - 1) {
      nextBtn.textContent = "Hoàn tất ✓";
      nextBtn.className = "ph-tour-btn ph-tour-btn-finish";
      nextBtn.onclick = () => {
        if (_onFinishCb) _onFinishCb();
        PHTour.stop();
      };
    } else {
      nextBtn.textContent = "Tiếp →";
      nextBtn.className = "ph-tour-btn ph-tour-btn-primary";
      nextBtn.onclick = () => PHTour.next();
    }

    // Remove previous target highlight
    document.querySelectorAll(".ph-tour-target").forEach((el) =>
      el.classList.remove("ph-tour-target")
    );

    // Highlight current target
    if (step.selector) {
      let el = document.querySelector(step.selector);
      if (!el && step.fallback) {
        el = document.querySelector(step.fallback);
      }
      if (el) {
        el.classList.add("ph-tour-target");
        if (step.scrollTo !== false) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else {
        console.warn(`[PHTour] Step ${idx}: selector not found — "${step.selector}"`);
      }
    }
  }

  // ─────────────────────────────────────────────
  // PUBLIC API — PHTour
  // ─────────────────────────────────────────────
  const PHTour = {

    /**
     * Chạy một tour tùy chỉnh
     * @param {object[]} steps - mảng các step
     * @param {function} onFinish - callback khi tour kết thúc
     */
    run(steps, onFinish = null) {
      _injectTourStyles();
      _tourSteps  = steps;
      _currentIdx = 0;
      _onFinishCb = onFinish;
      _createPanel();
      _renderStep(0);
      console.info(`[PHTour] Tour bắt đầu — ${steps.length} bước`);
    },

    /**
     * Chạy một tour có sẵn theo tên
     * @param {"teacherOnboarding"|"messagingParents"} tourName
     * @param {function} onFinish
     */
    runBuiltin(tourName, onFinish = null) {
      const steps = BUILTIN_TOURS[tourName];
      if (!steps) {
        console.error(`[PHTour] Không tìm thấy tour: "${tourName}"`);
        console.info("[PHTour] Tours có sẵn:", Object.keys(BUILTIN_TOURS));
        return;
      }
      this.run(steps, onFinish);
    },

    /** Bước tiếp theo */
    next() {
      if (_currentIdx < _tourSteps.length - 1) {
        _currentIdx++;
        _renderStep(_currentIdx);
      }
    },

    /** Bước trước */
    prev() {
      if (_currentIdx > 0) {
        _currentIdx--;
        _renderStep(_currentIdx);
      }
    },

    /** Nhảy đến bước cụ thể */
    goTo(idx) {
      if (idx >= 0 && idx < _tourSteps.length) {
        _currentIdx = idx;
        _renderStep(_currentIdx);
      }
    },

    /** Dừng và xóa tour */
    stop() {
      document.querySelectorAll(".ph-tour-target").forEach((el) =>
        el.classList.remove("ph-tour-target")
      );
      if (_panel) {
        _panel.remove();
        _panel = null;
      }
      _tourSteps  = [];
      _currentIdx = 0;
      console.info("[PHTour] Tour đã dừng.");
    },

    /** Danh sách built-in tours */
    builtinTours: Object.keys(BUILTIN_TOURS),

    version: "1.0.0",
  };

  global.PHTour = PHTour;
  console.info(
    `%c[PHTour v${PHTour.version}] Loaded ✓`,
    "color: #ca5010; font-weight: bold;"
  );
})(window);
