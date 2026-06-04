import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PremiumMembershipCard from "../components/PremiumMembershipCard";
import SaleBannerCarousel from "../components/SaleBannerCarousel";
import { gillSans } from "../constants/fonts";
import { NOTIFICATION_SECTIONS } from "../utils/notifications";

function getInitialUnreadIds() {
  const ids = new Set();

  NOTIFICATION_SECTIONS.forEach((section) => {
    section.items.forEach((item) => {
      if (item.unread) {
        ids.add(item.id);
      }
    });
  });

  return ids;
}

const CONTENT_PADDING = 16;
const THUMB_WIDTH = 72;
const THUMB_HEIGHT = 108;

function NotificationRow({ item, isUnread, onPress, onStartWatching }) {
  return (
    <Pressable
      style={[styles.notificationRow, isUnread ? styles.notificationRowUnread : null]}
      onPress={() => onPress?.(item)}
    >
      <Image source={item.image} resizeMode="cover" style={styles.thumbImage} />
      <View style={styles.notificationCopy}>
        <View style={styles.statusRow}>
          <Ionicons name="time-outline" size={12} color="#8D93A4" />
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
        <Text style={styles.notificationTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.notificationSubtitle} numberOfLines={1}>
          {item.subtitle}
        </Text>
        <Pressable onPress={() => onStartWatching?.(item)}>
          <Text style={styles.startWatching}>Start watching</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function NotificationSection({ section, unreadIds, onItemPress, onStartWatching }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{section.label}</Text>
      <View style={styles.sectionList}>
        {section.items.map((item) => (
          <NotificationRow
            key={item.id}
            item={item}
            isUnread={unreadIds.has(item.id)}
            onPress={onItemPress}
            onStartWatching={onStartWatching}
          />
        ))}
      </View>
    </View>
  );
}

export default function NotificationsScreen({
  onBack,
  onSearchPress,
  onItemPress,
  onStartWatching,
}) {
  const [backFocused, setBackFocused] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [unreadIds, setUnreadIds] = useState(getInitialUnreadIds);

  const markAsRead = (itemId) => {
    setUnreadIds((current) => {
      if (!current.has(itemId)) {
        return current;
      }

      const next = new Set(current);
      next.delete(itemId);
      return next;
    });
  };

  const handleItemPress = (item) => {
    markAsRead(item.id);
    onItemPress?.(item);
  };

  const handleStartWatching = (item) => {
    markAsRead(item.id);
    onStartWatching?.(item);
  };

  const todaySection = NOTIFICATION_SECTIONS.find((section) => section.id === "today");
  const yesterdaySection = NOTIFICATION_SECTIONS.find((section) => section.id === "yesterday");

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
          Notifications
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
        <SaleBannerCarousel style={styles.saleBanner} />

        {todaySection ? (
          <NotificationSection
            section={todaySection}
            unreadIds={unreadIds}
            onItemPress={handleItemPress}
            onStartWatching={handleStartWatching}
          />
        ) : null}

        <PremiumMembershipCard style={styles.premiumCard} />

        {yesterdaySection ? (
          <NotificationSection
            section={yesterdaySection}
            unreadIds={unreadIds}
            onItemPress={handleItemPress}
            onStartWatching={handleStartWatching}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#06080F",
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
  saleBanner: {
    marginBottom: 8,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    color: "#8D93A4",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 10,
    ...gillSans("400"),
  },
  sectionList: {
    gap: 10,
  },
  notificationRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  notificationRowUnread: {
    backgroundColor: "#3E2A2A",
  },
  thumbImage: {
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    borderRadius: 6,
    backgroundColor: "#1A2741",
  },
  notificationCopy: {
    flex: 1,
    justifyContent: "center",
    gap: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    color: "#8D93A4",
    fontSize: 12,
    lineHeight: 16,
    ...gillSans("400"),
  },
  notificationTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    ...gillSans("600"),
  },
  notificationSubtitle: {
    color: "#8D93A4",
    fontSize: 13,
    lineHeight: 18,
    ...gillSans("400"),
  },
  startWatching: {
    marginTop: 4,
    color: "#E71809",
    fontSize: 14,
    lineHeight: 20,
    ...gillSans("600"),
  },
  premiumCard: {
    marginTop: 16,
  },
});
