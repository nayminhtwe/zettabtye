import React, { useCallback, useRef, useState } from "react";
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
import { authLinkFocused, authPrimaryButtonFocused } from "../constants/focusStyles";
import { authContinueRequest } from "../store/auth/actions";
import { selectAuthError, selectAuthLoading } from "../store/auth/selectors";

export default function PasswordScreen({ phoneNumber, countryId, onBack, onForgotPassword }) {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [backFocused, setBackFocused] = useState(false);
  const [forgotPasswordFocused, setForgotPasswordFocused] = useState(false);
  const [continueFocused, setContinueFocused] = useState(false);
  const [passwordActive, setPasswordActive] = useState(false);

  const backRef = useRef(null);
  const passwordInputRef = useRef(null);
  const forgotPasswordRef = useRef(null);
  const continueRef = useRef(null);
  const suppressPasswordInactiveRef = useRef(false);

  const setBackFocusable = useCallback((focusable) => {
    backRef.current?.setNativeProps?.({ focusable });
  }, []);

  const handlePasswordFocus = useCallback(() => {
    setPasswordActive(true);
    setBackFocusable(false);
  }, [setBackFocusable]);

  const handlePasswordBlur = useCallback(() => {
    if (suppressPasswordInactiveRef.current) {
      return;
    }
    setPasswordActive(false);
    setBackFocusable(true);
  }, [setBackFocusable]);

  const focusContinueButton = useCallback(() => {
    suppressPasswordInactiveRef.current = true;
    setPasswordActive(true);
    setBackFocusable(false);

    Keyboard.dismiss();
    passwordInputRef.current?.blur();

    requestAnimationFrame(() => {
      continueRef.current?.focus?.();
      setTimeout(() => {
        suppressPasswordInactiveRef.current = false;
        setPasswordActive(false);
        setBackFocusable(true);
      }, 100);
    });
  }, [setBackFocusable]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBarSpacer} />

      <ScreenHeader
        title="Login"
        backRef={backRef}
        onBack={onBack}
        isBackFocused={backFocused}
        backFocusable={!passwordActive}
        backFocusProps={{
          onFocus: () => setBackFocused(true),
          onBlur: () => setBackFocused(false),
          nextFocusDown: findNodeHandle(passwordInputRef.current) ?? undefined,
        }}
      />

      <View style={styles.content}>
        <Text style={styles.title}>Enter Your Password</Text>

        <View style={styles.passwordSection}>
          <FloatingPasswordInput
            inputRef={passwordInputRef}
            autoFocus
            value={password}
            editable={!isLoading}
            showPassword={showPassword}
            onToggleVisibility={() => setShowPassword((prev) => !prev)}
            onFocus={handlePasswordFocus}
            onBlur={handlePasswordBlur}
            onChangeText={(v) => {
              setPassword(v);
              if (passwordError) {
                setPasswordError("");
              }
            }}
            focusableProps={{
              nextFocusUp: findNodeHandle(backRef.current) ?? undefined,
              nextFocusDown: findNodeHandle(forgotPasswordRef.current) ?? undefined,
            }}
            onEnterPress={focusContinueButton}
          />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          <FocusablePressable
            ref={forgotPasswordRef}
            style={[
              styles.forgotPasswordButton,
              forgotPasswordFocused ? styles.forgotPasswordButtonFocused : null,
            ]}
            onPress={onForgotPassword}
            nextFocusUp={findNodeHandle(passwordInputRef.current) ?? undefined}
            nextFocusDown={findNodeHandle(continueRef.current) ?? undefined}
            onFocus={() => setForgotPasswordFocused(true)}
            onBlur={() => setForgotPasswordFocused(false)}
          >
            <Text
              style={[
                styles.forgotPasswordText,
                forgotPasswordFocused ? styles.forgotPasswordTextFocused : null,
              ]}
            >
              Forgot Password?
            </Text>
          </FocusablePressable>
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
          nextFocusUp={findNodeHandle(forgotPasswordRef.current) ?? undefined}
          onFocus={() => setContinueFocused(true)}
          onBlur={() => setContinueFocused(false)}
          onPress={() => {
            const err = password.trim().length < 8
              ? "Password must be at least 8 characters"
              : "";
            setPasswordError(err);
            if (err) return;
            dispatch(authContinueRequest({ phone: phoneNumber, password, countryId }));
          }}
        >
          {isLoading ? (
            <ActivityIndicator color={continueFocused ? "#C80D00" : "#D2D2D2"} />
          ) : (
            <Text style={[styles.continueText, continueFocused ? styles.continueTextFocused : null]}>
              Continue
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
  title: {
    color: "#FFFFFF",
    fontSize: 32,
    lineHeight: 54,
    ...gillSans("600"),
    textAlign: "center",
  },
  passwordSection: {
    marginTop: 24,
  },
  forgotPasswordButton: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  forgotPasswordButtonFocused: authLinkFocused,
  forgotPasswordText: {
    color: "#FF3B30",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.15,
    ...gillSans("400"),
    textAlign: "left",
    textDecorationLine: "underline",
  },
  forgotPasswordTextFocused: {
    color: "#FFFFFF",
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
  continueText: {
    color: "#D2D2D2",
    fontSize: 20,
    lineHeight: 24,
    ...gillSans("600"),
  },
  continueTextFocused: {
    color: "#C80D00",
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  errorText: {
    marginTop: 8,
    color: "#E71809",
    fontSize: 14,
    lineHeight: 20,
    ...gillSans("400"),
  },
});
