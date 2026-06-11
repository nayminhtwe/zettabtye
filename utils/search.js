export const SEARCH_PLACEHOLDER_HINTS = [
  "Movies",
  "Series",
  "Director",
  "Casts",
];

export const SEARCH_PLACEHOLDER = SEARCH_PLACEHOLDER_HINTS[0];

export function buildSearchSuggestions(query, { genres = [], movies = [], series = [] } = {}) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  const genreMatches = genres
    .map((genre) => genre.name)
    .filter((name) => name.toLowerCase().includes(normalized));

  const titleMatches = [...movies, ...series]
    .map((item) => item.title)
    .filter((title) => title?.toLowerCase().includes(normalized));

  return [...new Set([...titleMatches, ...genreMatches])].slice(0, 8);
}
