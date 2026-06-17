import apiClient from "./client";

export async function fetchAppSettings() {
  const response = await apiClient.get("/app-settings");
  return response.data;
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
    support: parseSupportSettings(payload),
    subscription: parseSubscriptionSettings(payload),
    features: parseFeatureSettings(payload),
  };
}
