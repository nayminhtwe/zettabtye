export function normalizePhone(phone) {
  return (phone || "").replace(/\D/g, "");
}

const PHONE_FORMAT_BY_COUNTRY = {
  // 09XXXXXXXX(X)  — local with 0      (10-11 digits)
  // 959XXXXXXXX(X) — international no + (11-12 digits)
  // 9XXXXXXXX(X)   — local without 0   (9-10 digits)
  MM: (digits) =>
    /^09\d{8,9}$/.test(digits) ||
    /^959\d{7,9}$/.test(digits) ||
    /^9\d{8,9}$/.test(digits),

  // 0[689]XXXXXXXX  — local with 0      (10 digits)
  // 66[689]XXXXXXXX — international no + (11 digits)
  // [689]XXXXXXXX   — local without 0   (9 digits)
  TH: (digits) =>
    /^0[689]\d{8}$/.test(digits) ||
    /^66[689]\d{8}$/.test(digits) ||
    /^[689]\d{8}$/.test(digits),

  // 01XXXXXXXX(X)  — local with 0      (10-11 digits)
  // 601XXXXXXXX(X) — international no + (11-12 digits)
  // 1XXXXXXXX(X)   — local without 0   (9-10 digits)
  MY: (digits) =>
    /^01\d{8,9}$/.test(digits) ||
    /^601\d{7,9}$/.test(digits) ||
    /^1\d{8,9}$/.test(digits),
};

/**
 * Normalize to international format expected by the Laravel API (+959..., +66..., +60...).
 * Uses countryId to disambiguate numbers that lack a clear international prefix.
 */
export function formatPhoneForApi(phone, countryId = "MM") {
  const trimmed = (phone || "").trim();
  if (!trimmed) return null;

  // Already has + prefix — extract known country code and return canonical form
  if (trimmed.startsWith("+")) {
    const digits = normalizePhone(trimmed.slice(1));
    if (digits.startsWith("959")) return `+959${digits.slice(3)}`;
    if (digits.startsWith("66"))  return `+66${digits.slice(2)}`;
    if (digits.startsWith("60"))  return `+60${digits.slice(2)}`;
    return trimmed;
  }

  const digits = normalizePhone(trimmed);

  // ── Unambiguous international prefixes (no countryId needed) ───────────────

  if (digits.startsWith("959")) return `+959${digits.slice(3)}`;
  if (digits.startsWith("66"))  return `+66${digits.slice(2)}`;
  if (digits.startsWith("601")) return `+60${digits.slice(2)}`;
  if (digits.startsWith("60"))  return `+60${digits.slice(2)}`;

  // ── Country-specific local formats ─────────────────────────────────────────
  // These are checked using countryId so that e.g. a Thai "9..." number
  // is not mistaken for a Myanmar "9..." number.

  if (countryId === "MM") {
    // 09XXXXXXXX(X) → +959XXXXXXXX(X)
    if (/^09\d{8,9}$/.test(digits)) return `+959${digits.slice(2)}`;
    // 9XXXXXXXX(X) (without leading 0) → +959XXXXXXXX(X)
    if (/^9\d{8,9}$/.test(digits))   return `+959${digits.slice(1)}`;
  }

  if (countryId === "TH") {
    // 0[689]XXXXXXXX → +66[689]XXXXXXXX
    if (/^0[689]\d{8}$/.test(digits)) return `+66${digits.slice(1)}`;
    // [689]XXXXXXXX (without leading 0) → +66[689]XXXXXXXX
    if (/^[689]\d{8}$/.test(digits))  return `+66${digits}`;
  }

  if (countryId === "MY") {
    // 01XXXXXXXX(X) → +601XXXXXXXX(X)
    if (/^01\d{8,9}$/.test(digits)) return `+60${digits.slice(1)}`;
    // 1XXXXXXXX(X) (without leading 0) → +601XXXXXXXX(X)
    if (/^1\d{8,9}$/.test(digits))  return `+60${digits}`;
  }

  return null;
}

export function getPhoneValidationError(phone, countryId) {
  const digits = normalizePhone(phone);

  if (!digits) {
    return "Please enter your phone number";
  }

  const matchesCountry = PHONE_FORMAT_BY_COUNTRY[countryId];
  if (!matchesCountry?.(digits)) {
    return "Phone number does not match the selected country";
  }

  if (!formatPhoneForApi(phone, countryId)) {
    return "Phone number does not match the selected country";
  }

  return "";
}

export function maskPhone(phone) {
  if (!phone) return "";
  const formatted = phone.startsWith("+") ? phone : formatPhoneForApi(phone, "MM");
  return formatted || phone;
}
