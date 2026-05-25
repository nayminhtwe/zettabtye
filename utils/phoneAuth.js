/**
 * Dummy phone numbers for local testing until the API is available.
 * - NEW_USER: first-time signup → OTP screen
 * - EXISTING_USER: returning user → password screen
 */
export const DUMMY_PHONES = {
  NEW_USER: "09123456789",
  EXISTING_USER: "09987654321",
};

const EXISTING_USER_PHONES = new Set(
  [DUMMY_PHONES.EXISTING_USER].map((phone) => normalizePhone(phone))
);

export function normalizePhone(phone) {
  return (phone || "").replace(/\D/g, "");
}

const PHONE_FORMAT_BY_COUNTRY = {
  MM: (digits) => /^09\d{8,9}$/.test(digits) || /^959\d{7,8}$/.test(digits),
  TH: (digits) => /^0[689]\d{8}$/.test(digits) || /^66[689]\d{8}$/.test(digits),
  MY: (digits) => /^01\d{8,9}$/.test(digits) || /^601\d{7,8}$/.test(digits),
};

export function getPhoneValidationError(phone, countryId) {
  const digits = normalizePhone(phone);

  if (!digits) {
    return "Please enter your phone number";
  }

  const matchesCountry = PHONE_FORMAT_BY_COUNTRY[countryId];
  if (!matchesCountry?.(digits)) {
    return "Phone number does not match the selected country";
  }

  return "";
}

export function maskPhone(phone) {
  if (!phone) {
    return "+95987654321";
  }

  const digits = normalizePhone(phone);
  if (!digits) {
    return "+95987654321";
  }

  if (digits.startsWith("09")) {
    return `+95${digits.slice(1)}`;
  }

  if (digits.startsWith("95")) {
    return `+${digits}`;
  }

  return `+95${digits}`;
}

export function isFirstTimeUser(phone) {
  const digits = normalizePhone(phone);
  if (!digits) {
    return true;
  }

  return !EXISTING_USER_PHONES.has(digits);
}
