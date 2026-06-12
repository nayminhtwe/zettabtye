import apiClient from "./client";

export async function fetchAppSettings() {
  const response = await apiClient.get("/app-settings");
  return response.data;
}

export function parseAdsSettings(payload) {
  const ads = payload?.data?.ads ?? payload?.ads ?? null;

  if (!ads || typeof ads !== "object") {
    return null;
  }

  return {
    enabled: Boolean(ads.enabled),
    audience: ads.audience ?? "non_subscribers",
    placements: {
      home: Boolean(ads.placements?.home),
      movies: Boolean(ads.placements?.movies),
      series: Boolean(ads.placements?.series),
      football: Boolean(ads.placements?.football),
      movie_detail: Boolean(ads.placements?.movie_detail),
      series_detail: Boolean(ads.placements?.series_detail),
      football_detail: Boolean(ads.placements?.football_detail),
      player: Boolean(ads.placements?.player),
    },
    android: {
      bannerUnitId: ads.android?.banner_unit_id ?? "",
    },
    ios: {
      bannerUnitId: ads.ios?.banner_unit_id ?? "",
    },
  };
}

function parseSupportSettings(payload) {
  const contacts = payload?.data?.support?.contacts ?? payload?.support?.contacts ?? {};

  return {
    contacts: {
      viber: {
        label: contacts.viber?.label ?? "",
        action: contacts.viber?.action ?? "",
      },
      facebook: {
        label: contacts.facebook?.label ?? "",
        action: contacts.facebook?.action ?? "",
      },
      telegram: {
        label: contacts.telegram?.label ?? "",
        action: contacts.telegram?.action ?? "",
      },
      messenger: {
        label: contacts.messenger?.label ?? "",
        action: contacts.messenger?.action ?? "",
      },
      website: {
        label: contacts.website?.label ?? "",
        action: contacts.website?.action ?? "",
      },
    },
  };
}

function parseSubscriptionSettings(payload) {
  const subscription = payload?.data?.subscription ?? payload?.subscription ?? {};

  return {
    priceMmk: subscription.price_mmk ?? "3,000",
    priceThb: subscription.price_thb ?? "30",
  };
}

function parseFeatureSettings(payload) {
  const features = payload?.data?.features ?? payload?.features ?? {};

  return {
    footballForNonSubscribers: features.football_for_non_subscribers !== false,
  };
}

export function parseAppSettings(payload) {
  return {
    ads: parseAdsSettings(payload),
    support: parseSupportSettings(payload),
    subscription: parseSubscriptionSettings(payload),
    features: parseFeatureSettings(payload),
  };
}
