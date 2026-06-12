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
import { focusBorderActive, focusBorderBase } from "../constants/focusStyles";
import { gillSans } from "../constants/fonts";
import { fetchMatchDetailRequest } from "../store/catalog/actions";
import { selectMatchDetail, selectMatchDetailLoading } from "../store/catalog/selectors";
import {
  formatMatchSchedule,
  getServerStatusMessage,
  mapMatchLinksToServers,
} from "../utils/football";
import { SUBSCRIPTION_WATCH_LABEL } from "../utils/playback";

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

export default function FootballDetailScreen({
  match,
  onBack,
  onMatchPress,
  onSeeAllFootball,
  onSearchPress,
  onPlayMatch,
  onPlaybackBlocked,
}) {
  const dispatch = useDispatch();
  const matchId = match?.id ?? match?.apiId;
  const matchDetail = useSelector((state) => selectMatchDetail(state, matchId));
  const detailLoading = useSelector((state) => selectMatchDetailLoading(state, matchId));
  const [backFocused, setBackFocused] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [watchFocused, setWatchFocused] = useState(false);
  const [heroFocused, setHeroFocused] = useState(false);
  const [selectedServerId, setSelectedServerId] = useState(null);
  const [serverTabFocused, setServerTabFocused] = useState(null);
  const [seeAllFocused, setSeeAllFocused] = useState(false);

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

  // A server is playable only when it actually has a stream URL attached.
  const playableServers = useMemo(
    () => servers.filter((server) => Boolean(server.url)),
    [servers],
  );

  useEffect(() => {
    if (!servers.length) {
      setSelectedServerId(null);
      return;
    }

    const stillValid = servers.some((server) => server.id === selectedServerId);
    if (!selectedServerId || !stillValid) {
      // Prefer a playable server when picking the default.
      const fallback = playableServers[0] ?? servers[0];
      setSelectedServerId(fallback.id);
    }
  }, [servers, playableServers, selectedServerId]);

  const selectedServer = servers.find((server) => server.id === selectedServerId) ?? null;
  const canWatch = playableServers.length > 0;
  const subscriptionBlocked =
    !detailLoading && servers.length > 0 && playableServers.length === 0;
  const watchLabel = canWatch
    ? "Watch now"
    : subscriptionBlocked
      ? SUBSCRIPTION_WATCH_LABEL
      : "No stream available yet";
  const playServer =
    selectedServer && selectedServer.url ? selectedServer : playableServers[0] ?? null;
  const matchSchedule = formatMatchSchedule(displayMatch);

  const handlePlay = () => {
    if (!playServer || !playServer.url) {
      if (subscriptionBlocked) {
        onPlaybackBlocked?.();
        return;
      }

      return;
    }
    onPlayMatch?.(displayMatch, playServer);
  };

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
        <Pressable
          style={[styles.heroWrapper, heroFocused ? styles.heroWrapperFocused : null]}
          disabled={!canWatch && !subscriptionBlocked}
          onPress={handlePlay}
          onFocus={() => setHeroFocused(true)}
          onBlur={() => setHeroFocused(false)}
        >
          {displayMatch.previewImage ? (
            <Image source={displayMatch.previewImage} resizeMode="cover" style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]} />
          )}
          <View style={styles.playButtonOverlay} pointerEvents="none">
            <View style={[styles.playButton, !canWatch ? styles.playButtonDisabled : null]}>
              <Ionicons
                name={canWatch ? "play" : "lock-closed"}
                size={26}
                color="#1D1B20"
                style={canWatch ? styles.playIcon : null}
              />
            </View>
          </View>
        </Pressable>

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

          <View style={styles.matchTimeChip}>
            {matchSchedule.isLive ? (
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>{matchSchedule.label}</Text>
              </View>
            ) : (
              <>
                <Ionicons name="time-outline" size={14} color="#D2D2D2" />
                <Text style={styles.matchTimeChipText}>{matchSchedule.label}</Text>
              </>
            )}
          </View>
        </View>

        {detailLoading && servers.length === 0 ? (
          <ActivityIndicator color="#FFFFFF" style={styles.loadingIndicator} />
        ) : null}

        {servers.length > 0 ? (
          <>
            <Text style={styles.serverSectionTitle}>Choose a server</Text>
            <View style={styles.serverTabs}>
              {servers.map((server) => {
                const isSelected = server.id === selectedServerId;
                const isPlayable = Boolean(server.url);

                return (
                  <Pressable
                    key={server.id}
                    style={[
                      styles.serverTabButton,
                      serverTabFocused === server.id ? styles.serverTabButtonFocused : null,
                    ]}
                    onPress={() => setSelectedServerId(server.id)}
                    onFocus={() => setServerTabFocused(server.id)}
                    onBlur={() => setServerTabFocused(null)}
                  >
                    <View style={styles.serverTabLabelRow}>
                      {!isPlayable ? (
                        <Ionicons name="lock-closed" size={12} color="#79747E" />
                      ) : null}
                      <Text
                        style={[
                          styles.serverTabText,
                          isSelected ? styles.serverTabTextActive : null,
                          serverTabFocused === server.id ? styles.serverTabTextFocused : null,
                          !isPlayable ? styles.serverTabTextDisabled : null,
                        ]}
                      >
                        {server.label}
                      </Text>
                    </View>
                    {isSelected ? <View style={styles.serverTabUnderline} /> : null}
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={[
                styles.watchButton,
                !canWatch ? styles.watchButtonDisabled : null,
                watchFocused ? styles.watchButtonFocused : null,
              ]}
              disabled={!canWatch && !subscriptionBlocked}
              onPress={handlePlay}
              onFocus={() => setWatchFocused(true)}
              onBlur={() => setWatchFocused(false)}
            >
              <Ionicons
                name={canWatch ? "play" : "lock-closed"}
                size={20}
                color={canWatch ? "#FFFFFF" : "#79747E"}
              />
              <Text style={[styles.watchButtonText, !canWatch ? styles.watchButtonTextDisabled : null]}>
                {watchLabel}
              </Text>
            </Pressable>

            {selectedServer ? (
              <Text
                style={[
                  styles.serverStatusText,
                  !selectedServer.url ? styles.serverStatusTextError : null,
                ]}
              >
                {selectedServer.url
                  ? getServerStatusMessage(selectedServer.status)
                  : "This server has no stream link yet. Pick another server."}
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
              <Pressable
                onPress={onSeeAllFootball}
                onFocus={() => setSeeAllFocused(true)}
                onBlur={() => setSeeAllFocused(false)}
                style={[styles.relatedSeeAllButton, seeAllFocused ? styles.relatedSeeAllButtonFocused : null]}
              >
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
    ...focusBorderBase,
  },
  heroWrapperFocused: focusBorderActive,
  playButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.5)",
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
  matchTimeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#3E2A2A",
  },
  matchTimeChipText: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 18,
    ...gillSans("400"),
  },
  liveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "#E71809",
  },
  liveBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    lineHeight: 16,
    ...gillSans("600"),
  },
  loadingIndicator: {
    marginTop: 20,
  },
  serverSectionTitle: {
    marginTop: 22,
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    ...gillSans("600"),
  },
  serverTabs: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  serverTabButton: {
    flex: 1,
    alignItems: "center",
    paddingBottom: 8,
    paddingHorizontal: 4,
    borderRadius: 6,
    ...focusBorderBase,
  },
  serverTabButtonFocused: focusBorderActive,
  serverTabLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
  serverTabTextDisabled: {
    color: "#5A5A5A",
  },
  watchButton: {
    marginTop: 18,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#E71809",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  watchButtonDisabled: {
    backgroundColor: "#2A2A2A",
  },
  watchButtonFocused: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  watchButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    ...gillSans("600"),
  },
  watchButtonTextDisabled: {
    color: "#79747E",
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
  relatedSeeAllButton: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    ...focusBorderBase,
  },
  relatedSeeAllButtonFocused: focusBorderActive,
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
