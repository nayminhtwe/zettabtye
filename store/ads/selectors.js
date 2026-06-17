import { isSubscriptionActive } from "../../utils/ads";
import { parseSupportContacts } from "../../utils/appSettings";

export const selectAppSettings = (state) => state.ads.settings;

export const selectIsSubscriptionActive = (state) =>
  isSubscriptionActive(state.auth.user);

const EMPTY_SUPPORT_CONTACTS = Object.freeze([]);
const DEFAULT_SUBSCRIPTION_PRICING = Object.freeze({
  priceMmk: "3,000",
  priceThb: "30",
});

let cachedSupportContactsSource = null;
let cachedSupportContacts = EMPTY_SUPPORT_CONTACTS;

export const selectSupportContacts = (state) => {
  const source = state.ads.settings?.support?.contacts;

  if (source === cachedSupportContactsSource) {
    return cachedSupportContacts;
  }

  cachedSupportContactsSource = source;
  const parsed = parseSupportContacts(source);

  if (parsed.length === 0) {
    cachedSupportContacts = EMPTY_SUPPORT_CONTACTS;
    return cachedSupportContacts;
  }

  cachedSupportContacts = Object.freeze(
    parsed.map((contact) => Object.freeze({ ...contact })),
  );
  return cachedSupportContacts;
};

export const selectSubscriptionPricing = (state) =>
  state.ads.settings?.subscription ?? DEFAULT_SUBSCRIPTION_PRICING;

export const selectAppFeatures = (state) =>
  state.ads.settings?.features ?? { footballForNonSubscribers: true };

export const selectCanAccessFootball = (state) => {
  const features = selectAppFeatures(state);
  const subscriptionActive = selectIsSubscriptionActive(state);

  if (subscriptionActive) {
    return true;
  }

  return features.footballForNonSubscribers !== false;
};
