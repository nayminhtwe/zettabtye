import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { fetchSubscriptionStatus } from "../api/contentService";
import PremiumMembershipCard from "../components/PremiumMembershipCard";
import EditUsernameModal from "../components/EditUsernameModal";
import SaleBannerCarousel from "../components/SaleBannerCarousel";
import { gillSans } from "../constants/fonts";
import { useScreenInsets } from "../hooks/useScreenInsets";
import { selectAuthUser } from "../store/auth/selectors";
import { fetchHomeRequest } from "../store/catalog/actions";
import { selectAdvertisements } from "../store/catalog/selectors";
import { maskPhone, normalizePhone } from "../utils/phoneAuth";

const CONTENT_PADDING = 16;

function formatProfilePhone(phone) {
  const masked = maskPhone(phone);
  if (masked.startsWith("+959")) {
    return `+95 ${masked.slice(3, 4)} ${masked.slice(4)}`;
  }
  return masked;
}

function buildUsername(phone) {
  const digits = normalizePhone(phone);
  if (!digits) {
    return "User";
  }
  return `User${digits.slice(-9).padStart(9, "0")}`;
}

function formatSubscriptionDate(isoDate) {
  if (!isoDate) {
    return "—";
  }

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function SettingRow({ icon, label, onEditPress, editable = true }) {
  const [editFocused, setEditFocused] = useState(false);

  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIconWrap}>
        <Ionicons name={icon} size={18} color="#FFFFFF" />
      </View>
      <Text style={styles.settingLabel} numberOfLines={1}>
        {label}
      </Text>
      {editable && onEditPress ? (
        <Pressable
          onPress={onEditPress}
          onFocus={() => setEditFocused(true)}
          onBlur={() => setEditFocused(false)}
          style={[styles.editButton, editFocused ? styles.editButtonFocused : null]}
        >
          <Ionicons name="pencil" size={16} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </View>
  );
}

export default function ProfileScreen({
  phoneNumber,
  username: usernameProp,
  hasAccountPassword = true,
  passwordUpdateSuccess,
  phoneUpdateSuccess,
  onBack,
  onCreatePasswordPress,
  onEditPhonePress,
  onUsernameChange,
  onSearchPress,
}) {
  const dispatch = useDispatch();
  const { contentBottomPadding } = useScreenInsets(32);
  const authUser = useSelector(selectAuthUser);
  const advertisements = useSelector(selectAdvertisements);
  const [backFocused, setBackFocused] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [passwordLinkFocused, setPasswordLinkFocused] = useState(false);
  const [usernameModalVisible, setUsernameModalVisible] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return undefined;
    }

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (usernameModalVisible) {
        setUsernameModalVisible(false);
        return true;
      }

      return false;
    });

    return () => subscription.remove();
  }, [usernameModalVisible]);

  useEffect(() => {
    dispatch(fetchHomeRequest());
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;

    fetchSubscriptionStatus()
      .then((response) => {
        if (!cancelled) {
          setSubscriptionStatus(response);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSubscriptionStatus({
            success: false,
            message: "Unable to load subscription status.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSubscriptionLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const defaultUsername = buildUsername(phoneNumber);
  const username = usernameProp || defaultUsername;
  const displayPhone = formatProfilePhone(phoneNumber);
  const hasPassword = hasAccountPassword;
  const maskedPassword = "•••••••";
  const subscriptionEndDate =
    authUser?.subscription_end_date ?? subscriptionStatus?.subscription_end_date ?? null;
  const subscriptionStartDate =
    authUser?.subscription_start_date ?? subscriptionStatus?.subscription_start_date ?? null;
  const isSubscriptionActive = subscriptionStatus?.success === true;
  const subscriptionPlanLabel = isSubscriptionActive ? "Active subscription" : "No active subscription";
  const subscriptionMessage = subscriptionStatus?.message ?? "—";
  const subscriptionExpiryLabel = isSubscriptionActive ? "Expires on" : "Status";

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
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
          Account details
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
        contentContainerStyle={[styles.content, { paddingBottom: contentBottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <SaleBannerCarousel slides={advertisements} style={styles.saleBanner} />

        {passwordUpdateSuccess ? (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>password is successfully updated!</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>General setting</Text>
        <View style={styles.sectionCard}>
          <SettingRow
            icon="person-outline"
            label={username}
            onEditPress={() => setUsernameModalVisible(true)}
          />
          <View style={styles.settingDivider} />
          <View>
            <SettingRow icon="call-outline" label={displayPhone} editable={false} />
            {phoneUpdateSuccess ? (
              <Text style={styles.phoneUpdateSuccessText}>Phone number is successfully changed!</Text>
            ) : null}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Set a password</Text>
        {hasPassword ? (
          <View style={styles.passwordDisplaySection}>
            <View style={styles.passwordDisplayRow}>
              <Text style={styles.passwordDisplayText}>{maskedPassword}</Text>
              <Pressable
                onPress={onCreatePasswordPress}
                onFocus={() => setPasswordLinkFocused(true)}
                onBlur={() => setPasswordLinkFocused(false)}
                style={[
                  styles.passwordToggleButton,
                  passwordLinkFocused ? styles.passwordToggleButtonFocused : null,
                ]}
              >
                <Ionicons name="pencil" size={16} color="#D2D2D2" />
              </Pressable>
            </View>
            <View style={styles.passwordUnderline} />
          </View>
        ) : (
          <>
            <Text style={styles.passwordDescription}>
              By setting up a password, you can easily enter your account without OTP code.
            </Text>
            <Pressable
              onPress={onCreatePasswordPress}
              onFocus={() => setPasswordLinkFocused(true)}
              onBlur={() => setPasswordLinkFocused(false)}
              style={[styles.passwordLinkWrap, passwordLinkFocused ? styles.passwordLinkFocused : null]}
            >
              <Text style={styles.passwordLink}>Create a new password</Text>
              <Ionicons name="arrow-forward" size={14} color="#E71809" />
            </Pressable>
          </>
        )}

        <Text style={[styles.sectionTitle, hasPassword ? styles.sectionTitleAfterPassword : null]}>
          Subscription status
        </Text>
        {subscriptionLoading ? (
          <ActivityIndicator color="#FFFFFF" style={styles.subscriptionLoading} />
        ) : (
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionIconWrap}>
              <Ionicons
                name={isSubscriptionActive ? "checkbox-outline" : "close-circle-outline"}
                size={22}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.subscriptionInfo}>
              <Text style={styles.subscriptionPlan}>{subscriptionPlanLabel}</Text>
              <Text style={styles.subscriptionPrice} numberOfLines={2}>
                {subscriptionMessage}
              </Text>
              {subscriptionStartDate ? (
                <Text style={styles.subscriptionStarted}>
                  Started {formatSubscriptionDate(subscriptionStartDate)}
                </Text>
              ) : null}
            </View>
            <View style={styles.subscriptionExpiry}>
              <Text style={styles.subscriptionExpiryLabel}>{subscriptionExpiryLabel}</Text>
              <Text style={styles.subscriptionExpiryDate}>
                {isSubscriptionActive
                  ? formatSubscriptionDate(subscriptionEndDate)
                  : subscriptionMessage}
              </Text>
            </View>
          </View>
        )}

        <PremiumMembershipCard variant="compact" style={styles.proCard} />
      </ScrollView>

      <EditUsernameModal
        visible={usernameModalVisible}
        initialValue={username}
        onClose={() => setUsernameModalVisible(false)}
        onSave={(value) => onUsernameChange?.(value)}
      />
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
  },
  saleBanner: {
    marginTop: 0,
    marginBottom: 20,
  },
  successBanner: {
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: "rgba(76, 175, 80, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.45)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  successBannerText: {
    color: "#8BE28B",
    fontSize: 14,
    lineHeight: 20,
    ...gillSans("600"),
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 10,
    ...gillSans("600"),
  },
  sectionCard: {
    borderRadius: 12,
    backgroundColor: "#1D1B20",
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    gap: 12,
  },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2F2E37",
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    ...gillSans("400"),
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  editButtonFocused: {
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  settingDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  phoneUpdateSuccessText: {
    color: "#8BE28B",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "right",
    paddingRight: 4,
    paddingBottom: 10,
    ...gillSans("400"),
  },
  passwordDescription: {
    color: "rgba(255, 255, 255, 0.72)",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
    ...gillSans("400"),
  },
  passwordLinkWrap: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginBottom: 24,
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderRadius: 4,
  },
  passwordLinkFocused: {
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  passwordLink: {
    color: "#E71809",
    fontSize: 14,
    lineHeight: 20,
    textDecorationLine: "underline",
    ...gillSans("600"),
  },
  passwordDisplaySection: {
    marginBottom: 24,
  },
  passwordDisplayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 40,
  },
  passwordDisplayText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 2,
    ...gillSans("400"),
  },
  passwordToggleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  passwordToggleButtonFocused: {
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  passwordUnderline: {
    height: 2,
    backgroundColor: "#E71809",
    marginTop: 4,
  },
  sectionTitleAfterPassword: {
    marginTop: 0,
  },
  subscriptionLoading: {
    marginBottom: 8,
  },
  subscriptionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#1D1B20",
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 8,
    gap: 12,
  },
  subscriptionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#2F2E37",
    alignItems: "center",
    justifyContent: "center",
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionPlan: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    ...gillSans("600"),
  },
  subscriptionPrice: {
    marginTop: 2,
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 12,
    lineHeight: 16,
    ...gillSans("400"),
  },
  subscriptionStarted: {
    marginTop: 4,
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 11,
    lineHeight: 14,
    ...gillSans("400"),
  },
  subscriptionExpiry: {
    borderWidth: 1,
    borderColor: "#E71809",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  subscriptionExpiryLabel: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 10,
    lineHeight: 14,
    ...gillSans("400"),
  },
  subscriptionExpiryDate: {
    marginTop: 2,
    color: "#E71809",
    fontSize: 11,
    lineHeight: 16,
    ...gillSans("600"),
  },
  proCard: {
    marginTop: 16,
  },
});
