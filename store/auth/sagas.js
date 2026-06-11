import { call, put, select, takeLatest } from "redux-saga/effects";
import {
  fetchCurrentUser,
  forgotPassword,
  initiateAuth,
  login,
  logout,
  parseAuthSession,
  parseInitiateResponse,
  parseOtpSession,
  resendOtp,
  resetPassword,
  setPassword,
  verifyOtp,
} from "../../api/authService";
// register is intentionally not imported — new users are created via /auth/initiate on the backend
import {
  getErrorMessage,
  isPhoneNotVerifiedError,
  setAuthToken,
} from "../../api/client";

import { formatPhoneForApi } from "../../utils/phoneAuth";
import { AUTH_TYPES } from "./actionTypes";

function* saveSession(token, user) {
  setAuthToken(token);
  yield put({
    type: AUTH_TYPES.AUTH_SUCCESS,
    payload: { token, user },
  });
}

function* requireOtp(phone, transactionId, userStatus) {
  yield put({
    type: AUTH_TYPES.AUTH_OTP_REQUIRED,
    payload: { phone, transactionId, userStatus },
  });
}

function* bootstrapSaga() {
  const token = yield select((state) => state.auth.token);

  if (!token) {
    yield put({ type: AUTH_TYPES.BOOTSTRAP_FAILURE });
    return;
  }

  try {
    setAuthToken(token);
    const user = yield call(fetchCurrentUser);
    yield put({
      type: AUTH_TYPES.BOOTSTRAP_SUCCESS,
      payload: { token, user },
    });
  } catch (error) {
    setAuthToken(null);
    yield put({ type: AUTH_TYPES.BOOTSTRAP_FAILURE });
  }
}

function* authInitiateSaga(action) {
  const { phone, countryId } = action.payload;
  const formattedPhone = formatPhoneForApi(phone, countryId);

  if (!formattedPhone) {
    yield put({
      type: AUTH_TYPES.AUTH_FAILURE,
      payload: "Phone number does not match the selected country",
    });
    return;
  }

  try {
    const response = yield call(initiateAuth, { phone: formattedPhone });
    const { status, transactionId } = parseInitiateResponse(response);

    if (status === "verified") {
      yield put({
        type: AUTH_TYPES.AUTH_PASSWORD_REQUIRED,
        payload: { phone: formattedPhone },
      });
      return;
    }

    if (status === "new" || status === "unverified") {
      yield call(requireOtp, formattedPhone, transactionId, status);
      return;
    }

    yield put({
      type: AUTH_TYPES.AUTH_FAILURE,
      payload: "Unexpected response. Please try again.",
    });
  } catch (error) {
    yield put({
      type: AUTH_TYPES.AUTH_FAILURE,
      payload: getErrorMessage(error, "Failed to check phone. Please try again."),
    });
  }
}

function* authContinueSaga(action) {
  const { phone, password, countryId } = action.payload;
  const formattedPhone = formatPhoneForApi(phone, countryId);

  if (!formattedPhone) {
    yield put({
      type: AUTH_TYPES.AUTH_FAILURE,
      payload: "Phone number does not match the selected country",
    });
    return;
  }

  if (!password || password.length < 8) {
    yield put({
      type: AUTH_TYPES.AUTH_FAILURE,
      payload: "Password must be at least 8 characters",
    });
    return;
  }

  try {
    const loginResponse = yield call(login, { phone: formattedPhone, password });
    const session = parseAuthSession(loginResponse);
    yield call(saveSession, session.token, session.user);
  } catch (loginError) {
    if (isPhoneNotVerifiedError(loginError)) {
      try {
        const resendResponse = yield call(resendOtp, { phone: formattedPhone });
        const otpSession = parseOtpSession(resendResponse);
        yield call(requireOtp, formattedPhone, otpSession.transactionId, "unverified");
      } catch (resendError) {
        yield put({
          type: AUTH_TYPES.AUTH_FAILURE,
          payload: getErrorMessage(resendError, "Failed to send OTP. Please try again."),
        });
      }
      return;
    }

    yield put({
      type: AUTH_TYPES.AUTH_FAILURE,
      payload: getErrorMessage(loginError, "Invalid phone number or password."),
    });
  }
}

function* authVerifyOtpSaga(action) {
  const { otpCode } = action.payload;
  const phone = yield select((state) => state.auth.phone);
  const transactionId = yield select((state) => state.auth.transactionId);
  const userStatus = yield select((state) => state.auth.userStatus);

  if (!/^\d{6}$/.test(otpCode || "")) {
    yield put({
      type: AUTH_TYPES.AUTH_FAILURE,
      payload: "Please enter the 6-digit OTP code",
    });
    return;
  }

  if (!phone || !transactionId) {
    yield put({
      type: AUTH_TYPES.AUTH_FAILURE,
      payload: "OTP session expired. Please start again.",
    });
    return;
  }

  try {
    const response = yield call(verifyOtp, { phone, transactionId, otpCode });
    const session = parseAuthSession(response);

    // OTP is only shown for phones from initiate (new/unverified). Both get a random
    // temp password on the backend and must set a real password after verification.
    if (userStatus !== "verified") {
      setAuthToken(session.token);
      yield put({
        type: AUTH_TYPES.AUTH_NEEDS_PASSWORD_SETUP,
        payload: { token: session.token, user: session.user },
      });
      return;
    }

    yield call(saveSession, session.token, session.user);
  } catch (error) {
    yield put({
      type: AUTH_TYPES.AUTH_FAILURE,
      payload: getErrorMessage(error, "OTP verification failed. Please try again."),
    });
  }
}

