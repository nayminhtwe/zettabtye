import { dedupeListById } from "../../api/mappers";
import { CATALOG_TYPES } from "./actionTypes";

const DEFAULT_MOVIES_META = {
  current_page: 0,
  last_page: 1,
  per_page: 50,
  total: 0,
};

const initialState = {
  movies: {
    items: [],
    meta: DEFAULT_MOVIES_META,
    categoryKey: "All",
    loading: false,
    loadingMore: false,
    error: null,
  },
  series: { items: [], loading: false, error: null },
  advertisements: { items: [], loading: false, error: null },
  matches: { items: [], loading: false, error: null },
  genres: { items: [], loading: false, error: null },
  movieDetails: {},
  seriesDetails: {},
  matchDetails: {},
  movieDetailLoading: {},
  seriesDetailLoading: {},
  matchDetailLoading: {},
  homeLoading: false,
  homeError: null,
  search: { query: "", results: [], loading: false, error: null },
};

function normalizeListSlice(slice, loading, error = null) {
  return {
    items: slice?.items ?? [],
    loading,
    error,
  };
}

function setLoadingSlice(state, key, loading) {
  return {
    ...state,
    [key]: normalizeListSlice(state[key], loading, loading ? null : state[key]?.error ?? null),
  };
}

export default function catalogReducer(state = initialState, action) {
  switch (action.type) {
    case CATALOG_TYPES.FETCH_HOME_REQUEST:
      return { ...state, homeLoading: true, homeError: null };

    case CATALOG_TYPES.FETCH_HOME_SUCCESS:
      return {
        ...state,
        homeLoading: false,
        movies: {
          items: action.payload.movies ?? [],
          meta: DEFAULT_MOVIES_META,
          categoryKey: "All",
          loading: false,
          loadingMore: false,
          error: null,
        },
        series: { items: action.payload.series ?? [], loading: false, error: null },
        advertisements: { items: action.payload.advertisements ?? [], loading: false, error: null },
        matches: { items: action.payload.matches ?? [], loading: false, error: null },
        genres: { items: action.payload.genres ?? [], loading: false, error: null },
      };

    case CATALOG_TYPES.FETCH_HOME_FAILURE:
      return { ...state, homeLoading: false, homeError: action.payload };

    case CATALOG_TYPES.FETCH_MOVIES_REQUEST:
      return {
        ...state,
        movies: {
          items: [],
          meta: DEFAULT_MOVIES_META,
          categoryKey: action.payload?.genere_name ?? "All",
          loading: true,
          loadingMore: false,
          error: null,
        },
      };

    case CATALOG_TYPES.FETCH_MOVIES_MORE_REQUEST:
      return {
        ...state,
        movies: {
          ...state.movies,
          loadingMore: true,
          error: null,
        },
      };

    case CATALOG_TYPES.FETCH_MOVIES_SUCCESS: {
      const { movies = [], meta = DEFAULT_MOVIES_META, append = false, categoryKey } =
        action.payload ?? {};
      const previousItems = append ? state.movies.items : [];
      const nextItems = dedupeListById(append ? [...previousItems, ...movies] : movies);
      const items =
        append && nextItems.length === previousItems.length ? previousItems : nextItems;

      return {
        ...state,
        movies: {
          items,
          meta,
          categoryKey: categoryKey ?? state.movies.categoryKey,
          loading: false,
          loadingMore: false,
          error: null,
        },
      };
    }

    case CATALOG_TYPES.FETCH_MOVIES_FAILURE:
      return {
        ...state,
        movies: {
          ...state.movies,
          loading: false,
          loadingMore: false,
          error: action.payload,
        },
      };

    case CATALOG_TYPES.FETCH_MOVIES_MORE_FAILURE:
      return {
        ...state,
        movies: {
          ...state.movies,
          loadingMore: false,
          error: action.payload,
        },
      };

    case CATALOG_TYPES.FETCH_SERIES_REQUEST:
      return setLoadingSlice(state, "series", true);

    case CATALOG_TYPES.FETCH_SERIES_SUCCESS:
      return {
        ...state,
        series: normalizeListSlice({ items: action.payload ?? [] }, false),
      };

    case CATALOG_TYPES.FETCH_SERIES_FAILURE:
      return {
        ...state,
        series: normalizeListSlice(state.series, false, action.payload),
      };

    case CATALOG_TYPES.FETCH_MATCHES_REQUEST:
      return setLoadingSlice(state, "matches", true);

    case CATALOG_TYPES.FETCH_MATCHES_SUCCESS:
      return {
        ...state,
        matches: normalizeListSlice({ items: action.payload ?? [] }, false),
      };

    case CATALOG_TYPES.FETCH_MATCHES_FAILURE:
      return {
        ...state,
        matches: normalizeListSlice(state.matches, false, action.payload),
      };

    case CATALOG_TYPES.FETCH_GENRES_REQUEST:
      return setLoadingSlice(state, "genres", true);

    case CATALOG_TYPES.FETCH_GENRES_SUCCESS:
      return {
        ...state,
        genres: normalizeListSlice({ items: action.payload ?? [] }, false),
      };

    case CATALOG_TYPES.FETCH_GENRES_FAILURE:
      return {
        ...state,
        genres: normalizeListSlice(state.genres, false, action.payload),
      };

    case CATALOG_TYPES.FETCH_MOVIE_DETAIL_REQUEST:
      return {
        ...state,
        movieDetailLoading: { ...state.movieDetailLoading, [action.payload.id]: true },
      };

    case CATALOG_TYPES.FETCH_MOVIE_DETAIL_SUCCESS:
      return {
        ...state,
        movieDetails: { ...state.movieDetails, [action.payload.id]: action.payload.movie },
        movieDetailLoading: { ...state.movieDetailLoading, [action.payload.id]: false },
      };

    case CATALOG_TYPES.FETCH_MOVIE_DETAIL_FAILURE:
      return {
        ...state,
        movieDetailLoading: { ...state.movieDetailLoading, [action.payload.id]: false },
      };

    case CATALOG_TYPES.FETCH_SERIES_DETAIL_REQUEST:
      return {
        ...state,
        seriesDetailLoading: { ...state.seriesDetailLoading, [action.payload.id]: true },
      };

    case CATALOG_TYPES.FETCH_SERIES_DETAIL_SUCCESS:
      return {
        ...state,
        seriesDetails: { ...state.seriesDetails, [action.payload.id]: action.payload.series },
        seriesDetailLoading: { ...state.seriesDetailLoading, [action.payload.id]: false },
      };

    case CATALOG_TYPES.FETCH_SERIES_DETAIL_FAILURE:
      return {
        ...state,
        seriesDetailLoading: { ...state.seriesDetailLoading, [action.payload.id]: false },
      };

    case CATALOG_TYPES.FETCH_MATCH_DETAIL_REQUEST:
      return {
        ...state,
        matchDetailLoading: { ...state.matchDetailLoading, [action.payload.id]: true },
      };

    case CATALOG_TYPES.FETCH_MATCH_DETAIL_SUCCESS:
      return {
        ...state,
        matchDetails: { ...state.matchDetails, [action.payload.id]: action.payload.match },
        matchDetailLoading: { ...state.matchDetailLoading, [action.payload.id]: false },
      };

    case CATALOG_TYPES.FETCH_MATCH_DETAIL_FAILURE:
      return {
        ...state,
        matchDetailLoading: { ...state.matchDetailLoading, [action.payload.id]: false },
      };

    case CATALOG_TYPES.SEARCH_REQUEST:
      return {
        ...state,
        search: { ...state.search, query: action.payload.query, loading: true, error: null },
      };

    case CATALOG_TYPES.SEARCH_SUCCESS:
      return {
        ...state,
        search: {
          query: action.payload.query,
          results: action.payload.results,
          loading: false,
          error: null,
        },
      };

    case CATALOG_TYPES.SEARCH_FAILURE:
      return {
        ...state,
        search: { ...state.search, loading: false, error: action.payload },
      };

    case CATALOG_TYPES.SEARCH_CLEAR:
      return {
        ...state,
        search: { query: "", results: [], loading: false, error: null },
      };

    default:
      return state;
  }
}
