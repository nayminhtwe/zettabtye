import { Ionicons } from "@expo/vector-icons";
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  Dimensions,
  findNodeHandle,
  FlatList,
  Image,
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useTVEventHandler,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import DeleteAccountConfirmModal from "../components/DeleteAccountConfirmModal";
import FocusablePressable from "../components/FocusablePressable";
import FootballMatchCard from "../components/FootballMatchCard";
import LogoutConfirmModal from "../components/LogoutConfirmModal";
import SaleBannerCarousel from "../components/SaleBannerCarousel";
import { focusBorderActive, focusBorderBase } from "../constants/focusStyles";
import { gillSans } from "../constants/fonts";
import { useScreenInsets } from "../hooks/useScreenInsets";
import { fetchHomeRequest } from "../store/catalog/actions";
import {
  selectAdvertisements,
  selectFeaturedMovies,
  selectHomeGenreRows,
  selectHomeMatches,
  selectHomeSeriesItems,
  selectTrendingMovies,
} from "../store/catalog/selectors";
import { fetchFavoritesRequest } from "../store/favorites/actions";
import { selectAuthAuthenticated } from "../store/auth/selectors";
import { buildFootballDetail } from "../utils/football";
import { buildMovieDetail } from "../utils/movieDetail";
import { buildSeriesDetail } from "../utils/seriesDetail";
import { selectFavoriteMediaItems } from "../store/favorites/selectors";
import { selectCanAccessFootball } from "../store/ads/selectors";

const CONTENT_HORIZONTAL_PADDING = 10;

const BASE_HOME_SECTIONS = [
  {
    id: "trending",
    title: "Trending Now",
    showSeeAll: false,
    items: [],
  },
  {
    id: "continue",
    title: "Today's Match",
    showSeeAll: true,
    seeAll: "football",
    items: [],
  },
  {
    id: "series",
    title: "TV Series",
    showSeeAll: true,
    seeAll: "series",
    items: [],
  },
];

const POSTER_COLORS = ["#22355A", "#3D2446", "#1E4D4A", "#4F3322", "#29304A", "#1E3A62"];

const getPosterColor = (label) => {
  const seed = label.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return POSTER_COLORS[seed % POSTER_COLORS.length];
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const FEATURED_CENTER_WIDTH = 196;
const FEATURED_CENTER_HEIGHT = 250;
const FEATURED_SIDE_WIDTH = 150;
const FEATURED_SIDE_HEIGHT = 191;
const FEATURED_CENTER_TOP = 14;
const FEATURED_SIDE_TOP = 43.5;
const FEATURED_ITEM_GAP = 10;
const FEATURED_SLOT_WIDTH = FEATURED_CENTER_WIDTH + FEATURED_ITEM_GAP;
const FEATURED_CAROUSEL_HEIGHT = FEATURED_CENTER_TOP + FEATURED_CENTER_HEIGHT;
const FEATURED_SIDE_PADDING = Math.max(0, (SCREEN_WIDTH - FEATURED_SLOT_WIDTH) / 2);

const clampFeaturedIndex = (index, length) => Math.max(0, Math.min(index, length - 1));

const DRAWER_PANEL_WIDTH = Math.min(
  400,
  Math.round(Dimensions.get("window").width * 0.72),
);
const DRAWER_HEADER_HEIGHT = 152;
const DRAWER_LOGO_SIZE = 113;

function getDrawerHeaderCurvePath(width, height) {
  const curveTop = height - 36;
  const curveBulge = height + 10;

  return `M 0 0 H ${width} V ${curveTop} Q ${width / 2} ${curveBulge} 0 ${curveTop} Z`;
}

function DrawerCurvedHeader({ topInset = 0, width = DRAWER_PANEL_WIDTH }) {
  const svgHeight = DRAWER_HEADER_HEIGHT + 20;
  const path = getDrawerHeaderCurvePath(width, DRAWER_HEADER_HEIGHT);

  return (
    <View style={[styles.drawerHeaderArea, { width, paddingTop: topInset }]}>
      <Svg width={width} height={svgHeight} style={styles.drawerHeaderSvg}>
        <Defs>
          <LinearGradient id="drawerHeaderGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#8F2B22" />
            <Stop offset="35%" stopColor="#5C1814" />
            <Stop offset="70%" stopColor="#2E0F0D" />
            <Stop offset="100%" stopColor="#121212" />
          </LinearGradient>
        </Defs>
        <Path d={path} fill="url(#drawerHeaderGradient)" />
      </Svg>
      <View style={styles.drawerLogoWrap}>
        <Image
          source={require("../assets/images/logo.png")}
          resizeMode="contain"
          style={styles.drawerLogo}
        />
      </View>
    </View>
  );
}

const DRAWER_SECTIONS = [
  {
    title: "Overview",
    items: [
      { label: "Home", icon: "home-outline" },
      { label: "Series", icon: "grid-outline" },
      { label: "Movies", icon: "film-outline" },
      { label: "Football matches", icon: "football-outline", navigate: "football_list" },
      { label: "Categories", icon: "apps-outline" },
      { label: "Notifications", icon: "notifications-outline", showBadge: true },
      { label: "History", icon: "time-outline" },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "My Profile", icon: "person-outline", showExternal: true, navigate: "profile" },
      { label: "Get Help", icon: "help-circle-outline", showExternal: true, navigate: "get_help" },
    ],
  },
];

