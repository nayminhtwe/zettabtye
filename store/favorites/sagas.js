import { call, put, takeLatest } from "redux-saga/effects";
import { extractItemData, extractListData } from "../../api/mappers";
import { addFavorite, fetchFavorites, removeFavorite } from "../../api/contentService";
import { getErrorMessage } from "../../api/client";
import { FAVORITES_TYPES } from "./actionTypes";

function mapFavoriteItem(favorite) {
  return {
    id: favorite.id,
    favoritableType: favorite.favoritable_type,
    favoritableId: favorite.favoritable_id,
    status: favorite.status ?? "want_to_watch",
    title: favorite.title ?? favorite.movies_or_series_name ?? "",
    createdAt: favorite.created_at,
  };
}

function* fetchFavoritesSaga() {
  try {
    const response = yield call(fetchFavorites);
    const items = extractListData(response).map(mapFavoriteItem);
    yield put({ type: FAVORITES_TYPES.FETCH_FAVORITES_SUCCESS, payload: items });
  } catch (error) {
    yield put({
      type: FAVORITES_TYPES.FETCH_FAVORITES_FAILURE,
      payload: getErrorMessage(error),
    });
  }
}

function* addFavoriteSaga(action) {
  const { favoritableType, favoritableId } = action.payload;

  try {
    const response = yield call(addFavorite, { favoritableType, favoritableId });
    const favorite = mapFavoriteItem(extractItemData(response));
    yield put({ type: FAVORITES_TYPES.ADD_FAVORITE_SUCCESS, payload: favorite });
  } catch (error) {
    yield put({
      type: FAVORITES_TYPES.ADD_FAVORITE_FAILURE,
      payload: getErrorMessage(error),
    });
  }
}

function* removeFavoriteSaga(action) {
  const { id } = action.payload;

  try {
    yield call(removeFavorite, id);
    yield put({ type: FAVORITES_TYPES.REMOVE_FAVORITE_SUCCESS, payload: id });
  } catch (error) {
    yield put({
      type: FAVORITES_TYPES.REMOVE_FAVORITE_FAILURE,
      payload: getErrorMessage(error),
    });
  }
}

export default function* favoritesSaga() {
  yield takeLatest(FAVORITES_TYPES.FETCH_FAVORITES_REQUEST, fetchFavoritesSaga);
  yield takeLatest(FAVORITES_TYPES.ADD_FAVORITE_REQUEST, addFavoriteSaga);
  yield takeLatest(FAVORITES_TYPES.REMOVE_FAVORITE_REQUEST, removeFavoriteSaga);
}
