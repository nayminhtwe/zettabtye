import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  TextInput,
} from "react-native";
import { gillSans } from "../constants/fonts";
import { authInputBase } from "../constants/focusStyles";

const DEFAULT_LABEL = "Enter your password";
const ANIMATION_MS = 300;

const ROW_TOP = 16;
const FLOAT_LABEL_TOP = 4;
const FLOAT_INPUT_PADDING_TOP = 20;

export default function FloatingPasswordInput({
  value,
  onChangeText,
  inputRef,
  onFocus,
  onBlur,
  focusableProps = {},
  autoFocus = false,
  editable = true,
  showPassword = false,
  onToggleVisibility,
  label = DEFAULT_LABEL,
}) {
  const [focused, setFocused] = useState(false);
  const floatAnim = useRef(new Animated.Value(value.length > 0 ? 1 : 0)).current;
  const highlightAnim = useRef(new Animated.Value(0)).current;

  const shouldFloat = value.length > 0;

  useEffect(() => {
    Animated.timing(floatAnim, {
      toValue: shouldFloat ? 1 : 0,
      duration: ANIMATION_MS,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [shouldFloat, floatAnim]);

  useEffect(() => {
    Animated.timing(highlightAnim, {
      toValue: focused ? 1 : 0,
      duration: ANIMATION_MS,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [focused, highlightAnim]);

  const handleFocus = (event) => {
    setFocused(true);
    onFocus?.(event);
    focusableProps.onFocus?.(event);
  };

  const handleBlur = (event) => {
    setFocused(false);
    onBlur?.(event);
    focusableProps.onBlur?.(event);
  };

  const labelTop = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [ROW_TOP, FLOAT_LABEL_TOP],
  });

  const inputPaddingTop = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FLOAT_INPUT_PADDING_TOP],
  });

  const labelFontSize = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 12],
  });

  const idleLabelColor = highlightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#D2D2D2", "#E71809"],
  });

  const containerBackground = highlightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#1A1A1A", "#FF3B301A"],
  });

  const borderColor = highlightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#4A4A4A", "#E71809"],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: containerBackground,
          borderBottomColor: borderColor,
        },
      ]}
    >
      <Animated.Text
        pointerEvents="none"
        style={[
          styles.label,
          {
            top: labelTop,
            fontSize: labelFontSize,
            color: shouldFloat ? (focused ? "#FFFFFF" : "#D2D2D2") : idleLabelColor,
          },
        ]}
      >
        {label}
      </Animated.Text>
      <Animated.View style={[styles.inputRow, { paddingTop: inputPaddingTop }]}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
          showSoftInputOnFocus
          autoFocus={autoFocus}
          editable={editable}
          placeholder=""
          selectionColor="#E71809"
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...focusableProps}
        />
        <Pressable
          focusable={false}
          style={styles.eyeButton}
          onPress={onToggleVisibility}
          disabled={!editable || !onToggleVisibility}
        >
          <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#D2D2D2" />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 64,
    paddingTop: 4,
    paddingBottom: 4,
    justifyContent: "center",
    backgroundColor: "#1A1A1A",
    borderBottomColor: "#4A4A4A",
    ...authInputBase,
  },
  label: {
    position: "absolute",
    left: 0,
    right: 48,
    paddingTop: 4,
    paddingRight: 8,
    paddingBottom: 4,
    paddingLeft: 8,
    ...gillSans("400"),
    lineHeight: 24,
    letterSpacing: 0,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    paddingTop: 4,
    paddingRight: 8,
    paddingBottom: 4,
    paddingLeft: 8,
    ...gillSans("400"),
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
    color: "#D2D2D2",
    backgroundColor: "transparent",
    textAlignVertical: "center",
  },
  eyeButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
