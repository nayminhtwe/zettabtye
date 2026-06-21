import apiClient from "./client";
import { extractItemData, extractListData } from "./mappers";

export async function fetchMovies(params = {}) {
  const response = await apiClient.get("/movies", { params });
  return response.data;
}

export async function fetchMovieById(id) {
  const response = await apiClient.get(`/movies/${id}`);
  return response.data;
}

export async function fetchSeries(params = {}) {
  const response = await apiClient.get("/series", { params });
  return response.data;
}

export async function fetchSeriesById(id) {
  const response = await apiClient.get(`/series/${id}/detail`);
  return response.data;
}

export async function fetchEpisode(seriesId, seasonId, episodeId) {
  const response = await apiClient.get(
    `/series/${seriesId}/season/${seasonId}/episodes/${episodeId}`,
  );
  return response.data;
}

export async function fetchMatches(params = {}) {
  const response = await apiClient.get("/matches", { params });
  return response.data;
}

export async function fetchMatchById(id) {
  const response = await apiClient.get(`/matches/${id}`);
  return response.data;
}

export async function fetchAdvertisements() {
  const response = await apiClient.get("/advertisements");
  return response.data;
}

export async function fetchGenres() {
  const response = await apiClient.get("/generes");
  return response.data;
}

export async function fetchCasts() {
  const response = await apiClient.get("/casts");
  return response.data;
}

export async function fetchFavorites() {
  const response = await apiClient.get("/favorites");
  return response.data;
}

export async function addFavorite({ favoritableType, favoritableId, status = "want_to_watch" }) {
  const response = await apiClient.post("/favorites", {
    favoritable_type: favoritableType,
    favoritable_id: favoritableId,
    status,
  });
  return response.data;
}

export async function removeFavorite(id) {
  const response = await apiClient.delete(`/favorites/${id}`);
  return response.data;
}

export async function fetchSubscriptionStatus() {
  const response = await apiClient.get("/subscription/status");
  return response.data;
}

export async function saveWatchProgress(movieId, positionMs) {
  await apiClient.post("/watch_progress", {
    movie_id: movieId,
    minute: String(Math.floor(positionMs)),
  });
}

export async function fetchContinueWatching() {
  const response = await apiClient.get("/continue_watching");
  return response.data;
}

export async function deleteContinueWatching(movieId) {
  const response = await apiClient.post("/delete_continue_watching", {
    movie_id: movieId,
  });
  return response.data;
}

export { extractListData, extractItemData };
