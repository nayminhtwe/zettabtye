import { FAVORITES_TYPES } from "./actionTypes";

export const fetchFavoritesRequest = () => ({
  type: FAVORITES_TYPES.FETCH_FAVORITES_REQUEST,
});

export const addFavoriteRequest = ({ favoritableType, favoritableId }) => ({
  type: FAVORITES_TYPES.ADD_FAVORITE_REQUEST,
  payload: { favoritableType, favoritableId },
});

export const removeFavoriteRequest = (id) => ({
  type: FAVORITES_TYPES.REMOVE_FAVORITE_REQUEST,
  payload: { id },
});
