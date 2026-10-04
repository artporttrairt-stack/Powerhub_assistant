(function (root) {
  "use strict";
  const hub = root.PSQM ??= {};
  if (hub.ui) return;

  const CLASSES_TOGGLE_ID = "messenger-inbox__conversation-list-classes-accordion-toggle";
  const CLASSES_LIST_ID = "messenger-inbox__conversation-list-classes-accordion-accordion-content";
  const GROUP_CHAT_ACCOUNT_TOKEN_PATTERN = /^[A-Za-z0-9_-]{26}$/u;
  const GROUP_CHAT_HOST_ID = "messenger-inbox__channel-header__right__staff-create-group-from-group";
  const GROUP_CHAT_BUTTON_ID = "button-messenger-inbox__channel-header__right__staff-create-group-from-group";
  const DIRECT_GUARDIAN_GROUP_HOST_ID = "messenger-inbox__channel-header__right__create-guardian-chat";
  const DIRECT_GUARDIAN_GROUP_BUTTON_ID = "button-messenger-inbox__channel-header__right__create-guardian-chat";
  const LANGUAGE_SETTINGS_HEADING_ID = "mfe-dashboard-language-locale-settings-dialog-aria-labelledby-target";
  const LANGUAGE_CONTROL_ID = "input-field-mfe-dashboard-select-language";
  const LANGUAGE_HELPER_ID = "mfe-dashboard-select-language";
  const LANGUAGE_PICKER_ID = "mfe-dashboard-select-language-popper-item-picker";
  const MESSAGE_TRANSLATION_WRAPPER_ID = "messenger-inbox__translation-text-button";
  const MESSAGE_TRANSLATION_BUTTON_ID = "button-messenger-inbox__translation-text-button";

  function nativeLanguageSettingsHeading(text) {
    const normalized = String(text || "").replace(/\s+/gu, " ").trim();
    return normalized.length > 0;
  }

  function nativeLanguageOptionCode(id) {
    const match = String(id || "").match(/^neon-popper-button-\d+__([A-Za-z]{2,3}(?:_[A-Za-z0-9]+)*)-button$/u);
    return match?.[1] || "";
  }

  function nativeLanguageLabelCode(label) {
    const normalized = String(label || "").replace(/\s+/gu, " ").trim();
    const known = {
      English: "en",
      "English (UK)": "en_GB",
      "English (United Kingdom)": "en_GB",
      Vietnamese: "vi",
      "Tiếng Việt": "vi"
    };
    return known[normalized] || "";
  }

  function nativeLanguageSelectionState({
    dialogVerified,
    controlCount,
    tagName,
    role,
    ariaLabel,
    helperCount,
    helperText,
    pickerVisible,
    selectedCount,
    selectedOptionId,
    controlLabel
  }) {
    const contract = dialogVerified === true
      && controlCount === 1
      && tagName === "BUTTON"
      && role === "combobox"
      && helperCount === 1;
    if (!contract) return { verified: false, code: "", label: "", reason: "language-control-contract-mismatch" };

    const label = String(controlLabel || "").replace(/\s+/gu, " ").trim();
    if (pickerVisible === true) {
      if (selectedCount !== 1) {
        return { verified: false, code: "", label, reason: "language-selection-ambiguous" };
      }
      const code = nativeLanguageOptionCode(selectedOptionId);
      return code
        ? { verified: true, code, label, reason: "observed-selected-option" }
        : { verified: false, code: "", label, reason: "language-option-id-mismatch" };
    }

    const code = nativeLanguageLabelCode(label);
    return code
      ? { verified: true, code, label, reason: "observed-control-label" }
      : { verified: false, code: "", label, reason: "unsupported-language-label" };
  }

  function audienceGroupSelectionState({ chipCount, uniqueChipIdCount, overflowMenuCount }) {
    if (!Number.isInteger(chipCount) || chipCount < 0
      || !Number.isInteger(uniqueChipIdCount) || uniqueChipIdCount < 0
      || !Number.isInteger(overflowMenuCount) || overflowMenuCount < 0) {
      return { count: 0, verified: false };
    }
    if (chipCount > 0) {
      return { count: chipCount, verified: uniqueChipIdCount === chipCount };
    }
    if (overflowMenuCount === 1) return { count: 1, verified: true };
    if (overflowMenuCount > 1) return { count: 0, verified: false };
    return { count: 0, verified: true };
  }

  function classesToggleState({ expanded, controls }) {
    if (!["true", "false"].includes(expanded)) return false;
    if (expanded === "false") return controls === "" || controls === CLASSES_LIST_ID;
    return controls === CLASSES_LIST_ID;
  }

  function classListState({
    expanded,
    controlledCount,
    controlledVisible,
    controlledStructureValid = true
  }) {
    if (!["true", "false"].includes(expanded)
      || !Number.isInteger(controlledCount)
      || controlledCount < 0
      || controlledCount > 1
      || (controlledCount === 1 && controlledStructureValid !== true)) {
      return { verified: false, visible: false };
    }
    if (expanded === "false") {
      return controlledCount === 1 && controlledVisible
        ? { verified: false, visible: false }
        : { verified: true, visible: false };
    }
    const visible = controlledCount === 1 && controlledVisible === true;
    return { verified: visible, visible };
  }

  function groupInformationPanelState({ candidateCount, headingVisible }) {
    return candidateCount === 1 && headingVisible === true;
  }

  function activeConversationRegionState({ connected, tagName, labelledBy, headingMatchesExact, headingVisible }) {
    return connected === true
      && tagName === "SECTION"
      && labelledBy === "conversationHeading"
      && headingMatchesExact === true
      && headingVisible === true;
  }

  function messageTranslationControlContract({
    conversationVerified,
    wrapperId,
    wrapperHasClass,
    wrapperType,
    wrapperIcon,
    wrapperIconPosition,
    wrapperConnected,
    wrapperVisible,
    buttonId,
    buttonTagName,
    buttonType,
    buttonConnected,
    buttonVisible,
    buttonDisabled,
    buttonAriaDisabled,
    extensionOwned
  }) {
    const structuralMatch = conversationVerified === true
      && wrapperId === MESSAGE_TRANSLATION_WRAPPER_ID
      && wrapperHasClass === true
      && wrapperType === "borderless"
      && wrapperConnected === true
      && wrapperVisible === true
      && buttonId === MESSAGE_TRANSLATION_BUTTON_ID
      && buttonTagName === "BUTTON"
      && buttonType === "button"
      && buttonConnected === true
      && buttonVisible === true
      && buttonDisabled !== true
      && String(buttonAriaDisabled || "").toLowerCase() !== "true"
      && extensionOwned !== true;

    if (!structuralMatch) return { verified: false, view: "unknown", reason: "translation-control-contract-mismatch" };
    if (wrapperIcon === "caret-right" && wrapperIconPosition === "right") {
      return { verified: true, view: "translated", reason: "native-translation-view" };
    }
    if (wrapperIcon === "caret-left" && wrapperIconPosition === "left") {
      return { verified: true, view: "original", reason: "native-original-view" };
    }
    return { verified: false, view: "unknown", reason: "translation-view-state-mismatch" };
  }

  function classConversationState({ regionVerified, classTabCount }) {
    if (regionVerified !== true) {
      return { active: false, verified: false, reason: "conversation-region-missing" };
    }
    if (!Number.isInteger(classTabCount) || classTabCount < 0 || classTabCount > 1) {
      return { active: false, verified: false, reason: "ambiguous-class-tabs" };
    }
    return {
      active: classTabCount === 1,
      verified: true,
      reason: classTabCount === 1 ? "verified-class-tabs" : "no-class-tabs"
    };
  }

  function directRoleCategory(value) {
    const normalized = String(value || "").replace(/\s+/gu, " ").trim();
    const first = normalized.split(/\s*[-–—]\s*/u)[0]?.toLocaleLowerCase?.("vi") || "";
    if (first === "student" || first === "học sinh") return "student";
    if (first === "guardian" || first === "người giám hộ") return "guardian";
    if (first === "staff" || first === "nhân viên") return "staff";
    return "";
  }

  function directConversationState({
    regionVerified,
    classVerified,
    classActive,
    headingText,
    descriptionText
  } = {}) {
    const heading = String(headingText || "").replace(/\s+/gu, " ").trim();
    if (regionVerified !== true) return { active: false, verified: false, category: "", identityKey: "", reason: "conversation-region-missing" };
    if (classVerified !== true) return { active: false, verified: false, category: "", identityKey: "", reason: "class-state-unverified" };
    if (classActive === true) return { active: false, verified: true, category: "", identityKey: "", reason: "class-conversation-active" };
    const category = directRoleCategory(descriptionText);
    if (!heading || !category) return { active: false, verified: false, category: "", identityKey: "", reason: "direct-role-unverified" };
    return {
      active: true,
      verified: true,
      category,
      identityKey: `${category}:${heading}`,
      reason: `verified-direct-${category}`
    };
  }

  function directInformationButtonState({
    candidateCount,
    directVerified,
    tagName,
    className,
    connected,
    inVerifiedActiveHeader,
    visible,
    disabled,
    ariaDisabled,
    extensionOwned
  } = {}) {
    const classes = String(className || "").split(/\s+/u);
    return candidateCount === 1
      && directVerified === true
      && tagName === "BUTTON"
      && classes.includes("sendbird-chat-header__right__info")
      && classes.includes("sendbird-iconbutton")
      && connected === true
      && inVerifiedActiveHeader === true
      && visible === true
      && disabled !== true
      && ariaDisabled !== "true"
      && extensionOwned !== true;
  }

  function directGuardianGroupChatButtonState({
    directVerified,
    directCategory,
    headerContainsHeading,
    hostCount,
    hostConnected,
    hostVisible,
    hostInsideHeader,
    hostId,
    hostHasClass,
    hostType,
    hostIcon,
    hostDisabled,
    hostAriaDisabled,
    buttonCount,
    buttonTagName,
    buttonType,
    buttonConnected,
    buttonVisible,
    buttonInsideHost,
    buttonId,
    buttonDisabled,
    buttonAriaDisabled,
    extensionOwned
  } = {}) {
    return directVerified === true
      && directCategory === "student"
      && headerContainsHeading === true
      && hostCount === 1
      && hostConnected === true
      && hostVisible === true
      && hostInsideHeader === true
      && hostId === DIRECT_GUARDIAN_GROUP_HOST_ID
      && hostHasClass === true
      && hostType === "utility"
      && hostIcon === "user-group-add"
      && hostDisabled !== true
      && hostAriaDisabled !== "true"
      && buttonCount === 1
      && buttonTagName === "BUTTON"
      && buttonType === "button"
      && buttonConnected === true
      && buttonVisible === true
      && buttonInsideHost === true
      && buttonId === DIRECT_GUARDIAN_GROUP_BUTTON_ID
      && buttonDisabled !== true
      && buttonAriaDisabled !== "true"
      && extensionOwned !== true;
  }

  function groupChatButtonState({
    classVerified,
    classActive,
    headerContainsHeading,
    hostCount,
    hostConnected,
    hostVisible,
    hostInsideHeader,
    hostId,
    hostHasClass,
    hostType,
    hostIcon,
    hostDisabled,
    hostAriaDisabled,
    buttonCount,
    buttonTagName,
    buttonType,
    buttonConnected,
    buttonVisible,
    buttonInsideHost,
    buttonId,
    buttonDisabled,
    buttonAriaDisabled,
    extensionOwned
  }) {
    return classVerified === true
      && classActive === true
      && headerContainsHeading === true
      && hostCount === 1
      && hostConnected === true
      && hostVisible === true
      && hostInsideHeader === true
      && hostId === GROUP_CHAT_HOST_ID
      && hostHasClass === true
      && hostType === "utility"
      && hostIcon === "user-group-add"
      && hostDisabled !== true
      && hostAriaDisabled !== "true"
      && buttonCount === 1
      && buttonTagName === "BUTTON"
      && buttonType === "button"
      && buttonConnected === true
      && buttonVisible === true
      && buttonInsideHost === true
      && buttonId === GROUP_CHAT_BUTTON_ID
      && buttonDisabled !== true
      && buttonAriaDisabled !== "true"
      && extensionOwned !== true;
  }

  function uniqueExactStudentCardMatch({ nativeTitle, candidates }) {
    const clean = value => String(value ?? "").replace(/\s+/gu, " ").trim();
    const title = clean(nativeTitle);
    if (!title) {
      return { verified: false, candidate: null, reason: "missing-native-title" };
    }

    const matches = (Array.isArray(candidates) ? candidates : []).filter(candidate => (
      candidate?.category === "student"
      && clean(candidate.nativeName) === title
    ));

    if (matches.length !== 1) {
      return {
        verified: false,
        candidate: null,
        reason: matches.length > 1
          ? "ambiguous-exact-student-match"
          : "no-exact-student-match"
      };
    }

    return { verified: true, candidate: matches[0] };
  }

  function directoryResultsTableState({ candidateCount, headers, rowCount }) {
    const normalizedHeaders = Array.isArray(headers)
      ? headers.map(value => String(value ?? "").replace(/\s+/gu, " ").trim())
      : [];
    const roleHeader = normalizedHeaders[3] || "";
    const verified = candidateCount === 1
      && normalizedHeaders.length === 5
      && normalizedHeaders[0] === "Name"
      && normalizedHeaders[1] === "Grade"
      && normalizedHeaders[2] === "School"
      && roleHeader.length > 0
      && !["Name", "Grade", "School", "Contact"].includes(roleHeader)
      && normalizedHeaders[4] === "Contact"
      && Number.isInteger(rowCount)
      && rowCount >= 0;
    return { verified, visible: verified && rowCount > 0, roleHeader };
  }

  function directoryChatButtonState({ tableVerified, rowCount, chatCount, tagName, ariaLabel, inResultsTable }) {
    return tableVerified === true
      && Number.isInteger(rowCount)
      && rowCount > 0
      && chatCount === 1
      && tagName === "BUTTON"
      && ariaLabel === "chat"
      && inResultsTable === true;
  }

  function directMessageComposerState({ conversationVerified, messageInputVerified }) {
    return conversationVerified === true && messageInputVerified === true;
  }

  function directMessageComposerRegionState({ connected, tagName, labelledBy, headingTag, headingId, headingVisible }) {
    return connected === true
      && tagName === "SECTION"
      && labelledBy === "conversationHeading"
      && headingTag === "H2"
      && headingId === "conversationHeading"
      && headingVisible === true;
  }

  function groupChatSelectionState({ candidateCount, summaryCount, selectedCount, rowCount, emptyPrompt }) {
    const verified = candidateCount === 1
      && summaryCount === 1
      && Number.isInteger(selectedCount)
      && selectedCount >= 0
      && Number.isInteger(rowCount)
      && rowCount >= 1
      && (selectedCount === 0
        ? rowCount === 1 && emptyPrompt === true
        : emptyPrompt === false);
    return { verified, selected: verified && selectedCount > 0, count: verified ? selectedCount : 0 };
  }

  function groupChatDialogState({
    hostCount,
    hostId,
    hostConnected,
    hostVisible,
    hostContainsDialog,
    hostExtensionOwned,
    dialogCount,
    dialogTagName,
    dialogClassName,
    dialogRole,
    dialogAriaModal,
    dialogConnected,
    dialogVisible,
    dialogInsideHost,
    dialogExtensionOwned,
    labelledBy,
    labelCount,
    labelTagName,
    labelRole,
    labelId,
    labelConnected,
    labelVisible,
    labelInsideDialog,
    labelExtensionOwned
  }) {
    const dialogClasses = String(dialogClassName || "").split(/\s+/u).filter(Boolean);
    return hostCount === 1
      && hostId === "messenger-inbox__create-group-from-group-modal"
      && hostConnected === true
      && hostContainsDialog === true
      && hostExtensionOwned !== true
      && dialogCount === 1
      && dialogTagName === "SECTION"
      && dialogClasses.includes("neon-dialog")
      && dialogRole === "dialog"
      && dialogAriaModal === "true"
      && dialogConnected === true
      && dialogVisible === true
      && dialogInsideHost === true
      && dialogExtensionOwned !== true
      && labelledBy === "messenger-inbox__create-group-from-group-modal-aria-labelledby-target"
      && labelCount === 1
      && labelTagName === "DIV"
      && labelRole === "heading"
      && labelId === "messenger-inbox__create-group-from-group-modal-aria-labelledby-target"
      && labelConnected === true
      && labelVisible === true
      && labelInsideDialog === true
      && labelExtensionOwned !== true;
  }

  function groupChatFilterStateContract({
    candidateCount,
    expectedId,
    id,
    tagName,
    type,
    connected,
    inVerifiedDialog,
    inFilterWrapper,
    visible,
    disabled,
    ariaDisabled,
    extensionOwned,
    labelCount,
    labelTagName,
    labelFor,
    labelConnected,
    labelInsideDialog,
    labelInFilterWrapper,
    labelHasStableClass,
    labelExtensionOwned
  }) {
    return candidateCount === 1
      && id === expectedId
      && tagName === "INPUT"
      && type === "checkbox"
      && connected === true
      && inVerifiedDialog === true
      && inFilterWrapper === true
      && visible === true
      && disabled !== true
      && ariaDisabled !== "true"
      && extensionOwned !== true
      && labelCount === 1
      && labelTagName === "LABEL"
      && labelFor === expectedId
      && labelConnected === true
      && labelInsideDialog === true
      && labelInFilterWrapper === true
      && labelHasStableClass === true
      && labelExtensionOwned !== true;
  }

  function groupChatMemberTableState({
    candidateCount,
    tagName,
    className,
    connected,
    visible,
    inVerifiedDialog,
    inSelectableRegion,
    extensionOwned,
    headerRowCount,
    headerCellCount,
    allHeaderCellsTh
  }) {
    const classes = String(className || "").split(/\s+/u).filter(Boolean);
    return candidateCount === 1
      && tagName === "TABLE"
      && classes.includes("messenger-inbox__user-selection-table")
      && connected === true
      && visible === true
      && inVerifiedDialog === true
      && inSelectableRegion === true
      && extensionOwned !== true
      && headerRowCount === 1
      && headerCellCount === 3
      && allHeaderCellsTh === true;
  }

  function groupChatRelationshipControlState({
    tagName,
    hasExpandClass,
    token,
    connected,
    visible,
    disabled,
    ariaDisabled,
    inVerifiedTable,
    inBodyRow,
    extensionOwned
  }) {
    return tagName === "BUTTON"
      && hasExpandClass === true
      && ["messenger-inbox.expand", "messenger-inbox.collapse"].includes(token)
      && connected === true
      && visible === true
      && disabled !== true
      && ariaDisabled !== "true"
      && inVerifiedTable === true
      && inBodyRow === true
      && extensionOwned !== true;
  }

  function groupChatAddControlState({
    exactIdCount,
    id,
    tagName,
    type,
    connected,
    visible,
    disabled,
    ariaDisabled,
    inVerifiedTable,
    inBodyRow,
    inVerifiedDialog,
    extensionOwned
  }) {
    const match = String(id || "").match(/^button-add-user-([A-Za-z0-9_-]{26})$/u);
    return exactIdCount === 1
      && Boolean(match)
      && tagName === "BUTTON"
      && type === "button"
      && connected === true
      && visible === true
      && disabled !== true
      && ariaDisabled !== "true"
      && inVerifiedTable === true
      && inBodyRow === true
      && inVerifiedDialog === true
      && extensionOwned !== true;
  }

  function groupChatSelectedSectionState({
    sectionCount,
    sectionClassName,
    sectionConnected,
    sectionVisible,
    inVerifiedDialog,
    extensionOwned,
    headerCount,
    summaryCount,
    summaryClassName,
    summaryInsideHeader,
    tableCount,
    tableTagName,
    tableClassName,
    tableConnected,
    tableVisible,
    tableInsideSection,
    headerRowCount,
    headerCellCount,
    allHeaderCellsTh,
    selectedRowCount,
    emptyRowCount,
    emptyRowClassName,
    emptyCellCount,
    emptyCellClassName,
    emptyCellColspan
  }) {
    const sectionClasses = String(sectionClassName || "").split(/\s+/u).filter(Boolean);
    const summaryClasses = String(summaryClassName || "").split(/\s+/u).filter(Boolean);
    const tableClasses = String(tableClassName || "").split(/\s+/u).filter(Boolean);
    const shared = sectionCount === 1
      && sectionClasses.includes("messenger-inbox__selected-items-section")
      && sectionConnected === true
      && sectionVisible === true
      && inVerifiedDialog === true
      && extensionOwned !== true
      && headerCount === 1
      && summaryCount === 1
      && summaryClasses.includes("messenger-inbox__selected-count")
      && summaryInsideHeader === true
      && tableCount === 1
      && tableTagName === "TABLE"
      && tableClasses.includes("messenger-inbox__selected-items-table")
      && tableConnected === true
      && tableVisible === true
      && tableInsideSection === true
      && headerRowCount === 1
      && headerCellCount === 3
      && allHeaderCellsTh === true
      && Number.isInteger(selectedRowCount)
      && selectedRowCount >= 0
      && Number.isInteger(emptyRowCount)
      && emptyRowCount >= 0;
    if (!shared) return { verified: false, selected: false, count: 0 };
    if (selectedRowCount > 0) {
      const verified = emptyRowCount === 0 && emptyCellCount === 0;
      return { verified, selected: verified, count: verified ? selectedRowCount : 0 };
    }
    const emptyVerified = emptyRowCount === 1
      && String(emptyRowClassName || "").split(/\s+/u).includes("messenger-inbox__empty-state-row")
      && emptyCellCount === 1
      && String(emptyCellClassName || "").split(/\s+/u).includes("messenger-inbox__empty-state-cell")
      && String(emptyCellColspan || "") === "3";
    return { verified: emptyVerified, selected: false, count: 0 };
  }

  function groupChatExactControlState({
    candidateCount,
    expectedId,
    id,
    expectedTagName,
    tagName,
    expectedType,
    type,
    connected,
    inVerifiedDialog,
    visible,
    disabled,
    ariaDisabled,
    extensionOwned
  }) {
    return candidateCount === 1
      && id === expectedId
      && tagName === expectedTagName
      && type === expectedType
      && connected === true
      && inVerifiedDialog === true
      && visible === true
      && disabled !== true
      && ariaDisabled !== "true"
      && extensionOwned !== true;
  }

  function groupChatPaginationState({
    candidateCount,
    className,
    connected,
    visible,
    inVerifiedSelectableRegion,
    extensionOwned,
    previousCount,
    previousId,
    nextCount,
    nextId,
    pageButtonCount,
    pageIds
  }) {
    const classes = String(className || "").split(/\s+/u).filter(Boolean);
    const ids = Array.isArray(pageIds) ? pageIds : [];
    const pagePattern = /^messenger-inbox__selectable-users-pagination-button(\d+)-of-(\d+)$/u;
    const parsed = ids.map(id => String(id || "").match(pagePattern));
    const total = parsed[0] ? Number.parseInt(parsed[0][2], 10) : 0;
    const pagesValid = Number.isInteger(pageButtonCount)
      && pageButtonCount > 0
      && ids.length === pageButtonCount
      && new Set(ids).size === ids.length
      && parsed.every((match, index) => match
        && Number.parseInt(match[1], 10) === index + 1
        && Number.parseInt(match[2], 10) === total)
      && total === pageButtonCount;
    return candidateCount === 1
      && classes.includes("messenger-inbox__user-selection-pagination")
      && connected === true
      && visible === true
      && inVerifiedSelectableRegion === true
      && extensionOwned !== true
      && previousCount === 1
      && previousId === "button-messenger-inbox__selectable-users-pagination-previous-button"
      && nextCount === 1
      && nextId === "button-messenger-inbox__selectable-users-pagination-next-button"
      && pagesValid;
  }

  function messageListPointerCandidateState({
    kind,
    tagName,
    role,
    text,
    ariaPressed,
    ariaBusy,
    ariaDisabled,
    ariaLabel,
    hasOriginalName,
    inDirectRow,
    inConversationList
  }) {
    const shared = hasOriginalName === true
      && inDirectRow === true
      && inConversationList === true
      && String(ariaLabel || "").trim().length > 0
      && ariaBusy !== "true"
      && ariaDisabled !== "true";
    if (!shared) return false;
    if (kind === "add") {
      return tagName === "SPAN"
        && role === "button"
        && String(text || "").trim() === "+"
        && ariaPressed === "false";
    }
    return false;
  }

  function messagingToolsButtonState({
    candidateCount,
    tagName,
    id,
    connected,
    inInboxHeader,
    visible,
    disabled,
    ariaDisabled,
    extensionOwned
  }) {
    return candidateCount === 1
      && tagName === "BUTTON"
      && id === "button-messenger-inbox__tools-menu-btn"
      && connected === true
      && inInboxHeader === true
      && visible === true
      && disabled !== true
      && ariaDisabled !== "true"
      && extensionOwned !== true;
  }

  function messageListRegionState({
    candidateCount,
    tagName,
    id,
    className,
    labelledBy,
    headingCount,
    headingTag,
    headingId,
    headingInsideRegion,
    inMessengerInbox
  }) {
    return candidateCount === 1
      && tagName === "SECTION"
      && id === "conversationListRegion"
      && String(className || "").split(/\s+/u).includes("messenger-inbox__conversationlist-region")
      && labelledBy === "conversationListHeading"
      && headingCount === 1
      && headingTag === "H1"
      && headingId === "conversationListHeading"
      && headingInsideRegion === true
      && inMessengerInbox === true;
  }

  function messageClassTabListState({
    candidateCount,
    role,
    inActiveConversation,
    tabsHostId,
    studentsCount,
    guardiansCount,
    everyoneCount
  }) {
    return candidateCount === 1
      && role === "tablist"
      && inActiveConversation === true
      && tabsHostId === "class-group-tabs"
      && studentsCount === 1
      && guardiansCount === 1
      && everyoneCount === 1;
  }

  function messageClassTabState({
    candidateCount,
    id,
    expectedId,
    role,
    inVerifiedTabList,
    inActiveConversation,
    classActive,
    visible,
    disabled,
    ariaDisabled
  }) {
    return candidateCount === 1
      && id === expectedId
      && role === "tab"
      && inVerifiedTabList === true
      && inActiveConversation === true
      && classActive === true
      && visible === true
      && disabled !== true
      && ariaDisabled !== "true";
  }

  function messageClassTabLabelText({ candidateCount, text }) {
    return candidateCount === 1 ? String(text || "").replace(/\s+/gu, " ").trim() : "";
  }

  function classAudienceConversationState({
    classVerified,
    classActive,
    selectedAudiences,
    composerVerified,
    informationButtonVerified,
    informationButtonReason,
    classTitle
  }) {
    const allowed = new Set(["students", "guardians", "everyone"]);
    const selected = Array.isArray(selectedAudiences)
      ? selectedAudiences.filter(audience => allowed.has(audience))
      : [];
    const title = String(classTitle || "").replace(/\s+/gu, " ").trim();

    if (classVerified !== true || classActive !== true) {
      return { verified: false, audience: "", empty: false, started: false, key: "", reason: "class-conversation-not-ready" };
    }
    if (selected.length !== 1) {
      return { verified: false, audience: "", empty: false, started: false, key: "", reason: "audience-selection-ambiguous" };
    }
    if (composerVerified !== true || !title) {
      return { verified: false, audience: selected[0], empty: false, started: false, key: "", reason: "audience-conversation-not-settled" };
    }
    if (informationButtonVerified !== true && informationButtonReason !== "target-missing") {
      return { verified: false, audience: selected[0], empty: false, started: false, key: "", reason: "information-state-unverified" };
    }

    const audience = selected[0];
    const started = informationButtonVerified === true;
    return {
      verified: true,
      audience,
      empty: !started,
      started,
      key: `${title}|${audience}`,
      reason: started ? "information-available" : "verified-information-missing"
    };
  }

  function startConversationCardState({
    cardCount,
    cardTagName,
    cardClassName,
    cardVisible,
    markerCount,
    markerTagName,
    markerClassName,
    markerVisible,
    titleCount,
    titleTagName,
    titleTestId,
    titleText,
    titleVisible,
    titleDisabled,
    titleAriaDisabled,
    inConversationList
  }) {
    return cardCount === 1
      && cardTagName === "DIV"
      && String(cardClassName || "").split(/\s+/u).includes("messenger-inbox__messenger-channel-preview")
      && cardVisible === true
      && markerCount === 1
      && markerTagName === "DIV"
      && markerClassName === "messenger-inbox__conversation-list-classes-start-convo"
      && markerVisible === true
      && titleCount === 1
      && titleTagName === "BUTTON"
      && titleTestId === "messenger-channel-preview"
      && String(titleText || "").replace(/\s+/gu, " ").trim().length > 0
      && titleVisible === true
      && titleDisabled !== true
      && titleAriaDisabled !== "true"
      && inConversationList === true;
  }

  function informationButtonState({
    candidateCount,
    classVerified,
    classActive,
    tagName,
    className,
    connected,
    inVerifiedActiveHeader,
    visible,
    disabled,
    ariaDisabled,
    extensionOwned
  }) {
    const classes = String(className || "").split(/\s+/u);
    return candidateCount === 1
      && classVerified === true
      && classActive === true
      && tagName === "BUTTON"
      && classes.includes("sendbird-chat-header__right__info")
      && classes.includes("sendbird-iconbutton")
      && connected === true
      && inVerifiedActiveHeader === true
      && visible === true
      && disabled !== true
      && ariaDisabled !== "true"
      && extensionOwned !== true;
  }

  function createAdapter(doc, location) {
    const clean = value => String(value ?? "").replace(/\s+/gu, " ").trim();
    const observedOn = "2026-09-07";
    const classesToggleId = CLASSES_TOGGLE_ID;
    const classesListId = CLASSES_LIST_ID;
    const groupInformationPanelSelector =
      'section[data-testid="messenger-group-information-panel"][aria-labelledby="messenger-group-information-heading"]';
    let previewElement = null, previewToken = null;
    const missing = reason => ({ element: null, verified: false, strategy: null, confidence: "none", reason, observedOn });
    function visible(element) {
      if (!element?.isConnected || element.closest('[hidden], [aria-hidden="true"]')) return false;
      for (let node = element; node instanceof doc.defaultView.Element; node = node.parentElement) {
        const style = doc.defaultView.getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
      }
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }
    function accessibleName(element) {
      const labelled = element.getAttribute("aria-labelledby");
      return clean(element.getAttribute("aria-label")
        || (labelled && labelled.split(/\s/u).map(id => doc.getElementById(id)?.textContent || "").join(" "))
        || (element.labels?.length && [...element.labels].map(label => label.textContent).join(" "))
        || element.textContent);
    }
    function unique(elements, strategy, confidence = "high") {
      const matches = [...new Set(elements)].filter(element => visible(element) && !element.closest("[data-psqm-ui]"));
      if (matches.length !== 1) return missing(matches.length ? "ambiguous-target" : "target-missing");
      return { element: matches[0], verified: true, strategy, confidence, observedOn, verification: "locator-observed", verifiedRole: null };
    }
    function locate(selectors, labels = [], scope = doc, semantic = "button, [role='button']") {
      if (!scope) return missing("scope-missing");
      for (const selector of selectors) {
        const result = unique([...scope.querySelectorAll(selector)], "observed-id");
        if (result.element || result.reason === "ambiguous-target") return result;
      }
      if (labels.length) return unique([...scope.querySelectorAll(semantic)]
        .filter(element => labels.includes(accessibleName(element))), "accessible-name");
      return missing("target-missing");
    }

    function languageSettingsDialog() {
      const dialogs = [...doc.querySelectorAll(`[role="dialog"][aria-labelledby="${LANGUAGE_SETTINGS_HEADING_ID}"]`)]
        .filter(element => element.isConnected && !element.closest("[data-psqm-ui]"));
      if (dialogs.length !== 1) {
        return missing(dialogs.length ? "ambiguous-language-settings-dialog" : "language-settings-dialog-missing");
      }
      const dialog = dialogs[0];
      const headings = [...dialog.querySelectorAll(`#${LANGUAGE_SETTINGS_HEADING_ID}`)]
        .filter(element => element.isConnected && nativeLanguageSettingsHeading(element.textContent));
      if (headings.length !== 1 || !visible(dialog) || !visible(headings[0])) {
        return missing(headings.length > 1 ? "ambiguous-language-settings-heading" : "language-settings-dialog-contract-mismatch");
      }
      return unique([dialog], "observed-language-settings-dialog");
    }

    function languageSelection() {
      const dialog = languageSettingsDialog();
      if (!dialog.verified || !dialog.element) {
        return { ...dialog, code: "", label: "" };
      }

      const controls = [...dialog.element.querySelectorAll(`#${LANGUAGE_CONTROL_ID}`)]
        .filter(element => element.isConnected && !element.closest("[data-psqm-ui]"));
      const helpers = [...dialog.element.querySelectorAll(`#${LANGUAGE_HELPER_ID}`)]
        .filter(element => element.isConnected
          && !element.closest("[data-psqm-ui]")
          && controls[0]
          && element.contains(controls[0]));
      const pickerMatches = [...doc.querySelectorAll(`#${LANGUAGE_PICKER_ID}`)]
        .filter(element => element.isConnected && !element.closest("[data-psqm-ui]") && visible(element));
      if (pickerMatches.length > 1) {
        return { ...missing("ambiguous-language-picker"), code: "", label: "" };
      }
      const picker = pickerMatches[0] || null;
      const selected = picker
        ? [...picker.querySelectorAll('[role="option"][aria-selected="true"]')]
          .filter(element => element.isConnected && !element.closest("[data-psqm-ui]") && visible(element))
        : [];
      const control = controls[0] || null;
      const state = nativeLanguageSelectionState({
        dialogVerified: dialog.verified,
        controlCount: controls.length,
        tagName: control?.tagName || "",
        role: control?.getAttribute("role") || "",
        ariaLabel: control?.getAttribute("aria-label") || "",
        helperCount: helpers.length,
        helperText: helpers[0]?.getAttribute("data-helper-text") || "",
        pickerVisible: Boolean(picker),
        selectedCount: selected.length,
        selectedOptionId: selected[0]?.id || "",
        controlLabel: control?.textContent || ""
      });
      return {
        element: state.verified ? control : null,
        dialog: dialog.element,
        verified: state.verified,
        strategy: state.reason,
        confidence: state.verified ? "high" : "none",
        reason: state.reason,
        observedOn,
        code: state.code,
        label: state.label
      };
    }

    function languageSettingsConfirmButton() {
      const dialog = languageSettingsDialog();
      if (!dialog.verified || !dialog.element) return missing("language-settings-dialog-not-ready");
      const matches = [...dialog.element.querySelectorAll("button, [role='button']")]
        .filter(element => accessibleName(element) === "Confirm");
      return unique(matches, "bounded-accessible-name");
    }
    function heading(name, scope = doc) {
      return unique([...scope.querySelectorAll("h1,h2,h3,h4,h5,h6,[role='heading']")].filter(el => clean(el.textContent) === name), "heading");
    }
    function lowestCommonAncestor(elements, stop = null) {
      const nodes = elements.filter(Boolean);
      if (!nodes.length) return null;
      for (let candidate = nodes[0].parentElement; candidate && candidate !== stop; candidate = candidate.parentElement) {
        if (nodes.every(node => candidate.contains(node))) return candidate;
      }
      return null;
    }
    function newsfeedFeedRoot() {
      const compose = locate(["#button-post-compose-btn"]);
      const navigationLink = locate(["a#post-newsfeed[href='/']"]);
      if (!compose.verified || !navigationLink.verified) return missing("newsfeed-feed-not-ready");
      return {
        element: compose.element,
        verified: true,
        strategy: "observed-newsfeed-structure",
        confidence: "high",
        observedOn,
        verification: "locator-observed",
        verifiedRole: null
      };
    }
    function composerRoot() {
      const result = locate(["#compose-view-layout"]);
      const scope = result.element;
      if (!scope) return missing("composer-not-ready");
      const title = locate(["#input-field-compose_title"], [], scope);
      const body = unique([...scope.querySelectorAll("#post-newsfeed__compose-headings__rich-text-editor [contenteditable='true']")], "observed-editor-container");
      return title.verified && body.verified ? result : missing("composer-not-ready");
    }
    function previewRoot() {
      const result = locate(['[data-testid="post-newsfeed-modal"]']);
      const scope = result.element;
      if (!scope) return missing("preview-not-ready");
      const continueEditing = locate(["#button-post-continue-editing-btn"], [], scope);
      const publish = locate(["#button-post-post-now-btn"], [], scope);
      return continueEditing.verified && publish.verified ? result : missing("preview-not-ready");
    }
    function audienceGroups() {
      const control = newsfeed.audienceControl().element;
      const group = control?.closest('fieldset, [role="group"]');
      // PowerHub collapses selected groups after the picker closes. The native
      // chip nodes may stay connected but become visually hidden behind a +N
      // summary, so selection state must not depend on chip visibility.
      const containers = group ? [...group.querySelectorAll('.neon-multi-select-field-chip-set-container')]
        .filter(node => !node.closest('[data-psqm-ui]')) : [];
      const container = containers.length === 1 ? containers[0] : null;
      if (!container) return { count: 0, verified: false };

      const chips = [...container.querySelectorAll('[neon-chip][id^="postnewsfeed-recipientGroup-"]')]
        .filter(node => node.isConnected && !node.closest('[data-psqm-ui]'));
      const chipIds = chips.map(node => node.id).filter(Boolean);
      if (chips.length > 0) return audienceGroupSelectionState({
        chipCount: chips.length,
        uniqueChipIdCount: new Set(chipIds).size,
        overflowMenuCount: 0
      });

      // PowerHub can collapse all selected groups into one native overflow control.
      // Use structural evidence from this exact chip-set instead of matching "+N"
      // text, because both the overflow button and its nested span expose that text.
      const overflowMenus = [...container.querySelectorAll(
        'button[id^="neon-multi-select-chipSet-"][id$="-overflow-menu"]'
      )].filter(node => node.isConnected && !node.closest('[data-psqm-ui]') && visible(node));
      return audienceGroupSelectionState({
        chipCount: 0,
        uniqueChipIdCount: 0,
        overflowMenuCount: overflowMenus.length
      });
    }
    function audiencePickerState() {
      const control = newsfeed.audienceControl();
      if (!control.verified || !control.element) return { closed: false, verified: false };

      // PowerHub flips aria-expanded to false before removing the native picker.
      // While that associated picker is still rendered, selection has not settled.
      const controlledId = clean(control.element.getAttribute("aria-controls"));
      let picker = controlledId ? doc.getElementById(controlledId) : null;
      if (!picker) {
        const controlId = clean(control.element.id);
        const match = controlId.match(/^(multi-select-complex-\d+)-main-button$/u);
        if (match) picker = doc.getElementById(`${match[1]}-item-picker-item-picker`);
      }
      if (picker && visible(picker)) return { closed: false, verified: true };

      const expanded = clean(control.element.getAttribute("aria-expanded")).toLowerCase();
      if (expanded === "true") return { closed: false, verified: true };
      if (expanded === "false") return { closed: true, verified: true };

      return { closed: true, verified: true };
    }
    function messengerScopedBackButton() {
      const header = unique([...doc.querySelectorAll('#header-messenger-inbox-layout[role="dialog"]')], "observed-messenger-dialog");
      if (!header.verified || !header.element) return missing("messenger-back-scope-missing");
      const result = unique([...header.element.querySelectorAll("#button-layout-detail-back-button-null")], "observed-messenger-back-button");
      const button = result.element;
      if (!result.verified || !button) return result;
      if (button.tagName !== "BUTTON" || button.disabled === true || clean(button.getAttribute("aria-disabled")) === "true") {
        return missing("messenger-back-button-disabled");
      }
      return result;
    }
    const navigation = {
      backButton: messengerScopedBackButton,
    };
    const newsfeed = {
      navigation: () => locate(["a#post-newsfeed[href='/']"], ["Newsfeed"], doc, "a[href='/']"),
      groupsNavigation: () => locate(["a#group-mgmt[href='/groups']"], ["Groups"], doc, "a[href]"),
      powerBuddyToolsNavigation: () => locate(["a#pb-prompt-bank-ui[href='/powerbuddytools']"], ["PowerBuddy tools"], doc, "a[href]"),
      observationsNavigation: () => locate(["a#wf-student-observations[href='/observations']"], ["Observations"], doc, "a[href]"),
      resourceLinksNavigation: () => locate([], ["Resource links"], doc, "a[href]"),
      newPostButton: () => locate(["#button-post-compose-btn"], ["+ New post"]),
      composer: composerRoot,
      titleInput: () => locate(["#input-field-compose_title"], ["Title"], composerRoot().element, "input[type='text']"),
      bodyInput: () => {
        const scope = composerRoot().element;
        return scope ? unique([...scope.querySelectorAll("#post-newsfeed__compose-headings__rich-text-editor [contenteditable='true']")], "observed-editor-container") : missing("composer-not-ready");
      },
      audienceControl: () => {
        const scope = composerRoot().element;
        return scope ? unique([...scope.querySelectorAll("[role='combobox']")], "observed-composer-combobox") : missing("composer-not-ready");
      },
      audienceTarget: () => audienceGroups().count ? newsfeed.recipientCategoriesGroup() : newsfeed.audienceControl(),
      audienceCategories: () => {
        const scope = composerRoot().element;
        return scope ? ["student", "parent", "staff"].map(suffix => locate([`#checkbox-postnewsfeed-recipient-option-${suffix}`], [], scope)) : [];
      },
      recipientCategoriesGroup: () => {
        const categories = newsfeed.audienceCategories();
        if (categories.length !== 3 || categories.some(item => !item.verified || !item.element)) return missing("recipient-categories-not-ready");
        const scope = composerRoot().element;
        const group = lowestCommonAncestor(categories.map(item => item.element), scope);
        // Use the tight row that owns the three native checkboxes. Never promote the
        // spotlight to the full composer/fieldset or a container that also owns To.
        if (!group || group === scope || group.querySelector('#input-field-compose_title, [role="combobox"]')) return missing("recipient-group-missing");
        return unique([group], "observed-recipient-group");
      },
      previewButton: () => locate(["#button-post-preview-btn"], ["Preview post"], composerRoot().element),
      preview: previewRoot,
      continueEditingButton: () => locate(["#button-post-continue-editing-btn"], ["Continue editing"], previewRoot().element),
      publishButton: () => locate(["#button-post-post-now-btn"], ["Post"], previewRoot().element),
      eventButton: () => locate(["#button-post-event-btn"], ["Event"], composerRoot().element)
    };
    function activeConversationRegion() {
      const region = doc.getElementById("conversationRegion");
      const heading = region instanceof doc.defaultView.HTMLElement
        ? region.querySelector("h2#conversationHeading.messenger-inbox__conversation-heading-label")
        : null;
      if (!activeConversationRegionState({
        connected: Boolean(region?.isConnected),
        tagName: region?.tagName || "",
        labelledBy: region?.getAttribute?.("aria-labelledby") || "",
        headingMatchesExact: heading instanceof doc.defaultView.HTMLElement,
        headingVisible: visible(heading)
      })) return null;

      return { region, heading };
    }

    function messageTranslationControlStateForElement(button) {
      const active = activeConversationRegion();
      if (!active?.region) return { ...missing("conversation-region-missing"), view: "unknown", wrapper: null };
      if (!(button instanceof doc.defaultView.HTMLElement) || !active.region.contains(button)) {
        return { ...missing("translation-control-outside-active-conversation"), view: "unknown", wrapper: null };
      }
      const wrapper = button.parentElement;
      if (!(wrapper instanceof doc.defaultView.HTMLElement) || !active.region.contains(wrapper)) {
        return { ...missing("translation-wrapper-missing"), view: "unknown", wrapper: null };
      }
      const contract = messageTranslationControlContract({
        conversationVerified: true,
        wrapperId: wrapper.id,
        wrapperHasClass: wrapper.classList?.contains("translated-text-button") === true,
        wrapperType: wrapper.getAttribute("data-type"),
        wrapperIcon: wrapper.getAttribute("data-icon"),
        wrapperIconPosition: wrapper.getAttribute("data-icon-position"),
        wrapperConnected: wrapper.isConnected,
        wrapperVisible: visible(wrapper),
        buttonId: button.id,
        buttonTagName: button.tagName,
        buttonType: button.getAttribute("type"),
        buttonConnected: button.isConnected,
        buttonVisible: visible(button),
        buttonDisabled: button.disabled === true,
        buttonAriaDisabled: button.getAttribute("aria-disabled") || "",
        extensionOwned: Boolean(wrapper.closest("[data-psqm-ui]") || button.closest("[data-psqm-ui]"))
      });
      if (!contract.verified) return { ...missing(contract.reason), view: "unknown", wrapper };
      return {
        element: button,
        wrapper,
        verified: true,
        view: contract.view,
        reason: contract.reason,
        strategy: "observed-message-translation-control",
        confidence: "high",
        observedOn,
        verification: "locator-observed",
        verifiedRole: null
      };
    }

    function messageTranslationControl() {
      const active = activeConversationRegion();
      if (!active?.region) return { ...missing("conversation-region-missing"), view: "unknown", wrapper: null };
      const candidates = [...active.region.querySelectorAll(`#${MESSAGE_TRANSLATION_BUTTON_ID}`)]
        .map(button => messageTranslationControlStateForElement(button))
        .filter(result => {
          if (result.verified !== true || !result.element?.isConnected) return false;
          const view = targetView(result.element);
          return view?.inView === true && view.covered !== true;
        });
      const translated = candidates.find(result => result.view === "translated");
      return translated || candidates[0] || { ...missing("translation-control-missing"), view: "unknown", wrapper: null };
    }

    function messageTranslationControlAtPoint(x, y) {
      const active = activeConversationRegion();
      if (!active?.region) return { ...missing("conversation-region-missing"), view: "unknown", wrapper: null };
      if (!Number.isFinite(x) || !Number.isFinite(y) || typeof doc.elementsFromPoint !== "function") {
        return { ...missing("translation-control-point-invalid"), view: "unknown", wrapper: null };
      }
      const button = doc.elementsFromPoint(x, y)
        .filter(node => node instanceof doc.defaultView.Element && !node.closest?.("[data-psqm-ui]"))
        .map(node => node.closest?.(`#${MESSAGE_TRANSLATION_BUTTON_ID}`))
        .find(candidate => candidate instanceof doc.defaultView.HTMLElement && active.region.contains(candidate));
      return button
        ? messageTranslationControlStateForElement(button)
        : { ...missing("translation-control-point-missing"), view: "unknown", wrapper: null };
    }

    function classConversationActive() {
      const active = activeConversationRegion();
      if (!active) {
        const contract = classConversationState({ regionVerified: false, classTabCount: 0 });
        return { ...contract, element: null, region: null, heading: null };
      }

      const tablists = [...active.region.querySelectorAll('[role="tablist"]')]
        .filter(element => element instanceof doc.defaultView.HTMLElement
          && element.isConnected
          && !element.closest("[data-psqm-ui]")
          && element.closest("#class-group-tabs"));
      if (tablists.length === 0) {
        const contract = classConversationState({ regionVerified: true, classTabCount: 0 });
        return { ...contract, element: null, region: active.region, heading: active.heading };
      }

      const element = tablists[0] || null;
      const host = element?.closest("#class-group-tabs") || null;
      const verified = messageClassTabListState({
        candidateCount: tablists.length,
        role: element?.getAttribute("role") || "",
        inActiveConversation: Boolean(element && active.region.contains(element)),
        tabsHostId: host?.id || "",
        studentsCount: element ? element.querySelectorAll("#class-group-tabs-tab-students").length : 0,
        guardiansCount: element ? element.querySelectorAll("#class-group-tabs-tab-guardians").length : 0,
        everyoneCount: element ? element.querySelectorAll("#class-group-tabs-tab-everyone").length : 0
      });
      if (!verified || !visible(element)) {
        return {
          active: false,
          verified: false,
          reason: tablists.length > 1 ? "ambiguous-class-tabs" : "class-tabs-contract-mismatch",
          element: null,
          region: active.region,
          heading: active.heading
        };
      }

      return {
        active: true,
        verified: true,
        reason: "verified-class-tabs",
        element,
        region: active.region,
        heading: active.heading
      };
    }

    function directConversation() {
      const active = activeConversationRegion();
      const classState = classConversationActive();
      const description = active?.heading?.closest?.(".messenger-inbox__channel-header__content__left__channel-title")
        ?.querySelector?.("span.messenger-inbox__channel-header__content__left__channel-description");
      const contract = directConversationState({
        regionVerified: Boolean(active),
        classVerified: classState?.verified === true,
        classActive: classState?.active === true,
        headingText: active?.heading?.textContent || "",
        descriptionText: description?.textContent || ""
      });
      return {
        ...contract,
        element: contract.verified && contract.active ? active?.region || null : null,
        region: active?.region || null,
        heading: active?.heading || null,
        description: description || null
      };
    }

    function activeConversationHeader() {
      const active = activeConversationRegion();
      if (!active) return null;
      return active.heading.closest(".messenger-inbox__channel-header")
        || active.heading.closest("[class*='channel-header']")
        || null;
    }

    function createGroupChatDialog() {
      const hostId = "messenger-inbox__create-group-from-group-modal";
      const hosts = [...doc.querySelectorAll(`#${hostId}`)]
        .filter(element => element instanceof doc.defaultView.HTMLElement && element.isConnected);
      const host = hosts.length === 1 ? hosts[0] : null;
      const dialogs = host ? [...host.querySelectorAll('section[role="dialog"][aria-modal="true"]')]
        .filter(element => element instanceof doc.defaultView.HTMLElement && element.isConnected) : [];
      const dialog = dialogs.length === 1 ? dialogs[0] : null;
      const labelledById = "messenger-inbox__create-group-from-group-modal-aria-labelledby-target";
      const labels = dialog ? [...dialog.querySelectorAll(`#${labelledById}`)]
        .filter(element => element instanceof doc.defaultView.HTMLElement && element.isConnected) : [];
      const label = labels.length === 1 ? labels[0] : null;

      const verified = groupChatDialogState({
        hostCount: hosts.length,
        hostId: host?.id || "",
        hostConnected: Boolean(host?.isConnected),
        hostVisible: visible(host),
        hostContainsDialog: Boolean(host && dialog && host.contains(dialog)),
        hostExtensionOwned: Boolean(host?.closest?.("[data-psqm-ui]")),
        hostTagName: host?.tagName || "",
        dialogCount: dialogs.length,
        dialogTagName: dialog?.tagName || "",
        dialogClassName: dialog?.className || "",
        dialogRole: dialog?.getAttribute?.("role") || "",
        dialogAriaModal: dialog?.getAttribute?.("aria-modal") || "",
        dialogConnected: Boolean(dialog?.isConnected),
        dialogVisible: visible(dialog),
        dialogInsideHost: Boolean(host && dialog && host.contains(dialog)),
        dialogExtensionOwned: Boolean(dialog?.closest?.("[data-psqm-ui]")),
        labelledBy: dialog?.getAttribute?.("aria-labelledby") || "",
        labelCount: labels.length,
        labelTagName: label?.tagName || "",
        labelRole: label?.getAttribute?.("role") || "",
        labelId: label?.id || "",
        labelConnected: Boolean(label?.isConnected),
        labelVisible: visible(label),
        labelInsideDialog: Boolean(dialog && label && dialog.contains(label)),
        labelExtensionOwned: Boolean(label?.closest?.("[data-psqm-ui]"))
      });

      if (!verified || !dialog) {
        if (hosts.length !== 1) return missing(hosts.length ? "ambiguous-group-chat-modal-host" : "group-chat-modal-host-missing");
        if (dialogs.length !== 1) return missing(dialogs.length ? "ambiguous-group-chat-dialog" : "group-chat-dialog-missing");
        return missing("group-chat-dialog-contract-mismatch");
      }
      return unique([dialog], "observed-group-chat-dialog-structure");
    }

    function groupChatControl(id, { tagName, type } = {}) {
      const dialog = createGroupChatDialog();
      if (!dialog.verified || !dialog.element) return missing("group-chat-dialog-not-ready");
      const matches = [...dialog.element.querySelectorAll(`#${id}`)]
        .filter(element => element instanceof doc.defaultView.HTMLElement && element.isConnected);
      const element = matches.length === 1 ? matches[0] : null;
      if (!groupChatExactControlState({
        candidateCount: matches.length,
        expectedId: id,
        id: element?.id || "",
        expectedTagName: tagName || "",
        tagName: element?.tagName || "",
        expectedType: type || "",
        type: element?.getAttribute?.("type") || "",
        connected: Boolean(element?.isConnected),
        inVerifiedDialog: Boolean(element && dialog.element.contains(element)),
        visible: visible(element),
        disabled: element?.disabled === true,
        ariaDisabled: element?.getAttribute?.("aria-disabled") || "",
        extensionOwned: Boolean(element?.closest?.("[data-psqm-ui]"))
      })) {
        return missing(matches.length > 1 ? "ambiguous-target" : "group-chat-control-contract-mismatch");
      }
      return unique([element], "observed-id-actionable");
    }

    function groupChatFilter(id) {
      const dialog = createGroupChatDialog();
      if (!dialog.verified || !dialog.element) return missing("group-chat-dialog-not-ready");
      const candidates = [...dialog.element.querySelectorAll(`#${id}`)]
        .filter(element => element instanceof doc.defaultView.HTMLElement && element.isConnected);
      const control = candidates.length === 1 ? candidates[0] : null;
      const wrapper = control?.closest?.(".messenger-inbox__filter-wrapper") || null;
      const labels = [...dialog.element.querySelectorAll(`label[for="${id}"]`)]
        .filter(element => element instanceof doc.defaultView.HTMLElement && element.isConnected);
      const label = labels.length === 1 ? labels[0] : null;
      const verified = groupChatFilterStateContract({
        candidateCount: candidates.length,
        expectedId: id,
        id: control?.id || "",
        tagName: control?.tagName || "",
        type: control?.getAttribute?.("type") || "",
        connected: Boolean(control?.isConnected),
        inVerifiedDialog: Boolean(control && dialog.element.contains(control)),
        inFilterWrapper: Boolean(control && wrapper && dialog.element.contains(wrapper) && wrapper.contains(control)),
        visible: visible(control),
        disabled: control?.disabled === true,
        ariaDisabled: control?.getAttribute?.("aria-disabled") || "",
        extensionOwned: Boolean(control?.closest?.("[data-psqm-ui]")),
        labelCount: labels.length,
        labelTagName: label?.tagName || "",
        labelFor: label?.getAttribute?.("for") || "",
        labelConnected: Boolean(label?.isConnected),
        labelInsideDialog: Boolean(label && dialog.element.contains(label)),
        labelInFilterWrapper: Boolean(label && wrapper && wrapper.contains(label)),
        labelHasStableClass: Boolean(label?.classList?.contains("neon-chip-select-single-label")),
        labelExtensionOwned: Boolean(label?.closest?.("[data-psqm-ui]"))
      });
      if (!verified || !label || !visible(label)) {
        return missing(candidates.length > 1 || labels.length > 1 ? "ambiguous-group-chat-filter" : "group-chat-filter-contract-mismatch");
      }
      return unique([label], "observed-label-for-structure");
    }

    function groupChatFilterState(id) {
      const control = groupChatControl(id, { tagName: "INPUT", type: "checkbox" });
      const label = groupChatFilter(id);
      if (!control.verified || !control.element || !label.verified || !label.element) {
        return { verified: false, selected: false };
      }
      return { verified: true, selected: control.element.checked === true };
    }

    function groupChatTable(className) {
      const dialog = createGroupChatDialog();
      if (!dialog.verified || !dialog.element) return missing("group-chat-dialog-not-ready");
      const matches = [...dialog.element.querySelectorAll(`table.${className}`)]
        .filter(element => element instanceof doc.defaultView.HTMLElement && element.isConnected);
      const table = matches.length === 1 ? matches[0] : null;
      const selectableRegion = table?.closest?.(".messenger-inbox__grid-col-left") || null;
      const headerRows = table ? [...table.querySelectorAll("thead > tr")] : [];
      const headerCells = headerRows.length === 1 ? [...headerRows[0].children] : [];
      if (!groupChatMemberTableState({
        candidateCount: matches.length,
        tagName: table?.tagName || "",
        className: table?.className || "",
        connected: Boolean(table?.isConnected),
        visible: visible(table),
        inVerifiedDialog: Boolean(table && dialog.element.contains(table)),
        inSelectableRegion: Boolean(table && selectableRegion && dialog.element.contains(selectableRegion) && selectableRegion.contains(table)),
        extensionOwned: Boolean(table?.closest?.("[data-psqm-ui]")),
        headerRowCount: headerRows.length,
        headerCellCount: headerCells.length,
        allHeaderCellsTh: headerCells.length > 0 && headerCells.every(cell => cell.tagName === "TH"),
        headerTexts: headerCells.map(cell => clean(cell.textContent))
      })) {
        return missing(matches.length > 1 ? "ambiguous-target" : "group-chat-table-contract-mismatch");
      }
      return unique([table], "observed-table-structure");
    }

    function groupChatSelectableRegion() {
      const table = groupChatTable("messenger-inbox__user-selection-table");
      if (!table.verified || !table.element) return table;
      const dialog = createGroupChatDialog();
      const candidates = [...dialog.element.querySelectorAll(".messenger-inbox__grid-col-left")]
        .filter(element => element instanceof doc.defaultView.HTMLElement
          && element.isConnected
          && !element.closest("[data-psqm-ui]")
          && element.contains(table.element));
      const element = candidates.length === 1 ? candidates[0] : null;
      return element && visible(element)
        ? unique([element], "observed-member-source-region")
        : missing(candidates.length > 1 ? "ambiguous-member-source-region" : "member-source-region-missing");
    }

    function groupChatFirstRelationshipControl() {
      const table = groupChatTable("messenger-inbox__user-selection-table");
      if (!table.verified || !table.element) return table;
      const candidates = [...table.element.querySelectorAll("tbody > tr button.messenger-inbox__expand-button")];
      const verified = candidates.filter(element => {
        const row = element.closest("tr");
        return groupChatRelationshipControlState({
          tagName: element.tagName,
          hasExpandClass: element.classList.contains("messenger-inbox__expand-button"),
          token: element.getAttribute("aria-label") || "",
          connected: element.isConnected,
          visible: visible(element),
          disabled: element.disabled === true,
          ariaDisabled: element.getAttribute("aria-disabled") || "",
          inVerifiedTable: table.element.contains(element),
          inBodyRow: Boolean(row && row.parentElement?.tagName === "TBODY" && table.element.contains(row)),
          extensionOwned: Boolean(element.closest("[data-psqm-ui]"))
        });
      });
      return verified.length
        ? unique([verified[0]], "observed-first-relationship-control")
        : missing("group-chat-relationship-control-missing");
    }

    function groupChatFirstAddControl() {
      const table = groupChatTable("messenger-inbox__user-selection-table");
      if (!table.verified || !table.element) return table;
      const dialog = createGroupChatDialog();
      const candidates = [...table.element.querySelectorAll('tbody > tr button[id^="button-add-user-"]')];
      const verified = candidates.filter(element => {
        const row = element.closest("tr");
        const exactIdCount = element.id ? doc.querySelectorAll(`#${element.id}`).length : 0;
        return groupChatAddControlState({
          exactIdCount,
          id: element.id || "",
          tagName: element.tagName,
          type: element.getAttribute("type") || "",
          connected: element.isConnected,
          visible: visible(element),
          disabled: element.disabled === true,
          ariaDisabled: element.getAttribute("aria-disabled") || "",
          inVerifiedTable: table.element.contains(element),
          inBodyRow: Boolean(row && row.parentElement?.tagName === "TBODY" && table.element.contains(row)),
          inVerifiedDialog: Boolean(dialog.verified && dialog.element?.contains(element)),
          extensionOwned: Boolean(element.closest("[data-psqm-ui]")),
          ariaLabel: element.getAttribute("aria-label") || ""
        });
      });
      return verified.length
        ? unique([verified[0]], "observed-first-add-control")
        : missing("group-chat-add-control-missing");
    }

    function groupChatSelectedState() {
      const dialog = createGroupChatDialog();
      if (!dialog.verified || !dialog.element) {
        return { element: null, verified: false, selected: false, count: 0 };
      }
      const candidates = [...dialog.element.querySelectorAll(".messenger-inbox__selected-items-section")]
        .filter(element => element instanceof doc.defaultView.HTMLElement && element.isConnected);
      const section = candidates.length === 1 ? candidates[0] : null;
      const headers = section ? [...section.children]
        .filter(element => element.classList?.contains("messenger-inbox__selected-header")) : [];
      const header = headers.length === 1 ? headers[0] : null;
      const summaries = header ? [...header.querySelectorAll(".messenger-inbox__selected-count")]
        .filter(element => element.isConnected) : [];
      const summary = summaries.length === 1 ? summaries[0] : null;
      const tables = section ? [...section.querySelectorAll("table.messenger-inbox__selected-items-table")]
        .filter(element => element.isConnected) : [];
      const table = tables.length === 1 ? tables[0] : null;
      const headerRows = table ? [...table.querySelectorAll("thead > tr")] : [];
      const headerCells = headerRows.length === 1 ? [...headerRows[0].children] : [];
      const bodyRows = table ? [...table.querySelectorAll("tbody > tr")] : [];
      const emptyRows = bodyRows.filter(row => row.classList.contains("messenger-inbox__empty-state-row"));
      const selectedRows = bodyRows.filter(row => !row.classList.contains("messenger-inbox__empty-state-row"));
      const emptyRow = emptyRows.length === 1 ? emptyRows[0] : null;
      const emptyCells = emptyRow ? [...emptyRow.querySelectorAll("td.messenger-inbox__empty-state-cell")] : [];
      const emptyCell = emptyCells.length === 1 ? emptyCells[0] : null;
      const state = groupChatSelectedSectionState({
        sectionCount: candidates.length,
        sectionClassName: section?.className || "",
        sectionConnected: Boolean(section?.isConnected),
        sectionVisible: visible(section),
        inVerifiedDialog: Boolean(section && dialog.element.contains(section)),
        extensionOwned: Boolean(section?.closest?.("[data-psqm-ui]")),
        headerCount: headers.length,
        summaryCount: summaries.length,
        summaryClassName: summary?.className || "",
        summaryInsideHeader: Boolean(header && summary && header.contains(summary)),
        summaryText: clean(summary?.textContent),
        tableCount: tables.length,
        tableTagName: table?.tagName || "",
        tableClassName: table?.className || "",
        tableConnected: Boolean(table?.isConnected),
        tableVisible: visible(table),
        tableInsideSection: Boolean(section && table && section.contains(table)),
        headerRowCount: headerRows.length,
        headerCellCount: headerCells.length,
        allHeaderCellsTh: headerCells.length > 0 && headerCells.every(cell => cell.tagName === "TH"),
        selectedRowCount: selectedRows.length,
        emptyRowCount: emptyRows.length,
        emptyRowClassName: emptyRow?.className || "",
        emptyCellCount: emptyCells.length,
        emptyCellClassName: emptyCell?.className || "",
        emptyCellColspan: emptyCell?.getAttribute?.("colspan") || "",
        emptyText: clean(emptyCell?.textContent)
      });
      return { element: state.verified ? section : null, ...state };
    }

    function groupChatSelectedPanel() {
      const selected = groupChatSelectedState();
      return selected.verified && selected.element
        ? unique([selected.element], "observed-selected-members-structure")
        : missing("group-chat-selected-panel-contract-mismatch");
    }

    function groupChatPagination() {
      const source = groupChatSelectableRegion();
      if (!source.verified || !source.element) return source;
      const candidates = [...source.element.querySelectorAll(".messenger-inbox__user-selection-pagination")]
        .filter(element => element instanceof doc.defaultView.HTMLElement && element.isConnected);
      const element = candidates.length === 1 ? candidates[0] : null;
      const previous = element ? [...element.querySelectorAll("#button-messenger-inbox__selectable-users-pagination-previous-button")] : [];
      const next = element ? [...element.querySelectorAll("#button-messenger-inbox__selectable-users-pagination-next-button")] : [];
      const pages = element ? [...element.querySelectorAll('[id^="messenger-inbox__selectable-users-pagination-button"]')] : [];
      if (!groupChatPaginationState({
        candidateCount: candidates.length,
        className: element?.className || "",
        connected: Boolean(element?.isConnected),
        visible: visible(element),
        inVerifiedSelectableRegion: Boolean(element && source.element.contains(element)),
        extensionOwned: Boolean(element?.closest?.("[data-psqm-ui]")),
        previousCount: previous.length,
        previousId: previous[0]?.id || "",
        nextCount: next.length,
        nextId: next[0]?.id || "",
        pageButtonCount: pages.length,
        pageIds: pages.map(page => page.id || ""),
        previousLabel: previous[0]?.getAttribute?.("aria-label") || "",
        nextLabel: next[0]?.getAttribute?.("aria-label") || ""
      })) {
        return missing(candidates.length > 1 ? "ambiguous-member-pagination" : "group-chat-pagination-contract-mismatch");
      }
      return unique([element], "observed-member-pagination-structure");
    }

    function messagingToolsButton() {
      const headers = [...doc.querySelectorAll("section#inboxHeaderRegion")]
        .filter(element => element instanceof doc.defaultView.HTMLElement
          && element.isConnected
          && !element.closest("[data-psqm-ui]"));
      if (headers.length !== 1) {
        return missing(headers.length ? "ambiguous-inbox-header" : "inbox-header-missing");
      }
      const candidates = [...headers[0].querySelectorAll("#button-messenger-inbox__tools-menu-btn")]
        .filter(element => element instanceof doc.defaultView.HTMLElement && element.isConnected);
      const element = candidates[0] || null;
      if (!messagingToolsButtonState({
        candidateCount: candidates.length,
        tagName: element?.tagName || "",
        id: element?.id || "",
        connected: Boolean(element?.isConnected),
        inInboxHeader: Boolean(element && headers[0].contains(element)),
        visible: visible(element),
        disabled: element?.disabled === true,
        ariaDisabled: element?.getAttribute?.("aria-disabled") || "",
        extensionOwned: Boolean(element?.closest?.("[data-psqm-ui]"))
      })) {
        return missing(candidates.length > 1 ? "ambiguous-target" : "messaging-tools-contract-mismatch");
      }
      return unique([element], "observed-messaging-tools-button");
    }

    function informationButton() {
      const classState = classConversationActive();
      if (!classState?.verified || classState.active !== true) {
        return missing(classState?.reason || "class-conversation-not-active");
      }
      const header = activeConversationHeader();
      if (!header) return missing("conversation-header-missing");
      const candidates = [...header.querySelectorAll("button.sendbird-chat-header__right__info.sendbird-iconbutton")]
        .filter(element => element instanceof doc.defaultView.HTMLElement && element.isConnected);
      const element = candidates[0] || null;
      if (!informationButtonState({
        candidateCount: candidates.length,
        classVerified: classState.verified === true,
        classActive: classState.active === true,
        tagName: element?.tagName || "",
        className: element?.className || "",
        connected: Boolean(element?.isConnected),
        inVerifiedActiveHeader: Boolean(element && header.contains(element)),
        visible: visible(element),
        disabled: element?.disabled === true,
        ariaDisabled: element?.getAttribute?.("aria-disabled") || "",
        extensionOwned: Boolean(element?.closest?.("[data-psqm-ui]"))
      })) {
        return missing(candidates.length > 1 ? "ambiguous-target" : "target-missing");
      }
      return unique([element], "observed-information-button");
    }

    function directInformationButton() {
      const direct = directConversation();
      if (!direct?.verified || direct.active !== true) return missing(direct?.reason || "direct-conversation-not-active");
      const header = activeConversationHeader();
      if (!header) return missing("conversation-header-missing");
      const candidates = [...header.querySelectorAll("button.sendbird-chat-header__right__info.sendbird-iconbutton")]
        .filter(element => element instanceof doc.defaultView.HTMLElement && element.isConnected);
      const element = candidates[0] || null;
      if (!directInformationButtonState({
        candidateCount: candidates.length,
        directVerified: direct.verified === true,
        tagName: element?.tagName || "",
        className: element?.className || "",
        connected: Boolean(element?.isConnected),
        inVerifiedActiveHeader: Boolean(element && header.contains(element)),
        visible: visible(element),
        disabled: element?.disabled === true,
        ariaDisabled: element?.getAttribute?.("aria-disabled") || "",
        extensionOwned: Boolean(element?.closest?.("[data-psqm-ui]"))
      })) return missing(candidates.length > 1 ? "ambiguous-target" : "target-missing");
      return unique([element], "observed-direct-information-button");
    }

    function classesToggle() {
      const result = locate([`#${classesToggleId}`]);
      const element = result.element;
      if (!element) return result;
      if (element.tagName !== "BUTTON"
        || element.id !== classesToggleId
        || !classesToggleState({
          expanded: element.getAttribute("aria-expanded"),
          controls: element.getAttribute("aria-controls") || ""
        })) {
        return missing("classes-toggle-contract-mismatch");
      }
      return result;
    }

    function classListContract() {
      const toggle = classesToggle();
      if (!toggle.verified || !toggle.element) {
        return { verified: false, visible: false, toggle, element: null };
      }
      const candidates = [...doc.querySelectorAll(`#${classesListId}`)]
        .filter(element => element instanceof doc.defaultView.HTMLElement
          && element.isConnected
          && !element.closest("[data-psqm-ui]"));
      const element = candidates.length === 1 && candidates[0].tagName === "DIV"
        ? candidates[0]
        : null;
      const accordion = classListState({
        expanded: toggle.element.getAttribute("aria-expanded"),
        controlledCount: element ? 1 : candidates.length,
        controlledVisible: Boolean(element && visible(element)),
        controlledStructureValid: candidates.length === 0 || Boolean(element)
      });
      return {
        ...accordion,
        toggle,
        element
      };
    }

    function classList() {
      const contract = classListContract();
      if (!contract.verified) return missing("classes-list-contract-mismatch");
      return contract.visible
        ? unique([contract.element], "observed-aria-controls")
        : missing("classes-list-collapsed");
    }

    function groupInformationPanel() {
      const settings = doc.getElementById("conversationSettings");
      if (!(settings instanceof doc.defaultView.HTMLElement) || !settings.isConnected) {
        return missing("group-information-panel-missing");
      }
      const candidates = [];
      if (settings.matches(groupInformationPanelSelector)) candidates.push(settings);
      for (const panel of settings.querySelectorAll(groupInformationPanelSelector)) {
        if (!candidates.includes(panel)) candidates.push(panel);
      }
      const headings = candidates.length === 1
        ? [...candidates[0].querySelectorAll("#messenger-group-information-heading")]
        : [];
      if (!groupInformationPanelState({
        candidateCount: candidates.length,
        headingVisible: headings.length === 1 && visible(headings[0])
      })) {
        return missing(candidates.length > 1 ? "ambiguous-target" : "target-missing");
      }
      return {
        element: candidates[0],
        verified: true,
        strategy: "observed-group-information-panel",
        confidence: "high",
        observedOn,
        verification: "locator-observed",
        verifiedRole: null
      };
    }

    function groupInformationControl(id) {
      const panel = groupInformationPanel();
      if (!panel.verified || !panel.element) return missing("group-information-panel-not-ready");
      return locate([`#${id}`], [], panel.element);
    }

    function conversationListRegion() {
      const candidates = [...doc.querySelectorAll("#conversationListRegion")]
        .filter(element => element instanceof doc.defaultView.HTMLElement
          && element.isConnected
          && !element.closest("[data-psqm-ui]"));
      const region = candidates[0] || null;
      // Native PowerHub uses this as a zero-size semantic wrapper; visibility is
      // enforced on exact actionable descendants rather than on this section.
      if (!region) return null;
      const labelledBy = clean(region.getAttribute("aria-labelledby"));
      const headings = labelledBy === "conversationListHeading"
        ? [...region.querySelectorAll("#conversationListHeading")]
        : [];
      const heading = headings[0] || null;
      if (!messageListRegionState({
        candidateCount: candidates.length,
        tagName: region.tagName,
        id: region.id,
        className: region.className,
        labelledBy,
        headingCount: headings.length,
        headingTag: heading?.tagName || "",
        headingId: heading?.id || "",
        headingInsideRegion: Boolean(heading && region.contains(heading)),
        inMessengerInbox: Boolean(region.closest(".messenger-inbox"))
      })) return null;
      return region;
    }

    function firstMessageListPointerControl(kind) {
      const scope = conversationListRegion();
      if (!scope) return missing("conversation-list-not-ready");
      const selector = kind === "add" ? ".psqm-direct-add" : "";
      if (!selector) return missing("unknown-message-list-pointer");

      const candidates = [...scope.querySelectorAll(selector)].filter(element => {
        const row = element.closest(".psqm-direct-row");
        return visible(element) && messageListPointerCandidateState({
          kind,
          tagName: element.tagName,
          role: element.getAttribute("role"),
          text: element.textContent,
          ariaPressed: element.getAttribute("aria-pressed"),
          ariaBusy: element.getAttribute("aria-busy"),
          ariaDisabled: element.getAttribute("aria-disabled"),
          ariaLabel: element.getAttribute("aria-label"),
          hasOriginalName: clean(element.getAttribute("data-psqm-name")).length > 0,
          inDirectRow: Boolean(row && scope.contains(row)),
          inConversationList: scope.contains(element)
        });
      });
      return candidates.length
        ? unique([candidates[0]], "extension-list-control-contract")
        : missing("message-list-pointer-missing");
    }

    function startConversationCardFromTarget(target) {
      const scope = conversationListRegion();
      if (!scope || !(target instanceof doc.defaultView.Element) || !scope.contains(target)) {
        return missing("conversation-list-not-ready");
      }

      const card = target.closest(".messenger-inbox__messenger-channel-preview");
      if (!card || !scope.contains(card)) return missing("start-conversation-card-missing");

      const markers = [...card.querySelectorAll(".messenger-inbox__conversation-list-classes-start-convo")];
      const titles = [...card.querySelectorAll("button[data-testid='messenger-channel-preview']")];
      const marker = markers[0] || null;
      const title = titles[0] || null;
      if (!startConversationCardState({
        cardCount: 1,
        cardTagName: card.tagName,
        cardClassName: card.className,
        cardVisible: visible(card),
        markerCount: markers.length,
        markerTagName: marker?.tagName || "",
        markerClassName: marker?.className || "",
        markerVisible: visible(marker),
        titleCount: titles.length,
        titleTagName: title?.tagName || "",
        titleTestId: title?.getAttribute("data-testid") || "",
        titleText: title?.textContent || "",
        titleVisible: visible(title),
        titleDisabled: title?.disabled === true,
        titleAriaDisabled: title?.getAttribute("aria-disabled") || "",
        inConversationList: scope.contains(card)
      })) return missing("start-conversation-card-contract-mismatch");

      return unique([card], "observed-start-conversation-card");
    }

    function startConversationCard() {
      const scope = conversationListRegion();
      const active = activeConversationRegion();
      if (!scope || !active) return missing("conversation-context-not-ready");

      const activeTitle = clean(active.heading?.textContent);
      if (!activeTitle) return missing("active-conversation-title-missing");

      const cards = [...scope.querySelectorAll(".messenger-inbox__messenger-channel-preview")]
        .filter(card => {
          const markers = [...card.querySelectorAll(".messenger-inbox__conversation-list-classes-start-convo")];
          const titles = [...card.querySelectorAll("button[data-testid='messenger-channel-preview']")];
          const marker = markers[0] || null;
          const title = titles[0] || null;
          return startConversationCardState({
            cardCount: 1,
            cardTagName: card.tagName,
            cardClassName: card.className,
            cardVisible: visible(card),
            markerCount: markers.length,
            markerTagName: marker?.tagName || "",
            markerClassName: marker?.className || "",
            markerVisible: visible(marker),
            titleCount: titles.length,
            titleTagName: title?.tagName || "",
            titleTestId: title?.getAttribute("data-testid") || "",
            titleText: title?.textContent || "",
            titleVisible: visible(title),
            titleDisabled: title?.disabled === true,
            titleAriaDisabled: title?.getAttribute("aria-disabled") || "",
            inConversationList: scope.contains(card)
          }) && clean(title?.textContent) === activeTitle;
        });

      return cards.length === 1
        ? unique([cards[0]], "observed-active-start-conversation-card")
        : missing(cards.length > 1 ? "ambiguous-start-conversation-card" : "start-conversation-card-missing");
    }

    function classConversationTab(id) {
      const classState = classConversationActive();
      const active = activeConversationRegion();
      if (!active || !classState?.verified || classState.active !== true || !classState.element) {
        return missing(classState?.reason || "class-conversation-not-active");
      }
      const candidates = [...classState.element.querySelectorAll(`#${id}`)];
      const element = candidates[0] || null;
      if (!messageClassTabState({
        candidateCount: candidates.length,
        id: element?.id || "",
        expectedId: id,
        role: element?.getAttribute("role") || "",
        inVerifiedTabList: Boolean(element && classState.element.contains(element)),
        inActiveConversation: Boolean(element && active.region.contains(element)),
        classActive: classState.active === true,
        visible: visible(element),
        disabled: element?.disabled === true,
        ariaDisabled: element?.getAttribute("aria-disabled") || ""
      })) {
        return missing(candidates.length > 1 ? "ambiguous-target" : "class-tab-contract-mismatch");
      }
      const result = unique([element], "observed-class-tab");
      return result.verified
        ? { ...result, selected: element.getAttribute("aria-selected") === "true" }
        : result;
    }

    function classAudienceConversation() {
      const classState = classConversationActive();
      const tabs = {
        students: classConversationTab("class-group-tabs-tab-students"),
        guardians: classConversationTab("class-group-tabs-tab-guardians"),
        everyone: classConversationTab("class-group-tabs-tab-everyone")
      };
      const selectedAudiences = Object.entries(tabs)
        .filter(([, tab]) => tab?.verified && tab.selected === true)
        .map(([audience]) => audience);
      const active = activeConversationRegion();
      const composer = active
        ? locate(["#messenger-inbox-message-input-text-field"], [], active.region, "[contenteditable='true'][role='textbox']")
        : missing("conversation-region-missing");
      const information = informationButton();
      return {
        ...classAudienceConversationState({
          classVerified: classState?.verified === true,
          classActive: classState?.active === true,
          selectedAudiences,
          composerVerified: composer?.verified === true,
          informationButtonVerified: information?.verified === true,
          informationButtonReason: information?.reason || "",
          classTitle: classState?.heading?.textContent || ""
        }),
        element: selectedAudiences.length === 1 ? tabs[selectedAudiences[0]]?.element || null : null,
        editor: composer?.verified ? composer.element : null
      };
    }

    const messages = {
      navigation: () => locate(["#button-header-messenger-inbox"], ["Messaging"]),
      toolsButton: messagingToolsButton,
      // Scope the shared generated Back ID to the verified Messenger detail dialog.
      backButton: messengerScopedBackButton,
      newMessageButton: () => locate(["#button-new-conversation-button"], ["New message"]),
      recipientInput: () => locate(["#recipient-search-input"], ["Enter a contact name"], doc, "input[role='searchbox']"),
      messageInput: () => locate(["#messenger-inbox-message-input-text-field"], ["Enter message"], doc, "[contenteditable='true'][role='textbox']"),
      sendButton: () => locate(["#button-messenger-inbox__message-input__send-btn"], ["Send Message"]),
      translationControl: messageTranslationControl,
      translationControlAtPoint: messageTranslationControlAtPoint,
      translationControlState: messageTranslationControlStateForElement,
      informationButton,
      classesToggle,
      classList,
      groupInformationPanel,
      informationModerators: () => groupInformationControl("messenger-inbox__channel-settings-operator-list-accordion-toggle"),
      informationMembers: () => groupInformationControl("messenger-inbox__channel-settings-member-list-accordion-toggle"),
      informationReplies: () => groupInformationControl("messenger-inbox__channel-settings-member-actions-accordion-toggle"),
      informationNotifications: () => groupInformationControl("messenger-inbox__channel-notifications-toggle-input-tooltip-trigger"),
      informationCreateGroup: () => groupInformationControl("button-messenger-inbox__staff-create-group-from-group-button"),
      firstDirectAddControl: () => firstMessageListPointerControl("add"),
      startConversationCard,
      startConversationCardFromTarget,
      classStudentsTab: () => classConversationTab("class-group-tabs-tab-students"),
      classGuardiansTab: () => classConversationTab("class-group-tabs-tab-guardians"),
      classEveryoneTab: () => classConversationTab("class-group-tabs-tab-everyone"),
      classAudienceConversation,
      groupChatDialog: createGroupChatDialog,
      groupChatGroupName: () => groupChatControl("input-field-messenger-inbox__create-group-name", { tagName: "INPUT", type: "text" }),
      groupChatAddAllStudents: () => groupChatControl("checkbox-messenger-inbox__add-all-students", { tagName: "INPUT", type: "checkbox" }),
      groupChatAddAllGuardians: () => groupChatControl("checkbox-messenger-inbox__add-all-guardians", { tagName: "INPUT", type: "checkbox" }),
      groupChatStudentsFilter: () => groupChatFilter("chip-select-single-student-filter"),
      groupChatGuardiansFilter: () => groupChatFilter("chip-select-single-guardian-filter"),
      groupChatStaffFilter: () => groupChatFilter("chip-select-single-staff-filter"),
      groupChatSearchInput: () => groupChatControl("messenger-inbox__search_search-textsearch-input", { tagName: "INPUT", type: "text" }),
      groupChatSelectableRegion,
      groupChatFirstRelationshipControl,
      groupChatFirstAddControl,
      groupChatSelectedPanel,
      groupChatPagination,
      groupChatAutoAddGuardians: () => groupChatControl("checkbox-messenger-inbox__auto-add-guardians-toggle", { tagName: "INPUT", type: "checkbox" }),
      groupChatCancelButton: () => groupChatControl("button-messenger-inbox__staff-create-group-from-group-cancel", { tagName: "BUTTON", type: "button" }),
      groupChatCreateButton: () => groupChatControl("button-messenger-inbox__staff-create-group-from-group-create", { tagName: "BUTTON", type: "button" }),
      directConversation,
      directInformationButton,
      directGuardianGroupChatButton: () => {
        const direct = directConversation();
        if (!direct?.verified || direct.active !== true || direct.category !== "student") {
          return missing(direct?.reason || "student-direct-conversation-not-active");
        }
        const header = activeConversationHeader();
        if (!header || !direct.heading || !header.contains(direct.heading)) return missing("conversation-header-missing");
        const hosts = [...header.querySelectorAll(`#${DIRECT_GUARDIAN_GROUP_HOST_ID}`)];
        if (hosts.length !== 1) return missing(hosts.length ? "ambiguous-target" : "target-missing");
        const host = hosts[0];
        const buttons = [...host.querySelectorAll(`#${DIRECT_GUARDIAN_GROUP_BUTTON_ID}`)];
        if (buttons.length !== 1) return missing(buttons.length ? "ambiguous-target" : "target-missing");
        const button = buttons[0];
        if (!directGuardianGroupChatButtonState({
          directVerified: direct.verified,
          directCategory: direct.category,
          headerContainsHeading: header.contains(direct.heading),
          hostCount: hosts.length,
          hostConnected: host.isConnected,
          hostVisible: visible(host),
          hostInsideHeader: header.contains(host),
          hostId: host.id,
          hostHasClass: host.classList?.contains("messenger-inbox__channel-header__right__create-guardian-chat") === true,
          hostType: host.getAttribute("data-type"),
          hostIcon: host.getAttribute("data-icon"),
          hostDisabled: host.disabled === true,
          hostAriaDisabled: host.getAttribute("aria-disabled") || "",
          buttonCount: buttons.length,
          buttonTagName: button.tagName,
          buttonType: button.getAttribute("type"),
          buttonConnected: button.isConnected,
          buttonVisible: visible(button),
          buttonInsideHost: host.contains(button),
          buttonId: button.id,
          buttonDisabled: button.disabled === true,
          buttonAriaDisabled: button.getAttribute("aria-disabled") || "",
          extensionOwned: Boolean(host.closest("[data-psqm-ui]") || button.closest("[data-psqm-ui]"))
        })) return missing("direct-guardian-group-button-contract-mismatch");
        return unique([button], "observed-direct-guardian-group-button");
      },
      groupChatButton: () => {
        const classState = messages.classConversationActive();
        if (!classState?.verified || classState.active !== true) {
          return missing(classState?.reason || "class-conversation-not-active");
        }

        const header = activeConversationHeader();
        if (!header
          || !header.contains(classState.heading)) {
          return missing("conversation-header-missing");
        }

        const hosts = [...header.querySelectorAll(`#${GROUP_CHAT_HOST_ID}`)];
        if (hosts.length !== 1) return missing(hosts.length ? "ambiguous-target" : "target-missing");

        const host = hosts[0];
        const buttons = [...host.querySelectorAll(`#${GROUP_CHAT_BUTTON_ID}`)];
        if (buttons.length !== 1) return missing(buttons.length ? "ambiguous-target" : "target-missing");

        const button = buttons[0];
        if (!groupChatButtonState({
          classVerified: classState.verified,
          classActive: classState.active,
          headerContainsHeading: header.contains(classState.heading),
          hostCount: hosts.length,
          hostConnected: host.isConnected,
          hostVisible: visible(host),
          hostInsideHeader: header.contains(host),
          hostId: host.id,
          hostHasClass: host.classList?.contains("messenger-inbox__channel-header__right__staff-create-group-from-group") === true,
          hostType: host.getAttribute("data-type"),
          hostIcon: host.getAttribute("data-icon"),
          hostDisabled: host.disabled === true,
          hostAriaDisabled: host.getAttribute("aria-disabled") || "",
          buttonCount: buttons.length,
          buttonTagName: button.tagName,
          buttonType: button.getAttribute("type"),
          buttonConnected: button.isConnected,
          buttonVisible: visible(button),
          buttonInsideHost: host.contains(button),
          buttonId: button.id,
          buttonDisabled: button.disabled === true,
          buttonAriaDisabled: button.getAttribute("aria-disabled") || "",
          extensionOwned: Boolean(host.closest("[data-psqm-ui]") || button.closest("[data-psqm-ui]"))
        })) return missing("group-chat-button-contract-mismatch");

        return unique([button], "observed-id");
      },
      classConversationActive
    };
    function directoryResultsContract() {
      const candidates = [...doc.querySelectorAll("table")]
        .filter(element => visible(element) && !element.closest("[data-psqm-ui]"));
      if (candidates.length !== 1) {
        return { element: null, rowCount: -1, ...directoryResultsTableState({ candidateCount: candidates.length, headers: [], rowCount: -1 }) };
      }
      const table = candidates[0];
      const headerRow = table.querySelector("thead > tr");
      const headerCells = headerRow ? [...headerRow.children] : [];
      const headers = headerCells.every(cell => cell.tagName === "TH")
        ? headerCells.map(cell => clean(cell.textContent))
        : [];
      const rowCount = [...table.tBodies].reduce((count, body) => count + body.rows.length, 0);
      return { element: table, rowCount, ...directoryResultsTableState({ candidateCount: 1, headers, rowCount }) };
    }
    function exactDirectoryRadio(id) {
      const result = locate([`#${id}`]);
      if (!result.element) return result;
      return result.element.matches("input[type='radio']")
        ? result
        : missing("directory-persona-contract-mismatch");
    }
    function directoryChatButton() {
      const contract = directoryResultsContract();
      if (!contract.verified || !contract.visible || !contract.element) {
        return missing(contract.verified ? "directory-results-empty" : "directory-results-contract-mismatch");
      }
      const rows = [...contract.element.tBodies].flatMap(body => [...body.rows]).filter(visible);
      const row = rows[0];
      if (!row) return missing("directory-result-row-missing");
      const candidates = [...row.querySelectorAll("button")]
        .filter(button => clean(button.getAttribute("aria-label")) === "chat");
      const button = candidates[0] || null;
      if (!directoryChatButtonState({
        tableVerified: contract.verified,
        rowCount: rows.length,
        chatCount: candidates.length,
        tagName: button?.tagName || "",
        ariaLabel: button?.getAttribute("aria-label") || "",
        inResultsTable: Boolean(button && contract.element.contains(button))
      })) return missing(candidates.length > 1 ? "ambiguous-directory-chat-button" : "directory-chat-button-missing");
      return unique([button], "observed-directory-first-row-chat");
    }
    const directory = {
      navigation: () => locate(["a#user-directory[href='/directory']"], ["Directory"], doc, "a[href='/directory']"),
      guardiansRadio: () => exactDirectoryRadio("radio-mfe-directory-Guardians_id"),
      searchInput: () => locate(["#input-field-mfe-directory-text-name"], ["Name"], doc, "input[type='text']"),
      chatButton: directoryChatButton,
      resultsTable: () => {
        const contract = directoryResultsContract();
        if (!contract.verified || !contract.visible || !contract.element) {
          return missing(contract.verified ? "directory-results-empty" : "directory-results-contract-mismatch");
        }
        return unique([contract.element], "observed-directory-results-table");
      }
    };
    const calendar = { navigation: () => missing("requires-live-verification") };
    function detectContext() {
      if (location.origin !== "https://vas.educator.powerschool.com" && location.hostname !== "127.0.0.1") return { area: "unknown", view: "unknown", confidence: "none" };
      if (messages.groupChatDialog().element) return { area: "group-chat", view: "compose", confidence: "high" };
      if (messages.recipientInput().element && messages.messageInput().element) return { area: "messages", view: "compose", confidence: "high" };
      if (messages.groupInformationPanel().element) return { area: "group-information", view: "members", confidence: "high" };
      if (messages.newMessageButton().element || conversationListRegion()) return { area: "messages", view: messages.messageInput().element ? "conversation" : "inbox", confidence: "high" };
      if (location.pathname === "/" && previewRoot().element) return { area: "newsfeed", view: "preview", confidence: "high" };
      if (location.pathname === "/" && composerRoot().element) return { area: "newsfeed", view: "compose", confidence: "high" };
      if (location.pathname === "/" && newsfeedFeedRoot().verified) return { area: "newsfeed", view: "feed", confidence: "high" };
      if (location.pathname === "/directory" && heading("Directory").element) return { area: "directory", view: "people", confidence: "high" };
      return { area: "unknown", view: "unknown", confidence: "none" };
    }
    function helpContext() {
      const base = detectContext();
      if (base.area !== "messages" || base.view !== "conversation") return base;
      const classState = messages.classConversationActive();
      if (classState?.verified && classState.active) {
        return { ...base, view: "class-conversation" };
      }
      const direct = messages.directConversation();
      if (direct?.verified && direct.active) {
        return {
          ...base,
          view: "direct-conversation",
          directCategory: direct.category,
          directIdentityKey: direct.identityKey
        };
      }
      return base;
    }

    function targetLabel(ref) {
      const located = target(ref);
      if (!located?.verified || !located.element) return "";
      return accessibleName(located.element) || clean(located.element.getAttribute?.("title")) || clean(located.element.textContent);
    }

    const state = (met, verified = true) => ({ met: Boolean(met), verified });
    const conditions = {
      "newsfeed.pageVisible": () => state(location.pathname === "/" && newsfeedFeedRoot().verified),
      "newsfeed.composerVisible": () => state(composerRoot().element && newsfeed.titleInput().element && newsfeed.bodyInput().element),
      "newsfeed.titleEntered": () => state(clean(newsfeed.titleInput().element?.value)),
      "newsfeed.bodyEntered": () => state(clean(newsfeed.bodyInput().element?.textContent?.replace(/[\u200b-\u200d\ufeff]/gu, ""))),
      "newsfeed.audienceGroupsSelected": () => {
        const groups = audienceGroups(), picker = audiencePickerState();
        const verified = groups.verified && picker.verified;
        return state(verified && groups.count > 0 && picker.closed, verified);
      },
      "newsfeed.recipientCategoriesSelected": () => {
        const groups = audienceGroups(), categories = newsfeed.audienceCategories();
        const verified = groups.verified && categories.length === 3 && categories.every(item => item.verified && item.element?.type === 'checkbox');
        return state(verified && groups.count > 0 && categories.some(item => item.element.checked), verified);
      },
      "newsfeed.audienceSelected": () => {
        const groups = audienceGroups(), categories = newsfeed.audienceCategories();
        const verified = groups.verified && categories.length === 3 && categories.every(item => item.verified && item.element?.type === 'checkbox');
        return state(verified && groups.count > 0 && categories.some(item => item.element.checked), verified);
      },
      "newsfeed.previewVisible": () => state(previewRoot().element),
      "newsfeed.published": () => state(false, false),
      "messages.composerVisible": () => state(messages.recipientInput().element && messages.messageInput().element),
      "messages.directComposerVisible": () => {
        const region = doc.getElementById("conversationRegion");
        const heading = region?.querySelector("h2#conversationHeading") || null;
        const messageInput = messages.messageInput();
        const conversationVerified = directMessageComposerRegionState({
          connected: Boolean(region?.isConnected),
          tagName: region?.tagName || "",
          labelledBy: region?.getAttribute("aria-labelledby") || "",
          headingTag: heading?.tagName || "",
          headingId: heading?.id || "",
          headingVisible: visible(heading)
        });
        const verified = conversationVerified && messageInput.verified;
        return state(directMessageComposerState({
          conversationVerified,
          messageInputVerified: Boolean(messageInput.element && messageInput.verified)
        }), verified);
      },
      "messages.classListVisible": () => {
        const contract = classListContract();
        return state(contract.visible, contract.verified);
      },
      "messages.classConversationActive": () => {
        const classState = messages.classConversationActive();
        if (classState.verified) return state(classState.active, true);
        const listState = classListContract();
        return state(false, listState.verified && listState.visible);
      },
      "messages.groupInformationVisible": () => {
        const panel = messages.groupInformationPanel();
        if (panel.verified && panel.element) return state(true, true);
        const classState = messages.classConversationActive();
        return state(false, classState.verified && classState.active);
      },
      "messages.groupChatDialogVisible": () => {
        const dialog = messages.groupChatDialog();
        return state(Boolean(dialog.verified && dialog.element), dialog.verified);
      },
      "messages.groupChatStudentsFilterSelected": () => {
        const filter = groupChatFilterState("chip-select-single-student-filter");
        return state(filter.selected, filter.verified);
      },
      "messages.groupChatGuardiansFilterSelected": () => {
        const filter = groupChatFilterState("chip-select-single-guardian-filter");
        return state(filter.selected, filter.verified);
      },
      "messages.groupChatRecipientsSelected": () => {
        const selected = groupChatSelectedState();
        return state(selected.selected, selected.verified);
      },
      "messages.recipientSelected": () => state(false, false),
      "messages.sent": () => state(false, false),
      "directory.pageVisible": () => state(location.pathname === "/directory" && heading("Directory").element),
      "directory.guardiansSelected": () => {
        const radio = directory.guardiansRadio();
        return state(radio.element?.checked === true, radio.verified);
      },
      "directory.queryEntered": () => {
        const input = directory.searchInput();
        return state(clean(input.element?.value), input.verified);
      },
      "directory.resultsVisible": () => {
        const contract = directoryResultsContract();
        return state(contract.visible, contract.verified);
      }
    };
    function guideContext(guideId, stepId = "") {
      const context = detectContext();
      if (guideId === "message-class-info") {
        if (["messages", "group-information"].includes(context.area)) return null;
        return {
          blocked: true,
          target: "messages.navigation",
          instructionKey: "walkthrough.blockedClassInfo"
        };
      }
      if (guideId === "find-parent") {
        if (context.area === "directory") return null;
        if (stepId === "open-directory") return null;
        return {
          blocked: true,
          target: "directory.navigation",
          instructionKey: "walkthrough.blockedDirectory"
        };
      }
      if (guideId === "message-multi") {
        if (["messages", "group-chat"].includes(context.area)) return null;
        return {
          blocked: true,
          target: "messages.navigation",
          instructionKey: "walkthrough.blockedMessageMulti"
        };
      }
      if (guideId !== "newsfeed-create") return null;
      if (context.area === "messages") return {
        blocked: true,
        target: "messages.backButton",
        instructionKey: context.view === "inbox" ? "walkthrough.blockedMessagesInbox" : "walkthrough.blockedMessagesDraft"
      };
      if (["group-information", "group-chat"].includes(context.area)) return {
        blocked: true,
        target: null,
        instructionKey: "walkthrough.blockedMemberWindow"
      };
      return null;
    }
    // Rendered controls may be outside the viewport or clipped by a nested scroller.
    function targetView(element) {
      if (!visible(element)) return { inView: false, covered: false, rect: null };
      const rect = element.getBoundingClientRect();
      const clip = { left: 0, top: 0, right: doc.documentElement.clientWidth || doc.defaultView.innerWidth, bottom: doc.documentElement.clientHeight || doc.defaultView.innerHeight };
      for (let parent = element.parentElement; parent && parent !== doc.body; parent = parent.parentElement) {
        const style = doc.defaultView.getComputedStyle(parent), bounds = parent.getBoundingClientRect();
        if (/(auto|scroll|hidden|clip)/u.test(style.overflowX || style.overflow)) { clip.left = Math.max(clip.left, bounds.left); clip.right = Math.min(clip.right, bounds.right); }
        if (/(auto|scroll|hidden|clip)/u.test(style.overflowY || style.overflow)) { clip.top = Math.max(clip.top, bounds.top); clip.bottom = Math.min(clip.bottom, bounds.bottom); }
        if (style.position === "fixed") break;
      }
      const shown = { left: Math.max(clip.left, rect.left), top: Math.max(clip.top, rect.top), right: Math.min(clip.right, rect.right), bottom: Math.min(clip.bottom, rect.bottom) };
      shown.width = Math.max(0, shown.right - shown.left); shown.height = Math.max(0, shown.bottom - shown.top);
      const inView = shown.width >= Math.min(24, rect.width) && shown.height >= Math.min(24, rect.height);
      const x = shown.left + shown.width / 2, y = shown.top + shown.height / 2;
      const top = inView ? doc.elementsFromPoint?.(x, y).find(node => !node.closest('[data-psqm-ui]')) : null;
      return { inView, covered: Boolean(top && top !== element && !element.contains(top)), rect: shown };
    }
    function target(key) {
      const [area, name] = String(key).split(".");
      const member = { navigation, newsfeed, messages, directory, calendar }[area]?.[name];
      return typeof member === "function" ? member() : missing("unknown-target");
    }
    function reviewToken() {
      const element = previewRoot().element;
      if (element !== previewElement) { previewElement = element; previewToken = element ? Object.freeze({}) : null; }
      return previewToken;
    }
    const languageLocale = Object.freeze({
      dialog: languageSettingsDialog,
      selection: languageSelection,
      confirmButton: languageSettingsConfirmButton
    });
    return Object.freeze({
      navigation, newsfeed, messages, directory, calendar, languageLocale, detectContext, helpContext, guideContext, target, targetLabel, targetView, reviewToken,
      uniqueExactStudentCardMatch,
      condition: key => conditions[key]?.() || state(false, false), visible,
      personIdentity: () => ({ verified: false, confidence: "none", reason: "requires-live-verification" }),
      verification: Object.freeze({ observedOn, environment: "VAS MyPowerHub", verifiedRole: null, identityStatus: "requires-live-verification" })
    });
  }
  hub.ui = typeof document === "object" ? createAdapter(document, root.location) : null;
  if (typeof module === "object" && module.exports) module.exports = {
    createAdapter,
    classListState,
    classesToggleState,
    groupInformationPanelState,
    activeConversationRegionState,
    messageTranslationControlContract,
    classConversationState,
    directRoleCategory,
    directConversationState,
    directInformationButtonState,
    directGuardianGroupChatButtonState,
    groupChatButtonState,
    uniqueExactStudentCardMatch,
    directoryResultsTableState,
    directoryChatButtonState,
    directMessageComposerState,
    directMessageComposerRegionState,
    groupChatSelectionState,
    groupChatDialogState,
    groupChatFilterStateContract,
    groupChatMemberTableState,
    groupChatRelationshipControlState,
    groupChatAddControlState,
    groupChatSelectedSectionState,
    groupChatExactControlState,
    groupChatPaginationState,
    messageListPointerCandidateState,
    messagingToolsButtonState,
    messageListRegionState,
    messageClassTabListState,
    messageClassTabState,
    messageClassTabLabelText,
    classAudienceConversationState,
    startConversationCardState,
    informationButtonState,
    nativeLanguageOptionCode,
    nativeLanguageLabelCode,
    nativeLanguageSettingsHeading,
    nativeLanguageSelectionState,
    audienceGroupSelectionState
  };
})(globalThis);
