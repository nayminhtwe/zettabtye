import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import * as ExpoSplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { gillSans } from "../constants/fonts";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const GLOW_BORDER_RADIUS = 40;
const GLOW_WIDTH = SCREEN_WIDTH * 1.35;
const GLOW_HEIGHT = SCREEN_HEIGHT * 1.2;
const GLOW_LEFT = (SCREEN_WIDTH - GLOW_WIDTH) / 2;
const GLOW_TOP = (SCREEN_HEIGHT - GLOW_HEIGHT) / 2;

const LOGO_LARGE = { width: 200, height: 125 };
const LOGO_SMALL = { width: 29, height: 24 };
const FLOAT_DISTANCE = 14;
const TEXT_FONT_SIZE = 22;
const TEXT_LINE_HEIGHT = 24;
const TEXT_REVEAL_WIDTH_FALLBACK = 120;
const TEXT_WIDTH_BUFFER = 6;
const TEXT_GRADIENT_LOCATIONS = [0, 0.3249, 1];
const PAIR_OVERLAP = 4;
const LOGO_BURST_SCALE =
  Math.max(SCREEN_WIDTH / LOGO_SMALL.width, SCREEN_HEIGHT / LOGO_SMALL.height) *
  1.15;

function getPairOffsets(textRevealWidth) {
  const pairHalfSpan = (textRevealWidth + LOGO_SMALL.width) / 4 - PAIR_OVERLAP / 2;
  return {
    text: -pairHalfSpan,
    logo: pairHalfSpan,
  };
}
const LOGO_COMPACT_SCALE = LOGO_SMALL.width / LOGO_LARGE.width;
const TEXT_ONLY_HOLD_MS = 1200;

ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

function RadialBackgroundGlow({ opacity }) {
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.radialGlow,
        {
          opacity,
          width: GLOW_WIDTH,
          height: GLOW_HEIGHT,
          left: GLOW_LEFT,
          top: GLOW_TOP,
          borderRadius: GLOW_BORDER_RADIUS,
        },
      ]}
    >
      <Svg
        width={GLOW_WIDTH}
        height={GLOW_HEIGHT}
        viewBox={`0 0 ${GLOW_WIDTH} ${GLOW_HEIGHT}`}
      >
        <Defs>
          <RadialGradient
            id="splashRadialGlow"
            cx="50%"
            cy="50%"
            r="75%"
            gradientUnits="objectBoundingBox"
          >
            <Stop offset="0%" stopColor="#000000" stopOpacity="1" />
            <Stop offset="45%" stopColor="#1A0504" stopOpacity="1" />
            <Stop offset="100%" stopColor="#7B110B" stopOpacity="0.65" />
          </RadialGradient>
        </Defs>
        <Rect
          x="0"
          y="0"
          width={GLOW_WIDTH}
          height={GLOW_HEIGHT}
          fill="url(#splashRadialGlow)"
          rx={GLOW_BORDER_RADIUS}
          ry={GLOW_BORDER_RADIUS}
        />
      </Svg>
    </Animated.View>
  );
}

function GradientBrandText() {
  return (
    <MaskedView
      maskElement={
        <Text style={[styles.brandText, styles.brandTextMask]}>Zettabyte</Text>
      }
    >
      <LinearGradient
        colors={["#C31209", "#F80D00", "#730B07"]}
        locations={TEXT_GRADIENT_LOCATIONS}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradientFill}
      >
        <Text style={[styles.brandText, styles.brandTextHidden]}>Zettabyte</Text>
      </LinearGradient>
    </MaskedView>
  );
}

