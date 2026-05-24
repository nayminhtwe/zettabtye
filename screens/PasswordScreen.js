import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  findNodeHandle,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import ScreenHeader from "../components/ScreenHeader";
import { gillSans } from "../constants/fonts";

export default function PasswordScreen({ phoneNumber, onBack, onContinue, onForgotPassword }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [backFocused, setBackFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [forgotPasswordFocused, setForgotPasswordFocused] = useState(false);
  const [continueFocused, setContinueFocused] = useState(false);

  const backRef = useRef(null);
  const passwordInputRef = useRef(null);
  const forgotPasswordRef = useRef(null);
  const continueRef = useRef(null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBarSpacer} />

      <ScreenHeader
        title="Login"
        backRef={backRef}
        onBack={onBack}
        isBackFocused={backFocused}
        backFocusProps={{
          onFocus: () => setBackFocused(true),
          onBlur: () => setBackFocused(false),
          nextFocusDown: findNodeHandle(passwordInputRef.current) ?? undefined,
        }}
      />

      <View style={styles.content}>
        <Text style={styles.title}>Enter Your Password</Text>

        <View style={styles.passwordSection}>
          <View style={[styles.inputContainer, passwordFocused ? styles.inputFocused : null]}>
            <TextInput
              ref={passwordInputRef}
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#A7A7A7"
              secureTextEntry={!showPassword}
              showSoftInputOnFocus
              value={password}
              onChangeText={setPassword}
              nextFocusUp={findNodeHandle(backRef.current) ?? undefined}
              nextFocusDown={findNodeHandle(forgotPasswordRef.current) ?? undefined}
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
          <Pressable
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
          </Pressable>
        </View>

        <Pressable
          ref={continueRef}
          style={[styles.continueButton, continueFocused ? styles.continueButtonFocused : null]}
          nextFocusUp={findNodeHandle(forgotPasswordRef.current) ?? undefined}
          onFocus={() => setContinueFocused(true)}
          onBlur={() => setContinueFocused(false)}
          onPress={() => onContinue(password)}
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
  inputFocused: {
    borderBottomColor: "#E71809",
    backgroundColor: "#FF3B301A",
  },
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
  forgotPasswordButton: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  forgotPasswordButtonFocused: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
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
