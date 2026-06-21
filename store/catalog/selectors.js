import { mapGenreToCategoryCard } from "../../api/mappers";

const EMPTY_ARRAY = [];

const selectCatalog = (state) => state?.catalog;

export const selectMovies = (state) => selectCatalog(state)?.movies?.items ?? EMPTY_ARRAY;
export const selectMoviesItems = selectMovies;
export const selectMoviesLoading = (state) => selectCatalog(state)?.movies?.loading ?? false;
export const selectMoviesLoadingMore = (state) => selectCatalog(state)?.movies?.loadingMore ?? false;
export const selectMoviesMeta = (state) =>
  selectCatalog(state)?.movies?.meta ?? {
    current_page: 0,
    last_page: 1,
    per_page: 50,
    total: 0,
  };
export const selectMoviesCategoryKey = (state) =>
  selectCatalog(state)?.movies?.categoryKey ?? "All";
export const selectMoviesHasMore = (state) => {
  const meta = selectMoviesMeta(state);
  const items = selectMovies(state);

  if (meta.total > 0 && items.length >= meta.total) {
    return false;
  }

  return meta.current_page > 0 && meta.current_page < meta.last_page;
};
export const selectSeries = (state) => selectCatalog(state)?.series?.items ?? EMPTY_ARRAY;
export const selectSeriesLoading = (state) => selectCatalog(state)?.series?.loading ?? false;
export const selectAdvertisements = (state) =>
  selectCatalog(state)?.advertisements?.items ?? EMPTY_ARRAY;
export const selectMatches = (state) => selectCatalog(state)?.matches?.items ?? EMPTY_ARRAY;
export const selectMatchesLoading = (state) => selectCatalog(state)?.matches?.loading ?? false;
export const selectGenres = (state) => selectCatalog(state)?.genres?.items ?? EMPTY_ARRAY;
export const selectGenresLoading = (state) => selectCatalog(state)?.genres?.loading ?? false;
export const selectHomeLoading = (state) => selectCatalog(state)?.homeLoading ?? false;

export const selectMovieDetail = (state, id) =>
  id ? selectCatalog(state)?.movieDetails?.[String(id)] ?? null : null;

export const selectMovieDetailLoading = (state, id) =>
  id ? Boolean(selectCatalog(state)?.movieDetailLoading?.[String(id)]) : false;

export const selectSeriesDetail = (state, id) =>
  id ? selectCatalog(state)?.seriesDetails?.[String(id)] ?? null : null;

export const selectSeriesDetailLoading = (state, id) =>
  id ? Boolean(selectCatalog(state)?.seriesDetailLoading?.[String(id)]) : false;

export const selectMatchDetail = (state, id) =>
  id ? selectCatalog(state)?.matchDetails?.[String(id)] ?? null : null;

export const selectMatchDetailLoading = (state, id) =>
  id ? Boolean(selectCatalog(state)?.matchDetailLoading?.[String(id)]) : false;

export const selectSearchResults = (state) =>
  selectCatalog(state)?.search?.results ?? EMPTY_ARRAY;
export const selectSearchLoading = (state) => selectCatalog(state)?.search?.loading ?? false;

function memoizeOnInput(fn) {
  let lastInput = null;
  let lastResult = EMPTY_ARRAY;

  return (input) => {
    if (input === lastInput) {
      return lastResult;
    }

    lastInput = input;
    lastResult = fn(input);
    return lastResult;
  };
}

function memoizeOnGenreMovieInputs(fn) {
  let lastGenres = null;
  let lastMovies = null;
  let lastResult = EMPTY_ARRAY;

  return (genres, movies) => {
    if (genres === lastGenres && movies === lastMovies) {
      return lastResult;
    }

    lastGenres = genres;
    lastMovies = movies;
    lastResult = fn(genres, movies);
    return lastResult;
  };
}

function mapMovieToSectionItem(movie) {
  return {
    id: movie.id,
    label: movie.title,
    image: movie.image,
    title: movie.title,
    ...movie,
  };
}

function mapSeriesToSectionItem(series) {
  return {
    id: series.id,
    label: series.title,
    image: series.image,
    title: series.title,
    type: "series",
    ...series,
  };
}

function filterMoviesByGenre(movies, genreName) {
  const list = movies ?? EMPTY_ARRAY;

  if (!genreName || genreName === "All") {
    return list;
  }

  const normalized = genreName.toLowerCase();
  return list.filter((movie) =>
    movie.categories?.toLowerCase().includes(normalized),
  );
}

