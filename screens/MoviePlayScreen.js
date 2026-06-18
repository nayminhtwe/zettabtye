import { Ionicons } from "@expo/vector-icons";
import { useEvent } from "expo";
import { useKeepAwake } from "expo-keep-awake";
import { LinearGradient } from "expo-linear-gradient";
import * as NavigationBar from "expo-navigation-bar";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { gillSans } from "../constants/fonts";

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
const PROGRESS_THUMB_SIZE = 14;
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
  useKeepAwake(KEEP_AWAKE_TAG);

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const streamUri = resolveStreamUri(movie);
  const isLive = Boolean(movie?.isLive);
  const isMatchPlayback = movie?.type === "match" || isLive;
  const matchTeams = resolveMatchTeams(movie);

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
      setIsSeeking(false);
    }
  }, [isPlaying]);

  useEffect(() => {
    surfaceLaidOutRef.current = false;
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
      status !== "readyToPlay" ||
      !surfaceLaidOutRef.current ||
      player.playing
    ) {
      return;
    }

    try {
      player.play();
    } catch (_error) {
      // ignore resume errors during layout transitions
    }
  }, [player, streamUri, status]);

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
      if (scrubRef.current.active) {
        return;
      }

      setProgress({
        position: player.currentTime ?? 0,
        duration: player.duration ?? 0,
      });
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
    if (!player) {
      return;
    }

    if (player.playing) {
      playbackIntentRef.current = false;
      player.pause();
    } else {
      playbackIntentRef.current = true;
      player.play();
    }
    revealControls();
  }, [player, revealControls]);

  const seekBy = useCallback(
    (delta) => {
      if (!player || isLive) {
        return;
      }
      player.seekBy(delta);
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
          setTimeout(() => {
            try {
              if (playbackIntentRef.current && !scrubRef.current.active) {
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
    if (!player || state.active) {
      return;
    }

    state.active = true;
    state.wasPlaying = playbackIntentRef.current || player.playing;
    state.target = player.currentTime ?? 0;
    playbackIntentRef.current = false;
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
      if (!player || isLive) {
        return;
      }

      const duration = player.duration ?? 0;
      if (duration <= 0) {
        player.seekBy(direction * SEEK_STEP_SECONDS);
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

  const handleBack = useCallback(() => {
    clearHideTimer();
    playbackIntentRef.current = false;
    if (player) {
      try {
        player.pause();
      } catch (_error) {
        // ignore
      }
    }
    onBack?.();
  }, [clearHideTimer, onBack, player]);

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

  const renderCenterPlay = () => {
    if ((scrub.active || isSeeking) && !hasError) {
      return (
        <View style={styles.centerStatusWrap} pointerEvents="none">
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      );
    }

    if (isBuffering && !hasError) {
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
          name={isPlaying ? "pause" : "play"}
          size={36}
          color="#FFFFFF"
          style={isPlaying ? null : styles.centerPlayIcon}
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
