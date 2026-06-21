import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import PosterGrid, { getPosterCardWidth } from "../components/PosterGrid";
import PremiumMembershipCard from "../components/PremiumMembershipCard";
import SaleBannerCarousel from "../components/SaleBannerCarousel";
import { focusBorderActive, focusBorderBase } from "../constants/focusStyles";
import { gillSans } from "../constants/fonts";
import { useScreenInsets } from "../hooks/useScreenInsets";
import { fetchGenresRequest, fetchMoviesMoreRequest, fetchMoviesRequest } from "../store/catalog/actions";
import {
  selectAdvertisements,
  selectCategoryFilterChips,
  selectGenres,
  selectGenresLoading,
  selectMovies,
  selectMoviesHasMore,
  selectMoviesLoading,
  selectMoviesLoadingMore,
} from "../store/catalog/selectors";

const POSTERS_BEFORE_BANNER = 8;
const SCROLL_LOAD_MORE_PADDING = 160;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTENT_PADDING = 14;
const HERO_WIDTH = SCREEN_WIDTH - CONTENT_PADDING * 2;
const HERO_HEIGHT = Math.min(280, Math.round(HERO_WIDTH * 0.62));
const HERO_INDICATOR_TRACK_WIDTH = 54;
const HERO_AUTO_SCROLL_MS = 4500;

const POSTER_CARD_WIDTH = getPosterCardWidth(HERO_WIDTH);

function HeroCard({ item, onMoviePress, onWatchNow }) {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      style={[styles.heroCard, focused ? styles.heroCardFocused : null]}
      onPress={() => onMoviePress?.(item)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <Image source={item.image} resizeMode="cover" style={styles.heroImage} />
      <BlurView intensity={17} tint="dark" style={styles.heroBlurUpper} pointerEvents="none" />
      <BlurView intensity={34} tint="dark" style={styles.heroBlurLower} pointerEvents="none" />
      <LinearGradient
        colors={["rgba(61, 61, 61, 0)", "#040316"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.heroBackdropGradient}
        pointerEvents="none"
      />
      <View style={styles.heroOverlay}>
        <Text style={styles.heroTitle}>{item.title}</Text>
        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaItem}>
            <Ionicons name="star" size={12} color="#F2C94C" />
            <Text style={styles.heroMetaText}>IMDB {item.imdb}</Text>
          </View>
          <View style={styles.heroMetaItem}>
            <Ionicons name="time-outline" size={12} color="#FFFFFF" />
            <Text style={styles.heroMetaText}>{item.duration}</Text>
          </View>
          <View style={styles.heroMetaItem}>
            <Ionicons name="calendar-outline" size={12} color="#FFFFFF" />
            <Text style={styles.heroMetaText}>{item.year}</Text>
          </View>
        </View>
        <View style={styles.heroActionsRow}>
          <Pressable
            style={({ pressed }) => [styles.watchNowButton, pressed ? styles.buttonPressed : null]}
            onPress={() => onWatchNow?.(item)}
          >
            <Text style={styles.watchNowText}>Watch now</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.saveButton, pressed ? styles.buttonPressed : null]}>
            <Text style={styles.saveButtonText}>Save for later</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

