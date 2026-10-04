(() => {
  "use strict";

  const hub = globalThis.PSQM ??= {};
  const accountIdentities = new WeakMap();
  let identitySettings = { nameDisplayMode: "auto" };

  const ACCOUNT_CLASS = "psqm-account-link";
  const DIRECT_DISPLAY_CLASS = "psqm-direct-display-name";
  const PERSON_DISPLAY_CLASS = "psqm-person-display-name";
  const DIRECT_ROW_CLASS = "psqm-direct-row";
  const DIRECT_HIT_ROW_CLASS = "psqm-direct-hit-row";
  const DIRECT_ADD_CLASS = "psqm-direct-add";
  const NAME_ATTR = "data-psqm-name";
  const DETAIL_ATTR = "data-psqm-detail";
  const CATEGORY_ATTR = "data-psqm-category";
  const CONTACT_ATTR = "data-psqm-contact";
  const CONTACT_OF_NATIVE_ATTR = "data-psqm-contact-of-native";
  const CONTACT_OF_DISPLAY_ATTR = "data-psqm-contact-of-display";
  const GROUP_NAME_ATTR = "data-psqm-group-name";
  const ORIGINAL_DETAIL_ATTR = "data-psqm-original-detail";
  const STUDENT_CLASS_DETAIL_CLASS = "psqm-student-class-detail";
  const GROUP_CHAT_DIALOG_CLASS = "psqm-group-chat-dialog";
  const GROUP_CHAT_COLUMNS_CLASS = "psqm-group-chat-columns";
  const GROUP_CHAT_SOURCE_CLASS = "psqm-group-chat-source-pane";
  const GROUP_CHAT_SELECTED_CLASS = "psqm-group-chat-selected-pane";
  const GROUP_CHAT_TOOLBAR_CLASS = "psqm-group-chat-toolbar";
  const GROUP_CHAT_LIST_CLASS = "psqm-group-chat-member-list";
  const GROUP_CHAT_ROW_CLASS = "psqm-group-chat-member-row";
  const GROUP_CHAT_FOOTER_CLASS = "psqm-group-chat-footer";
  const GROUP_CHAT_AGGREGATE_CLASS = "psqm-group-chat-aggregate";
  const GROUP_CHAT_AGGREGATE_ROW_CLASS = "psqm-group-chat-aggregate-row";
  const GROUP_CHAT_AGGREGATE_ADD_CLASS = "psqm-group-chat-aggregate-add";
  const GROUP_CHAT_NATIVE_NAME_CLASS = "psqm-group-chat-native-name";
  const GROUP_CHAT_NATIVE_COLLAPSED_CLASS = "psqm-group-chat-native-collapsed";
  const GROUP_CHAT_LOADING_CLASS = "psqm-group-chat-loading";
  const GROUP_CHAT_PAGE_SIZE_ATTR = "data-psqm-page-size";
  const GROUP_NAME_SELECTOR = "h1, h2, h3, h4, h5, h6, span, p, div, a, button, [role='heading'], [role='link'], [role='listitem']";
  const CLASS_CODE_CHAR_SOURCE = String.raw`[\p{L}\p{N}_-]`;
  const CLASS_CODE_TOKEN_SOURCE = `${CLASS_CODE_CHAR_SOURCE}+`;
  const CLASS_CODE_TRAILER_MARKER = new RegExp(
    `(?:\\((?=${CLASS_CODE_CHAR_SOURCE}*\\p{L})(?=${CLASS_CODE_CHAR_SOURCE}*\\p{N})${CLASS_CODE_TOKEN_SOURCE}(?:\\s*[-–—]\\s*(?:CAP|CAPI|CEP))?\\)|\\s[-–—]\\s*(?=${CLASS_CODE_CHAR_SOURCE}*\\p{L})(?=${CLASS_CODE_CHAR_SOURCE}*\\p{N})${CLASS_CODE_TOKEN_SOURCE}(?:\\s*[-–—]\\s*(?:CAP|CAPI|CEP))?)\\s*$`,
    "iu"
  );
  const CLASS_CODE_LEADING_MARKER = new RegExp(
    `^(?=${CLASS_CODE_CHAR_SOURCE}*\\p{L})(?=${CLASS_CODE_CHAR_SOURCE}*\\p{N})${CLASS_CODE_TOKEN_SOURCE}\\s*[-–—]\\s+`,
    "iu"
  );
  const GROUP_NAME_MARKER = /\bP\d+\b/iu;
  const CLASS_PROGRAM_ATTR = "data-psqm-class-program";
  const GROUP_DISPLAY_ATTR = "data-psqm-group-display";
  const CLASS_PERIOD_SOURCE = String.raw`P\d+(?:\s*[-–—]\s*P?\d+)?`;
  const CLASS_SCHEDULE_PART_SOURCE = `${CLASS_PERIOD_SOURCE}(?:\\s*\\([^()]*\\))?`;
  const CLASS_SCHEDULE_SOURCE = `${CLASS_SCHEDULE_PART_SOURCE}(?:\\s*[,;/+&]\\s*${CLASS_SCHEDULE_PART_SOURCE})*`;
  const CLASS_SCHEDULE_PATTERN = new RegExp(`^${CLASS_SCHEDULE_SOURCE}$`, "iu");
  const CLASS_NATIVE_LABEL_PATTERN = new RegExp(`^(.+?)\\s*[-–—]\\s*(${CLASS_SCHEDULE_SOURCE})\\s*[-–—]\\s*(.+)$`, "iu");
  const CLASS_COMPACT_LABEL_PATTERN = new RegExp(`^(${CLASS_CODE_TOKEN_SOURCE})\\s*[-–—]\\s*(.+?)\\s*[-–—]\\s*(${CLASS_SCHEDULE_SOURCE})$`, "iu");
  const TOAST_ID = "psqm-toast";
  const NATIVE_ATTRIBUTE_PREFIX = "data-psqm-native-";
  const NATIVE_ATTRIBUTES = ["role", "title", "aria-label", "aria-checked", "tabindex"];
  const POST_TITLE_HELPER_ID = "psqm-post-title-helper";
  const POST_TITLE_MONTHS = Object.freeze([
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ]);

  let scanTimer = null;
  let globalScanRunning = false;
  const domWaiters = new Set();
  let openingMessage = false;
  let activeConversationClassCode = "";
  let activeGroupChatClassCode = "";
  const groupChatStates = new WeakMap();
  const studentClassCodesByIdentity = new Map();

  const tr = (key, vars = {}) => hub.i18n?.t?.(key, vars) || key;

  const RELATION_PATTERNS = [
    /^Contact of\s+(.+)$/iu,
    /^Người liên hệ của\s+(.+)$/iu,
    /^Liên hệ của\s+(.+)$/iu,
    /^Phụ huynh của\s+(.+)$/iu
  ];

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function matchText(value) {
    return cleanText(value).normalize("NFC").toLowerCase();
  }

  function foldedName(value) {
    return cleanText(value)
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[Đđ]/g, "d")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim();
  }

  function isNameAnnotation(value) {
    return /^\([^)]*\)$/u.test(value) || /^\[[^\]]*\]$/u.test(value);
  }

  function studentDisplayName(value) {
    const source = cleanText(value);
    if (!source) return source;

    const tokens = source.split(" ").filter(Boolean);
    if (tokens.length < 2) return source;

    let givenEnd = 1;
    while (givenEnd < tokens.length - 1 && isNameAnnotation(tokens[givenEnd])) givenEnd += 1;
    const given = tokens.slice(0, givenEnd);
    const middle = tokens.slice(givenEnd, -1);
    return [tokens[tokens.length - 1], ...middle, ...given].join(" ");
  }

  function guardianDisplayName(value) {
    const source = cleanText(value);
    if (!source) return source;
    const tokens = source.split(" ").filter(Boolean);
    if (tokens.length < 2) return source;
    return [tokens[tokens.length - 1], ...tokens.slice(0, -1)].join(" ");
  }

  function staffDisplayName(value) {
    const source = cleanText(value);
    if (!source) return source;
    const tokens = source.split(" ").filter(Boolean);
    if (tokens.length < 2) return source;

    let familyIndex = 1;
    while (familyIndex < tokens.length && isNameAnnotation(tokens[familyIndex])) familyIndex += 1;
    if (familyIndex >= tokens.length) return source;
    return [tokens[familyIndex], ...tokens.slice(familyIndex + 1), ...tokens.slice(0, familyIndex)].join(" ");
  }

  function accountDisplayName(account) {
    const source = cleanText(account?.name);
    const category = matchText(account?.category);
    if (!source) return source;
    if (hub.features?.identityV2 !== false && hub.identity) {
      return hub.identity.resolveDisplayIdentity(account, { mode: identitySettings.nameDisplayMode }).displayName;
    }
    if (category === "student") return studentDisplayName(source);
    if (category === "guardian") return guardianDisplayName(source);
    return staffDisplayName(source);
  }

  function conversationGuardianDisplayName(account) {
    return hub.guardianStudentRelations?.conversationDisplayName?.(account, accountDisplayName)
      || accountDisplayName(account);
  }

  function accountActionName(account) {
    return accountDisplayName(account);
  }

  function nameTokenKey(value) {
    return foldedName(value).split(" ").filter(Boolean).sort().join(" ");
  }

  function nameMatchQuality(value, expected) {
    if (matchText(value) === matchText(expected)) return 3;
    if (foldedName(value) === foldedName(expected)) return 2;
    const valueKey = nameTokenKey(value);
    return valueKey && valueKey === nameTokenKey(expected) ? 1 : 0;
  }

  function samePersonName(value, expected) {
    return nameMatchQuality(value, expected) > 0;
  }

  function sameOrderedPersonName(value, expected) {
    return matchText(value) === matchText(expected)
      || foldedName(value) === foldedName(expected);
  }

  function textLines(element) {
    return String(element?.innerText || element?.textContent || "")
      .split(/\n+/)
      .map(cleanText)
      .filter(Boolean);
  }

  function isVisible(element) {
    if (!(element instanceof HTMLElement)) return false;
    const style = getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function relationFromLine(value) {
    const source = cleanText(value);
    for (const pattern of RELATION_PATTERNS) {
      const match = source.match(pattern);
      if (match) return { source, contactOf: cleanText(match[1]) };
    }
    return null;
  }

  // NAME-CONTACT-01: display-only synchronization for Directory relationship
  // labels such as "Contact of <student>". The live DOM exposes no stable
  // student identifier in this label, so only the exact full native name may be
  // used as a fallback into the existing student naming source of truth.
  function contactOfStudentDisplayText(nativeLine) {
    const relation = relationFromLine(nativeLine);
    if (!relation?.contactOf) return "";

    const displayName = accountDisplayName({
      name: relation.contactOf,
      detail: "",
      category: "student",
      contactOf: ""
    });
    if (!displayName) return "";

    const index = relation.source.lastIndexOf(relation.contactOf);
    if (index < 0) return "";
    return `${relation.source.slice(0, index)}${displayName}`;
  }

  function clearContactOfStudentDisplay(label, { restore = true } = {}) {
    if (!(label instanceof HTMLElement)) return;
    const nativeLine = cleanText(label.getAttribute(CONTACT_OF_NATIVE_ATTR));
    const renderedLine = cleanText(label.getAttribute(CONTACT_OF_DISPLAY_ATTR));
    const current = cleanText(label.textContent);

    if (restore && nativeLine && renderedLine && current === renderedLine && current !== nativeLine) {
      label.textContent = nativeLine;
    }
    label.removeAttribute(CONTACT_OF_NATIVE_ATTR);
    label.removeAttribute(CONTACT_OF_DISPLAY_ATTR);
  }

  function decorateContactOfStudentDisplay(label, account) {
    if (!(label instanceof HTMLElement)) return;
    if (matchText(account?.category) !== "guardian" || !cleanText(account?.contactOf)) {
      clearContactOfStudentDisplay(label);
      return;
    }

    const current = cleanText(label.textContent);
    let nativeLine = cleanText(label.getAttribute(CONTACT_OF_NATIVE_ATTR));
    const previousDisplay = cleanText(label.getAttribute(CONTACT_OF_DISPLAY_ATTR));

    // A SPA may recycle this leaf for another row. If PowerHub replaced the
    // visible text with something other than our original/rendered pair, treat
    // the current text as new native evidence instead of retaining stale state.
    if (nativeLine && current !== nativeLine && current !== previousDisplay) {
      clearContactOfStudentDisplay(label, { restore: false });
      nativeLine = "";
    }
    if (!nativeLine) nativeLine = current;

    const relation = relationFromLine(nativeLine);
    // Exact NFC-normalized full-name equality only. Never surname/partial/row
    // matching, and never use the owning Guardian's identity as student proof.
    if (!relation || matchText(relation.contactOf) !== matchText(account.contactOf)) {
      clearContactOfStudentDisplay(label);
      return;
    }

    const renderedLine = contactOfStudentDisplayText(nativeLine);
    if (!renderedLine) {
      clearContactOfStudentDisplay(label);
      return;
    }

    label.setAttribute(CONTACT_OF_NATIVE_ATTR, nativeLine);
    label.setAttribute(CONTACT_OF_DISPLAY_ATTR, renderedLine);
    if (cleanText(label.textContent) !== renderedLine) label.textContent = renderedLine;
  }

  function emailFromLines(lines) {
    for (const line of lines) {
      const match = cleanText(line).match(/(?:Email ID|Email|E-mail|Thư điện tử)\s*:\s*([^\s]+@[^\s]+)/iu);
      if (match) return match[1].replace(/[;,]+$/, "");
    }
    return "";
  }

  function accountDetailFromLine(value) {
    const detail = cleanText(value);
    const relation = relationFromLine(detail);
    if (relation) return { category: "guardian", detail, contactOf: relation.contactOf };

    if (/^(Student contact|Liên hệ học sinh|Người liên hệ học sinh)\b/iu.test(detail)) {
      return { category: "guardian", detail, contactOf: "" };
    }

    if (/(^|\s+-\s+)(Student|Học sinh)\b/iu.test(detail)) {
      return { category: "student", detail, contactOf: "" };
    }

    if (/(^|\s+-\s+)(Parent|Guardian|Phụ huynh)\b/iu.test(detail)) {
      return { category: "guardian", detail, contactOf: "" };
    }

    if (/\b(Teacher|Staff|Principal|Coordinator|Administrator|Giáo viên|Nhân viên|Hiệu trưởng|Điều phối viên)\b/iu.test(detail)) {
      return { category: "staff", detail, contactOf: "" };
    }

    return null;
  }

  function isGroupInformationHeading(value) {
    const text = matchText(value);
    return text === "group information" || text === "thông tin nhóm";
  }

  function isMembersHeading(value) {
    const text = matchText(value);
    return /^(members|thành viên)\b/u.test(text);
  }

  function findGroupInformationRoot() {
    const exactPanel = document.getElementById("conversationSettings");
    if (exactPanel instanceof HTMLElement
      && exactPanel.isConnected
      && isVisible(exactPanel)
      && exactPanel.tagName === "SECTION"
      && exactPanel.getAttribute("data-testid") === "messenger-group-information-panel"
      && exactPanel.getAttribute("aria-labelledby") === "messenger-group-information-heading") {
      return exactPanel;
    }

    const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, [role='heading'], span, p, div"))
      .filter((element) => element instanceof HTMLElement && isVisible(element))
      .filter((element) => isGroupInformationHeading(element.textContent))
      .sort((a, b) => a.children.length - b.children.length);

    for (const heading of headings) {
      let current = heading.parentElement;
      for (let depth = 0; current && current !== document.body && depth < 10; depth += 1) {
        const rect = current.getBoundingClientRect();
        const lines = textLines(current);
        if (rect.width >= 220 && rect.width <= 760 && rect.height >= 160 && lines.some(isMembersHeading)) {
          return current;
        }
        current = current.parentElement;
      }
    }

    return null;
  }

  function isDirectMessagesHeading(value) {
    const text = matchText(value);
    return text === "direct messages" || text === "tin nhắn trực tiếp";
  }

  function classProgramFromCode(classCode) {
    const match = cleanText(classCode).match(/^\d{1,2}L\d{1,2}([AIE])$/iu);
    const suffix = cleanText(match?.[1]).toUpperCase();
    return suffix === "A" ? "CAP" : suffix === "I" ? "CAPI" : suffix === "E" ? "CEP" : "";
  }

  function normalizeClassPeriod(value) {
    const match = cleanText(value).match(/^P(\d+)(?:\s*[-–—]\s*P?(\d+))?$/iu);
    if (!match) return "";
    const start = Number(match[1]);
    const end = Number(match[2] || match[1]);
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 1 || end < start) return "";
    return match[2] ? `P${match[1]}-P${match[2]}` : `P${match[1]}`;
  }

  function classScheduleDisplay(value) {
    const source = cleanText(value);
    if (!CLASS_SCHEDULE_PATTERN.test(source)) return "";
    // Consume each complete schedule, including commas inside its day list.
    const matches = Array.from(source.matchAll(new RegExp(`(${CLASS_PERIOD_SOURCE})(?:\\s*\\(([^()]*)\\))?`, "giu")));
    const parts = matches.map(match => ({ period: normalizeClassPeriod(match[1]), days: cleanText(match[2]) }));
    if (!parts.length || parts.some(part => !part.period)) return "";
    // Keep the established single-period display. Separate schedules retain
    // their days: P1(Mon,Fri), P2(Mon) must not imply P2 on Friday.
    return parts.length === 1 ? parts[0].period
      : parts.map(part => part.period + (part.days ? `(${part.days})` : "")).join(", ");
  }

  function isAlphanumericClassCode(value) {
    const source = cleanText(value);
    return Boolean(
      source
      && /^[\p{L}\p{N}_-]+$/u.test(source)
      && /\p{L}/u.test(source)
      && /\p{N}/u.test(source)
    );
  }

  function classCodeTrailer(value) {
    const parenthesized = value.match(/\(([^()]*)\)\s*$/u);
    if (parenthesized) {
      const codeMatch = cleanText(parenthesized[1]).match(/^([\p{L}\p{N}_-]+)(?:\s*[-–—]\s*(CAP|CAPI|CEP))?$/iu);
      const classCode = cleanText(codeMatch?.[1]);
      const program = cleanText(codeMatch?.[2]).toUpperCase();
      if (isAlphanumericClassCode(classCode)
        && (!program || program === classProgramFromCode(classCode))) {
        return {
          body: cleanText(value.slice(0, parenthesized.index)),
          classCode,
          parenthesized: true
        };
      }
    }

    const bare = value.match(new RegExp(`^(.*?)\\s*[-–—]\\s*(${CLASS_CODE_TOKEN_SOURCE})(?:\\s*[-–—]\\s*(CAP|CAPI|CEP))?\\s*$`, "iu"));
    const classCode = cleanText(bare?.[2]);
    return bare && isAlphanumericClassCode(classCode)
      && (!bare[3] || bare[3].toUpperCase() === classProgramFromCode(classCode))
      ? { body: cleanText(bare[1]), classCode, parenthesized: false }
      : null;
  }

  function classGroupNameParts(value) {
    const original = cleanText(value);
    if (original.length < 10 || original.length > 1000) return null;

    const trailer = classCodeTrailer(original);

    const metadataRole = /(?:^|\s*[-–—]\s*)(?:staff|student|guardian|teacher|nhân viên|học sinh|phụ huynh|giáo viên)(?:\s*[-–—]\s*|$)/iu;

    const alreadyFormatted = original.match(CLASS_COMPACT_LABEL_PATTERN);
    if (alreadyFormatted) {
      const classCode = cleanText(alreadyFormatted[1]);
      const subject = cleanText(alreadyFormatted[2]).replace(/\s*\([^()]*\)\s*$/u, "");
      const period = classScheduleDisplay(alreadyFormatted[3]);
      if (!isAlphanumericClassCode(classCode) || !subject || !period || !/\p{L}/u.test(subject) || metadataRole.test(subject)) return null;
      return {
        original,
        classCode,
        program: classProgramFromCode(classCode),
        display: `${classCode} - ${subject} - ${period}`
      };
    }

    if (!trailer) return null;

    const parentheticalClassCodes = Array.from(original.matchAll(/\(([\p{L}\p{N}_-]+)(?:\s*[-–—]\s*(?:CAP|CAPI|CEP))?\)/giu))
      .map(match => cleanText(match[1]))
      .filter(isAlphanumericClassCode);
    if (parentheticalClassCodes.length > 1) return null;

    const match = trailer.body.match(CLASS_NATIVE_LABEL_PATTERN);
    if (!match) {
      // Generic PowerHub labels such as G02 Homeroom may not use P-period syntax.
      // Keep the complete native body, but do not rescue malformed legacy class
      // labels or account-role metadata that happen to end in a code.
      if (!trailer.parenthesized || /\bP\d/iu.test(trailer.body) || metadataRole.test(trailer.body)) return null;
      return {
        original,
        classCode: trailer.classCode,
        program: classProgramFromCode(trailer.classCode),
        display: `${trailer.classCode} - ${trailer.body}`
      };
    }

    const subjectWithTranslation = cleanText(match[1]);
    const owner = cleanText(match[3]);
    if (metadataRole.test(subjectWithTranslation)) return null;
    // Do not treat an extra/malformed period after a dash as the teacher name.
    if (/^P\d/iu.test(owner)) return null;

    const subject = subjectWithTranslation.replace(/\s*\([^()]*\)\s*$/u, "");
    const period = classScheduleDisplay(match[2]);
    const classCode = trailer.classCode;
    if (!subject || !period || !/\p{L}/u.test(subject) || !/\p{L}/u.test(owner)) return null;

    return {
      original,
      classCode,
      program: classProgramFromCode(classCode),
      display: `${classCode} - ${subject} - ${period}`
    };
  }

  function classCodeFromGroupRoot(root) {
    if (!root) return "";

    const storedCandidates = [root, ...root.querySelectorAll(`[${GROUP_NAME_ATTR}]`)];
    for (const element of storedCandidates) {
      const parts = classGroupNameParts(element.getAttribute?.(GROUP_NAME_ATTR));
      if (parts?.classCode) return parts.classCode;
    }

    const textCandidates = [root, ...root.querySelectorAll(GROUP_NAME_SELECTOR)]
      .filter((element) => element instanceof HTMLElement)
      .sort((a, b) => a.children.length - b.children.length);
    for (const element of textCandidates) {
      const parts = classGroupNameParts(element.textContent);
      if (parts?.classCode) return parts.classCode;
    }

    return "";
  }

  function restoreStudentClassDetail(element) {
    if (!(element instanceof HTMLElement)) return;
    const original = cleanText(element.getAttribute(ORIGINAL_DETAIL_ATTR));
    if (original && cleanText(element.textContent) !== original) element.textContent = original;
    element.removeAttribute(ORIGINAL_DETAIL_ATTR);
    element.classList.remove(STUDENT_CLASS_DETAIL_CLASS);
  }

  function decorateStudentClassDetail(element, account, classCode) {
    if (!(element instanceof HTMLElement) || account?.category !== "student" || !classCode) return;
    const original = cleanText(element.getAttribute(ORIGINAL_DETAIL_ATTR)) || cleanText(account.detail);
    if (!original) return;

    if (!element.hasAttribute(ORIGINAL_DETAIL_ATTR)) element.setAttribute(ORIGINAL_DETAIL_ATTR, original);
    element.classList.add(STUDENT_CLASS_DETAIL_CLASS);
    const display = `Student - ${classCode}`;
    if (cleanText(element.textContent) !== display) element.textContent = display;
  }

  function rememberStudentClassCode(account, classCode) {
    if (account?.category !== "student" || !classCode) return false;
    const key = hub.identity?.identityKey(account) || JSON.stringify([account.category, matchText(account.name), matchText(account.contactOf)]);
    if (!key) return false;
    let codes = studentClassCodesByIdentity.get(key);
    if (!codes) {
      codes = new Set();
      studentClassCodesByIdentity.set(key, codes);
    }
    const previousSize = codes.size;
    codes.add(classCode);
    return codes.size !== previousSize;
  }

  function rememberedStudentClassCode(account) {
    if (account?.category !== "student") return "";
    const codes = studentClassCodesByIdentity.get(hub.identity?.identityKey(account) || JSON.stringify([account.category, matchText(account.name), matchText(account.contactOf)]));
    return codes?.size === 1 ? Array.from(codes)[0] : "";
  }

  function restoreInactiveStudentClassDetails(activeElements) {
    for (const element of document.querySelectorAll(`.${STUDENT_CLASS_DETAIL_CLASS}`)) {
      if (!activeElements?.has(element)) restoreStudentClassDetail(element);
    }
  }

  function findDirectMessageRoots() {
    const roots = [];
    const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, [role='heading'], span, p, div"))
      .filter((element) => element instanceof HTMLElement && isVisible(element))
      .filter((element) => isDirectMessagesHeading(element.textContent))
      .sort((a, b) => a.children.length - b.children.length);

    for (const heading of headings) {
      let current = heading.parentElement;
      for (let depth = 0; current && current !== document.body && depth < 8; depth += 1) {
        const rect = current.getBoundingClientRect();
        if (rect.width >= 180 && rect.width <= 760 && textLines(current).some(accountDetailFromLine)) {
          roots.push(current);
          break;
        }
        current = current.parentElement;
      }
    }

    return [...new Set(roots)];
  }

  function isInitials(value) {
    const letters = String(value || "").replace(/[^\p{L}]/gu, "");
    return letters.length > 0 && letters.length <= 3 && value === value.toUpperCase();
  }

  function looksLikeAccountName(value) {
    const name = cleanText(value);
    if (name.length < 2 || name.length > 100 || isInitials(name)) return false;
    if (/\s+\(You\)$/iu.test(name) || /\s+\(Bạn\)$/iu.test(name)) return false;
    if (/\d/.test(name) || /[{}\[\]@:/\\]/.test(name)) return false;
    return /\p{L}/u.test(name);
  }

  function leafDetailLabels(root) {
    return Array.from(root.querySelectorAll("span, p, div, [role='listitem']"))
      .filter((element) => {
        if (!isVisible(element)) return false;
        const text = cleanText(element.textContent);
        if (!accountDetailFromLine(text) || text.length > 180) return false;
        return !Array.from(element.children).some((child) => accountDetailFromLine(child.textContent));
      });
  }

  function accountFromLines(lines) {
    const detailIndex = lines.findIndex((line) => accountDetailFromLine(line));
    if (detailIndex < 1) return null;
    const metadata = accountDetailFromLine(lines[detailIndex]);
    if (!metadata) return null;

    for (let index = detailIndex - 1; index >= Math.max(0, detailIndex - 6); index -= 1) {
      const name = lines[index];
      if (looksLikeAccountName(name)) return { name, ...metadata };
    }

    return null;
  }

  function findAccountRow(detailLabel, root) {
    let current = detailLabel.parentElement;

    for (let depth = 0; current && current !== root.parentElement && depth < 8; depth += 1) {
      const lines = textLines(current);
      const detailCount = lines.filter((line) => accountDetailFromLine(line)).length;
      const storedAccountElement = current.querySelector(
        `.${DIRECT_DISPLAY_CLASS}[${NAME_ATTR}], .${PERSON_DISPLAY_CLASS}[${NAME_ATTR}], .${ACCOUNT_CLASS}[${NAME_ATTR}], .${GROUP_CHAT_NATIVE_NAME_CLASS}[${NAME_ATTR}]`
      );
      const account = detailCount === 1
        ? accountFromLines(lines) || accountFromElement(storedAccountElement)
        : null;
      const rect = current.getBoundingClientRect();

      if (account && rect.width >= 140 && rect.width <= 720 && rect.height >= 30 && rect.height <= 150) {
        return { row: current, account };
      }

      if (detailCount > 1 || rect.height > 240 || current === root) break;
      current = current.parentElement;
    }

    return null;
  }

  function hasAccountDetail(element) {
    return textLines(element).some((line) => Boolean(accountDetailFromLine(line)));
  }

  function findDirectConversationHitArea(row, root) {
    if (!row) return null;

    let current = row;
    let semanticListItem = null;

    for (let depth = 0; current && current !== root && depth < 10; depth += 1) {
      if (current.matches?.('[role="listitem"]')) semanticListItem = current;

      const parent = current.parentElement;
      if (!parent) break;

      const siblings = Array.from(parent.children || []);
      const hasConversationPeer = siblings.some(
        (sibling) => sibling !== current && hasAccountDetail(sibling)
      );
      if (hasConversationPeer && hasAccountDetail(current)) return current;

      if (parent === root) break;
      current = parent;
    }

    return semanticListItem || row;
  }

  function findExactNameElement(row, name) {
    const candidates = [row, ...row.querySelectorAll("span, p, div, a, button, [role]")]
      .filter((element) => element instanceof HTMLElement && isVisible(element))
      .filter((element) => cleanText(element.textContent) === name);

    candidates.sort((a, b) => {
      const aRect = a.getBoundingClientRect();
      const bRect = b.getBoundingClientRect();
      return (a.children.length - b.children.length) || (aRect.height - bRect.height);
    });

    return candidates[0] || null;
  }

  function withNativeIdentity(row, account) {
    const evidence = hub.ui?.personIdentity(row);
    return evidence?.verified ? { ...account, identityEvidence: evidence } : account;
  }

  function rememberAccountIdentity(element, account) {
    if (!hub.identity?.stableKey(account)) {
      accountIdentities.delete(element);
      element.removeAttribute("data-psqm-person-id");
      return;
    }
    accountIdentities.set(element, { identityEvidence: account.identityEvidence });
    if (element.getAttribute(hub.identity.PERSON_ID_ATTR) !== account.identityEvidence.id) {
      element.setAttribute(hub.identity.PERSON_ID_ATTR, account.identityEvidence.id);
    }
  }

  function accountFromElement(element) {
    if (!(element instanceof HTMLElement)) return null;
    const name = cleanText(element.getAttribute(NAME_ATTR));
    if (!name) return null;
    return {
      ...accountIdentities.get(element),
      name,
      detail: cleanText(element.getAttribute(DETAIL_ATTR)),
      category: cleanText(element.getAttribute(CATEGORY_ATTR)),
      contactOf: cleanText(element.getAttribute(CONTACT_ATTR))
    };
  }

  function nativeAttributeStorageName(name) {
    return `${NATIVE_ATTRIBUTE_PREFIX}${name.replace(/[^a-z0-9]+/giu, "-")}`;
  }

  function rememberNativeAttributes(element) {
    for (const name of NATIVE_ATTRIBUTES) {
      const storageName = nativeAttributeStorageName(name);
      if (element.hasAttribute(storageName)) continue;
      element.setAttribute(storageName, element.hasAttribute(name) ? element.getAttribute(name) : "__missing__");
    }
  }

  function restoreNativeAttributes(element) {
    for (const name of NATIVE_ATTRIBUTES) {
      const storageName = nativeAttributeStorageName(name);
      if (!element.hasAttribute(storageName)) continue;
      const originalValue = element.getAttribute(storageName);
      if (originalValue === "__missing__") element.removeAttribute(name);
      else element.setAttribute(name, originalValue);
      element.removeAttribute(storageName);
    }
  }

  async function initializeNameDisplaySettings() {
    try {
      identitySettings = await chrome.storage.local.get({ nameDisplayMode: "auto" });
    } catch {
      identitySettings = { nameDisplayMode: "auto" };
    }
    refreshNameDisplays();
  }

  function decorateDirectDisplayName(element, account) {
    const displayName = conversationGuardianDisplayName(account);
    element.classList.remove(ACCOUNT_CLASS, "psqm-recipient-selected");
    element.classList.add(DIRECT_DISPLAY_CLASS);
    element.setAttribute(NAME_ATTR, account.name);
    element.setAttribute(DETAIL_ATTR, account.detail);
    element.setAttribute(CATEGORY_ATTR, account.category);
    element.setAttribute(CONTACT_ATTR, account.contactOf);
    rememberAccountIdentity(element, account);
    restoreNativeAttributes(element);
    if (cleanText(element.textContent) !== displayName) element.textContent = displayName;
  }

  // Display-only normalization for native PowerHub person rows outside Direct
  // messages. The retained data-psqm-name is always the original PowerSchool
  // string; search/query code must never use the rendered display label.
  function decoratePersonDisplayName(element, account, displayNameOverride = "") {
    if (!(element instanceof HTMLElement) || !account?.name) return;
    const displayName = cleanText(displayNameOverride) || accountDisplayName(account);
    element.classList.add(PERSON_DISPLAY_CLASS);
    element.setAttribute(NAME_ATTR, account.name);
    element.setAttribute(DETAIL_ATTR, account.detail);
    element.setAttribute(CATEGORY_ATTR, account.category);
    element.setAttribute(CONTACT_ATTR, account.contactOf);
    rememberAccountIdentity(element, account);
    if (cleanText(element.textContent) !== displayName) element.textContent = displayName;
  }

  function ensureDirectAddControl(row, account) {
    row.classList.add(DIRECT_ROW_CLASS);
    let control = Array.from(row.querySelectorAll(`.${DIRECT_ADD_CLASS}`))
      .find((element) => element instanceof HTMLElement);

    if (!control) {
      control = document.createElement("span");
      control.className = DIRECT_ADD_CLASS;
      control.setAttribute("role", "button");
      control.tabIndex = 0;
      control.textContent = "+";
      row.append(control);
    }

    const displayName = accountActionName(account);
    control.setAttribute(NAME_ATTR, account.name);
    control.setAttribute(DETAIL_ATTR, account.detail);
    control.setAttribute(CATEGORY_ATTR, account.category);
    control.setAttribute(CONTACT_ATTR, account.contactOf);
    rememberAccountIdentity(control, account);
    control.setAttribute("data-psqm-display-name", displayName);
    syncDirectAddControlState(control, account);
  }

  function syncDirectAddControlState(control, account = accountFromElement(control)) {
    if (!account || control.getAttribute("aria-busy") === "true") return;
    const recipientInput = findRecipientInput();
    const selected = Boolean(recipientInput && selectedRecipientControl(account, recipientInput));
    const displayName = cleanText(control.getAttribute("data-psqm-display-name"))
      || accountDisplayName(account);
    const label = selected
      ? tr("content.removeRecipient", { name: displayName })
      : tr("content.addRecipient", { name: displayName });
    control.classList.toggle("psqm-direct-add-selected", selected);
    control.setAttribute("aria-pressed", selected ? "true" : "false");
    control.setAttribute("title", label);
    control.setAttribute("aria-label", label);
    control.textContent = selected ? "−" : "+";
  }

  function setDirectAddControlBusy(control, busy) {
    control.setAttribute("aria-busy", busy ? "true" : "false");
    control.setAttribute("aria-disabled", busy ? "true" : "false");
    if (busy) control.textContent = "…";
    else syncDirectAddControlState(control);
  }

  function decorateQuickMessageLink(element, account, action = "open") {
    const displayName = accountDisplayName(account);
    const actionName = accountActionName(account);
    rememberNativeAttributes(element);
    element.classList.remove(DIRECT_DISPLAY_CLASS);
    element.classList.add(ACCOUNT_CLASS);
    element.classList.remove("psqm-recipient-selected");
    element.setAttribute(NAME_ATTR, account.name);
    element.setAttribute(DETAIL_ATTR, account.detail);
    element.setAttribute(CATEGORY_ATTR, account.category);
    element.setAttribute(CONTACT_ATTR, account.contactOf);
    rememberAccountIdentity(element, account);
    element.setAttribute("role", "link");
    element.removeAttribute("aria-checked");
    const label = action === "add"
      ? tr("content.addRecipient", { name: actionName })
      : tr("content.openDirectMessage", { name: actionName });
    element.setAttribute("title", label);
    element.setAttribute("aria-label", label);
    if (cleanText(element.textContent) !== displayName) element.textContent = displayName;
    if (!element.hasAttribute("tabindex")) element.tabIndex = 0;
  }

  function scanAccountRoot(root, decorator) {
    if (!root) return 0;

    let found = 0;
    for (const detailLabel of leafDetailLabels(root)) {
      const match = findAccountRow(detailLabel, root);
      if (!match) continue;

      const nameElement = match.row.querySelector(
        `.${DIRECT_DISPLAY_CLASS}[${NAME_ATTR}], .${PERSON_DISPLAY_CLASS}[${NAME_ATTR}], .${ACCOUNT_CLASS}[${NAME_ATTR}], .${GROUP_CHAT_NATIVE_NAME_CLASS}[${NAME_ATTR}]`
      ) || findExactNameElement(match.row, match.account.name);
      if (!nameElement) continue;

      const account = withNativeIdentity(match.row, {
        ...match.account,
        ...accountIdentities.get(nameElement),
        name: cleanText(nameElement.getAttribute(NAME_ATTR)) || match.account.name,
        detail: cleanText(nameElement.getAttribute(DETAIL_ATTR)) || match.account.detail,
        category: cleanText(nameElement.getAttribute(CATEGORY_ATTR)) || match.account.category,
        contactOf: cleanText(nameElement.getAttribute(CONTACT_ATTR)) || match.account.contactOf
      });
      decorator(nameElement, account, match.row, detailLabel);
      found += 1;
    }

    return found;
  }

  function recipientResultRoots() {
    const input = document.getElementById("recipient-search-input");
    if (!usableRecipientInput(input)) return [];

    const roots = new Set();
    const composerRoot = recipientSelectionRoot(input);
    if (composerRoot) roots.add(composerRoot);

    const linkedIds = cleanText(`${input.getAttribute("aria-controls") || ""} ${input.getAttribute("aria-owns") || ""}`)
      .split(/\s/u).filter(Boolean);
    for (const id of linkedIds) {
      const linked = document.getElementById(id);
      if (linked instanceof HTMLElement && linked.isConnected) roots.add(linked);
    }
    return [...roots];
  }

  function scanRecipientPersonNames() {
    let found = 0;
    for (const root of recipientResultRoots()) {
      found += scanAccountRoot(root, (element, account) => decoratePersonDisplayName(element, account));
    }
    return found;
  }

  function directoryPeopleRoot() {
    if (location.pathname !== "/directory") return null;
    const input = document.getElementById("input-field-mfe-directory-text-name");
    if (!(input instanceof HTMLElement) || !input.isConnected) return null;

    // Prefer the directory micro-frontend boundary when it is an ancestor.
    const remote = input.closest("dynamic-component");
    if (remote instanceof HTMLElement) return remote;

    // Conservative fallback: only accept an ancestor that also owns one of the
    // observed native People persona controls. Never promote this to body.
    let current = input.parentElement;
    for (let depth = 0; current && current !== document.body && depth < 8; depth += 1) {
      if (current.querySelector(
        "#radio-mfe-directory-Students_id, #radio-mfe-directory-Guardians_id, #radio-mfe-directory-Staff_id"
      )) return current;
      current = current.parentElement;
    }
    return null;
  }

  function scanDirectoryPersonNames() {
    const root = directoryPeopleRoot();
    return root
      ? scanAccountRoot(root, (element, account, _row, detailLabel) => {
        decoratePersonDisplayName(element, account);
        decorateContactOfStudentDisplay(detailLabel, account);
      })
      : 0;
  }

  function activeConversationHeaderAccount() {
    const region = document.getElementById("conversationRegion");
    if (!(region instanceof HTMLElement) || !region.isConnected
      || region.tagName !== "SECTION"
      || region.getAttribute("aria-labelledby") !== "conversationHeading") return null;

    const heading = region.querySelector('h2#conversationHeading.messenger-inbox__conversation-heading-label');
    if (!(heading instanceof HTMLElement) || !heading.isConnected) return null;

    const remembered = accountFromElement(heading);
    if (remembered?.name && ["student", "guardian", "staff"].includes(matchText(remembered.category))) {
      return { element: heading, account: remembered };
    }

    const titleContainer = heading.closest('.messenger-inbox__channel-header__content__left__channel-title');
    if (!(titleContainer instanceof HTMLElement)) return null;
    const description = titleContainer.querySelector('span.messenger-inbox__channel-header__content__left__channel-description');
    const detail = accountDetailFromLine(description?.textContent);
    const nativeName = cleanText(heading.textContent);
    if (!detail || !nativeName || !looksLikeAccountName(nativeName)) return null;

    return {
      element: heading,
      account: {
        name: nativeName,
        detail: detail.detail,
        category: detail.category,
        contactOf: detail.contactOf
      }
    };
  }

  function scanActiveConversationPersonNames() {
    const resolved = activeConversationHeaderAccount();
    if (!resolved) return 0;

    let found = 0;
    decoratePersonDisplayName(
      resolved.element,
      resolved.account,
      conversationGuardianDisplayName(resolved.account)
    );
    found += 1;

    const panel = document.getElementById("conversationSettings");
    if (!(panel instanceof HTMLElement) || !panel.isConnected
      || panel.tagName !== "SECTION"
      || panel.getAttribute("data-testid") !== "messenger-group-information-panel"
      || panel.getAttribute("aria-labelledby") !== "messenger-group-information-heading") return found;

    const profileTitle = panel.querySelector('[data-testid="messenger-group-profile-title"].custom-channel-profile__title');
    if (!(profileTitle instanceof HTMLElement) || !profileTitle.isConnected) return found;

    const profileNativeName = cleanText(profileTitle.getAttribute(NAME_ATTR)) || cleanText(profileTitle.textContent);
    // Live inspection found no stable person ID linking this profile title to a
    // member row. Only follow the active conversation identity when the original
    // ordered native name matches exactly/folded; never infer by surname or tokens.
    if (!sameOrderedPersonName(profileNativeName, resolved.account.name)) return found;

    decoratePersonDisplayName(profileTitle, resolved.account);
    return found + 1;
  }

  function clearStudentProfileCardIdentity(element) {
    if (!(element instanceof HTMLElement)) return;
    element.classList.remove(PERSON_DISPLAY_CLASS);
    element.removeAttribute(NAME_ATTR);
    element.removeAttribute(DETAIL_ATTR);
    element.removeAttribute(CATEGORY_ATTR);
    element.removeAttribute(CONTACT_ATTR);
    if (hub.identity?.PERSON_ID_ATTR) element.removeAttribute(hub.identity.PERSON_ID_ATTR);
    accountIdentities.delete(element);
  }

  function studentProfileCardNativeTitle(titleElement) {
    const currentText = cleanText(titleElement?.textContent);
    const remembered = accountFromElement(titleElement);
    if (!remembered?.name) return currentText;

    const rememberedDisplay = accountDisplayName(remembered);
    if (currentText === remembered.name || currentText === rememberedDisplay) return remembered.name;

    // PowerHub may recycle the transient card node for another person. If the
    // host replaces its text, discard our stale identity before matching again.
    clearStudentProfileCardIdentity(titleElement);
    return currentText;
  }

  function studentProfileCardCandidates(panel) {
    const candidates = [];
    const rows = Array.from(panel.querySelectorAll('[data-testid="messenger-member-row"]'))
      .filter((row) => row instanceof HTMLElement && row.isConnected);

    for (const row of rows) {
      const nameElements = Array.from(row.querySelectorAll('[data-testid="messenger-member-name"]'))
        .filter((element) => element instanceof HTMLElement && element.isConnected);
      const detailElements = Array.from(row.querySelectorAll(
        ".messenger-inbox__channel-settings-user-list-result-details-text"
      )).filter((element) => element instanceof HTMLElement && element.isConnected);
      if (nameElements.length !== 1 || detailElements.length !== 1) continue;

      const detail = accountDetailFromLine(detailElements[0].textContent);
      if (detail?.category !== "student") continue;

      const nameElement = nameElements[0];
      const nativeName = cleanText(nameElement.getAttribute(NAME_ATTR)) || cleanText(nameElement.textContent);
      if (!looksLikeAccountName(nativeName)) continue;

      const remembered = accountFromElement(nameElement);
      const account = remembered?.name === nativeName && remembered.category === "student"
        ? remembered
        : withNativeIdentity(row, { name: nativeName, ...detail });
      candidates.push({
        nativeName,
        category: account.category,
        account
      });
    }

    return candidates;
  }

  function scanStudentProfileCardTitle() {
    const panel = hub.ui?.messages?.groupInformationPanel?.();
    if (!panel?.verified || !(panel.element instanceof HTMLElement) || !panel.element.isConnected) return 0;

    const cards = Array.from(document.querySelectorAll(
      '[data-testid="messenger-user-profile-modal"].messenger-inbox__user-profile-modal'
    )).filter((element) => element instanceof HTMLElement
      && element.isConnected
      && !element.closest("[data-psqm-ui]")
      && isVisible(element));
    if (cards.length !== 1) return 0;

    const userDetails = Array.from(cards[0].children)
      .filter((element) => element instanceof HTMLElement
        && element.classList.contains("messenger-inbox__user-profile-modal-userdetail"));
    if (userDetails.length !== 1) return 0;

    const titleElements = Array.from(userDetails[0].querySelectorAll(
      ".messenger-inbox__user-profile-modal-name-wrap > .messenger-inbox__user-profile-modal-name"
    )).filter((element) => element instanceof HTMLElement && element.isConnected && isVisible(element));
    const roleElements = Array.from(userDetails[0].querySelectorAll(
      ".messenger-inbox__user-profile-modal-name-wrap > .messenger-inbox__user-profile-modal-role"
    )).filter((element) => element instanceof HTMLElement && element.isConnected && isVisible(element));
    if (titleElements.length !== 1 || roleElements.length !== 1) return 0;

    const cardRole = accountDetailFromLine(roleElements[0].textContent);
    if (cardRole?.category !== "student") return 0;

    const titleElement = titleElements[0];
    const nativeTitle = studentProfileCardNativeTitle(titleElement);
    const match = hub.ui.uniqueExactStudentCardMatch?.({
      nativeTitle,
      candidates: studentProfileCardCandidates(panel.element)
    });
    if (!match?.verified || match.candidate?.account?.category !== "student") return 0;

    decoratePersonDisplayName(titleElement, match.candidate.account);
    return 1;
  }

  function scanAccountNames() {
    const groupRoot = findGroupInformationRoot();
    const classCode = classCodeFromGroupRoot(groupRoot);
    const activeStudentDetails = new Set();
    let found = groupRoot
      ? scanAccountRoot(groupRoot, (element, account, _row, detailLabel) => {
        decorateQuickMessageLink(element, account, "open");
        decorateContactOfStudentDisplay(detailLabel, account);
        if (account.category === "student" && classCode) {
          rememberStudentClassCode(account, classCode);
          decorateStudentClassDetail(detailLabel, account, classCode);
          activeStudentDetails.add(detailLabel);
        } else if (detailLabel.classList.contains(STUDENT_CLASS_DETAIL_CLASS)) {
          restoreStudentClassDetail(detailLabel);
        }
      })
      : 0;
    for (const root of findDirectMessageRoots()) {
      if (root === groupRoot) continue;
      root.querySelectorAll?.(`.${DIRECT_HIT_ROW_CLASS}`).forEach((element) => {
        element.classList.remove(DIRECT_HIT_ROW_CLASS);
      });
      found += scanAccountRoot(root, (element, account, row, detailLabel) => {
        decorateDirectDisplayName(element, account);
        const hitArea = findDirectConversationHitArea(row, root);
        hitArea?.classList?.add(DIRECT_HIT_ROW_CLASS);
        ensureDirectAddControl(row, account);
        const directClassCode = rememberedStudentClassCode(account);
        if (directClassCode) {
          decorateStudentClassDetail(detailLabel, account, directClassCode);
          activeStudentDetails.add(detailLabel);
        } else if (detailLabel.classList.contains(STUDENT_CLASS_DETAIL_CLASS)) {
          restoreStudentClassDetail(detailLabel);
        }
      });
    }
    found += scanRecipientPersonNames();
    found += scanDirectoryPersonNames();
    found += scanActiveConversationPersonNames();
    found += scanStudentProfileCardTitle();
    restoreInactiveStudentClassDetails(activeStudentDetails);
    document.getElementById("psqm-recipient-toolbar")?.remove();
    return found;
  }

  function scanClassGroupNames() {
    let found = 0;
    const candidates = Array.from(document.querySelectorAll(GROUP_NAME_SELECTOR))
      .filter((element) => element instanceof HTMLElement && isVisible(element))
      .filter((element) => !element.closest(`input, textarea, select, [contenteditable]:not([contenteditable='false']), [data-psqm-ui], [${NAME_ATTR}], .${DIRECT_DISPLAY_CLASS}`))
      .filter((element) => {
        const storedOriginal = cleanText(element.getAttribute(GROUP_NAME_ATTR));
        const currentText = cleanText(element.textContent);
        return Boolean(storedOriginal)
          || GROUP_NAME_MARKER.test(currentText)
          || CLASS_CODE_TRAILER_MARKER.test(currentText)
          || CLASS_CODE_LEADING_MARKER.test(currentText);
      });

    for (const element of candidates) {
      const storedOriginal = cleanText(element.getAttribute(GROUP_NAME_ATTR));
      // A recycled SPA row may now contain controls or a different native label.
      // Only plain-text leaves can be rewritten without destroying native DOM.
      if (element.children.length > 0) {
        if (storedOriginal) {
          if (element.getAttribute("title") === storedOriginal) element.removeAttribute("title");
          element.removeAttribute(GROUP_NAME_ATTR);
          element.removeAttribute(GROUP_DISPLAY_ATTR);
          element.removeAttribute(CLASS_PROGRAM_ATTR);
        }
        continue;
      }
      const current = cleanText(element.textContent);
      const previousDisplay = element.getAttribute(GROUP_DISPLAY_ATTR)
        || (storedOriginal ? classGroupNameParts(storedOriginal)?.display : "");
      const nativeChanged = Boolean(storedOriginal) && current !== previousDisplay && current !== storedOriginal;
      if (nativeChanged) {
        if (element.getAttribute("title") === storedOriginal) element.removeAttribute("title");
        element.removeAttribute(GROUP_NAME_ATTR);
        element.removeAttribute(GROUP_DISPLAY_ATTR);
        element.removeAttribute(CLASS_PROGRAM_ATTR);
      }

      const parts = classGroupNameParts(nativeChanged ? current : storedOriginal || current);
      if (!parts) continue;

      element.setAttribute(GROUP_NAME_ATTR, parts.original);
      element.setAttribute(GROUP_DISPLAY_ATTR, parts.display);
      if (parts.program) element.setAttribute(CLASS_PROGRAM_ATTR, parts.program);
      else element.removeAttribute(CLASS_PROGRAM_ATTR);
      if (!element.hasAttribute("title")) element.setAttribute("title", parts.original);
      if (cleanText(element.textContent) !== parts.display) element.textContent = parts.display;
      found += 1;
    }
    return found;
  }

  function controlText(element) {
    return cleanText([
      element?.textContent,
      element?.getAttribute?.("aria-label"),
      element?.getAttribute?.("placeholder"),
      element?.getAttribute?.("title"),
      element?.getAttribute?.("name"),
      element?.getAttribute?.("id")
    ].filter(Boolean).join(" "));
  }

  function isCreateChatLabel(value) {
    const text = matchText(value);
    return text === "create chat" || text.startsWith("create chat ")
      || text === "tạo cuộc trò chuyện" || text.startsWith("tạo cuộc trò chuyện ");
  }

  function isCreateGroupChatTriggerLabel(value) {
    const text = matchText(value);
    return text === "create group chat" || text.startsWith("create group chat ")
      || text === "tạo trò chuyện nhóm" || text.startsWith("tạo trò chuyện nhóm ")
      || text === "tạo nhóm chat" || text.startsWith("tạo nhóm chat ");
  }

  function classCodeNearGroupChatTrigger(control) {
    let current = control;
    for (let depth = 0; current && current !== document.body && depth < 12; depth += 1) {
      const classCode = classCodeFromGroupRoot(current);
      if (classCode) return classCode;
      current = current.parentElement;
    }
    return "";
  }

  function classCodeFromClickedContext(target) {
    let current = target instanceof Element ? target : null;
    for (let depth = 0; current && current !== document.body && depth < 7; depth += 1) {
      const codes = new Set();
      const candidates = [current, ...current.querySelectorAll?.(`[${GROUP_NAME_ATTR}]`) || []];
      for (const candidate of candidates) {
        const parts = classGroupNameParts(candidate.getAttribute?.(GROUP_NAME_ATTR));
        if (parts?.classCode) codes.add(parts.classCode);
      }
      const directParts = classGroupNameParts(current.textContent);
      if (directParts?.classCode) codes.add(directParts.classCode);
      if (codes.size === 1) return Array.from(codes)[0];
      current = current.parentElement;
    }
    return "";
  }

  function captureConversationClassFromTarget(target) {
    const classCode = classCodeFromClickedContext(target);
    if (classCode) activeConversationClassCode = classCode;
  }

  function captureGroupChatClassFromTarget(target) {
    let control = target instanceof Element ? target : null;
    for (let depth = 0; control && control !== document.body && depth < 8; depth += 1) {
      if (isCreateGroupChatTriggerLabel(controlText(control))) break;
      control = control.parentElement;
    }
    if (!control || control === document.body || !isCreateGroupChatTriggerLabel(controlText(control))) return;
    activeGroupChatClassCode = classCodeNearGroupChatTrigger(control) || activeConversationClassCode;
  }

  function isCancelLabel(value) {
    const text = matchText(value);
    return text === "cancel" || text.startsWith("cancel ")
      || text === "hủy" || text.startsWith("hủy ")
      || text === "huỷ" || text.startsWith("huỷ ");
  }

  function dialogHasText(root, patterns) {
    const text = matchText(textLines(root).join(" | "));
    return patterns.some((pattern) => pattern.test(text));
  }

  function visibleDialogControls(root) {
    return Array.from(root.querySelectorAll("button, [role='button'], input, textarea, select, [role='combobox'], label"))
      .filter((element) => element instanceof HTMLElement && isVisible(element));
  }

  function isCreateGroupChatDialog(root) {
    if (!(root instanceof HTMLElement) || !isVisible(root)) return false;
    const controls = visibleDialogControls(root);
    const hasCreate = controls.some((element) => element.matches("button, [role='button']") && isCreateChatLabel(controlText(element)));
    const hasCancel = controls.some((element) => element.matches("button, [role='button']") && isCancelLabel(controlText(element)));
    if (!hasCreate || !hasCancel) return false;

    const hasGroupName = dialogHasText(root, [/(^|\|)\s*(group name|tên nhóm)\s*(\||$)/u]);
    const hasAllStudents = dialogHasText(root, [/(add all students|thêm tất cả học sinh)/u]);
    const hasAllGuardians = dialogHasText(root, [/(add all guardians|thêm tất cả phụ huynh)/u]);
    return hasGroupName && hasAllStudents && hasAllGuardians;
  }

  function findCreateGroupChatDialog() {
    const semanticDialogs = Array.from(document.querySelectorAll("[role='dialog'], [aria-modal='true']"))
      .filter((element) => isCreateGroupChatDialog(element));
    if (semanticDialogs.length > 0) {
      return semanticDialogs.sort((a, b) => {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        return (aRect.width * aRect.height) - (bRect.width * bRect.height);
      })[0];
    }

    const createControls = Array.from(document.querySelectorAll("button, [role='button']"))
      .filter((element) => element instanceof HTMLElement && isVisible(element))
      .filter((element) => isCreateChatLabel(controlText(element)));
    const candidates = [];
    for (const control of createControls) {
      let current = control.parentElement;
      for (let depth = 0; current && current !== document.body && depth < 12; depth += 1) {
        if (isCreateGroupChatDialog(current)) candidates.push(current);
        current = current.parentElement;
      }
    }

    return [...new Set(candidates)].sort((a, b) => {
      const aRect = a.getBoundingClientRect();
      const bRect = b.getBoundingClientRect();
      return (aRect.width * aRect.height) - (bRect.width * bRect.height);
    })[0] || null;
  }

  function lowestCommonAncestor(elements, boundary) {
    const targets = elements.filter((element) => element instanceof HTMLElement);
    if (targets.length < 2) return targets[0]?.parentElement || null;
    let current = targets[0].parentElement;
    while (current && current !== boundary?.parentElement && current !== document.body) {
      if (targets.every((element) => current.contains(element))) return current;
      current = current.parentElement;
    }
    return null;
  }

  function branchBelow(ancestor, element) {
    let current = element;
    while (current?.parentElement && current.parentElement !== ancestor) current = current.parentElement;
    return current?.parentElement === ancestor ? current : null;
  }

  function groupChatRowFromControl(control, dialog, includeHidden = false) {
    let current = control.parentElement;
    for (let depth = 0; current && current !== dialog && depth < 7; depth += 1) {
      const lines = textLines(current);
      const roleLines = lines.filter((line) => /^(student|guardian|staff|học sinh|phụ huynh|nhân viên)$/iu.test(line));
      const hiddenRoleCount = includeHidden
        ? Array.from(current.querySelectorAll("span, p, div, [role='cell'], [role='gridcell']"))
          .filter((element) => element.children.length === 0)
          .filter((element) => /^(student|guardian|staff|học sinh|phụ huynh|nhân viên)$/iu.test(cleanText(element.textContent)))
          .length
        : 0;
      const rect = current.getBoundingClientRect();
      const contentMatches = includeHidden
        ? hiddenRoleCount === 1
        : roleLines.length === 1 && lines.length >= 2 && lines.length <= 10;
      if (contentMatches && (includeHidden || (rect.width >= 260 && rect.height >= 28 && rect.height <= 120))) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  function groupChatRowFromRoleElement(roleElement, dialog, includeHidden = false) {
    let current = roleElement.parentElement;
    for (let depth = 0; current && current !== dialog && depth < 7; depth += 1) {
      const roleElements = Array.from(current.querySelectorAll("span, p, div, [role='cell'], [role='gridcell']"))
        .filter((element) => element.children.length === 0)
        .filter((element) => /^(student|guardian|staff|học sinh|phụ huynh|nhân viên)$/iu.test(cleanText(element.textContent)));
      const nameElement = Array.from(current.querySelectorAll("span, p, div, a, [role='cell'], [role='gridcell']"))
        .filter((element) => element.children.length === 0)
        .find((element) => looksLikeAccountName(cleanText(element.textContent))
          && !/^(student|guardian|staff|học sinh|phụ huynh|nhân viên)$/iu.test(cleanText(element.textContent)));
      const controls = current.querySelectorAll("button, [role='button']");
      const rect = current.getBoundingClientRect();
      const dimensionsMatch = includeHidden || (rect.width >= 260 && rect.height >= 28 && rect.height <= 120);
      if (roleElements.length === 1 && nameElement && controls.length > 0 && dimensionsMatch) return current;
      if (roleElements.length > 1 || (!includeHidden && rect.height > 180)) break;
      current = current.parentElement;
    }
    return null;
  }

  function findGroupChatMemberRows(dialog, { includeHidden = false, sourceRoot = dialog } = {}) {
    const addControls = Array.from(sourceRoot.querySelectorAll("button, [role='button']"))
      .filter((element) => element instanceof HTMLElement)
      .filter((element) => !element.closest(`.${GROUP_CHAT_AGGREGATE_CLASS}`))
      .filter((element) => includeHidden || isVisible(element))
      .filter((element) => element.matches("button, [role='button']"))
      .filter((element) => {
        const text = controlText(element);
        if (/(add all|thêm tất cả)/iu.test(text)) return false;
        return /^[+＋]$/u.test(cleanText(element.textContent)) || /^(add|thêm)\b/iu.test(text);
      });

    const controlRows = addControls
      .map((control) => groupChatRowFromControl(control, dialog, includeHidden))
      .filter(Boolean);
    const roleRows = Array.from(sourceRoot.querySelectorAll("span, p, div, [role='cell'], [role='gridcell']"))
      .filter((element) => element.children.length === 0)
      .filter((element) => !element.closest(`.${GROUP_CHAT_AGGREGATE_CLASS}`))
      .filter((element) => includeHidden || isVisible(element))
      .filter((element) => /^(student|guardian|staff|học sinh|phụ huynh|nhân viên)$/iu.test(cleanText(element.textContent)))
      .map((element) => groupChatRowFromRoleElement(element, dialog, includeHidden))
      .filter(Boolean);

    return [...new Set([...controlRows, ...roleRows])];
  }

  function findSelectedMembersPane(dialog) {
    const markers = Array.from(dialog.querySelectorAll("span, p, div, [role='status'], [aria-live]"))
      .filter((element) => element instanceof HTMLElement && isVisible(element))
      .filter((element) => /^(\d+)\s+(selected|đã chọn)$/iu.test(cleanText(element.textContent)))
      .sort((a, b) => a.children.length - b.children.length);

    for (const marker of markers) {
      let current = marker.parentElement;
      for (let depth = 0; current && current !== dialog && depth < 8; depth += 1) {
        const rect = current.getBoundingClientRect();
        const lines = textLines(current);
        const hasNameHeading = lines.some((line) => matchText(line) === "name" || matchText(line) === "tên");
        const containsSourceControls = lines.some((line) => /^(add all students|add all guardians)$/iu.test(line));
        if (hasNameHeading && !containsSourceControls && rect.width >= 180 && rect.height >= 140) return current;
        current = current.parentElement;
      }
    }

    return null;
  }

  function findSearchInput(root) {
    return Array.from(root.querySelectorAll("input, textarea, [role='combobox']"))
      .filter((element) => element instanceof HTMLElement && isVisible(element))
      .find((element) => /(^|\s)(search|tìm kiếm)(\s|$)/iu.test(controlText(element))) || null;
  }

  function maximizeNativePageSize(dialog) {
    let changed = false;
    for (const select of dialog.querySelectorAll("select")) {
      if (!(select instanceof HTMLSelectElement) || !isVisible(select)) continue;
      const label = select.labels ? Array.from(select.labels, (item) => item.textContent).join(" ") : "";
      const hints = cleanText(`${controlText(select)} ${label} ${select.parentElement?.textContent || ""}`);
      if (!/(rows?|items?|results?).*(per page|mỗi trang)|(per page|mỗi trang).*(rows?|items?|results?)/iu.test(hints)) continue;

      const numericOptions = Array.from(select.options)
        .map((option) => ({ option, size: Number(cleanText(option.value || option.textContent)) }))
        .filter(({ size }) => Number.isInteger(size) && size > 5 && size <= 100)
        .sort((a, b) => b.size - a.size);
      const target = numericOptions[0];
      if (!target) continue;
      if (select.value !== target.option.value) {
        select.value = target.option.value;
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
        changed = true;
      }
      if (select.getAttribute(GROUP_CHAT_PAGE_SIZE_ATTR) !== String(target.size)) {
        select.setAttribute(GROUP_CHAT_PAGE_SIZE_ATTR, String(target.size));
      }
    }
    return changed;
  }

  function groupChatResultsStatus(root) {
    const candidates = Array.from(root.querySelectorAll("span, p, div, [role='status']"))
      .filter((element) => element instanceof HTMLElement)
      .filter((element) => !element.closest(`.${GROUP_CHAT_AGGREGATE_CLASS}`))
      .map((element) => {
        const text = cleanText(element.textContent);
        const match = text.match(/^([\d,]+)\s*[-–]\s*([\d,]+)\s+of\s+([\d,]+)\s+results?$/iu);
        if (!match) return null;
        return {
          element,
          start: Number(match[1].replace(/,/g, "")),
          end: Number(match[2].replace(/,/g, "")),
          total: Number(match[3].replace(/,/g, ""))
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.element.children.length - b.element.children.length);
    return candidates[0] || null;
  }

  function groupChatPaginationControls(root) {
    return Array.from(root?.querySelectorAll("button, [role='button'], a, [tabindex], [aria-label], [title], svg, i, [class*='icon']") || [])
      .filter((element) => element instanceof Element)
      .filter((element) => !element.closest(`.${GROUP_CHAT_AGGREGATE_CLASS}`))
      .filter((element) => !element.closest(`.${GROUP_CHAT_ROW_CLASS}`));
  }

  function groupChatPageNumber(element) {
    const text = cleanText(element?.textContent);
    if (/^\d+$/u.test(text)) return Number(text);
    const label = cleanText(`${element?.getAttribute?.("aria-label") || ""} ${element?.getAttribute?.("title") || ""}`);
    const match = label.match(/(?:^|\s)page\s+(\d+)(?:\s|$)/iu);
    return match ? Number(match[1]) : null;
  }

  function groupChatNumericPageControls(root) {
    return Array.from(root?.querySelectorAll("*") || [])
      .filter((element) => element instanceof Element)
      .filter((element) => !element.closest(`.${GROUP_CHAT_AGGREGATE_CLASS}`))
      .filter((element) => !element.closest(`.${GROUP_CHAT_ROW_CLASS}`))
      .filter((element) => Number.isInteger(groupChatPageNumber(element)))
      .filter((element) => !Array.from(element.children)
        .some((child) => groupChatPageNumber(child) === groupChatPageNumber(element)));
  }

  function findGroupChatPaginationRoot(statusElement, sourcePane) {
    let current = statusElement?.parentElement;
    for (let depth = 0; current && current !== sourcePane?.parentElement && depth < 16; depth += 1) {
      const numericControls = groupChatNumericPageControls(current);
      if (numericControls.length >= 2 && current !== sourcePane) return current;
      if (current === sourcePane) break;
      current = current.parentElement;
    }
    return null;
  }

  function groupChatPageControl(pagination, pageNumber) {
    return groupChatNumericPageControls(pagination)
      .find((element) => groupChatPageNumber(element) === pageNumber) || null;
  }

  function clickableGroupChatTarget(element, pagination) {
    let current = element;
    while (current && current !== pagination) {
      if (current.matches?.("button, [role='button'], a, [tabindex], [aria-label], [title]")) return current;
      current = current.parentElement;
    }
    return element;
  }

  function groupChatControlAtPoint(pagination, x, y, numericControls) {
    for (const element of document.elementsFromPoint(x, y)) {
      if (!(element instanceof Element) || element === pagination || !pagination?.contains(element)) continue;
      if (numericControls.some((numeric) => numeric === element || numeric.contains(element) || element.contains(numeric))) continue;
      if (element.closest(`.${GROUP_CHAT_ROW_CLASS}`)) continue;
      return clickableGroupChatTarget(element, pagination);
    }
    return null;
  }

  function groupChatNextPageControl(pagination, currentPage) {
    const controls = groupChatPaginationControls(pagination);
    const semanticControl = controls.find((element) => {
        const label = controlText(element);
        const text = cleanText(element.textContent);
        return /(next page|next|trang sau)/iu.test(label) || /^[>›»→]$/u.test(text);
      });
    if (semanticControl) return semanticControl;

    const numericControls = groupChatNumericPageControls(pagination);
    if (numericControls.length < 1) return null;
    const lastNumeric = numericControls.at(-1);
    const orderedFallback = controls
      .filter((element) => !numericControls.includes(element))
      .filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-disabled") !== "true")
      .filter((element) => !/(previous page|previous|trang trước)/iu.test(controlText(element)))
      .filter((element) => !lastNumeric
        || Boolean(lastNumeric.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING))
      .at(-1) || null;
    const currentControl = groupChatPageControl(pagination, currentPage);
    const numericRects = numericControls
      .map((element) => element.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0);
    if (numericRects.length < 1) return orderedFallback;

    const numericCenterY = numericRects.reduce((sum, rect) => sum + rect.top + (rect.height / 2), 0) / numericRects.length;
    const numericRight = Math.max(...numericRects.map((rect) => rect.right));
    const currentRect = currentControl?.getBoundingClientRect();
    for (const offset of [12, 24, 36, 48, 60, 72]) {
      const pointControl = groupChatControlAtPoint(pagination, numericRight + offset, numericCenterY, numericControls);
      if (pointControl) return pointControl;
    }
    const fallback = controls
      .filter((element) => !numericControls.includes(element))
      .filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-disabled") !== "true")
      .filter((element) => !/(previous page|previous|trang trước)/iu.test(controlText(element)))
      .map((element) => ({ element, rect: element.getBoundingClientRect() }))
      .filter(({ rect }) => rect.width > 0 && rect.height > 0)
      .filter(({ rect }) => Math.abs((rect.top + (rect.height / 2)) - numericCenterY) <= 72)
      .filter(({ rect }) => !currentRect || rect.left >= currentRect.left)
      .sort((a, b) => b.rect.left - a.rect.left);
    if (fallback[0]) return fallback[0].element;

    return orderedFallback;
  }

  function groupChatCurrentPage(status, pageSize) {
    return status && pageSize > 0 ? Math.floor((status.start - 1) / pageSize) + 1 : 1;
  }

  function accountFromGroupChatRow(row) {
    const storedNameElement = row.querySelector(`.${GROUP_CHAT_NATIVE_NAME_CLASS}[${NAME_ATTR}]`);
    if (storedNameElement) {
      return {
        ...accountIdentities.get(storedNameElement),
        name: cleanText(storedNameElement.getAttribute(NAME_ATTR)),
        detail: cleanText(storedNameElement.getAttribute(DETAIL_ATTR)),
        category: cleanText(storedNameElement.getAttribute(CATEGORY_ATTR)),
        contactOf: cleanText(storedNameElement.getAttribute(CONTACT_ATTR))
      };
    }

    const fromLines = accountFromLines(textLines(row));
    if (fromLines) return withNativeIdentity(row, fromLines);

    const textElements = Array.from(row.querySelectorAll("span, p, div, a, [role='cell'], [role='gridcell']"));
    const detailElement = textElements
      .filter((element) => element.children.length === 0)
      .find((element) => /^(student|guardian|staff|học sinh|phụ huynh|nhân viên)$/iu.test(cleanText(element.textContent)));
    const metadata = accountDetailFromLine(detailElement?.textContent);
    if (!metadata) return null;

    const addControl = nativeGroupChatAddControl(row);
    const actionLabel = cleanText(`${addControl?.getAttribute("aria-label") || ""} ${addControl?.getAttribute("title") || ""}`);
    const labelledName = cleanText(actionLabel.replace(/^(add|thêm)\s+/iu, ""));
    if (labelledName && labelledName !== actionLabel && looksLikeAccountName(labelledName)) {
      return withNativeIdentity(row, { name: labelledName, ...metadata });
    }

    const nameElement = textElements
      .filter((element) => element.children.length === 0)
      .find((element) => {
        const text = cleanText(element.textContent);
        return text !== cleanText(detailElement.textContent) && looksLikeAccountName(text);
      });
    const name = cleanText(nameElement?.textContent);
    return name ? withNativeIdentity(row, { name, ...metadata }) : null;
  }

  function decorateNativeGroupChatNames(rows) {
    let decorated = 0;
    let learnedClass = false;
    for (const row of rows) {
      const storedNameElement = row.querySelector(`.${GROUP_CHAT_NATIVE_NAME_CLASS}[${NAME_ATTR}]`);
      const account = accountFromGroupChatRow(row);
      if (!account?.name) continue;
      learnedClass = rememberStudentClassCode(account, activeGroupChatClassCode) || learnedClass;

      const nameElement = storedNameElement || findExactNameElement(row, account.name);
      if (!nameElement) continue;
      nameElement.classList.add(GROUP_CHAT_NATIVE_NAME_CLASS);
      nameElement.setAttribute(NAME_ATTR, account.name);
      nameElement.setAttribute(DETAIL_ATTR, account.detail);
      nameElement.setAttribute(CATEGORY_ATTR, account.category);
      nameElement.setAttribute(CONTACT_ATTR, account.contactOf);
      rememberAccountIdentity(nameElement, account);
      const displayName = accountDisplayName(account);
      if (cleanText(nameElement.textContent) !== displayName) nameElement.textContent = displayName;
      decorated += 1;
    }
    if (learnedClass && !globalScanRunning) scheduleScan(0);
    return decorated;
  }

  function nativeGroupChatRecords(dialog, sourcePane, pageNumber, includeHidden = false) {
    const records = [];
    let learnedClass = false;
    const rows = findGroupChatMemberRows(dialog, { includeHidden, sourceRoot: sourcePane });
    for (const row of rows) {
      const account = accountFromGroupChatRow(row);
      if (!account) continue;
      learnedClass = rememberStudentClassCode(account, activeGroupChatClassCode) || learnedClass;
      const key = hub.identity?.identityKey(account) || JSON.stringify([account.category, matchText(account.name), matchText(account.contactOf)]);
      records.push({ key, page: pageNumber, account, row });
    }
    if (learnedClass && !globalScanRunning) scheduleScan(0);
    return records;
  }

  function groupChatState(dialog) {
    let state = groupChatStates.get(dialog);
    if (!state) {
      state = {
        generation: 0,
        crawling: false,
        complete: false,
        records: new Map(),
        sourcePane: null,
        nativeList: null,
        pagination: null,
        pageSize: 0,
        total: 0,
        customList: null,
        loading: null
      };
      groupChatStates.set(dialog, state);
    }
    return state;
  }

  function removeGroupChatAggregation(dialog, { rescan = false } = {}) {
    const state = groupChatStates.get(dialog);
    if (!state) return;
    state.generation += 1;
    state.crawling = false;
    state.complete = false;
    state.records.clear();
    state.customList?.remove();
    state.loading?.remove();
    state.customList = null;
    state.loading = null;
    state.nativeList?.classList.remove(GROUP_CHAT_NATIVE_COLLAPSED_CLASS);
    state.pagination?.classList.remove(GROUP_CHAT_NATIVE_COLLAPSED_CLASS);
    if (rescan) scheduleScan(450);
  }

  function groupChatInsertBeforePagination(element, state) {
    const pagination = state.pagination;
    if (pagination?.parentElement) pagination.parentElement.insertBefore(element, pagination);
    else state.nativeList?.parentElement?.append(element);
  }

  function showGroupChatLoading(state) {
    if (state.loading?.isConnected) return;
    const loading = document.createElement("div");
    loading.className = GROUP_CHAT_LOADING_CLASS;
    loading.textContent = tr("content.loadingGroupResults", { count: state.total });
    state.loading = loading;
    groupChatInsertBeforePagination(loading, state);
  }

  async function goToNativeGroupChatPage(dialog, state, pageNumber) {
    const maximumHops = Math.ceil(state.total / state.pageSize) + 2;
    for (let hop = 0; hop < maximumHops; hop += 1) {
      const currentStatus = groupChatResultsStatus(state.sourcePane);
      if (!currentStatus) return false;
      const currentPage = groupChatCurrentPage(currentStatus, state.pageSize);
      if (currentPage === pageNumber) return true;

      let pagination = state.pagination;
      if (!pagination?.isConnected) {
        pagination = findGroupChatPaginationRoot(currentStatus.element, state.sourcePane);
        state.pagination = pagination;
      }
      if (!pagination) return false;

      let destinationPage = pageNumber;
      let control = groupChatPageControl(pagination, destinationPage);
      if (!control && pageNumber > currentPage) {
        destinationPage = currentPage + 1;
        control = groupChatNextPageControl(pagination, currentPage);
      }
      if (!control || control.hasAttribute("disabled") || control.getAttribute("aria-disabled") === "true") return false;

      if (typeof control.click === "function") control.click();
      else control.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
      const expectedStart = ((destinationPage - 1) * state.pageSize) + 1;
      const loaded = await waitFor(() => {
        const status = groupChatResultsStatus(state.sourcePane);
        if (!status || status.start !== expectedStart) return null;
        const rows = nativeGroupChatRecords(dialog, state.sourcePane, destinationPage, true);
        return rows.length > 0 ? status : null;
      }, 6000);
      if (!loaded) return false;
    }
    return false;
  }

  function nativeGroupChatAddControl(row) {
    const controls = Array.from(row?.querySelectorAll("button, [role='button']") || []);
    const semanticControl = controls.find((element) => {
        const text = controlText(element);
        if (/(add all|thêm tất cả)/iu.test(text)) return false;
        return /^[+＋]$/u.test(cleanText(element.textContent)) || /^(add|thêm)\b/iu.test(text);
      });
    if (semanticControl) return semanticControl;

    // An unlabeled control's position is not proof that it adds this person.
    return null;
  }

  function renderAggregatedGroupChatResults(dialog, state) {
    const currentRows = nativeGroupChatRecords(dialog, state.sourcePane, 1, true).length;
    if (state.records.size <= currentRows) return false;

    const customList = document.createElement("section");
    customList.className = GROUP_CHAT_AGGREGATE_CLASS;
    customList.setAttribute("aria-label", tr("content.allGroupResults", { count: state.total }));

    const summary = document.createElement("div");
    summary.className = "psqm-group-chat-aggregate-summary";
    summary.textContent = tr("content.groupSummary", { count: state.records.size, pages: Math.ceil(state.total / state.pageSize) });
    customList.append(summary);

    for (const record of state.records.values()) {
      const displayName = accountDisplayName(record.account);
      const actionName = accountActionName(record.account);
      const row = document.createElement("div");
      row.className = GROUP_CHAT_AGGREGATE_ROW_CLASS;
      row.setAttribute("data-psqm-record-key", record.key);

      const name = document.createElement("span");
      name.className = "psqm-group-chat-aggregate-name";
      name.textContent = displayName;

      const role = document.createElement("span");
      role.className = "psqm-group-chat-aggregate-role";
      role.textContent = record.account.category === "student"
        ? "Student"
        : record.account.category === "guardian" ? "Guardian" : "Staff";

      const add = document.createElement("button");
      add.type = "button";
      add.className = GROUP_CHAT_AGGREGATE_ADD_CLASS;
      add.textContent = "+";
      add.setAttribute("data-psqm-record-key", record.key);
      add.setAttribute("aria-label", tr("content.addName", { name: actionName }));
      add.title = tr("content.addName", { name: actionName });
      row.append(name, role, add);
      customList.append(row);
    }

    state.loading?.remove();
    state.loading = null;
    state.customList?.remove();
    state.customList = customList;
    groupChatInsertBeforePagination(customList, state);
    state.nativeList?.classList.add(GROUP_CHAT_NATIVE_COLLAPSED_CLASS);
    state.pagination?.classList.add(GROUP_CHAT_NATIVE_COLLAPSED_CLASS);
    state.complete = true;

    const searchInput = findSearchInput(dialog);
    if (searchInput && searchInput.getAttribute("data-psqm-aggregate-reset") !== "true") {
      searchInput.setAttribute("data-psqm-aggregate-reset", "true");
      searchInput.addEventListener("input", () => removeGroupChatAggregation(dialog, { rescan: true }));
    }

    const filterControls = visibleDialogControls(dialog)
      .filter((element) => element.matches("button, [role='button']"))
      .filter((element) => /^\+?\s*(students|guardians|staff|học sinh|phụ huynh|nhân viên)$/iu.test(cleanText(element.textContent)));
    for (const control of filterControls) {
      if (control.getAttribute("data-psqm-aggregate-reset") === "true") continue;
      control.setAttribute("data-psqm-aggregate-reset", "true");
      control.addEventListener("click", () => removeGroupChatAggregation(dialog, { rescan: true }));
    }
    return true;
  }

  function refreshNameDisplays() {
    scheduleScan();
    for (const dialog of document.querySelectorAll(`.${GROUP_CHAT_DIALOG_CLASS}`)) {
      const state = groupChatStates.get(dialog);
      if (state?.customList && state.records.size > 0) {
        renderAggregatedGroupChatResults(dialog, state);
      }
    }
  }

  async function crawlGroupChatPages(dialog, state, originalPage, pageCount, generation) {
    try {
      showGroupChatLoading(state);
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        if (generation !== state.generation) return;
        const loaded = await goToNativeGroupChatPage(dialog, state, pageNumber);
        if (!loaded) return;
        await delay(80);
        for (const record of nativeGroupChatRecords(dialog, state.sourcePane, pageNumber)) {
          const previous = state.records.get(record.key);
          if (!previous) state.records.set(record.key, record);
          else if (previous.row !== record.row && !hub.identity?.stableKey(record.account)) previous.ambiguous = true;
        }
      }

      if (generation !== state.generation) return;
      await goToNativeGroupChatPage(dialog, state, originalPage);
      if (generation !== state.generation) return;

      const liveRows = findGroupChatMemberRows(dialog, { sourceRoot: state.sourcePane });
      const liveList = liveRows.length > 0 ? lowestCommonAncestor(liveRows, dialog) : null;
      if (liveList && liveList !== dialog) state.nativeList = liveList;
      renderAggregatedGroupChatResults(dialog, state);
    } finally {
      if (generation === state.generation) {
        state.crawling = false;
        state.loading?.remove();
        state.loading = null;
      }
    }
  }

  function ensureExpandedGroupChatResults(dialog, sourcePane, memberList) {
    if (!sourcePane || !memberList) return;
    const state = groupChatState(dialog);
    if (state.crawling || state.complete) return;

    const status = groupChatResultsStatus(sourcePane);
    if (!status || status.total <= status.end - status.start + 1) return;
    const pageSize = status.start === 1 ? status.end : status.end - status.start + 1;
    if (!Number.isInteger(pageSize) || pageSize < 1) return;

    const pagination = findGroupChatPaginationRoot(status.element, sourcePane);
    if (!pagination) return;
    const pageCount = Math.ceil(status.total / pageSize);
    if (pageCount < 2) return;

    state.sourcePane = sourcePane;
    state.nativeList = memberList;
    state.pagination = pagination;
    state.pageSize = pageSize;
    state.total = status.total;
    state.records.clear();
    state.crawling = true;
    const generation = state.generation + 1;
    state.generation = generation;
    const originalPage = groupChatCurrentPage(status, pageSize);
    crawlGroupChatPages(dialog, state, originalPage, pageCount, generation);
  }

  async function activateAggregatedGroupChatControl(control) {
    if (control.getAttribute("aria-busy") === "true") return;
    const dialog = control.closest(`.${GROUP_CHAT_DIALOG_CLASS}`);
    const state = dialog ? groupChatStates.get(dialog) : null;
    const record = state?.records.get(control.getAttribute("data-psqm-record-key"));
    if (!dialog || !state || !record) return;
    if (record.ambiguous) { showToast(tr("content.ambiguousNative"), true); return; }

    control.setAttribute("aria-busy", "true");
    control.textContent = "…";
    try {
      const loaded = await goToNativeGroupChatPage(dialog, state, record.page);
      if (!loaded) throw new Error("page unavailable");
      const nativeMatches = nativeGroupChatRecords(dialog, state.sourcePane, record.page, true)
        .filter((candidate) => candidate.key === record.key);
      if (nativeMatches.length !== 1) throw new Error("ambiguous recipient");
      const nativeRecord = nativeMatches[0];
      const nativeControl = nativeGroupChatAddControl(nativeRecord?.row);
      if (!nativeControl) throw new Error("recipient unavailable");
      const selectedCount = () => {
        const pane = findSelectedMembersPane(dialog);
        return pane ? findGroupChatMemberRows(dialog, { sourceRoot: pane }).filter(row => {
          const selected = accountFromGroupChatRow(row);
          return selected && sameOriginalRecipientName(selected.name, record.account.name) && selected.category === record.account.category;
        }).length : 0;
      };
      const before = selectedCount();
      nativeControl.click();
      const confirmed = await waitFor(() => dialog.isConnected && selectedCount() > before, 4000);
      if (!confirmed) throw new Error("selection not confirmed");
      control.textContent = "✓";
      control.setAttribute("aria-label", tr("content.nameAdded", { name: accountActionName(record.account) }));
      control.setAttribute("aria-pressed", "true");
    } catch (error) {
      control.textContent = "+";
      control.setAttribute("data-psqm-error", cleanText(error?.message));
      showToast(tr("content.addFailed", { name: accountActionName(record.account) }), true, 6000);
    } finally {
      control.setAttribute("aria-busy", "false");
    }
  }

  function clearInactiveGroupChatClasses(activeDialog) {
    const classes = [
      GROUP_CHAT_DIALOG_CLASS,
      GROUP_CHAT_COLUMNS_CLASS,
      GROUP_CHAT_SOURCE_CLASS,
      GROUP_CHAT_SELECTED_CLASS,
      GROUP_CHAT_TOOLBAR_CLASS,
      GROUP_CHAT_LIST_CLASS,
      GROUP_CHAT_ROW_CLASS,
      GROUP_CHAT_FOOTER_CLASS,
      GROUP_CHAT_NATIVE_COLLAPSED_CLASS
    ];
    for (const className of classes) {
      for (const element of document.querySelectorAll(`.${className}`)) {
        if (element !== activeDialog && !activeDialog?.contains(element)) {
          if (className === GROUP_CHAT_DIALOG_CLASS) removeGroupChatAggregation(element);
          element.classList.remove(className);
        }
      }
    }
    for (const element of document.querySelectorAll(`.${GROUP_CHAT_AGGREGATE_CLASS}, .${GROUP_CHAT_LOADING_CLASS}`)) {
      if (!activeDialog?.contains(element)) element.remove();
    }
  }

  function scanCreateGroupChatDialog() {
    const dialog = findCreateGroupChatDialog();
    clearInactiveGroupChatClasses(dialog);
    if (!dialog) return 0;

    dialog.classList.add(GROUP_CHAT_DIALOG_CLASS);
    const rows = findGroupChatMemberRows(dialog);
    rows.forEach((row) => row.classList.add(GROUP_CHAT_ROW_CLASS));
    decorateNativeGroupChatNames(rows);

    const memberList = rows.length > 0 ? lowestCommonAncestor(rows, dialog) : null;
    if (memberList && memberList !== dialog) memberList.classList.add(GROUP_CHAT_LIST_CLASS);

    const selectedPane = findSelectedMembersPane(dialog);
    if (selectedPane) selectedPane.classList.add(GROUP_CHAT_SELECTED_CLASS);

    const searchInput = findSearchInput(dialog);
    const sourceAnchor = memberList || searchInput;
    let sourcePane = null;
    if (sourceAnchor && selectedPane) {
      const columns = lowestCommonAncestor([sourceAnchor, selectedPane], dialog);
      if (columns && columns !== dialog) {
        sourcePane = branchBelow(columns, sourceAnchor);
        const selectedBranch = branchBelow(columns, selectedPane);
        if (sourcePane && selectedBranch && sourcePane !== selectedBranch) {
          columns.classList.add(GROUP_CHAT_COLUMNS_CLASS);
          sourcePane.classList.add(GROUP_CHAT_SOURCE_CLASS);
          selectedBranch.classList.add(GROUP_CHAT_SELECTED_CLASS);
        }
      }
    }

    hub.guardianStudentRelations?.capture?.(dialog, sourcePane, accountFromGroupChatRow);

    const addAllControl = visibleDialogControls(dialog)
      .find((element) => /add all students|thêm tất cả học sinh/iu.test(controlText(element)));
    const toolbar = searchInput && addAllControl
      ? lowestCommonAncestor([searchInput, addAllControl], dialog)
      : null;
    if (toolbar && toolbar !== dialog && toolbar.getBoundingClientRect().height <= 240) {
      toolbar.classList.add(GROUP_CHAT_TOOLBAR_CLASS);
    }

    const actionControls = visibleDialogControls(dialog)
      .filter((element) => element.matches("button, [role='button']"));
    const createControl = actionControls.find((element) => isCreateChatLabel(controlText(element)));
    const cancelControl = actionControls.find((element) => isCancelLabel(controlText(element)));
    const footer = createControl && cancelControl
      ? lowestCommonAncestor([createControl, cancelControl], dialog)
      : null;
    if (footer && footer !== dialog && footer.getBoundingClientRect().height <= 160) {
      footer.classList.add(GROUP_CHAT_FOOTER_CLASS);
    }

    const pageSizeChanged = maximizeNativePageSize(dialog);
    if (!pageSizeChanged) ensureExpandedGroupChatResults(dialog, sourcePane, memberList);
    return 1;
  }

  function runGlobalDomScan() {
    globalScanRunning = true;
    try {
      // Group Chat can teach us a student's class code. Run it first so the
      // account-name pass can use that evidence without scheduling a second scan.
      scanCreateGroupChatDialog();
      scanAccountNames();
      scanClassGroupNames();
      ensurePostTitleHelper();
    } finally {
      globalScanRunning = false;
    }
  }

  function runSharedScan() {
    hub.languageIntro?.reconcile?.();
    if (hub.languageIntro?.blocksOtherOnboarding?.()) {
      hub.waitChatter?.reconcile();
      hub.messageOnboarding?.reconcile();
      hub.communicationLanguageWarning?.reconcile();
      return;
    }
    hub.waitChatter?.reconcile();
    hub.messageOnboarding?.reconcile();
    hub.sessionTimeoutKeeper?.reconcile();
    runGlobalDomScan();
    hub.messageModeDefault?.reconcile();
    hub.newsfeedReadiness?.reconcile();
    hub.communicationLanguageWarning?.reconcile();
    hub.walkthrough?.handleDomChange();
    hub.help?.handleContextChange();
  }

  function scheduleScan(delayMs = 250) {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(() => {
      scanTimer = null;
      runSharedScan();
    }, Math.max(0, Number(delayMs) || 0));
  }


  function showToast(message, isError = false, duration = 5000) {
    document.getElementById(TOAST_ID)?.remove();
    const toast = document.createElement("div");
    toast.id = TOAST_ID;
    toast.className = isError ? "psqm-toast psqm-toast-error" : "psqm-toast";
    toast.textContent = message;
    document.documentElement.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  }

  function formatPostTitleDate(value = "") {
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/u);
    if (!match) return "";
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (!Number.isInteger(year) || month < 1 || month > 12 || day < 1 || day > 31) return "";

    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year
      || date.getUTCMonth() !== month - 1
      || date.getUTCDate() !== day) return "";

    return `${String(day).padStart(2, "0")} ${POST_TITLE_MONTHS[month - 1]}`;
  }

  function buildManualPostTitle({ grade = "", topic = "", date = "", category = "" } = {}) {
    const selectedGrade = cleanText(grade);
    const enteredTopic = cleanText(topic);
    const selectedDate = formatPostTitleDate(date);
    const selectedCategory = cleanText(category);
    if (!selectedGrade || !enteredTopic || !selectedDate || !selectedCategory) return "";
    return `${selectedGrade} ${enteredTopic} – ${selectedDate} – ${selectedCategory}`;
  }

  function createPostTitleHelper() {
    const helper = document.createElement("section");
    helper.id = POST_TITLE_HELPER_ID;
    helper.className = "psqm-post-title-helper";
    helper.setAttribute("data-psqm-ui", "post-title-helper");

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "psqm-post-title-helper__toggle";
    toggle.textContent = tr("postTitleHelper.open");
    toggle.setAttribute("aria-expanded", "false");

    const panel = document.createElement("div");
    panel.className = "psqm-post-title-helper__panel";
    panel.hidden = true;

    const heading = document.createElement("div");
    heading.className = "psqm-post-title-helper__heading";
    heading.textContent = tr("postTitleHelper.title");

    const hint = document.createElement("p");
    hint.className = "psqm-post-title-helper__hint";
    hint.textContent = tr("postTitleHelper.hint");

    const fields = document.createElement("div");
    fields.className = "psqm-post-title-helper__fields";

    const makeField = (labelText, control) => {
      const label = document.createElement("label");
      label.className = "psqm-post-title-helper__field";
      const caption = document.createElement("span");
      caption.textContent = labelText;
      label.append(caption, control);
      return label;
    };

    const grade = document.createElement("select");
    grade.className = "psqm-post-title-helper__control";
    grade.setAttribute("aria-label", tr("postTitleHelper.grade"));
    [
      ["", tr("postTitleHelper.chooseGrade")],
      ["Kindy", "Kindy"],
      ...Array.from({ length: 12 }, (_, index) => [`G${index + 1}`, `G${index + 1}`]),
      ["MULTI-GRADE", "MULTI-GRADE"]
    ].forEach(([value, text]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text;
      grade.append(option);
    });

    const topic = document.createElement("input");
    topic.type = "text";
    topic.maxLength = 120;
    topic.autocomplete = "off";
    topic.className = "psqm-post-title-helper__control";
    topic.placeholder = tr("postTitleHelper.topicPlaceholder");

    const date = document.createElement("input");
    date.type = "date";
    date.className = "psqm-post-title-helper__control";

    const category = document.createElement("select");
    category.className = "psqm-post-title-helper__control";
    [
      ["", tr("postTitleHelper.chooseType")],
      ["INFO", "INFO"],
      ["REMINDER", "REMINDER"],
      ["ACTION REQUIRED", "ACTION REQUIRED"],
      ["EVENT", "EVENT"],
      ["UPDATE", "UPDATE"],
      ["URGENT", "URGENT"]
    ].forEach(([value, text]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text;
      category.append(option);
    });

    fields.append(
      makeField(tr("postTitleHelper.grade"), grade),
      makeField(tr("postTitleHelper.topic"), topic),
      makeField(tr("postTitleHelper.date"), date),
      makeField(tr("postTitleHelper.type"), category)
    );

    const previewLabel = document.createElement("div");
    previewLabel.className = "psqm-post-title-helper__preview-label";
    previewLabel.textContent = tr("postTitleHelper.preview");

    const preview = document.createElement("div");
    preview.className = "psqm-post-title-helper__preview";
    preview.setAttribute("aria-live", "polite");

    const actions = document.createElement("div");
    actions.className = "psqm-post-title-helper__actions";

    const insert = document.createElement("button");
    insert.type = "button";
    insert.className = "psqm-post-title-helper__insert";
    insert.textContent = tr("postTitleHelper.insert");
    insert.disabled = true;

    const close = document.createElement("button");
    close.type = "button";
    close.className = "psqm-post-title-helper__close";
    close.textContent = tr("common.close");

    actions.append(insert, close);
    panel.append(heading, hint, fields, previewLabel, preview, actions);
    helper.append(toggle, panel);

    const currentTitle = () => {
      const composer = document.getElementById("compose-view-layout");
      const element = composer?.querySelector("#input-field-compose_title");
      return element instanceof HTMLInputElement && element.isConnected ? element : null;
    };

    let autoApplyTimer = null;

    const setPostTitleValue = (titleInput, value, { focus = false } = {}) => {
      if (!(titleInput instanceof HTMLInputElement) || !titleInput.isConnected) return false;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      titleInput.dispatchEvent(new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        data: value,
        inputType: value ? "insertText" : "deleteContentBackward"
      }));
      if (setter) setter.call(titleInput, value);
      else titleInput.value = value;
      titleInput.dispatchEvent(new InputEvent("input", {
        bubbles: true,
        data: value,
        inputType: value ? "insertText" : "deleteContentBackward"
      }));
      titleInput.dispatchEvent(new Event("change", { bubbles: true }));
      if (focus) titleInput.focus();
      return true;
    };

    const applyGeneratedTitle = ({ focus = false, notify = false, closePanel = false } = {}) => {
      const value = cleanText(insert.dataset.generatedTitle);
      const titleInput = currentTitle();
      if (!value || !titleInput) return false;
      try {
        if (fieldValue(titleInput) !== value && !setPostTitleValue(titleInput, value, { focus })) return false;
        if (focus && document.activeElement !== titleInput) titleInput.focus();
        if (notify) showToast(tr("postTitleHelper.inserted"), false, 3500);
        if (closePanel) setOpen(false);
        return true;
      } catch {
        return false;
      }
    };

    const queueAutoApply = () => {
      if (autoApplyTimer !== null) window.clearTimeout(autoApplyTimer);
      autoApplyTimer = window.setTimeout(() => {
        autoApplyTimer = null;
        if (panel.hidden || !cleanText(insert.dataset.generatedTitle)) return;
        applyGeneratedTitle();
      }, 180);
    };

    const refresh = ({ autoApply = false } = {}) => {
      const value = buildManualPostTitle({
        grade: grade.value,
        topic: topic.value,
        date: date.value,
        category: category.value
      });
      preview.textContent = value || tr("postTitleHelper.previewEmpty");
      preview.classList.toggle("psqm-post-title-helper__preview--empty", !value);
      insert.disabled = !value;
      insert.dataset.generatedTitle = value;
      if (!value && autoApplyTimer !== null) {
        window.clearTimeout(autoApplyTimer);
        autoApplyTimer = null;
      } else if (autoApply && value) {
        queueAutoApply();
      }
    };

    const setOpen = (open) => {
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        refresh();
        window.setTimeout(() => grade.focus(), 0);
      } else if (autoApplyTimer !== null) {
        window.clearTimeout(autoApplyTimer);
        autoApplyTimer = null;
      }
    };

    toggle.addEventListener("click", () => setOpen(panel.hidden));
    close.addEventListener("click", () => setOpen(false));
    [grade, topic, date, category].forEach(control => {
      control.addEventListener("input", () => refresh({ autoApply: true }));
      control.addEventListener("change", () => refresh({ autoApply: true }));
    });

    insert.addEventListener("click", () => {
      if (!applyGeneratedTitle({ focus: true, notify: true, closePanel: true })) {
        showToast(tr("postTitleHelper.couldNotInsert"), true, 5000);
      }
    });

    refresh();
    return helper;
  }

  function postTitleHelperMountAnchor(titleInput, composer) {
    let anchor = titleInput;
    let parent = anchor.parentElement;
    for (let depth = 0; parent && parent !== composer && depth < 4; depth += 1) {
      const otherEditable = [...parent.querySelectorAll(
        "input, textarea, select, [contenteditable='true'], [role='combobox']"
      )].some(element => element !== titleInput && !element.closest(`#${POST_TITLE_HELPER_ID}`));
      const criticalControl = parent.querySelector(
        "#button-post-preview-btn, #button-post-post-now-btn, #multi-select-complex-1-main-button, .sun-editor-editable"
      );
      if (otherEditable || criticalControl) break;
      anchor = parent;
      parent = parent.parentElement;
    }
    return anchor;
  }

  function ensurePostTitleHelper() {
    const composer = document.getElementById("compose-view-layout");
    const titleInput = composer?.querySelector("#input-field-compose_title");
    const existing = document.getElementById(POST_TITLE_HELPER_ID);

    if (!(composer instanceof HTMLElement) || !(titleInput instanceof HTMLInputElement) || !titleInput.isConnected) {
      existing?.remove();
      return 0;
    }

    const helper = existing || createPostTitleHelper();
    const anchor = postTitleHelperMountAnchor(titleInput, composer);
    if (helper.previousElementSibling !== anchor || helper.parentElement !== anchor.parentElement) {
      anchor.insertAdjacentElement("afterend", helper);
    }
    return 1;
  }


  function visibleClickables() {
    return Array.from(document.querySelectorAll("button, a, [role='button'], [role='option'], [role='listitem'], [tabindex]"))
      .filter((element) => element instanceof HTMLElement && isVisible(element));
  }

  function exactTextClickable(labels) {
    const wanted = labels.map(matchText);
    return visibleClickables()
      .filter((element) => !element.classList.contains(ACCOUNT_CLASS))
      .find((element) => wanted.includes(matchText(element.textContent))) || null;
  }

  function findToLabel() {
    return Array.from(document.querySelectorAll("label, span, p, div"))
      .filter((element) => element instanceof HTMLElement && isVisible(element))
      .filter((element) => ["to:", "đến:"].includes(matchText(element.textContent)))
      .sort((a, b) => a.children.length - b.children.length)[0] || null;
  }

  function findMessageComposer() {
    return Array.from(document.querySelectorAll("textarea, input, [contenteditable='true']"))
      .filter((element) => element instanceof HTMLElement && isVisible(element))
      .find((element) => {
        const hints = matchText(`${element.getAttribute("aria-label") || ""} ${element.getAttribute("placeholder") || ""}`);
        return hints.includes("enter message") || hints.includes("nhập tin nhắn");
      }) || null;
  }

  function findRecipientInput() {
    const rawCandidates = Array.from(document.querySelectorAll(
      "input, textarea, [contenteditable]:not([contenteditable='false']), [role='combobox']"
    ));
    const fields = [...new Set(rawCandidates.map((element) => {
      if (element.getAttribute("role") !== "combobox") return element;
      return element.matches("input, textarea, [contenteditable]:not([contenteditable='false'])")
        ? element
        : element.querySelector("input, textarea, [contenteditable]:not([contenteditable='false'])");
    }).filter(Boolean))]
      .filter((element) => element instanceof HTMLElement && isVisible(element))
      .filter((element) => !element.disabled && !element.readOnly && element.getAttribute("type") !== "hidden");
    const toLabel = findToLabel();
    const toRect = toLabel?.getBoundingClientRect();
    const composer = findMessageComposer();

    return fields
      .map((element) => {
        const hints = matchText([
          element.getAttribute("aria-label"),
          element.getAttribute("placeholder"),
          element.getAttribute("name"),
          element.getAttribute("id"),
          element.getAttribute("role"),
          element.getAttribute("aria-autocomplete"),
          element.closest("[role='combobox']")?.getAttribute("aria-label")
        ].filter(Boolean).join(" "));
        const rect = element.getBoundingClientRect();
        const hasRecipientHint = hints.includes("recipient") || hints.includes("người nhận");
        const nearToLabel = Boolean(toRect
          && rect.top >= toRect.top - 60
          && rect.top <= toRect.bottom + 190
          && rect.left >= toRect.left - 120
          && rect.left <= toRect.right + 900);

        // A generic site-wide Search combobox is not a recipient field. The
        // field must explicitly identify recipients or sit beside the visible
        // To label in PowerSchool's New message composer.
        if (!hasRecipientHint && !nearToLabel) return { element, score: -100 };

        let score = 0;
        if (hasRecipientHint) score += 16;
        if (hints.includes("search") || hints.includes("tìm")) score += 4;
        if (hints.includes("name") || /(^|\s)to($|\s)/.test(hints)) score += 3;
        if (element.getAttribute("role") === "combobox" || element.closest("[role='combobox']")) score += 9;
        if (element.getAttribute("aria-autocomplete")) score += 5;
        if (hints.includes("enter message") || hints.includes("nhập tin nhắn") || element === composer) score -= 20;
        if (nearToLabel) score += 16;
        return { element, score };
      })
      .sort((a, b) => b.score - a.score)
      .find((item) => item.score >= 7)?.element || null;
  }

  function setFieldValue(element, value) {
    element.focus();
    if (element.isContentEditable) {
      element.dispatchEvent(new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        data: value,
        inputType: "insertText"
      }));
      element.textContent = value;
      element.dispatchEvent(new InputEvent("input", { bubbles: true, data: value, inputType: "insertText" }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }

    const prototype = element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    element.dispatchEvent(new InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      data: value,
      inputType: value ? "insertText" : "deleteContentBackward"
    }));
    if (setter) setter.call(element, value);
    else element.value = value;
    element.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      data: value,
      inputType: value ? "insertText" : "deleteContentBackward"
    }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: value.slice(-1) || "Backspace" }));
  }

  function fieldValue(element) {
    if (element.isContentEditable) return cleanText(element.textContent);
    return cleanText(element.value);
  }


  function sameOriginalRecipientName(value, expected) {
    return Boolean(matchText(expected)) && matchText(value) === matchText(expected);
  }

  function usableRecipientInput(element) {
    return element instanceof HTMLElement && element.isConnected && isVisible(element)
      && !element.disabled && !element.readOnly;
  }

  async function writeRecipientName(element, name, stillOwned = () => true) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      element = findRecipientInput() || element;
      if (!stillOwned() || !usableRecipientInput(element)) return false;
      const current = fieldValue(element);
      if (current && !sameOriginalRecipientName(current, name)) return false;
      setFieldValue(element, name);
      await delay(140);
      element = findRecipientInput() || element;
      if (!stillOwned() || !usableRecipientInput(element)) return false;
      if (sameOriginalRecipientName(fieldValue(element), name)) return true;
      if (fieldValue(element)) return false;
    }
    return false;
  }

  function isExtensionOrConversationControl(element) {
    return Boolean(element.closest('[data-psqm-ui], .psqm-direct-row, .psqm-account-link, .psqm-direct-add, .psqm-group-chat-aggregate, [data-testid="messenger-channel-preview"], [aria-label="Direct messages"]'));
  }

  function elementHasOriginalRecipientName(element, expected) {
    if (!(element instanceof HTMLElement) || !matchText(expected)) return false;
    if (sameOriginalRecipientName(element.getAttribute(NAME_ATTR), expected)) return true;
    for (const child of element.querySelectorAll(`[${NAME_ATTR}]`)) {
      if (sameOriginalRecipientName(child.getAttribute(NAME_ATTR), expected)) return true;
    }
    return textLines(element).some(line => sameOriginalRecipientName(line, expected));
  }

  function findRecipientCandidates(account) {
    const input = findRecipientInput();
    const composerScope = input && recipientSelectionRoot(input);
    if (!composerScope) return [];
    const linkedLists = new Set(cleanText(`${input.getAttribute('aria-controls') || ''} ${input.getAttribute('aria-owns') || ''}`).split(/\s/u).filter(Boolean));
    const matches = visibleClickables()
      .filter(element => !isExtensionOrConversationControl(element))
      .filter(element => !element.matches('input, textarea, [contenteditable="true"]'))
      .filter(element => {
        const listbox = element.closest('[role="listbox"]');
        return composerScope.contains(element) || Boolean(listbox?.id && linkedLists.has(listbox.id));
      })
      .map(element => {
        const lines = textLines(element);
        if (!elementHasOriginalRecipientName(element, account.name)) return null;
        const details = lines.map(accountDetailFromLine).filter(Boolean);
        const categories = [...new Set(details.map(detail => detail.category))];
        const isSearchOption = Boolean(element.closest('[role="option"], [role="listbox"]'));
        if (!isSearchOption && !details.length && !emailFromLines(lines)) return null;
        return {
          element, matchedName: account.name, matchedCategories: categories,
          categoryMatches: categories.length === 1 && categories[0] === account.category,
          contactMatches: Boolean(account.contactOf) && details.some(detail => sameOriginalRecipientName(detail.contactOf, account.contactOf)),
          unavailable: /not available to message|không thể nhắn tin/iu.test(element.textContent)
            || Boolean(element.closest('[disabled], [aria-disabled="true"]'))
        };
      }).filter(Boolean);
    // Collapse only ancestor wrappers of the same DOM result, never equal-name siblings.
    return matches.filter(item => !matches.some(other => other !== item && item.element.contains(other.element)));
  }

  function findRecipientResolution(account) {
    const candidates = findRecipientCandidates(account);
    const result = status => ({ status, candidate: null, ambiguous: status === 'ambiguous', fallback: false });
    if (!candidates.length) return result('no_candidate');
    if (candidates.some(item => item.matchedCategories.length !== 1)) return result('unverified_role');
    const matching = candidates.filter(item => item.categoryMatches);
    if (!matching.length) return result('wrong_role_only');
    if (matching.length !== 1) return result('ambiguous');
    const candidate = matching[0];
    if (account.category === 'guardian' && account.contactOf && !candidate.contactMatches) return result('ambiguous');
    if (candidate.unavailable) return result('unavailable');
    return { status: 'matched', candidate, ambiguous: false, fallback: false };
  }

  async function waitForRecipientResolution(account, recipientInput, timeout, query = account.name, stillOwned = () => true) {
    let result = { status: 'no_candidate', candidate: null };
    await waitFor(() => {
      const input = findRecipientInput() || recipientInput;
      if (!stillOwned() || !usableRecipientInput(input) || !sameOriginalRecipientName(fieldValue(input), query)) {
        result = { status: 'input_rejected', candidate: null }; return true;
      }
      result = findRecipientResolution(account);
      return result.status !== 'no_candidate';
    }, timeout);
    return { ...result, query };
  }

  function settleDomWaiters() {
    for (const evaluate of Array.from(domWaiters)) evaluate();
  }

  function waitFor(getValue, timeout = 10000) {
    return new Promise((resolve) => {
      let active = true;
      let timeoutId = null;
      const finish = (value) => {
        if (!active) return;
        active = false;
        domWaiters.delete(evaluate);
        if (timeoutId !== null) clearTimeout(timeoutId);
        resolve(value);
      };
      const evaluate = () => {
        if (!active) return;
        let value = null;
        try {
          value = getValue();
        } catch {
          finish(null);
          return;
        }
        if (value) finish(value);
      };
      domWaiters.add(evaluate);
      timeoutId = setTimeout(() => finish(null), Math.max(0, Number(timeout) || 0));
      evaluate();
    });
  }

  function delay(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  async function openNewMessageRecipientInput({ reuseExisting = true } = {}) {
    const existingInput = findRecipientInput();
    if (reuseExisting && existingInput) return existingInput;

    let newMessage = exactTextClickable(["New message", "Tin nhắn mới"]);
    if (!newMessage) {
      const navigation = globalThis.PSQM?.ui?.messages.navigation().element;
      (navigation || exactTextClickable(["Messaging", "Messages", "Message", "Nhắn"]))?.click();
      newMessage = await waitFor(() => exactTextClickable(["New message", "Tin nhắn mới"]), 8000);
    }

    if (!newMessage) return null;
    newMessage.click();
    const recipientInput = await waitFor(findRecipientInput, 8000);
    if (!recipientInput) return null;

    // PowerSchool can render the field before its search handlers are ready.
    await delay(350);
    return findRecipientInput() || recipientInput;
  }


  function recipientSearchTerms(name) {
    const fullName = cleanText(name);
    const words = fullName.split(/\s+/u).filter(word =>
      /^[\p{L}\p{M}][\p{L}\p{M}'’-]*$/u.test(word)
      && [...word.matchAll(/\p{L}/gu)].length >= 2
    );
    if (words.length < 2) return [];

    // Search terms stay unchanged name fragments. They are never reordered,
    // accent-folded, or treated as a replacement identity.
    const middle = words.slice(1, -1).map((word, index) => ({
      word, index, letters: [...word.matchAll(/\p{L}/gu)].length
    })).sort((left, right) => right.letters - left.letters || left.index - right.index);
    return [...new Set([words[0], words.at(-1), ...middle.map(item => item.word)])]
      .filter(term => !sameOriginalRecipientName(term, fullName))
      .slice(0, 3);
  }

  function clearSuggestedRecipientCandidates() {
    document.querySelectorAll('.psqm-recipient-suggested').forEach(element =>
      element.classList.remove('psqm-recipient-suggested')
    );
  }

  function suggestRecipientCandidate(candidate) {
    clearSuggestedRecipientCandidates();
    if (!candidate?.element?.isConnected) return false;
    candidate.element.classList.add('psqm-recipient-suggested');
    candidate.element.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    findRecipientInput()?.addEventListener('input', clearSuggestedRecipientCandidates, { once: true });
    return true;
  }

  async function resolveRecipientWithRetry(account, recipientInput, stillOwned = () => true) {
    // Let the host's debounced search settle, then re-resolve immediately before selection.
    await delay(400);
    let result = await waitForRecipientResolution(account, recipientInput, 2500, account.name, stillOwned);
    if (result.status !== 'no_candidate') return result;
    const input = findRecipientInput() || recipientInput;
    if (!stillOwned() || !usableRecipientInput(input) || !sameOriginalRecipientName(fieldValue(input), account.name)) {
      return { status: 'input_rejected', candidate: null };
    }
    // Live PowerSchool can omit an exact account from a full-name result page yet
    // reveal it for one unchanged name word. Try only a bounded set of original
    // fragments. A fragment result is suggested for native manual confirmation:
    // one visible result cannot prove uniqueness beyond the host's partial page.
    const terms = recipientSearchTerms(account.name);
    if (!terms.length) return waitForRecipientResolution(account, input, 3500, account.name, stillOwned);
    let last = { status: 'no_candidate', candidate: null, query: account.name };
    for (const term of terms) {
      const live = findRecipientInput() || input;
      if (!stillOwned() || !usableRecipientInput(live)) return { status: 'input_rejected', candidate: null };
      setFieldValue(live, term);
      await delay(400);
      last = await waitForRecipientResolution(account, live, 1200, term, stillOwned);
      if (last.status === 'matched') {
        suggestRecipientCandidate(last.candidate);
        return { ...last, status: 'manual_match', fallback: true };
      }
      if (last.status !== 'no_candidate') return last;
    }
    return last;
  }

  function recipientSelectionRoot(recipientInput) {
    const composer = findMessageComposer();
    let root = recipientInput.parentElement;
    for (let depth = 0; root && root !== document.body && depth < 8; depth += 1) {
      if (composer && root.contains(composer)) break;
      root = root.parentElement;
    }
    return root && root !== document.body ? root : null;
  }


  function recipientRemoveControl(element) {
    if (!(element instanceof HTMLElement)) return null;
    const controls = [element, ...element.querySelectorAll('button, [role="button"]')];
    return controls.find(control => {
      if (!control.matches('button, [role="button"]') || !isVisible(control)
        || control.closest('[disabled], [aria-disabled="true"]') || isExtensionOrConversationControl(control)) return false;
      const label = cleanText(control.getAttribute('aria-label') || control.textContent);
      return /^(remove|delete|close|dismiss|xóa|xoá)(?:\s|$)/iu.test(label) || /^[×✕✖]$/u.test(label);
    }) || null;
  }

  function selectedRecipientControl(account, recipientInput) {
    if (!usableRecipientInput(recipientInput)) return null;
    const root = recipientSelectionRoot(recipientInput);
    if (!root || !root.isConnected) return null;
    const matches = new Set();
    for (const control of root.querySelectorAll('button, [role="button"]')) {
      if (control.closest('[role="option"], [role="listbox"], [class*="result"], [class*="option"], [contenteditable="true"]')
        || isExtensionOrConversationControl(control) || recipientRemoveControl(control) !== control) continue;
      let chip = control.parentElement;
      for (let depth = 0; chip && chip !== root && depth < 4; depth += 1, chip = chip.parentElement) {
        if (chip.contains(recipientInput) || chip.querySelector('input,textarea,[contenteditable="true"],[role="listbox"]')) break;
        const removeControls = Array.from(chip.querySelectorAll('button, [role="button"]')).filter(el => recipientRemoveControl(el) === el);
        if (removeControls.length !== 1 || !isVisible(chip)) break;
        const markers = [chip, ...chip.querySelectorAll('span,p,div')];
        const labelledName = cleanText((control.getAttribute('aria-label') || '').replace(/^(remove|delete|close|dismiss|xóa|xoá)\s*/iu, ''));
        const hasName = sameOriginalRecipientName(labelledName, account.name)
          || elementHasOriginalRecipientName(chip, account.name)
          || markers.some(el => sameOriginalRecipientName(el.textContent, account.name));
        if (!hasName) continue;
        const categories = [...new Set(textLines(chip).map(accountDetailFromLine).filter(Boolean).map(item => item.category))];
        if (categories.some(category => category !== account.category)) break;
        matches.add(chip); break;
      }
    }
    return matches.size === 1 ? [...matches][0] : null;
  }

  function recipientAlreadySelected(account, recipientInput) {
    return Boolean(selectedRecipientControl(account, recipientInput));
  }

  async function removeRecipientFromComposer(account, recipientInput) {
    const selected = selectedRecipientControl(account, recipientInput);
    const remove = recipientRemoveControl(selected);
    if (!selected || !remove) return false;
    remove.click();
    const removed = await waitFor(() => {
      const current = findRecipientInput();
      return usableRecipientInput(current) && !selectedRecipientControl(account, current);
    }, 3000);
    if (!removed) return false;
    focusRecipientField(recipientInput);
    return true;
  }

  async function addRecipientToComposer(account, recipientInput) {
    const input = findRecipientInput() || recipientInput;
    if (!usableRecipientInput(input)) return 'input_rejected';
    if (recipientAlreadySelected(account, input)) return 'duplicate';
    let teacherEdited = false;
    const noteEdit = event => {
      if (event.isTrusted && event.target === findRecipientInput()) teacherEdited = true;
    };
    document.addEventListener('input', noteEdit, true);
    try {
      const stillOwned = () => !teacherEdited;
      if (!await writeRecipientName(input, account.name, stillOwned)) return 'input_rejected';
      const resolution = await resolveRecipientWithRetry(account, input, stillOwned);
      if (resolution.status !== 'matched') return resolution.status;
      const query = resolution.query;
      const current = findRecipientInput();
      if (!stillOwned() || !usableRecipientInput(current) || !sameOriginalRecipientName(fieldValue(current), query)) return 'input_rejected';
      const fresh = findRecipientResolution(account);
      if (fresh.status !== 'matched' || !fresh.candidate.element.isConnected) return fresh.status === 'matched' ? 'rejected' : fresh.status;
      fresh.candidate.element.click();
      const confirmed = await waitFor(() => {
        const live = findRecipientInput();
        return usableRecipientInput(live) && selectedRecipientControl(account, live);
      }, 4000);
      const live = findRecipientInput();
      if (!confirmed) {
        if (usableRecipientInput(live) && !fieldValue(live) && !teacherEdited) setFieldValue(live, query);
        return 'rejected';
      }
      if (usableRecipientInput(live) && sameOriginalRecipientName(fieldValue(live), query) && !teacherEdited) setFieldValue(live, '');
      return 'added';
    } finally {
      document.removeEventListener('input', noteEdit, true);
    }
  }

  function focusRecipientField(fallbackInput) {
    const recipientInput = findRecipientInput() || fallbackInput;
    if (!(recipientInput instanceof HTMLElement) || !isVisible(recipientInput)) return false;
    try {
      recipientInput.focus({ preventScroll: true });
    } catch {
      recipientInput.focus();
    }
    return true;
  }

  async function openDirectMessage(account, {
    reuseExistingComposer = false,
    focusRecipientAfter = false
  } = {}) {
    if (openingMessage) return;
    const existingInput = findRecipientInput();

    openingMessage = true;
    showToast(tr("content.preparing", { name: accountActionName(account) }), false, 15000);

    try {
      const recipientInput = reuseExistingComposer && existingInput
        ? existingInput
        : await openNewMessageRecipientInput({ reuseExisting: false });
      if (!recipientInput) {
        showToast(tr("content.recipientSearchMissing"), true, 9000);
        return;
      }

      const result = await addRecipientToComposer(account, recipientInput);
      if (focusRecipientAfter) {
        await delay(50);
        focusRecipientField(recipientInput);
      } else {
        const composer = await waitFor(findMessageComposer, 5000);
        composer?.focus();
      }

      if (result === "added") showToast(tr("content.ready", { name: accountActionName(account) }), false, 3500);
      else if (result === "duplicate") showToast(tr("content.alreadySelected", { name: accountActionName(account) }), false, 4500);
      else if (result === "manual_match") showToast(tr("content.manualMatch"), false, 9000);
      else if (result === "unavailable") showToast(tr("content.unavailable", { name: accountActionName(account) }), true, 9000);
      else if (result === "rejected") showToast(tr("content.selectionRejected"), true, 9000);
      else if (result === "input_rejected") showToast(tr("content.inputRejected"), true, 9000);
      else if (result === "no_candidate") showToast(tr("content.noCandidate"), true, 7000);
      else if (result === "wrong_role_only") showToast(tr("content.wrongRole"), true, 7000);
      else if (result === "ambiguous") showToast(tr("content.ambiguous"), true, 7000);
      else showToast(tr("content.checkRecipient"), false, 7000);
      return result;
    } finally {
      openingMessage = false;
      scheduleScan();
    }
  }

  function activateDirectAddControl(control) {
    if (control.getAttribute("aria-busy") === "true") return;
    if (openingMessage) {
      showToast(tr("content.waitRecipient"), false, 2500);
      return;
    }

    const account = accountFromElement(control);
    if (!account) return;

    const recipientInput = findRecipientInput();
    if (recipientInput && selectedRecipientControl(account, recipientInput)) {
      setDirectAddControlBusy(control, true);
      removeRecipientFromComposer(account, recipientInput)
        .then((removed) => {
          if (removed) showToast(tr("content.removed", { name: accountActionName(account) }), false, 3500);
          else showToast(tr("content.removeFailed", { name: accountActionName(account) }), true, 7000);
        })
        .finally(() => setDirectAddControlBusy(control, false));
      return;
    }

    setDirectAddControlBusy(control, true);
    openDirectMessage(account, {
      reuseExistingComposer: true,
      focusRecipientAfter: true
    }).finally(() => setDirectAddControlBusy(control, false));
  }

  function forwardDirectConversationRowClick(event) {
    const eventTarget = event?.target;
    const row = eventTarget?.closest?.(`.${DIRECT_HIT_ROW_CLASS}`)
      || eventTarget?.closest?.(`.${DIRECT_ROW_CLASS}`);
    if (!row) return false;

    if (eventTarget.closest?.(`.${DIRECT_ADD_CLASS}, [data-psqm-ui]`)) return false;
    if (eventTarget.closest?.('a, button, input, select, textarea, [contenteditable="true"], [role="button"], [role="link"]')) return false;

    const nativeNameTarget = row.querySelector?.(`.${DIRECT_DISPLAY_CLASS}`);
    if (!nativeNameTarget || nativeNameTarget.isConnected === false || typeof nativeNameTarget.click !== "function") return false;
    if (eventTarget === nativeNameTarget || nativeNameTarget.contains?.(eventTarget)) return false;

    event.preventDefault();
    event.stopPropagation();
    nativeNameTarget.click();
    return true;
  }

  function handleAccountClick(event) {
    captureConversationClassFromTarget(event.target);
    captureGroupChatClassFromTarget(event.target);
    const aggregateAddControl = event.target.closest?.(`.${GROUP_CHAT_AGGREGATE_ADD_CLASS}`);
    if (aggregateAddControl) {
      event.preventDefault();
      event.stopPropagation();
      activateAggregatedGroupChatControl(aggregateAddControl);
      return;
    }

    const directAddControl = event.target.closest?.(`.${DIRECT_ADD_CLASS}`);
    if (directAddControl) {
      event.preventDefault();
      event.stopPropagation();
      activateDirectAddControl(directAddControl);
      return;
    }

    if (forwardDirectConversationRowClick(event)) return;

    const target = event.target.closest?.(`.${ACCOUNT_CLASS}`);
    if (!target) return;
    const groupRoot = findGroupInformationRoot();
    if (!groupRoot?.contains(target)) return;

    const account = accountFromElement(target);
    if (!account) return;
    event.preventDefault();
    event.stopPropagation();
    openDirectMessage(account);
  }

  function handleAccountKeydown(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    captureConversationClassFromTarget(event.target);
    captureGroupChatClassFromTarget(event.target);

    const aggregateAddControl = event.target.closest?.(`.${GROUP_CHAT_AGGREGATE_ADD_CLASS}`);
    if (aggregateAddControl) {
      event.preventDefault();
      event.stopPropagation();
      activateAggregatedGroupChatControl(aggregateAddControl);
      return;
    }

    const directAddControl = event.target.closest?.(`.${DIRECT_ADD_CLASS}`);
    if (directAddControl) {
      event.preventDefault();
      event.stopPropagation();
      activateDirectAddControl(directAddControl);
      return;
    }

    const target = event.target.closest?.(`.${ACCOUNT_CLASS}`);
    if (!target) return;
    const groupRoot = findGroupInformationRoot();
    if (!groupRoot?.contains(target)) return;
    const account = accountFromElement(target);
    if (!account) return;
    event.preventDefault();
    event.stopPropagation();
    openDirectMessage(account);
  }

  let hubActivated = false;
  let sharedObserverInstalled = false;

  function installSharedObserver() {
    if (sharedObserverInstalled) return;
    sharedObserverInstalled = true;
    new MutationObserver(records => {
      settleDomWaiters();
      if (records.some(record => {
        if (record.target instanceof Element && record.target.closest("[data-psqm-ui], .psqm-direct-add, .psqm-group-chat-aggregate, .psqm-toast")) return false;
        if (record.type === "attributes" && record.oldValue === record.target.getAttribute(record.attributeName)) return false;
        if (record.type === "childList") {
          const nodes = [...record.addedNodes, ...record.removedNodes];
          if (nodes.length && nodes.every(node => node instanceof Element && node.matches("[data-psqm-ui]"))) return false;
        }
        return true;
      })) scheduleScan();
    }).observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ["hidden", "aria-expanded", "class", "style"]
    });
  }

  async function activateHub() {
    if (hubActivated) return;
    hubActivated = true;
    document.querySelectorAll("#psqm-root, .psqm-button").forEach((element) => element.remove());
    document.getElementById("psqm-unavailable-notice")?.remove();
    document.getElementById("psqm-recipient-toolbar")?.remove();
    document.addEventListener("click", handleAccountClick, true);
    document.addEventListener("keydown", handleAccountKeydown, true);
    hub.messageModeDefault?.mount();
    hub.waitChatter?.mount();
    hub.messageOnboarding?.mount();
    hub.sessionTimeoutKeeper?.mount();
    initializeNameDisplaySettings();
    hub.help?.initialize();
    hub.walkthrough?.initialize();
    hub.newsfeedReadiness?.mount();
    hub.communicationLanguageWarning?.mount();
    scheduleScan(0);

    hub.i18n?.onChange?.(() => {
      document.getElementById(POST_TITLE_HELPER_ID)?.remove();
      hub.walkthrough?.invalidateView?.();
      scheduleScan(0);
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") return;
      if (changes.nameDisplayMode) {
        initializeNameDisplaySettings();
      }
    });

  }

  async function start() {
    if (hub.contentStarted) return;
    hub.contentStarted = true;
    await hub.i18n?.initialize?.();

    // Remove stale first-use surfaces left by a prior unpacked-extension reload.
    document.getElementById("psqm-language-choice")?.remove();
    document.querySelectorAll("[data-phi-language-intro-root]").forEach(element => element.remove());
    installSharedObserver();

    hub.languageIntro?.onComplete?.(() => {
      void activateHub();
    });

    try {
      if (typeof hub.languageIntro?.mount !== "function") throw new Error("Robot language intro unavailable");
      await hub.languageIntro.mount();
    } catch (_) {
      // The verified Robot flow is the primary entry. Retain the previous
      // language chooser only as a fail-safe if its integration cannot mount.
      hub.languageIntro?.destroy?.();
      if (!hub.i18n?.language?.()) await hub.i18n?.ensureLanguage?.(document);
      await activateHub();
      return;
    }

    if (!hub.languageIntro?.blocksOtherOnboarding?.()) await activateHub();
  }

  hub.contentRuntime ??= {};
  hub.contentRuntime.start = start;
})();