function buildGenreSection(movies, genreName, limit = 4) {
  const list = movies ?? EMPTY_ARRAY;

  if (!list.length) {
    return EMPTY_ARRAY;
  }

  const filtered = filterMoviesByGenre(list, genreName).slice(0, limit);
  if (!filtered.length) {
    return EMPTY_ARRAY;
  }

  return filtered.map(mapMovieToSectionItem);
}

const memoizedFeaturedMovies = memoizeOnInput((movies) => {
  if (!movies?.length) {
    return EMPTY_ARRAY;
  }

  return movies.slice(0, 5);
});

const memoizedTrendingMovies = memoizeOnInput((movies) => {
  if (!movies?.length) {
    return EMPTY_ARRAY;
  }

  return movies.slice(0, 8).map(mapMovieToSectionItem);
});

const memoizedHomeSeriesItems = memoizeOnInput((series) => {
  if (!series?.length) {
    return EMPTY_ARRAY;
  }

  return series.slice(0, 4).map(mapSeriesToSectionItem);
});

const memoizedHomeMatches = memoizeOnInput((matches) => {
  if (!matches?.length) {
    return EMPTY_ARRAY;
  }

  return matches.slice(0, 3);
});

const memoizedCategoryFilterChips = memoizeOnInput((genres) => {
  if (!genres?.length) {
    return EMPTY_ARRAY;
  }

  return ["All", ...genres.map((genre) => genre.name)];
});

const memoizedCategoryCards = memoizeOnInput((genres) => {
  if (!genres?.length) {
    return EMPTY_ARRAY;
  }

  return genres.map((genre, index) => mapGenreToCategoryCard(genre, index));
});

const memoizedHomeGenreRows = memoizeOnGenreMovieInputs((genres, movies) => {
  if (!genres?.length) {
    return EMPTY_ARRAY;
  }

  return genres.map((genre) => ({
    id: `genre-${genre.id}`,
    title: genre.name,
    showSeeAll: true,
    seeAll: "movies",
    moviesCategory: genre.name,
    items: buildGenreSection(movies, genre.name, 4),
  }));
});

export const selectFeaturedMovies = (state) =>
  memoizedFeaturedMovies(selectMovies(state));

export const selectTrendingMovies = (state) =>
  memoizedTrendingMovies(selectMovies(state));

export const selectHomeSeriesItems = (state) =>
  memoizedHomeSeriesItems(selectSeries(state));

export const selectHomeMatches = (state) =>
  memoizedHomeMatches(selectMatches(state));

export const selectCategoryFilterChips = (state) =>
  memoizedCategoryFilterChips(selectGenres(state));

export const selectCategoryCards = (state) =>
  memoizedCategoryCards(selectGenres(state));

export const selectHomeGenreRows = (state) =>
  memoizedHomeGenreRows(selectGenres(state), selectMovies(state));

export function selectSeriesByGenre(state, genreName) {
  const series = selectSeries(state);
  if (!genreName || genreName === "All") {
    return series;
  }

  const normalized = genreName.toLowerCase();
  return series.filter((item) => item.categories?.toLowerCase().includes(normalized));
}

export function selectMoviesByGenre(state, genreName) {
  return filterMoviesByGenre(selectMovies(state), genreName);
}

export function selectHomeGenreSection(state, genreName, limit = 4) {
  return buildGenreSection(selectMovies(state), genreName, limit);
}

function memoizeOnMoviesSeriesInputs(fn) {
  let lastMovies = null;
  let lastSeries = null;
  let lastResult = EMPTY_ARRAY;

  return (movies, series) => {
    if (movies === lastMovies && series === lastSeries) {
      return lastResult;
    }

    lastMovies = movies;
    lastSeries = series;
    lastResult = fn(movies, series);
    return lastResult;
  };
}

const memoizedRecentNotifications = memoizeOnMoviesSeriesInputs((movies, series) => {
  const movieItems = (movies ?? EMPTY_ARRAY).slice(0, 5).map((movie) => ({
    id: `movie-notif-${movie.id}`,
    title: movie.title,
    subtitle: movie.categories ?? "",
    status: "Recently added",
    image: movie.image,
    unread: false,
    type: "movie",
    contentId: movie.id,
  }));

  const seriesItems = (series ?? EMPTY_ARRAY).slice(0, 5).map((item) => ({
    id: `series-notif-${item.id}`,
    title: item.title,
    subtitle: item.categories ?? "",
    status: "Recently added",
    image: item.image,
    unread: false,
    type: "series",
    contentId: item.id,
  }));

  const items = [...movieItems, ...seriesItems];
  if (!items.length) {
    return EMPTY_ARRAY;
  }

  return [{ id: "recent", label: "Recent", items }];
});

export const selectNotificationSections = (state) =>
  memoizedRecentNotifications(selectMovies(state), selectSeries(state));
