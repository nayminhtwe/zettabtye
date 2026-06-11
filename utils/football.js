export function getServerStatusMessage(status) {
  if (status === "error") {
    return "This server is unavailable. Please try another server.";
  }

  return "Having trouble? Try the other server, it should work.";
}

export function buildLeagueOptionsFromMatches(matches) {
  const leagues = new Map([["all", "All"]]);

  matches.forEach((match) => {
    if (match.leagueId) {
      leagues.set(match.leagueId, match.league);
    }
  });

  return Array.from(leagues.entries()).map(([id, label]) => ({ id, label }));
}

export function buildDateTabsFromMatches(matches) {
  const tabs = new Map();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  matches.forEach((match) => {
    if (tabs.has(match.dateKey)) {
      return;
    }

    const date = match.matchDate ? new Date(match.matchDate) : new Date();
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    const isToday = compareDate.getTime() === today.getTime();

    tabs.set(match.dateKey, {
      id: match.dateKey,
      weekday: date.toLocaleString("en-US", { weekday: "short" }),
      dateLabel: match.date,
      dayLabel: isToday ? "Today" : undefined,
      isToday,
      sortKey: compareDate.getTime(),
    });
  });

  return Array.from(tabs.values()).sort((a, b) => a.sortKey - b.sortKey);
}

export function mapMatchLinksToServers(links = []) {
  return links.map((link) => ({
    id: String(link.id),
    label: link.link_name ?? link.label ?? `Server ${link.id}`,
    status: link.url ? "ok" : "error",
    url: link.url ?? null,
  }));
}

export function buildFootballDetail(fixture, allMatches = []) {
  return {
    ...fixture,
    relatedMatches: allMatches.filter((match) => match.id !== fixture.id).slice(0, 3),
  };
}
