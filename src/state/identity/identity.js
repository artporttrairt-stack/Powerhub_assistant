(function (root) {
  "use strict";
  const hub = root.PSQM ??= {};
  if (hub.identity) return;
  hub.features ??= { identityV2: true, contextualHelp: true, walkthroughs: true, legacyNameFallback: true };

  const PERSON_ID_ATTR = "data-psqm-person-id";
  const modes = Object.freeze(["auto", "native", "legacy-normalized"]);
  const clean = value => String(value ?? "").replace(/\s+/gu, " ").trim();
  const exact = value => clean(value).normalize("NFC").toLowerCase();
  const nativeName = account => String(account?.nativeName ?? account?.name ?? "");
  const studentRoleAliases = new Set(["student", "học sinh"]);
  const guardianRoleAliases = new Set(["guardian", "parent", "student contact", "phụ huynh", "người giám hộ", "liên hệ học sinh", "người liên hệ học sinh"]);
  const staffRoleAliases = new Set(["staff", "teacher", "principal", "coordinator", "administrator", "giáo viên", "nhân viên", "hiệu trưởng", "điều phối viên"]);
  const role = account => {
    const source = exact(account?.role ?? account?.category);
    if (studentRoleAliases.has(source)) return "student";
    if (guardianRoleAliases.has(source)) return "guardian";
    if (staffRoleAliases.has(source)) return "staff";
    return source || "unknown";
  };
  const validText = value => typeof value === "string" && value.length > 0 && value.length <= 240 && !/[\u0000-\u001f]/u.test(value);

  function nameTokenSignature(value) {
    return clean(value).normalize("NFD").replace(/\p{M}/gu, "").replace(/[Đđ]/gu, "d")
      .toLowerCase().split(/\s+/u).filter(Boolean).sort().join("|");
  }

  function stableKey(account) {
    const evidence = account?.identityEvidence;
    // The DOM adapter alone supplies this evidence. No person-ID selector is guessed.
    if (evidence?.verified !== true || !validText(evidence.id) || !validText(evidence.scope)
      || !validText(evidence.source)) return null;
    return `psid:${encodeURIComponent(evidence.scope)}:${encodeURIComponent(role(account))}:${encodeURIComponent(evidence.id)}`;
  }

  function identityKey(account) {
    const persistent = stableKey(account);
    if (persistent) return persistent;
    if (!exact(nativeName(account))) return null;
    // This fallback is a session label, not proof of persistent person identity.
    return `session:${JSON.stringify([role(account), exact(nativeName(account)), exact(account?.contactOf)])}`;
  }

  // The user requested the role rules from the supplied v1.8.13 package.
  // Always derive display from nativeName; never feed the rendered label back in.
  function legacyDisplayName(account) {
    const source = clean(nativeName(account));
    const tokens = source.split(" ").filter(Boolean);
    if (tokens.length < 2) return source;
    const annotation = value => /^\([^)]*\)$/u.test(value) || /^\[[^\]]*\]$/u.test(value);
    if (role(account) === "student") {
      let givenEnd = 1;
      while (givenEnd < tokens.length - 1 && annotation(tokens[givenEnd])) givenEnd += 1;
      return [tokens[tokens.length - 1], ...tokens.slice(givenEnd, -1), ...tokens.slice(0, givenEnd)].join(" ");
    }
    if (role(account) === "guardian") return [tokens[tokens.length - 1], ...tokens.slice(0, -1)].join(" ");
    let familyIndex = 1;
    while (familyIndex < tokens.length && annotation(tokens[familyIndex])) familyIndex += 1;
    if (familyIndex >= tokens.length) return source;
    return [tokens[familyIndex], ...tokens.slice(familyIndex + 1), ...tokens.slice(0, familyIndex)].join(" ");
  }

  function verifiedCanonical(account) {
    const source = nativeName(account);
    const parts = account?.nameParts;
    if (parts?.verified === true && parts.displayOrder === "family-middle-given"
      && validText(parts.familyName) && validText(parts.givenName)
      && (!parts.middleName || validText(parts.middleName))) {
      const canonical = [parts.familyName, parts.middleName, parts.givenName].filter(Boolean).join(" ");
      // Reject components for another person, including added/missing name tokens.
      if (nameTokenSignature(canonical) === nameTokenSignature(source)) {
        return { canonical, confidence: "high" };
      }
    }
    const history = account?.nameHistory;
    if (stableKey(account) && history?.verified === true
      && history.identityKey === stableKey(account)
      && validText(history.nativeName) && validText(history.canonicalName)
      && nameTokenSignature(history.nativeName) === nameTokenSignature(history.canonicalName)) {
      if (exact(source) === exact(history.canonicalName)) return { canonical: source, confidence: "medium" };
      if (exact(source) === exact(history.nativeName)) return { canonical: history.canonicalName, confidence: "medium" };
    }
    // Auto can also reuse an explicitly verified source -> display pair.
    const legacy = account?.legacyNameEvidence;
    if (legacy?.verified === true
      && validText(legacy.nativeName) && validText(legacy.canonicalName)
      && nameTokenSignature(legacy.nativeName) === nameTokenSignature(legacy.canonicalName)) {
      if (exact(source) === exact(legacy.canonicalName)) return { canonical: source, confidence: "medium" };
      if (exact(source) === exact(legacy.nativeName)) return { canonical: legacy.canonicalName, confidence: "medium" };
    }
    return null;
  }

  function resolveDisplayIdentity(account = {}, options = {}) {
    const source = nativeName(account);
    const mode = modes.includes(options.mode) ? options.mode : "auto";
    const verified = mode === "auto" ? verifiedCanonical(account) : null;
    const compatibility = mode === "legacy-normalized"
      || (mode === "auto" && !verified && ["student", "guardian", "staff"].includes(role(account)));
    const canonical = verified?.canonical || (compatibility ? legacyDisplayName(account) : source);
    return {
      personId: stableKey(account) ? account.identityEvidence.id : null,
      identityKey: identityKey(account), role: role(account), nativeName: source,
      canonicalName: canonical, displayName: canonical,
      aliases: [...new Set([source, canonical].filter(Boolean))],
      nameState: verified || compatibility ? (exact(canonical) === exact(source) ? "native" : "normalized") : mode === "native" ? "native" : "unknown",
      confidence: verified?.confidence || (mode === "native" ? "high" : "low")
    };
  }

  hub.identity = Object.freeze({ PERSON_ID_ATTR, modes, clean, exact, nativeName, role,
    nameTokenSignature, stableKey, identityKey, legacyDisplayName, resolveDisplayIdentity });
  if (typeof module === "object" && module.exports) module.exports = hub.identity;
})(globalThis);
