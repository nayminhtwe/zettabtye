import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  findNodeHandle,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import ScreenHeader from "../components/ScreenHeader";
import { gillSans } from "../constants/fonts";
import { authSetPasswordRequest } from "../store/auth/actions";
import { selectAuthError, selectAuthLoading } from "../store/auth/selectors";

export default function CreatePasswordScreen() {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [continueFocused, setContinueFocused] = useState(false);

  const passwordInputRef = useRef(null);
  const confirmInputRef = useRef(null);
  const continueRef = useRef(null);
  const dummyBackRef = useRef(null);

  const handleContinue = () => {
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    setPasswordError("");
    dispatch(authSetPasswordRequest(password));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBarSpacer} />

      <ScreenHeader
        title="Create Password"
        backRef={dummyBackRef}
        onBack={null}
        isBackFocused={false}
        backFocusProps={{}}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Create a password for your account so you can log in next time.
        </Text>

        <View style={styles.fieldSection}>
          <View style={[styles.inputContainer, passwordFocused ? styles.inputFocused : null]}>
            <TextInput
              ref={passwordInputRef}
              style={styles.input}
              placeholder="Create password"
              placeholderTextColor="#A7A7A7"
              secureTextEntry={!showPassword}
              showSoftInputOnFocus
              value={password}
              editable={!isLoading}
              onChangeText={(v) => {
                setPassword(v);
                if (passwordError) setPasswordError("");
              }}
              nextFocusDown={findNodeHandle(confirmInputRef.current) ?? undefined}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
            <Pressable style={styles.eyeButton} onPress={() => setShowPassword((p) => !p)}>
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#D2D2D2" />
            </Pressable>
          </View>

          <View
            style={[
              styles.inputContainer,
              styles.inputMarginTop,
              confirmFocused ? styles.inputFocused : null,
            ]}
          >
            <TextInput
              ref={confirmInputRef}
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor="#A7A7A7"
              secureTextEntry={!showConfirm}
              showSoftInputOnFocus
              value={confirmPassword}
              editable={!isLoading}
              onChangeText={(v) => {
                setConfirmPassword(v);
                if (passwordError) setPasswordError("");
              }}
              nextFocusUp={findNodeHandle(passwordInputRef.current) ?? undefined}
              nextFocusDown={findNodeHandle(continueRef.current) ?? undefined}
              onFocus={() => setConfirmFocused(true)}
              onBlur={() => setConfirmFocused(false)}
            />
            <Pressable style={styles.eyeButton} onPress={() => setShowConfirm((p) => !p)}>
              <Ionicons name={showConfirm ? "eye-off" : "eye"} size={20} color="#D2D2D2" />
            </Pressable>
          </View>

          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
        </View>

        <Pressable
          ref={continueRef}
          style={[
            styles.continueButton,
            continueFocused ? styles.continueButtonFocused : null,
            isLoading ? styles.continueButtonDisabled : null,
          ]}
          disabled={isLoading}
          nextFocusUp={findNodeHandle(confirmInputRef.current) ?? undefined}
          onFocus={() => setContinueFocused(true)}
          onBlur={() => setContinueFocused(false)}
          onPress={handleContinue}
        >
          {isLoading ? (
            <ActivityIndicator color={continueFocused ? "#C80D00" : "#D2D2D2"} />
          ) : (
            <Text
              style={[styles.continueText, continueFocused ? styles.continueTextFocused : null]}
            >
              Set Password
            </Text>
          )}
        </Pressable>
      </ScrollView>
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
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
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
  inputMarginTop: {
    marginTop: 12,
  },
  inputFocused: {
    borderBottomColor: "#E71809",
    backgroundColor: "#FF3B301A",
  },
  input: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
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