const DRAWER_ITEMS = DRAWER_SECTIONS.flatMap((section) =>
  section.items.map((item) => item.label),
);

const FeaturedCarousel = forwardRef(function FeaturedCarousel(
  {
    items,
    drawerOpen,
    onCloseDrawer,
    onMoviePress,
    nextFocusUpForIndex,
    nextFocusDownForIndex,
  },
  ref,
) {
  const listRef = useRef(null);
  const itemRefs = useRef(items.map(() => null));
  const [activeIndex, setActiveIndex] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState(null);

  const scrollToActiveIndex = useCallback(
    (index, animated = true) => {
      const nextIndex = clampFeaturedIndex(index, items.length);
      setActiveIndex(nextIndex);
      listRef.current?.scrollToOffset({
        offset: nextIndex * FEATURED_SLOT_WIDTH,
        animated,
      });
    },
    [items.length],
  );

  const selectIndex = useCallback(
    (index, animated = true) => {
      if (drawerOpen) {
        onCloseDrawer?.();
      }
      setFocusedIndex(clampFeaturedIndex(index, items.length));
      scrollToActiveIndex(index, animated);
    },
    [drawerOpen, items.length, onCloseDrawer, scrollToActiveIndex],
  );

  useImperativeHandle(
    ref,
    () => ({
      getNodeHandle: (index) =>
        findNodeHandle(itemRefs.current[clampFeaturedIndex(index, items.length)]) ?? undefined,
      scrollToIndex: scrollToActiveIndex,
      getActiveIndex: () => activeIndex,
    }),
    [activeIndex, items.length, scrollToActiveIndex],
  );

  const handleScrollSettle = useCallback(
    (offsetX) => {
      const nextIndex = clampFeaturedIndex(Math.round(offsetX / FEATURED_SLOT_WIDTH), items.length);
      setActiveIndex(nextIndex);
    },
    [items.length],
  );

  return (
    <FlatList
      ref={listRef}
      data={items}
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      style={styles.featuredCarousel}
      contentContainerStyle={styles.featuredCarouselContent}
      keyExtractor={(item) => item.id}
      snapToInterval={FEATURED_SLOT_WIDTH}
      snapToAlignment="start"
      decelerationRate="fast"
      disableIntervalMomentum
      bounces={false}
      onLayout={() => scrollToActiveIndex(0, false)}
      onMomentumScrollEnd={(event) => handleScrollSettle(event.nativeEvent.contentOffset.x)}
      onScrollEndDrag={(event) => handleScrollSettle(event.nativeEvent.contentOffset.x)}
      getItemLayout={(_, index) => ({
        length: FEATURED_SLOT_WIDTH,
        offset: FEATURED_SLOT_WIDTH * index,
        index,
      })}
      renderItem={({ item, index }) => {
        const isActive = index === activeIndex;
        const isFocused = index === focusedIndex;

        return (
          <View style={styles.featuredSlot}>
            <Pressable
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              onPress={() => {
                selectIndex(index, true);
                onMoviePress?.(item);
              }}
              onFocus={() => selectIndex(index, true)}
              onBlur={() => setFocusedIndex(null)}
              style={({ pressed }) => [
                isActive ? styles.featuredCardCenter : styles.featuredCardSide,
                (pressed || isFocused) ? styles.featuredCardFocused : null,
              ]}
              nextFocusUp={nextFocusUpForIndex?.(index)}
              nextFocusLeft={
                index > 0
                  ? findNodeHandle(itemRefs.current[index - 1]) ?? undefined
                  : undefined
              }
              nextFocusRight={
                index < items.length - 1
                  ? findNodeHandle(itemRefs.current[index + 1]) ?? undefined
                  : undefined
              }
              nextFocusDown={nextFocusDownForIndex?.(index)}
            >
              <Image
                source={item.image}
                resizeMode="cover"
                style={[
                  styles.featuredImage,
                  isActive ? styles.featuredImageCenter : styles.featuredImageSide,
                ]}
              />
            </Pressable>
          </View>
        );
      }}
    />
  );
});

