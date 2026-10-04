(function (root) {
  "use strict";

  const hub = root.PSQM ??= {};
  if (hub.messageGuideDefinitions) return;
  const registry = hub.guideRegistry;
  if (!registry) throw new Error("Guide registry must load before Message guide definitions.");

  const verification = { status: "partially-verified", observedOn: "2026-09-07", verifiedRole: null, environment: "VAS MyPowerHub", schoolSourcesVerified: false };
  const classInfoVerification = { status: "observed", observedOn: "2026-09-14", verifiedRole: null, environment: "VAS MyPowerHub", schoolSourcesVerified: false };
  const parentLookupVerification = { status: "observed", observedOn: "2026-09-14", verifiedRole: null, environment: "VAS MyPowerHub", schoolSourcesVerified: false };
  const messageStep = (id, target, instructionKey, expectedAction, completeWhen, extra = {}) => ({
    id,
    target,
    instructionKey,
    expectedAction,
    completeWhen,
    sourceIds: ["BRIEF-32", "BRIEF-36"],
    risk: "low",
    verification: "observed",
    fallbackKey: "guide.classInfo.fallback",
    ...extra,
  });
  const directoryStep = (id, target, instructionKey, expectedAction, completeWhen, extra = {}) => ({
    id,
    target,
    instructionKey,
    expectedAction,
    completeWhen,
    sourceIds: ["BRIEF-24", "BRIEF-32", "BRIEF-36"],
    risk: "low",
    verification: "observed",
    fallbackKey: "guide.findParent.fallback",
    ...extra,
  });
  const legacyMessageStep = (id, target, instructionKey, expectedAction, completeWhen, extra = {}) => ({
    id,
    target,
    instructionKey,
    expectedAction,
    completeWhen,
    sourceIds: ["BRIEF-23"],
    risk: "low",
    verification: "observed",
    fallbackKey: "guide.newsfeed.fallback",
    ...extra,
  });

  const fragment = registry.register("messages", {
    guides: {
      "message-class-info": registry.guideDefinition({
        id: "message-class-info",
        titleKey: "guide.classInfo.title",
        descriptionKey: "guide.classInfo.description",
        status: "pilot",
        available: true,
        verification: classInfoVerification,
        resources: [],
        steps: [
          messageStep("information", "messages.informationButton", "guide.classInfo.information", "click", "messages.groupInformationVisible", { allowExisting: true }),
          messageStep("moderators", "messages.informationModerators", "guide.classInfo.moderators", "choice", null, {
            choices: [{ id: "next", labelKey: "common.next", primary: true }],
            choiceRoutes: { next: "members" }
          }),
          messageStep("members", "messages.informationMembers", "guide.classInfo.members", "choice", null, {
            choices: [
              { id: "back", labelKey: "common.back" },
              { id: "next", labelKey: "common.next", primary: true }
            ],
            choiceRoutes: { back: "moderators", next: "message-replies" }
          }),
          messageStep("message-replies", "messages.informationReplies", "guide.classInfo.replies", "choice", null, {
            choices: [
              { id: "back", labelKey: "common.back" },
              { id: "next", labelKey: "common.next", primary: true }
            ],
            choiceRoutes: { back: "members", next: "pause-notifications" }
          }),
          messageStep("pause-notifications", "messages.informationNotifications", "guide.classInfo.notifications", "choice", null, {
            choices: [
              { id: "back", labelKey: "common.back" },
              { id: "next", labelKey: "common.next", primary: true }
            ],
            choiceRoutes: { back: "message-replies", next: "create-group-chat" }
          }),
          messageStep("create-group-chat", "messages.informationCreateGroup", "guide.classInfo.createGroup", "choice", null, {
            choices: [
              { id: "back", labelKey: "common.back" },
              { id: "done", labelKey: "walkthrough.done", primary: true }
            ],
            choiceRoutes: { back: "pause-notifications", done: null }
          }),
        ],
      }, 1),
      "message-parent": registry.guideDefinition({
        id: "message-parent",
        titleKey: "guide.messageParent.title",
        descriptionKey: "guide.messageParent.description",
        available: false,
        status: "requires-live-verification",
        resources: [],
        verification,
        steps: [legacyMessageStep("recipient", "messages.recipientInput", "guide.messageParent.recipient", "change", "messages.recipientSelected", { sourceIds: ["BRIEF-24"], verification: "requires-live-verification" })],
      }, 2),
      "find-parent": registry.guideDefinition({
        id: "find-parent",
        titleKey: "guide.findParent.title",
        descriptionKey: "guide.findParent.description",
        available: true,
        status: "pilot",
        resources: [],
        verification: parentLookupVerification,
        steps: [
          directoryStep("purpose", null, "guide.findParent.purpose", "acknowledge", null, { actionLabelKey: "guide.action.start" }),
          directoryStep("open-directory", "directory.navigation", "guide.findParent.openDirectory", "click", "directory.pageVisible", { allowExisting: true }),
          directoryStep("guardians", "directory.guardiansRadio", "guide.findParent.guardians", "click", "directory.guardiansSelected", { allowExisting: true }),
          directoryStep("name", "directory.searchInput", "guide.findParent.name", "input", "directory.queryEntered", { confirmExisting: true }),
          directoryStep("review", null, "guide.findParent.review", "checklist", null, {
            requires: "directory.resultsVisible",
            returnTo: "name",
            checklist: ["guide.findParent.checkExact", "guide.findParent.checkStudent", "guide.findParent.checkManual"],
          }),
          directoryStep("complete", null, "guide.findParent.complete", "acknowledge", null, { actionLabelKey: "walkthrough.done" }),
        ],
      }, 3),
      "calendar-event": registry.guideDefinition({
        id: "calendar-event",
        titleKey: "guide.calendar.title",
        descriptionKey: "guide.calendar.description",
        available: false,
        status: "requires-live-verification",
        resources: [],
        verification,
        steps: [],
      }, 5),
    },
    helpTasks: [
      registry.helpTask({ order: 1, id: "message-class-info", contexts: ["messages:inbox", "messages:class-conversation"], type: "walkthrough", guideId: "message-class-info", titleKey: "guide.classInfo.title" }),
      registry.helpTask({ order: 12, id: "messages-recipient", contexts: ["messages:compose"], type: "pointer", pointerId: "messages.recipient", titleKey: "help.messages.note1" }),
      registry.helpTask({ order: 13, id: "messages-identity", contexts: ["messages:compose"], type: "pointer", pointerId: "messages.identity", titleKey: "help.messages.note2" }),
      registry.helpTask({ order: 14, id: "messages-add-one", contexts: ["messages:inbox", "messages:direct-conversation"], type: "pointer", pointerId: "messages.add-one", titleKey: "help.messages.addOne.title" }),
      registry.helpTask({ order: 17, id: "messages-students", contexts: ["messages:class-conversation"], type: "pointer", pointerId: "messages.students", titleKey: "help.messages.students.title" }),
      registry.helpTask({ order: 18, id: "messages-guardians", contexts: ["messages:class-conversation"], type: "pointer", pointerId: "messages.guardians", titleKey: "help.messages.guardians.title" }),
      registry.helpTask({ order: 19, id: "messages-information", contexts: ["messages:class-conversation"], type: "pointer", pointerId: "messages.information", titleKey: "help.messages.information.title" }),
      registry.helpTask({ order: 20, id: "messages-create-group", contexts: ["messages:class-conversation"], type: "pointer", pointerId: "messages.create-group", titleKey: "help.messages.createGroup.title" }),
      registry.helpTask({ order: 20, id: "messages-direct-information", contexts: ["messages:direct-conversation"], type: "pointer", pointerId: "messages.direct-information", titleKey: "help.directMessage.information.title", nativeTitle: true }),
      registry.helpTask({ order: 21, id: "messages-direct-guardian-group", contexts: ["messages:direct-conversation"], type: "pointer", pointerId: "messages.direct-guardian-group", titleKey: "help.directMessage.guardianGroup.title", nativeTitle: true }),
      registry.helpTask({ order: 22, id: "messages-sensitive", contexts: ["messages"], type: "tip", tipId: "messages.sensitive", titleKey: "help.messages.more2" }),
      registry.helpTask({ order: 22, id: "directory-identity", contexts: ["directory"], type: "pointer", pointerId: "directory.identity", titleKey: "help.directory.note1" }),
      registry.helpTask({ order: 24, id: "group-information-duplicate-name", contexts: ["group-information"], type: "tip", tipId: "group-information.duplicate-name", titleKey: "help.groupInformation.more1" }),
    ],
    pointerDefinitions: {
      "messages.recipient": registry.pointerDefinition({ id: "messages.recipient", target: "messages.recipientInput", instructionKey: "help.messages.note1", titleKey: "help.messages.note1" }),
      "messages.identity": registry.pointerDefinition({ id: "messages.identity", target: "messages.recipientInput", instructionKey: "help.messages.note2", titleKey: "help.messages.note2" }),
      "messages.add-one": registry.pointerDefinition({ id: "messages.add-one", target: "messages.firstDirectAddControl", instructionKey: "help.messages.addOne.instruction", titleKey: "help.messages.addOne.title" }),
      "messages.students": registry.pointerDefinition({ id: "messages.students", target: "messages.classStudentsTab", instructionKey: "help.messages.students.instruction", titleKey: "help.messages.students.title" }),
      "messages.guardians": registry.pointerDefinition({ id: "messages.guardians", target: "messages.classGuardiansTab", instructionKey: "help.messages.guardians.instruction", titleKey: "help.messages.guardians.title" }),
      "messages.information": registry.pointerDefinition({ id: "messages.information", target: "messages.informationButton", instructionKey: "help.messages.information.instruction", titleKey: "help.messages.information.title" }),
      "messages.direct-information": registry.pointerDefinition({ id: "messages.direct-information", target: "messages.directInformationButton", instructionKey: "help.directMessage.information.instruction", titleKey: "help.directMessage.information.title" }),
      "messages.direct-guardian-group": registry.pointerDefinition({ id: "messages.direct-guardian-group", target: "messages.directGuardianGroupChatButton", instructionKey: "help.directMessage.guardianGroup.instruction", titleKey: "help.directMessage.guardianGroup.title" }),
      "messages.create-group": registry.pointerDefinition({ id: "messages.create-group", target: "messages.groupChatButton", instructionKey: "help.messages.createGroup.instruction", titleKey: "help.messages.createGroup.title" }),
      "directory.identity": registry.pointerDefinition({
        id: "directory.identity",
        target: "directory.searchInput",
        instructionKey: "help.directory.note1",
        titleKey: "help.directory.note1",
        autoDismiss: true,
        steps: [
          {
            id: "identity",
            target: "directory.searchInput",
            instructionKey: "help.directory.note1",
            expectedAction: "reminder",
            completeWhen: null
          },
          {
            id: "found-question",
            target: "directory.searchInput",
            instructionKey: "help.directory.foundQuestion",
            expectedAction: "choice",
            completeWhen: null,
            choices: [
              { id: "yes", labelKey: "common.yes", primary: true },
              { id: "no", labelKey: "common.no" }
            ],
            choiceRoutes: { yes: "direct-message", no: "role-review" }
          },
          {
            id: "role-review",
            target: "directory.searchInput",
            instructionKey: "help.directory.roleReview",
            expectedAction: "acknowledge",
            completeWhen: null,
            nextStepId: "found-question",
            actionLabelKey: "common.continue"
          },
          {
            id: "direct-message",
            target: "directory.chatButton",
            instructionKey: "help.directory.directMessage",
            expectedAction: "click",
            completeWhen: "messages.directComposerVisible",
            allowExisting: true
          }
        ]
      }),
    },
    tipDefinitions: {
      "messages.sensitive": registry.tipDefinition({ id: "messages.sensitive", descriptionKey: "help.messages.more2" }),
      "group-information.duplicate-name": registry.tipDefinition({ id: "group-information.duplicate-name", descriptionKey: "help.groupInformation.more1" }),
    },
  });

  hub.messageGuideDefinitions = fragment;
  if (typeof module === "object" && module.exports) module.exports = fragment;
})(globalThis);
