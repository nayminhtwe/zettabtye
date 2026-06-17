import { call, put, takeLatest } from "redux-saga/effects";
import { fetchAppSettings, parseAppSettings } from "../../api/appSettingsService";
import { getErrorMessage } from "../../api/client";
import { ADS_TYPES } from "./actionTypes";

function* fetchAppSettingsSaga() {
  try {
    const response = yield call(fetchAppSettings);
    const settings = parseAppSettings(response);

    yield put({
      type: ADS_TYPES.FETCH_SETTINGS_SUCCESS,
      payload: { settings },
    });
  } catch (error) {
    yield put({
      type: ADS_TYPES.FETCH_SETTINGS_FAILURE,
      payload: getErrorMessage(error, "Failed to load app settings."),
    });
  }
}

export default function* adsSaga() {
  yield takeLatest(ADS_TYPES.FETCH_SETTINGS_REQUEST, fetchAppSettingsSaga);
}
