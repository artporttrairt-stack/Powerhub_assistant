(() => {
  "use strict";

  const ACCOUNT_CLASS = "psqm-account-link";
  const DIRECT_DISPLAY_CLASS = "psqm-direct-display-name";
  const DIRECT_ROW_CLASS = "psqm-direct-row";
  const DIRECT_ADD_CLASS = "psqm-direct-add";
  const NAME_ATTR = "data-psqm-name";
  const DETAIL_ATTR = "data-psqm-detail";
  const CATEGORY_ATTR = "data-psqm-category";
  const CONTACT_ATTR = "data-psqm-contact";
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
  const GROUP_NAME_MARKER = /(?:\b\d{1,2}L\d{1,2}[A-Z]\b|\bP\d+\b)/iu;
  const CLASS_CODE_PATTERN = /^\d{1,2}L\d{1,2}[A-Z]$/iu;
  const CLASS_CODE_TOKEN_PATTERN = /(?:^|[^\p{L}\p{N}])(\d{1,2}L\d{1,2}[A-Z])(?:[^\p{L}\p{N}]|$)/iu;
  const CLASS_PROGRAM_ATTR = "data-psqm-class-program";
  const TOAST_ID = "psqm-toast";
  const NATIVE_ATTRIBUTE_PREFIX = "data-psqm-native-";
  const NATIVE_ATTRIBUTES = ["role", "title", "aria-label", "aria-checked", "tabindex"];
  const NICKNAME_EDIT_CLASS = "psqm-nickname-edit";
  const NICKNAME_ROW_CLASS = "psqm-nickname-row";
  const NICKNAME_STORAGE_KEY = "studentNicknames";
  const NICKNAME_MAX_LENGTH = 60;

  let scanTimer = null;
  let openingMessage = false;
  let notificationsEnabled = true;
  let lastUnreadTotal = null;
  let activeConversationClassCode = "";
  let activeGroupChatClassCode = "";
  let studentNicknames = new Map();
  const groupChatStates = new WeakMap();
  const studentClassCodesByName = new Map();

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

  function studentNicknameKey(value) {
    return cleanText(value).normalize("NFC").toLowerCase();
  }

  function studentNicknameMap(value) {
    const nicknames = new Map();
    if (!value || typeof value !== "object" || Array.isArray(value)) return nicknames;

    for (const [rawKey, rawNickname] of Object.entries(value)) {
      const key = studentNicknameKey(rawKey);
      const nickname = cleanText(rawNickname);
      if (key && nickname && nickname.length <= NICKNAME_MAX_LENGTH) nicknames.set(key, nickname);
    }
    return nicknames;
  }

  function studentNickname(account) {
    if (matchText(account?.category) !== "student") return "";
    return studentNicknames.get(studentNicknameKey(account?.name)) || "";
  }

  function accountDisplayName(account) {
    const source = cleanText(account?.name);
    const category = matchText(account?.category);
    if (!source) return source;
    if (category === "student") return studentNickname(account) || studentDisplayName(source);
    if (category === "guardian") return guardianDisplayName(source);
    return staffDisplayName(source);
  }

  function accountActionName(account) {
    const displayName = accountDisplayName(account);
    const originalName = cleanText(account?.name);
    return studentNickname(account) && displayName !== originalName
      ? `${displayName} (PowerSchool: ${originalName})`
      : displayName;
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
    const suffix = cleanText(classCode).slice(-1).toUpperCase();
    return suffix === "A" ? "CAP" : suffix === "I" ? "CAPI" : suffix === "E" ? "CEP" : "";
  }

  function normalizeClassPeriod(value) {
    const match = cleanText(value).match(/^P(\d+)(?:\s*[-–—]\s*P?(\d+))?$/iu);
    if (!match) return "";
    return match[2] ? `P${match[1]}-P${match[2]}` : `P${match[1]}`;
  }

  function classCodeTrailer(value) {
    const parenthesized = value.match(/\(([^()]*)\)\s*$/u);
    if (parenthesized) {
      const codeMatch = cleanText(parenthesized[1]).match(CLASS_CODE_TOKEN_PATTERN);
      const classCode = cleanText(codeMatch?.[1]).toUpperCase();
      if (CLASS_CODE_PATTERN.test(classCode)) {
        return {
          body: cleanText(value.slice(0, parenthesized.index)),
          classCode
        };
      }
    }

    const bare = value.match(/^(.*?)\s*[-–—]\s*(\d{1,2}L\d{1,2}[A-Z])(?:\s*[-–—]\s*(?:CAP|CAPI|CEP))?\s*$/iu);
    const classCode = cleanText(bare?.[2]).toUpperCase();
    return bare && CLASS_CODE_PATTERN.test(classCode)
      ? { body: cleanText(bare[1]), classCode }
      : null;
  }

  function classGroupNameParts(value) {
    const original = cleanText(value);
    if (original.length < 10 || original.length > 280) return null;

    const alreadyFormatted = original.match(/^(\d{1,2}L\d{1,2}[A-Z])\s*[-–—]\s*(.+?)\s*[-–—]\s*(P\d+(?:\s*[-–—]\s*P?\d+)?)(?:\s*\([^)]*\))?\s*$/iu);
    if (alreadyFormatted) {
      const classCode = cleanText(alreadyFormatted[1]).toUpperCase();
      const subject = cleanText(alreadyFormatted[2]).replace(/\s*\([^()]*\)\s*$/u, "");
      const period = normalizeClassPeriod(alreadyFormatted[3]);
      if (!subject || !period || !/\p{L}/u.test(subject)) return null;
      return {
        original,
        classCode,
        program: classProgramFromCode(classCode),
        display: `${classCode} - ${subject} - ${period}`
      };
    }

    const periodMarkers = original.match(/\bP\d+(?:\s*[-–—]\s*P?\d+)?(?:\s*\([^)]*\))?/giu);
    if (!periodMarkers || periodMarkers.length !== 1) return null;

    const trailer = classCodeTrailer(original);
    if (!trailer) return null;
    const match = trailer.body.match(/^(.+?)\s*[-–—]\s*(P\d+(?:\s*[-–—]\s*P?\d+)?)(?:\s*\([^)]*\))?\s*[-–—]\s*(.+)$/iu);
    if (!match) return null;

    const subjectWithTranslation = cleanText(match[1]);
    const owner = cleanText(match[3]);
    const metadataRole = /(?:^|\s*[-–—]\s*)(?:staff|student|guardian|teacher|nhân viên|học sinh|phụ huynh|giáo viên)(?:\s*[-–—]\s*|$)/iu;
    if (metadataRole.test(subjectWithTranslation)) return null;

    const subject = subjectWithTranslation.replace(/\s*\([^()]*\)\s*$/u, "");
    const period = normalizeClassPeriod(match[2]);
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
    const key = foldedName(account.name);
    if (!key) return false;
    let codes = studentClassCodesByName.get(key);
    if (!codes) {
      codes = new Set();
      studentClassCodesByName.set(key, codes);
    }
    const previousSize = codes.size;
    codes.add(classCode);
    return codes.size !== previousSize;
  }

  function rememberedStudentClassCode(account) {
    if (account?.category !== "student") return "";
    const codes = studentClassCodesByName.get(foldedName(account.name));
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
        `.${DIRECT_DISPLAY_CLASS}[${NAME_ATTR}], .${ACCOUNT_CLASS}[${NAME_ATTR}], .${GROUP_CHAT_NATIVE_NAME_CLASS}[${NAME_ATTR}]`
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

  function accountFromElement(element) {
    const name = cleanText(element.getAttribute(NAME_ATTR));
    if (!name) return null;
    return {
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

  function configureNicknameEditControl(control, account) {
    const nickname = studentNickname(account);
    control.type = "button";
    control.className = NICKNAME_EDIT_CLASS;
    control.classList.toggle("psqm-nickname-edit-active", Boolean(nickname));
    control.textContent = "✎";
    control.setAttribute(NAME_ATTR, account.name);
    control.setAttribute(DETAIL_ATTR, account.detail);
    control.setAttribute(CATEGORY_ATTR, account.category);
    control.setAttribute(CONTACT_ATTR, account.contactOf);
    control.setAttribute("aria-label", nickname
      ? `Edit nickname ${nickname} for PowerSchool student ${account.name}`
      : `Set a nickname for PowerSchool student ${account.name}`);
    control.title = nickname
      ? `Nickname: ${nickname}\nPowerSchool name: ${account.name}`
      : `Set nickname\nPowerSchool name: ${account.name}`;
    return control;
  }

  function createNicknameEditControl(account) {
    if (matchText(account?.category) !== "student") return null;
    return configureNicknameEditControl(document.createElement("button"), account);
  }

  function ensureNicknameEditControl(row, account) {
    if (!(row instanceof HTMLElement)) return null;
    let control = Array.from(row.querySelectorAll(`.${NICKNAME_EDIT_CLASS}`))
      .find((element) => element instanceof HTMLButtonElement);

    if (matchText(account?.category) !== "student") {
      control?.remove();
      row.classList.remove(NICKNAME_ROW_CLASS);
      return null;
    }

    if (!control) control = createNicknameEditControl(account);
    configureNicknameEditControl(control, account);
    row.classList.add(NICKNAME_ROW_CLASS);
    if (control.parentElement !== row) row.append(control);
    return control;
  }

  async function editStudentNickname(control) {
    const account = accountFromElement(control);
    if (!account || matchText(account.category) !== "student") return;

    const currentNickname = studentNickname(account);
    const entered = window.prompt(
      `Nickname for ${account.name}\n\nLeave blank to use the standard student display name.\nSaved only in this browser.`,
      currentNickname
    );
    if (entered === null) return;

    const nickname = cleanText(entered);
    if (nickname.length > NICKNAME_MAX_LENGTH) {
      showToast(`Nickname must be ${NICKNAME_MAX_LENGTH} characters or fewer.`, true, 6000);
      return;
    }

    const stored = await chrome.storage.local.get({ [NICKNAME_STORAGE_KEY]: {} });
    const nextNicknames = studentNicknameMap(stored[NICKNAME_STORAGE_KEY]);
    const key = studentNicknameKey(account.name);
    if (!nickname || matchText(nickname) === matchText(account.name)) nextNicknames.delete(key);
    else nextNicknames.set(key, nickname);

    studentNicknames = nextNicknames;
    await chrome.storage.local.set({
      [NICKNAME_STORAGE_KEY]: Object.fromEntries(nextNicknames)
    });
    refreshNicknameDisplays();
    showToast(nickname
      ? `Showing ${nickname}; PowerSchool search still uses ${account.name}.`
      : `Nickname removed; PowerSchool search still uses ${account.name}.`, false, 6000);
  }

  async function initializeStudentNicknames() {
    try {
      const stored = await chrome.storage.local.get({ [NICKNAME_STORAGE_KEY]: {} });
      studentNicknames = studentNicknameMap(stored[NICKNAME_STORAGE_KEY]);
    } catch {
      studentNicknames = new Map();
    }
    refreshNicknameDisplays();
  }

  function decorateDirectDisplayName(element, account) {
    const displayName = accountDisplayName(account);
    element.classList.remove(ACCOUNT_CLASS, "psqm-recipient-selected");
    element.classList.add(DIRECT_DISPLAY_CLASS);
    element.setAttribute(NAME_ATTR, account.name);
    element.setAttribute(DETAIL_ATTR, account.detail);
    element.setAttribute(CATEGORY_ATTR, account.category);
    element.setAttribute(CONTACT_ATTR, account.contactOf);
    restoreNativeAttributes(element);
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
      ? `Remove ${displayName} from New message`
      : `Add ${displayName} to New message`;
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
    element.setAttribute("role", "link");
    element.removeAttribute("aria-checked");
    const label = action === "add"
      ? `Add ${actionName} to New message`
      : `Open a direct message with ${actionName}`;
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
        `.${DIRECT_DISPLAY_CLASS}[${NAME_ATTR}], .${ACCOUNT_CLASS}[${NAME_ATTR}], .${GROUP_CHAT_NATIVE_NAME_CLASS}[${NAME_ATTR}]`
      ) || findExactNameElement(match.row, match.account.name);
      if (!nameElement) continue;

      const account = {
        ...match.account,
        name: cleanText(nameElement.getAttribute(NAME_ATTR)) || match.account.name,
        detail: cleanText(nameElement.getAttribute(DETAIL_ATTR)) || match.account.detail,
        category: cleanText(nameElement.getAttribute(CATEGORY_ATTR)) || match.account.category,
        contactOf: cleanText(nameElement.getAttribute(CONTACT_ATTR)) || match.account.contactOf
      };
      decorator(nameElement, account, match.row, detailLabel);
      found += 1;
    }

    return found;
  }

  function scanAccountNames() {
    const groupRoot = findGroupInformationRoot();
    const classCode = classCodeFromGroupRoot(groupRoot);
    const activeStudentDetails = new Set();
    let found = groupRoot
      ? scanAccountRoot(groupRoot, (element, account, _row, detailLabel) => {
        decorateQuickMessageLink(element, account, "open");
        ensureNicknameEditControl(_row, account);
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
      found += scanAccountRoot(root, (element, account, row, detailLabel) => {
        decorateDirectDisplayName(element, account);
        ensureDirectAddControl(row, account);
        ensureNicknameEditControl(row, account);
        const directClassCode = rememberedStudentClassCode(account);
        if (directClassCode) {
          decorateStudentClassDetail(detailLabel, account, directClassCode);
          activeStudentDetails.add(detailLabel);
        } else if (detailLabel.classList.contains(STUDENT_CLASS_DETAIL_CLASS)) {
          restoreStudentClassDetail(detailLabel);
        }
      });
    }
    restoreInactiveStudentClassDetails(activeStudentDetails);
    document.getElementById("psqm-recipient-toolbar")?.remove();
    return found;
  }

  function scanClassGroupNames() {
    let found = 0;
    const candidates = Array.from(document.querySelectorAll(GROUP_NAME_SELECTOR))
      .filter((element) => element instanceof HTMLElement && isVisible(element))
      .filter((element) => {
        const storedOriginal = cleanText(element.getAttribute(GROUP_NAME_ATTR));
        return Boolean(storedOriginal) || GROUP_NAME_MARKER.test(cleanText(element.textContent));
      });

    for (const element of candidates) {
      const storedOriginal = cleanText(element.getAttribute(GROUP_NAME_ATTR));
      if (!storedOriginal && element.children.length > 0) continue;

      const parts = classGroupNameParts(storedOriginal || element.textContent);
      if (!parts) continue;

      element.setAttribute(GROUP_NAME_ATTR, parts.original);
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
        name: cleanText(storedNameElement.getAttribute(NAME_ATTR)),
        detail: cleanText(storedNameElement.getAttribute(DETAIL_ATTR)),
        category: cleanText(storedNameElement.getAttribute(CATEGORY_ATTR)),
        contactOf: cleanText(storedNameElement.getAttribute(CONTACT_ATTR))
      };
    }

    const fromLines = accountFromLines(textLines(row));
    if (fromLines) return fromLines;

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
      return { name: labelledName, ...metadata };
    }

    const nameElement = textElements
      .filter((element) => element.children.length === 0)
      .find((element) => {
        const text = cleanText(element.textContent);
        return text !== cleanText(detailElement.textContent) && looksLikeAccountName(text);
      });
    const name = cleanText(nameElement?.textContent);
    return name ? { name, ...metadata } : null;
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
      const displayName = accountDisplayName(account);
      if (cleanText(nameElement.textContent) !== displayName) nameElement.textContent = displayName;
      ensureNicknameEditControl(row, account);
      decorated += 1;
    }
    if (learnedClass) setTimeout(scanAccountNames, 0);
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
      const key = [foldedName(account.name), account.category, foldedName(account.contactOf)].join("|");
      records.push({ key, page: pageNumber, account, row });
    }
    if (learnedClass) setTimeout(scanAccountNames, 0);
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
    if (rescan) setTimeout(scheduleScan, 450);
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
    loading.textContent = `Loading all ${state.total} results…`;
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
      }, 6000, 100);
      if (!loaded) return false;
    }
    return false;
  }

  function nativeGroupChatAddControl(row) {
    const controls = Array.from(row?.querySelectorAll("button, [role='button']") || [])
      .filter((element) => !element.classList.contains(NICKNAME_EDIT_CLASS));
    const semanticControl = controls.find((element) => {
        const text = controlText(element);
        if (/(add all|thêm tất cả)/iu.test(text)) return false;
        return /^[+＋]$/u.test(cleanText(element.textContent)) || /^(add|thêm)\b/iu.test(text);
      });
    if (semanticControl) return semanticControl;

    return controls
      .filter((element) => {
        const label = controlText(element);
        return !/(expand|collapse|details?|view|next|previous|mở rộng|thu gọn)/iu.test(label);
      })
      .sort((a, b) => {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        return (bRect.left - aRect.left) || (Array.from(row.querySelectorAll("button, [role='button']")).indexOf(b)
          - Array.from(row.querySelectorAll("button, [role='button']")).indexOf(a));
      })[0] || null;
  }

  function renderAggregatedGroupChatResults(dialog, state) {
    const currentRows = nativeGroupChatRecords(dialog, state.sourcePane, 1, true).length;
    if (state.records.size <= currentRows) return false;

    const customList = document.createElement("section");
    customList.className = GROUP_CHAT_AGGREGATE_CLASS;
    customList.setAttribute("aria-label", `All ${state.total} group chat results`);

    const summary = document.createElement("div");
    summary.className = "psqm-group-chat-aggregate-summary";
    summary.textContent = `${state.records.size} accounts from all ${Math.ceil(state.total / state.pageSize)} pages`;
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
      add.setAttribute("aria-label", `Add ${actionName}`);
      add.title = `Add ${actionName}`;
      const nicknameSlot = document.createElement("span");
      nicknameSlot.className = "psqm-group-chat-aggregate-nickname";
      const nicknameControl = createNicknameEditControl(record.account);
      if (nicknameControl) nicknameSlot.append(nicknameControl);
      row.append(name, role, nicknameSlot, add);
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

  function refreshNicknameDisplays() {
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
          if (!state.records.has(record.key)) state.records.set(record.key, record);
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

    control.setAttribute("aria-busy", "true");
    control.textContent = "…";
    try {
      const loaded = await goToNativeGroupChatPage(dialog, state, record.page);
      if (!loaded) throw new Error("page unavailable");
      const nativeRecord = nativeGroupChatRecords(dialog, state.sourcePane, record.page, true)
        .find((candidate) => candidate.key === record.key);
      const nativeControl = nativeGroupChatAddControl(nativeRecord?.row);
      if (!nativeControl) throw new Error("recipient unavailable");
      nativeControl.click();
      await delay(250);
      control.textContent = "✓";
      control.setAttribute("aria-label", `${record.account.name} added`);
      control.setAttribute("aria-pressed", "true");
    } catch (error) {
      control.textContent = "+";
      control.setAttribute("data-psqm-error", cleanText(error?.message));
      showToast(`${record.account.name} could not be added automatically.`, true, 6000);
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

  function scheduleScan() {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(() => {
      scanAccountNames();
      scanClassGroupNames();
      scanCreateGroupChatDialog();
      scanUnreadMessages();
    }, 250);
  }

  function messagingStatusLines() {
    return String(document.body?.innerText || "")
      .split(/\n+/)
      .map(cleanText)
      .filter(Boolean);
  }

  function unreadTotalFromPage(lines = messagingStatusLines()) {
    const counts = [];
    for (const line of lines) {
      const match = line.match(/^(\d+)\s+(?:unread messages?|tin nhắn chưa đọc)$/iu);
      if (match) counts.push(Number(match[1]));
    }

    for (const element of document.querySelectorAll("[aria-label]")) {
      const label = cleanText(element.getAttribute("aria-label"));
      const match = label.match(/^(\d+)\s+(?:unread messages?|tin nhắn chưa đọc)$/iu);
      if (match) counts.push(Number(match[1]));
    }

    return counts.length > 0 ? Math.max(...counts) : null;
  }

  function messagingIsConnecting(lines) {
    return lines.some((line) => {
      const text = matchText(line).replace(/…/g, "...");
      return text === "trying to connect..." || text === "đang thử kết nối...";
    });
  }

  function reportUnreadState(total, increase) {
    // Reloading an unpacked extension invalidates the previous content-script
    // context until the PowerSchool tab is refreshed. In that short-lived
    // state `chrome.runtime` can disappear while MutationObserver callbacks
    // are still queued, so treat reporting as optional and fail silently.
    const runtime = globalThis.chrome?.runtime;
    if (!runtime || typeof runtime.sendMessage !== "function") return;

    try {
      const pending = runtime.sendMessage({
        type: "PSQM_UNREAD_STATE",
        total,
        increase,
        notificationsEnabled
      });
      if (pending && typeof pending.catch === "function") pending.catch(() => {});
    } catch {
      // The extension may have been reloaded between the capability check and
      // the send. The refreshed content script will resume badge reporting.
    }
  }

  function scanUnreadMessages({ establishBaseline = false } = {}) {
    const lines = messagingStatusLines();
    if (messagingIsConnecting(lines)) return;

    const total = unreadTotalFromPage(lines);
    if (total === null) return;

    if (establishBaseline || lastUnreadTotal === null) {
      lastUnreadTotal = total;
      reportUnreadState(total, 0);
      return;
    }

    if (total === lastUnreadTotal) return;
    const increase = notificationsEnabled && total > lastUnreadTotal
      ? total - lastUnreadTotal
      : 0;
    lastUnreadTotal = total;
    reportUnreadState(total, increase);
  }

  async function initializeMessageNotifications() {
    try {
      const settings = await chrome.storage.local.get({ messageNotificationsEnabled: true });
      notificationsEnabled = settings.messageNotificationsEnabled !== false;
    } catch {
      notificationsEnabled = true;
    }
    scanUnreadMessages({ establishBaseline: true });
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

  async function writeRecipientName(element, name) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      setFieldValue(element, name);
      await delay(140);
      if (matchText(fieldValue(element)) === matchText(name)) return true;

      element.focus();
      if (typeof element.select === "function") element.select();
      try {
        document.execCommand("insertText", false, name);
      } catch {
        // Native value + input events remain the primary path.
      }
      await delay(140);
      if (matchText(fieldValue(element)) === matchText(name)) return true;
    }

    return false;
  }

  function findRecipientCandidates(account) {
    const expectedDetail = matchText(account.detail);
    const expectedContact = account.contactOf;
    const matches = visibleClickables()
      .filter((element) => !element.classList.contains(ACCOUNT_CLASS))
      .filter((element) => !element.querySelector?.(`.${ACCOUNT_CLASS}`))
      .map((element) => {
        const lines = textLines(element);
        const matchedNames = lines
          .map((line) => ({ line, quality: nameMatchQuality(line, account.name) }))
          .filter((match) => match.quality > 0)
          .sort((a, b) => b.quality - a.quality);
        if (matchedNames.length === 0) return null;

        const candidateDetails = lines.map(accountDetailFromLine).filter(Boolean);
        const contactMatches = Boolean(expectedContact) && candidateDetails.some((detail) => (
          detail.contactOf && samePersonName(detail.contactOf, expectedContact)
        ));
        const categoryMatches = candidateDetails.some((detail) => detail.category === account.category);
        const detailMatches = candidateDetails.some((detail) => matchText(detail.detail) === expectedDetail);

        const text = matchText(element.textContent);
        const role = element.getAttribute("role") || "";
        let score = matchedNames[0].quality * 5;
        if (role === "option") score += 15;
        if (role === "listitem") score += 12;
        if (element.tagName === "BUTTON") score += 8;
        if (categoryMatches) score += 10;
        if (detailMatches) score += 8;
        if (contactMatches) score += 20;
        if (text.includes("email id:")) score += 5;
        if (element.getBoundingClientRect().height > 240) score -= 20;

        return {
          element,
          matchedName: matchedNames[0].line,
          nameQuality: matchedNames[0].quality,
          matchedCategories: [...new Set(candidateDetails.map((detail) => detail.category))],
          detailKey: candidateDetails.map((detail) => matchText(detail.detail)).sort().join("|"),
          contactMatches,
          categoryMatches,
          detailMatches,
          unavailable: text.includes("not available to message") || text.includes("không thể nhắn tin"),
          email: emailFromLines(lines),
          score
        };
      })
      .filter(Boolean)
      .filter((candidate) => (
        candidate.matchedCategories.length > 0
        || Boolean(candidate.detailKey)
        || Boolean(candidate.email)
        || candidate.unavailable
      ))
      .sort((a, b) => b.score - a.score);

    const unique = new Map();
    for (const match of matches) {
      const key = [
        nameTokenKey(match.matchedName),
        match.matchedCategories.sort().join(","),
        match.detailKey,
        match.email,
        match.contactMatches,
        match.unavailable
      ].join("\u0000");
      if (!unique.has(key)) unique.set(key, match);
    }
    return [...unique.values()].sort((a, b) => b.score - a.score);
  }

  function findRecipientResolution(account) {
    // Token-reordered names remain searchable, but an explicitly different
    // PowerSchool role is never an automatic match. For example,
    // "Quỳnh Trang Ngô – Student contact" is not the same account as
    // "Trang Ngo Quynh – Primary Teacher".
    const candidates = findRecipientCandidates(account).filter((candidate) => (
      candidate.matchedCategories.length === 0 || candidate.categoryMatches
    ));
    if (candidates.length === 0) return null;

    if (account.category === "guardian" && account.contactOf) {
      const relationshipMatches = candidates.filter((candidate) => candidate.contactMatches);
      if (relationshipMatches.length === 1) {
        return { candidate: relationshipMatches[0], ambiguous: false, fallback: false };
      }
      if (relationshipMatches.length > 1) {
        return { candidate: null, ambiguous: true, fallback: false };
      }
      if (candidates.length === 1) {
        return { candidate: candidates[0], ambiguous: false, fallback: true };
      }
      return { candidate: null, ambiguous: true, fallback: false };
    }

    const detailMatches = candidates.filter((candidate) => candidate.detailMatches);
    if (detailMatches.length === 1) {
      return { candidate: detailMatches[0], ambiguous: false, fallback: false };
    }

    const categoryMatches = candidates.filter((candidate) => candidate.categoryMatches);
    if (categoryMatches.length === 1) {
      return { candidate: categoryMatches[0], ambiguous: false, fallback: false };
    }

    if (candidates.length === 1) {
      return { candidate: candidates[0], ambiguous: false, fallback: true };
    }

    return { candidate: null, ambiguous: true, fallback: false };
  }

  function waitFor(getValue, timeout = 10000, interval = 200) {
    return new Promise((resolve) => {
      const started = Date.now();
      const check = () => {
        const value = getValue();
        if (value) return resolve(value);
        if (Date.now() - started >= timeout) return resolve(null);
        setTimeout(check, interval);
      };
      check();
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
      exactTextClickable(["Messages", "Message", "Nhắn"])?.click();
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

  async function resolveRecipientWithRetry(account, recipientInput) {
    let resolution = await waitFor(() => findRecipientResolution(account), 3500);
    if (resolution) return resolution;

    const retryInput = findRecipientInput() || recipientInput;
    setFieldValue(retryInput, "");
    await delay(250);
    const nameVisible = await writeRecipientName(retryInput, account.name);
    if (!nameVisible) return null;

    resolution = await waitFor(() => findRecipientResolution(account), 6500);
    return resolution;
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

  function selectedRecipientControl(account, recipientInput) {
    const root = recipientSelectionRoot(recipientInput);
    if (!root) return null;

    const labelledControl = Array.from(root.querySelectorAll("button, [role='button'], [aria-label], [aria-selected='true']"))
      .filter((element) => element !== recipientInput)
      .find((element) => {
        const labels = [element.getAttribute("aria-label"), element.textContent]
          .map(cleanText)
          .filter(Boolean);
        const hasRemoveAction = labels.some((label) => /(remove|delete|xóa|xoá)/iu.test(label));
        if (!hasRemoveAction && element.getAttribute("aria-selected") !== "true") return false;

        const expected = foldedName(account.name);
        return labels.some((label) => {
          const withoutAction = cleanText(label.replace(/\b(remove|delete|xóa|xoá)\b/giu, ""));
          if (sameOrderedPersonName(withoutAction, account.name)) return true;
          const labelKey = ` ${foldedName(label)} `;
          return Boolean(expected) && labelKey.includes(` ${expected} `);
        });
      }) || null;
    if (labelledControl) return labelledControl;

    // Some PowerSchool recipient chips expose the account name only as a
    // plain span and put the remove action on a sibling button. Match the
    // original web-name order inside the composer, never a token-sorted name,
    // and ignore autocomplete/search result rows.
    const nameMarker = Array.from(root.querySelectorAll("span, p, div, button, [role='button'], [aria-selected='true']"))
      .filter((element) => element !== recipientInput && isVisible(element))
      .filter((element) => !element.closest("[role='option'], [role='listbox'], [class*='result'], [class*='option'], [class*='menu']"))
      .find((element) => sameOrderedPersonName(cleanText(element.textContent), account.name));
    if (!nameMarker) return null;

    let current = nameMarker;
    for (let depth = 0; current && current !== root && depth < 5; depth += 1) {
      const className = typeof current.className === "string" ? current.className : "";
      const hasRemoveControl = Array.from(current.querySelectorAll?.("button, [role='button'], [aria-label]") || [])
        .some((element) => {
          const label = cleanText(`${element.getAttribute("aria-label") || ""} ${element.textContent || ""}`);
          return /(remove|delete|xóa|xoá|close|dismiss)/iu.test(label) || /^[×✕✖x]$/iu.test(label);
        });
      if (hasRemoveControl
        || current.matches("button, [role='button'], [aria-selected='true']")
        || /(chip|token|pill|recipient|badge)/iu.test(className)) {
        return current;
      }
      current = current.parentElement;
    }

    return nameMarker;
  }

  function recipientAlreadySelected(account, recipientInput) {
    return Boolean(selectedRecipientControl(account, recipientInput));
  }

  async function removeRecipientFromComposer(account, recipientInput) {
    const selectedControl = selectedRecipientControl(account, recipientInput);
    if (!selectedControl) return false;

    const removeControl = Array.from(selectedControl.querySelectorAll?.("button, [role='button'], [aria-label]") || [])
      .find((element) => {
        const label = cleanText(`${element.getAttribute("aria-label") || ""} ${element.textContent || ""}`);
        return /(remove|delete|xóa|xoá|close|dismiss)/iu.test(label) || /^[×✕✖x]$/iu.test(label);
      }) || selectedControl;
    removeControl.click();
    await waitFor(() => !selectedRecipientControl(account, recipientInput), 3000, 100);
    focusRecipientField(recipientInput);
    return !selectedRecipientControl(account, recipientInput);
  }

  async function addRecipientToComposer(account, recipientInput) {
    const currentInput = findRecipientInput() || recipientInput;
    if (recipientAlreadySelected(account, currentInput)) return "duplicate";

    setFieldValue(currentInput, "");
    await delay(100);
    const nameVisible = await writeRecipientName(currentInput, account.name);
    if (!nameVisible) return "rejected";

    const resolution = await resolveRecipientWithRetry(account, currentInput);
    if (!resolution) return "manual";
    if (resolution.ambiguous || !resolution.candidate) return "ambiguous";
    if (resolution.candidate.unavailable) return "unavailable";

    resolution.candidate.element.click();
    await delay(250);
    const searchInput = findRecipientInput() || currentInput;
    if (fieldValue(searchInput)) setFieldValue(searchInput, "");
    return "added";
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
    showToast(`Preparing ${account.name}...`, false, 15000);

    try {
      const recipientInput = reuseExistingComposer && existingInput
        ? existingInput
        : await openNewMessageRecipientInput({ reuseExisting: false });
      if (!recipientInput) {
        showToast("The PowerSchool recipient search box could not be found.", true, 9000);
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

      if (result === "added") showToast(`${account.name} is ready.`, false, 3500);
      else if (result === "duplicate") showToast(`${account.name} is already selected.`, false, 4500);
      else if (result === "unavailable") showToast(`${account.name} is not available to message.`, true, 9000);
      else if (result === "rejected") showToast(`The recipient box did not accept ${account.name}.`, true, 9000);
      else showToast(`${account.name} is entered. Select the matching account manually.`, false, 9000);
      return result;
    } finally {
      openingMessage = false;
      scheduleScan();
    }
  }

  function activateDirectAddControl(control) {
    if (control.getAttribute("aria-busy") === "true") return;
    if (openingMessage) {
      showToast("Please wait for the current recipient to finish.", false, 2500);
      return;
    }

    const account = accountFromElement(control);
    if (!account) return;

    const recipientInput = findRecipientInput();
    if (recipientInput && selectedRecipientControl(account, recipientInput)) {
      setDirectAddControlBusy(control, true);
      removeRecipientFromComposer(account, recipientInput)
        .then((removed) => {
          if (removed) showToast(`${account.name} was removed from New message.`, false, 3500);
          else showToast(`${account.name} could not be removed automatically.`, true, 7000);
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

  function handleAccountClick(event) {
    const nicknameControl = event.target.closest?.(`.${NICKNAME_EDIT_CLASS}`);
    if (nicknameControl) {
      event.preventDefault();
      event.stopPropagation();
      editStudentNickname(nicknameControl).catch(() => {
        showToast("The nickname could not be saved.", true, 6000);
      });
      return;
    }

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

  function handleAccountKeydown(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    const nicknameControl = event.target.closest?.(`.${NICKNAME_EDIT_CLASS}`);
    if (nicknameControl) {
      event.preventDefault();
      event.stopPropagation();
      editStudentNickname(nicknameControl).catch(() => {
        showToast("The nickname could not be saved.", true, 6000);
      });
      return;
    }

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

  function start() {
    document.querySelectorAll("#psqm-root, .psqm-button").forEach((element) => element.remove());
    document.getElementById("psqm-unavailable-notice")?.remove();
    document.getElementById("psqm-recipient-toolbar")?.remove();
    document.addEventListener("click", handleAccountClick, true);
    document.addEventListener("keydown", handleAccountKeydown, true);
    scanAccountNames();
    scanClassGroupNames();
    scanCreateGroupChatDialog();
    initializeStudentNicknames();
    initializeMessageNotifications();

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") return;
      if (changes.messageNotificationsEnabled) {
        notificationsEnabled = changes.messageNotificationsEnabled.newValue !== false;
        scanUnreadMessages({ establishBaseline: true });
      }
      if (changes[NICKNAME_STORAGE_KEY]) {
        studentNicknames = studentNicknameMap(changes[NICKNAME_STORAGE_KEY].newValue);
        refreshNicknameDisplays();
      }
    });

    new MutationObserver(scheduleScan).observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["hidden", "aria-expanded", "class", "style"]
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
