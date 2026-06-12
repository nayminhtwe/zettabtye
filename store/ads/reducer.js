import { ADS_TYPES } from "./actionTypes";

export const initialAdsState = {
  loading: false,
  loaded: false,
  error: null,
  settings: null,
  sdkInitialized: false,
};

export default function adsReducer(state = initialAdsState, action) {
  switch (action.type) {
    case ADS_TYPES.FETCH_SETTINGS_REQUEST:
      return { ...state, loading: true, error: null };

    case ADS_TYPES.FETCH_SETTINGS_SUCCESS:
      return {
        ...state,
        loading: false,
        loaded: true,
        settings: action.payload.settings,
        error: null,
      };

    case ADS_TYPES.FETCH_SETTINGS_FAILURE:
      return {
        ...state,
        loading: false,
        loaded: true,
        error: action.payload,
      };

    case ADS_TYPES.SDK_INITIALIZED:
      return { ...state, sdkInitialized: true };

    default:
      return state;
  }
}
