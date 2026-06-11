const PLACEHOLDER_POSTERS = [
  require("../assets/images/trending/trending-1.jpg"),
  require("../assets/images/trending/trending-2.jpg"),
  require("../assets/images/trending/trending-3.jpg"),
  require("../assets/images/trending/trending-4.jpg"),
];

export function getPosterSource(url, index = 0) {
  if (url && typeof url === "string") {
    return { uri: url };
  }

  return PLACEHOLDER_POSTERS[index % PLACEHOLDER_POSTERS.length];
}

function formatGenres(generes = []) {
  if (!Array.isArray(generes) || generes.length === 0) {
    return "General";
  }

  return generes.map((g) => g.name).filter(Boolean).join(" | ");
}

function formatDuration(duration) {
  if (duration == null || duration === "") {
    return "—";
  }

  if (typeof duration === "number") {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
  }

  return String(duration);
}

function formatYear(releaseDate) {
  if (!releaseDate) {
    return "—";
  }

  return String(releaseDate).slice(0, 4);
}

function formatRating(rating) {
  if (rating == null || rating === "") {
    return "—";
  }

  return String(rating);
}

export function mapMovieListItem(movie, index = 0) {
  return {
    id: movie.id,
    title: movie.title,
    image: getPosterSource(movie.poster_image, index),
    posterImage: movie.poster_image ?? null,
    year: formatYear(movie.release_date),
    duration: formatDuration(movie.duration),
    imdb: `${formatRating(movie.rating)}/10`,
    imdbRating: formatRating(movie.rating),
    categories: formatGenres(movie.generes),
    overview: movie.description ?? "",
    type: "movie",
  };
}

export function mapMovieDetail(movie, index = 0) {
  return {
    ...mapMovieListItem(movie, index),
    movieUrl: movie.movie_url ?? null,
    casts: movie.casts ?? [],
    generes: movie.generes ?? [],
  };
}

export function mapSeriesListItem(series, index = 0) {
  const seasonCount = Array.isArray(series.seasons) ? series.seasons.length : 0;

  return {
    id: series.id,
    title: series.title,
    image: getPosterSource(series.series_image, index),
    posterImage: series.series_image ?? null,
    year: formatYear(series.release_date),
    imdb: `${formatRating(series.rating)}/10`,
    imdbRating: formatRating(series.rating),
    categories: formatGenres(series.generes),
    overview: series.description ?? "",
    seasons: seasonCount > 0 ? `${seasonCount} Seasons` : "—",
    seasonCount,
    type: "series",
  };
}

export function mapSeriesDetail(series, index = 0) {
  const seasons = (series.seasons ?? []).map((season) => ({
    id: String(season.id),
    label: `Season ${season.season_number}`,
    seasonNumber: season.season_number,
    episodes: (season.episodes ?? []).map((episode) => ({
      id: String(episode.id),
      title: `S${season.season_number} E${String(episode.episode_number).padStart(2, "0")}: ${episode.title}`,
      description: episode.description ?? series.description ?? "",
      thumbnail: getPosterSource(series.series_image, index),
      episodeNumber: episode.episode_number,
      duration: formatDuration(episode.duration),
      episodeUrl: episode.episode_url ?? null,
      seasonId: season.id,
      seriesId: series.id,
    })),
  }));

  return {
    ...mapSeriesListItem(series, index),
    director: series.director ?? "",
    cast: (series.casts ?? []).map((c) => c.name).join(", "),
    awards: series.awards ?? "",
    seasonsList: seasons,
    seasons: seasons.length > 0 ? `${seasons.length} Seasons` : "—",
  };
}

export function mapAdvertisement(ad, index = 0) {
  return {
    id: String(ad.id),
    image: getPosterSource(ad.image_url, index),
    imageUrl: ad.image_url ?? null,
  };
}

export function mapMatchToFixture(match, index = 0) {
  const date = match.match_date ? new Date(match.match_date) : new Date();
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  const dateKey = `${day}-${month.toLowerCase()}`;

  return {
    id: String(match.id),
    apiId: match.id,
    dateKey,
    matchDate: match.match_date ?? null,
    date: `${day} ${month}`,
    time: `${String(hour12).padStart(2, "0")}:${minutes} ${ampm}`,
    league: match.league_name ?? `League ${match.league_id ?? ""}`.trim(),
    leagueId: match.league_id ? String(match.league_id) : "all",
    home: match.home_team_name ?? `Team ${match.home_team_id}`,
    away: match.away_team_name ?? `Team ${match.away_team_id}`,
    homeLogo: null,
    awayLogo: null,
    homeBadgeColor: index % 2 === 0 ? "#C8102E" : "#00529F",
    awayBadgeColor: index % 2 === 0 ? "#DA291C" : "#E30613",
    isLive: false,
    duration: match.duration ?? "—",
    previewImage: getPosterSource(match.preview_image, index),
    links: match.links ?? [],
  };
}

export function mapMatchDetail(match, index = 0) {
  return mapMatchToFixture(match, index);
}

export function mapGenre(genre) {
  return {
    id: genre.id,
    name: genre.name,
  };
}

export function mapGenreToCategoryCard(genre, index = 0) {
  return {
    id: String(genre.id),
    label: genre.name,
    image: getPosterSource(genre.image_url, index),
    destination: "movies",
    moviesCategory: genre.name,
  };
}

export function mapFavorite(favorite) {
  return {
    id: favorite.id,
    favoritableType: favorite.favoritable_type,
    favoritableId: favorite.favoritable_id,
    status: favorite.status ?? "want_to_watch",
    title: favorite.title ?? "",
    createdAt: favorite.created_at,
  };
}

export function extractListData(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

export function extractItemData(payload) {
  return payload?.data ?? payload;
}
