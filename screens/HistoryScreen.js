import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { gillSans } from "../constants/fonts";
import { useScreenInsets } from "../hooks/useScreenInsets";
import { fetchHomeRequest } from "../store/catalog/actions";
import { selectAuthAuthenticated } from "../store/auth/selectors";
import { fetchFavoritesRequest } from "../store/favorites/actions";
import {
  selectFavoriteHistorySections,
  selectFavoriteMediaItems,
  selectFavoritesLoading,
} from "../store/favorites/selectors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTENT_PADDING = 16;
const FEATURED_WIDTH = SCREEN_WIDTH - CONTENT_PADDING * 2;
const FEATURED_HEIGHT = Math.min(280, Math.round(FEATURED_WIDTH * 0.58));
const THUMB_WIDTH = 72;
const THUMB_HEIGHT = 108;

function FeaturedHistoryCard({ item, onContinuePress }) {
  const [continueFocused, setContinueFocused] = useState(false);

  return (
    <View style={styles.featuredCard}>
      <Image source={item.image} resizeMode="cover" style={styles.featuredImage} />
      <BlurView intensity={17} tint="dark" style={styles.featuredBlurUpper} pointerEvents="none" />
      <BlurView intensity={34} tint="dark" style={styles.featuredBlurLower} pointerEvents="none" />
      <LinearGradient
        colors={["rgba(61, 61, 61, 0)", "#040316"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.featuredGradient}
        pointerEvents="none"
      />
      <View style={styles.featuredOverlay}>
        <Text style={styles.featuredTitle}>{item.title}</Text>
        <View style={styles.featuredMetaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={12} color="#F2C94C" />
            <Text style={styles.metaText}>IMDB {item.imdb}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={12} color="#FFFFFF" />
            <Text style={styles.metaText}>{item.seasons}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={12} color="#FFFFFF" />
            <Text style={styles.metaText}>{item.year}</Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.featuredContinueButton,
            continueFocused ? styles.featuredContinueButtonFocused : null,
            pressed ? styles.buttonPressed : null,
          ]}
          onFocus={() => setContinueFocused(true)}
          onBlur={() => setContinueFocused(false)}
          onPress={() => onContinuePress?.(item)}
        >
          <Text style={[
            styles.featuredContinueText,
            continueFocused ? styles.featuredContinueTextFocused : null,
          ]}>Continue watching</Text>
        </Pressable>
      </View>
    </View>
  );
}

