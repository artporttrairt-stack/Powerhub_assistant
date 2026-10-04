(function (root) {
  "use strict";

  const hub = root.PSQM ??= {};
  if (hub.groupChatGuideDefinitions) return;
  const registry = hub.guideRegistry;
  if (!registry) throw new Error("Guide registry must load before Group Chat guide definitions.");

  const verification = { status: "observed", observedOn: "2026-09-14", verifiedRole: null, environment: "VAS MyPowerHub", schoolSourcesVerified: false };
  const step = (id, target, instructionKey, expectedAction, completeWhen, extra = {}) => ({
    id,
    target,
    instructionKey,
    expectedAction,
    completeWhen,
    sourceIds: ["BRIEF-24", "BRIEF-32", "BRIEF-36"],
    risk: "low",
    verification: "observed",
    fallbackKey: "guide.messageMulti.fallback",
    ...extra,
  });

  const fragment = registry.register("group-chat", {
    guides: {
      "message-multi": registry.guideDefinition({
        id: "message-multi",
        titleKey: "guide.messageMulti.title",
        descriptionKey: "guide.messageMulti.description",
        available: true,
        status: "pilot",
        resources: [],
        verification,
        steps: [
          step("purpose", null, "guide.messageMulti.purpose", "acknowledge", null, { actionLabelKey: "guide.action.start" }),
          step("open-group-chat", "messages.groupChatButton", "guide.messageMulti.openGroupChat", "click", "messages.groupChatDialogVisible", { allowExisting: true }),
          step("group-name", "messages.groupChatGroupName", "guide.messageMulti.groupName", "reminder", null),
          step("students", "messages.groupChatStudentsFilter", "guide.messageMulti.students", "click", "messages.groupChatStudentsFilterSelected", { allowExisting: true }),
          step("guardians", "messages.groupChatGuardiansFilter", "guide.messageMulti.guardians", "click", "messages.groupChatGuardiansFilterSelected", { allowExisting: true }),
          step("search", "messages.groupChatSearchInput", "guide.messageMulti.search", "reminder", null),
          step("relationships", "messages.groupChatFirstRelationshipControl", "guide.messageMulti.relationships", "reminder", null, { durationMs: 4200 }),
          step("recipient-safety", null, "guide.messageMulti.selectRecipients", "acknowledge", null, { risk: "recipient" }),
          step("participant-review", null, "guide.messageMulti.selectedPanel", "acknowledge", null),
          step("mode", null, "guide.messageMulti.mode", "acknowledge", null),
          step("review", null, "guide.messageMulti.review", "checklist", null, {
            checklist: ["guide.messageMulti.checkIdentity", "guide.messageMulti.checkRole", "guide.messageMulti.checkMode", "guide.messageMulti.checkNoCreate"],
          }),
          step("stop", "messages.groupChatCreateButton", "guide.messageMulti.stop", "handoff", null, { risk: "create" }),
        ],
      }, 4),
    },
    helpTasks: [
      registry.helpTask({ order: 3, id: "message-multi", contexts: ["messages:class-conversation", "group-chat:compose"], type: "walkthrough", guideId: "message-multi", titleKey: "guide.messageMulti.title" }),
      registry.helpTask({ order: 25, id: "group-chat-group-name", contexts: ["group-chat:compose"], type: "pointer", pointerId: "group-chat.group-name", titleKey: "help.groupChat.groupName" }),
      registry.helpTask({ order: 26, id: "group-chat-search", contexts: ["group-chat:compose"], type: "pointer", pointerId: "group-chat.search", titleKey: "help.groupChat.search" }),
      registry.helpTask({ order: 27, id: "group-chat-students", contexts: ["group-chat:compose"], type: "pointer", pointerId: "group-chat.students", titleKey: "help.groupChat.students" }),
      registry.helpTask({ order: 28, id: "group-chat-guardians", contexts: ["group-chat:compose"], type: "pointer", pointerId: "group-chat.guardians", titleKey: "help.groupChat.guardians" }),
      registry.helpTask({ order: 29, id: "group-chat-staff", contexts: ["group-chat:compose"], type: "pointer", pointerId: "group-chat.staff", titleKey: "help.groupChat.staff" }),
      registry.helpTask({ order: 30, id: "group-chat-relationships", contexts: ["group-chat:compose"], type: "pointer", pointerId: "group-chat.relationships", titleKey: "help.groupChat.relationships" }),
      registry.helpTask({ order: 31, id: "group-chat-add-one", contexts: ["group-chat:compose"], type: "pointer", pointerId: "group-chat.add-one", titleKey: "help.groupChat.addOne" }),
      registry.helpTask({ order: 33, id: "group-chat-selected", contexts: ["group-chat:compose"], type: "pointer", pointerId: "group-chat.selected", titleKey: "help.groupChat.selected" }),
      registry.helpTask({ order: 34, id: "group-chat-pagination", contexts: ["group-chat:compose"], type: "pointer", pointerId: "group-chat.pagination", titleKey: "help.groupChat.pagination" }),
      registry.helpTask({ order: 35, id: "group-chat-cancel", contexts: ["group-chat:compose"], type: "pointer", pointerId: "group-chat.cancel", titleKey: "help.groupChat.cancel" }),
      registry.helpTask({ order: 36, id: "group-chat-add-all-warning", contexts: ["group-chat:compose"], type: "tip", tipId: "group-chat.add-all-warning", titleKey: "help.groupChat.addAllWarning" }),
      registry.helpTask({ order: 37, id: "group-chat-auto-guardian-warning", contexts: ["group-chat:compose"], type: "tip", tipId: "group-chat.auto-guardian-warning", titleKey: "help.groupChat.autoGuardianWarning" }),
    ],
    pointerDefinitions: {
      "group-chat.group-name": registry.pointerDefinition({ id: "group-chat.group-name", target: "messages.groupChatGroupName", instructionKey: "help.groupChat.groupName", titleKey: "help.groupChat.groupName" }),
      "group-chat.search": registry.pointerDefinition({ id: "group-chat.search", target: "messages.groupChatSearchInput", instructionKey: "help.groupChat.search", titleKey: "help.groupChat.search" }),
      "group-chat.students": registry.pointerDefinition({ id: "group-chat.students", target: "messages.groupChatStudentsFilter", instructionKey: "help.groupChat.students", titleKey: "help.groupChat.students" }),
      "group-chat.guardians": registry.pointerDefinition({ id: "group-chat.guardians", target: "messages.groupChatGuardiansFilter", instructionKey: "help.groupChat.guardians", titleKey: "help.groupChat.guardians" }),
      "group-chat.staff": registry.pointerDefinition({ id: "group-chat.staff", target: "messages.groupChatStaffFilter", instructionKey: "help.groupChat.staff", titleKey: "help.groupChat.staff" }),
      "group-chat.relationships": registry.pointerDefinition({ id: "group-chat.relationships", target: "messages.groupChatFirstRelationshipControl", instructionKey: "help.groupChat.relationships", titleKey: "help.groupChat.relationships" }),
      "group-chat.add-one": registry.pointerDefinition({ id: "group-chat.add-one", target: "messages.groupChatFirstAddControl", instructionKey: "help.groupChat.addOne", titleKey: "help.groupChat.addOne" }),
      "group-chat.selected": registry.pointerDefinition({ id: "group-chat.selected", target: "messages.groupChatSelectedPanel", instructionKey: "help.groupChat.selected", titleKey: "help.groupChat.selected" }),
      "group-chat.pagination": registry.pointerDefinition({ id: "group-chat.pagination", target: "messages.groupChatPagination", instructionKey: "help.groupChat.pagination", titleKey: "help.groupChat.pagination" }),
      "group-chat.cancel": registry.pointerDefinition({ id: "group-chat.cancel", target: "messages.groupChatCancelButton", instructionKey: "help.groupChat.cancel", titleKey: "help.groupChat.cancel" }),
    },
    tipDefinitions: {
      "group-chat.add-all-warning": registry.tipDefinition({ id: "group-chat.add-all-warning", descriptionKey: "help.groupChat.addAllWarning" }),
      "group-chat.auto-guardian-warning": registry.tipDefinition({ id: "group-chat.auto-guardian-warning", descriptionKey: "help.groupChat.autoGuardianWarning" }),
    },
  });

  hub.groupChatGuideDefinitions = fragment;
  if (typeof module === "object" && module.exports) module.exports = fragment;
})(globalThis);
