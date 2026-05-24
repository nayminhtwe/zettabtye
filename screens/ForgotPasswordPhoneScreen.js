import React, { useRef, useState } from "react";
import {
  findNodeHandle,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import FloatingPhoneInput from "../components/FloatingPhoneInput";
import ScreenHeader from "../components/ScreenHeader";
import { gillSans } from "../constants/fonts";
import { normalizePhone } from "../utils/phoneAuth";

export default function ForgotPasswordPhoneScreen({ onBack, onContinue }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [backFocused, setBackFocused] = useState(false);
  const [continueFocused, setContinueFocused] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const backRef = useRef(null);
  const phoneInputRef = useRef(null);
  const continueRef = useRef(null);

  const handleContinue = () => {
    const isPhoneEmpty = normalizePhone(phoneNumber).length === 0;

    setPhoneError(isPhoneEmpty ? "Please enter your phone number" : "");

    if (isPhoneEmpty) {
      return;
    }

    onContinue?.(phoneNumber);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBarSpacer} />

      <ScreenHeader
        title="Forgot Password"
        backRef={backRef}
        onBack={onBack}
        isBackFocused={backFocused}
        backFocusedStyle={styles.backButtonFocused}
        backFocusProps={{
          onFocus: () => setBackFocused(true),
          onBlur: () => setBackFocused(false),
          nextFocusDown: findNodeHandle(phoneInputRef.current) ?? undefined,
        }}
      />

      <View style={styles.content}>
        <Text style={styles.message}>
          Enter your phone number to receive an OTP code and reset your password.
        </Text>

        <View style={styles.phoneSection}>
          <FloatingPhoneInput
            inputRef={phoneInputRef}
            value={phoneNumber}
            onChangeText={(value) => {
              setPhoneNumber(value);
              if (phoneError) {
                setPhoneError("");
              }
            }}
            focusableProps={{
              nextFocusUp: findNodeHandle(backRef.current) ?? undefined,
              nextFocusDown: findNodeHandle(continueRef.current) ?? undefined,
            }}
          />
          {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
        </View>

        <Pressable
          ref={continueRef}
          style={[styles.continueButton, continueFocused ? styles.continueButtonFocused : null]}
          nextFocusUp={findNodeHandle(phoneInputRef.current) ?? undefined}
          onFocus={() => setContinueFocused(true)}
          onBlur={() => setContinueFocused(false)}
          onPress={handleContinue}
        >
          <Text style={[styles.continueText, continueFocused ? styles.continueTextFocused : null]}>
            Continue
          </Text>
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
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  message: {
    color: "#D2D2D2",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.15,
    ...gillSans("400"),
    textAlign: "center",
  },
  phoneSection: {
    marginTop: 32,
  },
  errorText: {
    marginTop: 8,
    color: "#E71809",
    fontSize: 14,
    lineHeight: 20,
    ...gillSans("400"),
  },
  backButtonFocused: {
    borderWidth: 2,
    borderColor: "#FF5C4D",
    backgroundColor: "rgba(255, 92, 77, 0.35)",
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
  continueButtonFocused: {
    borderWidth: 3,
    borderColor: "#FF5C4D",
    backgroundColor: "#FFFFFF",
    shadowColor: "#FF5C4D",
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
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
