import { all, fork } from "redux-saga/effects";
import authSaga from "./auth/sagas";
import catalogSaga from "./catalog/sagas";
import favoritesSaga from "./favorites/sagas";

export default function* rootSaga() {
  yield all([fork(authSaga), fork(catalogSaga), fork(favoritesSaga)]);
}
