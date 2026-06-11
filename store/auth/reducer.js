import { REHYDRATE } from "redux-persist";
import { AUTH_TYPES } from "./actionTypes";

export const initialAuthState = {
  bootstrapped: false,
  isLoading: false,
  isAuthenticated: false,
  otpRequired: false,
  passwordRequired: false,
  needsPasswordSetup: false,
  userStatus: null,
  token: null,
  user: null,
  phone: null,
  transactionId: null,
  error: null,
};

export default function authReducer(state = initialAuthState, action) {
  switch (action.type) {
    case AUTH_TYPES.BOOTSTRAP_REQUEST:
      return { ...state, isLoading: true, error: null };

    case AUTH_TYPES.BOOTSTRAP_SUCCESS:
      return {
        ...state,
        bootstrapped: true,
        isLoading: false,
        isAuthenticated: true,
        otpRequired: false,
        passwordRequired: false,
        token: action.payload.token,
        user: action.payload.user,
        phone: action.payload.user?.phone ?? state.phone,
        transactionId: null,
        error: null,
      };

    case AUTH_TYPES.BOOTSTRAP_FAILURE:
      return {
        ...state,
        bootstrapped: true,
        isLoading: false,
        isAuthenticated: false,
        otpRequired: false,
        passwordRequired: false,
        token: null,
        user: null,
        transactionId: null,
        error: null,
      };

    case AUTH_TYPES.AUTH_INITIATE_REQUEST:
    case AUTH_TYPES.AUTH_CONTINUE_REQUEST:
    case AUTH_TYPES.AUTH_VERIFY_OTP_REQUEST:
    case AUTH_TYPES.AUTH_RESEND_OTP_REQUEST:
    case AUTH_TYPES.AUTH_SET_PASSWORD_REQUEST:
      return { ...state, isLoading: true, error: null };

    case AUTH_TYPES.AUTH_OTP_REQUIRED:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        otpRequired: true,
        passwordRequired: false,
        phone: action.payload.phone,
        transactionId: action.payload.transactionId,
        userStatus: action.payload.userStatus ?? state.userStatus,
        error: null,
      };

    case AUTH_TYPES.AUTH_PASSWORD_REQUIRED:
      return {
        ...state,
        isLoading: false,
        otpRequired: false,
        passwordRequired: true,
        phone: action.payload.phone,
        userStatus: 'verified',
        error: null,
      };

    case AUTH_TYPES.AUTH_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        otpRequired: false,
        passwordRequired: false,
        token: action.payload.token,
        user: action.payload.user,
        phone: action.payload.user?.phone ?? state.phone,
        transactionId: null,
        error: null,
      };

    case AUTH_TYPES.AUTH_NEEDS_PASSWORD_SETUP:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        otpRequired: false,
        passwordRequired: false,
        needsPasswordSetup: true,
        token: action.payload.token,
        user: action.payload.user,
        phone: action.payload.user?.phone ?? state.phone,
        transactionId: null,
        error: null,
      };

    case AUTH_TYPES.AUTH_SET_PASSWORD_SUCCESS:
      return {
        ...state,
        isLoading: false,
        needsPasswordSetup: false,
        userStatus: null,
        error: null,
      };

    case AUTH_TYPES.AUTH_RESEND_OTP_SUCCESS:
      return {
        ...state,
        isLoading: false,
        transactionId: action.payload.transactionId,
        phone: action.payload.phone ?? state.phone,
        error: null,
      };

    case AUTH_TYPES.AUTH_FAILURE:
      return { ...state, isLoading: false, error: action.payload };

    case AUTH_TYPES.AUTH_CLEAR_ERROR:
      return { ...state, error: null };

    case AUTH_TYPES.AUTH_LOGOUT_REQUEST:
      return { ...state, isLoading: true, error: null };

    case AUTH_TYPES.AUTH_LOGOUT_SUCCESS:
      return { ...initialAuthState, bootstrapped: true };

    case REHYDRATE: {
      if (!action.payload?.auth) {
        return state;
      }

      const persisted = action.payload.auth;

      return {
        ...initialAuthState,
        token: persisted.token ?? null,
        user: persisted.user ?? null,
        phone: persisted.phone ?? null,
        transactionId: persisted.transactionId ?? null,
        userStatus: persisted.userStatus ?? null,
        needsPasswordSetup: Boolean(persisted.needsPasswordSetup),
        otpRequired: Boolean(persisted.otpRequired),
        passwordRequired: Boolean(persisted.passwordRequired),
        isAuthenticated: Boolean(persisted.isAuthenticated),
      };
    }

    default:
      return state;
  }
}
