import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  findNodeHandle,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import ScreenHeader from "../components/ScreenHeader";
import { gillSans } from "../constants/fonts";
import {
  authInputBase,
  authInputFocused,
  authOtpBoxActiveRow,
  authOtpBoxBase,
  authOtpBoxFocused,
  authPrimaryButtonFocused,
} from "../constants/focusStyles";
import { authClearError, authResetPasswordRequest } from "../store/auth/actions";
import {
  selectAuthError,
  selectAuthLoading,
} from "../store/auth/selectors";
import { maskPhone } from "../utils/phoneAuth";

const OTP_LENGTH = 6;

export default function ResetPasswordScreen({ phoneNumber, onBack, onSuccess }) {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [backFocused, setBackFocused] = useState(false);
  const [otpFocused, setOtpFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [continueFocused, setContinueFocused] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const submittedRef = useRef(false);

  const backRef = useRef(null);
  const otpInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmInputRef = useRef(null);
  const continueButtonRef = useRef(null);

  const normalizedPhone = useMemo(() => maskPhone(phoneNumber), [phoneNumber]);

  const otpDigits = useMemo(() => {
    const chars = otp.split("");
    return Array.from({ length: OTP_LENGTH }, (_, index) => chars[index] ?? "");
  }, [otp]);

  useEffect(() => {
    dispatch(authClearError());
    return () => {
      dispatch(authClearError());
    };
  }, [dispatch]);

  useEffect(() => {
    if (submittedRef.current && !isLoading && !authError) {
      submittedRef.current = false;
      onSuccess?.();
    }
  }, [isLoading, authError, onSuccess]);

  const handleContinuePress = () => {
    const trimmedOtp = otp.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();
    const isOtpInvalid = !/^\d{6}$/.test(trimmedOtp);
    const isPasswordEmpty = trimmedPassword.length === 0;
    const isConfirmPasswordEmpty = trimmedConfirm.length === 0;
    const passwordsMismatch = trimmedPassword !== trimmedConfirm;

    setOtpError(isOtpInvalid ? "Please enter the 6-digit OTP code" : "");
    setPasswordError(isPasswordEmpty ? "Please enter your new password" : "");
    setConfirmPasswordError(
      isConfirmPasswordEmpty
        ? "Please confirm your new password"
        : passwordsMismatch
          ? "Passwords do not match"
          : "",
    );

    if (
      isOtpInvalid ||
      isPasswordEmpty ||
      isConfirmPasswordEmpty ||
      passwordsMismatch ||
      trimmedPassword.length < 8 ||
      isLoading
    ) {
      if (trimmedPassword.length > 0 && trimmedPassword.length < 8) {
        setPasswordError("Password must be at least 8 characters");
      }
      return;
    }

    submittedRef.current = true;
    dispatch(authResetPasswordRequest({ otpCode: trimmedOtp, password: trimmedPassword }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBarSpacer} />

      <ScreenHeader
        title="Reset Password"
        backRef={backRef}
        onBack={onBack}
        isBackFocused={backFocused}
        backFocusProps={{
          onFocus: () => setBackFocused(true),
          onBlur: () => setBackFocused(false),
          nextFocusDown: findNodeHandle(otpInputRef.current) ?? undefined,
        }}
      />

      <View style={styles.content}>
        <Text style={styles.message}>
          We sent an OTP code to {normalizedPhone}. Enter the code and create a new password.
        </Text>

        <View style={styles.otpSection}>
          <View style={styles.otpRow}>
            {otpDigits.map((digit, index) => (
              <View
                key={index}
                style={[
                  styles.otpBox,
                  otpFocused ? styles.otpBoxActiveRow : null,
                  otpFocused && index === otp.length ? styles.otpBoxFocused : null,
                  otpError ? styles.otpBoxError : null,
                ]}
              >
                <Text style={styles.otpDigit}>{digit}</Text>
              </View>
            ))}
            <TextInput
              ref={otpInputRef}
              style={styles.otpHiddenInput}
              value={otp}
              onChangeText={(value) => {
                setOtp(value.replace(/\D/g, "").slice(0, OTP_LENGTH));
                if (otpError) {
                  setOtpError("");
                }
              }}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              showSoftInputOnFocus
              caretHidden
              nextFocusUp={findNodeHandle(backRef.current) ?? undefined}
              nextFocusDown={findNodeHandle(passwordInputRef.current) ?? undefined}
              onFocus={() => setOtpFocused(true)}
              onBlur={() => setOtpFocused(false)}
            />
          </View>
          {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}
          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
        </View>

        <View style={styles.fieldSection}>
          <View
            style={[
              styles.inputContainer,
              passwordFocused ? styles.inputContainerFocused : null,
              passwordError ? styles.inputContainerError : null,
            ]}
          >
            <TextInput
              ref={passwordInputRef}
              style={styles.input}
              placeholder="Enter new password"
              placeholderTextColor="#A7A7A7"
              secureTextEntry={!showPassword}
              showSoftInputOnFocus
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (passwordError) {
                  setPasswordError("");
                }
              }}
              nextFocusUp={findNodeHandle(otpInputRef.current) ?? undefined}
              nextFocusDown={findNodeHandle(confirmInputRef.current) ?? undefined}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
            <Pressable
              style={styles.eyeButton}
              onPress={() => setShowPassword((prev) => !prev)}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#D2D2D2"
              />
            </Pressable>
          </View>
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        </View>

        <View style={styles.fieldSection}>
          <View
            style={[
              styles.inputContainer,
              confirmPasswordFocused ? styles.inputContainerFocused : null,
              confirmPasswordError ? styles.inputContainerError : null,
            ]}
          >
            <TextInput
              ref={confirmInputRef}
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor="#A7A7A7"
              secureTextEntry={!showConfirmPassword}
              showSoftInputOnFocus
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                if (confirmPasswordError) {
                  setConfirmPasswordError("");
                }
              }}
              nextFocusUp={findNodeHandle(passwordInputRef.current) ?? undefined}
              nextFocusDown={findNodeHandle(continueButtonRef.current) ?? undefined}
              onFocus={() => setConfirmPasswordFocused(true)}
              onBlur={() => setConfirmPasswordFocused(false)}
            />
            <Pressable
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword((prev) => !prev)}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={20}
                color="#D2D2D2"
              />
            </Pressable>
          </View>
          {confirmPasswordError ? (
            <Text style={styles.errorText}>{confirmPasswordError}</Text>
          ) : null}
        </View>

        <Pressable
          ref={continueButtonRef}
          style={[
            styles.continueButton,
            continueFocused ? styles.continueButtonFocused : null,
            isLoading ? styles.continueButtonDisabled : null,
          ]}
          disabled={isLoading}
          nextFocusUp={findNodeHandle(confirmInputRef.current) ?? undefined}
          onFocus={() => setContinueFocused(true)}
          onBlur={() => setContinueFocused(false)}
          onPress={handleContinuePress}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={[styles.continueText, continueFocused ? styles.continueTextFocused : null]}>
              Set new Password
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#141218",
  },
  statusBarSpacer: {
    height: 52,
    backgroundColor: "#1D1B20",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 30,
  },
  message: {
    alignSelf: "center",
    width: 338,
    ...gillSans("400"),
    color: "#D2D2D2",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.15,
    textAlign: "center",
  },
  otpSection: {
    marginTop: 32,
  },
  fieldSection: {
    marginTop: 24,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    alignSelf: "center",
    flexWrap: "wrap",
  },
  otpBox: {
    width: 48,
    height: 72,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    ...authOtpBoxBase,
  },
  otpBoxActiveRow: authOtpBoxActiveRow,
  otpBoxFocused: authOtpBoxFocused,
  otpBoxError: {
    borderBottomWidth: 3,
    borderBottomColor: "#E71809",
    backgroundColor: "rgba(231, 24, 9, 0.15)",
  },
  errorText: {
    marginTop: 8,
    color: "#E71809",
    fontSize: 14,
    lineHeight: 20,
    ...gillSans("400"),
  },
  otpDigit: {
    color: "#D2D2D2",
    fontSize: 24,
    lineHeight: 28,
    ...gillSans("600"),
    textAlign: "center",
  },
  otpHiddenInput: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 72,
    opacity: 0,
    color: "transparent",
  },
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
  inputContainerFocused: authInputFocused,
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
    letterSpacing: 0,
    ...gillSans("400"),
    backgroundColor: "transparent",
  },
  eyeButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  continueButton: {
    marginTop: 24,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C80D00",
    backgroundColor: "#C80D00",
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueButtonFocused: authPrimaryButtonFocused,
  continueText: {
    color: "#D2D2D2",
    fontSize: 20,
    lineHeight: 24,
    ...gillSans("600"),
  },
  continueTextFocused: {
    color: "#C80D00",
  },
});
