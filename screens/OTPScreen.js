import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useRef, useState } from "react";
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
  authResendOtpRequest,
  authVerifyOtpRequest,
} from "../store/auth/actions";
import {
  selectAuthError,
  selectAuthLoading,
  selectAuthPhone,
} from "../store/auth/selectors";
import { maskPhone } from "../utils/phoneAuth";

const OTP_LENGTH = 6;

export default function OTPScreen({ onBack }) {
  const dispatch = useDispatch();
  const authPhone = useSelector(selectAuthPhone);
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  const [otp, setOtp] = useState("");
  const [backFocused, setBackFocused] = useState(false);
  const [otpFocused, setOtpFocused] = useState(false);
  const [continueFocused, setContinueFocused] = useState(false);
  const [resendFocused, setResendFocused] = useState(false);
  const [otpError, setOtpError] = useState("");

  const backRef = useRef(null);
  const otpInputRef = useRef(null);
  const resendRef = useRef(null);
  const continueButtonRef = useRef(null);

  const normalizedPhone = useMemo(() => maskPhone(authPhone), [authPhone]);

  const otpDigits = useMemo(() => {
    const chars = otp.split("");
    return Array.from({ length: OTP_LENGTH }, (_, index) => chars[index] ?? "");
  }, [otp]);

  const displayError = otpError || authError;

  const handleContinuePress = () => {
    if (!/^\d{6}$/.test(otp.trim())) {
      setOtpError("Please enter the 6-digit OTP code");
      return;
    }

    setOtpError("");
    dispatch(authVerifyOtpRequest(otp.trim()));
  };

  const handleResendPress = () => {
    setOtpError("");
    dispatch(authResendOtpRequest());
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBarSpacer} />

      <ScreenHeader
        title="Verifying Your Phone Number"
        backRef={backRef}
        onBack={onBack}
        isBackFocused={backFocused}
        backFocusedStyle={styles.backButtonFocused}
        backFocusProps={{
          onFocus: () => setBackFocused(true),
          onBlur: () => setBackFocused(false),
          nextFocusDown: findNodeHandle(otpInputRef.current) ?? undefined,
        }}
      />

      <View style={styles.content}>
        <Text style={styles.message}>
          We sent a 6-digit OTP code to {normalizedPhone || "your phone number"}.
        </Text>

        <Pressable
          ref={resendRef}
          onPress={handleResendPress}
          disabled={isLoading}
          onFocus={() => setResendFocused(true)}
          onBlur={() => setResendFocused(false)}
          nextFocusUp={findNodeHandle(backRef.current) ?? undefined}
          nextFocusDown={findNodeHandle(otpInputRef.current) ?? undefined}
        >
          <Text style={[styles.helpText, resendFocused ? styles.helpTextFocused : null]}>
            Didn&apos;t receive a code? Resend
          </Text>
        </Pressable>

        <Pressable style={styles.otpSection} onPress={() => otpInputRef.current?.focus()}>
          <View style={styles.otpRow}>
            {otpDigits.map((digit, index) => (
              <View
                key={index}
                style={[
                  styles.otpBox,
                  otpFocused ? styles.otpBoxActiveRow : null,
                  otpFocused && index === otp.length ? styles.otpBoxFocused : null,
                  displayError ? styles.otpBoxError : null,
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
              editable={!isLoading}
              nextFocusUp={findNodeHandle(resendRef.current) ?? findNodeHandle(backRef.current) ?? undefined}
              nextFocusDown={findNodeHandle(continueButtonRef.current) ?? undefined}
              onFocus={() => setOtpFocused(true)}
              onBlur={() => setOtpFocused(false)}
            />
          </View>
          {displayError ? <Text style={styles.errorText}>{displayError}</Text> : null}
        </Pressable>

        <Pressable
          ref={continueButtonRef}
          style={[
            styles.continueButton,
            continueFocused ? styles.continueButtonFocused : null,
            isLoading ? styles.continueButtonDisabled : null,
          ]}
          disabled={isLoading}
          nextFocusUp={findNodeHandle(otpInputRef.current) ?? undefined}
          onFocus={() => setContinueFocused(true)}
          onBlur={() => setContinueFocused(false)}
          onPress={handleContinuePress}
        >
          {isLoading ? (
            <ActivityIndicator color="#D2D2D2" />
          ) : (
            <Text style={[styles.continueText, continueFocused ? styles.continueTextFocused : null]}>
              Verify and Continue
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
  helpText: {
    marginTop: 12,
    color: "#8E8E8E",
    ...gillSans("400"),
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.15,
    textAlign: "center",
    textDecorationLine: "underline",
  },
  helpTextFocused: {
    color: "#FF5C4D",
  },
  otpSection: {
    marginTop: 40,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    alignSelf: "center",
    flexWrap: "wrap",
    maxWidth: 360,
  },
  otpBox: {
    width: 48,
    height: 56,
    backgroundColor: "#1A1A1A",
    borderBottomWidth: 1,
    borderBottomColor: "#4E4E4E",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonFocused: {
    borderWidth: 2,
    borderColor: "#FF5C4D",
    backgroundColor: "rgba(255, 92, 77, 0.35)",
  },
  otpBoxActiveRow: {
    backgroundColor: "rgba(255, 59, 48, 0.12)",
    borderBottomColor: "#FF5C4D",
  },
  otpBoxFocused: {
    backgroundColor: "#FF3B301A",
    borderBottomWidth: 3,
    borderBottomColor: "#FF5C4D",
  },
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
    textAlign: "center",
    ...gillSans("400"),
  },
  otpDigit: {
    color: "#D2D2D2",
    fontSize: 20,
    lineHeight: 24,
    ...gillSans("600"),
    textAlign: "center",
  },
  otpHiddenInput: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 56,
    opacity: 0,
    color: "transparent",
  },
  continueButton: {
    marginTop: 32,
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
  continueButtonFocused: {
    borderWidth: 3,
    borderColor: "#FF5C4D",
    backgroundColor: "#FFFFFF",
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
