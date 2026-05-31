import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { isValidOtpCode, maskPhone } from "../utils/phoneAuth";

const OTP_LENGTH = 4;
const RESEND_SECONDS = 59;

export default function EditPhoneOtpScreen({ phoneNumber, onBack, onVerified, onSearchPress }) {
  const [backFocused, setBackFocused] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpFocused, setOtpFocused] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendSeconds, setResendSeconds] = useState(RESEND_SECONDS);

  const otpInputRef = useRef(null);

  const normalizedPhone = useMemo(() => maskPhone(phoneNumber), [phoneNumber]);

  const otpDigits = useMemo(() => {
    const chars = otp.split("");
    return Array.from({ length: OTP_LENGTH }, (_, index) => chars[index] ?? "");
  }, [otp]);

  useEffect(() => {
    if (resendSeconds <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setResendSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendSeconds]);

  const verifyOtp = (code) => {
    if (code.length < OTP_LENGTH) {
      return;
    }

    if (isValidOtpCode(code)) {
      setOtpError("");
      onVerified?.();
      return;
    }

    setOtpError("Invalid OTP code. Please try again.");
  };

  const handleOtpChange = (value) => {
    const nextOtp = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    setOtp(nextOtp);
    if (otpError) {
      setOtpError("");
    }
    if (nextOtp.length === OTP_LENGTH) {
      verifyOtp(nextOtp);
    }
  };

  const handleResendPress = () => {
    if (resendSeconds > 0) {
      return;
    }
    setResendSeconds(RESEND_SECONDS);
    setOtp("");
    setOtpError("");
    otpInputRef.current?.focus();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          style={[styles.headerIconButton, backFocused ? styles.headerIconButtonFocused : null]}
          onPress={onBack}
          onFocus={() => setBackFocused(true)}
          onBlur={() => setBackFocused(false)}
          nextFocusDown={findNodeHandle(otpInputRef.current) ?? undefined}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          OTP code
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

      <View style={styles.content}>
        <Text style={styles.message}>
          We sent an OTP code to your new phone number {normalizedPhone}.
        </Text>

        <View style={styles.resendRow}>
          <Pressable onPress={handleResendPress} disabled={resendSeconds > 0}>
            <Text style={[styles.resendLink, resendSeconds > 0 ? styles.resendLinkDisabled : null]}>
              Didn&apos;t receive a code?
            </Text>
          </Pressable>
          <Text style={styles.resendTimer}>
            {resendSeconds > 0 ? `0:${String(resendSeconds).padStart(2, "0")}s` : "Resend"}
          </Text>
        </View>

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
              onChangeText={handleOtpChange}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              showSoftInputOnFocus
              caretHidden
              onFocus={() => setOtpFocused(true)}
              onBlur={() => setOtpFocused(false)}
            />
          </View>
          {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 30,
  },
  message: {
    color: "#D2D2D2",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.15,
    textAlign: "center",
    ...gillSans("400"),
  },
  resendRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  resendLink: {
    color: "#8E8E8E",
    fontSize: 16,
    lineHeight: 24,
    textDecorationLine: "underline",
    ...gillSans("400"),
  },
  resendLinkDisabled: {
    opacity: 0.85,
  },
  resendTimer: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    ...gillSans("600"),
  },
  otpSection: {
    marginTop: 52,
    alignItems: "center",
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
  otpBox: {
    width: 72,
    height: 72,
    backgroundColor: "#1A1A1A",
    borderBottomWidth: 1,
    borderBottomColor: "#4E4E4E",
    alignItems: "center",
    justifyContent: "center",
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
  errorText: {
    marginTop: 16,
    color: "#E71809",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    ...gillSans("400"),
  },
});
