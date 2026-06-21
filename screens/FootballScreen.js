import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import FootballMatchCard from "../components/FootballMatchCard";
import { gillSans } from "../constants/fonts";
import { useScreenInsets } from "../hooks/useScreenInsets";
import { fetchMatchesRequest } from "../store/catalog/actions";
import { selectMatches, selectMatchesLoading } from "../store/catalog/selectors";
import {
  buildDateTabsFromMatches,
  buildLeagueOptionsFromMatches,
} from "../utils/football";

function DateTab({ tab, isSelected, onPress, focused, onFocus, onBlur }) {
  const topLabel = isSelected && tab.dayLabel ? tab.dayLabel : tab.weekday;
  const bottomLabel = tab.dateLabel;

  const content = (
    <View style={styles.dateTabInner}>
      <Text style={[styles.dateTabTop, isSelected ? styles.dateTabTextActive : styles.dateTabText]}>
        {topLabel}
      </Text>
      <Text style={[styles.dateTabBottom, isSelected ? styles.dateTabTextActive : styles.dateTabText]}>
        {bottomLabel}
      </Text>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      style={[styles.dateTabButton, focused ? styles.dateTabButtonFocused : null]}
    >
      {isSelected ? (
        <LinearGradient
          colors={["#FF1E1E", "rgba(142, 10, 0, 0)"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.dateTabSelected}
        >
          {content}
        </LinearGradient>
      ) : (
        <View style={styles.dateTabUnselected}>{content}</View>
      )}
    </Pressable>
  );
}

export default function FootballScreen({ onBack, onMatchPress, onSearchPress }) {
  const dispatch = useDispatch();
  const { contentBottomPadding } = useScreenInsets(32);
  const apiMatches = useSelector(selectMatches);
  const matchesLoading = useSelector(selectMatchesLoading);
  const [backFocused, setBackFocused] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedDateId, setSelectedDateId] = useState(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState("all");
  const [focusedDateId, setFocusedDateId] = useState(null);
  const [focusedLeagueId, setFocusedLeagueId] = useState(null);

  useEffect(() => {
    dispatch(fetchMatchesRequest({ days: 7 }));
  }, [dispatch]);

  const dateTabs = useMemo(() => buildDateTabsFromMatches(apiMatches), [apiMatches]);
  const leagueOptions = useMemo(() => buildLeagueOptionsFromMatches(apiMatches), [apiMatches]);

  useEffect(() => {
    if (!selectedDateId && dateTabs.length > 0) {
      const todayTab = dateTabs.find((tab) => tab.isToday);
      setSelectedDateId(todayTab?.id ?? dateTabs[0].id);
    }
  }, [dateTabs, selectedDateId]);

  const fixtures = useMemo(() => {
    let filtered = apiMatches;

    if (selectedLeagueId !== "all") {
      filtered = filtered.filter((match) => match.leagueId === selectedLeagueId);
    }

    if (selectedDateId) {
      filtered = filtered.filter((match) => match.dateKey === selectedDateId);
    }

    return filtered;
  }, [apiMatches, selectedDateId, selectedLeagueId]);

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
        contentContainerStyle={[styles.content, { paddingBottom: contentBottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {dateTabs.length > 0 ? (
          <View style={styles.dateBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateBarContent}
            >
              {dateTabs.map((tab) => (
                <DateTab
                  key={tab.id}
                  tab={tab}
                  isSelected={tab.id === selectedDateId}
                  onPress={() => setSelectedDateId(tab.id)}
                  focused={focusedDateId === tab.id}
                  onFocus={() => setFocusedDateId(tab.id)}
                  onBlur={() => setFocusedDateId(null)}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {leagueOptions.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.leagueBarContent}
            style={styles.leagueBar}
          >
            {leagueOptions.map((league) => {
              const isSelected = league.id === selectedLeagueId;

              return (
                <Pressable
                  key={league.id}
                  style={[
                    styles.leagueTabButton,
                    focusedLeagueId === league.id ? styles.leagueTabButtonFocused : null,
                  ]}
                  onPress={() => setSelectedLeagueId(league.id)}
                  onFocus={() => setFocusedLeagueId(league.id)}
                  onBlur={() => setFocusedLeagueId(null)}
                >
                  <Text
                    style={[
                      styles.leagueTabText,
                      isSelected ? styles.leagueTabTextActive : null,
                      focusedLeagueId === league.id ? styles.leagueTabTextFocused : null,
                    ]}
                  >
                    {league.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        <View style={styles.matchList}>
          {matchesLoading && fixtures.length === 0 ? (
            <ActivityIndicator color="#FFFFFF" style={styles.loadingIndicator} />
          ) : null}
          {fixtures.map((fixture) => (
            <FootballMatchCard
              key={fixture.id}
              fixture={fixture}
              onPress={() => onMatchPress?.(fixture)}
            />
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
  content: {},
  dateBar: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  dateBarContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dateTabButton: {
    minWidth: 64,
    borderRadius: 8,
    overflow: "hidden",
  },
  dateTabButtonFocused: {
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  dateTabSelected: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dateTabUnselected: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dateTabInner: {
    alignItems: "center",
  },
  dateTabTop: {
    fontSize: 12,
    lineHeight: 16,
    ...gillSans("600"),
  },
  dateTabBottom: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
    ...gillSans("400"),
  },
  dateTabText: {
    color: "#8D93A4",
  },
  dateTabTextActive: {
    color: "#FFFFFF",
  },
  leagueBar: {
    marginTop: 4,
  },
  leagueBarContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  leagueTabButton: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  leagueTabButtonFocused: {
    borderColor: "#FFFFFF",
  },
  leagueTabText: {
    color: "#8D93A4",
    fontSize: 14,
    ...gillSans("500"),
  },
  leagueTabTextActive: {
    color: "#FFFFFF",
    ...gillSans("700"),
  },
  leagueTabTextFocused: {
    color: "#FFFFFF",
  },
  matchList: {
    marginTop: 16,
    paddingHorizontal: 16,
    gap: 10,
  },
  loadingIndicator: {
    marginVertical: 24,
  },
});
