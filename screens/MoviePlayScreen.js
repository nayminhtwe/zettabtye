import { Ionicons } from "@expo/vector-icons";
import { useEvent } from "expo";
import { useKeepAwake, activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { LinearGradient } from "expo-linear-gradient";
import * as NavigationBar from "expo-navigation-bar";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  Image,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useTVEventHandler as rnUseTVEventHandler } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { fetchContinueWatching, saveWatchProgress } from "../api/contentService";
import { extractListData } from "../api/mappers";
import { gillSans } from "../constants/fonts";
import { selectAuthAuthenticated } from "../store/auth/selectors";
import {
  resolveResumePositionMs,
  shouldSaveWatchProgress,
} from "../utils/watchProgress";

const APP_ICON = require("../assets/images/app-icon.png");

// react-native-tvos exposes useTVEventHandler; on phones it is a harmless no-op hook.
// Resolve once at module load so the hook order stays stable across renders.
const useRemoteControl =
  typeof rnUseTVEventHandler === "function" ? rnUseTVEventHandler : () => {};

const SEEK_STEP_SECONDS = 10;
const CONTROLS_HIDE_MS = 4000;
// Resume playback this long after the last scrub press (works even if key-up is missed).
const SCRUB_RESUME_MS = 700;
// Brief delay before resuming after a committed seek feels smoother on TV/box.
const SCRUB_PLAY_RESUME_MS = 120;
// Consecutive presses within this window accelerate the seek step.
const SCRUB_ACCEL_WINDOW_MS = 320;
// Cap acceleration at 6x (i.e. up to 60s per press when held).
const SCRUB_MAX_MULTIPLIER = 6;
const KEEP_AWAKE_TAG = "movie-playback";
const KEEP_AWAKE_REFRESH_MS = 25000;
const PROGRESS_THUMB_SIZE = 14;
const WATCH_PROGRESS_SAVE_MS = 5000;
const isPhone = Platform.isTV !== true;

function isLandscapeOrientation(orientation) {
  return (
    orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
    orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
  );
}

async function lockPortrait() {
  try {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  } catch (_error) {
    // ignore orientation lock errors (e.g. TV devices)
  }
}

async function lockLandscape() {
  try {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
  } catch (_error) {
    // ignore orientation lock errors (e.g. TV devices)
  }
}

async function enterImmersivePlayback() {
  if (Platform.OS !== "android") {
    return;
  }

  try {
    // With edgeToEdgeEnabled, only visibility/style APIs are supported.
    await NavigationBar.setVisibilityAsync("hidden");
  } catch (_error) {
    // ignore navigation bar errors (e.g. TV devices)
  }
}

async function exitImmersivePlayback() {
  if (Platform.OS !== "android") {
    return;
  }

  try {
    await NavigationBar.setVisibilityAsync("visible");
  } catch (_error) {
    // ignore navigation bar errors (e.g. TV devices)
  }
}

