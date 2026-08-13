import {
  computeWatchProgressRatio,
  mapContinueWatchingItem,
  parsePositionMs,
  resolveResumePositionMs,
  shouldSaveWatchProgress,
} from "../watchProgress";

describe("parsePositionMs", () => {
  test("returns 0 for null", () => {
    expect(parsePositionMs(null)).toBe(0);
  });

  test("returns 0 for undefined", () => {
    expect(parsePositionMs(undefined)).toBe(0);
  });

  test("returns 0 for empty string", () => {
    expect(parsePositionMs("")).toBe(0);
  });

  test("returns 0 for negative number", () => {
    expect(parsePositionMs(-100)).toBe(0);
  });

  test("parses positive integer", () => {
    expect(parsePositionMs(5000)).toBe(5000);
  });

  test("parses numeric string", () => {
    expect(parsePositionMs("3000")).toBe(3000);
  });

  test("floors float values", () => {
    expect(parsePositionMs(1500.9)).toBe(1500);
  });

  test("returns 0 for NaN string", () => {
    expect(parsePositionMs("abc")).toBe(0);
  });
});

describe("computeWatchProgressRatio", () => {
  test("returns 0 when duration is 0", () => {
    expect(computeWatchProgressRatio(5000, 0)).toBe(0);
  });

  test("returns 0 when duration is undefined", () => {
    expect(computeWatchProgressRatio(5000, undefined)).toBe(0);
  });

  test("returns correct ratio", () => {
    expect(computeWatchProgressRatio(5000, 10000)).toBe(0.5);
  });

  test("clamps result to 1 when position exceeds duration", () => {
    expect(computeWatchProgressRatio(15000, 10000)).toBe(1);
  });

  test("clamps result to 0 for negative position", () => {
    expect(computeWatchProgressRatio(-100, 10000)).toBe(0);
  });
});

describe("shouldSaveWatchProgress", () => {
  test("returns false when position is below minimum (2000ms)", () => {
    expect(shouldSaveWatchProgress(1000, 60000)).toBe(false);
  });

  test("returns true when position is exactly at the minimum threshold (strict less-than)", () => {
    expect(shouldSaveWatchProgress(2000, 60000)).toBe(true);
  });

  test("returns true for valid mid-video position", () => {
    expect(shouldSaveWatchProgress(30000, 60000)).toBe(true);
  });

  test("returns false when position is at 95%+ of duration", () => {
    expect(shouldSaveWatchProgress(57500, 60000)).toBe(false);
  });

  test("returns true when near-end but duration is 0", () => {
    expect(shouldSaveWatchProgress(30000, 0)).toBe(true);
  });

  test("returns true at exactly the save threshold", () => {
    expect(shouldSaveWatchProgress(2001, 60000)).toBe(true);
  });
});

describe("resolveResumePositionMs", () => {
  test("returns 0 for null position", () => {
    expect(resolveResumePositionMs(null, 60000)).toBe(0);
  });

  test("returns 0 when position is below minimum resume threshold (5000ms)", () => {
    expect(resolveResumePositionMs(3000, 60000)).toBe(0);
  });

  test("returns position when valid", () => {
    expect(resolveResumePositionMs(10000, 60000)).toBe(10000);
  });

  test("returns 0 when position is at 95%+ of video length", () => {
    expect(resolveResumePositionMs(58000, 60000)).toBe(0);
  });

  test("returns position when no duration is provided", () => {
    expect(resolveResumePositionMs(10000, 0)).toBe(10000);
  });

  test("parses string position values", () => {
    expect(resolveResumePositionMs("10000", 60000)).toBe(10000);
  });
});

describe("mapContinueWatchingItem", () => {
  test("maps API item to expected shape", () => {
    const apiItem = {
      id: 42,
      name: "Test Movie",
      thumbnail: "https://example.com/thumb.jpg",
      watching_minute: 30000,
      video_length: 120000,
    };

    const result = mapContinueWatchingItem(apiItem);

    expect(result.id).toBe(42);
    expect(result.title).toBe("Test Movie");
    expect(result.image).toEqual({ uri: "https://example.com/thumb.jpg" });
    expect(result.type).toBe("movie");
    expect(result.startPositionMs).toBe(30000);
    expect(result.videoLengthMs).toBe(120000);
    expect(result.progress).toBe(0.25);
  });

  test("returns null image when thumbnail is missing", () => {
    const result = mapContinueWatchingItem({ id: 1, name: "No Thumb" });
    expect(result.image).toBeNull();
  });

  test("handles empty input gracefully", () => {
    const result = mapContinueWatchingItem({});
    expect(result.id).toBeUndefined();
    expect(result.progress).toBe(0);
  });
});
