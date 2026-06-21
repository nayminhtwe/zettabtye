import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import CategoryCardImage from "../components/CategoryCardImage";
import { gillSans } from "../constants/fonts";
import { useScreenInsets } from "../hooks/useScreenInsets";
import { fetchGenresRequest, fetchHomeRequest, searchClear, searchRequest } from "../store/catalog/actions";
import {
  selectCategoryCards,
  selectGenres,
  selectGenresLoading,
  selectMovies,
  selectSearchLoading,
  selectSearchResults,
  selectSeries,
} from "../store/catalog/selectors";
import { buildMovieDetail } from "../utils/movieDetail";
import { buildSeriesDetail } from "../utils/seriesDetail";
import { buildSearchSuggestions, SEARCH_PLACEHOLDER_HINTS } from "../utils/search";

const CONTENT_PADDING = 16;
const CATEGORY_CARD_WIDTH = 108;
const CATEGORY_CARD_HEIGHT = 132;
const PLACEHOLDER_LINE_HEIGHT = 24;
const PLACEHOLDER_SCROLL_MS = 2200;
const PLACEHOLDER_ANIM_MS = 320;

function ScrollingSearchPlaceholder({ visible }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      translateY.setValue(0);
      setActiveIndex(0);
      return undefined;
    }

    const timer = setInterval(() => {
      Animated.timing(translateY, {
        toValue: -PLACEHOLDER_LINE_HEIGHT,
        duration: PLACEHOLDER_ANIM_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) {
          return;
        }

        setActiveIndex((current) => (current + 1) % SEARCH_PLACEHOLDER_HINTS.length);
        translateY.setValue(0);
      });
    }, PLACEHOLDER_SCROLL_MS);

    return () => clearInterval(timer);
  }, [visible, translateY]);

  if (!visible) {
    return null;
  }

  const currentHint = SEARCH_PLACEHOLDER_HINTS[activeIndex];
  const nextHint = SEARCH_PLACEHOLDER_HINTS[(activeIndex + 1) % SEARCH_PLACEHOLDER_HINTS.length];

  return (
    <View style={styles.placeholderClip} pointerEvents="none">
      <Animated.View style={{ transform: [{ translateY }] }}>
        <Text style={styles.placeholderText}>{currentHint}</Text>
        <Text style={styles.placeholderText}>{nextHint}</Text>
      </Animated.View>
    </View>
  );
}

function CategoryCard({ item, onPress }) {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[styles.categoryCard, focused ? styles.categoryCardFocused : null]}
    >
      <CategoryCardImage
        imageUrl={item.imageUrl}
        posterIndex={Number(item.id) || 0}
        style={styles.categoryImage}
      />
      <LinearGradient
        colors={["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.85)"]}
        style={styles.categoryGradient}
      />
      <Text style={styles.categoryLabel}>{item.label}</Text>
    </Pressable>
  );
}

