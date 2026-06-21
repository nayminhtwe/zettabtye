import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { focusBorderActive, focusBorderBase } from "../constants/focusStyles";
import { gillSans } from "../constants/fonts";
import { useScreenInsets } from "../hooks/useScreenInsets";
import { fetchSeriesDetailRequest } from "../store/catalog/actions";
import {
  selectSeriesDetail,
  selectSeriesDetailLoading,
} from "../store/catalog/selectors";
import { addFavoriteRequest, removeFavoriteRequest } from "../store/favorites/actions";
import {
  selectFavoriteId,
  selectIsFavorited,
} from "../store/favorites/selectors";
import { SUBSCRIPTION_WATCH_LABEL, seriesHasPlayableEpisode } from "../utils/playback";
import { buildSeriesDetail } from "../utils/seriesDetail";

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
  const dispatch = useDispatch();
  const { contentBottomPadding } = useScreenInsets(32);
  const [backFocused, setBackFocused] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [watchFocused, setWatchFocused] = useState(false);
  const [saveFocused, setSaveFocused] = useState(false);
  const [heroFocused, setHeroFocused] = useState(false);
  const [overviewDetailsExpanded, setOverviewDetailsExpanded] = useState(false);
  const [overviewToggleFocused, setOverviewToggleFocused] = useState(false);
  const [focusedSeasonId, setFocusedSeasonId] = useState(null);
  const [focusedEpisodeId, setFocusedEpisodeId] = useState(null);
  const listRef = useRef(null);
  const seriesId = series?.id;
  const fetchedSeries = useSelector((state) => selectSeriesDetail(state, seriesId));
  const detailLoading = useSelector((state) => selectSeriesDetailLoading(state, seriesId));
  const isFavorited = useSelector((state) =>
    selectIsFavorited(state, "series", seriesId),
  );
  const favoriteId = useSelector((state) => selectFavoriteId(state, "series", seriesId));

  const displaySeries = useMemo(() => {
    if (fetchedSeries) {
      return buildSeriesDetail(fetchedSeries);
    }

    return buildSeriesDetail(series);
  }, [fetchedSeries, series]);

  const [selectedSeasonId, setSelectedSeasonId] = useState(
    displaySeries?.seasonsList?.[0]?.id ?? null,
  );

  useEffect(() => {
    if (seriesId) {
      dispatch(fetchSeriesDetailRequest(seriesId));
    }
  }, [dispatch, seriesId]);

  useEffect(() => {
    if (displaySeries?.seasonsList?.[0]?.id && !selectedSeasonId) {
      setSelectedSeasonId(displaySeries.seasonsList[0].id);
    }
  }, [displaySeries, selectedSeasonId]);

  const selectedSeason = useMemo(
    () =>
      displaySeries?.seasonsList?.find((season) => season.id === selectedSeasonId) ??
      displaySeries?.seasonsList?.[0],
    [displaySeries, selectedSeasonId],
  );

  const episodes = selectedSeason?.episodes ?? [];

  const handleToggleFavorite = () => {
    if (!seriesId) {
      return;
    }

    if (isFavorited && favoriteId) {
      dispatch(removeFavoriteRequest(favoriteId));
      return;
    }

    dispatch(addFavoriteRequest({ favoritableType: "series", favoritableId: seriesId }));
  };

  const showSubscriptionGate =
    Boolean(fetchedSeries) && !seriesHasPlayableEpisode(displaySeries);
  const watchLabel = showSubscriptionGate ? SUBSCRIPTION_WATCH_LABEL : "Watch now";

  const handlePlayPress = useCallback(
    (episode) => {
      onPlay?.(displaySeries, episode);
    },
    [displaySeries, onPlay],
  );

  const scrollEpisodeIntoView = useCallback((index) => {
    if (index < 0) {
      return;
    }

    listRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.35,
    });
  }, []);

  const listHeader = useMemo(
    () => (
      <>
        {detailLoading && !fetchedSeries ? (
          <ActivityIndicator color="#FFFFFF" style={styles.loadingIndicator} />
        ) : null}

        <View style={styles.heroSlot}>
          <Pressable
            style={[styles.heroWrapper, heroFocused ? styles.heroWrapperFocused : null]}
            onPress={() => handlePlayPress()}
            onFocus={() => setHeroFocused(true)}
            onBlur={() => setHeroFocused(false)}
          >
            {displaySeries.image ? (
              <Image source={displaySeries.image} resizeMode="cover" style={styles.heroImage} />
            ) : (
              <View style={[styles.heroImage, styles.heroPlaceholder]} />
            )}
            <View style={styles.playButtonOverlay} pointerEvents="none">
              <View style={[styles.playButton, showSubscriptionGate ? styles.playButtonLocked : null]}>
                <Ionicons
                  name={showSubscriptionGate ? "lock-closed" : "play"}
                  size={28}
                  color="#1D1B20"
                  style={showSubscriptionGate ? null : styles.playIcon}
                />
              </View>
            </View>
          </Pressable>
        </View>

        <Text style={styles.categories}>{displaySeries.categories}</Text>

        <Text style={styles.seriesTitle}>{displaySeries.title}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={14} color="#F2C94C" />
            <Text style={styles.metaText}>IMDB {displaySeries.imdbRating}/10</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color="#FFFFFF" />
            <Text style={styles.metaText}>{displaySeries.seasons}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color="#FFFFFF" />
            <Text style={styles.metaText}>{displaySeries.year}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={[
              styles.watchNowButton,
              showSubscriptionGate ? styles.watchNowButtonLocked : null,
              watchFocused ? styles.watchNowButtonFocused : null,
            ]}
            onPress={() => handlePlayPress()}
            onFocus={() => setWatchFocused(true)}
            onBlur={() => setWatchFocused(false)}
          >
            <Text style={[styles.watchNowText, showSubscriptionGate ? styles.watchNowTextLocked : null]}>
              {watchLabel}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.saveLaterButton, saveFocused ? styles.saveLaterButtonFocused : null]}
            onPress={handleToggleFavorite}
            onFocus={() => setSaveFocused(true)}
            onBlur={() => setSaveFocused(false)}
          >
            <Text style={styles.saveLaterText}>
              {isFavorited ? "Saved" : "Save for later"}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.overviewHeading}>Overview</Text>
        <Text style={styles.overviewBody}>{displaySeries.overview}</Text>

        <View style={styles.overviewDetailsSection}>
          <Pressable
            style={[
              styles.overviewDetailsToggle,
              overviewToggleFocused ? styles.overviewDetailsToggleFocused : null,
            ]}
            onPress={() => setOverviewDetailsExpanded((current) => !current)}
            onFocus={() => setOverviewToggleFocused(true)}
            onBlur={() => setOverviewToggleFocused(false)}
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
              <OverviewDetailField label="Directed by:" value={displaySeries.director || "—"} />
              <OverviewDetailField label="Cast:" value={displaySeries.cast || "—"} />
            </View>
          ) : null}
        </View>

        <View style={styles.seasonTabsRow}>
          {(displaySeries.seasonsList ?? []).map((season) => {
            const isSelected = season.id === selectedSeason?.id;

            return (
              <Pressable
                key={season.id}
                onPress={() => setSelectedSeasonId(season.id)}
                onFocus={() => setFocusedSeasonId(season.id)}
                onBlur={() => setFocusedSeasonId(null)}
                style={[
                  styles.seasonTab,
                  isSelected ? styles.seasonTabActive : null,
                  focusedSeasonId === season.id ? styles.seasonTabFocused : null,
                ]}
              >
                <Text
                  style={[
                    styles.seasonTabText,
                    isSelected ? styles.seasonTabTextActive : null,
                    focusedSeasonId === season.id ? styles.seasonTabTextFocused : null,
                  ]}
                >
                  {season.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </>
    ),
    [
      detailLoading,
      displaySeries,
      fetchedSeries,
      focusedSeasonId,
      handlePlayPress,
      handleToggleFavorite,
      heroFocused,
      isFavorited,
      overviewDetailsExpanded,
      overviewToggleFocused,
      saveFocused,
      selectedSeason?.id,
      showSubscriptionGate,
      watchFocused,
      watchLabel,
    ],
  );

  const renderEpisode = useCallback(
    ({ item: episode, index }) => (
      <Pressable
        style={styles.episodeRow}
        onPress={() => handlePlayPress(episode)}
        onFocus={() => {
          setFocusedEpisodeId(episode.id);
          scrollEpisodeIntoView(index);
        }}
        onBlur={() => setFocusedEpisodeId(null)}
      >
        <Image
          source={episode.thumbnail}
          resizeMode="cover"
          style={[
            styles.episodeThumbnail,
            focusedEpisodeId === episode.id ? styles.episodeThumbnailFocused : null,
          ]}
        />
        <View style={styles.episodeCopy}>
          <Text style={styles.episodeTitle}>{episode.title}</Text>
          <Text style={styles.episodeDescription} numberOfLines={3}>
            {episode.description}
          </Text>
        </View>
      </Pressable>
    ),
    [focusedEpisodeId, handlePlayPress, scrollEpisodeIntoView],
  );

  if (!series) {
    return null;
  }

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
          {displaySeries.title}
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

      <FlatList
        ref={listRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: contentBottomPadding }]}
        data={episodes}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        renderItem={renderEpisode}
        ItemSeparatorComponent={() => <View style={styles.episodeSeparator} />}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={Platform.OS === "android"}
        keyboardShouldPersistTaps="handled"
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
              viewPosition: 0.35,
            });
          }, 100);
        }}
        ListEmptyComponent={
          fetchedSeries && episodes.length === 0 ? (
            <Text style={styles.emptyEpisodesText}>No episodes available</Text>
          ) : null
        }
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
  heroSlot: {
    padding: 4,
    marginBottom: 8,
    alignSelf: "center",
  },
  heroWrapper: {
    width: HERO_WIDTH,
    height: HERO_HEIGHT,
    borderRadius: 4,
    overflow: "hidden",
    ...focusBorderBase,
  },
  heroWrapperFocused: focusBorderActive,
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
  playButtonLocked: {
    backgroundColor: "#D0D0D0",
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
  watchNowButtonLocked: {
    backgroundColor: "#4A454E",
  },
  watchNowText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    ...gillSans("600"),
  },
  watchNowTextLocked: {
    color: "#D2D2D2",
    fontSize: 14,
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
  loadingIndicator: {
    marginVertical: 16,
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
    borderRadius: 6,
    ...focusBorderBase,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  overviewDetailsToggleFocused: focusBorderActive,
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
  seasonTabsRow: {
    marginTop: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  seasonTab: {
    paddingBottom: 6,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  seasonTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#FFFFFF",
  },
  seasonTabFocused: {
    borderColor: "#FFFFFF",
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
  seasonTabTextFocused: {
    color: "#FFFFFF",
  },
  episodeSeparator: {
    height: 8,
  },
  episodeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  episodeThumbnail: {
    width: EPISODE_THUMB_WIDTH,
    height: EPISODE_THUMB_HEIGHT,
    borderRadius: 6,
    backgroundColor: "#1A2741",
    ...focusBorderBase,
  },
  episodeThumbnailFocused: focusBorderActive,
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
  emptyEpisodesText: {
    marginTop: 16,
    color: "#8E8E8E",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    ...gillSans("400"),
  },
});
