import React, { forwardRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { gillSans } from "../constants/fonts";

function TeamLogo({ logo, name, badgeColor }) {
  if (logo) {
    return <Image source={logo} resizeMode="contain" style={styles.teamLogoImage} />;
  }

  return (
    <View style={[styles.teamLogoFallback, badgeColor ? { backgroundColor: badgeColor } : null]}>
      <Text style={styles.teamLogoFallbackText}>{(name || "—").slice(0, 3).toUpperCase()}</Text>
    </View>
  );
}

const FootballMatchCard = forwardRef(function FootballMatchCard(
  { fixture, onPress, nextFocusUp, nextFocusDown },
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
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      nextFocusUp={nextFocusUp}
      nextFocusDown={nextFocusDown}
    >
      <View style={styles.fixturePillAnchor} pointerEvents="none">
        <View style={styles.fixturePill}>
          {fixture.isLive ? (
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>Live</Text>
            </View>
          ) : (
            <Text style={styles.fixtureTimeText}>{fixture.time}</Text>
          )}
          <Text style={styles.fixtureDateText}>{fixture.date}</Text>
        </View>
      </View>

      <View style={styles.footballRow}>
        <View style={styles.footballTeamHome}>
          <TeamLogo logo={fixture.homeLogo} name={fixture.home} badgeColor={fixture.homeBadgeColor} />
          <Text numberOfLines={2} style={styles.footballTeamText}>
            {fixture.home}
          </Text>
        </View>

        <View style={styles.footballTeamAway}>
          <Text numberOfLines={2} style={[styles.footballTeamText, styles.footballTeamTextAway]}>
            {fixture.away}
          </Text>
          <TeamLogo logo={fixture.awayLogo} name={fixture.away} badgeColor={fixture.awayBadgeColor} />
        </View>
      </View>
    </Pressable>
  );
});

export default FootballMatchCard;

const styles = StyleSheet.create({
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
  footballCardFocused: {
    borderColor: "#FFFFFF",
    transform: [{ scale: 1.01 }],
  },
  fixturePillAnchor: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
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
});
