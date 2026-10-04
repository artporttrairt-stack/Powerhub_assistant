(function (root) {
  "use strict";
  const hub = root.PSQM ??= {};
  if (hub.ui) return;

  const CLASSES_TOGGLE_ID = "messenger-inbox__conversation-list-classes-accordion-toggle";
  const CLASSES_LIST_ID = "messenger-inbox__conversation-list-classes-accordion-accordion-content";
  const GROUP_CHAT_ACCOUNT_TOKEN_PATTERN = /^[A-Za-z0-9_-]{26}$/u;
  const GROUP_CHAT_HOST_ID = "messenger-inbox__channel-header__right__staff-create-group-from-group";
  const GROUP_CHAT_BUTTON_ID = "button-messenger-inbox__channel-header__right__staff-create-group-from-group";
  const LANGUAGE_SETTINGS_HEADING_ID = "mfe-dashboard-language-locale-settings-dialog-aria-labelledby-target";
  const LANGUAGE_CONTROL_ID = "input-field-mfe-dashboard-select-language";
  const LANGUAGE_HELPER_ID = "mfe-dashboard-select-language";
  const LANGUAGE_PICKER_ID = "mfe-dashboard-select-language-popper-item-picker";

  function nativeLanguageSettingsHeading(text) {
    const normalized = String(text || "").replace(/\s+/gu, " ").trim();
    return normalized === "Language & locale settings" || normalized === "Language settings";
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
      && ariaLabel === "Select Language"
      && helperCount === 1
      && helperText === "Select a language for automatic translation.";
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

  function groupChatButtonState({
    classVerified,
    classActive,
    headerContainsHeading,
    hostCount,
    hostVisible,
    hostInsideHeader,
    hostId,
    hostAriaLabel,
    hostIcon,
    buttonCount,
    buttonTagName,
    buttonConnected,
    buttonInsideHost,
    buttonId,
    buttonAriaLabel
  }) {
    return classVerified === true
      && classActive === true
      && headerContainsHeading === true
      && hostCount === 1
      && hostVisible === true
      && hostInsideHeader === true
      && hostId === GROUP_CHAT_HOST_ID
      && hostAriaLabel === "Create group chat"
      && hostIcon === "user-group-add"
      && buttonCount === 1
      && buttonTagName === "BUTTON"
      && buttonConnected === true
      && buttonInsideHost === true
      && buttonId === GROUP_CHAT_BUTTON_ID
      && buttonAriaLabel === "Create group chat";
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

  function messageListRegionState({
    tagName,
    id,
    className,
    ariaLabel,
    labelledBy,
    headingCount,
    headingTag,
    headingText,
    headingInsideRegion
  }) {
    const exactRegion = tagName === "SECTION"
      && id === "conversationListRegion"
      && String(className || "").split(/\s+/u).includes("messenger-inbox__conversationlist-region");
    if (!exactRegion) return false;
    if (String(ariaLabel || "").trim() === "Conversation list") return true;
    return labelledBy === "conversationListHeading"
      && headingCount === 1
      && headingTag === "H1"
      && String(headingText || "").replace(/\s+/gu, " ").trim() === "Conversation list"
      && headingInsideRegion === true;
  }

  function messageClassTabState({ candidateCount, id, expectedId, role, name, expectedName, inActiveConversation, classActive }) {
    return candidateCount === 1
      && id === expectedId
      && role === "tab"
      && name === expectedName
      && inActiveConversation === true
      && classActive === true;
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
    markerCount,
    markerTagName,
    markerClassName,
    markerText,
    titleCount,
    titleTagName,
    titleTestId,
    titleText,
    inConversationList
  }) {
    return cardCount === 1
      && cardTagName === "DIV"
      && String(cardClassName || "").split(/\s+/u).includes("messenger-inbox__messenger-channel-preview")
      && markerCount === 1
      && markerTagName === "DIV"
      && markerClassName === "messenger-inbox__conversation-list-classes-start-convo"
      && String(markerText || "").replace(/\s+/gu, " ").trim() === "Start a conversation"
      && titleCount === 1
      && titleTagName === "BUTTON"
      && titleTestId === "messenger-channel-preview"
      && String(titleText || "").replace(/\s+/gu, " ").trim().length > 0
      && inConversationList === true;
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
    function composerRoot() {
      const result = locate(["#compose-view-layout"]);
      if (!result.element) return missing("composer-not-ready");
      const headings = [heading("New post", result.element), heading("Edit post", result.element)];
      if (headings.some(item => item.reason === "ambiguous-target")) return missing("ambiguous-composer-heading");
      const visibleHeadings = headings.filter(item => item.element);
      return visibleHeadings.length === 1 ? result
        : missing(visibleHeadings.length ? "ambiguous-composer-heading" : "composer-not-ready");
    }
    function previewRoot() {
      const result = locate(['[data-testid="post-newsfeed-modal"]']);
      const scope = result.element;
      return scope && heading("Preview post", scope).element
        && locate(["#button-post-continue-editing-btn"], ["Continue editing"], scope).element
        && locate(["#button-post-post-now-btn"], ["Post"], scope).element ? result : missing("preview-not-ready");
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
      if (chips.length > 0) {
        return {
          count: chips.length,
          verified: chipIds.length === chips.length && new Set(chipIds).size === chips.length
        };
      }

      // PowerHub can collapse all selected groups into one native overflow control.
      // Use structural evidence from this exact chip-set instead of matching "+N"
      // text, because both the overflow button and its nested span expose that text.
      const overflowMenus = [...container.querySelectorAll(
        'button[id^="neon-multi-select-chipSet-"][id$="-overflow-menu"]'
      )].filter(node => node.isConnected && !node.closest('[data-psqm-ui]') && visible(node));
      const clearAllControls = [...container.querySelectorAll('button')]
        .filter(node => node.isConnected
          && !node.closest('[data-psqm-ui]')
          && visible(node)
          && accessibleName(node) === "Clear all");

      if (overflowMenus.length === 1 && clearAllControls.length === 1) {
        // Downstream conditions only require a verified non-empty audience.
        return { count: 1, verified: true };
      }
      if (overflowMenus.length || clearAllControls.length) return { count: 0, verified: false };

      return { count: 0, verified: true };
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
      audienceControl: () => locate([], ["To"], composerRoot().element, "[role='combobox']"),
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

    function classConversationActive() {
      const active = activeConversationRegion();
      const tabs = [...(active?.region.querySelectorAll('[role="tablist"][aria-label="class tabs"]') || [])]
        .filter(element => element instanceof doc.defaultView.HTMLElement && visible(element));
      const contract = classConversationState({ regionVerified: Boolean(active), classTabCount: tabs.length });
      return {
        ...contract,
        element: tabs[0] || null,
        region: active?.region || null,
        heading: active?.heading || null
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
      if (hosts.length !== 1) return missing(hosts.length ? "ambiguous-group-chat-modal-host" : "group-chat-modal-host-missing");

      const host = hosts[0];
      if (host.closest("[data-psqm-ui]")) return missing("extension-group-chat-modal-host");

      const dialogs = [...host.querySelectorAll('section[role="dialog"][aria-modal="true"]')]
        .filter(element => element instanceof doc.defaultView.HTMLElement
          && element.isConnected
          && !element.closest("[data-psqm-ui]"));
      if (dialogs.length !== 1) return missing(dialogs.length ? "ambiguous-group-chat-dialog" : "group-chat-dialog-missing");

      const dialog = dialogs[0];
      if (dialog.tagName !== "SECTION" || !host.contains(dialog) || !visible(dialog)) {
        return missing("group-chat-dialog-contract-mismatch");
      }

      const labelledById = "messenger-inbox__create-group-from-group-modal-aria-labelledby-target";
      if (dialog.getAttribute("aria-labelledby") !== labelledById) {
        return missing("group-chat-dialog-label-contract-mismatch");
      }

      const labels = [...dialog.querySelectorAll(`#${labelledById}`)]
        .filter(element => element.isConnected && !element.closest("[data-psqm-ui]"));
      if (labels.length !== 1 || clean(labels[0].textContent) !== "Create group chat") {
        return missing(labels.length > 1 ? "ambiguous-group-chat-dialog-label" : "group-chat-dialog-label-mismatch");
      }

      return unique([dialog], "observed-id");
    }

    function groupChatControl(id, { tagName, type } = {}) {
      const dialog = createGroupChatDialog();
      if (!dialog.verified || !dialog.element) return missing("group-chat-dialog-not-ready");
      const matches = [...dialog.element.querySelectorAll(`#${id}`)]
        .filter(element => element.isConnected && !element.closest("[data-psqm-ui]"));
      if (matches.length !== 1) return missing(matches.length ? "ambiguous-target" : "target-missing");
      const element = matches[0];
      if ((tagName && element.tagName !== tagName)
        || (type && element.getAttribute("type") !== type)) {
        return missing("group-chat-control-contract-mismatch");
      }
      return unique([element], "observed-id");
    }

    function groupChatFilter(id, expectedLabel) {
      const control = groupChatControl(id, { tagName: "INPUT", type: "checkbox" });
      if (!control.verified || !control.element) return control;
      const dialog = createGroupChatDialog();
      const labels = [...dialog.element.querySelectorAll(`label[for="${id}"]`)]
        .filter(label => label.isConnected && clean(label.textContent) === expectedLabel);
      return unique(labels, "observed-label-for");
    }

    function groupChatFilterState(id, expectedLabel) {
      const control = groupChatControl(id, { tagName: "INPUT", type: "checkbox" });
      const label = groupChatFilter(id, expectedLabel);
      if (!control.verified || !control.element || !label.verified || !label.element) {
        return { verified: false, selected: false };
      }
      return { verified: true, selected: control.element.checked === true };
    }

    function groupChatTable(className) {
      const dialog = createGroupChatDialog();
      if (!dialog.verified || !dialog.element) return missing("group-chat-dialog-not-ready");
      const matches = [...dialog.element.querySelectorAll(`table.${className}`)]
        .filter(element => element.isConnected && !element.closest("[data-psqm-ui]"));
      if (matches.length !== 1) return missing(matches.length ? "ambiguous-target" : "target-missing");
      const table = matches[0];
      const headerCells = [...(table.querySelector("thead > tr")?.children || [])];
      if (table.tagName !== "TABLE"
        || headerCells.length < 2
        || clean(headerCells[0].textContent) !== "Name"
        || clean(headerCells[1].textContent) !== "Role") {
        return missing("group-chat-table-contract-mismatch");
      }
      return unique([table], "observed-table-contract");
    }

    function groupChatSelectableRegion() {
      const table = groupChatTable("messenger-inbox__user-selection-table");
      if (!table.verified || !table.element) return table;
      const dialog = createGroupChatDialog();
      const candidates = [...dialog.element.querySelectorAll(".messenger-inbox__grid-col-left")]
        .filter(element => element.isConnected && element.contains(table.element));
      return unique(candidates, "observed-member-source-region");
    }

    function groupChatFirstRelationshipControl() {
      const table = groupChatTable("messenger-inbox__user-selection-table");
      if (!table.verified || !table.element) return table;
      const candidates = [...table.element.querySelectorAll("tbody > tr button.messenger-inbox__expand-button")]
        .filter(element => element.tagName === "BUTTON"
          && element.isConnected
          && ["messenger-inbox.expand", "messenger-inbox.collapse"].includes(element.getAttribute("aria-label"))
          && !element.disabled
          && !element.closest("[data-psqm-ui]")
          && visible(element));
      return candidates.length
        ? unique([candidates[0]], "observed-first-relationship-control")
        : missing("group-chat-relationship-control-missing");
    }

    function groupChatFirstAddControl() {
      const table = groupChatTable("messenger-inbox__user-selection-table");
      if (!table.verified || !table.element) return table;
      const candidates = [...table.element.querySelectorAll('tbody > tr button[id^="button-add-user-"]')]
        .filter(element => {
          const token = String(element.id || "").slice("button-add-user-".length);
          return element.tagName === "BUTTON"
            && element.id === `button-add-user-${token}`
            && GROUP_CHAT_ACCOUNT_TOKEN_PATTERN.test(token)
            && element.getAttribute("aria-label") === "Add"
            && element.isConnected
            && !element.disabled
            && !element.closest("[data-psqm-ui]")
            && visible(element);
        });
      return candidates.length
        ? unique([candidates[0]], "observed-first-add-control")
        : missing("group-chat-add-control-missing");
    }

    function groupChatSelectedState() {
      const dialog = createGroupChatDialog();
      if (!dialog.verified || !dialog.element) {
        return { element: null, ...groupChatSelectionState({ candidateCount: 0, summaryCount: 0, selectedCount: -1, rowCount: -1, emptyPrompt: false }) };
      }
      const candidates = [...dialog.element.querySelectorAll(".messenger-inbox__selected-items-section")]
        .filter(element => element.isConnected && !element.closest("[data-psqm-ui]"));
      const section = candidates.length === 1 ? candidates[0] : null;
      const table = section?.querySelector("table.messenger-inbox__selected-items-table") || null;
      const summaries = section ? [...section.querySelectorAll("*")]
        .filter(element => element.children.length === 0 && /^\d+ selected$/u.test(clean(element.textContent))) : [];
      const selectedCount = summaries.length === 1 ? Number.parseInt(clean(summaries[0].textContent), 10) : -1;
      const rows = table ? [...table.querySelectorAll("tbody > tr")] : [];
      const emptyPrompt = rows.length === 1 && clean(rows[0].textContent) === "Add members to create a group chat";
      const state = groupChatSelectionState({
        candidateCount: section && table ? candidates.length : 0,
        summaryCount: summaries.length,
        selectedCount,
        rowCount: rows.length,
        emptyPrompt
      });
      return { element: state.verified ? section : null, ...state };
    }

    function groupChatSelectedPanel() {
      const selected = groupChatSelectedState();
      return selected.verified && selected.element
        ? unique([selected.element], "observed-selected-members-contract")
        : missing("group-chat-selected-panel-contract-mismatch");
    }

    function groupChatPagination() {
      const source = groupChatSelectableRegion();
      if (!source.verified || !source.element) return source;
      const candidates = [...source.element.querySelectorAll(".messenger-inbox__user-selection-pagination")]
        .filter(element => element.isConnected && !element.closest("[data-psqm-ui]"));
      return unique(candidates, "observed-member-pagination");
    }

    function boundedHeaderControl(labels) {
      const header = activeConversationHeader();
      if (!header) return missing("conversation-header-missing");
      const wanted = new Set(labels);
      const matches = [...header.querySelectorAll("button, [role='button']")]
        .filter(element => wanted.has(accessibleName(element)));
      const result = unique(matches, "bounded-accessible-name-fallback", "medium");
      if (result.element) {
        return { ...result, verification: "requires-live-verification" };
      }
      return result;
    }

    function informationButton() {
      return boundedHeaderControl([
        "Conversation information",
        "Conversation Information",
        "Group Information",
        "Information",
        "View conversation information"
      ]);
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
      const region = doc.getElementById("conversationListRegion");
      // Native PowerHub uses this as a zero-size semantic wrapper; visibility is
      // enforced on the exact descendant pointer candidate below.
      if (!(region instanceof doc.defaultView.HTMLElement) || !region.isConnected) {
        return null;
      }
      const labelledBy = clean(region.getAttribute("aria-labelledby"));
      const headings = labelledBy === "conversationListHeading"
        ? [...region.querySelectorAll("#conversationListHeading")]
        : [];
      const heading = headings[0] || null;
      if (!messageListRegionState({
        tagName: region.tagName,
        id: region.id,
        className: region.className,
        ariaLabel: region.getAttribute("aria-label"),
        labelledBy,
        headingCount: headings.length,
        headingTag: heading?.tagName || "",
        headingText: heading?.textContent || "",
        headingInsideRegion: Boolean(heading && region.contains(heading))
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

      const markers = [...card.querySelectorAll(".messenger-inbox__conversation-list-classes-start-convo")]
        .filter(element => clean(element.textContent) === "Start a conversation");
      const titles = [...card.querySelectorAll("button[data-testid='messenger-channel-preview']")];
      const title = titles[0] || null;
      if (!startConversationCardState({
        cardCount: 1,
        cardTagName: card.tagName,
        cardClassName: card.className,
        markerCount: markers.length,
        markerTagName: markers[0]?.tagName || "",
        markerClassName: markers[0]?.className || "",
        markerText: markers[0]?.textContent || "",
        titleCount: titles.length,
        titleTagName: title?.tagName || "",
        titleTestId: title?.getAttribute("data-testid") || "",
        titleText: title?.textContent || "",
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
          const markers = [...card.querySelectorAll(".messenger-inbox__conversation-list-classes-start-convo")]
            .filter(element => clean(element.textContent) === "Start a conversation");
          const titles = [...card.querySelectorAll("button[data-testid='messenger-channel-preview']")];
          const title = titles[0] || null;
          return startConversationCardState({
            cardCount: 1,
            cardTagName: card.tagName,
            cardClassName: card.className,
            markerCount: markers.length,
            markerTagName: markers[0]?.tagName || "",
            markerClassName: markers[0]?.className || "",
            markerText: markers[0]?.textContent || "",
            titleCount: titles.length,
            titleTagName: title?.tagName || "",
            titleTestId: title?.getAttribute("data-testid") || "",
            titleText: title?.textContent || "",
            inConversationList: scope.contains(card)
          }) && clean(title?.textContent) === activeTitle;
        });

      return cards.length === 1
        ? unique([cards[0]], "observed-active-start-conversation-card")
        : missing(cards.length > 1 ? "ambiguous-start-conversation-card" : "start-conversation-card-missing");
    }

    function classConversationTab(id, expectedName) {
      const classState = classConversationActive();
      const active = activeConversationRegion();
      if (!active || !classState?.verified || classState.active !== true) {
        return missing(classState?.reason || "class-conversation-not-active");
      }
      const tablists = [...active.region.querySelectorAll('[role="tablist"][aria-label="class tabs"]')]
        .filter(element => visible(element));
      const candidates = tablists.length === 1
        ? [...tablists[0].querySelectorAll(`#${id}`)]
        : [];
      const element = candidates[0] || null;
      const visibleLabels = element
        ? [...element.querySelectorAll(":scope > .neon-tabs-tab-text:not([aria-hidden='true'])")]
        : [];
      if (!messageClassTabState({
        candidateCount: candidates.length,
        id: element?.id || "",
        expectedId: id,
        role: element?.getAttribute("role") || "",
        name: messageClassTabLabelText({
          candidateCount: visibleLabels.length,
          text: visibleLabels[0]?.textContent || ""
        }),
        expectedName,
        inActiveConversation: Boolean(element && active.region.contains(element)),
        classActive: classState.active === true
      })) {
        return missing(tablists.length > 1 || candidates.length > 1 ? "ambiguous-target" : "class-tab-contract-mismatch");
      }
      const result = unique([element], "observed-class-tab");
      return result.verified
        ? { ...result, selected: element.getAttribute("aria-selected") === "true" }
        : result;
    }

    function classAudienceConversation() {
      const classState = classConversationActive();
      const tabs = {
        students: classConversationTab("class-group-tabs-tab-students", "Students"),
        guardians: classConversationTab("class-group-tabs-tab-guardians", "Guardians"),
        everyone: classConversationTab("class-group-tabs-tab-everyone", "Everyone")
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
      // Observed in Messenger on 2026-09-06; the generated ID ends in null.
      backButton: () => locate([], ["Navigate back to previous page"], doc, "button[aria-label]"),
      newMessageButton: () => locate(["#button-new-conversation-button"], ["New message"]),
      recipientInput: () => locate(["#recipient-search-input"], ["Enter a contact name"], doc, "input[role='searchbox']"),
      messageInput: () => locate(["#messenger-inbox-message-input-text-field"], ["Enter message"], doc, "[contenteditable='true'][role='textbox']"),
      sendButton: () => locate(["#button-messenger-inbox__message-input__send-btn"], ["Send Message"]),
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
      classStudentsTab: () => classConversationTab("class-group-tabs-tab-students", "Students"),
      classGuardiansTab: () => classConversationTab("class-group-tabs-tab-guardians", "Guardians"),
      classEveryoneTab: () => classConversationTab("class-group-tabs-tab-everyone", "Everyone"),
      classAudienceConversation,
      groupChatDialog: createGroupChatDialog,
      groupChatGroupName: () => groupChatControl("input-field-messenger-inbox__create-group-name", { tagName: "INPUT", type: "text" }),
      groupChatAddAllStudents: () => groupChatControl("checkbox-messenger-inbox__add-all-students", { tagName: "INPUT", type: "checkbox" }),
      groupChatAddAllGuardians: () => groupChatControl("checkbox-messenger-inbox__add-all-guardians", { tagName: "INPUT", type: "checkbox" }),
      groupChatStudentsFilter: () => groupChatFilter("chip-select-single-student-filter", "Students"),
      groupChatGuardiansFilter: () => groupChatFilter("chip-select-single-guardian-filter", "Guardians"),
      groupChatStaffFilter: () => groupChatFilter("chip-select-single-staff-filter", "Staff"),
      groupChatSearchInput: () => groupChatControl("messenger-inbox__search_search-textsearch-input", { tagName: "INPUT", type: "text" }),
      groupChatSelectableRegion,
      groupChatFirstRelationshipControl,
      groupChatFirstAddControl,
      groupChatSelectedPanel,
      groupChatPagination,
      groupChatAutoAddGuardians: () => groupChatControl("checkbox-messenger-inbox__auto-add-guardians-toggle", { tagName: "INPUT", type: "checkbox" }),
      groupChatCancelButton: () => groupChatControl("button-messenger-inbox__staff-create-group-from-group-cancel", { tagName: "BUTTON", type: "button" }),
      groupChatCreateButton: () => groupChatControl("button-messenger-inbox__staff-create-group-from-group-create", { tagName: "BUTTON", type: "button" }),
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
          hostVisible: visible(host),
          hostInsideHeader: header.contains(host),
          hostId: host.id,
          hostAriaLabel: host.getAttribute("data-aria-label"),
          hostIcon: host.getAttribute("data-icon"),
          buttonCount: buttons.length,
          buttonTagName: button.tagName,
          buttonConnected: button.isConnected,
          buttonInsideHost: host.contains(button),
          buttonId: button.id,
          buttonAriaLabel: button.getAttribute("aria-label")
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
      if (heading("Group Information").element) return { area: "group-information", view: "members", confidence: "medium" };
      if (messages.newMessageButton().element || heading("Conversation list").element) return { area: "messages", view: messages.messageInput().element ? "conversation" : "inbox", confidence: "high" };
      if (location.pathname === "/" && previewRoot().element) return { area: "newsfeed", view: "preview", confidence: "high" };
      if (location.pathname === "/" && composerRoot().element) return { area: "newsfeed", view: "compose", confidence: "high" };
      if (location.pathname === "/" && heading("Newsfeed").element) return { area: "newsfeed", view: "feed", confidence: "high" };
      if (location.pathname === "/directory" && heading("Directory").element) return { area: "directory", view: "people", confidence: "high" };
      return { area: "unknown", view: "unknown", confidence: "none" };
    }
    const state = (met, verified = true) => ({ met: Boolean(met), verified });
    const conditions = {
      "newsfeed.pageVisible": () => state(location.pathname === "/" && heading("Newsfeed").element),
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
        const filter = groupChatFilterState("chip-select-single-student-filter", "Students");
        return state(filter.selected, filter.verified);
      },
      "messages.groupChatGuardiansFilterSelected": () => {
        const filter = groupChatFilterState("chip-select-single-guardian-filter", "Guardians");
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
      const member = { newsfeed, messages, directory, calendar }[area]?.[name];
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
      newsfeed, messages, directory, calendar, languageLocale, detectContext, guideContext, target, targetView, reviewToken,
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
    classConversationState,
    groupChatButtonState,
    uniqueExactStudentCardMatch,
    directoryResultsTableState,
    directoryChatButtonState,
    directMessageComposerState,
    directMessageComposerRegionState,
    groupChatSelectionState,
    messageListPointerCandidateState,
    messageListRegionState,
    messageClassTabState,
    messageClassTabLabelText,
    classAudienceConversationState,
    startConversationCardState,
    nativeLanguageOptionCode,
    nativeLanguageLabelCode,
    nativeLanguageSettingsHeading,
    nativeLanguageSelectionState
  };
})(globalThis);
