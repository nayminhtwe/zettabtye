import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  findNodeHandle,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { gillSans } from "../constants/fonts";

function PasswordField({
  label,
  value,
  onChangeText,
  showPassword,
  onToggleVisibility,
  inputRef,
  focused,
  onFocus,
  onBlur,
  error,
  nextFocusUp,
  nextFocusDown,
}) {
  const [eyeFocused, setEyeFocused] = useState(false);

  return (
    <View style={styles.fieldSection}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          focused ? styles.inputContainerFocused : null,
          error ? styles.inputContainerError : null,
        ]}
      >
        <TextInput
          ref={inputRef}
          style={styles.input}
          secureTextEntry={!showPassword}
          showSoftInputOnFocus
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          nextFocusUp={nextFocusUp}
          nextFocusDown={nextFocusDown}
        />
        <Pressable
          style={[styles.eyeButton, eyeFocused ? styles.eyeButtonFocused : null]}
          onPress={onToggleVisibility}
          onFocus={() => setEyeFocused(true)}
          onBlur={() => setEyeFocused(false)}
        >
          <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#D2D2D2" />
        </Pressable>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export default function SetProfilePasswordScreen({ onBack, onComplete, onSearchPress }) {
  const [backFocused, setBackFocused] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [submitFocused, setSubmitFocused] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const passwordInputRef = useRef(null);
  const confirmInputRef = useRef(null);
  const submitButtonRef = useRef(null);

  const handleSubmit = () => {
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();
    const isPasswordEmpty = trimmedPassword.length === 0;
    const isConfirmEmpty = trimmedConfirm.length === 0;
    const passwordsMismatch = trimmedPassword !== trimmedConfirm;

    setPasswordError(isPasswordEmpty ? "Please enter a new password" : "");
    setConfirmPasswordError(
      isConfirmEmpty
        ? "Please retype your new password"
        : passwordsMismatch
          ? "Passwords do not match"
          : "",
    );

    if (isPasswordEmpty || isConfirmEmpty || passwordsMismatch) {
      return;
    }

    onComplete?.(trimmedPassword);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          style={[styles.headerIconButton, backFocused ? styles.headerIconButtonFocused : null]}
          onPress={onBack}
          onFocus={() => setBackFocused(true)}
          onBlur={() => setBackFocused(false)}
          nextFocusDown={findNodeHandle(passwordInputRef.current) ?? undefined}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          Account details
        </Text>

        <Pressable
          style={[styles.headerIconButton, searchFocused ? styles.headerIconButtonFocused : null]}
          onPress={onSearchPress}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        >
          <Ionicons name="search" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.body}>
        <PasswordField
          label="Set a new password"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (passwordError) {
              setPasswordError("");
            }
          }}
          showPassword={showPassword}
          onToggleVisibility={() => setShowPassword((prev) => !prev)}
          inputRef={passwordInputRef}
          focused={passwordFocused}
          onFocus={() => setPasswordFocused(true)}
          onBlur={() => setPasswordFocused(false)}
          error={passwordError}
          nextFocusDown={findNodeHandle(confirmInputRef.current) ?? undefined}
        />

        <PasswordField
          label="Retype a new password"
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmPassword(value);
            if (confirmPasswordError) {
              setConfirmPasswordError("");
            }
          }}
          showPassword={showConfirmPassword}
          onToggleVisibility={() => setShowConfirmPassword((prev) => !prev)}
          inputRef={confirmInputRef}
          focused={confirmPasswordFocused}
          onFocus={() => setConfirmPasswordFocused(true)}
          onBlur={() => setConfirmPasswordFocused(false)}
          error={confirmPasswordError}
          nextFocusUp={findNodeHandle(passwordInputRef.current) ?? undefined}
          nextFocusDown={findNodeHandle(submitButtonRef.current) ?? undefined}
        />
      </View>

      <View style={styles.footer}>
        <Pressable
          ref={submitButtonRef}
          style={[styles.submitButton, submitFocused ? styles.submitButtonFocused : null]}
          onPress={handleSubmit}
          onFocus={() => setSubmitFocused(true)}
          onBlur={() => setSubmitFocused(false)}
          nextFocusUp={findNodeHandle(confirmInputRef.current) ?? undefined}
        >
          <Text style={[styles.submitButtonText, submitFocused ? styles.submitButtonTextFocused : null]}>
            Create a new password
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingRight: 16,
    paddingBottom: 8,
    paddingLeft: 16,
    backgroundColor: "#1D1B20",
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconButtonFocused: {
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  headerTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 30,
    textAlign: "center",
    marginHorizontal: 8,
    ...gillSans("600"),
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  fieldSection: {
    marginBottom: 24,
  },
  fieldLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    ...gillSans("400"),
  },
  inputContainer: {
    minHeight: 64,
    paddingTop: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#4A4A4A",
    backgroundColor: "#1A1A1A",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  inputContainerFocused: {
    backgroundColor: "#FF3B301A",
    borderBottomWidth: 3,
    borderBottomColor: "#FF5C4D",
  },
  inputContainerError: {
    borderBottomWidth: 3,
    borderBottomColor: "#E71809",
    backgroundColor: "rgba(231, 24, 9, 0.15)",
  },
  input: {
    flex: 1,
    paddingTop: 4,
    paddingRight: 8,
    paddingBottom: 4,
    paddingLeft: 8,
    color: "#D2D2D2",
    fontSize: 16,
    lineHeight: 24,
    ...gillSans("400"),
    backgroundColor: "transparent",
  },
  eyeButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  eyeButtonFocused: {
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  errorText: {
    marginTop: 8,
    color: "#FF988F",
    fontSize: 12,
    lineHeight: 16,
    ...gillSans("400"),
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  submitButton: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C80D00",
    backgroundColor: "#C80D00",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  submitButtonFocused: {
    borderWidth: 3,
    borderColor: "#FF5C4D",
    backgroundColor: "#FFFFFF",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 24,
    textAlign: "center",
    ...gillSans("600"),
  },
  submitButtonTextFocused: {
    color: "#C80D00",
  },
});