function resolveStreamUri(movie) {
  if (!movie) {
    return null;
  }

  const candidate = movie.streamUrl ?? movie.movieUrl ?? movie.url ?? null;
  if (typeof candidate === "string" && candidate.trim().length > 0) {
    return candidate.trim();
  }

  return null;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function readPlayerProgress(player) {
  if (!player) {
    return null;
  }

  try {
    return {
      position: player.currentTime ?? 0,
      duration: player.duration ?? 0,
      playing: Boolean(player.playing),
    };
  } catch (_error) {
    return null;
  }
}

function resolveMatchTeams(movie) {
  if (!movie) {
    return { home: "", away: "" };
  }

  if (movie.home || movie.away) {
    return {
      home: movie.home ?? "",
      away: movie.away ?? "",
    };
  }

  const title = typeof movie.title === "string" ? movie.title : "";
  const parts = title.split(/\s+vs\s+/i);
  if (parts.length === 2) {
    return {
      home: parts[0].trim(),
      away: parts[1].trim(),
    };
  }

  return { home: title, away: "" };
}

export default function MoviePlayScreen({ movie, onBack }) {
  useKeepAwake(KEEP_AWAKE_TAG, { suppressDeactivateWarnings: true });

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isAuthenticated = useSelector(selectAuthAuthenticated);

  const streamUri = resolveStreamUri(movie);
  const isLive = Boolean(movie?.isLive);
  const isMatchPlayback = movie?.type === "match" || isLive;
  const matchTeams = resolveMatchTeams(movie);
  const canTrackWatchProgress = isAuthenticated && !isLive && !isMatchPlayback && movie?.id != null;

  const [isFullscreen, setIsFullscreen] = useState(true);
  const [deviceOrientation, setDeviceOrientation] = useState(
    ScreenOrientation.Orientation.PORTRAIT_UP,
  );
  const [controlsVisible, setControlsVisible] = useState(true);
  const [focusZone, setFocusZone] = useState("surface");
  const [focusedControl, setFocusedControl] = useState("play");
  const [progress, setProgress] = useState({ position: 0, duration: 0 });
  const [scrub, setScrub] = useState({ active: false, preview: 0 });
  const [isSeeking, setIsSeeking] = useState(false);
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false);
  const [centerShowsPause, setCenterShowsPause] = useState(false);
  const [resumeLookupDone, setResumeLookupDone] = useState(true);

  const hideTimerRef = useRef(null);
  const resumeTimerRef = useRef(null);
  const playPauseRef = useRef(null);
  const scrubRef = useRef({
    active: false,
    target: 0,
    wasPlaying: false,
    lastPressTs: 0,
    multiplier: 1,
  });
  const playbackIntentRef = useRef(true);
  const progressTrackWidthRef = useRef(0);
  const surfaceLaidOutRef = useRef(false);
  const toggleLockRef = useRef(false);
  const resumePositionSecondsRef = useRef(0);
  const resumeAppliedRef = useRef(false);
  const watchProgressSaveRef = useRef({ lastSavedMs: 0, lastSavedAt: 0 });
  const movieIdRef = useRef(movie?.id);
  const playbackProgressRef = useRef({ position: 0, duration: 0 });
  const isLeavingRef = useRef(false);
  const flushWatchProgressRef = useRef(null);

  const dimensionsAreLandscape = width > height;
  const orientationIsLandscape = isLandscapeOrientation(deviceOrientation);
  const showLandscapeLayout = isFullscreen && dimensionsAreLandscape && orientationIsLandscape;
  const shouldMountVideoView =
    Boolean(streamUri) && (Platform.isTV === true || !isFullscreen || showLandscapeLayout);
  const landscapeOverlayInsets = showLandscapeLayout
    ? {
        paddingTop: Math.max(insets.top, 8),
        paddingBottom: Math.max(insets.bottom, 8),
        paddingLeft: Math.max(insets.left, 0),
        paddingRight: Math.max(insets.right, 0),
      }
    : null;

  const portraitVideoHeight = Math.round(Math.min(width, height) * (9 / 16));

  useEffect(() => {
    movieIdRef.current = movie?.id;
  }, [movie?.id]);

  useEffect(() => {
    resumeAppliedRef.current = false;
    resumePositionSecondsRef.current = 0;

    if (!canTrackWatchProgress) {
      setResumeLookupDone(true);
      return undefined;
    }

    const fromMovie = resolveResumePositionMs(movie?.startPositionMs, movie?.videoLengthMs);
    if (fromMovie > 0) {
      resumePositionSecondsRef.current = fromMovie / 1000;
      setResumeLookupDone(true);
      return undefined;
    }

    setResumeLookupDone(false);
    let cancelled = false;

    (async () => {
      try {
        const response = await fetchContinueWatching();
        const items = extractListData(response);
        const match = items.find((item) => String(item.id) === String(movie.id));
        if (cancelled || !match) {
          return;
        }

        const resumeMs = resolveResumePositionMs(match.watching_minute, match.video_length);
        if (resumeMs > 0) {
          resumePositionSecondsRef.current = resumeMs / 1000;
        }
      } catch (_error) {
        // ignore resume lookup failures
      } finally {
        if (!cancelled) {
          setResumeLookupDone(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    canTrackWatchProgress,
    movie?.id,
    movie?.startPositionMs,
    movie?.videoLengthMs,
    streamUri,
  ]);

  const flushWatchProgress = useCallback(async (positionSeconds, durationSeconds) => {
    if (!canTrackWatchProgress || !movieIdRef.current) {
      return;
    }

    const positionMs = Math.floor((positionSeconds ?? 0) * 1000);
    const durationMs = Math.floor((durationSeconds ?? 0) * 1000);
    if (!shouldSaveWatchProgress(positionMs, durationMs)) {
      return;
    }

    const saveState = watchProgressSaveRef.current;
    if (
      Math.abs(positionMs - saveState.lastSavedMs) < 1000 &&
      Date.now() - saveState.lastSavedAt < 4000
    ) {
      return;
    }

    try {
      await saveWatchProgress(movieIdRef.current, positionMs);
      watchProgressSaveRef.current = {
        lastSavedMs: positionMs,
        lastSavedAt: Date.now(),
      };
    } catch (_error) {
      // ignore save failures during playback
    }
  }, [canTrackWatchProgress]);

  useEffect(() => {
    flushWatchProgressRef.current = flushWatchProgress;
  }, [flushWatchProgress]);

  useEffect(() => {
    isLeavingRef.current = false;
    playbackProgressRef.current = { position: 0, duration: 0 };

    return () => {
      isLeavingRef.current = true;
      const { position, duration } = playbackProgressRef.current;
      flushWatchProgressRef.current?.(position, duration);
    };
  }, [streamUri]);

  useEffect(() => {
    if (showLandscapeLayout) {
      enterImmersivePlayback();
      return () => {
        exitImmersivePlayback();
      };
    }

    exitImmersivePlayback();
    return undefined;
  }, [showLandscapeLayout]);

  const player = useVideoPlayer(streamUri, (instance) => {
    if (!instance) {
      return;
    }
    instance.loop = false;
    instance.timeUpdateEventInterval = 1;
  });

  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player?.playing ?? false,
  });
  const { status, error } = useEvent(player, "statusChange", {
    status: player?.status ?? "idle",
    error: null,
  });

  const isBuffering = status === "loading" || status === "idle";
  const hasError = status === "error" || (!streamUri && !!movie);

  const sustainScreenWake = useCallback(() => {
    if (isLeavingRef.current || !streamUri) {
      return;
    }

    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
  }, [streamUri]);

  useEffect(() => {
    if (!streamUri) {
      return undefined;
    }

    sustainScreenWake();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        sustainScreenWake();
      }
    });

    const interval = setInterval(sustainScreenWake, KEEP_AWAKE_REFRESH_MS);

    return () => {
      subscription.remove();
      clearInterval(interval);
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, [streamUri, sustainScreenWake]);

  useEffect(() => {
    if (!streamUri || isLeavingRef.current) {
      return;
    }

    if (isPlaying || isLive || status === "loading" || status === "readyToPlay") {
      sustainScreenWake();
    }
  }, [isPlaying, isLive, status, streamUri, sustainScreenWake]);

  useEffect(() => {
    if (!player || !canTrackWatchProgress) {
      return undefined;
    }

    const interval = setInterval(() => {
      if (isLeavingRef.current) {
        return;
      }

      const snapshot = readPlayerProgress(player);
      if (!snapshot?.playing) {
        return;
      }

      playbackProgressRef.current = {
        position: snapshot.position,
        duration: snapshot.duration,
      };
      flushWatchProgress(snapshot.position, snapshot.duration);
    }, WATCH_PROGRESS_SAVE_MS);

    return () => clearInterval(interval);
  }, [player, canTrackWatchProgress, flushWatchProgress]);

  const showPoster =
    !isMatchPlayback &&
    !!movie?.image &&
    !hasError &&
    !hasStartedPlayback &&
    !scrub.active &&
    !isSeeking &&
    (isBuffering || !isPlaying);

  useEffect(() => {
    if (isPlaying) {
      setHasStartedPlayback(true);
      setCenterShowsPause(playbackIntentRef.current);
      setIsSeeking(false);
      return;
    }

    if (!playbackIntentRef.current) {
      setCenterShowsPause(false);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!player || isLive || resumeAppliedRef.current || !resumeLookupDone || isLeavingRef.current) {
      return;
    }

    const resumeSeconds = resumePositionSecondsRef.current;
    if (resumeSeconds <= 0 || status !== "readyToPlay") {
      return;
    }

    try {
      player.currentTime = resumeSeconds;
      resumeAppliedRef.current = true;
      playbackProgressRef.current = {
        position: resumeSeconds,
        duration: playbackProgressRef.current.duration,
      };
      setProgress((current) => ({
        ...current,
        position: resumeSeconds,
      }));
    } catch (_error) {
      // ignore seek errors; playback can still start from the beginning
    }
  }, [player, status, isLive, resumeLookupDone]);

  useEffect(() => {
    surfaceLaidOutRef.current = false;
    setHasStartedPlayback(false);
    setCenterShowsPause(false);
    playbackIntentRef.current = true;
  }, [streamUri]);

  useEffect(() => {
    if (!shouldMountVideoView) {
      surfaceLaidOutRef.current = false;
    }
  }, [shouldMountVideoView]);

  const tryStartPlayback = useCallback(() => {
    if (
      scrubRef.current.active ||
      !player ||
      !streamUri ||
      !playbackIntentRef.current ||
      !resumeLookupDone ||
      status !== "readyToPlay" ||
      !surfaceLaidOutRef.current ||
      isLeavingRef.current
    ) {
      return;
    }

    const snapshot = readPlayerProgress(player);
    if (!snapshot || snapshot.playing) {
      return;
    }

    const resumeSeconds = resumePositionSecondsRef.current;
    if (!resumeAppliedRef.current && resumeSeconds > 0) {
      try {
        player.currentTime = resumeSeconds;
        resumeAppliedRef.current = true;
        playbackProgressRef.current = {
          position: resumeSeconds,
          duration: snapshot.duration,
        };
        setProgress((current) => ({
          ...current,
          position: resumeSeconds,
        }));
      } catch (_error) {
        // ignore seek errors during layout transitions
      }
    }

    try {
      player.play();
    } catch (_error) {
      // ignore resume errors during layout transitions
    }
  }, [player, streamUri, status, resumeLookupDone]);

  useEffect(() => {
    tryStartPlayback();
  }, [status, tryStartPlayback]);

  // Native players often pause when the video surface is resized or reattached.
  useEffect(() => {
    if (!player || !streamUri || !playbackIntentRef.current) {
      return undefined;
    }

    const timer = setTimeout(() => {
      tryStartPlayback();
    }, 150);

    return () => clearTimeout(timer);
  }, [width, height, showLandscapeLayout, player, streamUri, tryStartPlayback]);

  // Keep a lightweight progress poll so the scrubber stays in sync without native controls.
  useEffect(() => {
    if (!player || isLive) {
      return undefined;
    }

    const interval = setInterval(() => {
      if (scrubRef.current.active || isLeavingRef.current) {
        return;
      }

      const snapshot = readPlayerProgress(player);
      if (!snapshot) {
        return;
      }

      playbackProgressRef.current = {
        position: snapshot.position,
        duration: snapshot.duration,
      };
      setProgress(snapshot);
    }, 500);

    return () => clearInterval(interval);
  }, [player, isLive]);

  useEffect(() => {
    let mounted = true;

    const syncOrientation = async () => {
      const info = await ScreenOrientation.getOrientationAsync();
      if (mounted) {
        setDeviceOrientation(info);
      }
    };

    syncOrientation();
    setIsFullscreen(true);
    lockLandscape();

    const subscription = ScreenOrientation.addOrientationChangeListener((event) => {
      setDeviceOrientation(event.orientationInfo.orientation);
    });

    return () => {
      mounted = false;
      ScreenOrientation.removeOrientationChangeListener(subscription);
      exitImmersivePlayback();
      lockPortrait();
    };
  }, []);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, CONTROLS_HIDE_MS);
  }, [clearHideTimer]);

  const hideControls = useCallback(() => {
    clearHideTimer();
    setControlsVisible(false);
  }, [clearHideTimer]);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    scheduleHide();
    return clearHideTimer;
  }, [scheduleHide, clearHideTimer]);

  const togglePlay = useCallback(() => {
    if (!player || toggleLockRef.current || isLeavingRef.current) {
      return;
    }

    const snapshot = readPlayerProgress(player);
    if (!snapshot) {
      return;
    }

    toggleLockRef.current = true;
    setTimeout(() => {
      toggleLockRef.current = false;
    }, 400);

    try {
      if (snapshot.playing) {
        playbackIntentRef.current = false;
        setCenterShowsPause(false);
        player.pause();
      } else {
        playbackIntentRef.current = true;
        setCenterShowsPause(true);
        player.play();
      }
    } catch (_error) {
      // ignore released player errors
    }
    revealControls();
  }, [player, revealControls]);

  const seekBy = useCallback(
    (delta) => {
      if (!player || isLive || isLeavingRef.current) {
        return;
      }

      try {
        player.seekBy(delta);
      } catch (_error) {
        // ignore released player errors
      }
      revealControls();
    },
    [player, isLive, revealControls],
  );

  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  // Commit the pending scrub target and resume playback if it was playing.
  const endScrub = useCallback(() => {
    const state = scrubRef.current;
    clearResumeTimer();
    if (!state.active) {
      return;
    }

    if (player) {
      try {
        player.currentTime = state.target;
        if (state.wasPlaying) {
          playbackIntentRef.current = true;
          setCenterShowsPause(true);
          setTimeout(() => {
            try {
              if (playbackIntentRef.current && !scrubRef.current.active && !isLeavingRef.current) {
                player.play();
              }
            } catch (_error) {
              // ignore resume errors
            }
          }, SCRUB_PLAY_RESUME_MS);
        }
      } catch (_error) {
        // ignore seek errors
      }
    }

    state.active = false;
    state.multiplier = 1;
    setScrub({ active: false, preview: 0 });
  }, [player, clearResumeTimer]);

  const scheduleResume = useCallback(() => {
    clearResumeTimer();
    resumeTimerRef.current = setTimeout(endScrub, SCRUB_RESUME_MS);
  }, [clearResumeTimer, endScrub]);

  const beginScrubSession = useCallback(() => {
    const state = scrubRef.current;
    if (!player || state.active || isLeavingRef.current) {
      return;
    }

    const snapshot = readPlayerProgress(player);
    if (!snapshot) {
      return;
    }

    state.active = true;
    state.wasPlaying = playbackIntentRef.current || snapshot.playing;
    state.target = snapshot.position;
    playbackIntentRef.current = false;
    setCenterShowsPause(false);
    setIsSeeking(true);

    try {
      player.pause();
    } catch (_error) {
      // ignore
    }
  }, [player]);

  // UI-only scrub while holding; one native seek on release (endScrub).
  const scrubStep = useCallback(
    (direction) => {
      if (!player || isLive || isLeavingRef.current) {
        return;
      }

      const snapshot = readPlayerProgress(player);
      if (!snapshot) {
        return;
      }

      const duration = snapshot.duration;
      if (duration <= 0) {
        try {
          player.seekBy(direction * SEEK_STEP_SECONDS);
        } catch (_error) {
          // ignore released player errors
        }
        revealControls();
        return;
      }

      const state = scrubRef.current;
      const now = Date.now();

      if (!state.active) {
        beginScrubSession();
        state.multiplier = 1;
        state.lastPressTs = 0;
      } else {
        state.multiplier =
          now - state.lastPressTs <= SCRUB_ACCEL_WINDOW_MS
            ? Math.min(state.multiplier + 1, SCRUB_MAX_MULTIPLIER)
            : 1;
      }

      state.lastPressTs = now;
      const step = SEEK_STEP_SECONDS * state.multiplier;
      state.target = Math.max(0, Math.min(duration, state.target + direction * step));

      setScrub({ active: true, preview: state.target });
      revealControls();
      scheduleResume();
    },
    [player, isLive, beginScrubSession, revealControls, scheduleResume],
  );

  useEffect(() => clearResumeTimer, [clearResumeTimer]);

  const updateProgressDrag = useCallback(
    (locationX) => {
      if (!player || isLive || !isPhone) {
        return;
      }

      const duration = player.duration ?? progress.duration ?? 0;
      const trackWidth = progressTrackWidthRef.current;
      if (duration <= 0 || trackWidth <= 0) {
        return;
      }

      const ratio = Math.max(0, Math.min(1, locationX / trackWidth));
      const target = ratio * duration;
      const state = scrubRef.current;

      if (!state.active) {
        beginScrubSession();
      }

      state.target = target;
      setScrub({ active: true, preview: target });
      revealControls();
    },
    [player, isLive, progress.duration, beginScrubSession, revealControls],
  );

  const progressPanResponder = useMemo(() => {
    if (!isPhone) {
      return null;
    }

    return PanResponder.create({
      onStartShouldSetPanResponder: () => !isLive,
      onMoveShouldSetPanResponder: () => !isLive,
      onPanResponderGrant: (event) => {
        clearResumeTimer();
        updateProgressDrag(event.nativeEvent.locationX);
      },
      onPanResponderMove: (event) => {
        updateProgressDrag(event.nativeEvent.locationX);
      },
      onPanResponderRelease: () => {
        endScrub();
      },
      onPanResponderTerminate: () => {
        endScrub();
      },
    });
  }, [clearResumeTimer, endScrub, isLive, updateProgressDrag]);

  const toggleExpand = useCallback(async () => {
    revealControls();
    if (isFullscreen) {
      setIsFullscreen(false);
      await exitImmersivePlayback();
      await lockPortrait();
      return;
    }

    setIsFullscreen(true);
    await lockLandscape();
    if (width > height) {
      await enterImmersivePlayback();
    }
  }, [isFullscreen, revealControls, width, height]);

  const handleBack = useCallback(async () => {
    clearHideTimer();
    playbackIntentRef.current = false;
    isLeavingRef.current = true;

    const snapshot = readPlayerProgress(player) ?? playbackProgressRef.current;
    playbackProgressRef.current = {
      position: snapshot.position ?? 0,
      duration: snapshot.duration ?? 0,
    };
    await flushWatchProgress(snapshot.position ?? 0, snapshot.duration ?? 0);

    try {
      player?.pause();
    } catch (_error) {
      // ignore released player errors during exit
    }

    onBack?.();
  }, [clearHideTimer, flushWatchProgress, onBack, player]);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return undefined;
    }

    const onHardwareBack = () => {
      handleBack();
      return true;
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onHardwareBack);
    return () => subscription.remove();
  }, [handleBack]);

  // Robust D-pad handling. The video surface acts as a scrub zone (left/right seek),
  // while the bottom transport bar uses native focus movement + onPress.
  // Key-down drives scrubbing (with acceleration); key-up resumes playback.
  const handleTVEvent = useCallback(
    (event) => {
      if (!event) {
        return;
      }

      const type = event.eventType;
      const isKeyUp = event.eventKeyAction === 1;

      // Media transport keys on press; hold FF/rewind scrubs smoothly like D-pad right/left.
      if (!isKeyUp) {
        if (type === "playPause" || type === "play" || type === "pause") {
          togglePlay();
          return;
        }
        if (type === "fastForward") {
          scrubStep(1);
          return;
        }
        if (type === "rewind") {
          scrubStep(-1);
          return;
        }
      }
      if (type === "menu") {
        handleBack();
        return;
      }

      const isDirectional =
        type === "left" || type === "right" || type === "up" || type === "down";
      const isSelect = type === "select";

      if (!isDirectional && !isSelect) {
        return;
      }

      // On release, commit a held scrub or handle a single tap.
      if (isKeyUp) {
        if (type === "select" && focusZone === "surface") {
          togglePlay();
          return;
        }
        if (type === "fastForward" || type === "rewind") {
          if (scrubRef.current.active) {
            endScrub();
          } else {
            seekBy(type === "fastForward" ? SEEK_STEP_SECONDS : -SEEK_STEP_SECONDS);
          }
          return;
        }
        if ((type === "left" || type === "right") && focusZone === "surface") {
          if (scrubRef.current.active) {
            endScrub();
          } else {
            seekBy(type === "left" ? -SEEK_STEP_SECONDS : SEEK_STEP_SECONDS);
          }
        }
        return;
      }

      // First wake the UI if hidden; the same press should not also seek/move.
      if (!controlsVisible) {
        revealControls();
        return;
      }

      revealControls();

      // When the scrub surface is focused, left/right scrub instead of moving focus.
      if (focusZone === "surface") {
        if (type === "left") {
          scrubStep(-1);
        } else if (type === "right") {
          scrubStep(1);
        }
      }
    },
    [controlsVisible, focusZone, handleBack, revealControls, seekBy, togglePlay, scrubStep, endScrub],
  );

  // Robust remote handling on tvOS/Android TV; no-op on phones.
  useRemoteControl(handleTVEvent);

  if (!movie) {
    return null;
  }

  const displayPosition = scrub.active ? scrub.preview : progress.position;
  const canSeek = !isLive && progress.duration > 0;
  const progressRatio = canSeek
    ? Math.max(0, Math.min(1, displayPosition / progress.duration))
    : isLive
      ? 1
      : 0;

  const showMatchLoadingTitle =
    isMatchPlayback &&
    !hasError &&
    isBuffering &&
    (matchTeams.home || matchTeams.away);

  const renderMatchLoadingTitle = () => (
    <View style={styles.matchTitleRow} pointerEvents="none">
      {matchTeams.home ? (
        <Text style={styles.matchTeamName} numberOfLines={2}>
          {matchTeams.home}
        </Text>
      ) : null}

      <View style={styles.matchLogoWrap}>
        <Image source={APP_ICON} resizeMode="contain" style={styles.matchLogo} />
      </View>

      {matchTeams.away ? (
        <Text style={styles.matchTeamName} numberOfLines={2}>
          {matchTeams.away}
        </Text>
      ) : null}
    </View>
  );

  const renderVideoSurface = () => (
    <>
      {streamUri && shouldMountVideoView ? (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          nativeControls={false}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          surfaceType={Platform.OS === "android" ? "textureView" : undefined}
          onLayout={(event) => {
            const { width: layoutWidth, height: layoutHeight } = event.nativeEvent.layout;
            surfaceLaidOutRef.current = layoutWidth > 0 && layoutHeight > 0;
            tryStartPlayback();
          }}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.videoPlaceholder]} />
      )}

      {showPoster ? (
        <Image source={movie.image} resizeMode="contain" style={StyleSheet.absoluteFill} />
      ) : null}
    </>
  );

  const showCenterLoading =
    !hasError &&
    !scrub.active &&
    !isSeeking &&
    !hasStartedPlayback &&
    playbackIntentRef.current &&
    (isBuffering || status === "readyToPlay");

  const renderCenterPlay = () => {
    if ((scrub.active || isSeeking) && !hasError) {
      return (
        <View style={styles.centerStatusWrap} pointerEvents="none">
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      );
    }

    if (showCenterLoading) {
      return (
        <View
          style={[styles.centerStatusWrap, showMatchLoadingTitle ? styles.centerStatusMatchLoading : null]}
          pointerEvents="none"
        >
          {showMatchLoadingTitle ? renderMatchLoadingTitle() : null}
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      );
    }

    if (hasError) {
      return (
        <View style={styles.centerStatusWrap}>
          <Ionicons name="alert-circle-outline" size={40} color="#FF6B6B" />
          <Text style={styles.errorText}>
            {streamUri
              ? "This stream is unavailable right now."
              : "This video isn't available to play yet."}
          </Text>
        </View>
      );
    }

    return (
      <Pressable
        ref={playPauseRef}
        style={[styles.centerPlayButton, focusedControl === "play" ? styles.centerPlayButtonFocused : null]}
        hasTVPreferredFocus
        onFocus={() => {
          setFocusZone("surface");
          setFocusedControl("play");
          revealControls();
        }}
        onPress={togglePlay}
      >
        <Ionicons
          name={centerShowsPause ? "pause" : "play"}
          size={36}
          color="#FFFFFF"
          style={centerShowsPause ? null : styles.centerPlayIcon}
        />
      </Pressable>
    );
  };

  const renderControlsBar = () => (
    <View style={styles.controlsRoot}>
      <View style={styles.timelineRow}>
        <Text style={[styles.timeText, scrub.active ? styles.timeTextScrubbing : null]}>
          {isLive ? "LIVE" : formatTime(displayPosition)}
        </Text>
        <View
          style={styles.progressTrackWrap}
          onLayout={(event) => {
            progressTrackWidthRef.current = event.nativeEvent.layout.width;
          }}
          {...(canSeek && progressPanResponder ? progressPanResponder.panHandlers : null)}
        >
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressRatio * 100}%` },
                isLive ? styles.progressFillLive : null,
              ]}
            />
          </View>
          {canSeek && isPhone ? (
            <View
              pointerEvents="none"
              style={[
                styles.progressThumb,
                {
                  left: `${progressRatio * 100}%`,
                  transform: [
                    { translateX: -PROGRESS_THUMB_SIZE / 2 },
                    ...(scrub.active ? [{ scale: 1.15 }] : []),
                  ],
                },
              ]}
            />
          ) : null}
        </View>
        <Text style={styles.timeText}>{isLive ? "" : formatTime(progress.duration)}</Text>
      </View>

      <View style={styles.controlsRow}>
        <View style={styles.transportRow}>
          {!isLive ? (
            <Pressable
              style={[styles.controlButton, focusedControl === "rewind" ? styles.controlButtonFocused : null]}
              onFocus={() => {
                setFocusZone("controls");
                setFocusedControl("rewind");
                revealControls();
              }}
              onPress={() => seekBy(-SEEK_STEP_SECONDS)}
            >
              <Ionicons name="play-back" size={22} color="#FFFFFF" />
            </Pressable>
          ) : null}

          <Pressable
            style={[styles.controlButton, focusedControl === "toggle" ? styles.controlButtonFocused : null]}
            onFocus={() => {
              setFocusZone("controls");
              setFocusedControl("toggle");
              revealControls();
            }}
            onPress={togglePlay}
          >
            <Ionicons name={isPlaying ? "pause" : "play"} size={22} color="#FFFFFF" />
          </Pressable>

          {!isLive ? (
            <Pressable
              style={[styles.controlButton, focusedControl === "forward" ? styles.controlButtonFocused : null]}
              onFocus={() => {
                setFocusZone("controls");
                setFocusedControl("forward");
                revealControls();
              }}
              onPress={() => seekBy(SEEK_STEP_SECONDS)}
            >
              <Ionicons name="play-forward" size={22} color="#FFFFFF" />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          style={[styles.controlButton, focusedControl === "expand" ? styles.controlButtonFocused : null]}
          onFocus={() => {
            setFocusZone("controls");
            setFocusedControl("expand");
            revealControls();
          }}
          onPress={toggleExpand}
        >
          <Ionicons name={showLandscapeLayout ? "contract" : "expand"} size={22} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );

  const renderBackButton = (style) => (
    <Pressable
      style={[style, focusedControl === "back" ? styles.backButtonFocused : null]}
      onFocus={() => {
        setFocusZone("controls");
        setFocusedControl("back");
        revealControls();
      }}
      onPress={handleBack}
    >
      <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <StatusBar hidden={isFullscreen} style="light" />

      <View style={isFullscreen ? styles.fullscreenHost : styles.portraitHost}>
        <View
          style={[
            styles.videoShell,
            isFullscreen
              ? StyleSheet.absoluteFillObject
              : { height: portraitVideoHeight },
          ]}
        >
          {renderVideoSurface()}

          {!controlsVisible ? (
            <Pressable
              style={StyleSheet.absoluteFill}
              onFocus={() => setFocusZone("surface")}
              onPress={revealControls}
            />
          ) : (
            <>
              <Pressable
                style={StyleSheet.absoluteFill}
                onFocus={() => setFocusZone("surface")}
                onPress={hideControls}
              />
              <LinearGradient
                colors={
                  showLandscapeLayout || isFullscreen
                    ? ["rgba(0,0,0,0.55)", "transparent", "rgba(0,0,0,0.85)"]
                    : ["rgba(0,0,0,0.45)", "transparent", "rgba(0,0,0,0.9)"]
                }
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View
                style={[
                  showLandscapeLayout ? styles.landscapeOverlay : styles.portraitVideoOverlay,
                  landscapeOverlayInsets,
                ]}
                pointerEvents="box-none"
              >
                {renderBackButton(
                  showLandscapeLayout
                    ? styles.backButton
                    : [styles.portraitBackButton, { top: insets.top }],
                )}
                <View
                  style={styles.centerPlayWrap}
                  pointerEvents="box-none"
                >
                  {renderCenterPlay()}
                </View>
                {showLandscapeLayout ? (
                  <View
                    style={[
                      styles.landscapeControlsWrap,
                      {
                        paddingHorizontal: Math.max(insets.left, insets.right, 16),
                        paddingBottom: Math.max(insets.bottom, 8),
                      },
                    ]}
                    pointerEvents="box-none"
                  >
                    {renderControlsBar()}
                  </View>
                ) : (
                  renderControlsBar()
                )}
              </View>
            </>
          )}

          {!controlsVisible && !isFullscreen ? (
            renderBackButton([styles.portraitBackButton, { top: insets.top }])
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
    overflow: "hidden",
  },
  portraitHost: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenHost: {
    ...StyleSheet.absoluteFillObject,
  },
  videoShell: {
    width: "100%",
    backgroundColor: "#000000",
    overflow: "hidden",
  },
  portraitBackButton: {
    position: "absolute",
    left: 8,
    width: 44,
    height: 44,
    zIndex: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  portraitVideoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  videoPlaceholder: {
    backgroundColor: "#0A0A0A",
  },
  matchTitleRow: {
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  matchLogoWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  matchLogo: {
    width: 48,
    height: 48,
  },
  matchTeamName: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 26,
    textAlign: "center",
    ...gillSans("700"),
  },
  landscapeOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  centerPlayWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerStatusWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  centerStatusMatchLoading: {
    paddingTop: 36,
  },
  errorText: {
    marginTop: 12,
    color: "#FFFFFF",
    fontSize: 15,
    textAlign: "center",
  },
  landscapeControlsWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  backButton: {
    position: "absolute",
    top: 4,
    left: 8,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  backButtonFocused: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
    borderRadius: 22,
  },
  centerPlayButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  centerPlayButtonFocused: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(231, 24, 9, 0.4)",
  },
  centerPlayIcon: {
    marginLeft: 4,
  },
  controlsRoot: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timeText: {
    minWidth: 44,
    color: "#FFFFFF",
    fontSize: 12,
    textAlign: "center",
  },
  timeTextScrubbing: {
    color: "#E71809",
    fontWeight: "700",
  },
  progressTrackWrap: {
    flex: 1,
    height: 28,
    justifyContent: "center",
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#E71809",
  },
  progressFillLive: {
    backgroundColor: "#E71809",
  },
  progressThumb: {
    position: "absolute",
    top: "50%",
    width: PROGRESS_THUMB_SIZE,
    height: PROGRESS_THUMB_SIZE,
    marginTop: -PROGRESS_THUMB_SIZE / 2,
    borderRadius: PROGRESS_THUMB_SIZE / 2,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E71809",
  },
  controlsRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  transportRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  controlButtonFocused: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(231, 24, 9, 0.3)",
  },
});
