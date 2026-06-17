export const selectAuth = (state) => state?.auth;
export const selectAuthBootstrapped = (state) => state?.auth?.bootstrapped ?? false;
export const selectAuthLoading = (state) => state?.auth?.isLoading ?? false;
export const selectAuthAuthenticated = (state) => state?.auth?.isAuthenticated ?? false;
export const selectAuthOtpRequired = (state) => state?.auth?.otpRequired ?? false;
export const selectAuthPasswordRequired = (state) => state?.auth?.passwordRequired ?? false;
export const selectAuthNeedsPasswordSetup = (state) => state?.auth?.needsPasswordSetup ?? false;
export const selectAuthToken = (state) => state?.auth?.token ?? null;
export const selectAuthUser = (state) => state?.auth?.user ?? null;
export const selectAuthPhone = (state) => state?.auth?.phone ?? null;
export const selectAuthError = (state) => state?.auth?.error ?? null;
export const selectAuthForgotPasswordPhone = (state) => state?.auth?.forgotPasswordPhone ?? null;
export const selectAuthForgotPasswordTransactionId = (state) =>
  state?.auth?.forgotPasswordTransactionId ?? null;
export const selectAuthUserStatus = (state) => state?.auth?.userStatus ?? null;
