import { getPosterSource } from "../../api/mappers";

const selectFavoritesState = (state) => state.favorites;

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

function findCatalogItem(state, favorite) {
  const movies = state.catalog?.movies?.items ?? [];
  const series = state.catalog?.series?.items ?? [];

  if (favorite.favoritableType === "series") {
    return series.find((item) => String(item.id) === String(favorite.favoritableId));
  }

  return movies.find((item) => String(item.id) === String(favorite.favoritableId));
}

export function selectFavoriteMediaItems(state) {
  return selectFavorites(state)
    .map((favorite, index) => {
      const catalogItem = findCatalogItem(state, favorite);

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
}

export function selectFavoriteHistorySections(state) {
  const items = selectFavoriteMediaItems(state);
  if (!items.length) {
    return [];
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

  return sections;
}
