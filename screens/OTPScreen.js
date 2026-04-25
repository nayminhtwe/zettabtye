import React, { useMemo, useRef, useState } from "react";
import {
  findNodeHandle,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

function maskPhone(phone) {
  if (!phone) {
    return "+95987654321";
  }

  const digits = phone.replace(/\D/g, "");
  if (!digits) {
    return "+95987654321";
  }

  if (digits.startsWith("09")) {
    return `+95${digits.slice(1)}`;
  }

  if (digits.startsWith("95")) {
    return `+${digits}`;
  }

  return `+95${digits}`;
}

export default function OTPScreen({ phoneNumber, onBackToLogin }) {
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [backFocused, setBackFocused] = useState(false);
  const [otpFocused, setOtpFocused] = useState(false);
  const [continueFocused, setContinueFocused] = useState(false);
  const otpInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmInputRef = useRef(null);
  const continueButtonRef = useRef(null);

  const normalizedPhone = useMemo(() => maskPhone(phoneNumber), [phoneNumber]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBarSpacer} />

      <View style={styles.topBar}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            (pressed || backFocused) ? styles.backButtonFocused : null,
          ]}
          onPress={onBackToLogin}
          onFocus={() => setBackFocused(true)}
          onBlur={() => setBackFocused(false)}
        >
          <Text style={styles.backIcon}>{"<"}</Text>
        </Pressable>
        <Image
          source={require("../assets/images/logo.png")}
          resizeMode="contain"
          style={styles.logo}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.message}>
          We sent an OTP code to your new phone number {normalizedPhone}.
        </Text>
        <Text style={styles.helpText}>Didn&apos;t receive a code?</Text>

        <TextInput
          ref={otpInputRef}
          style={[styles.otpInput, otpFocused ? styles.otpInputFocused : null]}
          value={otp}
          onChangeText={(value) => setOtp(value.replace(/\D/g, "").slice(0, 4))}
          placeholder="Enter OTP"
          placeholderTextColor="#A7A7A7"
          keyboardType="number-pad"
          maxLength={4}
          showSoftInputOnFocus
          nextFocusDown={findNodeHandle(passwordInputRef.current) ?? undefined}
          onFocus={() => setOtpFocused(true)}
          onBlur={() => setOtpFocused(false)}
        />

        <View style={styles.inputContainer}>
          <TextInput
            ref={passwordInputRef}
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#D2D2D2"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            nextFocusUp={findNodeHandle(otpInputRef.current) ?? undefined}
            nextFocusDown={findNodeHandle(confirmInputRef.current) ?? undefined}
          />
          <Pressable onPress={() => setShowPassword((prev) => !prev)}>
            <Text style={styles.eyeText}>{showPassword ? "Hide" : "Show"}</Text>
          </Pressable>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            ref={confirmInputRef}
            style={styles.input}
            placeholder="Confirm your password"
            placeholderTextColor="#D2D2D2"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            nextFocusUp={findNodeHandle(passwordInputRef.current) ?? undefined}
            nextFocusDown={findNodeHandle(continueButtonRef.current) ?? undefined}
          />
          <Pressable onPress={() => setShowConfirmPassword((prev) => !prev)}>
            <Text style={styles.eyeText}>{showConfirmPassword ? "Hide" : "Show"}</Text>
          </Pressable>
        </View>

        <Pressable
          ref={continueButtonRef}
          style={({ pressed }) => [
            styles.continueButton,
            (pressed || continueFocused) ? styles.continueButtonFocused : null,
          ]}
          nextFocusUp={findNodeHandle(confirmInputRef.current) ?? undefined}
          onFocus={() => setContinueFocused(true)}
          onBlur={() => setContinueFocused(false)}
          onPress={() => {}}
        >
          <Text style={styles.continueText}>Confirm and Continue</Text>
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
  topBar: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1D1B20",
  },
  backButton: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonFocused: {
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  backIcon: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  logo: {
    width: 140,
    height: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 30,
  },
  message: {
    alignSelf: "center",
    width: 338,
    color: "#D2D2D2",
    fontSize: 20,
    lineHeight: 24,
    textAlign: "center",
  },
  helpText: {
    marginTop: 4,
    color: "#8E8E8E",
    fontSize: 20,
    lineHeight: 24,
    textAlign: "center",
  },
  otpInput: {
    marginTop: 52,
    height: 64,
    borderWidth: 1,
    borderColor: "#4D4D4D",
    backgroundColor: "#1A1A1A",
    color: "#D2D2D2",
    fontSize: 24,
    lineHeight: 28,
    textAlign: "center",
    letterSpacing: 8,
  },
  otpInputFocused: {
    borderColor: "#FF5C4D",
    shadowColor: "#E71809",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  inputContainer: {
    marginTop: 24,
    height: 64,
    borderWidth: 1,
    borderColor: "#4A4A4A",
    backgroundColor: "#1A1A1A",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    color: "#D2D2D2",
    fontSize: 20,
    lineHeight: 24,
  },
  eyeText: {
    color: "#D2D2D2",
    fontSize: 14,
    fontWeight: "500",
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
    borderColor: "#FF5C4D",
    shadowColor: "#E71809",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  continueText: {
    color: "#D2D2D2",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "600",
  },
});
