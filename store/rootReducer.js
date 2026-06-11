import { combineReducers } from "redux";
import authReducer from "./auth/reducer";
import catalogReducer from "./catalog/reducer";
import favoritesReducer from "./favorites/reducer";
import { AUTH_TYPES } from "./auth/actionTypes";

const appReducer = combineReducers({
  auth: authReducer,
  catalog: catalogReducer,
  favorites: favoritesReducer,
});

export default function rootReducer(state, action) {
  if (action.type === AUTH_TYPES.AUTH_LOGOUT_SUCCESS) {
    return appReducer(undefined, action);
  }

  return appReducer(state, action);
}
