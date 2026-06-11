import { AUTH_TYPES } from "./actionTypes";

export const bootstrapRequest = () => ({ type: AUTH_TYPES.BOOTSTRAP_REQUEST });

export const authInitiateRequest = ({ phone, countryId }) => ({
  type: AUTH_TYPES.AUTH_INITIATE_REQUEST,
  payload: { phone, countryId },
});

export const authContinueRequest = ({ phone, password, countryId }) => ({
  type: AUTH_TYPES.AUTH_CONTINUE_REQUEST,
  payload: { phone, password, countryId },
});

export const authVerifyOtpRequest = (otpCode) => ({
  type: AUTH_TYPES.AUTH_VERIFY_OTP_REQUEST,
  payload: { otpCode },
});

export const authResendOtpRequest = () => ({
  type: AUTH_TYPES.AUTH_RESEND_OTP_REQUEST,
});

export const authSetPasswordRequest = (password, source = "signup") => ({
  type: AUTH_TYPES.AUTH_SET_PASSWORD_REQUEST,
  payload: { password, source },
});

export const authForgotPasswordRequest = ({ phone, countryId }) => ({
  type: AUTH_TYPES.AUTH_FORGOT_PASSWORD_REQUEST,
  payload: { phone, countryId },
});

export const authResetPasswordRequest = ({ otpCode, password }) => ({
  type: AUTH_TYPES.AUTH_RESET_PASSWORD_REQUEST,
  payload: { otpCode, password },
});

export const authLogoutRequest = () => ({
  type: AUTH_TYPES.AUTH_LOGOUT_REQUEST,
});

export const authClearError = () => ({
  type: AUTH_TYPES.AUTH_CLEAR_ERROR,
});
