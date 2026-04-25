import React, { forwardRef, useEffect, useRef, useState } from "react";
import {
  FlatList,
  findNodeHandle,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useTVEventHandler,
  View,
} from "react-native";

const FEATURED_ITEMS = [
  {
    id: "featured-1",
    title: "ASH",
    color: "#1C3A67",
  },
  {
    id: "featured-2",
    title: "SUPERMAN",
    color: "#2B355E",
  },
  {
    id: "featured-3",
    title: "MASK",
    color: "#5E2B3C",
  },
];

const HOME_SECTIONS = [
  { id: "trending", title: "Trending Now", showSeeAll: false, items: ["FURIOSA", "BOLT", "GOAT", "MAD MAX"] },
  { id: "continue", title: "Today's Match", showSeeAll: true, items: ["fixture-1", "fixture-2", "fixture-3"] },
  {
    id: "continueWatching",
    title: "Continue watching",
    showSeeAll: true,
    items: [
      "ASH",
      "WILD",
      "MASK",
      "TERMINATOR",
      "SUPERMAN",
      "AVATAR",
      "MATRIX",
      "BATMAN",
      "DUNE",
      "SPIDER",
    ],
  },
  { id: "series", title: "TV Series", showSeeAll: true, items: ["FLASH", "BATMAN", "BIG HERO", "BLACK"] },
  { id: "family", title: "Family/ Kids", showSeeAll: true, items: ["WONKA", "SPIDER", "ROBOT", "WILD"] },
  { id: "romance", title: "Romance", showSeeAll: true, items: ["ME BEFORE YOU", "PURPLE", "EVERYTHING", "YOU"] },
  { id: "animation", title: "Animations", showSeeAll: false, items: ["SPIDER", "JUNGLE", "WILD", "TOYS"] },
  { id: "thriller", title: "Thriller/Actions", showSeeAll: true, items: ["DARK", "WICK", "CROW", "MISSING"] },
  { id: "comedy", title: "Comedy", showSeeAll: false, items: ["FAMILY", "THIEF", "FIGHT", "PLAN"] },
];

const SALE_BANNER = {
  title: "SALE",
  subtitle: "50% Off All Tickets",
};

const POSTER_COLORS = ["#22355A", "#3D2446", "#1E4D4A", "#4F3322", "#29304A", "#1E3A62"];

const getPosterColor = (label) => {
  const seed = label.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return POSTER_COLORS[seed % POSTER_COLORS.length];
};

const ANDROID_TOP_INSET = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;
const FEATURED_CARD_WIDTH = 132;
const FEATURED_CARD_GAP = 8;
const FEATURED_CARD_SPAN = FEATURED_CARD_WIDTH + FEATURED_CARD_GAP;
const FEATURED_CAROUSEL_ITEMS = Array.from({ length: FEATURED_ITEMS.length * 3 }, (_, loopIndex) => {
  const originalIndex = loopIndex % FEATURED_ITEMS.length;
  return {
    ...FEATURED_ITEMS[originalIndex],
    originalIndex,
    loopIndex,
    carouselKey: `featured-loop-${loopIndex}`,
  };
});

const FOOTBALL_FIXTURES = [
  { id: "fixture-1", league: "Premiere League", home: "Liverpool", away: "Manchester United", date: "21 AUG", isLive: true },
  { id: "fixture-2", league: "Premiere League", home: "Liverpool", away: "Manchester United", date: "21 AUG", time: "03:00 AM" },
  { id: "fixture-3", league: "Premiere League", home: "Liverpool", away: "Manchester United", date: "21 AUG", time: "03:00 AM" },
];
const CONTINUE_WATCHING_PROGRESS = [0.68, 0.4, 0.52, 0.33, 0.74, 0.21, 0.57, 0.49, 0.62, 0.29];

const DRAWER_ITEMS = ["Home", "Movies", "TV Series", "My List", "Settings"];

