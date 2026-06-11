import { getPosterSource } from "../../api/mappers";

const EMPTY_ARRAY = [];

const selectFavoritesState = (state) => state.favorites;

const selectCatalogMovies = (state) => state.catalog?.movies?.items ?? EMPTY_ARRAY;
const selectCatalogSeries = (state) => state.catalog?.series?.items ?? EMPTY_ARRAY;

// Memoize on the input arrays so the same references yield the same output reference.
function memoizeOnInputs(compute) {
  let lastInputs = null;
  let lastResult = EMPTY_ARRAY;

  return (...inputs) => {
    if (
      lastInputs &&
      lastInputs.length === inputs.length &&
      lastInputs.every((value, index) => value === inputs[index])
    ) {
      return lastResult;
    }

    lastInputs = inputs;
    lastResult = compute(...inputs);
    return lastResult;
  };
}

export const selectFavorites = (state) => selectFavoritesState(state).items;
export const selectFavoritesLoading = (state) => selectFavoritesState(state).loading;
export const selectFavoritesSaving = (state) => selectFavoritesState(state).saving;

export function selectIsFavorited(state, favoritableType, favoritableId) {
  return selectFavorites(state).some(
    (item) =>
      item.favoritableType === favoritableType &&
      String(item.favoritableId) === String(favoritableId),
  );
}

export function selectFavoriteId(state, favoritableType, favoritableId) {
  const favorite = selectFavorites(state).find(
    (item) =>
      item.favoritableType === favoritableType &&
      String(item.favoritableId) === String(favoritableId),
  );

  return favorite?.id ?? null;
}

function findCatalogItem(movies, series, favorite) {
  if (favorite.favoritableType === "series") {
    return series.find((item) => String(item.id) === String(favorite.favoritableId));
  }

  return movies.find((item) => String(item.id) === String(favorite.favoritableId));
}

const computeFavoriteMediaItems = memoizeOnInputs((favorites, movies, series) => {
  const items = favorites
    .map((favorite, index) => {
      const catalogItem = findCatalogItem(movies, series, favorite);

      return {
        id: `favorite-${favorite.id}`,
        favoriteId: favorite.id,
        title: catalogItem?.title ?? favorite.title ?? "",
        subtitle: catalogItem?.categories ?? "",
        image: catalogItem?.image ?? getPosterSource(null, index),
        categories: catalogItem?.categories ?? "",
        type: favorite.favoritableType,
        favoritableId: favorite.favoritableId,
        progress: 0,
        action: "watch_again",
        createdAt: favorite.createdAt,
        year: catalogItem?.year,
        imdb: catalogItem?.imdb ?? catalogItem?.imdbRating,
        seasons: catalogItem?.seasons ?? catalogItem?.duration,
      };
    })
    .filter((item) => item.title);

  return items.length ? items : EMPTY_ARRAY;
});

export function selectFavoriteMediaItems(state) {
  return computeFavoriteMediaItems(
    selectFavorites(state),
    selectCatalogMovies(state),
    selectCatalogSeries(state),
  );
}

const computeFavoriteHistorySections = memoizeOnInputs((items) => {
  if (!items.length) {
    return EMPTY_ARRAY;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayItems = [];
  const earlierItems = [];

  items.forEach((item) => {
    const createdAt = item.createdAt ? new Date(item.createdAt) : null;
    if (createdAt && createdAt >= today) {
      todayItems.push(item);
      return;
    }

    earlierItems.push(item);
  });

  const sections = [];
  if (todayItems.length) {
    sections.push({ id: "today", label: "Today", items: todayItems });
  }
  if (earlierItems.length) {
    sections.push({ id: "earlier", label: "Earlier", items: earlierItems });
  }

  return sections.length ? sections : EMPTY_ARRAY;
});

export function selectFavoriteHistorySections(state) {
  return computeFavoriteHistorySections(selectFavoriteMediaItems(state));
}