function* authResendOtpSaga() {
  const phone = yield select((state) => state.auth.phone);

  if (!phone) {
    yield put({
      type: AUTH_TYPES.AUTH_FAILURE,
      payload: "Phone number is missing. Please start again.",
    });
    return;
  }

  try {
    const response = yield call(resendOtp, { phone });
    const otpSession = parseOtpSession(response);
    yield put({
      type: AUTH_TYPES.AUTH_RESEND_OTP_SUCCESS,
      payload: {
        transactionId: otpSession.transactionId,
        phone: otpSession.phone ?? phone,
      },
    });
  } catch (error) {
    yield put({
      type: AUTH_TYPES.AUTH_FAILURE,
      payload: getErrorMessage(error, "Failed to resend OTP. Please try again."),
    });
  }
}

function* authSetPasswordSaga(action) {
  const { password, source = "signup" } = action.payload;

  if (!password || password.length < 8) {
    yield put({
      type: AUTH_TYPES.AUTH_FAILURE,
      payload: "Password must be at least 8 characters",
    });
    return;
  }

  try {
    yield call(setPassword, { password });
    yield put({
      type:
        source === "profile"
          ? AUTH_TYPES.AUTH_PROFILE_PASSWORD_SUCCESS
          : AUTH_TYPES.AUTH_SET_PASSWORD_SUCCESS,
    });
  } catch (error) {
    yield put({
      type: AUTH_TYPES.AUTH_FAILURE,
      payload: getErrorMessage(error, "Failed to set password. Please try again."),
    });
  }
}

function* authForgotPasswordSaga(action) {
  const { phone, countryId } = action.payload;
  const formattedPhone = formatPhoneForApi(phone, countryId);

  if (!formattedPhone) {
    yield put({
      type: AUTH_TYPES.AUTH_FAILURE,
      payload: "Phone number does not match the selected country",
    });
    return;
  }

  try {
    const response = yield call(forgotPassword, { phone: formattedPhone });
    const otpSession = parseOtpSession(response);

    yield put({
      type: AUTH_TYPES.AUTH_FORGOT_PASSWORD_SUCCESS,
      payload: {
        phone: formattedPhone,
        transactionId: otpSession.transactionId,
      },
    });
  } catch (error) {
    yield put({
      type: AUTH_TYPES.AUTH_FAILURE,
      payload: getErrorMessage(error, "Failed to send reset code. Please try again."),
    });
  }
}

function* authResetPasswordSaga(action) {
  const { otpCode, password } = action.payload;
  const phone = yield select((state) => state.auth.forgotPasswordPhone);
  const transactionId = yield select((state) => state.auth.forgotPasswordTransactionId);

  if (!/^\d{6}$/.test(otpCode || "")) {
    yield put({
      type: AUTH_TYPES.AUTH_FAILURE,
      payload: "Please enter the 6-digit OTP code",
    });
    return;
  }

  if (!password || password.length < 8) {
    yield put({
      type: AUTH_TYPES.AUTH_FAILURE,
      payload: "Password must be at least 8 characters",
    });
    return;
  }

  if (!phone || !transactionId) {
    yield put({
      type: AUTH_TYPES.AUTH_FAILURE,
      payload: "Reset session expired. Please request a new code.",
    });
    return;
  }

  try {
    yield call(resetPassword, {
      phone,
      transactionId,
      otpCode,
      password,
    });
    yield put({ type: AUTH_TYPES.AUTH_RESET_PASSWORD_SUCCESS });
  } catch (error) {
    yield put({
      type: AUTH_TYPES.AUTH_FAILURE,
      payload: getErrorMessage(error, "Password reset failed. Please try again."),
    });
  }
}

function* authLogoutSaga() {
  try {
    yield call(logout);
  } catch (_error) {
    // Clear local session even if remote logout fails.
  } finally {
    setAuthToken(null);
    yield put({ type: AUTH_TYPES.AUTH_LOGOUT_SUCCESS });
  }
}

export default function* authSaga() {
  yield takeLatest(AUTH_TYPES.BOOTSTRAP_REQUEST, bootstrapSaga);
  yield takeLatest(AUTH_TYPES.AUTH_INITIATE_REQUEST, authInitiateSaga);
  yield takeLatest(AUTH_TYPES.AUTH_CONTINUE_REQUEST, authContinueSaga);
  yield takeLatest(AUTH_TYPES.AUTH_VERIFY_OTP_REQUEST, authVerifyOtpSaga);
  yield takeLatest(AUTH_TYPES.AUTH_RESEND_OTP_REQUEST, authResendOtpSaga);
  yield takeLatest(AUTH_TYPES.AUTH_SET_PASSWORD_REQUEST, authSetPasswordSaga);
  yield takeLatest(AUTH_TYPES.AUTH_FORGOT_PASSWORD_REQUEST, authForgotPasswordSaga);
  yield takeLatest(AUTH_TYPES.AUTH_RESET_PASSWORD_REQUEST, authResetPasswordSaga);
  yield takeLatest(AUTH_TYPES.AUTH_LOGOUT_REQUEST, authLogoutSaga);
}
