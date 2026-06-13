import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  findNodeHandle,
  Keyboard,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import FloatingPasswordInput from "../components/FloatingPasswordInput";
import FocusablePressable from "../components/FocusablePressable";
import ScreenHeader from "../components/ScreenHeader";
import { gillSans } from "../constants/fonts";
import {
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
import { createActivationKeyHandler } from "../utils/remoteKeys";

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
  const [continueFocused, setContinueFocused] = useState(false);
  const [inputActive, setInputActive] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const submittedRef = useRef(false);
  const otpFocusedRef = useRef(false);
  const suppressInputInactiveRef = useRef(false);

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

  const setBackFocusable = useCallback((focusable) => {
    backRef.current?.setNativeProps?.({ focusable });
  }, []);

  const handleInputFocus = useCallback(() => {
    setInputActive(true);
    setBackFocusable(false);
  }, [setBackFocusable]);

  const handleInputBlur = useCallback(() => {
    if (suppressInputInactiveRef.current) {
      return;
    }
    setInputActive(false);
    setBackFocusable(true);
  }, [setBackFocusable]);

  const focusNextField = useCallback(
    (fromRef, toRef, { keepActive = true } = {}) => {
      suppressInputInactiveRef.current = true;
      setInputActive(true);
      setBackFocusable(false);

      Keyboard.dismiss();
      fromRef.current?.blur();

      requestAnimationFrame(() => {
        toRef.current?.focus?.();
        setTimeout(() => {
          suppressInputInactiveRef.current = false;
          if (!keepActive) {
            setInputActive(false);
            setBackFocusable(true);
          }
        }, 100);
      });
    },
    [setBackFocusable],
  );

  const focusPasswordField = useCallback(() => {
    focusNextField(otpInputRef, passwordInputRef);
  }, [focusNextField]);

  const focusConfirmField = useCallback(() => {
    focusNextField(passwordInputRef, confirmInputRef);
  }, [focusNextField]);

  const focusContinueButton = useCallback(() => {
    focusNextField(confirmInputRef, continueButtonRef, { keepActive: false });
  }, [focusNextField]);

  const handleOtpKeyPress = useCallback(
    (event) => {
      if (!otpFocusedRef.current) {
        return;
      }
      createActivationKeyHandler(focusPasswordField)(event);
    },
    [focusPasswordField],
  );

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
        backFocusable={!inputActive}
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
              blurOnSubmit={false}
              nextFocusUp={findNodeHandle(backRef.current) ?? undefined}
              nextFocusDown={findNodeHandle(passwordInputRef.current) ?? undefined}
              onFocus={() => {
                otpFocusedRef.current = true;
                setOtpFocused(true);
                handleInputFocus();
              }}
              onBlur={() => {
                otpFocusedRef.current = false;
                setOtpFocused(false);
                handleInputBlur();
              }}
              onKeyPress={handleOtpKeyPress}
            />
          </View>
          {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}
          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
        </View>

        <View style={styles.fieldSection}>
          <FloatingPasswordInput
            inputRef={passwordInputRef}
            label="Enter new password"
            value={password}
            editable={!isLoading}
            showPassword={showPassword}
            onToggleVisibility={() => setShowPassword((prev) => !prev)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onChangeText={(value) => {
              setPassword(value);
              if (passwordError) {
                setPasswordError("");
              }
            }}
            focusableProps={{
              nextFocusUp: findNodeHandle(otpInputRef.current) ?? undefined,
              nextFocusDown: findNodeHandle(confirmInputRef.current) ?? undefined,
            }}
            onEnterPress={focusConfirmField}
          />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        </View>

        <View style={styles.fieldSection}>
          <FloatingPasswordInput
            inputRef={confirmInputRef}
            label="Confirm new password"
            value={confirmPassword}
            editable={!isLoading}
            showPassword={showConfirmPassword}
            onToggleVisibility={() => setShowConfirmPassword((prev) => !prev)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onChangeText={(value) => {
              setConfirmPassword(value);
              if (confirmPasswordError) {
                setConfirmPasswordError("");
              }
            }}
            focusableProps={{
              nextFocusUp: findNodeHandle(passwordInputRef.current) ?? undefined,
              nextFocusDown: findNodeHandle(continueButtonRef.current) ?? undefined,
            }}
            onEnterPress={focusContinueButton}
          />
          {confirmPasswordError ? (
            <Text style={styles.errorText}>{confirmPasswordError}</Text>
          ) : null}
        </View>

        <FocusablePressable
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
            <ActivityIndicator color={continueFocused ? "#C80D00" : "#D2D2D2"} />
          ) : (
            <Text style={[styles.continueText, continueFocused ? styles.continueTextFocused : null]}>
              Set new Password
            </Text>
          )}
        </FocusablePressable>
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
