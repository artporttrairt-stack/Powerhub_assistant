/* Generated from Language_Intro_Robot_Standalone_1.0.0-verified.zip. */
(function (root) {
  "use strict";

  const hub = root.PSQM ??= {};
  if (hub.languageIntroCopy) return;

  const ASSISTANT_LANGUAGES = Object.freeze(["en", "vi"]);

  const REFERENCE_LABELS = Object.freeze({
    en: Object.freeze({ en: "English", vi: "Tiếng Anh" }),
    vi: Object.freeze({ en: "Vietnamese", vi: "Tiếng Việt" }),
  });

  const COPY = Object.freeze({
    welcome: Object.freeze({
      titleEn: "Hi! I’m your Hub Assistant.",
      titleVi: "Chào bạn! Mình là Hub Assistant.",
      bodyEn: "First, let’s check your PowerHub language. Nice and easy.",
      bodyVi: "Đầu tiên, mình kiểm tra ngôn ngữ PowerHub nhé. Nhẹ nhàng thôi.",
    }),
    pointAvatar: Object.freeze({
      titleEn: "Open your account menu",
      titleVi: "Mở menu tài khoản",
      bodyEn: "Select your name to open the menu.",
      bodyVi: "Nhấn vào tên của bạn để mở menu.",
    }),
    pointLanguageSettings: Object.freeze({
      titleEn: "Open Language & locale settings",
      titleVi: "Mở cài đặt Ngôn ngữ và khu vực",
      bodyEn: "Choose Language & locale.",
      bodyVi: "Chọn Ngôn ngữ và khu vực.",
    }),
    waitingReference: Object.freeze({
      titleEn: "Checking your PowerHub language…",
      titleVi: "Đang kiểm tra ngôn ngữ PowerHub…",
      bodyEn: "Keep this window open for a moment.",
      bodyVi: "Giữ cửa sổ này mở một chút nhé.",
    }),
    referenceFound: Object.freeze({
      titleEn: "PowerHub language found",
      titleVi: "Đã tìm thấy ngôn ngữ PowerHub",
      bodyEn: "PowerHub is set to {referenceEn}. Use {referenceEn} for the Assistant too?",
      bodyVi: "PowerHub đang dùng {referenceVi}. Dùng {referenceVi} cho Assistant luôn nhé?",
    }),
    referenceMissing: Object.freeze({
      titleEn: "I couldn’t read the PowerHub language",
      titleVi: "Mình chưa đọc được ngôn ngữ PowerHub",
      bodyEn: "Keep this window open and try again, or choose the Assistant language yourself.",
      bodyVi: "Giữ cửa sổ này mở rồi thử lại, hoặc tự chọn ngôn ngữ cho Assistant.",
    }),
    chooseAssistant: Object.freeze({
      titleEn: "Choose the Assistant language",
      titleVi: "Chọn ngôn ngữ cho Assistant",
      bodyEn: "This changes only Hub Assistant, not PowerHub.",
      bodyVi: "Lựa chọn này chỉ đổi Hub Assistant, không đổi PowerHub.",
    }),
    saving: Object.freeze({
      titleEn: "Saving…",
      titleVi: "Đang lưu…",
      bodyEn: "Just a moment.",
      bodyVi: "Chờ một chút nhé.",
    }),
    closeLanguageSettings: Object.freeze({
      titleEn: "Language saved",
      titleVi: "Đã lưu ngôn ngữ",
      bodyEn: "Close this window and we’ll keep going.",
      bodyVi: "Đóng cửa sổ này nhé, rồi mình đi tiếp.",
    }),
    error: Object.freeze({
      titleEn: "Language wasn’t saved",
      titleVi: "Chưa lưu được ngôn ngữ",
      bodyEn: "Nothing changed. Please try again.",
      bodyVi: "Chưa có gì thay đổi. Thử lại nhé.",
    }),
    minimized: Object.freeze({
      labelEn: "Restore language guide",
      labelVi: "Mở lại hướng dẫn ngôn ngữ",
    }),
    languageChoices: Object.freeze({
      en: Object.freeze({ en: "Use English", vi: "Dùng Tiếng Anh" }),
      vi: Object.freeze({ en: "Use Vietnamese", vi: "Dùng Tiếng Việt" }),
    }),
    actions: Object.freeze({
      start: Object.freeze({ en: "Start", vi: "Bắt đầu" }),
      defer: Object.freeze({ en: "Later", vi: "Để sau" }),
      retry: Object.freeze({ en: "Retry", vi: "Thử lại" }),
      minimize: Object.freeze({ en: "Minimize", vi: "Thu nhỏ" }),
      restore: Object.freeze({ en: "Restore", vi: "Mở lại" }),
      useReference: Object.freeze({ en: "Yes, use this language", vi: "Có, dùng ngôn ngữ này" }),
    }),
  });

  function isSupportedLanguage(value) {
    return ASSISTANT_LANGUAGES.includes(value);
  }

  function bilingualLabel(copy) {
    return `${copy.en} / ${copy.vi}`;
  }

  function format(template, values) {
    return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
  }

  hub.languageIntroCopy = Object.freeze({
    ASSISTANT_LANGUAGES,
    REFERENCE_LABELS,
    COPY,
    isSupportedLanguage,
    bilingualLabel,
    format,
  });
})(globalThis);
