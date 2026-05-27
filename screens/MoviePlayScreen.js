import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as ScreenOrientation from "expo-screen-orientation";
import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PROGRESS = 0.38;

function isLandscapeOrientation(orientation) {
  return (
    orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
    orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
  );
}

async function lockPortrait() {
  await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
}

async function lockLandscape() {
  await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
}

function PlayerControls({ progress, isLandscape, onToggleExpand, transportFocused, setTransportFocused }) {
  return (
    <View style={styles.controlsRoot}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.controlsRow}>
        <View style={styles.transportRow}>
          <Pressable
            style={[styles.controlButton, transportFocused === "back" ? styles.controlButtonFocused : null]}
            onFocus={() => setTransportFocused("back")}
            onBlur={() => setTransportFocused(null)}
          >
            <Ionicons name="play-skip-back" size={22} color="#FFFFFF" />
          </Pressable>
          <Pressable
            style={[styles.controlButton, transportFocused === "pause" ? styles.controlButtonFocused : null]}
            onFocus={() => setTransportFocused("pause")}
            onBlur={() => setTransportFocused(null)}
          >
            <Ionicons name="pause" size={22} color="#FFFFFF" />
          </Pressable>
          <Pressable
            style={[styles.controlButton, transportFocused === "forward" ? styles.controlButtonFocused : null]}
            onFocus={() => setTransportFocused("forward")}
            onBlur={() => setTransportFocused(null)}
          >
            <Ionicons name="play-skip-forward" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <Pressable
          style={[styles.controlButton, transportFocused === "expand" ? styles.controlButtonFocused : null]}
          onPress={onToggleExpand}
          onFocus={() => setTransportFocused("expand")}
          onBlur={() => setTransportFocused(null)}
        >
          <Ionicons name={isLandscape ? "contract" : "expand"} size={22} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

export default function MoviePlayScreen({ movie, onBack }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deviceOrientation, setDeviceOrientation] = useState(ScreenOrientation.Orientation.PORTRAIT_UP);
  const [backFocused, setBackFocused] = useState(false);
  const [centerPlayFocused, setCenterPlayFocused] = useState(false);
  const [transportFocused, setTransportFocused] = useState(null);

  const dimensionsAreLandscape = width > height;
  const orientationIsLandscape = isLandscapeOrientation(deviceOrientation);
  const showLandscapeLayout = isFullscreen && dimensionsAreLandscape && orientationIsLandscape;

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

  const handleBack = useCallback(async () => {
    setIsFullscreen(false);
    await lockPortrait();
    onBack();
  }, [onBack]);

  const toggleExpand = useCallback(async () => {
    if (isFullscreen) {
      setIsFullscreen(false);
      await lockPortrait();
      return;
    }

    setIsFullscreen(true);
    await lockLandscape();
  }, [isFullscreen]);

  if (!movie) {
    return null;
  }

  const portraitVideoHeight = Math.round(Math.min(width, height) * (9 / 16));

  if (showLandscapeLayout) {
    return (
      <View style={[styles.root, { width, height }]}>
        <StatusBar hidden />

        {movie.image ? (
          <Image source={movie.image} resizeMode="cover" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.videoPlaceholder]} />
        )}

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.85)"]}
          style={styles.landscapeGradient}
          pointerEvents="none"
        />

        <View style={[styles.landscapeOverlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <Pressable
            style={[
              styles.backButton,
              backFocused ? styles.backButtonFocused : null,
            ]}
            onPress={handleBack}
            onFocus={() => setBackFocused(true)}
            onBlur={() => setBackFocused(false)}
          >
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </Pressable>

          <View style={styles.centerPlayWrap} pointerEvents="box-none">
            <Pressable
              style={[styles.centerPlayButton, centerPlayFocused ? styles.centerPlayButtonFocused : null]}
              onFocus={() => setCenterPlayFocused(true)}
              onBlur={() => setCenterPlayFocused(false)}
            >
              <Ionicons name="play" size={36} color="#FFFFFF" style={styles.centerPlayIcon} />
            </Pressable>
          </View>

          <View style={[styles.landscapeControlsWrap, { paddingHorizontal: Math.max(insets.left, 16) }]}>
            <PlayerControls
              progress={PROGRESS}
              isLandscape
              onToggleExpand={toggleExpand}
              transportFocused={transportFocused}
              setTransportFocused={setTransportFocused}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { width, height }]}>
      <StatusBar style="light" />

      <View style={styles.portraitBody}>
        <Pressable
          style={[
            styles.portraitBackButton,
            { top: insets.top },
            backFocused ? styles.backButtonFocused : null,
          ]}
          onPress={handleBack}
          onFocus={() => setBackFocused(true)}
          onBlur={() => setBackFocused(false)}
        >
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </Pressable>

        <View style={styles.portraitVideoCenter}>
          <View style={[styles.portraitVideoShell, { height: portraitVideoHeight }]}>
            {movie.image ? (
              <Image source={movie.image} resizeMode="cover" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.videoPlaceholder]} />
            )}

            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.9)"]}
              style={styles.videoGradient}
              pointerEvents="none"
            />

            <View style={styles.portraitVideoOverlay}>
              <View style={styles.centerPlayWrap}>
                <Pressable
                  style={[styles.centerPlayButton, centerPlayFocused ? styles.centerPlayButtonFocused : null]}
                  onFocus={() => setCenterPlayFocused(true)}
                  onBlur={() => setCenterPlayFocused(false)}
                >
                  <Ionicons name="play" size={36} color="#FFFFFF" style={styles.centerPlayIcon} />
                </Pressable>
              </View>

              <PlayerControls
                progress={PROGRESS}
                isLandscape={false}
                onToggleExpand={toggleExpand}
                transportFocused={transportFocused}
                setTransportFocused={setTransportFocused}
              />
            </View>
          </View>
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
  portraitBody: {
    flex: 1,
  },
  portraitBackButton: {
    position: "absolute",
    left: 8,
    width: 44,
    height: 44,
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  portraitVideoCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 0,
  },
  portraitVideoShell: {
    width: "100%",
    backgroundColor: "#0A0A0A",
    overflow: "hidden",
  },
  portraitVideoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  videoGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
  },
  videoPlaceholder: {
    backgroundColor: "#1A1A1A",
  },
  landscapeGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
  },
  landscapeOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  centerPlayWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
    zIndex: 2,
  },
  backButtonFocused: {
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: 22,
  },
  centerPlayButton: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  centerPlayButtonFocused: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
    borderRadius: 32,
  },
  centerPlayIcon: {
    marginLeft: 4,
  },
  controlsRoot: {
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
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
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  controlButtonFocused: {
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: 20,
  },
});
