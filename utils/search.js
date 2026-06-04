export const SEARCH_PLACEHOLDER_HINTS = [
  "Premiere League",
  "Movies",
  "Series",
  "Director",
  "Casts",
];

export const SEARCH_PLACEHOLDER = SEARCH_PLACEHOLDER_HINTS[0];

export const DEFAULT_RECENT_SEARCHES = [
  "Intersteller",
  "When life gives you tangerine",
  "Prison Break",
  "The man in the iron mask",
  "Arthur the king",
];

export const SEARCH_SUGGESTIONS = [
  "Intersteller",
  "Iron Man",
  "Three Idiots",
  "The man in the iron mask",
  "When life gives you tangerine",
  "Prison Break",
  "Arthur the king",
  "Movies",
  "Premiere League",
  "Superman",
  "Interstellar",
  "Terminator",
  "Mask",
  "Football matches",
  "Sci-fi",
  "Animation",
  "Series",
  "Drama",
];

export const TOP_CATEGORIES = [
  {
    id: "football",
    label: "Football",
    image: require("../assets/images/featured/featured-4.jpg"),
    destination: "football_list",
  },
  {
    id: "series",
    label: "Series",
    image: require("../assets/images/featured/featured-2.jpg"),
    destination: "series",
  },
  {
    id: "scifi",
    label: "Sci-fi",
    image: require("../assets/images/trending/trending-1.jpg"),
    destination: "movies",
    moviesCategory: "Sci-Fi",
  },
  {
    id: "animation",
    label: "Animation",
    image: require("../assets/images/trending/trending-3.jpg"),
    destination: "movies",
    moviesCategory: "Anime",
  },
  {
    id: "drama",
    label: "Drama",
    image: require("../assets/images/trending/trending-2.jpg"),
    destination: "movies",
    moviesCategory: "Drama",
  },
];

const MOVIE_SUGGESTIONS = [
  "Intersteller",
  "Iron Man",
  "Three Idiots",
  "The man in the iron mask",
];

export const SEARCH_MOVIES = [
  {
    title: "Interstellar",
    label: "Interstellar",
    image: require("../assets/images/featured/featured-1.jpg"),
    aliases: ["Intersteller"],
  },
  {
    title: "Superman",
    label: "Superman",
    image: require("../assets/images/featured/featured-2.jpg"),
  },
  {
    title: "Mask",
    label: "Mask",
    image: require("../assets/images/featured/featured-3.jpg"),
  },
  {
    title: "Terminator",
    label: "Terminator",
    image: require("../assets/images/featured/featured-4.jpg"),
  },
  {
    title: "1917",
    label: "1917",
    image: require("../assets/images/featured/featured-1.jpg"),
  },
  {
    title: "Iron Man",
    label: "Iron Man",
    image: require("../assets/images/trending/trending-1.jpg"),
  },
  {
    title: "Three Idiots",
    label: "Three Idiots",
    image: require("../assets/images/trending/trending-2.jpg"),
  },
  {
    title: "The man in the iron mask",
    label: "The man in the iron mask",
    image: require("../assets/images/trending/trending-3.jpg"),
  },
  {
    title: "When life gives you tangerine",
    label: "When life gives you tangerine",
    image: require("../assets/images/trending/trending-4.jpg"),
  },
  {
    title: "Prison Break",
    label: "Prison Break",
    image: require("../assets/images/trending/trending-1.jpg"),
  },
  {
    title: "Arthur the king",
    label: "Arthur the king",
    image: require("../assets/images/trending/trending-2.jpg"),
  },
];

function normalizeSearchTerm(value) {
  return value.trim().toLowerCase();
}

export function getSearchMovie(title) {
  const normalized = normalizeSearchTerm(title);
  if (!normalized) {
    return null;
  }

  return (
    SEARCH_MOVIES.find((movie) => {
      const labels = [movie.title, movie.label, ...(movie.aliases ?? [])];
      return labels.some((label) => normalizeSearchTerm(label) === normalized);
    }) ?? null
  );
}

export function isMovieSearchSuggestion(title) {
  return Boolean(getSearchMovie(title));
}

export function filterSearchSuggestions(query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  if (normalized === "movies" || normalized === "movie") {
    return MOVIE_SUGGESTIONS;
  }

  return SEARCH_SUGGESTIONS.filter((item) => item.toLowerCase().includes(normalized));
}
