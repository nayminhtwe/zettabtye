import { Platform } from "react-native";
import { isSubscriptionActive, resolveBannerUnitId, shouldShowAds } from "../../utils/ads";
import { parseSupportContacts } from "../../utils/appSettings";

export const selectAppSettings = (state) => state.ads.settings;
export const selectAdsSettings = (state) => state.ads.settings?.ads ?? null;
export const selectAdsLoaded = (state) => state.ads.loaded;
export const selectAdsSdkInitialized = (state) => state.ads.sdkInitialized;

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

const shouldShowAdsSelectorByPlacement = new Map();
const bannerUnitIdSelectorByPlacement = new Map();

export const selectShouldShowAdsForPlacement = (placement) => {
  if (!shouldShowAdsSelectorByPlacement.has(placement)) {
    shouldShowAdsSelectorByPlacement.set(placement, (state) =>
      shouldShowAds({
        adsSettings: selectAdsSettings(state),
        placement,
        isSubscriptionActive: selectIsSubscriptionActive(state),
        isTV: Platform.isTV,
      }),
    );
  }

  return shouldShowAdsSelectorByPlacement.get(placement);
};

export const selectBannerUnitIdForPlacement = (placement) => {
  if (!bannerUnitIdSelectorByPlacement.has(placement)) {
    bannerUnitIdSelectorByPlacement.set(placement, (state) => {
      const visible = selectShouldShowAdsForPlacement(placement)(state);
      if (!visible) {
        return null;
      }

      return resolveBannerUnitId(selectAdsSettings(state));
    });
  }

  return bannerUnitIdSelectorByPlacement.get(placement);
};
