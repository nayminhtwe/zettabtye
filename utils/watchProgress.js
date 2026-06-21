const MIN_SAVE_MS = 2000;
const NEAR_END_RATIO = 0.95;
const MIN_RESUME_MS = 5000;

export function parsePositionMs(value) {
  if (value == null || value === "") {
    return 0;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  return Math.floor(parsed);
}

export function computeWatchProgressRatio(positionMs, durationMs) {
  if (!durationMs || durationMs <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, positionMs / durationMs));
}

export function shouldSaveWatchProgress(positionMs, durationMs) {
  if (positionMs < MIN_SAVE_MS) {
    return false;
  }

  if (durationMs > 0 && positionMs / durationMs >= NEAR_END_RATIO) {
    return false;
  }

  return true;
}

export function resolveResumePositionMs(watchingMinuteMs, videoLengthMs) {
  const positionMs = parsePositionMs(watchingMinuteMs);
  if (positionMs < MIN_RESUME_MS) {
    return 0;
  }

  if (videoLengthMs > 0 && positionMs / videoLengthMs >= NEAR_END_RATIO) {
    return 0;
  }

  return positionMs;
}

export function mapContinueWatchingItem(apiItem = {}) {
  const positionMs = parsePositionMs(apiItem.watching_minute);
  const durationMs = parsePositionMs(apiItem.video_length);
  const progress = computeWatchProgressRatio(positionMs, durationMs);

  return {
    id: apiItem.id,
    title: apiItem.name,
    label: apiItem.name,
    image: apiItem.thumbnail ? { uri: apiItem.thumbnail } : null,
    type: "movie",
    startPositionMs: positionMs,
    watchProgressMs: positionMs,
    videoLengthMs: durationMs,
    progress,
  };
}
