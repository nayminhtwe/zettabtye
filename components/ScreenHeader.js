import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { gillSans } from "../constants/fonts";

export default function ScreenHeader({
  title,
  backRef,
  onBack,
  isBackFocused = false,
  backFocusProps = {},
  backFocusedStyle,
}) {
  return (
    <View style={styles.topBar}>
      <Pressable
        ref={backRef}
        android_ripple={null}
        style={
          isBackFocused
            ? [styles.backButton, styles.backButtonFocused, backFocusedStyle]
            : styles.backButton
        }
        onPress={onBack}
        {...backFocusProps}
      >
        <Ionicons name="chevron-back" size={24} color="#D2D2D2" />
      </Pressable>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1D1B20",
    paddingHorizontal: 56,
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
  headerTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 21,
    letterSpacing: 0.15,
    ...gillSans("600"),
    textAlign: "center",
  },
});
