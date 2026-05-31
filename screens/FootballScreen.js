import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FootballMatchCard from "../components/FootballMatchCard";
import { gillSans } from "../constants/fonts";
import {
  FOOTBALL_DATE_TABS,
  FOOTBALL_DEFAULT_DATE_ID,
  FOOTBALL_LEAGUES,
  getFixturesForDateAndLeague,
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
  const [backFocused, setBackFocused] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedDateId, setSelectedDateId] = useState(FOOTBALL_DEFAULT_DATE_ID);
  const [selectedLeagueId, setSelectedLeagueId] = useState("all");
  const [focusedDateId, setFocusedDateId] = useState(null);
  const [focusedLeagueId, setFocusedLeagueId] = useState(null);

  const fixtures = useMemo(
    () => getFixturesForDateAndLeague(selectedDateId, selectedLeagueId),
    [selectedDateId, selectedLeagueId],
  );

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
        <View style={styles.dateBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateBarContent}
          >
            {FOOTBALL_DATE_TABS.map((tab) => (
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.leagueBarContent}
          style={styles.leagueBar}
        >
          {FOOTBALL_LEAGUES.map((league) => {
            const isSelected = league.id === selectedLeagueId;

            return (
              <Pressable
                key={league.id}
                style={styles.leagueTabButton}
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

        <View style={styles.matchList}>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  dateBar: {
    borderRadius: 12,
    backgroundColor: "#1D1B20",
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  dateBarContent: {
    gap: 6,
    paddingHorizontal: 4,
  },
  dateTabButton: {
    borderRadius: 4,
    overflow: "hidden",
  },
  dateTabButtonFocused: {
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  dateTabSelected: {
    width: 48,
    height: 56,
    borderRadius: 4,
    opacity: 1,
    paddingTop: 4,
    paddingRight: 6,
    paddingBottom: 4,
    paddingLeft: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  dateTabUnselected: {
    width: 48,
    height: 56,
    paddingTop: 4,
    paddingRight: 6,
    paddingBottom: 4,
    paddingLeft: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  dateTabInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  dateTabTop: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: "center",
    ...gillSans("600"),
  },
  dateTabBottom: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 12,
    textAlign: "center",
    ...gillSans("400"),
  },
  dateTabText: {
    color: "#79747E",
  },
  dateTabTextActive: {
    color: "#FFFFFF",
  },
  leagueBar: {
    marginTop: 16,
  },
  leagueBarContent: {
    gap: 20,
    paddingRight: 8,
  },
  leagueTabButton: {
    paddingVertical: 4,
  },
  leagueTabText: {
    color: "#79747E",
    fontSize: 14,
    lineHeight: 20,
    ...gillSans("400"),
  },
  leagueTabTextActive: {
    color: "#FFFFFF",
    ...gillSans("600"),
  },
  leagueTabTextFocused: {
    color: "#FFFFFF",
  },
  matchList: {
    marginTop: 16,
    gap: 10,
  },
});
