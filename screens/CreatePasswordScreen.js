import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  findNodeHandle,
  Keyboard,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import FloatingPasswordInput from "../components/FloatingPasswordInput";
import FocusablePressable from "../components/FocusablePressable";
import ScreenHeader from "../components/ScreenHeader";
import { gillSans } from "../constants/fonts";
import { authPrimaryButtonFocused } from "../constants/focusStyles";
import { authClearError, authSetPasswordRequest } from "../store/auth/actions";
import { selectAuthError, selectAuthLoading } from "../store/auth/selectors";

export default function CreatePasswordScreen() {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [continueFocused, setContinueFocused] = useState(false);
  const [focusChainReady, setFocusChainReady] = useState(false);

  const dummyBackRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmInputRef = useRef(null);
  const continueRef = useRef(null);
  const suppressInputInactiveRef = useRef(false);

  const focusNextField = useCallback((fromRef, toRef, { dismissKeyboard = true } = {}) => {
    suppressInputInactiveRef.current = true;

    if (dismissKeyboard) {
      Keyboard.dismiss();
    }
    fromRef.current?.blur();

    requestAnimationFrame(() => {
      toRef.current?.focus?.();
      setTimeout(() => {
        suppressInputInactiveRef.current = false;
      }, 100);
    });
  }, []);

  const focusConfirmField = useCallback(() => {
    focusNextField(passwordInputRef, confirmInputRef);
  }, [focusNextField]);

  const focusContinueButton = useCallback(() => {
    focusNextField(confirmInputRef, continueRef, { dismissKeyboard: true });
  }, [focusNextField]);

  const handleContinue = useCallback(() => {
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();
    const isPasswordEmpty = trimmedPassword.length === 0;
    const isConfirmEmpty = trimmedConfirm.length === 0;
    const passwordsMismatch = trimmedPassword !== trimmedConfirm;

    setPasswordError(isPasswordEmpty ? "Please enter a password" : "");
    setConfirmPasswordError(
      isConfirmEmpty
        ? "Please confirm your password"
        : passwordsMismatch
          ? "Passwords do not match"
          : "",
    );

    if (
      isPasswordEmpty ||
      isConfirmEmpty ||
      passwordsMismatch ||
      trimmedPassword.length < 8 ||
      isLoading
    ) {
      if (trimmedPassword.length > 0 && trimmedPassword.length < 8) {
        setPasswordError("Password must be at least 8 characters");
      }
      return;
    }

    dispatch(authSetPasswordRequest(trimmedPassword));
  }, [confirmPassword, dispatch, isLoading, password]);

  useEffect(() => {
    dispatch(authClearError());
    setFocusChainReady(true);
    return () => {
      dispatch(authClearError());
    };
  }, [dispatch]);

  useEffect(() => {
    if (!focusChainReady || isLoading) {
      return undefined;
    }
    const timer = setTimeout(() => {
      passwordInputRef.current?.focus?.();
    }, 150);
    return () => clearTimeout(timer);
  }, [focusChainReady, isLoading]);

  const passwordFocusProps = useMemo(
    () => ({
      nextFocusDown: focusChainReady
        ? findNodeHandle(confirmInputRef.current) ?? undefined
        : undefined,
    }),
    [focusChainReady],
  );

  const confirmFocusProps = useMemo(
    () => ({
      nextFocusUp: focusChainReady
        ? findNodeHandle(passwordInputRef.current) ?? undefined
        : undefined,
      nextFocusDown: focusChainReady ? findNodeHandle(continueRef.current) ?? undefined : undefined,
    }),
    [focusChainReady],
  );

  const continueUpTarget = useMemo(
    () => (focusChainReady ? findNodeHandle(confirmInputRef.current) ?? undefined : undefined),
    [focusChainReady],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBarSpacer} />

      <ScreenHeader
        title="Create Password"
        backRef={dummyBackRef}
        onBack={null}
        isBackFocused={false}
        backFocusable={false}
        backFocusProps={{}}
      />

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Create a password for your account so you can log in next time.
        </Text>

        <View style={styles.fieldSection}>
          <FloatingPasswordInput
            inputRef={passwordInputRef}
            label="Create password"
            value={password}
            editable={!isLoading}
            showPassword={showPassword}
            onToggleVisibility={() => setShowPassword((prev) => !prev)}
            onChangeText={(value) => {
              setPassword(value);
              if (passwordError) {
                setPasswordError("");
              }
            }}
            focusableProps={passwordFocusProps}
            onEnterPress={focusConfirmField}
          />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        </View>

        <View style={styles.fieldSection}>
          <FloatingPasswordInput
            inputRef={confirmInputRef}
            label="Confirm password"
            value={confirmPassword}
            editable={!isLoading}
            showPassword={showConfirmPassword}
            onToggleVisibility={() => setShowConfirmPassword((prev) => !prev)}
            onChangeText={(value) => {
              setConfirmPassword(value);
              if (confirmPasswordError) {
                setConfirmPasswordError("");
              }
            }}
            focusableProps={confirmFocusProps}
            onEnterPress={focusContinueButton}
          />
          {confirmPasswordError ? (
            <Text style={styles.errorText}>{confirmPasswordError}</Text>
          ) : null}
        </View>

        {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

        <FocusablePressable
          ref={continueRef}
          style={[
            styles.continueButton,
            continueFocused ? styles.continueButtonFocused : null,
            isLoading ? styles.continueButtonDisabled : null,
          ]}
          disabled={isLoading}
          nextFocusUp={continueUpTarget}
          onFocus={() => setContinueFocused(true)}
          onBlur={() => setContinueFocused(false)}
          onPress={handleContinue}
        >
          {isLoading ? (
            <ActivityIndicator color={continueFocused ? "#C80D00" : "#D2D2D2"} />
          ) : (
            <Text style={[styles.continueText, continueFocused ? styles.continueTextFocused : null]}>
              Set Password
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
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  subtitle: {
    color: "#A7A7A7",
    fontSize: 16,
    lineHeight: 24,
    ...gillSans("400"),
    textAlign: "center",
    marginBottom: 32,
  },
  fieldSection: {
    marginBottom: 8,
  },
  errorText: {
    marginTop: 8,
    color: "#E71809",
    fontSize: 14,
    lineHeight: 20,
    ...gillSans("400"),
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
  continueButtonFocused: authPrimaryButtonFocused,
  continueButtonDisabled: {
    opacity: 0.7,
  },
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
