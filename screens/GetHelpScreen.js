import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ViberIcon from "../assets/images/help/basil_viber-outline.svg";
import PremiumMembershipCard from "../components/PremiumMembershipCard";
import { gillSans } from "../constants/fonts";
import { maskPhone } from "../utils/phoneAuth";

const CONTENT_PADDING = 16;
const HELP_PHONE = "+95 9 123456789";

function formatHelpPhone(phone) {
  const masked = maskPhone(phone);
  if (masked.startsWith("+959")) {
    return `+95 ${masked.slice(3, 4)} ${masked.slice(4)}`;
  }
  return HELP_PHONE;
}

function getViberChatUrl(phone) {
  const digits = maskPhone(phone).replace(/\D/g, "");
  return `viber://chat?number=${digits}`;
}

function openViberChat(phone) {
  Linking.openURL(getViberChatUrl(phone)).catch(() => {});
}

function HelpContactRow({ icon, iconElement, iconBackgroundColor, label, actionIcon, onActionPress }) {
  const [actionFocused, setActionFocused] = useState(false);

  return (
    <View style={styles.contactRow}>
      <View style={[styles.contactIconWrap, { backgroundColor: iconBackgroundColor }]}>
        {iconElement ?? <Ionicons name={icon} size={18} color="#FFFFFF" />}
      </View>
      <Text style={styles.contactLabel} numberOfLines={1}>
        {label}
      </Text>
      <Pressable
        onPress={onActionPress}
        onFocus={() => setActionFocused(true)}
        onBlur={() => setActionFocused(false)}
        style={[styles.contactActionButton, actionFocused ? styles.contactActionButtonFocused : null]}
      >
        <Ionicons name={actionIcon} size={18} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

export default function GetHelpScreen({ phoneNumber, onBack, onSearchPress }) {
  const [backFocused, setBackFocused] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const displayPhone = formatHelpPhone(phoneNumber);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          style={[styles.headerIconButton, backFocused ? styles.headerIconButtonFocused : null]}
          onPress={onBack}
          onFocus={() => setBackFocused(true)}
          onBlur={() => setBackFocused(false)}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          Get Help
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>About Us</Text>

        <View style={styles.contactList}>
          <HelpContactRow
            icon="call"
            iconBackgroundColor="#E71809"
            label={displayPhone}
            actionIcon="copy-outline"
            onActionPress={() => {}}
          />
          <View style={styles.contactDivider} />
          <HelpContactRow
            iconElement={<ViberIcon width={18} height={18} />}
            iconBackgroundColor="#7360F2"
            label={displayPhone}
            actionIcon="open-outline"
            onActionPress={() => openViberChat(phoneNumber)}
          />
          <View style={styles.contactDivider} />
          <HelpContactRow
            icon="logo-facebook"
            iconBackgroundColor="#0084FF"
            label="Zettabyte Movies"
            actionIcon="open-outline"
            onActionPress={() => {}}
          />
        </View>

        <PremiumMembershipCard variant="compact" style={styles.proCard} />
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: CONTENT_PADDING,
    paddingTop: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
    ...gillSans("600"),
  },
  contactList: {
    borderRadius: 12,
    backgroundColor: "#1D1B20",
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    gap: 12,
  },
  contactIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  contactLabel: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    ...gillSans("400"),
  },
  contactActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  contactActionButtonFocused: {
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  contactDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  proCard: {
    marginTop: 0,
  },
});