function RecentSearchRow({ label, onPress, onDelete }) {
  const [rowFocused, setRowFocused] = useState(false);
  const [deleteFocused, setDeleteFocused] = useState(false);

  return (
    <View style={styles.listRow}>
      <Pressable
        onPress={onPress}
        onFocus={() => setRowFocused(true)}
        onBlur={() => setRowFocused(false)}
        style={[styles.listRowMain, rowFocused ? styles.listRowFocused : null]}
      >
        <Text style={styles.listRowText} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
      <Pressable
        onPress={onDelete}
        onFocus={() => setDeleteFocused(true)}
        onBlur={() => setDeleteFocused(false)}
        style={[styles.listActionButton, deleteFocused ? styles.listActionButtonFocused : null]}
      >
        <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

function SuggestionRow({ label, onPress }) {
  const [rowFocused, setRowFocused] = useState(false);
  const [actionFocused, setActionFocused] = useState(false);

  return (
    <View style={styles.listRow}>
      <Pressable
        onPress={onPress}
        onFocus={() => setRowFocused(true)}
        onBlur={() => setRowFocused(false)}
        style={[styles.listRowMain, rowFocused ? styles.listRowFocused : null]}
      >
        <Text style={styles.listRowText} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
      <Pressable
        onPress={onPress}
        onFocus={() => setActionFocused(true)}
        onBlur={() => setActionFocused(false)}
        style={[styles.listActionButton, actionFocused ? styles.listActionButtonFocused : null]}
      >
        <Ionicons name="arrow-up-outline" size={18} color="#FFFFFF" style={styles.suggestionArrow} />
      </Pressable>
    </View>
  );
}

export default function SearchScreen({
  onBack,
  onCategoryPress,
  onMoviePress,
  onSeriesPress,
  recentSearches,
  onRecentSearchesChange,
  initialQuery = "",
}) {
  const dispatch = useDispatch();
  const { contentBottomPadding } = useScreenInsets(32);
  const searchResults = useSelector(selectSearchResults);
  const searchLoading = useSelector(selectSearchLoading);
  const topCategories = useSelector(selectCategoryCards);
  const genres = useSelector(selectGenres);
  const genresLoading = useSelector(selectGenresLoading);
  const movies = useSelector(selectMovies);
  const series = useSelector(selectSeries);
  const [backFocused, setBackFocused] = useState(false);
  const [actionFocused, setActionFocused] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef(null);

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length > 0;

  const suggestions = useMemo(
    () => buildSearchSuggestions(query, { genres, movies, series }),
    [query, genres, movies, series],
  );

  useEffect(() => {
    if (!genres.length && !genresLoading) {
      dispatch(fetchGenresRequest());
    }
  }, [dispatch, genres.length, genresLoading]);

  useEffect(() => {
    if (!movies.length && !series.length) {
      dispatch(fetchHomeRequest());
    }
  }, [dispatch, movies.length, series.length]);

  useEffect(() => {
    if (trimmedQuery.length < 2) {
      dispatch(searchClear());
      return undefined;
    }

    const timer = setTimeout(() => {
      dispatch(searchRequest(trimmedQuery));
    }, 400);

    return () => clearTimeout(timer);
  }, [dispatch, trimmedQuery]);

  const listItems = useMemo(() => {
    const apiItems = searchResults.map((item) => ({
      key: `${item.type ?? "movie"}-${item.id}`,
      kind: "result",
      label: item.title,
      item,
    }));
    const suggestionItems = suggestions.map((label) => ({
      key: `suggestion-${label}`,
      kind: "suggestion",
      label,
    }));

    return [...apiItems, ...suggestionItems];
  }, [searchResults, suggestions]);

  const addRecentSearch = (term) => {
    const value = term.trim();
    if (!value) {
      return;
    }

    const next = [value, ...recentSearches.filter((item) => item.toLowerCase() !== value.toLowerCase())];
    onRecentSearchesChange?.(next.slice(0, 8));
  };

  const removeRecentSearch = (term) => {
    onRecentSearchesChange?.(recentSearches.filter((item) => item !== term));
  };

  const applySearchTerm = (term) => {
    setQuery(term);
    addRecentSearch(term);
    inputRef.current?.focus();
  };

  const handleResultSelect = (result) => {
    addRecentSearch(result.title);
    if (result.type === "series") {
      onSeriesPress?.(buildSeriesDetail(result));
      return;
    }

    onMoviePress?.(buildMovieDetail(result));
  };

  const handleSuggestionSelect = (term) => {
    const apiMatch = searchResults.find(
      (item) => item.title?.toLowerCase() === term.trim().toLowerCase(),
    );
    if (apiMatch) {
      handleResultSelect(apiMatch);
      return;
    }

    const catalogMatch =
      [...movies, ...series].find(
        (item) => item.title?.toLowerCase() === term.trim().toLowerCase(),
      ) ?? null;

    if (catalogMatch) {
      if (catalogMatch.type === "series") {
        onSeriesPress?.(buildSeriesDetail(catalogMatch));
      } else {
        onMoviePress?.(buildMovieDetail(catalogMatch));
      }
      addRecentSearch(term);
      return;
    }

    applySearchTerm(term);
  };

  const handleSubmitSearch = () => {
    if (!trimmedQuery) {
      return;
    }
    addRecentSearch(trimmedQuery);
  };

  const handleClearSearch = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const handleActionPress = () => {
    if (isSearching) {
      handleClearSearch();
      return;
    }
    handleSubmitSearch();
  };

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

        <View style={styles.searchInputWrap}>
          <ScrollingSearchPlaceholder visible={!isSearching} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder=""
            showSoftInputOnFocus
            onSubmitEditing={handleSubmitSearch}
            returnKeyType="search"
          />
        </View>

        <Pressable
          style={[styles.headerActionButton, actionFocused ? styles.headerActionButtonFocused : null]}
          onPress={handleActionPress}
          onFocus={() => setActionFocused(true)}
          onBlur={() => setActionFocused(false)}
        >
          <Ionicons
            name={isSearching ? "close" : "search"}
            size={isSearching ? 20 : 22}
            color="#FFFFFF"
          />
        </Pressable>
      </View>

      {isSearching ? (
        <FlatList
          data={listItems}
          keyExtractor={(item) => item.key}
          style={styles.suggestionsList}
          contentContainerStyle={[styles.suggestionsContent, { paddingBottom: contentBottomPadding }]}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            searchLoading ? <ActivityIndicator color="#FFFFFF" style={styles.searchLoading} /> : null
          }
          ListEmptyComponent={
            <Text style={styles.emptySuggestionsText}>No results found</Text>
          }
          renderItem={({ item }) => (
            <SuggestionRow
              label={item.label}
              onPress={() =>
                item.kind === "result"
                  ? handleResultSelect(item.item)
                  : handleSuggestionSelect(item.label)
              }
            />
          )}
        />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: contentBottomPadding }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>Top Categories</Text>
          {genresLoading && topCategories.length === 0 ? (
            <ActivityIndicator color="#FFFFFF" style={styles.searchLoading} />
          ) : null}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          >
            {topCategories.map((item) => (
              <CategoryCard key={item.id} item={item} onPress={onCategoryPress} />
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Recent Search</Text>
          <View style={styles.recentList}>
            {recentSearches.map((item) => (
              <RecentSearchRow
                key={item}
                label={item}
                onPress={() => handleSuggestionSelect(item)}
                onDelete={() => removeRecentSearch(item)}
              />
            ))}
          </View>
        </ScrollView>
      )}
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
    paddingTop: 8,
    paddingRight: 16,
    paddingBottom: 8,
    paddingLeft: 16,
    backgroundColor: "#1D1B20",
    gap: 8,
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
  headerActionButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerActionButtonFocused: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 20,
  },
  searchInputWrap: {
    flex: 1,
    minHeight: 40,
    justifyContent: "center",
  },
  placeholderClip: {
    position: "absolute",
    left: 4,
    right: 4,
    height: PLACEHOLDER_LINE_HEIGHT,
    overflow: "hidden",
  },
  placeholderText: {
    color: "#8E8E8E",
    fontSize: 16,
    lineHeight: PLACEHOLDER_LINE_HEIGHT,
    ...gillSans("400"),
  },
  searchInput: {
    flex: 1,
    color: "#D2D2D2",
    fontSize: 16,
    lineHeight: 24,
    paddingVertical: 8,
    paddingHorizontal: 4,
    ...gillSans("400"),
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: CONTENT_PADDING,
    paddingTop: 16,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
    ...gillSans("600"),
  },
  categoriesContent: {
    gap: 10,
  },
  categoryCard: {
    width: CATEGORY_CARD_WIDTH,
    height: CATEGORY_CARD_HEIGHT,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  categoryCardFocused: {
    borderColor: "#FFFFFF",
  },
  categoryImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  categoryGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  categoryLabel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 10,
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    ...gillSans("600"),
  },
  recentList: {
    gap: 4,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    gap: 8,
  },
  listRowMain: {
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    borderRadius: 6,
    paddingHorizontal: 2,
  },
  listRowFocused: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  listRowText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    ...gillSans("400"),
  },
  listActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  listActionButtonFocused: {
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  suggestionArrow: {
    transform: [{ rotate: "45deg" }],
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionsContent: {
    paddingHorizontal: CONTENT_PADDING,
    paddingTop: 12,
  },
  searchLoading: {
    marginBottom: 12,
  },
  emptySuggestionsText: {
    color: "#8E8E8E",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 24,
    ...gillSans("400"),
  },
});