const MediaCard = forwardRef(function MediaCard(
  {
    label,
    image,
    nextFocusUp,
    nextFocusDown,
    nextFocusLeft,
    nextFocusRight,
    variant = "poster",
    progress = 0,
    showLabel = false,
    onPress,
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const isMatchCard = variant === "match";
  const isContinueCard = variant === "continue";
  const isFocused = focused;

  return (
    <Pressable
      ref={ref}
      style={styles.card}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      nextFocusUp={nextFocusUp}
      nextFocusDown={nextFocusDown}
      nextFocusLeft={nextFocusLeft}
      nextFocusRight={nextFocusRight}
    >
      {isMatchCard ? (
        <View style={[styles.matchCard, isFocused ? styles.matchCardFocused : null]}>
          <Text numberOfLines={1} style={styles.matchTeamText}>
            {label}
          </Text>
          <Text style={styles.matchScoreText}>2 - 0</Text>
        </View>
      ) : (
        <>
          {image ? (
            <View style={[styles.cardPosterShell, isFocused ? styles.cardPosterShellFocused : null]}>
              <Image source={image} resizeMode="cover" style={styles.cardPosterImage} />
            </View>
          ) : (
            <View
              style={[
                styles.cardPoster,
                { backgroundColor: getPosterColor(label) },
                isFocused ? styles.cardPosterShellFocused : null,
              ]}
            >
              <Text style={styles.cardPosterText}>{label.slice(0, 1)}</Text>
            </View>
          )}
          {isContinueCard ? (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(progress, 1)) * 100}%` }]} />
            </View>
          ) : null}
          {showLabel ? (
            <Text numberOfLines={1} style={styles.cardLabel}>
              {label}
            </Text>
          ) : null}
        </>
      )}
    </Pressable>
  );
});

export default function HomeScreen({
  onMoviePress,
  onFootballPress,
  onSeeAllFootball,
  onProfilePress,
  onGetHelpPress,
  onSeriesPress,
  onSeriesItemPress,
  onMoviesPress,
  onCategoriesPress,
  onHistoryPress,
  onNotificationsPress,
  onSearchPress,
  onLogoutPress,
  onDeleteAccountPress,
}) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { contentBottomPadding, bottom: bottomInset } = useScreenInsets(32);
  const isAuthenticated = useSelector(selectAuthAuthenticated);
  const featuredMovies = useSelector(selectFeaturedMovies);
  const trendingMovies = useSelector(selectTrendingMovies);
  const homeSeries = useSelector(selectHomeSeriesItems);
  const homeMatches = useSelector(selectHomeMatches);
  const advertisements = useSelector(selectAdvertisements);
  const genreRows = useSelector(selectHomeGenreRows);
  const favoriteItems = useSelector(selectFavoriteMediaItems);
  const canShowFootball = useSelector(selectCanAccessFootball);

  const drawerSections = React.useMemo(() => {
    if (canShowFootball) {
      return DRAWER_SECTIONS;
    }

    return DRAWER_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => item.navigate !== "football_list"),
    }));
  }, [canShowFootball]);

  const drawerItems = React.useMemo(
    () => drawerSections.flatMap((section) => section.items),
    [drawerSections],
  );

  const featuredItems = featuredMovies;
  const footballFixtures = homeMatches;

  const homeSections = React.useMemo(() => {
    const baseSections = BASE_HOME_SECTIONS.map((section) => {
      if (section.id === "trending" && trendingMovies.length > 0) {
        return { ...section, items: trendingMovies };
      }
      if (section.id === "series" && homeSeries.length > 0) {
        return { ...section, items: homeSeries };
      }
      if (section.id === "continue" && footballFixtures.length > 0) {
        return { ...section, items: footballFixtures };
      }
      return section;
    });

    const sections = [
      ...baseSections.filter((section) => {
        if (section.id === "continue") {
          return canShowFootball && footballFixtures.length > 0;
        }

        return section.items.length > 0;
      }),
      ...genreRows.filter((row) => row.items.length > 0),
    ];

    if (favoriteItems.length > 0) {
      const continueIndex = sections.findIndex((section) => section.id === "continue");
      const continueWatchingSection = {
        id: "continueWatching",
        title: "Saved for later",
        showSeeAll: true,
        seeAll: "history",
        items: favoriteItems.map((item) => ({
          ...item,
          id: item.id,
          label: item.title,
          image: item.image,
        })),
      };

      if (continueIndex >= 0) {
        sections.splice(continueIndex + 1, 0, continueWatchingSection);
      } else {
        sections.push(continueWatchingSection);
      }
    }

    return sections.filter((section) => {
      if (section.id === "continue") {
        return canShowFootball && footballFixtures.length > 0;
      }

      return section.items.length > 0;
    });
  }, [trendingMovies, homeSeries, genreRows, favoriteItems, footballFixtures.length, canShowFootball]);

  useEffect(() => {
    dispatch(fetchHomeRequest());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchFavoritesRequest());
    }
  }, [dispatch, isAuthenticated]);

  const openItemDetail = useCallback(
    (item) => {
      if (item?.type === "series") {
        onSeriesItemPress?.(buildSeriesDetail(item));
        return;
      }

      onMoviePress?.(buildMovieDetail(item));
    },
    [onMoviePress, onSeriesItemPress],
  );

  const openFootballDetail = useCallback(
    (fixture) => {
      onFootballPress?.(buildFootballDetail(fixture, homeMatches));
    },
    [onFootballPress, homeMatches],
  );

  const handleSeeAllPress = useCallback(
    (section) => {
      if (section.seeAll === "football") {
        onSeeAllFootball?.();
        return;
      }
      if (section.seeAll === "history") {
        onHistoryPress?.();
        return;
      }
      if (section.seeAll === "series") {
        onSeriesPress?.();
        return;
      }
      if (section.seeAll === "movies") {
        onMoviesPress?.(section.moviesCategory ?? "All");
      }
    },
    [onSeeAllFootball, onHistoryPress, onSeriesPress, onMoviesPress],
  );
  const menuButtonRef = useRef(null);
  const searchButtonRef = useRef(null);
  const drawerItemRefs = useRef([]);
  const drawerScrollRef = useRef(null);
  const drawerScrollContentRef = useRef(null);
  const logoutButtonRef = useRef(null);
  const deleteAccountButtonRef = useRef(null);
  const drawerBlurTimeoutRef = useRef(null);
  const featuredCarouselRef = useRef(null);
  const rowRefs = useRef([]);
  const bannerRef = useRef(null);
  const [menuFocused, setMenuFocused] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeDrawerItem, setActiveDrawerItem] = useState(0);
  const [logoutFocused, setLogoutFocused] = useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [deleteAccountConfirmVisible, setDeleteAccountConfirmVisible] = useState(false);
  const [deleteAccountFocused, setDeleteAccountFocused] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return undefined;
    }

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (deleteAccountConfirmVisible) {
        setDeleteAccountConfirmVisible(false);
        return true;
      }

      if (logoutConfirmVisible) {
        setLogoutConfirmVisible(false);
        return true;
      }

      if (drawerOpen) {
        setDrawerOpen(false);
        return true;
      }

      BackHandler.exitApp();
      return true;
    });

    return () => subscription.remove();
  }, [deleteAccountConfirmVisible, drawerOpen, logoutConfirmVisible]);

  const handleDrawerItemPress = useCallback(
    (item) => {
      if (!item) {
        return;
      }

      setDrawerOpen(false);
      if (item.label === "Series") {
        onSeriesPress?.();
      }
      if (item.label === "Movies") {
        onMoviesPress?.();
      }
      if (item.label === "Categories") {
        onCategoriesPress?.();
      }
      if (item.label === "History") {
        onHistoryPress?.();
      }
      if (item.label === "Notifications") {
        onNotificationsPress?.();
      }
      if (item.navigate === "football_list") {
        onSeeAllFootball?.();
      }
      if (item.navigate === "profile") {
        onProfilePress?.();
      }
      if (item.navigate === "get_help") {
        onGetHelpPress?.();
      }
    },
    [
      onCategoriesPress,
      onGetHelpPress,
      onHistoryPress,
      onMoviesPress,
      onNotificationsPress,
      onProfilePress,
      onSeeAllFootball,
      onSeriesPress,
    ],
  );

  const openLogoutConfirm = useCallback(() => {
    setDrawerOpen(false);
    setLogoutConfirmVisible(true);
  }, []);

  const openDeleteConfirm = useCallback(() => {
    setDrawerOpen(false);
    setDeleteAccountConfirmVisible(true);
  }, []);

  const openDrawer = useCallback(() => {
    setDrawerOpen(true);
  }, []);

  const drawerNavRef = useRef({});
  drawerNavRef.current = {
    drawerOpen,
    menuFocused,
    activeDrawerItem,
    logoutFocused,
    deleteAccountFocused,
    drawerItems,
    handleDrawerItemPress,
    openLogoutConfirm,
    openDeleteConfirm,
    openDrawer,
  };
  const getFeaturedHandle = (index) =>
    featuredCarouselRef.current?.getNodeHandle(index) ?? undefined;
  const getSectionCardHandle = (sectionIndex, itemIndex) =>
    findNodeHandle(rowRefs.current[sectionIndex]?.[itemIndex]) ?? undefined;
  const getDrawerHandle = (index) =>
    findNodeHandle(drawerItemRefs.current[index]) ?? undefined;
  const getContentFocusHandle = () =>
    getFeaturedHandle(0) ??
    findNodeHandle(searchButtonRef.current) ??
    findNodeHandle(menuButtonRef.current) ??
    undefined;
  const getLogoutHandle = () => findNodeHandle(logoutButtonRef.current) ?? undefined;
  const getDeleteAccountHandle = () => findNodeHandle(deleteAccountButtonRef.current) ?? undefined;
  const scrollDrawerItemIntoView = (index) => {
    const itemNode = drawerItemRefs.current[index];
    const contentNode = drawerScrollContentRef.current;

    if (!itemNode || !contentNode) {
      drawerScrollRef.current?.scrollTo({ y: Math.max(0, index * 56 - 12), animated: true });
      return;
    }

    itemNode.measureLayout(
      contentNode,
      (_x, y) => {
        drawerScrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
      },
      () => {
        drawerScrollRef.current?.scrollTo({ y: Math.max(0, index * 56 - 12), animated: true });
      },
    );
  };
  const cancelDrawerBlurClose = () => {
    if (drawerBlurTimeoutRef.current) {
      clearTimeout(drawerBlurTimeoutRef.current);
      drawerBlurTimeoutRef.current = null;
    }
  };

  const scheduleDrawerBlurClose = () => {
    cancelDrawerBlurClose();
    drawerBlurTimeoutRef.current = setTimeout(() => {
      setDrawerOpen(false);
      setLogoutFocused(false);
      setDeleteAccountFocused(false);
    }, 120);
  };

  const handleDrawerItemFocus = (index) => {
    cancelDrawerBlurClose();
    setActiveDrawerItem(index);
    scrollDrawerItemIntoView(index);
  };

  useEffect(() => {
    return () => {
      cancelDrawerBlurClose();
    };
  }, []);

  useTVEventHandler((event) => {
    const type = event?.eventType;
    if (!type) {
      return;
    }

    const isKeyUp = event.eventKeyAction === undefined || event.eventKeyAction === 1;
    const nav = drawerNavRef.current;

    if (!nav.drawerOpen) {
      if (type === "select" && isKeyUp && nav.menuFocused) {
        nav.openDrawer();
      }
      return;
    }

    if (["left", "leftArrow", "right", "rightArrow"].includes(type)) {
      cancelDrawerBlurClose();
      setDrawerOpen(false);
      return;
    }

    if (type !== "select" || !isKeyUp) {
      return;
    }

    cancelDrawerBlurClose();

    if (nav.logoutFocused) {
      nav.openLogoutConfirm();
      return;
    }

    if (nav.deleteAccountFocused) {
      nav.openDeleteConfirm();
      return;
    }

    nav.handleDrawerItemPress(nav.drawerItems[nav.activeDrawerItem]);
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: contentBottomPadding }]}
      >
        <View style={styles.topBar}>
          <FocusablePressable
            ref={menuButtonRef}
            suppressTVSelect
            style={({ pressed }) => [
              styles.topBarIconButton,
              (pressed || menuFocused) ? styles.topBarIconButtonFocused : null,
            ]}
            onFocus={() => setMenuFocused(true)}
            onBlur={() => setMenuFocused(false)}
            onPress={() => setDrawerOpen((current) => !current)}
            nextFocusDown={drawerOpen ? getDrawerHandle(0) : getFeaturedHandle(0)}
            nextFocusRight={
              drawerOpen ? getDrawerHandle(0) : findNodeHandle(searchButtonRef.current) ?? undefined
            }
          >
            <Ionicons name="menu" size={24} color="#FFFFFF" />
          </FocusablePressable>
          <View style={styles.topBarBrand}>
            <Image
              source={require("../assets/images/logo.png")}
              resizeMode="contain"
              style={styles.topBarLogoIcon}
            />
            <Text style={styles.topBarBrandText}>Zettabyte</Text>
          </View>
          <Pressable
            ref={searchButtonRef}
            style={({ pressed }) => [
              styles.topBarIconButton,
              (pressed || searchFocused) ? styles.topBarIconButtonFocused : null,
            ]}
            onPress={onSearchPress}
            onFocus={() => {
              setSearchFocused(true);
              if (drawerOpen) {
                setDrawerOpen(false);
              }
            }}
            onBlur={() => setSearchFocused(false)}
            nextFocusDown={getFeaturedHandle(2)}
            nextFocusLeft={findNodeHandle(menuButtonRef.current) ?? undefined}
          >
            <Ionicons name="search" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        {featuredItems.length > 0 ? (
          <FeaturedCarousel
            ref={featuredCarouselRef}
            items={featuredItems}
            drawerOpen={drawerOpen}
            onCloseDrawer={() => setDrawerOpen(false)}
            onMoviePress={openItemDetail}
            nextFocusUpForIndex={(index) =>
              findNodeHandle(index === 0 ? menuButtonRef.current : searchButtonRef.current) ??
              undefined
            }
            nextFocusDownForIndex={(index) =>
              index === 1
                ? findNodeHandle(bannerRef.current) ?? undefined
                : getSectionCardHandle(0, Math.min(index, homeSections[0]?.items.length - 1 ?? 0))
            }
          />
        ) : null}

        {homeSections.map((row, rowIndex) => (
          <React.Fragment key={row.id}>
            <View style={styles.rowSection}>
              <View style={styles.rowHeader}>
                <Text style={styles.rowTitle}>{row.title}</Text>
                {row.showSeeAll && row.seeAll ? (
                  <Pressable onPress={() => handleSeeAllPress(row)}>
                    <Text style={styles.seeAllText}>See all</Text>
                  </Pressable>
                ) : null}
              </View>
              {row.id === "continue" ? (
                <View style={styles.footballList}>
                  {footballFixtures.map((fixture, itemIndex) => (
                    <FootballMatchCard
                      key={fixture.id}
                      ref={(node) => {
                        if (!rowRefs.current[rowIndex]) {
                          rowRefs.current[rowIndex] = [];
                        }
                        rowRefs.current[rowIndex][itemIndex] = node;
                      }}
                      fixture={fixture}
                      onPress={() => openFootballDetail(fixture)}
                      nextFocusUp={
                        itemIndex === 0
                          ? getSectionCardHandle(rowIndex - 1, 0)
                          : getSectionCardHandle(rowIndex, itemIndex - 1)
                      }
                      nextFocusDown={
                        itemIndex < footballFixtures.length - 1
                          ? getSectionCardHandle(rowIndex, itemIndex + 1)
                          : getSectionCardHandle(rowIndex + 1, 0)
                      }
                    />
                  ))}
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.rowContent}
                >
                  {row.items.map((item, itemIndex) => (
                    <MediaCard
                      key={`${row.id}-${item.id}-${itemIndex}`}
                      ref={(node) => {
                        if (!rowRefs.current[rowIndex]) {
                          rowRefs.current[rowIndex] = [];
                        }
                        rowRefs.current[rowIndex][itemIndex] = node;
                      }}
                      label={item.label ?? item.title}
                      image={item.image}
                      variant={row.id === "continueWatching" ? "continue" : row.id === "match" ? "match" : "poster"}
                      showLabel={false}
                      progress={item.progress ?? 0}
                      onPress={
                        row.id === "match"
                          ? undefined
                          : () => openItemDetail(item)
                      }
                      nextFocusUp={
                        rowIndex === 0 && featuredItems.length > 0
                          ? getFeaturedHandle(Math.min(itemIndex, featuredItems.length - 1))
                          : rowIndex === 1
                            ? findNodeHandle(bannerRef.current) ?? undefined
                            : getSectionCardHandle(rowIndex - 1, Math.min(itemIndex, homeSections[rowIndex - 1].items.length - 1))
                      }
                      nextFocusDown={
                        rowIndex < homeSections.length - 1
                          ? getSectionCardHandle(rowIndex + 1, Math.min(itemIndex, homeSections[rowIndex + 1].items.length - 1))
                          : undefined
                      }
                      nextFocusLeft={
                        itemIndex > 0 ? getSectionCardHandle(rowIndex, itemIndex - 1) : undefined
                      }
                      nextFocusRight={
                        itemIndex < row.items.length - 1
                          ? getSectionCardHandle(rowIndex, itemIndex + 1)
                          : undefined
                      }
                    />
                  ))}
                </ScrollView>
              )}
            </View>
            {rowIndex === 0 ? (
              <>
                <SaleBannerCarousel
                  ref={bannerRef}
                  slides={advertisements}
                  style={styles.saleBanner}
                  nextFocusUp={getFeaturedHandle(1)}
                  nextFocusDown={getSectionCardHandle(1, 0)}
                />
              </>
            ) : null}
          </React.Fragment>
        ))}
      </ScrollView>
      {drawerOpen ? (
        <View style={styles.drawerOverlay} pointerEvents="box-none">
          <View style={[styles.drawerPanel, { paddingBottom: 24 + bottomInset }]}>
            <DrawerCurvedHeader topInset={insets.top} width={DRAWER_PANEL_WIDTH} />
            <ScrollView
              ref={drawerScrollRef}
              style={styles.drawerList}
              contentContainerStyle={styles.drawerListContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View ref={drawerScrollContentRef}>
              {(() => {
                let itemIndex = 0;

                return drawerSections.map((section) => (
                  <View key={section.title} style={styles.drawerSection}>
                    <Text style={styles.drawerSectionTitle}>{section.title}</Text>
                    {section.items.map((item) => {
                      const index = itemIndex;
                      itemIndex += 1;

                      return (
                        <FocusablePressable
                          key={item.label}
                          suppressTVSelect
                          ref={(node) => {
                            drawerItemRefs.current[index] = node;
                          }}
                          style={({ pressed, focused }) => [
                            styles.drawerItem,
                            (pressed ||
                              focused ||
                              (activeDrawerItem >= 0 && index === activeDrawerItem))
                              ? styles.drawerItemFocused
                              : null,
                          ]}
                          hasTVPreferredFocus={index === 0}
                          onFocus={() => handleDrawerItemFocus(index)}
                          onPress={() => handleDrawerItemPress(item)}
                          nextFocusUp={
                            index > 0
                              ? getDrawerHandle(index - 1)
                              : findNodeHandle(menuButtonRef.current) ?? undefined
                          }
                          nextFocusDown={
                            index < drawerItems.length - 1
                              ? getDrawerHandle(index + 1)
                              : getLogoutHandle()
                          }
                          nextFocusRight={getContentFocusHandle()}
                        >
                          <Ionicons name={item.icon} size={22} color="#D2D2D2" style={styles.drawerItemIcon} />
                          <Text style={styles.drawerItemText}>{item.label}</Text>
                          {item.showBadge ? <View style={styles.drawerNotificationDot} /> : null}
                          {item.showExternal ? (
                            <View style={styles.drawerExternalIconWrap}>
                              <Ionicons name="open-outline" size={14} color="#D2D2D2" />
                            </View>
                          ) : null}
                        </FocusablePressable>
                      );
                    })}
                  </View>
                ));
              })()}
              </View>
            </ScrollView>
            <View style={[styles.drawerFooter, styles.drawerBodyInset]}>
              <FocusablePressable
                ref={logoutButtonRef}
                suppressTVSelect
                onPress={openLogoutConfirm}
                onFocus={() => {
                  cancelDrawerBlurClose();
                  setActiveDrawerItem(-1);
                  setLogoutFocused(true);
                }}
                onBlur={() => setLogoutFocused(false)}
                style={[styles.logoutButton, logoutFocused ? styles.drawerFooterButtonFocused : null]}
                nextFocusUp={getDrawerHandle(drawerItems.length - 1)}
                nextFocusDown={getDeleteAccountHandle()}
              >
                <Text style={styles.logoutButtonText}>Log out</Text>
              </FocusablePressable>
              <FocusablePressable
                ref={deleteAccountButtonRef}
                suppressTVSelect
                onPress={openDeleteConfirm}
                onFocus={() => {
                  cancelDrawerBlurClose();
                  setActiveDrawerItem(-1);
                  setDeleteAccountFocused(true);
                }}
                onBlur={() => setDeleteAccountFocused(false)}
                style={[
                  styles.deleteAccountButton,
                  deleteAccountFocused ? styles.drawerFooterButtonFocused : null,
                ]}
                nextFocusUp={getLogoutHandle()}
                nextFocusRight={getContentFocusHandle()}
              >
                <Text style={styles.deleteAccountButtonText}>Delete my account</Text>
              </FocusablePressable>
            </View>
          </View>
          <Pressable
            style={styles.drawerBackdrop}
            onPress={() => setDrawerOpen(false)}
          />
        </View>
      ) : null}
      <LogoutConfirmModal
        visible={logoutConfirmVisible}
        onClose={() => setLogoutConfirmVisible(false)}
        onConfirm={() => {
          setLogoutConfirmVisible(false);
          onLogoutPress?.();
        }}
      />
      <DeleteAccountConfirmModal
        visible={deleteAccountConfirmVisible}
        onClose={() => setDeleteAccountConfirmVisible(false)}
        onConfirm={() => {
          setDeleteAccountConfirmVisible(false);
          onDeleteAccountPress?.();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#06080F",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingRight: 16,
    paddingBottom: 8,
    paddingLeft: 16,
    backgroundColor: "#1D1B20",
    marginHorizontal: -10,
  },
  topBarIconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  topBarIconButtonFocused: {
    borderColor: "#FF5C4D",
    backgroundColor: "rgba(255, 92, 77, 0.2)",
  },
  topBarBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  topBarLogoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  topBarBrandText: {
    color: "#E71809",
    fontSize: 22,
    lineHeight: 28,
    ...gillSans("700"),
  },
  featuredCarousel: {
    height: FEATURED_CAROUSEL_HEIGHT,
    marginBottom: 24,
  },
  featuredCarouselContent: {
    paddingHorizontal: FEATURED_SIDE_PADDING,
    alignItems: "flex-start",
  },
  featuredSlot: {
    width: FEATURED_SLOT_WIDTH,
    height: FEATURED_CAROUSEL_HEIGHT,
    alignItems: "center",
  },
  featuredCardCenter: {
    width: FEATURED_CENTER_WIDTH,
    height: FEATURED_CENTER_HEIGHT,
    marginTop: FEATURED_CENTER_TOP,
    borderRadius: 8,
    overflow: "hidden",
    ...focusBorderBase,
  },
  featuredCardSide: {
    width: FEATURED_SIDE_WIDTH,
    height: FEATURED_SIDE_HEIGHT,
    marginTop: FEATURED_SIDE_TOP,
    borderRadius: 8,
    overflow: "hidden",
    ...focusBorderBase,
  },
  featuredCardFocused: focusBorderActive,
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  featuredImageCenter: {
    opacity: 1,
  },
  featuredImageSide: {
    opacity: 0.88,
    mixBlendMode: "lighten",
  },
  rowSection: {
    marginTop: 11,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 30,
    letterSpacing: 0.15,
    textTransform: "capitalize",
    ...gillSans("600"),
  },
  seeAllText: {
    color: "#D2D2D2",
    fontSize: 14,
    lineHeight: 16,
    letterSpacing: 0.5,
    ...gillSans("400"),
  },
  rowContent: {
    marginTop: 6,
    gap: 8,
    paddingRight: 6,
  },
  card: {
    width: 80,
    opacity: 1,
  },
  cardPosterShell: {
    width: 80,
    height: 120,
    borderRadius: 4,
    overflow: "hidden",
    ...focusBorderBase,
    backgroundColor: "#1A2741",
  },
  cardPosterShellFocused: focusBorderActive,
  cardPoster: {
    width: 80,
    height: 120,
    borderRadius: 4,
    opacity: 1,
    ...focusBorderBase,
    backgroundColor: "#1A2741",
    alignItems: "center",
    justifyContent: "center",
  },
  cardPosterImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1A2741",
  },
  cardPosterText: {
    color: "#E5EDFF",
    fontSize: 17,
    fontWeight: "700",
  },
  cardLabel: {
    marginTop: 4,
    color: "#D4DBEA",
    fontSize: 8,
    lineHeight: 12,
  },
  progressTrack: {
    marginTop: 6,
    height: 3,
    width: "100%",
    borderRadius: 2,
    backgroundColor: "#2B3344",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#F80D00",
  },
  saleBanner: {
    alignSelf: "center",
    marginTop: 24,
    marginBottom: 8,
  },
  matchCard: {
    height: 66,
    borderRadius: 6,
    ...focusBorderBase,
    backgroundColor: "#161E2E",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  matchCardFocused: focusBorderActive,
  matchTeamText: {
    color: "#EFF3FF",
    fontSize: 8,
    lineHeight: 12,
  },
  matchScoreText: {
    marginTop: 5,
    color: "#F1645E",
    fontSize: 11,
    fontWeight: "700",
  },
  footballList: {
    marginTop: 6,
    gap: 10,
  },
  footballCard: {
    position: "relative",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: "#2F2E37",
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 64,
    justifyContent: "center",
  },
  fixturePillAnchor: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  footballCardFocused: {
    borderColor: "#FFFFFF",
    transform: [{ scale: 1.01 }],
  },
  footballRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  footballTeamHome: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
    paddingRight: 44,
  },
  footballTeamAway: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    minWidth: 0,
    paddingLeft: 44,
  },
  footballTeamText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    ...gillSans("600"),
  },
  footballTeamTextAway: {
    textAlign: "right",
  },
  teamLogoImage: {
    width: 40,
    height: 40,
  },
  teamLogoFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5E2230",
  },
  teamLogoFallbackText: {
    color: "#FFFFFF",
    fontSize: 9,
    lineHeight: 12,
    ...gillSans("700"),
  },
  fixturePill: {
    minWidth: 76,
    borderRadius: 6,
    backgroundColor: "rgba(79, 74, 74, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  liveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "#E71809",
  },
  liveBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    lineHeight: 14,
    ...gillSans("600"),
  },
  fixtureTimeText: {
    color: "#FF988F",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    ...gillSans("600"),
  },
  fixtureDateText: {
    color: "#FFFFFF",
    fontSize: 10,
    lineHeight: 14,
    textAlign: "center",
    ...gillSans("400"),
  },
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "stretch",
  },
  drawerPanel: {
    width: DRAWER_PANEL_WIDTH,
    backgroundColor: "#121212",
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    overflow: "hidden",
    flexDirection: "column",
    maxHeight: "100%",
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  drawerHeaderArea: {
    position: "relative",
    height: DRAWER_HEADER_HEIGHT + 36,
    marginBottom: 4,
    alignItems: "center",
  },
  drawerHeaderSvg: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  drawerLogoWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    zIndex: 2,
  },
  drawerLogo: {
    width: DRAWER_LOGO_SIZE,
    height: DRAWER_LOGO_SIZE,
    borderRadius: DRAWER_LOGO_SIZE / 2,
  },
  drawerBodyInset: {
    paddingHorizontal: 20,
  },
  drawerList: {
    flexGrow: 0,
    flexShrink: 1,
    paddingTop: 4,
  },
  drawerListContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  drawerSection: {
    marginBottom: 16,
  },
  drawerSectionTitle: {
    color: "#8E8E8E",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
    ...gillSans("400"),
  },
  drawerItem: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "#1E1E1E",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  drawerItemFocused: {
    borderColor: "#FF5C4D",
    backgroundColor: "#2A2A2A",
  },
  drawerItemIcon: {
    marginRight: 12,
  },
  drawerItemText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    ...gillSans("400"),
  },
  drawerNotificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E71809",
    marginLeft: 8,
  },
  drawerExternalIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#4A4A4A",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  drawerFooter: {
    gap: 12,
    paddingTop: 8,
    flexShrink: 0,
  },
  drawerFooterButtonFocused: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  logoutButton: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: "#C80D00",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 24,
    ...gillSans("600"),
  },
  deleteAccountButton: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C80D00",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteAccountButtonText: {
    color: "#C80D00",
    fontSize: 18,
    lineHeight: 24,
    ...gillSans("600"),
  },
});
