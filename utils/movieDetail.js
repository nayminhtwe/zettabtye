const DEFAULT_CATEGORIES = "Sci-fi | Adventure | Family";

export function buildMovieDetail({ title, label, image }) {
  const movieTitle = title || label || "1917";

  return {
    title: movieTitle,
    image,
    categories: DEFAULT_CATEGORIES,
    year: "2014",
    duration: "1:00:17",
    imdbRating: "8.7",
    overview: "",
  };
}
