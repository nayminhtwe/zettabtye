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
