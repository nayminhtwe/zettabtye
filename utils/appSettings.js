export const SUPPORT_CONTACT_ORDER = [
  "viber",
  "facebook",
  "telegram",
  "messenger",
  "website",
];

function normalizePhoneDigits(label) {
  const phone = String(label ?? "").replace(/[^\d+]/g, "");
  if (!phone) {
    return "";
  }

  return phone.replace(/^\+/, "");
}

export function resolveContactAction(id, label, action) {
  const trimmedAction = String(action ?? "").trim();
  if (trimmedAction) {
    return trimmedAction;
  }

  const digits = normalizePhoneDigits(label);
  if (!digits) {
    return "";
  }

  switch (id) {
    case "viber":
      return `viber://chat?number=${digits}`;
    case "telegram":
      return `tg://resolve?phone=${digits}`;
    default:
      return "";
  }
}

export function parseSupportContacts(contacts = {}) {
  return SUPPORT_CONTACT_ORDER.map((id) => {
    const contact = contacts[id] ?? {};
    const label = String(contact.label ?? "").trim();

    if (!label) {
      return null;
    }

    return {
      id,
      label,
      action: resolveContactAction(id, label, contact.action),
    };
  }).filter(Boolean);
}

export function formatMembershipButtonText(pricing, isSubscriptionActive = false) {
  const priceMmk = pricing?.priceMmk || "3,000";
  const priceThb = pricing?.priceThb || "30";
  const action = isSubscriptionActive ? "Extend" : "Upgrade to";

  return `${action} Pro, only ${priceMmk} mmk or ${priceThb} THB Monthly`;
}

/** @deprecated Use formatMembershipButtonText */
export function formatUpgradeButtonText(pricing) {
  return formatMembershipButtonText(pricing, false);
}

export function canAccessFootball({ features, isSubscriptionActive }) {
  if (isSubscriptionActive) {
    return true;
  }

  if (!features) {
    return true;
  }

  return features.footballForNonSubscribers !== false;
}
