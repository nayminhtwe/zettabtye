import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { gillSans } from "../constants/fonts";

export default function EditUsernameModal({
  visible,
  initialValue,
  onClose,
  onSave,
}) {
  const [draftUsername, setDraftUsername] = useState(initialValue);
  const [error, setError] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [cancelFocused, setCancelFocused] = useState(false);
  const [saveFocused, setSaveFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setDraftUsername(initialValue);
      setError("");
    }
  }, [visible, initialValue]);

  const handleSave = () => {
    const trimmed = draftUsername.trim();
    if (!trimmed) {
      setError("Please enter a username");
      return;
    }

    onSave?.(trimmed);
    onClose?.();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close edit username dialog" />

        <View style={styles.card}>
          <Text style={styles.title}>Edit username</Text>

          <View
            style={[
              styles.inputContainer,
              inputFocused ? styles.inputContainerFocused : null,
              error ? styles.inputContainerError : null,
            ]}
          >
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={draftUsername}
              onChangeText={(value) => {
                setDraftUsername(value);
                if (error) {
                  setError("");
                }
              }}
              placeholder="Enter username"
              placeholderTextColor="#8E8E8E"
              showSoftInputOnFocus
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              autoFocus
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              style={[styles.cancelButton, cancelFocused ? styles.actionButtonFocused : null]}
              onPress={onClose}
              onFocus={() => setCancelFocused(true)}
              onBlur={() => setCancelFocused(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[styles.saveButton, saveFocused ? styles.saveButtonFocused : null]}
              onPress={handleSave}
              onFocus={() => setSaveFocused(true)}
              onBlur={() => setSaveFocused(false)}
            >
              <Text style={[styles.saveButtonText, saveFocused ? styles.saveButtonTextFocused : null]}>
                Save
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 16,
    backgroundColor: "#1D1B20",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    zIndex: 1,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 16,
    ...gillSans("600"),
  },
  inputContainer: {
    minHeight: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4A4A4A",
    backgroundColor: "#2F2E37",
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  inputContainerFocused: {
    borderColor: "#FFFFFF",
    backgroundColor: "#3A3944",
  },
  inputContainerError: {
    borderColor: "#E71809",
    backgroundColor: "rgba(231, 24, 9, 0.12)",
  },
  input: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    paddingVertical: 8,
    ...gillSans("400"),
  },
  errorText: {
    marginTop: 8,
    color: "#FF988F",
    fontSize: 12,
    lineHeight: 16,
    ...gillSans("400"),
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4A4A4A",
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C80D00",
    backgroundColor: "#C80D00",
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonFocused: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  saveButtonFocused: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#FFFFFF",
  },
  cancelButtonText: {
    color: "#D2D2D2",
    fontSize: 14,
    lineHeight: 20,
    ...gillSans("600"),
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    ...gillSans("600"),
  },
  saveButtonTextFocused: {
    color: "#C80D00",
  },
});
