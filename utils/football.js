export const FOOTBALL_LOGOS = {
  liverpool: require("../assets/images/football/liverpool.png"),
  manchesterUnited: require("../assets/images/football/manchester-united.png"),
  fcCopenhagen: require("../assets/images/football/fc-copenhagen.png"),
  fcBasel: require("../assets/images/football/fc-basel.png"),
};

export const FOOTBALL_PREVIEW_IMAGE = require("../assets/images/trending/trending-2.jpg");

export const FOOTBALL_SERVERS = [
  { id: "server-1", label: "Server 1", status: "ok" },
  { id: "server-2", label: "Server 2", status: "ok" },
  { id: "server-3", label: "Server 3", status: "error" },
  { id: "server-4", label: "Server 4", status: "ok" },
];

export const FOOTBALL_DATE_TABS = [
  { id: "9-aug", weekday: "Wed", dateLabel: "9 Aug" },
  { id: "10-aug", weekday: "Thu", dateLabel: "10 Aug" },
  { id: "11-aug", weekday: "Fri", dateLabel: "11 Aug" },
  { id: "12-aug", weekday: "Sat", dateLabel: "12 Aug", dayLabel: "Today", isToday: true },
  { id: "13-aug", weekday: "Sun", dateLabel: "13 Aug" },
  { id: "14-aug", weekday: "Mon", dateLabel: "14 Aug" },
];

export const FOOTBALL_LEAGUES = [
  { id: "all", label: "All" },
  { id: "premier-league", label: "Premier League" },
  { id: "bundesliga", label: "Bundesliga" },
  { id: "la-liga", label: "La Liga" },
  { id: "besta-deild", label: "Besta..." },
];

export const FOOTBALL_DEFAULT_DATE_ID = "12-aug";

const createMatch = (fixture) => ({
  duration: "00:39 min",
  previewImage: FOOTBALL_PREVIEW_IMAGE,
  ...fixture,
});

export const FOOTBALL_MATCH_LIST = [
  createMatch({
    id: "match-12-1",
    dateKey: "12-aug",
    date: "12 AUG",
    time: "03:00 AM",
    league: "Premier League",
    leagueId: "premier-league",
    home: "Liverpool",
    away: "Manchester United",
    homeLogo: FOOTBALL_LOGOS.liverpool,
    awayLogo: FOOTBALL_LOGOS.manchesterUnited,
    homeBadgeColor: "#C8102E",
    awayBadgeColor: "#DA291C",
  }),
  createMatch({
    id: "match-12-2",
    dateKey: "12-aug",
    date: "12 AUG",
    time: "03:00 AM",
    league: "Premier League",
    leagueId: "premier-league",
    home: "Liverpool",
    away: "Manchester United",
    homeLogo: FOOTBALL_LOGOS.liverpool,
    awayLogo: FOOTBALL_LOGOS.manchesterUnited,
    homeBadgeColor: "#C8102E",
    awayBadgeColor: "#DA291C",
  }),
  createMatch({
    id: "match-12-3",
    dateKey: "12-aug",
    date: "12 AUG",
    time: "03:00 AM",
    league: "Premier League",
    leagueId: "premier-league",
    home: "Liverpool",
    away: "Manchester United",
    homeLogo: FOOTBALL_LOGOS.liverpool,
    awayLogo: FOOTBALL_LOGOS.manchesterUnited,
    homeBadgeColor: "#C8102E",
    awayBadgeColor: "#DA291C",
  }),
  createMatch({
    id: "match-12-4",
    dateKey: "12-aug",
    date: "12 AUG",
    time: "03:00 AM",
    league: "Bundesliga",
    leagueId: "bundesliga",
    home: "FC Copenhagen",
    away: "FC Basel",
    homeLogo: FOOTBALL_LOGOS.fcCopenhagen,
    awayLogo: FOOTBALL_LOGOS.fcBasel,
    homeBadgeColor: "#00529F",
    awayBadgeColor: "#E30613",
  }),
  createMatch({
    id: "match-11-1",
    dateKey: "11-aug",
    date: "11 AUG",
    time: "03:00 AM",
    league: "Premier League",
    leagueId: "premier-league",
    home: "Brighton & Hove Albion",
    away: "Manchester United",
    homeLogo: FOOTBALL_LOGOS.liverpool,
    awayLogo: FOOTBALL_LOGOS.manchesterUnited,
    homeBadgeColor: "#0057B8",
    awayBadgeColor: "#DA291C",
  }),
  createMatch({
    id: "match-11-2",
    dateKey: "11-aug",
    date: "11 AUG",
    isLive: true,
    league: "La Liga",
    leagueId: "la-liga",
    home: "Liverpool",
    away: "Manchester United",
    homeLogo: FOOTBALL_LOGOS.liverpool,
    awayLogo: FOOTBALL_LOGOS.manchesterUnited,
    homeBadgeColor: "#C8102E",
    awayBadgeColor: "#DA291C",
  }),
  createMatch({
    id: "match-10-1",
    dateKey: "10-aug",
    date: "10 AUG",
    time: "03:00 AM",
    league: "Premier League",
    leagueId: "premier-league",
    home: "Liverpool",
    away: "Manchester United",
    homeLogo: FOOTBALL_LOGOS.liverpool,
    awayLogo: FOOTBALL_LOGOS.manchesterUnited,
    homeBadgeColor: "#C8102E",
    awayBadgeColor: "#DA291C",
  }),
  createMatch({
    id: "match-9-1",
    dateKey: "9-aug",
    date: "9 AUG",
    time: "03:00 AM",
    league: "Premier League",
    leagueId: "premier-league",
    home: "Liverpool",
    away: "Manchester United",
    homeLogo: FOOTBALL_LOGOS.liverpool,
    awayLogo: FOOTBALL_LOGOS.manchesterUnited,
    homeBadgeColor: "#C8102E",
    awayBadgeColor: "#DA291C",
  }),
  createMatch({
    id: "match-13-1",
    dateKey: "13-aug",
    date: "13 AUG",
    time: "03:00 AM",
    league: "Besta deild",
    leagueId: "besta-deild",
    home: "FC Copenhagen",
    away: "FC Basel",
    homeLogo: FOOTBALL_LOGOS.fcCopenhagen,
    awayLogo: FOOTBALL_LOGOS.fcBasel,
    homeBadgeColor: "#00529F",
    awayBadgeColor: "#E30613",
  }),
];

export const FOOTBALL_FIXTURES = FOOTBALL_MATCH_LIST.filter((match) => match.dateKey === "12-aug").slice(0, 3);

export function getFixturesForDateAndLeague(dateKey, leagueId) {
  return FOOTBALL_MATCH_LIST.filter((match) => {
    const matchesDate = match.dateKey === dateKey;
    const matchesLeague = leagueId === "all" || match.leagueId === leagueId;
    return matchesDate && matchesLeague;
  });
}

export function buildFootballDetail(fixture) {
  return {
    ...fixture,
    relatedMatches: FOOTBALL_FIXTURES.filter((item) => item.id !== fixture.id),
  };
}

export function getServerStatusMessage(status) {
  if (status === "error") {
    return "This server is unavailable. Please try another server.";
  }

  return "Having trouble? Try the other server, it should work.";
}