export default function SplashScreen({ onFinish }) {
  const [brandTextWidth, setBrandTextWidth] = useState(0);

  const textRevealWidth = useMemo(() => {
    if (!brandTextWidth) {
      return TEXT_REVEAL_WIDTH_FALLBACK;
    }
    return Math.ceil(brandTextWidth) + TEXT_WIDTH_BUFFER;
  }, [brandTextWidth]);

  const pairOffsets = useMemo(
    () => getPairOffsets(textRevealWidth),
    [textRevealWidth],
  );

  const floatAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const logoTranslateX = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(-12)).current;
  const textRevealScale = useRef(new Animated.Value(0)).current;
  const textTranslateX = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(1)).current;
  const bgGlowOpacity = useRef(new Animated.Value(0)).current;
  const floatLoopRef = useRef(null);

  useEffect(() => {
    if (!brandTextWidth) {
      return undefined;
    }

    let cancelled = false;

    const run = async () => {
      await ExpoSplashScreen.hideAsync().catch(() => {});
      if (cancelled) return;

      floatLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 1100,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1100,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      floatLoopRef.current.start();

      await wait(2600);
      if (cancelled) return;

      floatLoopRef.current?.stop();
      floatAnim.stopAnimation();
      floatAnim.setValue(0.5);

      await animate(
        Animated.timing(logoScale, {
          toValue: LOGO_COMPACT_SCALE,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      );
      if (cancelled) return;

      logoScale.setValue(LOGO_COMPACT_SCALE);

      await animate(
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(textSlide, {
            toValue: 0,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(textRevealScale, {
            toValue: 1,
            duration: 550,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(textTranslateX, {
            toValue: pairOffsets.text,
            duration: 550,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(logoTranslateX, {
            toValue: pairOffsets.logo,
            duration: 550,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
      );
      if (cancelled) return;

      await wait(700);
      if (cancelled) return;

      floatAnim.setValue(0);

      await animate(
        Animated.parallel([
          Animated.timing(logoScale, {
            toValue: LOGO_BURST_SCALE,
            duration: 800,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(logoTranslateX, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(logoTranslateY, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(textTranslateX, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
      );
      if (cancelled) return;

      await animate(
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(bgGlowOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
        ])
      );
      if (cancelled) return;

      await wait(TEXT_ONLY_HOLD_MS);
      if (cancelled) return;

      await animate(
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 550,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        })
      );

      if (!cancelled) onFinish();
    };

    run();

    return () => {
      cancelled = true;
      floatLoopRef.current?.stop();
    };
  }, [
    bgGlowOpacity,
    floatAnim,
    logoOpacity,
    logoScale,
    logoTranslateX,
    logoTranslateY,
    onFinish,
    textOpacity,
    textSlide,
    textRevealScale,
    textTranslateX,
    brandTextWidth,
    pairOffsets.logo,
    pairOffsets.text,
  ]);

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [FLOAT_DISTANCE / 2, -FLOAT_DISTANCE / 2],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.stage}>
        <Text
          style={styles.brandTextMeasure}
          onLayout={(event) => {
            const width = event.nativeEvent.layout.width;
            if (width > 0 && width !== brandTextWidth) {
              setBrandTextWidth(width);
            }
          }}
        >
          Zettabyte
        </Text>
        <RadialBackgroundGlow opacity={bgGlowOpacity} />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.logoBackground,
            {
              opacity: logoOpacity,
              transform: [
                { translateX: logoTranslateX },
                { translateY: Animated.add(logoTranslateY, floatY) },
                { scale: logoScale },
              ],
            },
          ]}
        >
          <Image
            source={require("../assets/images/logo.png")}
            resizeMode="contain"
            style={styles.logoImage}
            fadeDuration={0}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.textForeground,
            {
              opacity: textOpacity,
              transform: [{ translateX: textTranslateX }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.textReveal,
              {
                width: textRevealWidth,
                transform: [
                  { translateX: textSlide },
                  { scaleX: textRevealScale },
                ],
              },
            ]}
          >
            <GradientBrandText />
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function animate(animation) {
  return new Promise((resolve) => {
    animation.start(({ finished }) => {
      if (finished) resolve();
    });
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#141218",
  },
  stage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  radialGlow: {
    position: "absolute",
    zIndex: 0,
    overflow: "hidden",
  },
  logoBackground: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    opacity: 1,
    zIndex: 1,
  },
  logoImage: {
    width: LOGO_LARGE.width,
    height: LOGO_LARGE.height,
  },
  textForeground: {
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  textReveal: {
    height: TEXT_LINE_HEIGHT,
    overflow: "hidden",
    alignItems: "flex-start",
  },
  gradientFill: {
    alignSelf: "flex-start",
  },
  brandTextMeasure: {
    position: "absolute",
    opacity: 0,
    fontSize: TEXT_FONT_SIZE,
    lineHeight: TEXT_LINE_HEIGHT,
    ...gillSans("700"),
    includeFontPadding: false,
  },
  brandText: {
    fontSize: TEXT_FONT_SIZE,
    lineHeight: TEXT_LINE_HEIGHT,
    ...gillSans("700"),
    includeFontPadding: false,
  },
  brandTextMask: {
    color: "#000000",
    backgroundColor: "transparent",
  },
  brandTextHidden: {
    opacity: 0,
  },
});
