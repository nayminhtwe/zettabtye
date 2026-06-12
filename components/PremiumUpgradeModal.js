import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Illustration from "../assets/images/football/Illustration.svg";
import { gillSans } from "../constants/fonts";

export default function PremiumUpgradeModal({
  visible,
  onClose,
  onContactFacebook,
  isSubscriptionActive = false,
}) {
  const [contactFocused, setContactFocused] = useState(false);
  const hasFacebookAction = typeof onContactFacebook === "function";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close upgrade dialog" />

        <View style={styles.card}>
          <View style={styles.illustrationWrap}>
            <Illustration width={160} height={155} />
          </View>

          <Text style={styles.title}>
            {isSubscriptionActive ? (
              <>
                Extend your <Text style={styles.titleAccent}>Premium</Text>
              </>
            ) : (
              <>
                Upgrade to <Text style={styles.titleAccent}>Premium</Text>
              </>
            )}
          </Text>

          <Text style={styles.body}>
            {isSubscriptionActive
              ? "Keep full movies, live football matches, and ad-free streaming with Premium. Extension is quick & easy — just reach out to us on Facebook."
              : "Unlock full movies, live football matches, and ad-free streaming with Premium Membership. Upgrade is quick & easy — just reach out to us on Facebook."}
          </Text>

          {hasFacebookAction ? (
            <Pressable
              style={[styles.contactButton, contactFocused ? styles.contactButtonFocused : null]}
              onPress={onContactFacebook}
              onFocus={() => setContactFocused(true)}
              onBlur={() => setContactFocused(false)}
            >
              <Text style={styles.contactButtonText}>Contact Us on Facebook</Text>
            </Pressable>
          ) : null}
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
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 16,
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: "center",
    zIndex: 1,
  },
  illustrationWrap: {
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#1D1B20",
    fontSize: 22,
    lineHeight: 30,
    textAlign: "center",
    ...gillSans("700"),
  },
  titleAccent: {
    color: "#E71809",
  },
  body: {
    marginTop: 12,
    color: "#49454F",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    ...gillSans("400"),
  },
  contactButton: {
    marginTop: 20,
    alignSelf: "center",
    width: 201,
    height: 48,
    borderRadius: 8,
    opacity: 1,
    backgroundColor: "#5865F2",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
    paddingRight: 12,
    paddingBottom: 10,
    paddingLeft: 12,
  },
  contactButtonFocused: {
    borderWidth: 2,
    borderColor: "#1D1B20",
  },
  contactButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    ...gillSans("600"),
  },
});
