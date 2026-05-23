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

export default function PasswordScreen({ phoneNumber, onBack, onContinue }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [backFocused, setBackFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [continueFocused, setContinueFocused] = useState(false);

  const backRef = useRef(null);
  const passwordInputRef = useRef(null);
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
            nextFocusDown={findNodeHandle(continueRef.current) ?? undefined}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
          />
          <Pressable onPress={() => setShowPassword((prev) => !prev)}>
            <Text style={styles.eyeText}>{showPassword ? "Hide" : "Show"}</Text>
          </Pressable>
        </View>

        <Pressable
          ref={continueRef}
          style={[styles.continueButton, continueFocused ? styles.continueButtonFocused : null]}
          nextFocusUp={findNodeHandle(passwordInputRef.current) ?? undefined}
          onFocus={() => setContinueFocused(true)}
          onBlur={() => setContinueFocused(false)}
          onPress={() => onContinue(password)}
        >
          <Text style={styles.continueText}>Continue</Text>
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
  inputContainer: {
    marginTop: 24,
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
  eyeText: {
    color: "#D2D2D2",
    fontSize: 14,
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
    ...gillSans("600"),
  },
});
