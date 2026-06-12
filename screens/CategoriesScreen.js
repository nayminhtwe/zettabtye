import { Ionicons } from "@expo/vector-icons";
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
import { fetchGenresRequest } from "../store/catalog/actions";
import {
  selectCategoryCards,
  selectGenres,
  selectGenresLoading,
} from "../store/catalog/selectors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTENT_PADDING = 16;
const COLUMN_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - CONTENT_PADDING * 2 - COLUMN_GAP) / 2;
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.38);

function CategoryCard({ item, onPress }) {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      style={[styles.categoryCard, focused ? styles.categoryCardFocused : null]}
      onPress={() => onPress?.(item)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <Image source={item.image} resizeMode="cover" style={styles.categoryImage} />
      <LinearGradient
        colors={["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.85)"]}
        style={styles.categoryGradient}
        pointerEvents="none"
      />
      <Text style={styles.categoryLabel}>{item.label}</Text>
    </Pressable>
  );
}

export default function CategoriesScreen({ onBack, onSearchPress, onCategoryPress }) {
  const dispatch = useDispatch();
  const { contentBottomPadding } = useScreenInsets(32);
  const [backFocused, setBackFocused] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const categoryItems = useSelector(selectCategoryCards);
  const genres = useSelector(selectGenres);
  const genresLoading = useSelector(selectGenresLoading);

  useEffect(() => {
    if (!genres.length && !genresLoading) {
      dispatch(fetchGenresRequest());
    }
  }, [dispatch, genres.length, genresLoading]);

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
          Categories
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
        {genresLoading && categoryItems.length === 0 ? (
          <ActivityIndicator color="#FFFFFF" style={styles.loadingIndicator} />
        ) : null}

        <View style={styles.grid}>
          {categoryItems.map((item) => (
            <CategoryCard key={item.id} item={item} onPress={onCategoryPress} />
          ))}
        </View>
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
    marginBottom: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: COLUMN_GAP,
  },
  categoryCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#1A2741",
    borderWidth: 1,
    borderColor: "#293146",
  },
  categoryCardFocused: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  categoryImage: {
    width: "100%",
    height: "100%",
  },
  categoryGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "45%",
  },
  categoryLabel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 14,
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 28,
    textAlign: "center",
    ...gillSans("700"),
  },
});
