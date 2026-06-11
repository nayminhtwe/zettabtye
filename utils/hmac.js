import HmacSHA256 from "crypto-js/hmac-sha256";
import { AUTH_INITIATE_SECRET } from "../config/api";

/**
 * Signs the /auth/initiate request.
 *
 * The server validates:
 *   X-Signature = hex( HMAC-SHA256( AUTH_INITIATE_SECRET, phone + "|" + timestamp ) )
 *   X-Timestamp = Unix seconds (must be within ±5 min of server time)
 *
 * @param {string} phone - The raw (un-normalised) phone value being sent
 * @returns {{ "X-Signature": string, "X-Timestamp": string }}
 */
export function buildInitiateHeaders(phone) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = `${phone}|${timestamp}`;
  const signature = HmacSHA256(message, AUTH_INITIATE_SECRET).toString();
  return {
    "X-Signature": signature,
    "X-Timestamp": timestamp,
  };
}
