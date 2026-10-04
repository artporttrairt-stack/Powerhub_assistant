(function (root) {
  "use strict";

  const hub = root.PSQM ??= {};
  if (hub.guardianStudentRelations) return;

  const TOKEN_PATTERN = /^[A-Za-z0-9_-]{26}$/u;
  const TABLE_SELECTOR = "table.messenger-inbox__user-selection-table";
  const CHILD_ROW_CLASS = "messenger-inbox__child-row";
  const EXPAND_SELECTOR = "button.messenger-inbox__expand-button";
  const TOKEN_HOST_SELECTOR = '[id^="add-user-"]';
  const EVIDENCE = "vas-create-group-contiguous-child-v1";

  function clean(value) {
    return String(value ?? "").normalize("NFC").replace(/\s+/gu, " ").trim();
  }

  function exactNameKey(value) {
    return clean(value).toLowerCase();
  }

  function role(value) {
    return clean(value).toLowerCase();
  }

  function validToken(value) {
    return TOKEN_PATTERN.test(String(value ?? ""));
  }

  function extractNativeToken(row) {
    if (!row?.querySelectorAll) return null;
    const hosts = Array.from(row.querySelectorAll(TOKEN_HOST_SELECTOR));
    if (hosts.length !== 1) return null;

    const host = hosts[0];
    const hostId = String(host?.id || "");
    if (!hostId.startsWith("add-user-")) return null;

    const token = hostId.slice("add-user-".length);
    if (!validToken(token)) return null;

    const expectedButtonId = `button-add-user-${token}`;
    const internal = host.querySelector?.(`#${expectedButtonId}`);
    if (!internal || String(internal.id || "") !== expectedButtonId) return null;

    return token;
  }

  function guardianConversationDisplayName(account, {
    resolveStudentForGuardian,
    displayName = value => clean(value?.name)
  } = {}) {
    const guardianDisplay = clean(displayName(account));
    if (role(account?.category) !== "guardian" || typeof resolveStudentForGuardian !== "function") {
      return guardianDisplay;
    }
    const studentAccount = resolveStudentForGuardian(account)?.studentAccount;
    if (!studentAccount) return guardianDisplay;
    const studentDisplay = clean(displayName(studentAccount));
    return studentDisplay ? `${guardianDisplay} - ${studentDisplay}` : guardianDisplay;
  }

  function createRelationStore({ now = () => Date.now() } = {}) {
    const guardianToStudents = new Map();
    const guardianNameTokens = new Map();
    const guardianTokenNames = new Map();
    const studentSnapshots = new Map();

    function reindexGuardianName(guardianToken, nativeName) {
      const nextKey = exactNameKey(nativeName);
      const previousKey = guardianTokenNames.get(guardianToken) || "";

      if (previousKey && previousKey !== nextKey) {
        const previousSet = guardianNameTokens.get(previousKey);
        previousSet?.delete(guardianToken);
        if (previousSet?.size === 0) guardianNameTokens.delete(previousKey);
      }

      if (!nextKey) {
        guardianTokenNames.delete(guardianToken);
        return;
      }

      guardianTokenNames.set(guardianToken, nextKey);
      let tokens = guardianNameTokens.get(nextKey);
      if (!tokens) {
        tokens = new Set();
        guardianNameTokens.set(nextKey, tokens);
      }
      tokens.add(guardianToken);
    }

    function merge({
      studentToken,
      studentAccount,
      guardianToken,
      guardianAccount
    } = {}) {
      if (!validToken(studentToken) || !validToken(guardianToken) || studentToken === guardianToken) {
        return Object.freeze({ added: false, reason: "INVALID_TOKEN" });
      }
      if (role(studentAccount?.category) !== "student" || role(guardianAccount?.category) !== "guardian") {
        return Object.freeze({ added: false, reason: "ROLE_MISMATCH" });
      }

      const studentNativeName = clean(studentAccount?.name);
      const guardianNativeName = clean(guardianAccount?.name);
      if (!studentNativeName || !guardianNativeName) {
        return Object.freeze({ added: false, reason: "MISSING_NATIVE_NAME" });
      }

      const capturedAt = Number(now());
      studentSnapshots.set(studentToken, {
        account: Object.freeze({
          ...studentAccount,
          name: studentNativeName,
          category: "student"
        }),
        capturedAt: Number.isFinite(capturedAt) ? capturedAt : 0
      });
      reindexGuardianName(guardianToken, guardianNativeName);

      let studentTokens = guardianToStudents.get(guardianToken);
      if (!studentTokens) {
        studentTokens = new Set();
        guardianToStudents.set(guardianToken, studentTokens);
      }

      const before = studentTokens.size;
      studentTokens.add(studentToken);
      return Object.freeze({
        added: studentTokens.size !== before,
        reason: studentTokens.size !== before ? "ADDED" : "KNOWN",
        evidence: EVIDENCE
      });
    }

    function resolveStudentForGuardian(guardianAccount, { guardianToken = "" } = {}) {
      if (role(guardianAccount?.category) !== "guardian") return null;

      let token = validToken(guardianToken) ? guardianToken : "";
      let matchedBy = token ? "token" : "";

      if (!token) {
        const nameKey = exactNameKey(guardianAccount?.name);
        if (!nameKey) return null;
        const tokens = guardianNameTokens.get(nameKey);
        if (!tokens || tokens.size !== 1) return null;
        token = tokens.values().next().value;
        matchedBy = "exact-native-name";
      }

      const students = guardianToStudents.get(token);
      if (!students || students.size !== 1) return null;

      const studentToken = students.values().next().value;
      const snapshot = studentSnapshots.get(studentToken);
      if (!snapshot?.account || !Number.isFinite(snapshot.capturedAt)) return null;

      return Object.freeze({
        guardianToken: token,
        studentToken,
        studentAccount: snapshot.account,
        matchedBy,
        evidence: EVIDENCE
      });
    }

    function captureRows(rows, accountFromRow) {
      if (!Array.isArray(rows) || typeof accountFromRow !== "function") {
        return Object.freeze({ added: 0, known: 0, skipped: 0 });
      }

      let parent = null;
      let added = 0;
      let known = 0;
      let skipped = 0;

      for (const row of rows) {
        const isChild = Boolean(row?.classList?.contains?.(CHILD_ROW_CLASS));

        if (!isChild) {
          parent = null;
          const expand = row?.querySelector?.(EXPAND_SELECTOR);
          if (!expand) {
            skipped += 1;
            continue;
          }

          const account = accountFromRow(row);
          const token = extractNativeToken(row);
          if (role(account?.category) !== "student" || !validToken(token)) {
            skipped += 1;
            continue;
          }

          parent = { account, token };
          continue;
        }

        if (!parent) {
          skipped += 1;
          continue;
        }

        const guardianAccount = accountFromRow(row);
        const guardianToken = extractNativeToken(row);
        if (
          role(guardianAccount?.category) !== "guardian"
          || !validToken(guardianToken)
          || guardianToken === parent.token
        ) {
          skipped += 1;
          continue;
        }

        const result = merge({
          studentToken: parent.token,
          studentAccount: parent.account,
          guardianToken,
          guardianAccount
        });
        if (result.added) added += 1;
        else if (result.reason === "KNOWN") known += 1;
        else skipped += 1;
      }

      return Object.freeze({ added, known, skipped });
    }

    function capture(dialog, sourceRoot, accountFromRow) {
      if (!dialog?.isConnected || typeof accountFromRow !== "function") {
        return Object.freeze({ added: 0, known: 0, skipped: 0, tables: 0 });
      }
      if (String(dialog.getAttribute?.("role") || "").toLowerCase() !== "dialog") {
        return Object.freeze({ added: 0, known: 0, skipped: 0, tables: 0 });
      }

      const scope = sourceRoot && dialog.contains?.(sourceRoot) ? sourceRoot : dialog;
      const tables = Array.from(scope.querySelectorAll?.(TABLE_SELECTOR) || [])
        .filter(table => dialog.contains?.(table));
      if (tables.length !== 1) {
        return Object.freeze({ added: 0, known: 0, skipped: 0, tables: tables.length });
      }

      let added = 0;
      let known = 0;
      let skipped = 0;
      const table = tables[0];
      const bodies = Array.from(table.tBodies || []);
      for (const body of bodies) {
        const rows = Array.from(body.children || [])
          .filter(row => String(row?.tagName || "").toUpperCase() === "TR");
        const result = captureRows(rows, accountFromRow);
        added += result.added;
        known += result.known;
        skipped += result.skipped;
      }

      return Object.freeze({ added, known, skipped, tables: 1 });
    }

    function reset() {
      guardianToStudents.clear();
      guardianNameTokens.clear();
      guardianTokenNames.clear();
      studentSnapshots.clear();
    }

    function snapshot() {
      let edgeCount = 0;
      for (const students of guardianToStudents.values()) edgeCount += students.size;
      return Object.freeze({
        guardianCount: guardianToStudents.size,
        studentSnapshotCount: studentSnapshots.size,
        edgeCount
      });
    }

    return Object.freeze({
      capture,
      captureRows,
      merge,
      resolveStudentForGuardian,
      reset,
      snapshot
    });
  }

  const store = createRelationStore();

  hub.guardianStudentRelations = Object.freeze({
    capture: store.capture,
    resolveStudentForGuardian: store.resolveStudentForGuardian,
    conversationDisplayName: (account, displayName) => guardianConversationDisplayName(account, {
      resolveStudentForGuardian: store.resolveStudentForGuardian,
      displayName
    }),
    reset: store.reset,
    snapshot: store.snapshot
  });

  if (typeof module === "object" && module.exports) {
    module.exports = {
      TOKEN_PATTERN,
      TABLE_SELECTOR,
      CHILD_ROW_CLASS,
      EXPAND_SELECTOR,
      EVIDENCE,
      clean,
      exactNameKey,
      validToken,
      extractNativeToken,
      guardianConversationDisplayName,
      createRelationStore
    };
  }
})(globalThis);
