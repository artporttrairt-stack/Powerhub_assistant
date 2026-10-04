(function (root) {
  "use strict";

  const hub = root.PSQM ??= {};
  if (hub.newsfeedGuideDefinitions) return;
  const registry = hub.guideRegistry;
  if (!registry) throw new Error("Guide registry must load before Newsfeed guide definitions.");

  const fallbackKey = "guide.newsfeed.fallback";
  const verification = {
    status: "partially-verified",
    observedOn: "2026-09-07",
    verifiedRole: null,
    environment: "VAS MyPowerHub",
    schoolSourcesVerified: false,
  };
  const step = (id, target, instructionKey, expectedAction, completeWhen, extra = {}) => ({
    id,
    target,
    instructionKey,
    expectedAction,
    completeWhen,
    sourceIds: ["BRIEF-23"],
    risk: "low",
    verification: "observed",
    fallbackKey,
    ...extra,
  });

  const fragment = registry.register("newsfeed", {
    guides: {
      "newsfeed-create": registry.guideDefinition({
        id: "newsfeed-create",
        titleKey: "guide.newsfeed.title",
        descriptionKey: "guide.newsfeed.description",
        status: "pilot",
        available: true,
        verification,
        resources: [],
        steps: [
          step("purpose", null, "guide.newsfeed.purpose", "acknowledge", null, { actionLabelKey: "guide.action.start", sourceIds: ["BRIEF-23", "BRIEF-36"] }),
          step("open-newsfeed", "newsfeed.navigation", "guide.newsfeed.openNewsfeed", "click", "newsfeed.pageVisible", { allowExisting: true }),
          step("new-post", "newsfeed.newPostButton", "guide.newsfeed.newPost", "click", "newsfeed.composerVisible", { allowExisting: true }),
          step("healthy-post", null, "newsfeedReadiness.postHealthBody", "acknowledge", null, {
            actionLabelKey: "newsfeedReadiness.postHealthDismiss",
            presentation: {
              kind: "post-health",
              eyebrowKey: "newsfeedReadiness.postHealthEyebrow",
              titleKey: "newsfeedReadiness.postHealthTitle",
              leadKey: "newsfeedReadiness.postHealthLead",
              bodyKey: "newsfeedReadiness.postHealthBody",
              closingKey: "newsfeedReadiness.postHealthClosing",
            },
          }),
          step("title", "newsfeed.titleInput", "guide.newsfeed.titleInput", "input", "newsfeed.titleEntered", {
            confirmExisting: true,
            completionAction: "click",
            completionTarget: "newsfeed.bodyInput",
          }),
          step("body", "newsfeed.bodyInput", "guide.newsfeed.bodyInput", "input", "newsfeed.bodyEntered", {
            confirmExisting: true,
            completionAction: "click",
            completionTarget: "newsfeed.audienceControl",
          }),
          step("audience-groups", "newsfeed.audienceControl", "guide.newsfeed.audienceGroups", "change", "newsfeed.audienceGroupsSelected", { risk: "audience", allowExisting: true }),
          step("audience-recipients-reminder", "newsfeed.recipientCategoriesGroup", "guide.newsfeed.audienceRecipients", "reminder", null, { risk: "audience", nonBlocking: true, durationMs: 1500, settleOnChange: true }),
          step("preview", "newsfeed.previewButton", "guide.newsfeed.preview", "click", "newsfeed.previewVisible", { allowExisting: true }),
          step("final-check", null, "guide.newsfeed.finalCheck", "checklist", null, {
            requires: "newsfeed.previewVisible",
            returnTo: "preview",
            checklist: ["guide.newsfeed.checkAudience", "guide.newsfeed.checkNames", "guide.newsfeed.checkPrivacy", "guide.newsfeed.checkDuplicate"],
          }),
          step("publish", "newsfeed.publishButton", "guide.newsfeed.publish", "handoff", null, { risk: "publish", requires: "newsfeed.previewVisible", returnTo: "preview", closeOnAction: "click" }),
        ],
      }, 0),
    },
    helpTasks: [
      registry.helpTask({ order: 0, id: "newsfeed-create", contexts: ["newsfeed:feed", "newsfeed:compose"], type: "walkthrough", guideId: "newsfeed-create", titleKey: "guide.newsfeed.title" }),
      registry.helpTask({ order: 4, id: "newsfeed-new-post", contexts: ["newsfeed:feed"], type: "pointer", pointerId: "newsfeed.new-post", titleKey: "help.pointer.newPost" }),
      registry.helpTask({ order: 5, id: "newsfeed-edit-post", contexts: ["newsfeed:feed"], type: "pointer", pointerId: "newsfeed.edit-post", titleKey: "help.newsfeed.editPost.title" }),
      registry.helpTask({ order: 5, id: "newsfeed-discover-navigation", contexts: ["newsfeed:feed"], type: "pointer", pointerId: "newsfeed.discover-navigation", titleKey: "help.newsfeed.discoverNavigation.title" }),
      registry.helpTask({ order: 6, id: "newsfeed-audience", contexts: ["newsfeed:compose"], type: "pointer", pointerId: "newsfeed.audience", titleKey: "help.newsfeed.to.title" }),
      registry.helpTask({ order: 7, id: "newsfeed-recipients", contexts: ["newsfeed:compose"], type: "pointer", pointerId: "newsfeed.recipients", titleKey: "help.newsfeed.recipients.title" }),
      registry.helpTask({ order: 8, id: "newsfeed-preview", contexts: ["newsfeed:compose"], type: "pointer", pointerId: "newsfeed.preview", titleKey: "help.newsfeed.preview.title" }),
      registry.helpTask({ order: 9, id: "newsfeed-privacy", contexts: ["newsfeed:feed", "newsfeed:compose"], type: "tip", tipId: "newsfeed.privacy", titleKey: "help.newsfeed.more1" }),
      registry.helpTask({ order: 10, id: "preview-edit", contexts: ["newsfeed:preview"], type: "pointer", pointerId: "newsfeed.preview.edit", titleKey: "help.preview.note1" }),
      registry.helpTask({ order: 11, id: "preview-post", contexts: ["newsfeed:preview"], type: "pointer", pointerId: "newsfeed.preview.post", titleKey: "help.preview.note2" }),
    ],
    pointerDefinitions: {
      "newsfeed.new-post": registry.pointerDefinition({ id: "newsfeed.new-post", target: "newsfeed.newPostButton", instructionKey: "help.pointer.newPost", titleKey: "help.pointer.newPost" }),
      "newsfeed.edit-post": registry.pointerDefinition({
        id: "newsfeed.edit-post",
        target: null,
        instructionKey: "help.newsfeed.editPost.instruction",
        titleKey: "help.newsfeed.editPost.title",
        steps: [
          { id: "edit-post", target: null, instructionKey: "help.newsfeed.editPost.instruction", expectedAction: "acknowledge" },
        ],
      }),
      "newsfeed.groups": registry.pointerDefinition({ id: "newsfeed.groups", target: "newsfeed.groupsNavigation", instructionKey: "help.newsfeed.groups.instruction", titleKey: "help.newsfeed.groups.title" }),
      "newsfeed.discover-navigation": registry.pointerDefinition({
        id: "newsfeed.discover-navigation",
        target: "directory.navigation",
        instructionKey: "help.newsfeed.discoverNavigation.directory",
        titleKey: "help.newsfeed.discoverNavigation.title",
        steps: [
          { id: "directory", target: "directory.navigation", instructionKey: "help.newsfeed.discoverNavigation.directory", expectedAction: "reminder", nonBlocking: true, manualAdvance: true },
          { id: "groups", target: "newsfeed.groupsNavigation", instructionKey: "help.newsfeed.discoverNavigation.groups", expectedAction: "reminder", nonBlocking: true, manualAdvance: true },
          { id: "powerbuddy-tools", target: "newsfeed.powerBuddyToolsNavigation", instructionKey: "help.newsfeed.discoverNavigation.powerBuddyTools", expectedAction: "reminder", nonBlocking: true, manualAdvance: true },
          { id: "observations", target: "newsfeed.observationsNavigation", instructionKey: "help.newsfeed.discoverNavigation.observations", expectedAction: "reminder", nonBlocking: true, manualAdvance: true },
          { id: "resource-links", target: "newsfeed.resourceLinksNavigation", instructionKey: "help.newsfeed.discoverNavigation.resourceLinks", expectedAction: "reminder", nonBlocking: true, manualAdvance: true },
        ],
      }),
      "newsfeed.audience": registry.pointerDefinition({ id: "newsfeed.audience", target: "newsfeed.audienceControl", instructionKey: "help.newsfeed.to.instruction", titleKey: "help.newsfeed.to.title" }),
      "newsfeed.recipients": registry.pointerDefinition({ id: "newsfeed.recipients", target: "newsfeed.recipientCategoriesGroup", instructionKey: "help.newsfeed.recipients.instruction", titleKey: "help.newsfeed.recipients.title" }),
      "newsfeed.preview": registry.pointerDefinition({ id: "newsfeed.preview", target: "newsfeed.previewButton", instructionKey: "help.newsfeed.preview.instruction", titleKey: "help.newsfeed.preview.title" }),
      "newsfeed.preview.edit": registry.pointerDefinition({ id: "newsfeed.preview.edit", target: "newsfeed.continueEditingButton", instructionKey: "help.preview.note1", titleKey: "help.preview.note1" }),
      "newsfeed.preview.post": registry.pointerDefinition({ id: "newsfeed.preview.post", target: "newsfeed.publishButton", instructionKey: "help.preview.note2", titleKey: "help.preview.note2" }),
    },
    tipDefinitions: {
      "newsfeed.privacy": registry.tipDefinition({ id: "newsfeed.privacy", descriptionKey: "help.newsfeed.more1" }),
    },
  });

  hub.newsfeedGuideDefinitions = fragment;
  if (typeof module === "object" && module.exports) module.exports = fragment;
})(globalThis);