export default function MoviesScreen({
  onBack,
  onSearchPress,
  onMoviePress,
  onWatchNow,
  initialCategory = "All",
}) {
  const dispatch = useDispatch();
  const { contentBottomPadding } = useScreenInsets(28);
  const listRef = useRef(null);
  const loadMoreAtRef = useRef(0);
  const [backFocused, setBackFocused] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [focusedCategory, setFocusedCategory] = useState(null);
  const movies = useSelector(selectMovies);
  const moviesLoading = useSelector(selectMoviesLoading);
  const moviesLoadingMore = useSelector(selectMoviesLoadingMore);
  const moviesHasMore = useSelector(selectMoviesHasMore);
  const advertisements = useSelector(selectAdvertisements);
  const genres = useSelector(selectGenres);
  const genresLoading = useSelector(selectGenresLoading);
  const categories = useSelector(selectCategoryFilterChips);

  const heroSlides = useMemo(
    () =>
      movies.slice(0, 2).map((movie) => ({
        ...movie,
        imdb: movie.imdb ?? `${movie.imdbRating}/10`,
      })),
    [movies],
  );

  const filteredMovies = useMemo(
    () => movies.filter((movie) => movie?.id != null),
    [movies],
  );

  const postersBeforeBanner = filteredMovies.slice(0, POSTERS_BEFORE_BANNER);
  const postersAfterBanner = filteredMovies.slice(POSTERS_BEFORE_BANNER);

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    if (!genres.length && !genresLoading) {
      dispatch(fetchGenresRequest());
    }
  }, [dispatch, genres.length, genresLoading]);

  useEffect(() => {
    dispatch(fetchMoviesRequest({ genere_name: activeCategory, page: 1 }));
  }, [dispatch, activeCategory]);

  const loadMoreMovies = useCallback(() => {
    if (moviesLoading || moviesLoadingMore || !moviesHasMore) {
      return;
    }

    const now = Date.now();
    if (now - loadMoreAtRef.current < 600) {
      return;
    }

    loadMoreAtRef.current = now;
    dispatch(fetchMoviesMoreRequest());
  }, [dispatch, moviesHasMore, moviesLoading, moviesLoadingMore]);

  const loadMoreRef = useRef(false);

  useEffect(() => {
    loadMoreRef.current = moviesLoadingMore;
  }, [moviesLoadingMore]);

  const handleScroll = useCallback(
    (event) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const reachedBottom =
        layoutMeasurement.height + contentOffset.y >= contentSize.height - SCROLL_LOAD_MORE_PADDING;

      if (reachedBottom && !loadMoreRef.current) {
        loadMoreMovies();
      }
    },
    [loadMoreMovies],
  );

  useEffect(() => {
    if (heroSlides.length <= 1) {
      return undefined;
    }

    const timer = setInterval(() => {
      setActiveHeroIndex((prev) => {
        const next = (prev + 1) % heroSlides.length;
        listRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, HERO_AUTO_SCROLL_MS);

    return () => clearInterval(timer);
  }, [heroSlides.length]);

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
          Movies
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
        scrollEventThrottle={200}
        onScroll={handleScroll}
      >
        {heroSlides.length > 0 ? (
          <>
            <FlatList
              ref={listRef}
              data={heroSlides}
              horizontal
              pagingEnabled
              scrollEnabled={false}
              bounces={false}
              keyExtractor={(item) => String(item.id)}
              showsHorizontalScrollIndicator={false}
              getItemLayout={(_, index) => ({
                length: HERO_WIDTH,
                offset: HERO_WIDTH * index,
                index,
              })}
              renderItem={({ item }) => (
                <HeroCard item={item} onMoviePress={onMoviePress} onWatchNow={onWatchNow} />
              )}
            />

            <View style={styles.heroIndicatorWrap}>
              <View style={styles.heroIndicatorTrack}>
                <View
                  style={[
                    styles.heroIndicatorActive,
                    {
                      width: HERO_INDICATOR_TRACK_WIDTH / heroSlides.length,
                      transform: [
                        {
                          translateX:
                            activeHeroIndex * (HERO_INDICATOR_TRACK_WIDTH / heroSlides.length),
                        },
                      ],
                    },
                  ]}
                />
              </View>
            </View>
          </>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          {categories.map((category) => (
            <Pressable
              key={category}
              onPress={() => setActiveCategory(category)}
              onFocus={() => setFocusedCategory(category)}
              onBlur={() => setFocusedCategory(null)}
              style={({ pressed }) => [
                styles.categoryChip,
                category === activeCategory ? styles.categoryChipActive : null,
                focusedCategory === category ? styles.categoryChipFocused : null,
                pressed ? styles.buttonPressed : null,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  category === activeCategory ? styles.categoryTextActive : null,
                  focusedCategory === category ? styles.categoryTextFocused : null,
                ]}
              >
                {category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {(moviesLoading || genresLoading) && filteredMovies.length === 0 ? (
          <ActivityIndicator color="#FFFFFF" style={styles.loadingIndicator} />
        ) : null}

        <PosterGrid
          posters={postersBeforeBanner}
          onPosterPress={onMoviePress}
          cardWidth={POSTER_CARD_WIDTH}
          totalCount={filteredMovies.length}
          onLoadMore={loadMoreMovies}
        />

        <SaleBannerCarousel slides={advertisements} style={styles.saleBanner} />

        {postersAfterBanner.length > 0 ? (
          <PosterGrid
            posters={postersAfterBanner}
            onPosterPress={onMoviePress}
            cardWidth={POSTER_CARD_WIDTH}
            indexOffset={postersBeforeBanner.length}
            totalCount={filteredMovies.length}
            onLoadMore={loadMoreMovies}
          />
        ) : null}

        {moviesLoadingMore ? (
          <ActivityIndicator color="#FFFFFF" style={styles.loadingMoreIndicator} />
        ) : null}

        <PremiumMembershipCard style={styles.premiumCard} />
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
    paddingTop: 12,
  },
  heroCard: {
    width: HERO_WIDTH,
    height: HERO_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#111827",
    ...focusBorderBase,
  },
  heroCardFocused: focusBorderActive,
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  heroBlurUpper: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "55.91%",
    height: "22%",
    overflow: "hidden",
  },
  heroBlurLower: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "78%",
    bottom: 0,
    overflow: "hidden",
  },
  heroBackdropGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 42,
    letterSpacing: 0,
    ...gillSans("700"),
  },
  heroMetaRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  heroMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  heroMetaText: {
    color: "#E5E7EB",
    fontSize: 13,
    lineHeight: 16,
    ...gillSans("400"),
  },
  heroActionsRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  watchNowButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: "#E71809",
    alignItems: "center",
    justifyContent: "center",
  },
  watchNowText: {
    color: "#FFFFFF",
    fontSize: 17,
    lineHeight: 22,
    ...gillSans("600"),
  },
  saveButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#E71809",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(5, 6, 12, 0.5)",
  },
  saveButtonText: {
    color: "#E71809",
    fontSize: 17,
    lineHeight: 22,
    ...gillSans("600"),
  },
  heroIndicatorWrap: {
    marginTop: 8,
    alignItems: "center",
  },
  heroIndicatorTrack: {
    width: HERO_INDICATOR_TRACK_WIDTH,
    height: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.35)",
    overflow: "hidden",
  },
  heroIndicatorActive: {
    height: 6,
    borderRadius: 10,
    backgroundColor: "#E71809",
  },
  categoryScroll: {
    marginTop: 12,
  },
  categoryContent: {
    paddingRight: 8,
    gap: 16,
  },
  categoryChip: {
    paddingVertical: 2,
  },
  categoryChipActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#E71809",
  },
  categoryChipFocused: {
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: 6,
    paddingHorizontal: 6,
  },
  categoryText: {
    color: "#8D93A4",
    fontSize: 15,
    lineHeight: 20,
    ...gillSans("400"),
  },
  categoryTextActive: {
    color: "#FFFFFF",
    ...gillSans("600"),
  },
  categoryTextFocused: {
    color: "#FFFFFF",
  },
  loadingIndicator: {
    marginVertical: 24,
  },
  loadingMoreIndicator: {
    marginTop: 16,
    marginBottom: 8,
  },
  saleBanner: {
    marginTop: 16,
    marginBottom: 4,
  },
  premiumCard: {
    marginTop: 20,
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