const MediaCard = forwardRef(function MediaCard(
  { label, nextFocusUp, nextFocusDown, variant = "poster", progress = 0, showLabel = true },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const isMatchCard = variant === "match";
  const isContinueCard = variant === "continue";

  return (
    <Pressable
      ref={ref}
      style={({ pressed }) => [
        styles.card,
        (pressed || focused) ? styles.cardFocused : null,
      ]}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      nextFocusUp={nextFocusUp}
      nextFocusDown={nextFocusDown}
    >
      {isMatchCard ? (
        <View style={styles.matchCard}>
          <Text numberOfLines={1} style={styles.matchTeamText}>
            {label}
          </Text>
          <Text style={styles.matchScoreText}>2 - 0</Text>
        </View>
      ) : (
        <>
          <View style={[styles.cardPoster, { backgroundColor: getPosterColor(label) }]}>
            <Text style={styles.cardPosterText}>{label.slice(0, 1)}</Text>
          </View>
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

const FootballCard = forwardRef(function FootballCard(
  { fixture, nextFocusUp, nextFocusDown },
  ref,
) {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      ref={ref}
      style={({ pressed }) => [
        styles.footballCard,
        (pressed || focused) ? styles.footballCardFocused : null,
      ]}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      nextFocusUp={nextFocusUp}
      nextFocusDown={nextFocusDown}
    >
      <Text style={styles.footballLeague}>{fixture.league}</Text>
      <View style={styles.footballRow}>
        <View style={styles.footballTeam}>
          <View style={styles.teamBadge}>
            <Text style={styles.teamBadgeText}>{fixture.home.slice(0, 3).toUpperCase()}</Text>
          </View>
          <Text numberOfLines={1} style={styles.footballTeamText}>{fixture.home}</Text>
        </View>
        <View style={styles.fixturePill}>
          <Text style={styles.fixturePillTop}>{fixture.isLive ? "LIVE" : fixture.time}</Text>
          <Text style={styles.fixturePillBottom}>{fixture.date}</Text>
        </View>
        <View style={[styles.footballTeam, styles.footballTeamRight]}>
          <Text numberOfLines={2} style={styles.footballTeamText}>{fixture.away}</Text>
          <View style={styles.teamBadge}>
            <Text style={styles.teamBadgeText}>{fixture.away.slice(0, 3).toUpperCase()}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

export default function HomeScreen() {
  const menuButtonRef = useRef(null);
  const searchButtonRef = useRef(null);
  const minimizeButtonRef = useRef(null);
  const drawerItemRefs = useRef(DRAWER_ITEMS.map(() => null));
  const drawerBlurTimeoutRef = useRef(null);
  const featuredCenterRefs = useRef(FEATURED_ITEMS.map(() => null));
  const featuredCarouselRef = useRef(null);
  const rowRefs = useRef(
    HOME_SECTIONS.map((section) => Array.from({ length: section.items.length }, () => null)),
  );
  const bannerRef = useRef(null);
  const [menuFocused, setMenuFocused] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeDrawerItem, setActiveDrawerItem] = useState(0);

  const getFeaturedHandle = (index) =>
    findNodeHandle(featuredCenterRefs.current[index]) ?? undefined;
  const getSectionCardHandle = (sectionIndex, itemIndex) =>
    findNodeHandle(rowRefs.current[sectionIndex]?.[itemIndex]) ?? undefined;
  const getDrawerHandle = (index) =>
    findNodeHandle(drawerItemRefs.current[index]) ?? undefined;
  const getContentFocusHandle = () =>
    getFeaturedHandle(0) ??
    findNodeHandle(searchButtonRef.current) ??
    findNodeHandle(menuButtonRef.current) ??
    undefined;
  const centerStartIndex = FEATURED_ITEMS.length;

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
    }, 70);
  };

  useEffect(() => {
    return () => {
      cancelDrawerBlurClose();
    };
  }, []);

  useTVEventHandler((event) => {
    if (!drawerOpen || !event?.eventType) {
      return;
    }

    if (["left", "leftArrow", "right", "rightArrow"].includes(event.eventType)) {
      cancelDrawerBlurClose();
      setDrawerOpen(false);
    }
  });

  const handleFeaturedScrollEnd = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const closestIndex = Math.round(offsetX / FEATURED_CARD_SPAN);
    const itemCount = FEATURED_ITEMS.length;

    if (closestIndex < itemCount) {
      featuredCarouselRef.current?.scrollToIndex({
        index: closestIndex + itemCount,
        animated: false,
      });
    } else if (closestIndex >= itemCount * 2) {
      featuredCarouselRef.current?.scrollToIndex({
        index: closestIndex - itemCount,
        animated: false,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable
            ref={menuButtonRef}
            style={({ pressed }) => [styles.iconButton, (pressed || menuFocused) ? styles.iconButtonFocused : null]}
            onFocus={() => setMenuFocused(true)}
            onBlur={() => setMenuFocused(false)}
            onPress={() => setDrawerOpen((current) => !current)}
            nextFocusDown={drawerOpen ? findNodeHandle(minimizeButtonRef.current) ?? undefined : getFeaturedHandle(0)}
            nextFocusRight={drawerOpen ? findNodeHandle(minimizeButtonRef.current) ?? undefined : findNodeHandle(searchButtonRef.current) ?? undefined}
          >
            <View style={styles.menuIconWrapper}>
              <View style={styles.menuIconLine} />
              <View style={styles.menuIconLine} />
              <View style={styles.menuIconLine} />
            </View>
          </Pressable>
          <Image
            source={require("../assets/images/logo.png")}
            resizeMode="contain"
            style={styles.logo}
          />
          <Pressable
            ref={searchButtonRef}
            style={({ pressed }) => [styles.iconButton, (pressed || searchFocused) ? styles.iconButtonFocused : null]}
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
            <View style={styles.searchIconWrap}>
              <View style={styles.searchIconCircle} />
              <View style={styles.searchIconHandle} />
            </View>
          </Pressable>
        </View>

        <FlatList
          ref={featuredCarouselRef}
          data={FEATURED_CAROUSEL_ITEMS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredContent}
          ItemSeparatorComponent={() => <View style={styles.featuredSeparator} />}
          keyExtractor={(item) => item.carouselKey}
          snapToInterval={FEATURED_CARD_SPAN}
          decelerationRate="fast"
          disableIntervalMomentum
          bounces={false}
          getItemLayout={(_, index) => ({
            length: FEATURED_CARD_SPAN,
            offset: FEATURED_CARD_SPAN * index,
            index,
          })}
          onLayout={() => {
            featuredCarouselRef.current?.scrollToIndex({
              index: centerStartIndex,
              animated: false,
            });
          }}
          onMomentumScrollEnd={handleFeaturedScrollEnd}
          renderItem={({ item }) => (
            <Pressable
              ref={(node) => {
                if (
                  item.loopIndex >= centerStartIndex &&
                  item.loopIndex < centerStartIndex + FEATURED_ITEMS.length
                ) {
                  featuredCenterRefs.current[item.originalIndex] = node;
                }
              }}
              onFocus={() => {
                if (drawerOpen) {
                  setDrawerOpen(false);
                }
              }}
              style={({ pressed, focused }) => [
                styles.featuredCard,
                { backgroundColor: item.color },
                (pressed || focused) ? styles.featuredCardFocused : null,
              ]}
              nextFocusUp={
                findNodeHandle(
                  item.originalIndex === 0 ? menuButtonRef.current : searchButtonRef.current,
                ) ?? undefined
              }
              nextFocusDown={
                item.originalIndex === 1
                  ? findNodeHandle(bannerRef.current) ?? undefined
                  : getSectionCardHandle(
                    0,
                    Math.min(item.originalIndex, HOME_SECTIONS[0].items.length - 1),
                  )
              }
            >
              <Text style={styles.featuredCardText}>{item.title}</Text>
            </Pressable>
          )}
        />

        {HOME_SECTIONS.map((row, rowIndex) => (
          <React.Fragment key={row.id}>
            <View style={styles.rowSection}>
              <View style={styles.rowHeader}>
                <Text style={styles.rowTitle}>{row.title}</Text>
                {row.showSeeAll ? <Text style={styles.seeAllText}>See all</Text> : null}
              </View>
              {row.id === "continue" ? (
                <View style={styles.footballList}>
                  {FOOTBALL_FIXTURES.map((fixture, itemIndex) => (
                    <FootballCard
                      key={fixture.id}
                      ref={(node) => {
                        rowRefs.current[rowIndex][itemIndex] = node;
                      }}
                      fixture={fixture}
                      nextFocusUp={
                        itemIndex === 0
                          ? getSectionCardHandle(rowIndex - 1, 0)
                          : getSectionCardHandle(rowIndex, itemIndex - 1)
                      }
                      nextFocusDown={
                        itemIndex < FOOTBALL_FIXTURES.length - 1
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
                      key={`${row.id}-${item}-${itemIndex}`}
                      ref={(node) => {
                        rowRefs.current[rowIndex][itemIndex] = node;
                      }}
                      label={item}
                      variant={row.id === "continueWatching" ? "continue" : row.id === "match" ? "match" : "poster"}
                      showLabel={row.id !== "continueWatching"}
                      progress={row.id === "continueWatching" ? CONTINUE_WATCHING_PROGRESS[itemIndex] ?? 0.35 : 0}
                      nextFocusUp={
                        rowIndex === 0
                          ? getFeaturedHandle(Math.min(itemIndex, FEATURED_ITEMS.length - 1))
                          : rowIndex === 1
                            ? findNodeHandle(bannerRef.current) ?? undefined
                            : getSectionCardHandle(rowIndex - 1, Math.min(itemIndex, HOME_SECTIONS[rowIndex - 1].items.length - 1))
                      }
                      nextFocusDown={
                        rowIndex < HOME_SECTIONS.length - 1
                          ? getSectionCardHandle(rowIndex + 1, Math.min(itemIndex, HOME_SECTIONS[rowIndex + 1].items.length - 1))
                          : undefined
                      }
                    />
                  ))}
                </ScrollView>
              )}
            </View>
            {rowIndex === 0 ? (
              <Pressable
                ref={bannerRef}
                style={({ pressed, focused }) => [
                  styles.saleBanner,
                  (pressed || focused) ? styles.saleBannerFocused : null,
                ]}
                nextFocusUp={getFeaturedHandle(1)}
                nextFocusDown={getSectionCardHandle(1, 0)}
              >
                <Text style={styles.saleTitle}>{SALE_BANNER.title}</Text>
                <Text style={styles.saleSubtitle}>{SALE_BANNER.subtitle}</Text>
              </Pressable>
            ) : null}
          </React.Fragment>
        ))}
      </ScrollView>
      {drawerOpen ? (
        <View style={styles.drawerOverlay} pointerEvents="box-none">
          <Pressable style={styles.drawerBackdrop} onPress={() => setDrawerOpen(false)} />
          <View style={styles.drawerPanel}>
            <View style={styles.drawerHeader}>
              <Image
                source={require("../assets/images/logo.png")}
                resizeMode="contain"
                style={styles.drawerLogo}
              />
              <Pressable
                ref={minimizeButtonRef}
                style={({ pressed, focused }) => [
                  styles.minimizeButton,
                  (pressed || focused) ? styles.minimizeButtonFocused : null,
                ]}
                onFocus={cancelDrawerBlurClose}
                onBlur={scheduleDrawerBlurClose}
                onPress={() => setDrawerOpen(false)}
                nextFocusUp={findNodeHandle(menuButtonRef.current) ?? undefined}
                nextFocusDown={getDrawerHandle(0)}
                nextFocusRight={getContentFocusHandle()}
              >
                <Text style={styles.minimizeButtonText}>-</Text>
              </Pressable>
            </View>
            <View style={styles.drawerList}>
              {DRAWER_ITEMS.map((item, index) => (
                <Pressable
                  key={item}
                  ref={(node) => {
                    drawerItemRefs.current[index] = node;
                  }}
                  style={({ pressed, focused }) => [
                    styles.drawerItem,
                    (pressed || focused || index === activeDrawerItem) ? styles.drawerItemFocused : null,
                  ]}
                  hasTVPreferredFocus={index === 0}
                  onFocus={() => {
                    cancelDrawerBlurClose();
                    setActiveDrawerItem(index);
                  }}
                  onBlur={scheduleDrawerBlurClose}
                  onPress={() => setDrawerOpen(false)}
                  nextFocusUp={index > 0 ? getDrawerHandle(index - 1) : findNodeHandle(minimizeButtonRef.current) ?? undefined}
                  nextFocusDown={index < DRAWER_ITEMS.length - 1 ? getDrawerHandle(index + 1) : undefined}
                  nextFocusRight={getContentFocusHandle()}
                >
                  <Text style={styles.drawerItemText}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      ) : null}
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
    paddingTop: ANDROID_TOP_INSET,
    paddingHorizontal: 10,
    paddingBottom: 32,
  },
  topBar: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#101521",
    borderBottomWidth: 1,
    borderBottomColor: "#1E2533",
    paddingHorizontal: 7,
    marginHorizontal: -10,
  },
  logo: {
    width: 116,
    height: 28,
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonFocused: {
    borderColor: "#FF3B30",
    backgroundColor: "#1A2130",
  },
  menuIconWrapper: {
    width: 12,
    gap: 2,
  },
  menuIconLine: {
    height: 2,
    borderRadius: 1,
    backgroundColor: "#E7EAF0",
  },
  searchIconWrap: {
    width: 13,
    height: 13,
  },
  searchIconCircle: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1.5,
    borderColor: "#E7EAF0",
  },
  searchIconHandle: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 5,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: "#E7EAF0",
    transform: [{ rotate: "40deg" }],
  },
  featuredContent: {
    paddingTop: 10,
    paddingBottom: 4,
    paddingLeft: 8,
    paddingRight: 8,
  },
  featuredSeparator: {
    width: FEATURED_CARD_GAP,
  },
  featuredCard: {
    width: FEATURED_CARD_WIDTH,
    height: 176,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 14,
  },
  featuredCardFocused: {
    borderColor: "#FF5C4D",
    transform: [{ scale: 1.03 }],
  },
  featuredCardText: {
    color: "#FFFFFF",
    letterSpacing: 2,
    fontSize: 12,
    fontWeight: "700",
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
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  seeAllText: {
    color: "#A7AFC2",
    fontSize: 11,
    lineHeight: 16,
  },
  rowContent: {
    marginTop: 6,
    gap: 7,
    paddingRight: 6,
  },
  card: {
    width: 74,
  },
  cardFocused: {
    transform: [{ scale: 1.03 }],
    opacity: 1,
  },
  cardPoster: {
    height: 92,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#273146",
    backgroundColor: "#1A2741",
    alignItems: "center",
    justifyContent: "center",
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
    marginTop: 10,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2A3958",
    backgroundColor: "#113D89",
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  saleBannerFocused: {
    borderColor: "#FF5C4D",
  },
  saleTitle: {
    color: "#FFD64C",
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
  },
  saleSubtitle: {
    marginTop: 2,
    color: "#E6F0FF",
    fontSize: 12,
    lineHeight: 16,
  },
  matchCard: {
    height: 66,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#29364F",
    backgroundColor: "#161E2E",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
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
    marginTop: 12,
    gap: 12,
  },
  footballCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2F2E36",
    backgroundColor: "#2F2E37",
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  footballCardFocused: {
    borderColor: "#FF5C4D",
    transform: [{ scale: 1.01 }],
  },
  footballLeague: {
    color: "#F80D00",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  footballRow: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  footballTeam: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  footballTeamRight: {
    justifyContent: "flex-end",
  },
  footballTeamText: {
    color: "#F4F1F1",
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
    flexShrink: 1,
  },
  teamBadge: {
    width: 35,
    height: 35,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5E2230",
  },
  teamBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  fixturePill: {
    width: 70,
    borderRadius: 4,
    backgroundColor: "rgba(79, 74, 74, 0.28)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  fixturePillTop: {
    color: "#FF988F",
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
  },
  fixturePillBottom: {
    color: "#F4F1F1",
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
  },
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    flexDirection: "row",
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  drawerPanel: {
    width: 246,
    backgroundColor: "#0E1320",
    borderRightWidth: 1,
    borderRightColor: "#273146",
    paddingTop: ANDROID_TOP_INSET + 14,
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  drawerLogo: {
    width: 122,
    height: 30,
  },
  minimizeButton: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#39465F",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#131B2B",
  },
  minimizeButtonFocused: {
    borderColor: "#FF5C4D",
    backgroundColor: "#1A2235",
  },
  minimizeButtonText: {
    color: "#EFF3FF",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  drawerList: {
    marginTop: 20,
    gap: 8,
  },
  drawerItem: {
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  drawerItemFocused: {
    borderColor: "#FF5C4D",
    backgroundColor: "#1A2235",
  },
  drawerItemText: {
    color: "#EFF3FF",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
});
