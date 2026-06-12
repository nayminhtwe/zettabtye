export const SUPPORT_CONTACT_ORDER = [
  "viber",
  "facebook",
  "telegram",
  "messenger",
  "website",
];

export function parseSupportContacts(contacts = {}) {
  return SUPPORT_CONTACT_ORDER.map((id) => {
    const contact = contacts[id] ?? {};
    const label = String(contact.label ?? "").trim();
    const action = String(contact.action ?? "").trim();

    if (!label || !action) {
      return null;
    }

    return { id, label, action };
  }).filter(Boolean);
}

export function formatUpgradeButtonText(pricing) {
  const priceMmk = pricing?.priceMmk || "3,000";
  const priceThb = pricing?.priceThb || "30";
  return `Upgrade to Pro, only ${priceMmk} mmk or ${priceThb} THB Monthly`;
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
