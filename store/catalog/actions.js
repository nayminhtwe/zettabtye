import { CATALOG_TYPES } from "./actionTypes";

export const fetchHomeRequest = () => ({ type: CATALOG_TYPES.FETCH_HOME_REQUEST });

export const fetchMoviesRequest = (params = {}) => ({
  type: CATALOG_TYPES.FETCH_MOVIES_REQUEST,
  payload: params,
});

export const fetchSeriesRequest = (params = {}) => ({
  type: CATALOG_TYPES.FETCH_SERIES_REQUEST,
  payload: params,
});

export const fetchMatchesRequest = (params = {}) => ({
  type: CATALOG_TYPES.FETCH_MATCHES_REQUEST,
  payload: params,
});

export const fetchGenresRequest = () => ({
  type: CATALOG_TYPES.FETCH_GENRES_REQUEST,
});

export const fetchMovieDetailRequest = (id) => ({
  type: CATALOG_TYPES.FETCH_MOVIE_DETAIL_REQUEST,
  payload: { id },
});

export const fetchSeriesDetailRequest = (id) => ({
  type: CATALOG_TYPES.FETCH_SERIES_DETAIL_REQUEST,
  payload: { id },
});

export const fetchMatchDetailRequest = (id) => ({
  type: CATALOG_TYPES.FETCH_MATCH_DETAIL_REQUEST,
  payload: { id },
});

export const searchRequest = (query) => ({
  type: CATALOG_TYPES.SEARCH_REQUEST,
  payload: { query },
});

export const searchClear = () => ({ type: CATALOG_TYPES.SEARCH_CLEAR });
