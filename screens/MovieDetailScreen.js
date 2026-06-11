import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { fetchMovieDetailRequest } from "../store/catalog/actions";
import {
  selectMovieDetail,
  selectMovieDetailLoading,
} from "../store/catalog/selectors";
import { addFavoriteRequest, removeFavoriteRequest } from "../store/favorites/actions";
import {
  selectFavoriteId,
  selectIsFavorited,
} from "../store/favorites/selectors";
import { buildMovieDetail } from "../utils/movieDetail";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTENT_PADDING = 16;
const HERO_WIDTH = SCREEN_WIDTH - CONTENT_PADDING * 2;
const HERO_HEIGHT = Math.round(HERO_WIDTH * 0.56);

export default function MovieDetailScreen({ movie, onBack, onPlay, onSearchPress }) {
  const dispatch = useDispatch();
  const [backFocused, setBackFocused] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [watchFocused, setWatchFocused] = useState(false);
  const [saveFocused, setSaveFocused] = useState(false);
  const backRef = useRef(null);
  const movieId = movie?.id;
  const fetchedMovie = useSelector((state) => selectMovieDetail(state, movieId));
  const detailLoading = useSelector((state) => selectMovieDetailLoading(state, movieId));
  const isFavorited = useSelector((state) =>
    selectIsFavorited(state, "movie", movieId),
  );
  const favoriteId = useSelector((state) => selectFavoriteId(state, "movie", movieId));

  const displayMovie = useMemo(() => {
    if (fetchedMovie) {
      return buildMovieDetail(fetchedMovie);
    }

    return buildMovieDetail(movie);
  }, [fetchedMovie, movie]);

  useEffect(() => {
    if (movieId) {
      dispatch(fetchMovieDetailRequest(movieId));
    }
  }, [dispatch, movieId]);

  const handleToggleFavorite = () => {
    if (!movieId) {
      return;
    }

    if (isFavorited && favoriteId) {
      dispatch(removeFavoriteRequest(favoriteId));
      return;
    }

    dispatch(addFavoriteRequest({ favoritableType: "movie", favoritableId: movieId }));
  };

  if (!movie) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          ref={backRef}
          style={[styles.headerIconButton, backFocused ? styles.headerIconButtonFocused : null]}
          onPress={onBack}
          onFocus={() => setBackFocused(true)}
          onBlur={() => setBackFocused(false)}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {displayMovie.title}
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
        {detailLoading && !fetchedMovie ? (
          <ActivityIndicator color="#FFFFFF" style={styles.loadingIndicator} />
        ) : null}

        <View style={styles.heroWrapper}>
          {displayMovie.image ? (
            <Image source={displayMovie.image} resizeMode="cover" style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]} />
          )}
          <Pressable style={styles.playButtonOverlay} onPress={() => onPlay?.(displayMovie)}>
            <View style={styles.playButton}>
              <Ionicons name="play" size={28} color="#1D1B20" style={styles.playIcon} />
            </View>
          </Pressable>
        </View>

        <Text style={styles.categories}>{displayMovie.categories}</Text>

        <Text style={styles.movieTitle}>{displayMovie.title}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Ionicons name="calendar-outline" size={14} color="#D2D2D2" />
            <Text style={styles.metaPillText}>{displayMovie.year}</Text>
          </View>
          <View style={styles.metaPill}>
            <Ionicons name="time-outline" size={14} color="#D2D2D2" />
            <Text style={styles.metaPillText}>{displayMovie.duration}</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaImdbLabel}>IMDb</Text>
            <Text style={styles.metaPillText}>IMDb {displayMovie.imdbRating}/10</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [
              styles.watchNowButton,
              (pressed || watchFocused) ? styles.watchNowButtonFocused : null,
            ]}
            onPress={() => onPlay?.(displayMovie)}
            onFocus={() => setWatchFocused(true)}
            onBlur={() => setWatchFocused(false)}
          >
            <Text style={styles.watchNowText}>Watch now</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.saveLaterButton,
              (pressed || saveFocused) ? styles.saveLaterButtonFocused : null,
            ]}
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
        <Text style={styles.overviewBody}>
          {displayMovie.overview || "No overview available."}
        </Text>

        <Text style={styles.overviewLabel}>Directed by:</Text>
        <Text style={styles.overviewValue}>Christopher Nolan</Text>

        <Text style={styles.overviewLabel}>Cast:</Text>
        <Text style={styles.overviewValue}>
          Matthew McConaughey, Anne Hathaway, Jessica Chastain, Bill Irwin, Ellen Burstyn and
          Michael Caine
        </Text>

        <Text style={styles.overviewLabel}>Awards:</Text>
        <Text style={styles.overviewValue}>
          Academy Award For Best Visual Effects, Empire Award For Best Director, Empire Award For
          Best Film
        </Text>
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
  movieTitle: {
    marginTop: 8,
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 36,
    ...gillSans("700"),
  },
  metaRow: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#3E2A2A",
  },
  metaPillText: {
    color: "#FFFFFF",
    fontSize: 11,
    lineHeight: 16,
    ...gillSans("400"),
  },
  metaImdbLabel: {
    color: "#F5C518",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
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
  loadingIndicator: {
    marginVertical: 16,
  },
  overviewLabel: {
    marginTop: 20,
    color: "#79747E",
    fontSize: 13,
    lineHeight: 20,
    ...gillSans("600"),
  },
  overviewValue: {
    marginTop: 4,
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 20,
    ...gillSans("400"),
  },
});
