import { Platform } from "react-native";
import { isSubscriptionActive, resolveBannerUnitId, shouldShowAds } from "../../utils/ads";
import { parseSupportContacts } from "../../utils/appSettings";

export const selectAppSettings = (state) => state.ads.settings;
export const selectAdsSettings = (state) => state.ads.settings?.ads ?? null;
export const selectAdsLoaded = (state) => state.ads.loaded;
export const selectAdsSdkInitialized = (state) => state.ads.sdkInitialized;

export const selectIsSubscriptionActive = (state) =>
  isSubscriptionActive(state.auth.user);

export const selectSupportContacts = (state) =>
  parseSupportContacts(state.ads.settings?.support?.contacts);

export const selectSubscriptionPricing = (state) =>
  state.ads.settings?.subscription ?? { priceMmk: "3,000", priceThb: "30" };

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

export const selectShouldShowAdsForPlacement = (placement) => (state) =>
  shouldShowAds({
    adsSettings: selectAdsSettings(state),
    placement,
    isSubscriptionActive: selectIsSubscriptionActive(state),
    isTV: Platform.isTV,
  });

export const selectBannerAdForPlacement = (placement) => (state) => {
  const visible = shouldShowAds({
    adsSettings: selectAdsSettings(state),
    placement,
    isSubscriptionActive: selectIsSubscriptionActive(state),
    isTV: Platform.isTV,
  });

  if (!visible) {
    return { visible: false, unitId: null };
  }

  return {
    visible: true,
    unitId: resolveBannerUnitId(selectAdsSettings(state)),
  };
};
