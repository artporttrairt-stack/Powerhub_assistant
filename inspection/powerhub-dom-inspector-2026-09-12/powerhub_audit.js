/**
 * ============================================================
 * POWERHUB AUDIT ENGINE
 * File: powerhub_audit.js
 * Chức năng: Audit toàn bộ cấu trúc trang PowerHub
 *            Xuất báo cáo JSON + HTML
 * ============================================================
 */

(function (global) {
  "use strict";

  // ─────────────────────────────────────────────
  // AUDIT RULES — danh sách kiểm tra
  // ─────────────────────────────────────────────
  const AUDIT_RULES = [
    {
      id: "has-page-header",
      name: "Page Header tồn tại",
      check: () => !!document.querySelector('[data-automation-id="pageHeader"]'),
      severity: "warning",
      hint: "PowerHub nên có hero/header section rõ ràng để định hướng người dùng",
    },
    {
      id: "has-navigation",
      name: "Navigation menu tồn tại",
      check: () => !!document.querySelector('[role="navigation"]'),
      severity: "error",
      hint: "Không tìm thấy navigation. Giáo viên sẽ không thể điều hướng.",
    },
    {
      id: "has-search",
      name: "Search box tồn tại",
      check: () => !!document.querySelector('.ms-SearchBox, [placeholder*="search" i], [aria-label*="search" i]'),
      severity: "info",
      hint: "Search box giúp giáo viên tìm nội dung nhanh hơn",
    },
    {
      id: "has-webparts",
      name: "Có ít nhất 1 WebPart",
      check: () => document.querySelectorAll('[data-sp-feature-tag*="webPart"]').length >= 1,
      severity: "error",
      hint: "Trang trống. Cần thêm WebPart nội dung.",
    },
    {
      id: "webpart-count-optimal",
      name: "Số WebPart hợp lý (≤ 12)",
      check: () => document.querySelectorAll('[data-sp-feature-tag*="webPart"]').length <= 12,
      severity: "warning",
      hint: "Quá nhiều WebPart có thể gây loãng thông tin cho giáo viên",
    },
    {
      id: "images-have-alt",
      name: "Ảnh có alt text",
      check: () => {
        const imgs = [...document.querySelectorAll("img")];
        if (imgs.length === 0) return true;
        const missing = imgs.filter((img) => !img.alt || img.alt.trim() === "");
        return missing.length === 0;
      },
      severity: "warning",
      hint: "Một số ảnh thiếu alt text — ảnh hưởng accessibility",
    },
    {
      id: "links-have-text",
      name: "Links có text rõ ràng",
      check: () => {
        const links = [...document.querySelectorAll("a[href]")];
        const bad = links.filter(
          (a) => !a.innerText.trim() && !a.getAttribute("aria-label")
        );
        return bad.length === 0;
      },
      severity: "warning",
      hint: "Một số link không có text — khó hiểu với giáo viên mới",
    },
    {
      id: "no-broken-links",
      name: "Không có link trỏ #",
      check: () => {
        const links = [...document.querySelectorAll('a[href="#"]')];
        return links.length === 0;
      },
      severity: "info",
      hint: "Có link placeholder chưa được cập nhật URL thực",
    },
    {
      id: "page-has-title",
      name: "Trang có tiêu đề",
      check: () => !!document.title && document.title.trim() !== "",
      severity: "error",
      hint: "Trang không có tiêu đề — ảnh hưởng navigation và SEO nội bộ",
    },
    {
      id: "mobile-viewport",
      name: "Viewport meta tồn tại",
      check: () => !!document.querySelector('meta[name="viewport"]'),
      severity: "warning",
      hint: "Thiếu viewport meta — trang có thể hiển thị kém trên mobile",
    },
    {
      id: "news-webpart",
      name: "Có News WebPart",
      check: () =>
        !!document.querySelector(
          '[data-sp-web-part-id*="news"], [data-automation-id*="news"]'
        ),
      severity: "info",
      hint: "News WebPart giúp giáo viên cập nhật thông báo trường",
    },
    {
      id: "quick-links",
      name: "Có Quick Links",
      check: () =>
        !!document.querySelector(
          '[data-sp-web-part-id*="quickLinks"], [data-automation-id*="quickLink"]'
        ),
      severity: "info",
      hint: "Quick Links tăng khả năng điều hướng nhanh",
    },
    {
      id: "text-contrast-basic",
      name: "Không có text màu trắng trên nền trắng",
      check: () => {
        const texts = [...document.querySelectorAll("p, h1, h2, h3, span, a")];
        const bad = texts.filter((el) => {
          const s = getComputedStyle(el);
          return s.color === "rgb(255, 255, 255)" && s.backgroundColor === "rgb(255, 255, 255)";
        });
        return bad.length === 0;
      },
      severity: "error",
      hint: "Có text không hiển thị được do màu trùng nền",
    },
  ];

  // ─────────────────────────────────────────────
  // AUDIT FUNCTIONS
  // ─────────────────────────────────────────────

  function _runRules() {
    return AUDIT_RULES.map((rule) => {
      let passed = false;
      let errorMsg = null;
      try {
        passed = rule.check();
      } catch (e) {
        errorMsg = e.message;
      }
      return {
        id: rule.id,
        name: rule.name,
        passed,
        severity: passed ? "pass" : rule.severity,
        hint: passed ? null : rule.hint,
        error: errorMsg || null,
      };
    });
  }

  function _collectWebParts() {
    return [...document.querySelectorAll('[data-sp-feature-tag*="webPart"]')].map((el) => ({
      title:
        (el.querySelector('[data-automation-id="webPartTitle"]') || {}).innerText || "(no title)",
      id: el.getAttribute("data-sp-web-part-id") || null,
      visible: getComputedStyle(el).display !== "none",
      rect: (() => {
        const r = el.getBoundingClientRect();
        return { top: Math.round(r.top + scrollY), height: Math.round(r.height) };
      })(),
    }));
  }

  function _collectLinks() {
    return [...document.querySelectorAll("a[href]")]
      .filter((a) => a.href && !a.href.startsWith("javascript"))
      .map((a) => ({
        text: a.innerText.trim().slice(0, 80),
        href: a.href,
        external: !a.href.startsWith(location.origin),
        hasIcon: !!a.querySelector("img, svg, i"),
      }))
      .slice(0, 50);
  }

  function _collectImages() {
    return [...document.querySelectorAll("img")].map((img) => ({
      src: img.src.slice(0, 120),
      alt: img.alt || null,
      hasAlt: !!img.alt,
      width: img.naturalWidth,
      height: img.naturalHeight,
      visible: getComputedStyle(img).display !== "none",
    }));
  }

  // ─────────────────────────────────────────────
  // HTML REPORT GENERATOR
  // ─────────────────────────────────────────────
  function _generateHtmlReport(auditData) {
    const { pageInfo, rules, webParts, score } = auditData;
    const passed = rules.filter((r) => r.passed).length;
    const total = rules.length;
    const errors = rules.filter((r) => r.severity === "error");
    const warnings = rules.filter((r) => r.severity === "warning");
    const infos = rules.filter((r) => !r.passed && r.severity === "info");

    const ruleRows = rules
      .map((r) => {
        const icon = r.passed ? "✅" : r.severity === "error" ? "❌" : r.severity === "warning" ? "⚠️" : "ℹ️";
        const rowClass = r.passed ? "" : r.severity === "error" ? 'style="background:#fff0f0"' : 'style="background:#fffbe6"';
        return `<tr ${rowClass}>
          <td>${icon}</td>
          <td>${r.name}</td>
          <td>${r.severity.toUpperCase()}</td>
          <td style="color:#555">${r.hint || "—"}</td>
        </tr>`;
      })
      .join("\n");

    const webPartRows = webParts
      .map((wp) => `<tr>
        <td>${wp.title}</td>
        <td style="font-size:11px;color:#888">${wp.id || "—"}</td>
        <td>${wp.visible ? "✅" : "❌"}</td>
        <td>${wp.rect.top}px</td>
      </tr>`)
      .join("\n");

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>PowerHub Audit Report</title>
<style>
  body { font-family: "Segoe UI", sans-serif; max-width: 960px; margin: 40px auto; color: #222; }
  h1 { color: #0078d4; }
  h2 { color: #333; border-bottom: 2px solid #0078d4; padding-bottom: 6px; }
  .score { font-size: 3rem; font-weight: 700; color: ${score >= 80 ? "#107c10" : score >= 60 ? "#ff8c00" : "#d13438"}; }
  .meta { background: #f3f9ff; border-left: 4px solid #0078d4; padding: 12px 16px; border-radius: 4px; margin: 16px 0; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th { background: #0078d4; color: #fff; padding: 8px 12px; text-align: left; }
  td { padding: 8px 12px; border-bottom: 1px solid #eee; vertical-align: top; }
  .badge-error   { background: #d13438; color: #fff; border-radius: 3px; padding: 2px 6px; font-size: 11px; }
  .badge-warning { background: #ff8c00; color: #fff; border-radius: 3px; padding: 2px 6px; font-size: 11px; }
  .badge-info    { background: #0078d4; color: #fff; border-radius: 3px; padding: 2px 6px; font-size: 11px; }
  footer { color: #aaa; font-size: 12px; margin-top: 40px; }
</style>
</head>
<body>
<h1>🔍 PowerHub DOM Audit Report</h1>
<div class="meta">
  <strong>URL:</strong> ${pageInfo.url}<br/>
  <strong>Tiêu đề:</strong> ${pageInfo.title}<br/>
  <strong>Thời gian:</strong> ${pageInfo.timestamp}<br/>
  <strong>Viewport:</strong> ${pageInfo.viewport.width} × ${pageInfo.viewport.height}
</div>

<h2>Điểm tổng thể</h2>
<div class="score">${score}/100</div>
<p>${passed}/${total} quy tắc đạt &nbsp;|&nbsp;
  <span class="badge-error">${errors.length} lỗi</span> &nbsp;
  <span class="badge-warning">${warnings.length} cảnh báo</span> &nbsp;
  <span class="badge-info">${infos.length} gợi ý</span>
</p>

<h2>Kết quả kiểm tra</h2>
<table>
  <tr><th></th><th>Quy tắc</th><th>Mức</th><th>Gợi ý sửa</th></tr>
  ${ruleRows}
</table>

<h2>WebParts trên trang (${webParts.length})</h2>
<table>
  <tr><th>Tiêu đề</th><th>WebPart ID</th><th>Visible</th><th>Vị trí Y</th></tr>
  ${webPartRows}
</table>

<footer>Tạo bởi PHAudit v1.0 — PowerHub DOM Inspector Skill — VAS 2026</footer>
</body>
</html>`;
  }

  // ─────────────────────────────────────────────
  // PUBLIC API — PHAudit
  // ─────────────────────────────────────────────
  const PHAudit = {

    /**
     * Chạy audit toàn trang
     * @param {object} options
     * @param {boolean} options.showReport - Mở report trong tab mới (default false)
     * @param {boolean} options.logConsole - In kết quả ra console (default true)
     * @returns {object} auditData
     */
    run({ showReport = false, logConsole = true } = {}) {
      const rules     = _runRules();
      const webParts  = _collectWebParts();
      const links     = _collectLinks();
      const images    = _collectImages();
      const pageInfo  = {
        url: location.href,
        title: document.title,
        timestamp: new Date().toISOString(),
        viewport: { width: innerWidth, height: innerHeight },
        webPartCount: webParts.length,
        linkCount: links.length,
        imageCount: images.length,
      };

      // Tính điểm
      const passed  = rules.filter((r) => r.passed).length;
      const errors  = rules.filter((r) => !r.passed && r.severity === "error").length;
      const warns   = rules.filter((r) => !r.passed && r.severity === "warning").length;
      const rawScore = (passed / rules.length) * 100 - errors * 8 - warns * 3;
      const score   = Math.max(0, Math.min(100, Math.round(rawScore)));

      const auditData = { pageInfo, rules, webParts, links, images, score };

      if (logConsole) {
        const emoji = score >= 80 ? "🟢" : score >= 60 ? "🟡" : "🔴";
        console.group(`[PHAudit] ${emoji} Score: ${score}/100 — ${pageInfo.url}`);
        rules.forEach((r) => {
          const icon = r.passed ? "✅" : r.severity === "error" ? "❌" : "⚠️";
          console.log(`  ${icon} ${r.name}${r.hint ? ` — ${r.hint}` : ""}`);
        });
        console.groupEnd();
      }

      if (showReport) {
        const html = _generateHtmlReport(auditData);
        const blob = new Blob([html], { type: "text/html" });
        const url  = URL.createObjectURL(blob);
        window.open(url, "_blank");
      }

      return auditData;
    },

    /**
     * Xuất báo cáo HTML string
     * @returns {string}
     */
    exportHtml() {
      const data = this.run({ logConsole: false });
      return _generateHtmlReport(data);
    },

    /**
     * Xuất JSON audit
     * @returns {string}
     */
    exportJson() {
      const data = this.run({ logConsole: false });
      return JSON.stringify(data, null, 2);
    },

    /**
     * Download report dưới dạng file HTML
     */
    download() {
      const html = this.exportHtml();
      const blob = new Blob([html], { type: "text/html" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `powerhub_audit_${Date.now()}.html`;
      a.click();
      URL.revokeObjectURL(url);
      console.info("[PHAudit] Report đã được tải xuống.");
    },

    version: "1.0.0",
  };

  global.PHAudit = PHAudit;
  console.info(
    `%c[PHAudit v${PHAudit.version}] Loaded ✓`,
    "color: #8764b8; font-weight: bold;"
  );
})(window);
