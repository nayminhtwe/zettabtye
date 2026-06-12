import { Platform } from "react-native";

export function isSubscriptionActive(user) {
  const endDate = user?.subscription_end_date;
  if (!endDate) {
    return false;
  }

  const expiresAt = new Date(endDate).getTime();
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export function resolveBannerUnitId(adsSettings) {
  if (!adsSettings) {
    return null;
  }

  const unitId =
    Platform.OS === "ios"
      ? adsSettings.ios?.bannerUnitId
      : adsSettings.android?.bannerUnitId;

  if (typeof unitId === "string" && unitId.trim().length > 0) {
    return unitId.trim();
  }

  return null;
}

export function shouldShowAds({
  adsSettings,
  placement,
  isSubscriptionActive: subscriptionActive = false,
  isTV = Platform.isTV,
}) {
  if (!adsSettings?.enabled) {
    return false;
  }

  if (isTV) {
    return false;
  }

  if (placement === "player") {
    return false;
  }

  if (!adsSettings.placements?.[placement]) {
    return false;
  }

  if (adsSettings.audience === "non_subscribers" && subscriptionActive) {
    return false;
  }

  return Boolean(resolveBannerUnitId(adsSettings));
}
