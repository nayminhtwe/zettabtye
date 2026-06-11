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
    awards: item.awards ?? "",
    seasonsList: item.seasonsList ?? [],
  };
}

export function buildSeriesPlayItem(series, episode) {
  const firstEpisode =
    episode ??
    series?.seasonsList?.[0]?.episodes?.[0] ??
    null;

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
