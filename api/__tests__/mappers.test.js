import {
  dedupeListById,
  extractItemData,
  extractListData,
  extractMatchListData,
  extractPaginationMeta,
  mapMovieListItem,
  mapSeriesListItem,
} from "../mappers";

describe("extractListData", () => {
  test("returns array as-is", () => {
    const arr = [{ id: 1 }, { id: 2 }];
    expect(extractListData(arr)).toBe(arr);
  });

  test("extracts data array from paginated response", () => {
    const data = [{ id: 1 }];
    expect(extractListData({ data })).toBe(data);
  });

  test("returns empty array for null", () => {
    expect(extractListData(null)).toEqual([]);
  });

  test("returns empty array for non-array payload with no data property", () => {
    expect(extractListData({ meta: {} })).toEqual([]);
  });
});

describe("extractMatchListData", () => {
  test("returns flat array as-is", () => {
    const arr = [{ id: "1" }];
    expect(extractMatchListData(arr)).toBe(arr);
  });

  test("flattens today + upcoming into one array", () => {
    const payload = {
      data: {
        today: [{ id: "t1" }, { id: "t2" }],
        upcoming: [
          { matches: [{ id: "u1" }, { id: "u2" }] },
          { matches: [{ id: "u3" }] },
        ],
      },
    };

    const result = extractMatchListData(payload);
    expect(result).toHaveLength(5);
    expect(result.map((m) => m.id)).toEqual(["t1", "t2", "u1", "u2", "u3"]);
  });

  test("excludes today when includeToday is false", () => {
    const payload = {
      data: {
        today: [{ id: "t1" }],
        upcoming: [{ matches: [{ id: "u1" }] }],
      },
    };

    const result = extractMatchListData(payload, { includeToday: false });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("u1");
  });

  test("returns empty array for null payload", () => {
    expect(extractMatchListData(null)).toEqual([]);
  });
});

describe("extractPaginationMeta", () => {
  test("extracts meta fields from standard paginated response", () => {
    const payload = {
      data: [],
      meta: { current_page: 2, last_page: 5, per_page: 50, total: 250 },
    };

    const result = extractPaginationMeta(payload);
    expect(result).toEqual({ current_page: 2, last_page: 5, per_page: 50, total: 250 });
  });

  test("returns defaults when meta is missing", () => {
    const result = extractPaginationMeta({ data: [{ id: 1 }, { id: 2 }] });
    expect(result.current_page).toBe(1);
    expect(result.last_page).toBe(1);
    expect(result.per_page).toBe(50);
    expect(result.total).toBe(2);
  });
});

describe("dedupeListById", () => {
  test("removes duplicate IDs", () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 1 }, { id: 3 }];
    expect(dedupeListById(items)).toHaveLength(3);
  });

  test("dedupes by string-normalised ID", () => {
    const items = [{ id: "1" }, { id: 1 }];
    expect(dedupeListById(items)).toHaveLength(1);
  });

  test("filters out items with null id", () => {
    const items = [{ id: null }, { id: 1 }, { id: undefined }];
    expect(dedupeListById(items)).toHaveLength(1);
    expect(dedupeListById(items)[0].id).toBe(1);
  });

  test("returns empty array for empty input", () => {
    expect(dedupeListById([])).toEqual([]);
  });
});

describe("mapMovieListItem", () => {
  const baseMovie = {
    id: 10,
    title: "Test Movie",
    poster_image: "https://example.com/poster.jpg",
    release_date: "2023-06-15",
    duration: 120,
    rating: 8.5,
    generes: [{ name: "Action" }, { name: "Drama" }],
    description: "A great movie",
    casts: [],
  };

  test("maps basic movie fields", () => {
    const result = mapMovieListItem(baseMovie);

    expect(result.id).toBe(10);
    expect(result.title).toBe("Test Movie");
    expect(result.type).toBe("movie");
    expect(result.year).toBe("2023");
    expect(result.overview).toBe("A great movie");
  });

  test("formats duration from minutes to HH:MM:SS", () => {
    const result = mapMovieListItem(baseMovie);
    expect(result.duration).toBe("02:00:00");
  });

  test("formats genres joined by pipe", () => {
    const result = mapMovieListItem(baseMovie);
    expect(result.categories).toBe("Action | Drama");
  });

  test("formats imdb rating with /10 suffix", () => {
    const result = mapMovieListItem(baseMovie);
    expect(result.imdb).toBe("8.5/10");
  });

  test("uses remote poster when url is provided", () => {
    const result = mapMovieListItem(baseMovie);
    expect(result.image).toEqual({ uri: "https://example.com/poster.jpg" });
  });

  test("falls back to placeholder when poster_image is null", () => {
    const result = mapMovieListItem({ ...baseMovie, poster_image: null }, 0);
    expect(typeof result.image).not.toBe("object");
  });

  test("defaults genres to General when empty", () => {
    const result = mapMovieListItem({ ...baseMovie, generes: [] });
    expect(result.categories).toBe("General");
  });

  test("defaults year to dash when release_date is null", () => {
    const result = mapMovieListItem({ ...baseMovie, release_date: null });
    expect(result.year).toBe("—");
  });
});

describe("mapSeriesListItem", () => {
  const baseSeries = {
    id: 20,
    title: "Test Series",
    series_image: "https://example.com/series.jpg",
    release_date: "2022-01-01",
    rating: 9.0,
    generes: [{ name: "Thriller" }],
    description: "A great series",
    seasons: [{ id: 1 }, { id: 2 }],
    casts: [],
  };

  test("maps id, title, and type", () => {
    const result = mapSeriesListItem(baseSeries);
    expect(result.id).toBe(20);
    expect(result.title).toBe("Test Series");
    expect(result.type).toBe("series");
  });

  test("formats season count", () => {
    const result = mapSeriesListItem(baseSeries);
    expect(result.seasons).toBe("2 Seasons");
    expect(result.seasonCount).toBe(2);
  });

  test("shows dash for seasons when seasons array is empty", () => {
    const result = mapSeriesListItem({ ...baseSeries, seasons: [] });
    expect(result.seasons).toBe("—");
  });
});

describe("extractItemData", () => {
  test("extracts data property when present", () => {
    const inner = { id: 1 };
    expect(extractItemData({ data: inner })).toBe(inner);
  });

  test("returns payload directly when no data property", () => {
    const payload = { id: 1 };
    expect(extractItemData(payload)).toBe(payload);
  });
});
