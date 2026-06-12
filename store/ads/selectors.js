import { Platform } from "react-native";
import { isSubscriptionActive, resolveBannerUnitId, shouldShowAds } from "../../utils/ads";

export const selectAdsSettings = (state) => state.ads.settings;
export const selectAdsLoaded = (state) => state.ads.loaded;
export const selectAdsSdkInitialized = (state) => state.ads.sdkInitialized;

export const selectIsSubscriptionActive = (state) =>
  isSubscriptionActive(state.auth.user);

export const selectShouldShowAdsForPlacement = (placement) => (state) =>
  shouldShowAds({
    adsSettings: state.ads.settings,
    placement,
    isSubscriptionActive: isSubscriptionActive(state.auth.user),
    isTV: Platform.isTV,
  });

export const selectBannerAdForPlacement = (placement) => (state) => {
  const visible = shouldShowAds({
    adsSettings: state.ads.settings,
    placement,
    isSubscriptionActive: isSubscriptionActive(state.auth.user),
    isTV: Platform.isTV,
  });

  if (!visible) {
    return { visible: false, unitId: null };
  }

  return {
    visible: true,
    unitId: resolveBannerUnitId(state.ads.settings),
  };
};