function HistoryListItem({ item, onPress, onActionPress }) {
  const actionLabel = item.action === "watch_again" ? "Watch again" : "Continue watching";
  const [rowFocused, setRowFocused] = useState(false);
  const [actionFocused, setActionFocused] = useState(false);

  return (
    <Pressable
      style={[styles.historyRow, rowFocused ? styles.historyRowFocused : null]}
      onFocus={() => setRowFocused(true)}
      onBlur={() => setRowFocused(false)}
      onPress={() => onPress?.(item)}
    >
      <View style={styles.thumbWrap}>
        <Image source={item.image} resizeMode="cover" style={styles.thumbImage} />
        <View style={styles.thumbProgressTrack}>
          <View
            style={[
              styles.thumbProgressFill,
              { width: `${Math.max(0, Math.min(item.progress, 1)) * 100}%` },
            ]}
          />
        </View>
      </View>
      <View style={styles.historyCopy}>
        <Text style={styles.historyTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.historySubtitle} numberOfLines={1}>
          {item.subtitle}
        </Text>
        <Pressable
          onFocus={() => { setRowFocused(false); setActionFocused(true); }}
          onBlur={() => setActionFocused(false)}
          onPress={() => onActionPress?.(item)}
        >
          <Text style={[styles.historyAction, actionFocused ? styles.historyActionFocused : null]}>
            {actionLabel}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function HistoryScreen({
  onBack,
  onSearchPress,
  onContinuePress,
  onItemPress,
}) {
  const dispatch = useDispatch();
  const { contentBottomPadding } = useScreenInsets(32);
  const isAuthenticated = useSelector(selectAuthAuthenticated);
  const historySections = useSelector(selectFavoriteHistorySections);
  const favoriteItems = useSelector(selectFavoriteMediaItems);
  const favoritesLoading = useSelector(selectFavoritesLoading);
  const featuredItem = favoriteItems[0] ?? null;
  const [backFocused, setBackFocused] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    dispatch(fetchHomeRequest());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchFavoritesRequest());
    }
  }, [dispatch, isAuthenticated]);

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
          History
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
        {favoritesLoading && favoriteItems.length === 0 ? (
          <ActivityIndicator color="#FFFFFF" style={styles.loadingIndicator} />
        ) : null}

        {featuredItem ? (
          <FeaturedHistoryCard item={featuredItem} onContinuePress={onContinuePress} />
        ) : null}

        {historySections.length === 0 && !favoritesLoading ? (
          <Text style={styles.emptyText}>No saved items yet.</Text>
        ) : null}

        {historySections.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.label}</Text>
            {section.items.map((item) => (
              <HistoryListItem
                key={`${section.id}-${item.id}-${item.action}`}
                item={item}
                onPress={onItemPress}
                onActionPress={onContinuePress}
              />
            ))}
          </View>
        ))}
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
  },
  loadingIndicator: {
    marginVertical: 24,
  },
  emptyText: {
    color: "#8D93A4",
    fontSize: 16,
    textAlign: "center",
    marginTop: 24,
    ...gillSans("400"),
  },
  featuredCard: {
    width: FEATURED_WIDTH,
    height: FEATURED_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#2E364C",
    alignSelf: "center",
  },
  featuredImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  featuredBlurUpper: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "55.91%",
    height: "22%",
    overflow: "hidden",
  },
  featuredBlurLower: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "78%",
    bottom: 0,
    overflow: "hidden",
  },
  featuredGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  featuredTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 42,
    letterSpacing: 0,
    ...gillSans("700"),
  },
  featuredMetaRow: {
    marginTop: 6,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: "#E5E7EB",
    fontSize: 13,
    lineHeight: 16,
    ...gillSans("400"),
  },
  featuredContinueButton: {
    marginTop: 12,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: "#E71809",
    alignItems: "center",
    justifyContent: "center",
  },
  featuredContinueButtonFocused: {
    borderColor: "#FFFFFF",
    backgroundColor: "#FFFFFF",
  },
  featuredContinueText: {
    color: "#FFFFFF",
    fontSize: 17,
    lineHeight: 22,
    ...gillSans("600"),
  },
  featuredContinueTextFocused: {
    color: "#E71809",
  },
  filterBar: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateLabel: {
    color: "#8D93A4",
    fontSize: 16,
    lineHeight: 24,
    ...gillSans("400"),
  },
  filterWrap: {
    position: "relative",
    zIndex: 20,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    backgroundColor: "transparent",
  },
  filterButtonFocused: {
    borderWidth: 2,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  filterButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    ...gillSans("400"),
  },
  filterMenu: {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: 6,
    minWidth: 140,
    borderRadius: 8,
    backgroundColor: "#2F2E37",
    paddingVertical: 8,
    overflow: "hidden",
  },
  filterMenuItem: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
  },
  filterMenuItemText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 22,
    ...gillSans("400"),
  },
  filterMenuItemTextActive: {
    color: "#E71809",
    ...gillSans("600"),
  },
  filterBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  section: {
    marginTop: 20,
    gap: 14,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 26,
    ...gillSans("600"),
  },
  historyRow: {
    flexDirection: "row",
    gap: 12,
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 8,
    padding: 4,
  },
  historyRowFocused: {
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  thumbWrap: {
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#1A2741",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbProgressTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  thumbProgressFill: {
    height: "100%",
    backgroundColor: "#E71809",
  },
  historyCopy: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  historyTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    ...gillSans("600"),
  },
  historySubtitle: {
    color: "#8D93A4",
    fontSize: 13,
    lineHeight: 18,
    ...gillSans("400"),
  },
  historyAction: {
    marginTop: 4,
    color: "#E71809",
    fontSize: 14,
    lineHeight: 20,
    ...gillSans("600"),
  },
  historyActionFocused: {
    color: "#FFFFFF",
    textDecorationLine: "underline",
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
