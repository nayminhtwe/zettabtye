import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { gillSans } from "../constants/fonts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTENT_PADDING = 16;
const HERO_WIDTH = SCREEN_WIDTH - CONTENT_PADDING * 2;
const HERO_HEIGHT = Math.round(HERO_WIDTH * 0.56);
const EPISODE_THUMB_WIDTH = 120;
const EPISODE_THUMB_HEIGHT = 68;

function OverviewDetailField({ label, value }) {
  return (
    <View style={styles.overviewDetailField}>
      <Text style={styles.overviewDetailLabel}>{label}</Text>
      <Text style={styles.overviewDetailValue}>{value}</Text>
    </View>
  );
}

export default function SeriesDetailScreen({
  series,
  onBack,
  onPlay,
  onSearchPress,
}) {
  const [backFocused, setBackFocused] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [watchFocused, setWatchFocused] = useState(false);
  const [saveFocused, setSaveFocused] = useState(false);
  const [heroPlayFocused, setHeroPlayFocused] = useState(false);
  const [overviewDetailsExpanded, setOverviewDetailsExpanded] = useState(false);
  const [selectedSeasonId, setSelectedSeasonId] = useState(
    series?.seasonsList?.[0]?.id ?? null,
  );

  const selectedSeason = useMemo(
    () => series?.seasonsList?.find((season) => season.id === selectedSeasonId) ?? series?.seasonsList?.[0],
    [series, selectedSeasonId],
  );

  if (!series) {
    return null;
  }

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
          {series.title}
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
        <View style={styles.heroWrapper}>
          {series.image ? (
            <Image source={series.image} resizeMode="cover" style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]} />
          )}
          <Pressable
            style={styles.playButtonOverlay}
            onPress={onPlay}
            onFocus={() => setHeroPlayFocused(true)}
            onBlur={() => setHeroPlayFocused(false)}
          >
            <View style={[styles.playButton, heroPlayFocused ? styles.playButtonFocused : null]}>
              <Ionicons name="play" size={28} color="#1D1B20" style={styles.playIcon} />
            </View>
          </Pressable>
        </View>

        <Text style={styles.categories}>{series.categories}</Text>

        <Text style={styles.seriesTitle}>{series.title}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={14} color="#F2C94C" />
            <Text style={styles.metaText}>IMDB {series.imdbRating}/10</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color="#FFFFFF" />
            <Text style={styles.metaText}>{series.seasons}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color="#FFFFFF" />
            <Text style={styles.metaText}>{series.year}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={[styles.watchNowButton, watchFocused ? styles.watchNowButtonFocused : null]}
            onPress={onPlay}
            onFocus={() => setWatchFocused(true)}
            onBlur={() => setWatchFocused(false)}
          >
            <Text style={styles.watchNowText}>Watch now</Text>
          </Pressable>

          <Pressable
            style={[styles.saveLaterButton, saveFocused ? styles.saveLaterButtonFocused : null]}
            onFocus={() => setSaveFocused(true)}
            onBlur={() => setSaveFocused(false)}
          >
            <Text style={styles.saveLaterText}>Save for later</Text>
          </Pressable>
        </View>

        <Text style={styles.overviewHeading}>Overview</Text>
        <Text style={styles.overviewBody}>{series.overview}</Text>

        <View style={styles.overviewDetailsSection}>
          <Pressable
            style={styles.overviewDetailsToggle}
            onPress={() => setOverviewDetailsExpanded((current) => !current)}
          >
            <Text style={styles.overviewDetailLabel}>Directed by:</Text>
            <Ionicons
              name={overviewDetailsExpanded ? "chevron-up" : "chevron-down"}
              size={18}
              color="#FFFFFF"
            />
          </Pressable>
          {overviewDetailsExpanded ? (
            <View style={styles.overviewDetailsContent}>
              <OverviewDetailField label="Directed by:" value={series.director} />
              <OverviewDetailField label="Cast:" value={series.cast} />
              <OverviewDetailField label="Awards:" value={series.awards} />
            </View>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.seasonTabsScroll}
          contentContainerStyle={styles.seasonTabsContent}
        >
          {series.seasonsList.map((season) => {
            const isSelected = season.id === selectedSeason?.id;

            return (
              <Pressable
                key={season.id}
                onPress={() => setSelectedSeasonId(season.id)}
                style={[styles.seasonTab, isSelected ? styles.seasonTabActive : null]}
              >
                <Text style={[styles.seasonTabText, isSelected ? styles.seasonTabTextActive : null]}>
                  {season.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.episodeList}>
          {selectedSeason?.episodes.map((episode) => (
            <View key={episode.id} style={styles.episodeRow}>
              <Image
                source={episode.thumbnail}
                resizeMode="cover"
                style={styles.episodeThumbnail}
              />
              <View style={styles.episodeCopy}>
                <Text style={styles.episodeTitle}>{episode.title}</Text>
                <Text style={styles.episodeDescription} numberOfLines={3}>
                  {episode.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
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
  heroWrapper: {
    width: HERO_WIDTH,
    height: HERO_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
    alignSelf: "center",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroPlaceholder: {
    backgroundColor: "#2F2E37",
  },
  playButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  playButtonFocused: {
    borderWidth: 2,
    borderColor: "#E71809",
  },
  playIcon: {
    marginLeft: 4,
  },
  categories: {
    marginTop: 12,
    color: "#D2D2D2",
    fontSize: 12,
    lineHeight: 18,
    ...gillSans("400"),
  },
  seriesTitle: {
    marginTop: 8,
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 42,
    letterSpacing: 0,
    ...gillSans("700"),
  },
  metaRow: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: "#E5E7EB",
    fontSize: 13,
    lineHeight: 16,
    ...gillSans("400"),
  },
  actionRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 12,
  },
  watchNowButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#E71809",
    alignItems: "center",
    justifyContent: "center",
  },
  watchNowButtonFocused: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  watchNowText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    ...gillSans("600"),
  },
  saveLaterButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E71809",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  saveLaterButtonFocused: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  saveLaterText: {
    color: "#E71809",
    fontSize: 16,
    lineHeight: 24,
    ...gillSans("600"),
  },
  overviewHeading: {
    marginTop: 24,
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 30,
    ...gillSans("600"),
  },
  overviewBody: {
    marginTop: 8,
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 22,
    ...gillSans("400"),
  },
  overviewDetailsSection: {
    marginTop: 20,
  },
  overviewDetailsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  overviewDetailsContent: {
    marginTop: 4,
  },
  overviewDetailField: {
    marginTop: 16,
  },
  overviewDetailLabel: {
    color: "#79747E",
    fontSize: 13,
    lineHeight: 20,
    ...gillSans("600"),
  },
  overviewDetailValue: {
    marginTop: 4,
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 20,
    ...gillSans("400"),
  },
  seasonTabsScroll: {
    marginTop: 24,
  },
  seasonTabsContent: {
    gap: 20,
    paddingRight: 8,
  },
  seasonTab: {
    paddingBottom: 6,
  },
  seasonTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#FFFFFF",
  },
  seasonTabText: {
    color: "#8D93A4",
    fontSize: 16,
    lineHeight: 24,
    ...gillSans("400"),
  },
  seasonTabTextActive: {
    color: "#FFFFFF",
    ...gillSans("600"),
  },
  episodeList: {
    marginTop: 16,
    gap: 16,
  },
  episodeRow: {
    flexDirection: "row",
    gap: 12,
  },
  episodeThumbnail: {
    width: EPISODE_THUMB_WIDTH,
    height: EPISODE_THUMB_HEIGHT,
    borderRadius: 6,
    backgroundColor: "#1A2741",
  },
  episodeCopy: {
    flex: 1,
  },
  episodeTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    ...gillSans("600"),
  },
  episodeDescription: {
    marginTop: 4,
    color: "#D2D2D2",
    fontSize: 13,
    lineHeight: 20,
    ...gillSans("400"),
  },
});
