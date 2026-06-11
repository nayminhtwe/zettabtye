export function buildMovieDetail(item = {}) {
  const movieTitle = item.title || item.label || "";
  const imdbRating =
    item.imdbRating ||
    (item.imdb ? String(item.imdb).replace("/10", "").trim() : "");

  return {
    id: item.id ?? null,
    title: movieTitle,
    image: item.image ?? null,
    categories: item.categories ?? "",
    year: item.year ?? "",
    duration: item.duration ?? "",
    imdbRating,
    overview: item.overview ?? "",
    movieUrl: item.movieUrl ?? null,
    type: item.type ?? "movie",
  };
}
