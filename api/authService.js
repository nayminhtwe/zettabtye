import apiClient from "./client";
import { buildInitiateHeaders } from "../utils/hmac";

export async function initiateAuth({ phone }) {
  const response = await apiClient.post(
    "/auth/initiate",
    { phone },
    { headers: buildInitiateHeaders(phone) },
  );
  return response.data;
}

export async function login({ phone, password }) {
  const response = await apiClient.post("/auth/login", { phone, password });
  return response.data;
}

export async function register({ name, phone, password }) {
  const response = await apiClient.post("/auth/register", { name, phone, password });
  return response.data;
}

export async function verifyOtp({ phone, transactionId, otpCode }) {
  const response = await apiClient.post("/auth/verify-otp", {
    phone,
    transaction_id: transactionId,
    otp_code: otpCode,
  });
  return response.data;
}

export async function resendOtp({ phone }) {
  const response = await apiClient.post("/auth/resend-otp", { phone });
  return response.data;
}

export async function setPassword({ password }) {
  const response = await apiClient.post("/auth/set-password", { password });
  return response.data;
}

export async function forgotPassword({ phone }) {
  const response = await apiClient.post("/auth/forgot-password", { phone });
  return response.data;
}

export async function resetPassword({ phone, transactionId, otpCode, password }) {
  const response = await apiClient.post("/auth/reset-password", {
    phone,
    transaction_id: transactionId,
    otp_code: otpCode,
    password,
    password_confirmation: password,
  });
  return response.data;
}

export async function fetchCurrentUser() {
  const response = await apiClient.get("/user");
  return response.data;
}

export async function logout() {
  const response = await apiClient.post("/logout");
  return response.data;
}

export function parseAuthSession(payload) {
  const data = payload?.data ?? payload;
  return {
    token: data?.token ?? null,
    user: data?.user ?? null,
  };
}

export function parseOtpSession(payload) {
  const data = payload?.data ?? payload;
  return {
    transactionId: data?.transaction_id ?? null,
    phone: data?.phone ?? null,
    expiresInMinutes: data?.expires_in_minutes ?? null,
  };
}

export function parseInitiateResponse(payload) {
  return {
    status: payload?.status ?? null,
    transactionId: payload?.data?.transaction_id ?? null,
    phone: payload?.data?.phone ?? null,
  };
}
