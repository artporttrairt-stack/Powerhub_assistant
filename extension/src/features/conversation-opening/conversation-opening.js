(function (root) {
  "use strict";

  const hub = root.PSQM ??= {};
  if (hub.conversationOpening) return;

  const EDITOR_ID = "messenger-inbox-message-input-text-field";

  const OPENING_DRAFTS = Object.freeze({
    en: "Hello! This is an automated system message used to start this conversation. No action is required. Thank you.",
    vi: "Xin chào! Đây là tin nhắn tự động từ hệ thống được sử dụng để khởi tạo cuộc trò chuyện. Quý Phụ huynh không cần thực hiện thao tác nào. Xin cảm ơn!"
  });

  let lastChange = null;
  let lastReason = "IDLE";

  function cleanMeaningfulText(value) {
    return String(value ?? "")
      .replace(/[\u200b-\u200d\ufeff]/gu, "")
      .replace(/\u00a0/gu, " ")
      .replace(/\s+/gu, " ")
      .trim();
  }

  function editorText(editor) {
    return String(editor?.textContent ?? "");
  }

  function inspect(editor) {
    if (!editor || typeof editor !== "object") {
      return Object.freeze({ ok: false, reason: "INVALID_EDITOR" });
    }

    if (editor.isConnected !== true) {
      return Object.freeze({ ok: false, reason: "EDITOR_DISCONNECTED" });
    }

    if (String(editor.tagName || "").toUpperCase() !== "DIV") {
      return Object.freeze({ ok: false, reason: "UNEXPECTED_EDITOR_TAG" });
    }

    if (String(editor.id || "") !== EDITOR_ID) {
      return Object.freeze({ ok: false, reason: "UNEXPECTED_EDITOR_ID" });
    }

    if (String(editor.getAttribute?.("role") || "").toLowerCase() !== "textbox") {
      return Object.freeze({ ok: false, reason: "UNEXPECTED_EDITOR_ROLE" });
    }

    if (String(editor.getAttribute?.("contenteditable") || "").toLowerCase() !== "true") {
      return Object.freeze({ ok: false, reason: "NOT_CONTENTEDITABLE" });
    }

    if (editor.isContentEditable !== true) {
      return Object.freeze({ ok: false, reason: "NOT_CONTENTEDITABLE" });
    }

    if (
      editor.disabled === true
      || editor.readOnly === true
      || String(editor.getAttribute?.("aria-disabled") || "").toLowerCase() === "true"
      || String(editor.getAttribute?.("aria-readonly") || "").toLowerCase() === "true"
    ) {
      return Object.freeze({ ok: false, reason: "EDITOR_READ_ONLY" });
    }

    const hasMeaningfulText = cleanMeaningfulText(editorText(editor)).length > 0;

    return Object.freeze({
      ok: true,
      reason: "OK",
      hasMeaningfulText,
      isEmpty: !hasMeaningfulText
    });
  }

  function createInputEvent(editor, { inputType, data }) {
    const view = editor?.ownerDocument?.defaultView || root;
    const InputEventCtor = view?.InputEvent;

    if (typeof InputEventCtor === "function") {
      try {
        return new InputEventCtor("input", {
          bubbles: true,
          composed: true,
          inputType,
          data
        });
      } catch (_) {
        // Fall through to a plain bubbling input event.
      }
    }

    const EventCtor = view?.Event;
    if (typeof EventCtor !== "function") return null;

    try {
      return new EventCtor("input", {
        bubbles: true,
        composed: true
      });
    } catch (_) {
      return null;
    }
  }

  function result(ok, reason, previousText = "", insertedText = "") {
    lastReason = reason;
    return Object.freeze({
      ok: Boolean(ok),
      reason,
      previousText,
      insertedText
    });
  }

  function insert(editor, text) {
    const inspection = inspect(editor);
    if (!inspection.ok) return result(false, inspection.reason);

    if (typeof text !== "string" || cleanMeaningfulText(text).length === 0) {
      return result(false, "INVALID_TEXT");
    }

    const previousText = editorText(editor);

    if (
      lastChange?.editor === editor
      && previousText === lastChange.insertedText
      && text === lastChange.insertedText
    ) {
      return result(false, "ALREADY_INSERTED", previousText, "");
    }

    if (inspection.hasMeaningfulText) {
      return result(false, "EXISTING_DRAFT", previousText, "");
    }

    if (typeof editor.dispatchEvent !== "function") {
      return result(false, "INPUT_EVENT_UNAVAILABLE", previousText, "");
    }

    const inputEvent = createInputEvent(editor, {
      inputType: "insertText",
      data: text
    });

    if (!inputEvent) {
      return result(false, "INPUT_EVENT_UNAVAILABLE", previousText, "");
    }

    try {
      editor.textContent = text;
    } catch (_) {
      return result(false, "UPDATE_FAILED", previousText, "");
    }

    try {
      editor.dispatchEvent(inputEvent);
    } catch (_) {
      try { editor.textContent = previousText; } catch (_) {}
      return result(false, "INPUT_EVENT_FAILED", previousText, "");
    }

    lastChange = {
      editor,
      previousText,
      insertedText: text
    };

    return result(true, "INSERTED", previousText, text);
  }

  function undo(editor) {
    const inspection = inspect(editor);
    if (!inspection.ok) return result(false, inspection.reason);

    if (!lastChange || lastChange.editor !== editor) {
      return result(false, "NOTHING_TO_UNDO");
    }

    const currentText = editorText(editor);

    if (currentText !== lastChange.insertedText) {
      return result(false, "CONTENT_CHANGED", currentText, "");
    }

    if (typeof editor.dispatchEvent !== "function") {
      return result(false, "INPUT_EVENT_UNAVAILABLE", currentText, "");
    }

    const inputEvent = createInputEvent(editor, {
      inputType: "historyUndo",
      data: null
    });

    if (!inputEvent) {
      return result(false, "INPUT_EVENT_UNAVAILABLE", currentText, "");
    }

    const previousText = lastChange.previousText;
    const insertedText = lastChange.insertedText;

    try {
      editor.textContent = previousText;
    } catch (_) {
      return result(false, "UPDATE_FAILED", currentText, "");
    }

    try {
      editor.dispatchEvent(inputEvent);
    } catch (_) {
      try { editor.textContent = insertedText; } catch (_) {}
      return result(false, "INPUT_EVENT_FAILED", currentText, "");
    }

    lastChange = null;
    return result(true, "UNDONE", insertedText, previousText);
  }

  function snapshot() {
    return Object.freeze({
      hasUndo: Boolean(lastChange),
      editorConnected: Boolean(lastChange?.editor?.isConnected),
      lastReason
    });
  }

  hub.conversationOpening = Object.freeze({
    inspect,
    insert,
    undo,
    snapshot,
    drafts: OPENING_DRAFTS
  });

  if (typeof module === "object" && module.exports) {
    module.exports = {
      EDITOR_ID,
      OPENING_DRAFTS,
      cleanMeaningfulText,
      inspect,
      insert,
      undo,
      snapshot
    };
  }
})(globalThis);
