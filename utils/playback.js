import { Alert } from "react-native";
import { getErrorMessage } from "../api/client";

export const SUBSCRIPTION_WATCH_LABEL = "Subscribe to watch";
export const SUBSCRIPTION_WATCH_HINT =
  "An active subscription is required to stream this content.";

export function subscriptionRequiredBlock(message) {
  return {
    reason: "subscription_required",
    title: "Subscription required",
    message:
      message ??
      "An active subscription is required to stream this content. Check your plan in Profile.",
  };
}

export function noStreamBlock(message) {
  return {
    reason: "no_stream",
    title: "Stream unavailable",
    message: message ?? "No stream link is available right now. Please try again later.",
  };
}

export function parsePlaybackBlock(error) {
  const status = error?.response?.status;
  const data = error?.response?.data ?? {};
  const message = getErrorMessage(error, "");

  if (status === 401) {
    return {
      reason: "auth_required",
      title: "Sign in required",
      message: message || "Please sign in to watch this content.",
    };
  }

  if (status === 404) {
    return {
      reason: "no_stream",
      title: "Stream unavailable",
      message: message || "This episode was not found or has no stream file.",
    };
  }

  if (status === 403) {
    const errorCode = data.error_code;

    if (errorCode === 1) {
      return {
        reason: "subscription_expired",
        title: "Subscription expired",
        message:
          message ||
          "Your subscription has expired. Renew in Profile to keep watching.",
      };
    }

    if (errorCode === 3) {
      return {
        reason: "account_suspended",
        title: "Account suspended",
        message: message || "Your account cannot play content right now.",
      };
    }

    return {
      reason: "subscription_inactive",
      title: "Subscription inactive",
      message:
        message || "An active subscription is required to stream this content.",
    };
  }

  return null;
}

export function showPlaybackBlockedAlert(blocked, { onViewProfile } = {}) {
  if (!blocked) {
    return;
  }

  const buttons = [{ text: "OK", style: "cancel" }];

  if (onViewProfile && blocked.reason !== "auth_required") {
    buttons.unshift({ text: "View Profile", onPress: onViewProfile });
  }

  Alert.alert(blocked.title, blocked.message, buttons);
}

export function seriesHasPlayableEpisode(series) {
  return (series?.seasonsList ?? []).some((season) =>
    (season.episodes ?? []).some((episode) => Boolean(episode.episodeUrl)),
  );
}
