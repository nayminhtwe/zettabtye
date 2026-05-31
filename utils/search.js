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
  },
  {
    id: "series",
    label: "Series",
    image: require("../assets/images/featured/featured-2.jpg"),
  },
  {
    id: "scifi",
    label: "Sci-fi",
    image: require("../assets/images/trending/trending-1.jpg"),
  },
  {
    id: "animation",
    label: "Animation",
    image: require("../assets/images/trending/trending-3.jpg"),
  },
  {
    id: "drama",
    label: "Drama",
    image: require("../assets/images/trending/trending-2.jpg"),
  },
];

const MOVIE_SUGGESTIONS = [
  "Intersteller",
  "Iron Man",
  "Three Idiots",
  "The man in the iron mask",
];

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
