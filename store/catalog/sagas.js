import { all, call, put, takeLatest } from "redux-saga/effects";
import {
  extractItemData,
  extractListData,
  mapAdvertisement,
  mapMatchDetail,
  mapMatchToFixture,
  mapMovieDetail,
  mapGenre,
  mapMovieListItem,
  mapSeriesDetail,
  mapSeriesListItem,
} from "../../api/mappers";
import {
  fetchAdvertisements,
  fetchGenres,
  fetchMatchById,
  fetchMatches,
  fetchMovieById,
  fetchMovies,
  fetchSeries,
  fetchSeriesById,
} from "../../api/contentService";
import { getErrorMessage } from "../../api/client";
import { CATALOG_TYPES } from "./actionTypes";

function* fetchHomeSaga() {
  try {
    const [moviesRes, seriesRes, adsRes, matchesRes, genresRes] = yield all([
      call(fetchMovies, { per_page: 50 }),
      call(fetchSeries, { per_page: 20 }),
      call(fetchAdvertisements),
      call(fetchMatches, { per_page: 30 }),
      call(fetchGenres),
    ]);

    const movies = extractListData(moviesRes).map((item, index) => mapMovieListItem(item, index));
    const series = extractListData(seriesRes).map((item, index) => mapSeriesListItem(item, index));
    const advertisements = extractListData(adsRes).map((item, index) => mapAdvertisement(item, index));
    const matches = extractListData(matchesRes).map((item, index) => mapMatchToFixture(item, index));
    const genres = extractListData(genresRes).map(mapGenre);

    yield put({
      type: CATALOG_TYPES.FETCH_HOME_SUCCESS,
      payload: { movies, series, advertisements, matches, genres },
    });
  } catch (error) {
    yield put({
      type: CATALOG_TYPES.FETCH_HOME_FAILURE,
      payload: getErrorMessage(error),
    });
  }
}

function* fetchMoviesSaga(action) {
  const { genere_name: genreName, ...rest } = action.payload ?? {};
  const params = { per_page: 50, ...rest };

  if (genreName && genreName !== "All") {
    params.genere_name = genreName;
  }

  try {
    const response = yield call(fetchMovies, params);
    const movies = extractListData(response).map((item, index) => mapMovieListItem(item, index));
    yield put({ type: CATALOG_TYPES.FETCH_MOVIES_SUCCESS, payload: movies });
  } catch (error) {
    yield put({
      type: CATALOG_TYPES.FETCH_MOVIES_FAILURE,
      payload: getErrorMessage(error),
    });
  }
}

function* fetchSeriesSaga(action) {
  const { genere_name: genreName, ...rest } = action.payload ?? {};
  const params = { per_page: 50, ...rest };

  if (genreName && genreName !== "All") {
    params.genere_name = genreName;
  }

  try {
    const response = yield call(fetchSeries, params);
    const series = extractListData(response).map((item, index) => mapSeriesListItem(item, index));
    yield put({ type: CATALOG_TYPES.FETCH_SERIES_SUCCESS, payload: series });
  } catch (error) {
    yield put({
      type: CATALOG_TYPES.FETCH_SERIES_FAILURE,
      payload: getErrorMessage(error),
    });
  }
}

function* fetchMatchesSaga(action) {
  try {
    const response = yield call(fetchMatches, { per_page: 50, ...action.payload });
    const matches = extractListData(response).map((item, index) => mapMatchToFixture(item, index));
    yield put({ type: CATALOG_TYPES.FETCH_MATCHES_SUCCESS, payload: matches });
  } catch (error) {
    yield put({
      type: CATALOG_TYPES.FETCH_MATCHES_FAILURE,
      payload: getErrorMessage(error),
    });
  }
}

function* fetchGenresSaga() {
  try {
    const response = yield call(fetchGenres);
    const genres = extractListData(response).map(mapGenre);
    yield put({ type: CATALOG_TYPES.FETCH_GENRES_SUCCESS, payload: genres });
  } catch (error) {
    yield put({
      type: CATALOG_TYPES.FETCH_GENRES_FAILURE,
      payload: getErrorMessage(error),
    });
  }
}

function* fetchMovieDetailSaga(action) {
  const { id } = action.payload;

  try {
    const response = yield call(fetchMovieById, id);
    const movie = mapMovieDetail(extractItemData(response));
    yield put({
      type: CATALOG_TYPES.FETCH_MOVIE_DETAIL_SUCCESS,
      payload: { id: String(id), movie },
    });
  } catch (error) {
    yield put({
      type: CATALOG_TYPES.FETCH_MOVIE_DETAIL_FAILURE,
      payload: { id: String(id), error: getErrorMessage(error) },
    });
  }
}

