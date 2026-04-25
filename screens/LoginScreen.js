import React, { useState } from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import StepProgressBar from "../components/StepProgressBar";

export default function LoginScreen({ onBackToOnboarding, onContinue }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [buttonFocused, setButtonFocused] = useState(false);
  const [backFocused, setBackFocused] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBarSpacer} />

      <View style={styles.topBar}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            (pressed || backFocused) ? styles.backButtonFocused : null,
          ]}
          onPress={onBackToOnboarding}
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
        <Text style={styles.title}>Enter with Phone Number</Text>
        <Text style={styles.subtitle}>Easy Application Access</Text>
        <Text style={styles.description}>
          Enter your phone number to claim your free membership and unlock your
          entertainment pass.
        </Text>

        <View style={styles.progressWrapper}>
          <StepProgressBar totalSteps={3} currentStep={3} />
        </View>

        <TextInput
          style={[
            styles.input,
            inputFocused ? styles.inputFocused : null,
            buttonFocused ? styles.inputDimmed : null,
          ]}
          placeholder="09 XXXXXXXX"
          placeholderTextColor="#A7A7A7"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
        />

        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            (pressed || buttonFocused) ? styles.continueButtonFocused : null,
          ]}
          onFocus={() => setButtonFocused(true)}
          onBlur={() => setButtonFocused(false)}
          onPress={() => onContinue(phoneNumber)}
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
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 44,
    lineHeight: 54,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 24,
    color: "#D2D2D2",
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "600",
  },
  description: {
    marginTop: 16,
    color: "#D2D2D2",
    fontSize: 16,
    lineHeight: 24,
  },
  progressWrapper: {
    marginTop: 24,
    alignItems: "center",
  },
  input: {
    marginTop: 24,
    height: 64,
    borderWidth: 1,
    borderColor: "#4A4A4A",
    backgroundColor: "#1A1A1A",
    color: "#D2D2D2",
    fontSize: 20,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  inputFocused: {
    borderColor: "#E71809",
  },
  inputDimmed: {
    borderColor: "#4A4A4A",
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
