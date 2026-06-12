import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
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
import { useScreenInsets } from "../hooks/useScreenInsets";
import { getPhoneValidationError, normalizePhone } from "../utils/phoneAuth";

function formatCurrentPhoneDisplay(phone) {
  const digits = normalizePhone(phone) || "09123456789";
  if (digits.startsWith("09")) {
    return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  }
  if (digits.startsWith("959")) {
    return `0${digits.slice(2, 3)} ${digits.slice(3)}`;
  }
  return digits;
}

function PhoneField({ label, value, onChangeText, placeholder, editable = true, inputRef, focused, onFocus, onBlur, error, nextFocusUp, nextFocusDown }) {
  return (
    <View style={styles.fieldSection}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          focused ? styles.inputContainerFocused : null,
          error ? styles.inputContainerError : null,
          !editable ? styles.inputContainerReadOnly : null,
        ]}
      >
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A7A7A7"
          editable={editable}
          showSoftInputOnFocus={editable}
          keyboardType="phone-pad"
          onFocus={onFocus}
          onBlur={onBlur}
          nextFocusUp={nextFocusUp}
          nextFocusDown={nextFocusDown}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export default function EditPhoneNumberScreen({ phoneNumber, onBack, onSendOtp, onSearchPress }) {
  const { contentBottomPadding } = useScreenInsets(24);
  const [backFocused, setBackFocused] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newPhoneFocused, setNewPhoneFocused] = useState(false);
  const [submitFocused, setSubmitFocused] = useState(false);
  const [newPhoneError, setNewPhoneError] = useState("");

  const newPhoneInputRef = useRef(null);
  const submitButtonRef = useRef(null);

  const currentPhoneDisplay = formatCurrentPhoneDisplay(phoneNumber);

  const handleSendOtp = () => {
    const validationError = getPhoneValidationError(newPhone, "MM");
    if (validationError) {
      setNewPhoneError(validationError);
      return;
    }

    const normalizedNew = normalizePhone(newPhone);
    const normalizedCurrent = normalizePhone(phoneNumber);

    if (normalizedNew === normalizedCurrent) {
      setNewPhoneError("New phone number must be different from current number");
      return;
    }

    onSendOtp?.(newPhone);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable
          style={[styles.headerIconButton, backFocused ? styles.headerIconButtonFocused : null]}
          onPress={onBack}
          onFocus={() => setBackFocused(true)}
          onBlur={() => setBackFocused(false)}
          nextFocusDown={findNodeHandle(newPhoneInputRef.current) ?? undefined}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          Edit phone number
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

      <View style={styles.body}>
        <PhoneField
          label="Current phone number"
          value={currentPhoneDisplay}
          editable={false}
        />

        <PhoneField
          label="New phone number"
          value={newPhone}
          onChangeText={(value) => {
            setNewPhone(value);
            if (newPhoneError) {
              setNewPhoneError("");
            }
          }}
          placeholder="09 XXXXXXXX"
          inputRef={newPhoneInputRef}
          focused={newPhoneFocused}
          onFocus={() => setNewPhoneFocused(true)}
          onBlur={() => setNewPhoneFocused(false)}
          error={newPhoneError}
          nextFocusDown={findNodeHandle(submitButtonRef.current) ?? undefined}
        />
      </View>

      <View style={[styles.footer, { paddingBottom: contentBottomPadding }]}>
        <Pressable
          ref={submitButtonRef}
          style={[styles.submitButton, submitFocused ? styles.submitButtonFocused : null]}
          onPress={handleSendOtp}
          onFocus={() => setSubmitFocused(true)}
          onBlur={() => setSubmitFocused(false)}
          nextFocusUp={findNodeHandle(newPhoneInputRef.current) ?? undefined}
        >
          <Text style={[styles.submitButtonText, submitFocused ? styles.submitButtonTextFocused : null]}>
            Send OTP code
          </Text>
        </Pressable>
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
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  fieldSection: {
    marginBottom: 24,
  },
  fieldLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    ...gillSans("400"),
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
  inputContainerReadOnly: {
    backgroundColor: "#2D1A1A",
    borderBottomColor: "#E71809",
  },
  inputContainerFocused: {
    backgroundColor: "#FF3B301A",
    borderBottomWidth: 3,
    borderBottomColor: "#FF5C4D",
  },
  inputContainerError: {
    borderBottomWidth: 3,
    borderBottomColor: "#E71809",
    backgroundColor: "rgba(231, 24, 9, 0.15)",
  },
  input: {
    flex: 1,
    paddingTop: 4,
    paddingRight: 8,
    paddingBottom: 4,
    paddingLeft: 8,
    color: "#D2D2D2",
    fontSize: 16,
    lineHeight: 24,
    ...gillSans("400"),
    backgroundColor: "transparent",
  },
  errorText: {
    marginTop: 8,
    color: "#FF988F",
    fontSize: 12,
    lineHeight: 16,
    ...gillSans("400"),
  },
  footer: {
    paddingHorizontal: 16,
  },
  submitButton: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C80D00",
    backgroundColor: "#C80D00",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  submitButtonFocused: {
    borderWidth: 3,
    borderColor: "#FF5C4D",
    backgroundColor: "#FFFFFF",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 24,
    textAlign: "center",
    ...gillSans("600"),
  },
  submitButtonTextFocused: {
    color: "#C80D00",
  },
});
