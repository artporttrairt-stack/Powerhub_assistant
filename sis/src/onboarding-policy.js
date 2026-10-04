(function (root) {
  'use strict';

  const STORAGE_KEYS = Object.freeze({
    hubLocale: 'sisPrototypeHubLocale',
    powerTeacherAlreadyKnown: 'sisPrototypePowerTeacherAlreadyKnown',
    powerTeacherDiscoveryPending: 'sisPrototypePowerTeacherDiscoveryPending',
    startPageTourCompleted: 'sisPrototypeStartPageTourCompleted',
    gradeEntryAlreadyKnown: 'sisPrototypeGradeEntryAlreadyKnown',
    displaySettingsOnboardingPending: 'sisPrototypeDisplaySettingsOnboardingPending',
  });

  const HUB_MARKERS = Object.freeze([
    '#neon-app-header-home-link',
    'a#post-newsfeed[href="/"]',
    '#button-post-compose-btn',
  ]);

  const COPY = Object.freeze({
    en: Object.freeze({
      title: 'Would you like to explore PowerTeacher?',
      body: 'A short guided tour explains the main Start Page controls. The tour does not read or store SIS record content.',
      yes: 'Yes',
      later: 'No, later',
      alreadyKnown: 'No, I already know',
      openPowerTeacher: 'Open PowerTeacher from the native Apps menu to continue the guided tour.',
      testLanguage: 'Prototype test language',
      launcher: 'PowerTeacher Guide',
      hideGuide: 'Hide PowerTeacher Guide until reload',
      diagnosticsTitle: 'SIS Start Page prototype check',
      diagnosticsIntro: 'Structural anchors only. No SIS record content is read or stored.',
      start: 'Start available tour',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      exit: 'Exit tour',
      done: 'Done',
      unavailable: 'This target is unavailable on this page. The prototype will not guess a replacement.',
      found: 'FOUND',
      missing: 'MISSING',
      ambiguous: 'AMBIGUOUS',
      mismatch: 'STRUCTURE MISMATCH',
      step: 'Step',
      gradeEntryTitle: 'Would you like to learn how to enter grades in PowerTeacher Pro?',
      gradeEntryBody: 'The assistant can point you to the native PowerTeacher Pro entry point. You remain in control of all gradebook actions.',
      gradeEntryHandoff: 'Select PowerTeacher Pro in the native Navigation menu to continue.',
      gradeEntryUnavailable: 'PowerTeacher Pro could not be identified safely. The prototype will not guess a replacement.',
    }),
    vi: Object.freeze({
      title: 'Bạn có muốn khám phá PowerTeacher không?',
      body: 'Một hướng dẫn ngắn sẽ giới thiệu các chức năng chính của Trang bắt đầu SIS. Hướng dẫn không đọc hoặc lưu nội dung hồ sơ SIS.',
      yes: 'Có',
      later: 'Không, để sau',
      alreadyKnown: 'Không, tôi đã biết',
      openPowerTeacher: 'Mở PowerTeacher từ menu Ứng dụng của hệ thống để tiếp tục hướng dẫn.',
      testLanguage: 'Ngôn ngữ thử nghiệm',
      launcher: 'Hướng dẫn PowerTeacher',
      hideGuide: 'Ẩn Hướng dẫn PowerTeacher đến khi tải lại trang',
      diagnosticsTitle: 'Kiểm tra Trang bắt đầu SIS',
      diagnosticsIntro: 'Chỉ kiểm tra cấu trúc giao diện. Không đọc hoặc lưu nội dung hồ sơ SIS.',
      start: 'Bắt đầu các bước khả dụng',
      close: 'Đóng',
      back: 'Quay lại',
      next: 'Tiếp',
      exit: 'Thoát hướng dẫn',
      done: 'Hoàn tất',
      unavailable: 'Không tìm thấy vị trí tương ứng trên trang này. Trợ lý sẽ không tự chọn vị trí thay thế.',
      found: 'TÌM THẤY',
      missing: 'KHÔNG TÌM THẤY',
      ambiguous: 'KHÔNG DUY NHẤT',
      mismatch: 'CẤU TRÚC KHÔNG KHỚP',
      step: 'Bước',
      gradeEntryTitle: 'Bạn có muốn xem cách nhập điểm trong PowerTeacher Pro không?',
      gradeEntryBody: 'Trợ lý có thể chỉ vị trí mở PowerTeacher Pro trong giao diện gốc. Giáo viên tự quyết định mọi thao tác trong sổ điểm.',
      gradeEntryHandoff: 'Chọn PowerTeacher Pro trong menu Điều hướng của hệ thống để tiếp tục.',
      gradeEntryUnavailable: 'Không thể xác định PowerTeacher Pro một cách an toàn. Trợ lý sẽ không tự chọn vị trí thay thế.',
    }),
  });

  function normalizeHubLocale(lang) {
    const normalized = typeof lang === 'string'
      ? lang.trim().toLowerCase().replace('_', '-')
      : '';
    if (normalized === 'en' || normalized.startsWith('en-')) return 'en';
    if (normalized === 'vi' || normalized.startsWith('vi-')) return 'vi';
    return null;
  }

  function isVerifiedHubSurface({ pathname, count }) {
    if (pathname !== '/') return false;
    return HUB_MARKERS.every((selector) => count(selector) === 1);
  }

  function resolveGuidanceLocale({ hubLocale }) {
    return hubLocale === 'en' || hubLocale === 'vi' ? hubLocale : null;
  }

  function resolveStartPageLocale({ nativeLang, storedHubLocale }) {
    return normalizeHubLocale(nativeLang)
      || resolveGuidanceLocale({ hubLocale: storedHubLocale });
  }

  function getOnboardingCopy(locale) {
    return COPY[locale] || null;
  }

  function resolvePrototypeGuidanceLocale({ hubLocale, testLocale }) {
    const nativeHubLocale = resolveGuidanceLocale({ hubLocale });
    if (nativeHubLocale) return nativeHubLocale;
    return testLocale === 'vi' ? 'vi' : 'en';
  }

  function reduceHubDiscoveryChoice(choice) {
    if (choice === 'yes') {
      return { close: true, startTour: false, persistAlreadyKnown: false, persistDiscoveryPending: true };
    }
    if (choice === 'later') {
      return { close: true, startTour: false, persistAlreadyKnown: false, persistDiscoveryPending: false };
    }
    if (choice === 'already-known') {
      return { close: true, startTour: false, persistAlreadyKnown: true, persistDiscoveryPending: false };
    }
    return { close: false, startTour: false, persistAlreadyKnown: false, persistDiscoveryPending: false };
  }

  function reduceOnboardingChoice(choice) {
    if (choice === 'yes') {
      return { close: true, startTour: true, persistAlreadyKnown: false };
    }
    if (choice === 'later') {
      return { close: true, startTour: false, persistAlreadyKnown: false };
    }
    if (choice === 'already-known') {
      return { close: true, startTour: false, persistAlreadyKnown: true };
    }
    return { close: false, startTour: false, persistAlreadyKnown: false };
  }

  function reduceGradeEntryChoice(choice) {
    if (choice === 'yes') {
      return { close: true, showHandoff: true, persistAlreadyKnown: false };
    }
    if (choice === 'later') {
      return { close: true, showHandoff: false, persistAlreadyKnown: false };
    }
    if (choice === 'already-known') {
      return { close: true, showHandoff: false, persistAlreadyKnown: true };
    }
    return { close: false, showHandoff: false, persistAlreadyKnown: false };
  }

  function shouldOfferGradeEntry({ tourEntryMode, gradeEntryAlreadyKnown }) {
    return tourEntryMode === 'first-time' && gradeEntryAlreadyKnown !== true;
  }

  function shouldAutoRunStartPageTour({ alreadyKnown, startPageTourCompleted }) {
    return alreadyKnown !== true && startPageTourCompleted !== true;
  }

  function shouldAutoShowHubDiscovery({ alreadyKnown, startPageTourCompleted }) {
    return alreadyKnown !== true && startPageTourCompleted !== true;
  }

  const api = Object.freeze({
    STORAGE_KEYS,
    HUB_MARKERS,
    COPY,
    normalizeHubLocale,
    isVerifiedHubSurface,
    resolveGuidanceLocale,
    resolveStartPageLocale,
    getOnboardingCopy,
    resolvePrototypeGuidanceLocale,
    reduceHubDiscoveryChoice,
    reduceOnboardingChoice,
    reduceGradeEntryChoice,
    shouldOfferGradeEntry,
    shouldAutoRunStartPageTour,
    shouldAutoShowHubDiscovery,
  });

  root.SIS_POWERTEACHER_ONBOARDING_POLICY = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
