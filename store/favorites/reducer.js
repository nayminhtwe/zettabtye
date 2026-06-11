import { FAVORITES_TYPES } from "./actionTypes";

const initialState = {
  items: [],
  loading: false,
  error: null,
  saving: false,
};

export default function favoritesReducer(state = initialState, action) {
  switch (action.type) {
    case FAVORITES_TYPES.FETCH_FAVORITES_REQUEST:
      return { ...state, loading: true, error: null };

    case FAVORITES_TYPES.FETCH_FAVORITES_SUCCESS:
      return { ...state, items: action.payload, loading: false, error: null };

    case FAVORITES_TYPES.FETCH_FAVORITES_FAILURE:
      return { ...state, loading: false, error: action.payload };

    case FAVORITES_TYPES.ADD_FAVORITE_REQUEST:
    case FAVORITES_TYPES.REMOVE_FAVORITE_REQUEST:
      return { ...state, saving: true, error: null };

    case FAVORITES_TYPES.ADD_FAVORITE_SUCCESS:
      return {
        ...state,
        items: [...state.items.filter((item) => item.id !== action.payload.id), action.payload],
        saving: false,
      };

    case FAVORITES_TYPES.REMOVE_FAVORITE_SUCCESS:
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
        saving: false,
      };

    case FAVORITES_TYPES.ADD_FAVORITE_FAILURE:
    case FAVORITES_TYPES.REMOVE_FAVORITE_FAILURE:
      return { ...state, saving: false, error: action.payload };

    default:
      return state;
  }
}
