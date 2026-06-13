import { Ionicons } from "@expo/vector-icons";
import { useEvent } from "expo";
import { useKeepAwake } from "expo-keep-awake";
import { LinearGradient } from "expo-linear-gradient";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
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

const APP_LOGO = require("../assets/images/logo.png");

// react-native-tvos exposes useTVEventHandler; on phones it is a harmless no-op hook.
// Resolve once at module load so the hook order stays stable across renders.
const useRemoteControl =
  typeof rnUseTVEventHandler === "function" ? rnUseTVEventHandler : () => {};

const SEEK_STEP_SECONDS = 10;
const CONTROLS_HIDE_MS = 4000;
// Resume playback this long after the last scrub press (works even if key-up is missed).
const SCRUB_RESUME_MS = 700;
// Consecutive presses within this window accelerate the seek step.
const SCRUB_ACCEL_WINDOW_MS = 320;
// Cap acceleration at 6x (i.e. up to 60s per press when held).
const SCRUB_MAX_MULTIPLIER = 6;
const KEEP_AWAKE_TAG = "movie-playback";

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

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deviceOrientation, setDeviceOrientation] = useState(
    ScreenOrientation.Orientation.PORTRAIT_UP,
  );
  const [controlsVisible, setControlsVisible] = useState(true);
  const [focusZone, setFocusZone] = useState("surface");
  const [focusedControl, setFocusedControl] = useState("play");
  const [progress, setProgress] = useState({ position: 0, duration: 0 });
  const [scrub, setScrub] = useState({ active: false, preview: 0 });

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

  const dimensionsAreLandscape = width > height;
  const orientationIsLandscape = isLandscapeOrientation(deviceOrientation);
  const showLandscapeLayout = isFullscreen && dimensionsAreLandscape && orientationIsLandscape;

  const player = useVideoPlayer(streamUri, (instance) => {
    if (!instance) {
      return;
    }
    instance.loop = false;
    instance.timeUpdateEventInterval = 1;
    if (streamUri) {
      instance.play();
    }
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

  // Native players often pause when the video surface is resized or reattached.
  useEffect(() => {
    if (
      status !== "readyToPlay" ||
      !player ||
      !playbackIntentRef.current ||
      player.playing
    ) {
      return;
    }

    try {
      player.play();
    } catch (_error) {
      // ignore resume errors during layout transitions
    }
  }, [status, player]);

  useEffect(() => {
    if (!player || !streamUri || !playbackIntentRef.current) {
      return undefined;
    }

    const timer = setTimeout(() => {
      try {
        if (!player.playing && status !== "error") {
          player.play();
        }
      } catch (_error) {
        // ignore resume errors during orientation changes
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [width, height, showLandscapeLayout, player, streamUri, status]);

  // Keep a lightweight progress poll so the scrubber stays in sync without native controls.
  useEffect(() => {
    if (!player || isLive) {
      return undefined;
    }

    const interval = setInterval(() => {
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
    lockPortrait();

    const subscription = ScreenOrientation.addOrientationChangeListener((event) => {
      setDeviceOrientation(event.orientationInfo.orientation);
    });

    return () => {
      mounted = false;
      ScreenOrientation.removeOrientationChangeListener(subscription);
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
          player.play();
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

  // Pause-while-scrubbing with hold-to-accelerate steps; resumes on release or idle.
  const scrubStep = useCallback(
    (direction) => {
      if (!player || isLive) {
        return;
      }

      const duration = player.duration ?? 0;
      if (duration <= 0) {
        // Duration not known yet — fall back to a simple relative seek.
        player.seekBy(direction * SEEK_STEP_SECONDS);
        revealControls();
        return;
      }

      const state = scrubRef.current;
      const now = Date.now();

      if (!state.active) {
        state.active = true;
        state.wasPlaying = player.playing;
        state.target = player.currentTime ?? 0;
        state.multiplier = 1;
        try {
          player.pause();
        } catch (_error) {
          // ignore
        }
      } else {
        state.multiplier =
          now - state.lastPressTs <= SCRUB_ACCEL_WINDOW_MS
            ? Math.min(state.multiplier + 1, SCRUB_MAX_MULTIPLIER)
            : 1;
      }

      state.lastPressTs = now;
      const step = SEEK_STEP_SECONDS * state.multiplier;
      state.target = Math.max(0, Math.min(duration, state.target + direction * step));

      try {
        player.currentTime = state.target;
      } catch (_error) {
        // ignore
      }

      setScrub({ active: true, preview: state.target });
      revealControls();
      scheduleResume();
    },
    [player, isLive, revealControls, scheduleResume],
  );

  useEffect(() => clearResumeTimer, [clearResumeTimer]);

  const toggleExpand = useCallback(async () => {
    revealControls();
    if (isFullscreen) {
      setIsFullscreen(false);
      await lockPortrait();
      return;
    }

    setIsFullscreen(true);
    await lockLandscape();
  }, [isFullscreen, revealControls]);

  const handleBack = useCallback(async () => {
    clearHideTimer();
    setIsFullscreen(false);
    playbackIntentRef.current = false;
    if (player) {
      try {
        player.pause();
      } catch (_error) {
        // ignore
      }
    }
    await lockPortrait();
    onBack?.();
  }, [clearHideTimer, onBack, player]);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return undefined;
    }

    const onHardwareBack = () => {
      if (isFullscreen) {
        toggleExpand();
        return true;
      }

      handleBack();
      return true;
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onHardwareBack);
    return () => subscription.remove();
  }, [handleBack, isFullscreen, toggleExpand]);

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

      // Media transport keys always work regardless of focus position (on press only).
      if (!isKeyUp) {
        if (type === "playPause" || type === "play" || type === "pause") {
          togglePlay();
          return;
        }
        if (type === "fastForward") {
          seekBy(SEEK_STEP_SECONDS);
          return;
        }
        if (type === "rewind") {
          seekBy(-SEEK_STEP_SECONDS);
          return;
        }
      }
      if (type === "menu") {
        return; // let system back handle it
      }

      const isDirectional =
        type === "left" || type === "right" || type === "up" || type === "down";
      const isSelect = type === "select";

      if (!isDirectional && !isSelect) {
        return;
      }

      // On release of a left/right hold over the surface, commit the seek and resume.
      if (isKeyUp) {
        if (type === "select" && focusZone === "surface") {
          togglePlay();
          return;
        }
        if ((type === "left" || type === "right") && focusZone === "surface") {
          if (scrubRef.current.active) {
            endScrub();
          } else {
            // Phone emulator often only dispatches key-up; tap arrow once to seek.
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
    [controlsVisible, focusZone, revealControls, seekBy, togglePlay, scrubStep, endScrub],
  );

  // Robust remote handling on tvOS/Android TV; no-op on phones.
  useRemoteControl(handleTVEvent);

  if (!movie) {
    return null;
  }

  const portraitVideoHeight = Math.round(Math.min(width, height) * (9 / 16));
  const displayPosition = scrub.active ? scrub.preview : progress.position;
  const canSeek = !isLive && progress.duration > 0;
  const progressRatio = canSeek
    ? Math.max(0, Math.min(1, displayPosition / progress.duration))
    : isLive
      ? 1
      : 0;

  // Movies: show poster while buffering or before playback starts.
  const showPoster =
    !isMatchPlayback &&
    !!movie.image &&
    !hasError &&
    (isBuffering || (!isPlaying && (progress.position ?? 0) < 0.5));

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
        <Image source={APP_LOGO} resizeMode="contain" style={styles.matchLogo} />
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
      {streamUri ? (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          nativeControls={false}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
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
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressRatio * 100}%` },
              isLive ? styles.progressFillLive : null,
            ]}
          />
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
    <View style={[styles.root, { width, height }]}>
      <StatusBar hidden={showLandscapeLayout} style="light" />

      <View style={showLandscapeLayout ? styles.fullscreenHost : styles.portraitHost}>
        <View
          style={[
            styles.videoShell,
            showLandscapeLayout
              ? StyleSheet.absoluteFillObject
              : { height: portraitVideoHeight },
          ]}
        >
          {renderVideoSurface()}

          <Pressable
            style={StyleSheet.absoluteFill}
            onFocus={() => setFocusZone("surface")}
            onPress={() => (controlsVisible ? togglePlay() : revealControls())}
          />

          {controlsVisible ? (
            <>
              <LinearGradient
                colors={
                  showLandscapeLayout
                    ? ["rgba(0,0,0,0.55)", "transparent", "rgba(0,0,0,0.85)"]
                    : ["rgba(0,0,0,0.45)", "transparent", "rgba(0,0,0,0.9)"]
                }
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View
                style={[
                  showLandscapeLayout ? styles.landscapeOverlay : styles.portraitVideoOverlay,
                  showLandscapeLayout
                    ? { paddingTop: insets.top, paddingBottom: insets.bottom }
                    : null,
                ]}
              >
                {renderBackButton(
                  showLandscapeLayout
                    ? styles.backButton
                    : [styles.portraitBackButton, { top: insets.top }],
                )}
                <View
                  style={styles.centerPlayWrap}
                  pointerEvents={showLandscapeLayout ? "box-none" : undefined}
                >
                  {renderCenterPlay()}
                </View>
                {showLandscapeLayout ? (
                  <View
                    style={[
                      styles.landscapeControlsWrap,
                      { paddingHorizontal: Math.max(insets.left, 16) },
                    ]}
                  >
                    {renderControlsBar()}
                  </View>
                ) : (
                  renderControlsBar()
                )}
              </View>
            </>
          ) : showLandscapeLayout ? null : (
            renderBackButton([styles.portraitBackButton, { top: insets.top }])
          )}
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
    bottom: 8,
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
  progressTrack: {
    flex: 1,
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
