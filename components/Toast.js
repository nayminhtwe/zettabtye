import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { gillSans } from "../constants/fonts";

export default function Toast({ visible, message, bottom = 32 }) {
  if (!visible || !message) {
    return null;
  }

  return (
    <View style={[styles.container, { bottom }]} pointerEvents="none">
      <View style={styles.toast}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
    zIndex: 100,
  },
  toast: {
    backgroundColor: "#2F2E37",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: "100%",
    borderWidth: 1,
    borderColor: "#4A454E",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    ...gillSans("500"),
  },
});
