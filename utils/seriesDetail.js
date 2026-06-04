const DEFAULT_CATEGORIES = "Sci-fi | Adventure | Family";
const DEFAULT_OVERVIEW =
  "Due to a political conspiracy, an innocent man is sentenced to death for the murder of his brother. He creates an elaborate plan to break out of prison and find out why he was set up.";

const DEFAULT_DIRECTOR = "Robert Cochran, Paul Scheuring";
const DEFAULT_CAST =
  "Wentworth Miller, Dominic Purcell, Sarah Wayne Callies, Amaury Nolasco, Robert Knepper";
const DEFAULT_AWARDS =
  "People's Choice Award For Favorite New TV Drama, Primetime Emmy Award Nominee";

const EPISODE_SYNOPSIS =
  "Due to a political conspiracy, an innocent man is sentenced to death for the murder of his brother. He creates an elaborate plan to break out of prison and find out why he was set up.";

const EPISODE_THUMBNAIL = require("../assets/images/trending/trending-1.jpg");

function buildSeasonEpisodes(seasonNumber, count = 5) {
  return Array.from({ length: count }, (_, index) => {
    const episode = index + 1;
    return {
      id: `s${seasonNumber}e${episode}`,
      title: `S${seasonNumber} E${String(episode).padStart(2, "0")}: ${
        episode === 1 ? "Pilot" : `Episode ${episode}`
      }`,
      description: EPISODE_SYNOPSIS,
      thumbnail: EPISODE_THUMBNAIL,
    };
  });
}

function buildSeasons(seasonCount = 5) {
  return Array.from({ length: seasonCount }, (_, index) => {
    const seasonNumber = index + 1;
    return {
      id: `season-${seasonNumber}`,
      label: `Season ${seasonNumber}`,
      episodes: buildSeasonEpisodes(seasonNumber),
    };
  });
}

function parseSeasonCount(seasons) {
  if (!seasons) {
    return 5;
  }

  const match = String(seasons).match(/(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 5;
}

export function buildSeriesDetail(item = {}) {
  const title = item.title || "Prison Break";
  const seasonCount = item.seasonCount || parseSeasonCount(item.seasons);

  return {
    id: item.id || "prison-break",
    title,
    image: item.image || require("../assets/images/featured/featured-1.jpg"),
    categories: item.categories || DEFAULT_CATEGORIES,
    imdbRating: item.imdb?.replace("/10", "") || item.imdbRating || "8.7",
    seasons: item.seasons || `${seasonCount} Seasons`,
    year: item.year || "2014",
    overview: item.overview || DEFAULT_OVERVIEW,
    director: item.director || DEFAULT_DIRECTOR,
    cast: item.cast || DEFAULT_CAST,
    awards: item.awards || DEFAULT_AWARDS,
    seasonsList: item.seasonsList || buildSeasons(seasonCount),
  };
}

export function buildSeriesPlayItem(series) {
  return {
    title: series?.title || "Prison Break",
    image: series?.image,
    categories: series?.categories,
    year: series?.year,
    duration: "45:00",
    imdbRating: series?.imdbRating,
  };
}
