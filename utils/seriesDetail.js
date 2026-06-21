import { extractItemData, mapSeriesDetail } from "../api/mappers";
import { fetchEpisode, fetchSeriesById } from "../api/contentService";
import { noStreamBlock, parsePlaybackBlock, subscriptionRequiredBlock } from "./playback";

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

function findFirstEpisode(series) {
  for (const season of series?.seasonsList ?? []) {
    for (const episode of season.episodes ?? []) {
      return episode;
    }
  }

  return null;
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

function resolveEpisodeInSeries(series, episodeHint) {
  if (!episodeHint?.id) {
    return null;
  }

  for (const season of series?.seasonsList ?? []) {
    const match = season.episodes?.find(
      (episode) => String(episode.id) === String(episodeHint.id),
    );
    if (match) {
      return match;
    }
  }

  return episodeHint;
}

function pickTargetEpisode(series, episodeHint) {
  if (episodeHint?.id) {
    return resolveEpisodeInSeries(series, episodeHint);
  }

  return findFirstPlayableEpisode(series) ?? findFirstEpisode(series);
}

export function buildSeriesPlayItem(series, episode) {
  const targetEpisode = episode?.id
    ? resolveEpisodeInSeries(series, episode) ?? episode
    : findFirstPlayableEpisode(series) ?? findFirstEpisode(series);

  return {
    id: targetEpisode?.id ?? series?.id ?? null,
    title: targetEpisode?.title ?? series?.title ?? "",
    image: targetEpisode?.thumbnail ?? series?.image ?? null,
    categories: series?.categories ?? "",
    year: series?.year ?? "",
    duration: targetEpisode?.duration ?? "",
    imdbRating: series?.imdbRating ?? "",
    movieUrl: targetEpisode?.episodeUrl ?? null,
    seriesId: targetEpisode?.seriesId ?? series?.id ?? null,
    seasonId: targetEpisode?.seasonId ?? null,
    type: "series",
  };
}

async function ensureSeriesDetail(series, item) {
  if ((series.seasonsList ?? []).some((season) => (season.episodes ?? []).length > 0)) {
    return series;
  }

  const seriesId = series.id ?? item?.id;
  if (!seriesId) {
    return series;
  }

  const response = await fetchSeriesById(seriesId);
  return buildSeriesDetail(mapSeriesDetail(extractItemData(response)));
}

async function fetchEpisodePlaybackUrl(series, episode) {
  const seriesId = episode?.seriesId ?? series?.id;
  const seasonId = episode?.seasonId;
  const episodeId = episode?.id;

  if (!seriesId || !seasonId || !episodeId) {
    return null;
  }

  const response = await fetchEpisode(seriesId, seasonId, episodeId);
  const data = extractItemData(response);
  const playbackUrl = data?.episode_url ?? null;

  if (!playbackUrl) {
    return null;
  }

  return {
    ...episode,
    episodeUrl: playbackUrl,
  };
}

/**
 * Series list/detail metadata may omit episode_url. Resolve playback via the
 * protected episode endpoint (same auth model as GET /movies/{id}).
 */
export async function resolveSeriesPlayItem(item = {}, cachedDetail = null, episodeHint = null) {
  let series = buildSeriesDetail(cachedDetail ?? item);

  try {
    series = await ensureSeriesDetail(series, item);

    const targetEpisode = pickTargetEpisode(series, episodeHint);
    if (!targetEpisode) {
      return {
        playItem: buildSeriesPlayItem(series),
        series,
        blocked: noStreamBlock("This series has no episodes yet."),
      };
    }

    const resolvedEpisode =
      targetEpisode.episodeUrl != null
        ? targetEpisode
        : await fetchEpisodePlaybackUrl(series, targetEpisode);

    const playItem = buildSeriesPlayItem(
      series,
      resolvedEpisode ? { ...targetEpisode, ...resolvedEpisode } : targetEpisode,
    );

    if (playItem.movieUrl) {
      return { playItem, series, blocked: null };
    }

    return {
      playItem,
      series,
      blocked: noStreamBlock(
        "No stream link is available for this episode. Upload the episode video in admin.",
      ),
    };
  } catch (error) {
    return {
      playItem: buildSeriesPlayItem(series, episodeHint ?? undefined),
      series,
      blocked: parsePlaybackBlock(error) ?? subscriptionRequiredBlock(),
    };
  }
}
