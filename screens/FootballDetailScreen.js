import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
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
import VsIcon from "../assets/images/football/vs.svg";
import FootballMatchCard from "../components/FootballMatchCard";
import PremiumMembershipCard from "../components/PremiumMembershipCard";
import { gillSans } from "../constants/fonts";
import { fetchMatchDetailRequest } from "../store/catalog/actions";
import { selectMatchDetail, selectMatchDetailLoading } from "../store/catalog/selectors";
import { getServerStatusMessage, mapMatchLinksToServers } from "../utils/football";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTENT_PADDING = 16;
const HERO_WIDTH = SCREEN_WIDTH - CONTENT_PADDING * 2;
const HERO_HEIGHT = Math.round(HERO_WIDTH * 0.56);

function getLeagueAbbreviation(leagueName) {
  if (!leagueName) {
    return "—";
  }

  const words = leagueName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function FootballDetailScreen({ match, onBack, onMatchPress, onSeeAllFootball, onSearchPress }) {
  const dispatch = useDispatch();
  const matchId = match?.id ?? match?.apiId;
  const matchDetail = useSelector((state) => selectMatchDetail(state, matchId));
  const detailLoading = useSelector((state) => selectMatchDetailLoading(state, matchId));
  const [backFocused, setBackFocused] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedServerId, setSelectedServerId] = useState(null);
  const [serverTabFocused, setServerTabFocused] = useState(null);

  useEffect(() => {
    if (matchId) {
      dispatch(fetchMatchDetailRequest(matchId));
    }
  }, [dispatch, matchId]);

  const displayMatch = matchDetail ?? match;

  const servers = useMemo(() => {
    const links = matchDetail?.links ?? match?.links ?? [];
    return mapMatchLinksToServers(links);
  }, [matchDetail, match]);

  useEffect(() => {
    if (!servers.length) {
      setSelectedServerId(null);
      return;
    }

    if (!selectedServerId || !servers.some((server) => server.id === selectedServerId)) {
      setSelectedServerId(servers[0].id);
    }
  }, [servers, selectedServerId]);

  const selectedServer = servers.find((server) => server.id === selectedServerId) ?? null;

  if (!match) {
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
          Football matches
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
          {displayMatch.previewImage ? (
            <Image source={displayMatch.previewImage} resizeMode="cover" style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]} />
          )}
          <View style={styles.playButtonOverlay} pointerEvents="none">
            <View style={styles.playButton}>
              <Ionicons name="play" size={28} color="#1D1B20" style={styles.playIcon} />
            </View>
          </View>
        </View>

        <View style={styles.matchTitleRow}>
          <View style={styles.vsIconWrap}>
            <VsIcon width={31} height={64} />
          </View>

          <View style={styles.matchNames}>
            <Text style={styles.matchTeamName} numberOfLines={2}>
              {displayMatch.home}
            </Text>
            <Text style={styles.matchTeamName} numberOfLines={2}>
              {displayMatch.away}
            </Text>
          </View>
        </View>

        <View style={styles.metaChipRow}>
          <View style={styles.leagueChip}>
            <View style={styles.leagueIcon}>
              <Text style={styles.leagueIconText}>{getLeagueAbbreviation(displayMatch.league)}</Text>
            </View>
            <Text style={styles.leagueChipText}>{displayMatch.league}</Text>
          </View>

          <View style={styles.durationChip}>
            <Ionicons name="time-outline" size={14} color="#D2D2D2" />
            <Text style={styles.durationChipText}>{displayMatch.duration}</Text>
          </View>
        </View>

        {detailLoading && servers.length === 0 ? (
          <ActivityIndicator color="#FFFFFF" style={styles.loadingIndicator} />
        ) : null}

        {servers.length > 0 ? (
          <>
            <View style={styles.serverTabs}>
              {servers.map((server) => {
                const isSelected = server.id === selectedServerId;

                return (
                  <Pressable
                    key={server.id}
                    style={styles.serverTabButton}
                    onPress={() => setSelectedServerId(server.id)}
                    onFocus={() => setServerTabFocused(server.id)}
                    onBlur={() => setServerTabFocused(null)}
                  >
                    <Text
                      style={[
                        styles.serverTabText,
                        isSelected ? styles.serverTabTextActive : null,
                        serverTabFocused === server.id ? styles.serverTabTextFocused : null,
                      ]}
                    >
                      {server.label}
                    </Text>
                    {isSelected ? <View style={styles.serverTabUnderline} /> : null}
                  </Pressable>
                );
              })}
            </View>

            {selectedServer ? (
              <Text
                style={[
                  styles.serverStatusText,
                  selectedServer.status === "error" ? styles.serverStatusTextError : null,
                ]}
              >
                {getServerStatusMessage(selectedServer.status)}
              </Text>
            ) : null}
          </>
        ) : !detailLoading ? (
          <Text style={styles.serverStatusText}>No stream servers available for this match.</Text>
        ) : null}

        {match.relatedMatches?.length > 0 ? (
          <View style={styles.relatedSection}>
            <View style={styles.relatedHeader}>
              <Text style={styles.relatedTitle}>Matches You Might Like</Text>
              <Pressable onPress={onSeeAllFootball}>
                <Text style={styles.relatedSeeAll}>See all</Text>
              </Pressable>
            </View>

            <View style={styles.relatedList}>
              {match.relatedMatches.map((fixture) => (
                <FootballMatchCard
                  key={fixture.id}
                  fixture={fixture}
                  onPress={() => onMatchPress?.(fixture)}
                />
              ))}
            </View>
          </View>
        ) : null}

        <PremiumMembershipCard />
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
  matchTitleRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  vsIconWrap: {
    width: 31,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  matchNames: {
    flex: 1,
    gap: 4,
  },
  matchTeamName: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 26,
    ...gillSans("700"),
  },
  metaChipRow: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  leagueChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#3E2A2A",
  },
  leagueIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#38003C",
    alignItems: "center",
    justifyContent: "center",
  },
  leagueIconText: {
    color: "#FFFFFF",
    fontSize: 8,
    lineHeight: 10,
    ...gillSans("700"),
  },
  leagueChipText: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 18,
    ...gillSans("400"),
  },
  durationChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#3E2A2A",
  },
  durationChipText: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 18,
    ...gillSans("400"),
  },
  loadingIndicator: {
    marginTop: 20,
  },
  serverTabs: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  serverTabButton: {
    flex: 1,
    alignItems: "center",
    paddingBottom: 8,
  },
  serverTabText: {
    color: "#79747E",
    fontSize: 14,
    lineHeight: 20,
    ...gillSans("400"),
  },
  serverTabTextActive: {
    color: "#FFFFFF",
    ...gillSans("600"),
  },
  serverTabTextFocused: {
    color: "#FFFFFF",
  },
  serverTabUnderline: {
    marginTop: 6,
    width: "100%",
    height: 2,
    borderRadius: 1,
    backgroundColor: "#E71809",
  },
  serverStatusText: {
    marginTop: 10,
    color: "#79747E",
    fontSize: 12,
    lineHeight: 18,
    ...gillSans("400"),
  },
  serverStatusTextError: {
    color: "#FF988F",
  },
  relatedSection: {
    marginTop: 28,
  },
  relatedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  relatedTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 30,
    textTransform: "capitalize",
    ...gillSans("600"),
  },
  relatedSeeAll: {
    color: "#D2D2D2",
    fontSize: 14,
    lineHeight: 16,
    letterSpacing: 0.5,
    ...gillSans("400"),
  },
  relatedList: {
    gap: 10,
  },
});
