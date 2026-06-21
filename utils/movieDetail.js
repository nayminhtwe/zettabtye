import { extractItemData, mapMovieDetail } from "../api/mappers";
import { fetchMovieById } from "../api/contentService";
import { noStreamBlock, parsePlaybackBlock, subscriptionRequiredBlock } from "./playback";

export function buildMovieDetail(item = {}) {
  const movieTitle = item.title || item.label || "";
  const imdbRating =
    item.imdbRating ||
    (item.imdb ? String(item.imdb).replace("/10", "").trim() : "");
  const posterImage =
    item.image ??
    (item.posterImage ? { uri: item.posterImage } : null);

  return {
    id: item.id ?? item.favoritableId ?? null,
    title: movieTitle,
    image: posterImage,
    categories: item.categories ?? "",
    year: item.year ?? "",
    duration: item.duration ?? "",
    imdbRating,
    overview: item.overview ?? "",
    movieUrl: item.movieUrl ?? null,
    director: item.director ?? "",
    cast: item.cast ?? "",
    type: item.type ?? "movie",
  };
}

/**
 * Movies list endpoints never include movie_url — only GET /movies/{id} does
 * (auth + active subscription). Fetch detail when the play item has no URL yet.
 */
export async function resolveMoviePlayItem(item = {}, cachedDetail = null) {
  const fromItem = buildMovieDetail(cachedDetail ?? item);
  if (fromItem.movieUrl) {
    return { playItem: fromItem, blocked: null };
  }

  const movieId = fromItem.id ?? item?.id;
  if (!movieId) {
    return {
      playItem: fromItem,
      blocked: noStreamBlock("This movie cannot be played right now."),
    };
  }

  try {
    const response = await fetchMovieById(movieId);
    const detailed = buildMovieDetail(mapMovieDetail(extractItemData(response)));

    if (detailed.movieUrl) {
      return { playItem: detailed, blocked: null };
    }

    return {
      playItem: detailed,
      blocked: subscriptionRequiredBlock(),
    };
  } catch (error) {
    return {
      playItem: fromItem,
      blocked: parsePlaybackBlock(error) ?? subscriptionRequiredBlock(),
    };
  }
}
