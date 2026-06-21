import { extractItemData, mapSeriesDetail } from "../api/mappers";
import { fetchSeriesById } from "../api/contentService";
import { parsePlaybackBlock, subscriptionRequiredBlock } from "./playback";

export function buildSeriesDetail(item = {}) {
  return {
    id: item.id ?? null,
    title: item.title ?? "",
    image: item.image ?? null,
    categories: item.categories ?? "",
    imdbRating: item.imdb?.replace("/10", "") || item.imdbRating || "",
    seasons: item.seasons ?? "",
    year: item.year ?? "",
    overview: item.overview ?? "",
    director: item.director ?? "",
    cast: item.cast ?? "",
    seasonsList: item.seasonsList ?? [],
  };
}

function findFirstPlayableEpisode(series) {
  for (const season of series?.seasonsList ?? []) {
    for (const episode of season.episodes ?? []) {
      if (episode.episodeUrl) {
        return episode;
      }
    }
  }

  return null;
}

export function buildSeriesPlayItem(series, episode) {
  const firstEpisode = episode ?? findFirstPlayableEpisode(series);

  return {
    id: firstEpisode?.id ?? series?.id ?? null,
    title: firstEpisode?.title ?? series?.title ?? "",
    image: firstEpisode?.thumbnail ?? series?.image ?? null,
    categories: series?.categories ?? "",
    year: series?.year ?? "",
    duration: firstEpisode?.duration ?? "",
    imdbRating: series?.imdbRating ?? "",
    movieUrl: firstEpisode?.episodeUrl ?? null,
    type: "series",
  };
}

/**
 * Series list endpoints never include episode_url — fetch detail and pick the
 * first episode that has a stream URL (only returned for active subscribers).
 */
export async function resolveSeriesPlayItem(item = {}, cachedDetail = null) {
  let series = buildSeriesDetail(cachedDetail ?? item);
  let playItem = buildSeriesPlayItem(series);

  if (playItem.movieUrl) {
    return { playItem, series, blocked: null };
  }

  const seriesId = series.id ?? item?.id;
  if (!seriesId) {
    return { playItem, series, blocked: subscriptionRequiredBlock() };
  }

  try {
    const response = await fetchSeriesById(seriesId);
    series = buildSeriesDetail(mapSeriesDetail(extractItemData(response)));
    playItem = buildSeriesPlayItem(series);

    if (playItem.movieUrl) {
      return { playItem, series, blocked: null };
    }

    return { playItem, series, blocked: subscriptionRequiredBlock() };
  } catch (error) {
    return {
      playItem: buildSeriesPlayItem(series),
      series,
      blocked: parsePlaybackBlock(error) ?? subscriptionRequiredBlock(),
    };
  }
}
