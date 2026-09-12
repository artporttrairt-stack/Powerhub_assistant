/**
 * ============================================================
 * POWERHUB SKILL LOADER — Bookmarklet + Agent Injector
 * File: powerhub_loader.js
 * 
 * Cách dùng:
 *   1. Bookmarklet: Copy toàn bộ file này vào bookmark URL
 *   2. Agent inject: Agent gọi script này vào browser context
 *   3. Console: Paste vào DevTools Console khi đang ở PowerHub
 * ============================================================
 */

(function () {
  "use strict";

  // ─────────────────────────────────────────────
  // CONFIG
  // ─────────────────────────────────────────────
  const CONFIG = {
    // Base URL nơi các skill files được host
    // Trong thực tế: thay bằng SharePoint/CDN URL của trường
    baseUrl: "https://xcleducation-my.sharepoint.com/sites/powerhub-skill/",

    // Thứ tự load — quan trọng: inspector phải load trước
    scripts: [
      "powerhub_inspector.js",
      "powerhub_highlight.js",
      "powerhub_audit.js",
      "powerhub_tour.js",
    ],

    // Allowed domains
    allowedDomains: [
      "sharepoint.com",
      "vas.edu.vn",
      "localhost",
    ],

    version: "1.0.0",
  };

  // ─────────────────────────────────────────────
  // SECURITY CHECK
  // ─────────────────────────────────────────────
  const allowed = CONFIG.allowedDomains.some((d) =>
    location.hostname.endsWith(d)
  );

  if (!allowed) {
    alert(
      `[PowerHub Skill] ⚠️ Domain không được phép:\n${location.hostname}\n\nSkill chỉ chạy trên: ${CONFIG.allowedDomains.join(", ")}`
    );
    return;
  }

  // ─────────────────────────────────────────────
  // LOAD SCRIPTS SEQUENTIALLY
  // ─────────────────────────────────────────────

  /**
   * Load một script từ URL, trả về Promise
   */
  function loadScript(url) {
    return new Promise((resolve, reject) => {
      // Kiểm tra đã load chưa
      const existing = document.querySelector(`script[data-ph-src="${url}"]`);
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = url;
      script.setAttribute("data-ph-src", url);
      script.onload  = resolve;
      script.onerror = () => reject(new Error(`Không load được: ${url}`));
      document.head.appendChild(script);
    });
  }

  /**
   * Load tất cả scripts theo thứ tự
   */
  async function loadAll() {
    const urls = CONFIG.scripts.map((s) => CONFIG.baseUrl + s);

    console.group(
      `%c[PHLoader v${CONFIG.version}] Đang tải PowerHub Skill...`,
      "color: #0078d4; font-weight: bold; font-size: 13px;"
    );

    for (const url of urls) {
      try {
        await loadScript(url);
        console.log(`  ✅ ${url.split("/").pop()}`);
      } catch (err) {
        console.error(`  ❌ ${err.message}`);
      }
    }

    console.groupEnd();
    _onAllLoaded();
  }

  // ─────────────────────────────────────────────
  // INLINE FALLBACK — Nếu không có host, dùng inline
  // Khi chạy từ console/bookmarklet, inject code trực tiếp
  // ─────────────────────────────────────────────

  /**
   * Kiểm tra xem skill đã được load chưa
   */
  function _isSkillLoaded() {
    return (
      typeof window.PHInspector !== "undefined" &&
      typeof window.PHHighlight !== "undefined" &&
      typeof window.PHAudit     !== "undefined" &&
      typeof window.PHTour      !== "undefined"
    );
  }

  // ─────────────────────────────────────────────
  // AFTER ALL LOADED — Hiển thị menu launcher
  // ─────────────────────────────────────────────
  function _onAllLoaded() {
    if (!_isSkillLoaded()) {
      console.warn(
        "[PHLoader] Một số module chưa load. Kiểm tra lại baseUrl hoặc dùng inline mode."
      );
    }

    _injectLauncher();

    console.info(
      `%c[PHLoader] ✓ PowerHub Skill sẵn sàng!\n` +
      `%c  PHInspector  — inspect DOM\n` +
      `  PHHighlight  — flash / spotlight / scroll\n` +
      `  PHAudit      — audit toàn trang\n` +
      `  PHTour       — guided tour\n\n` +
      `  Ví dụ:\n` +
      `  PHInspector.getPageInfo()\n` +
      `  PHHighlight.flash('[role="navigation"]')\n` +
      `  PHAudit.run({ showReport: true })\n` +
      `  PHTour.runBuiltin("teacherOnboarding")`,
      "color: #107c10; font-weight: bold; font-size: 13px;",
      "color: #333; font-size: 12px;"
    );
  }

  // ─────────────────────────────────────────────
  // LAUNCHER PANEL — Mini floating menu
  // ─────────────────────────────────────────────
  const LAUNCHER_ID = "ph-launcher";

  function _injectLauncher() {
    if (document.getElementById(LAUNCHER_ID)) return;

    const style = document.createElement("style");
    style.textContent = `
      #ph-launcher {
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 999999;
        font-family: "Segoe UI", sans-serif;
      }
      #ph-launcher-btn {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #0078d4;
        color: #fff;
        border: none;
        font-size: 22px;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, background 0.2s;
      }
      #ph-launcher-btn:hover { background: #005a9e; transform: scale(1.08); }
      #ph-launcher-menu {
        display: none;
        position: absolute;
        bottom: 56px;
        left: 0;
        background: #fff;
        border-radius: 10px;
        box-shadow: 0 8px 28px rgba(0,0,0,0.2);
        overflow: hidden;
        border: 1px solid #e0e0e0;
        min-width: 210px;
        animation: ph-fadein 0.2s ease;
      }
      #ph-launcher-menu.open { display: block; }
      .ph-menu-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 11px 16px;
        cursor: pointer;
        font-size: 13px;
        color: #222;
        border: none;
        background: none;
        width: 100%;
        text-align: left;
        font-family: "Segoe UI", sans-serif;
        transition: background 0.15s;
      }
      .ph-menu-item:hover { background: #f0f6ff; color: #0078d4; }
      .ph-menu-item .ph-menu-icon { font-size: 16px; width: 20px; text-align: center; }
      .ph-menu-divider { height: 1px; background: #eee; margin: 4px 0; }
      .ph-menu-header {
        padding: 10px 16px 6px;
        font-size: 11px;
        color: #888;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    `;
    document.head.appendChild(style);

    const launcher = document.createElement("div");
    launcher.id = LAUNCHER_ID;
    launcher.innerHTML = `
      <div id="ph-launcher-menu">
        <div class="ph-menu-header">PowerHub Skill</div>
        <button class="ph-menu-item" data-action="page-info">
          <span class="ph-menu-icon">📄</span> Thông tin trang
        </button>
        <button class="ph-menu-item" data-action="webparts">
          <span class="ph-menu-icon">🧩</span> Xem WebParts
        </button>
        <button class="ph-menu-item" data-action="navigation">
          <span class="ph-menu-icon">🗂️</span> Xem Navigation
        </button>
        <div class="ph-menu-divider"></div>
        <button class="ph-menu-item" data-action="flash-nav">
          <span class="ph-menu-icon">✨</span> Flash Navigation
        </button>
        <button class="ph-menu-item" data-action="spotlight-header">
          <span class="ph-menu-icon">🔦</span> Spotlight Header
        </button>
        <div class="ph-menu-divider"></div>
        <button class="ph-menu-item" data-action="audit">
          <span class="ph-menu-icon">🔍</span> Audit trang
        </button>
        <button class="ph-menu-item" data-action="audit-report">
          <span class="ph-menu-icon">📊</span> Xuất báo cáo HTML
        </button>
        <div class="ph-menu-divider"></div>
        <button class="ph-menu-item" data-action="tour-onboard">
          <span class="ph-menu-icon">🗺️</span> Tour giáo viên mới
        </button>
        <button class="ph-menu-item" data-action="tour-messaging">
          <span class="ph-menu-icon">💬</span> Tour gửi tin nhắn
        </button>
        <div class="ph-menu-divider"></div>
        <button class="ph-menu-item" data-action="clear">
          <span class="ph-menu-icon">🧹</span> Xóa hiệu ứng
        </button>
        <button class="ph-menu-item" data-action="unload">
          <span class="ph-menu-icon">❌</span> Tắt Skill
        </button>
      </div>
      <button id="ph-launcher-btn" title="PowerHub Skill">🔍</button>
    `;
    document.body.appendChild(launcher);

    // Toggle menu
    launcher.querySelector("#ph-launcher-btn").onclick = () => {
      const menu = launcher.querySelector("#ph-launcher-menu");
      menu.classList.toggle("open");
    };

    // Actions
    launcher.querySelector("#ph-launcher-menu").onclick = (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      launcher.querySelector("#ph-launcher-menu").classList.remove("open");

      const action = btn.getAttribute("data-action");
      _handleAction(action);
    };

    // Click outside đóng menu
    document.addEventListener("click", (e) => {
      if (!launcher.contains(e.target)) {
        launcher
          .querySelector("#ph-launcher-menu")
          .classList.remove("open");
      }
    });
  }

  function _handleAction(action) {
    switch (action) {
      case "page-info":
        console.table(PHInspector.getPageInfo());
        break;
      case "webparts":
        console.table(PHInspector.getWebParts());
        break;
      case "navigation":
        console.table(PHInspector.getNavigation());
        break;
      case "flash-nav":
        PHHighlight.flash('[role="navigation"]', 4);
        break;
      case "spotlight-header":
        PHHighlight.spotlight(
          '[data-automation-id="pageHeader"], #spSiteHeader, .od-TopBar',
          4000
        );
        break;
      case "audit":
        PHAudit.run({ logConsole: true });
        break;
      case "audit-report":
        PHAudit.download();
        break;
      case "tour-onboard":
        PHTour.runBuiltin("teacherOnboarding");
        break;
      case "tour-messaging":
        PHTour.runBuiltin("messagingParents");
        break;
      case "clear":
        PHHighlight.clear();
        PHTour.stop();
        break;
      case "unload":
        PHHighlight.clear();
        PHTour.stop();
        document.getElementById(LAUNCHER_ID)?.remove();
        console.info("[PHLoader] Skill đã được gỡ khỏi trang.");
        break;
    }
  }

  // ─────────────────────────────────────────────
  // ENTRY POINT
  // ─────────────────────────────────────────────

  // Nếu đã load sẵn (inline mode) — chỉ hiện launcher
  if (_isSkillLoaded()) {
    console.info("[PHLoader] Skill đã sẵn sàng (inline mode).");
    _injectLauncher();
    _onAllLoaded();
  } else {
    // Load từ remote
    loadAll();
  }

  // Export
  window.PHLoader = {
    reload: loadAll,
    version: CONFIG.version,
  };
})();


// ─────────────────────────────────────────────
// BOOKMARKLET VERSION (minified — dùng để tạo bookmark)
// Copy toàn bộ dòng dưới đây vào URL của bookmark
// ─────────────────────────────────────────────
/*
javascript:(function(){var s=document.createElement('script');s.src='https://xcleducation-my.sharepoint.com/sites/powerhub-skill/powerhub_loader.js';s.onload=function(){console.info('[PHLoader] Loaded via bookmarklet')};document.head.appendChild(s);})();
*/
