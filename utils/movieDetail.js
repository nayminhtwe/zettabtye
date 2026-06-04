const DEFAULT_CATEGORIES = "Sci-fi | Adventure | Family";

export function buildMovieDetail(item = {}) {
  const movieTitle = item.title || item.label || "1917";
  const imdbRating =
    item.imdbRating ||
    (item.imdb ? String(item.imdb).replace("/10", "").trim() : "8.7");

  return {
    title: movieTitle,
    image: item.image,
    categories: item.categories || DEFAULT_CATEGORIES,
    year: item.year || "2014",
    duration: item.duration || "01:39:21",
    imdbRating,
    overview: item.overview || "",
  };
}
