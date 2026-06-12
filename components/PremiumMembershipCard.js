import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";
import { gillSans } from "../constants/fonts";
import { selectSubscriptionPricing, selectSupportContacts } from "../store/ads/selectors";
import { formatUpgradeButtonText } from "../utils/appSettings";
import PremiumUpgradeModal from "./PremiumUpgradeModal";

const FEATURES = [
  { label: "Early updates on new releases", free: "check", premium: "check" },
  { label: "Ad-free experience", free: "dash", premium: "check" },
  { label: "Stream in HD across devices", free: "dash", premium: "check" },
  { label: "Full access to Zettabyte", free: "dash", premium: "all" },
];

function FeatureValue({ value }) {
  if (value === "check") {
    return <Ionicons name="checkmark" size={16} color="#FFFFFF" />;
  }

  if (value === "all") {
    return <Text style={styles.allText}>ALL</Text>;
  }

  return <Text style={styles.dashText}>—</Text>;
}

export default function PremiumMembershipCard({ onUpgrade, variant = "full", style }) {
  const [upgradeFocused, setUpgradeFocused] = useState(false);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const subscriptionPricing = useSelector(selectSubscriptionPricing);
  const supportContacts = useSelector(selectSupportContacts);
  const isCompact = variant === "compact";
  const upgradeButtonText = useMemo(
    () => formatUpgradeButtonText(subscriptionPricing),
    [subscriptionPricing],
  );
  const facebookAction = useMemo(
    () => supportContacts.find((contact) => contact.id === "facebook")?.action ?? null,
    [supportContacts],
  );

  const handleUpgradePress = () => {
    setUpgradeModalVisible(true);
    onUpgrade?.();
  };

  return (
    <>
    <LinearGradient
      colors={["rgba(80, 28, 24, 0.55)", "rgba(24, 12, 18, 0.92)", "rgba(12, 10, 14, 0.98)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, isCompact ? styles.cardCompact : null, style]}
    >
      {isCompact ? (
        <View style={styles.compactDecor} pointerEvents="none">
          <Ionicons name="film-outline" size={28} color="rgba(255,255,255,0.06)" style={styles.decorIconTop} />
          <Ionicons name="videocam-outline" size={24} color="rgba(255,255,255,0.05)" style={styles.decorIconMid} />
          <Ionicons name="football-outline" size={22} color="rgba(255,255,255,0.05)" style={styles.decorIconBottom} />
        </View>
      ) : null}

      <Text style={[styles.title, isCompact ? styles.titleCompact : null]}>
        Enjoy <Text style={styles.titleAccent}>{isCompact ? "Pro" : "Premium"}</Text> Membership!
      </Text>
      <Text style={[styles.subtitle, isCompact ? styles.subtitleCompact : null]}>
        Better in ~ Movies. Matches. Unlimited excitement.
      </Text>

      {!isCompact ? (
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.featureHeaderCell} />
            <Text style={styles.columnHeader}>Free</Text>
            <Text style={[styles.columnHeader, styles.premiumColumnHeader]}>Premium</Text>
          </View>

          <View style={styles.premiumColumnHighlight} pointerEvents="none" />

          {FEATURES.map((feature) => (
            <View key={feature.label} style={styles.tableRow}>
              <Text style={styles.featureLabel}>{feature.label}</Text>
              <View style={styles.valueCell}>
                <FeatureValue value={feature.free} />
              </View>
              <View style={[styles.valueCell, styles.premiumValueCell]}>
                <FeatureValue value={feature.premium} />
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={handleUpgradePress}
        onFocus={() => setUpgradeFocused(true)}
        onBlur={() => setUpgradeFocused(false)}
        style={[
          styles.upgradeButtonWrap,
          isCompact ? styles.upgradeButtonWrapCompact : null,
          upgradeFocused ? styles.upgradeButtonFocused : null,
        ]}
      >
        <LinearGradient
          colors={["#E71809", "#FF6B3D"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.upgradeButton}
        >
          <Text style={styles.upgradeButtonText}>{upgradeButtonText}</Text>
        </LinearGradient>
      </Pressable>
    </LinearGradient>

    <PremiumUpgradeModal
      visible={upgradeModalVisible}
      onClose={() => setUpgradeModalVisible(false)}
      onContactFacebook={
        facebookAction
          ? () => {
              Linking.openURL(facebookAction).catch(() => {});
            }
          : undefined
      }
    />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    overflow: "hidden",
  },
  cardCompact: {
    marginTop: 0,
    minHeight: 180,
    justifyContent: "space-between",
  },
  compactDecor: {
    ...StyleSheet.absoluteFillObject,
  },
  decorIconTop: {
    position: "absolute",
    top: 18,
    right: 24,
  },
  decorIconMid: {
    position: "absolute",
    top: 72,
    right: 80,
  },
  decorIconBottom: {
    position: "absolute",
    bottom: 72,
    right: 36,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 30,
    ...gillSans("700"),
  },
  titleAccent: {
    color: "#FF6B3D",
  },
  titleCompact: {
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    color: "rgba(255, 255, 255, 0.72)",
    fontSize: 13,
    lineHeight: 20,
    fontStyle: "italic",
    ...gillSans("400"),
  },
  subtitleCompact: {
    textAlign: "center",
  },
  table: {
    marginTop: 18,
    position: "relative",
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  featureHeaderCell: {
    flex: 1.6,
  },
  columnHeader: {
    width: 56,
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 18,
    ...gillSans("600"),
  },
  premiumColumnHeader: {
    width: 72,
  },
  premiumColumnHighlight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 72,
    bottom: 0,
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.42)",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 34,
    paddingVertical: 4,
  },
  featureLabel: {
    flex: 1.6,
    color: "#FFFFFF",
    fontSize: 11,
    lineHeight: 16,
    paddingRight: 8,
    ...gillSans("400"),
  },
  valueCell: {
    width: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumValueCell: {
    width: 72,
  },
  dashText: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 16,
    lineHeight: 20,
  },
  allText: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 16,
    ...gillSans("700"),
  },
  upgradeButtonWrap: {
    marginTop: 18,
    borderRadius: 10,
    overflow: "hidden",
  },
  upgradeButtonWrapCompact: {
    marginTop: 24,
  },
  upgradeButtonFocused: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  upgradeButton: {
    minHeight: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  upgradeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    ...gillSans("600"),
  },
});