function* fetchSeriesDetailSaga(action) {
  const { id } = action.payload;

  try {
    const response = yield call(fetchSeriesById, id);
    const series = mapSeriesDetail(extractItemData(response));
    yield put({
      type: CATALOG_TYPES.FETCH_SERIES_DETAIL_SUCCESS,
      payload: { id: String(id), series },
    });
  } catch (error) {
    yield put({
      type: CATALOG_TYPES.FETCH_SERIES_DETAIL_FAILURE,
      payload: { id: String(id), error: getErrorMessage(error) },
    });
  }
}

function* fetchMatchDetailSaga(action) {
  const { id } = action.payload;

  try {
    const response = yield call(fetchMatchById, id);
    const match = mapMatchDetail(extractItemData(response));
    yield put({
      type: CATALOG_TYPES.FETCH_MATCH_DETAIL_SUCCESS,
      payload: { id: String(id), match },
    });
  } catch (error) {
    yield put({
      type: CATALOG_TYPES.FETCH_MATCH_DETAIL_FAILURE,
      payload: { id: String(id), error: getErrorMessage(error) },
    });
  }
}

function normalizeSearchTerm(value) {
  return value.trim().toLowerCase();
}

function filterByTitle(items, query) {
  const normalized = normalizeSearchTerm(query);
  if (!normalized) {
    return [];
  }

  return items.filter((item) => item.title?.toLowerCase().includes(normalized));
}

function* searchSaga(action) {
  const { query } = action.payload;
  const trimmed = query.trim();

  if (!trimmed) {
    yield put({ type: CATALOG_TYPES.SEARCH_SUCCESS, payload: { query: "", results: [] } });
    return;
  }

  try {
    const [moviesRes, seriesRes, moviesByGenreRes, moviesByCastRes, seriesByCastRes] = yield all([
      call(fetchMovies, { per_page: 50 }),
      call(fetchSeries, { per_page: 50 }),
      call(fetchMovies, { per_page: 50, genere_name: trimmed }),
      call(fetchMovies, { per_page: 50, cast_name: trimmed }),
      call(fetchSeries, { per_page: 50, cast_name: trimmed }),
    ]);

    const allMovies = extractListData(moviesRes).map((item, index) => mapMovieListItem(item, index));
    const allSeries = extractListData(seriesRes).map((item, index) => mapSeriesListItem(item, index));
    const genreMovies = extractListData(moviesByGenreRes).map((item, index) => mapMovieListItem(item, index));
    const castMovies = extractListData(moviesByCastRes).map((item, index) => mapMovieListItem(item, index));
    const castSeries = extractListData(seriesByCastRes).map((item, index) => mapSeriesListItem(item, index));

    const titleMatches = [
      ...filterByTitle(allMovies, trimmed),
      ...filterByTitle(allSeries, trimmed),
    ];

    const merged = [...titleMatches, ...genreMovies, ...castMovies, ...castSeries];
    const seen = new Set();
    const results = merged.filter((item) => {
      const key = `${item.type ?? "movie"}-${item.id}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    yield put({
      type: CATALOG_TYPES.SEARCH_SUCCESS,
      payload: { query: trimmed, results },
    });
  } catch (error) {
    yield put({
      type: CATALOG_TYPES.SEARCH_FAILURE,
      payload: getErrorMessage(error),
    });
  }
}

export default function* catalogSaga() {
  yield all([
    takeLatest(CATALOG_TYPES.FETCH_HOME_REQUEST, fetchHomeSaga),
    takeLatest(CATALOG_TYPES.FETCH_MOVIES_REQUEST, fetchMoviesSaga),
    takeLatest(CATALOG_TYPES.FETCH_SERIES_REQUEST, fetchSeriesSaga),
    takeLatest(CATALOG_TYPES.FETCH_MATCHES_REQUEST, fetchMatchesSaga),
    takeLatest(CATALOG_TYPES.FETCH_GENRES_REQUEST, fetchGenresSaga),
    takeLatest(CATALOG_TYPES.FETCH_MOVIE_DETAIL_REQUEST, fetchMovieDetailSaga),
    takeLatest(CATALOG_TYPES.FETCH_SERIES_DETAIL_REQUEST, fetchSeriesDetailSaga),
    takeLatest(CATALOG_TYPES.FETCH_MATCH_DETAIL_REQUEST, fetchMatchDetailSaga),
    takeLatest(CATALOG_TYPES.SEARCH_REQUEST, searchSaga),
  ]);
}
