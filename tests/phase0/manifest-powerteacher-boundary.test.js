'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../extension/manifest.json'), 'utf8'));
const expectedPowerHub = {
  matches: ['https://vas.educator.powerschool.com/*'],
  js: [
    'src/platform/browser/i18n.js',
    'src/features/language-intro/language-intro-copy.js',
    'src/features/language-intro/language-intro-presenter.js',
    'src/features/language-intro/language-intro-state.js',
    'src/features/language-intro/language-intro-controller.js',
    'src/features/language-intro/language-intro-core.js',
    'src/platform/powerhub/language-intro-hub-adapter.js',
    'src/features/language-intro/language-intro.js',
    'src/features/onboarding/onboarding-progress.js',
    'src/features/wait-chatter/wait-chatter.js',
    'src/features/session-timeout/session-timeout-keeper.js',
    'src/state/identity/identity.js',
    'src/features/message-mode-default/message-mode-default.js',
    'src/platform/powerhub/hub-ui-adapter.js',
    'src/features/guidance/guide-registry.js',
    'src/features/guidance/guides/newsfeed-guides.js',
    'src/features/guidance/guides/message-guides.js',
    'src/features/guidance/guides/group-chat-guides.js',
    'src/features/walkthrough/walkthrough.js',
    'src/features/conversation-opening/conversation-opening.js',
    'src/features/message-information/message-information-pane-guide.js',
    'src/features/message-onboarding/message-onboarding.js',
    'src/features/contextual-help/context-help.js',
    'src/features/newsfeed/newsfeed-readiness.js',
    'src/features/communication-language-warning/communication-language-warning.js',
    'src/state/relations/guardian-student-relations.js',
    'src/core/runtime/content-runtime.js',
    'src/core/bootstrap/content.js'
  ],
  css: [
    'src/features/language-intro/robot-presenter.css',
    'src/features/language-intro/language-intro.css',
    'src/core/runtime/content-runtime.css',
    'src/features/walkthrough/guide.css',
    'src/features/message-mode-default/message-mode-default.css',
    'src/features/newsfeed/newsfeed-readiness.css',
    'src/features/communication-language-warning/communication-language-warning.css',
    'src/features/message-onboarding/message-onboarding.css',
    'src/features/message-information/message-information-pane-guide.css'
  ],
  run_at: 'document_idle'
};
const expectedPowerTeacherJs = [
  'src/platform/powerteacher/teacher-context.js',
  'src/features/teacher-support/guidance/pack-registry.js',
  'src/features/teacher-support/guidance-packs/cam-primary/ms1/applicability.js',
  'src/features/teacher-support/guidance-packs/cam-primary/ms1/sources.js',
  'src/features/teacher-support/guidance-packs/cam-primary/ms1/pack.js',
  'src/features/teacher-support/runtime/support-lifecycle.js',
  'src/core/bootstrap/teacher-support-content.js'
];

test('manifest keeps exact PowerHub boundary and adds one isolated PowerTeacher boundary', () => {
  assert.deepEqual(manifest.permissions, ['storage']);
  assert.ok(manifest.host_permissions.includes('https://vas.educator.powerschool.com/*'));
  assert.ok(manifest.host_permissions.includes('https://vas.powerschool.com/teachers/*'));
  assert.equal(manifest.host_permissions.includes('<all_urls>'), false);
  assert.deepEqual(manifest.content_scripts[0], expectedPowerHub);
  const teacher = manifest.content_scripts.filter((entry) => entry.matches?.includes('https://vas.powerschool.com/teachers/*'));
  assert.equal(teacher.length, 1);
  assert.deepEqual(teacher[0].js, expectedPowerTeacherJs);
  assert.equal('css' in teacher[0], false);
  assert.equal(teacher[0].run_at, 'document_idle');
  assert.equal(teacher[0].js.some((p) => p.includes('background') || p.includes('/popup/')), false);
  assert.deepEqual(manifest.web_accessible_resources, [{ resources: ['assets/robot-assistant.png'], matches: ['https://vas.educator.powerschool.com/*'] }]);
});

test('Teacher Support bootstrap only starts dormant lifecycle', () => {
  const src = fs.readFileSync(path.resolve(__dirname, '../../extension/src/core/bootstrap/teacher-support-content.js'), 'utf8').trim();
  assert.equal(src, 'globalThis.PSQM.teacherSupportLifecycle.start();');
});
