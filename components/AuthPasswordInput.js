import { Ionicons } from "@expo/vector-icons";
import React, { forwardRef, useCallback, useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput } from "react-native";
import { gillSans } from "../constants/fonts";
import { authInputBase, authInputFocused } from "../constants/focusStyles";
import FocusablePressable from "./FocusablePressable";

const AuthPasswordInput = forwardRef(function AuthPasswordInput(
  {
    inputRef,
    value,
    onChangeText,
    placeholder,
    showPassword,
    onToggleVisibility,
    editable = true,
    nextFocusUp,
    nextFocusDown,
    onFocus,
    onBlur,
    style,
  },
  ref,
) {
  const internalInputRef = useRef(null);
  const textInputRef = inputRef ?? internalInputRef;
  const [wrapperFocused, setWrapperFocused] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const isHighlighted = wrapperFocused || inputFocused;

  const focusInput = useCallback(() => {
    if (!editable) {
      return;
    }
    textInputRef.current?.focus();
  }, [editable, textInputRef]);

  const handleWrapperFocus = useCallback(
    (event) => {
      setWrapperFocused(true);
      onFocus?.(event);
    },
    [onFocus],
  );

  const handleWrapperBlur = useCallback(
    (event) => {
      setWrapperFocused(false);
      onBlur?.(event);
    },
    [onBlur],
  );

  const handleInputFocus = useCallback(
    (event) => {
      setInputFocused(true);
      onFocus?.(event);
    },
    [onFocus],
  );

  const handleInputBlur = useCallback(
    (event) => {
      setInputFocused(false);
      onBlur?.(event);
    },
    [onBlur],
  );

  return (
    <FocusablePressable
      ref={ref}
      style={[styles.inputContainer, isHighlighted ? styles.inputFocused : null, style]}
      onPress={focusInput}
      onFocus={handleWrapperFocus}
      onBlur={handleWrapperBlur}
      disabled={!editable}
      nextFocusUp={nextFocusUp}
      nextFocusDown={nextFocusDown}
    >
      <TextInput
        ref={textInputRef}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#A7A7A7"
        secureTextEntry={!showPassword}
        showSoftInputOnFocus
        value={value}
        editable={editable}
        focusable={false}
        onChangeText={onChangeText}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
      />
      <Pressable
        focusable={false}
        style={styles.eyeButton}
        onPress={onToggleVisibility}
        disabled={!editable}
      >
        <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#D2D2D2" />
      </Pressable>
    </FocusablePressable>
  );
});

export default AuthPasswordInput;

const styles = StyleSheet.create({
  inputContainer: {
    minHeight: 64,
    paddingTop: 4,
    paddingBottom: 4,
    backgroundColor: "#1A1A1A",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    borderBottomColor: "#4A4A4A",
    ...authInputBase,
  },
  inputFocused: authInputFocused,
  input: {
    flex: 1,
    paddingTop: 4,
    paddingRight: 8,
    paddingBottom: 4,
    paddingLeft: 8,
    color: "#D2D2D2",
    fontSize: 20,
    lineHeight: 24,
    ...gillSans("400"),
    backgroundColor: "transparent",
  },
  eyeButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
