import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { gillSans } from "../constants/fonts";

export default function LogoutConfirmModal({ visible, onClose, onConfirm }) {
  const [cancelFocused, setCancelFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close log out dialog" />

        <View style={styles.card}>
          <Text style={styles.title}>Log out?</Text>
          <Text style={styles.body}>Are you sure you want to log out of your account?</Text>

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
              style={[styles.confirmButton, confirmFocused ? styles.confirmButtonFocused : null]}
              onPress={onConfirm}
              onFocus={() => setConfirmFocused(true)}
              onBlur={() => setConfirmFocused(false)}
            >
              <Text style={[styles.confirmButtonText, confirmFocused ? styles.confirmButtonTextFocused : null]}>
                Log out
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
    ...gillSans("600"),
  },
  body: {
    marginTop: 8,
    color: "#B8B8B8",
    fontSize: 14,
    lineHeight: 22,
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
  confirmButton: {
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
  confirmButtonFocused: {
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
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    ...gillSans("600"),
  },
  confirmButtonTextFocused: {
    color: "#C80D00",
  },
});
