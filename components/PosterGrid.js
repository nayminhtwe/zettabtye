import React, { useEffect, useRef } from "react";
import { findNodeHandle, StyleSheet, View } from "react-native";
import PosterCard from "./PosterCard";

export const POSTER_COLUMNS = 4;
export const POSTER_GAP = 8;

export function getPosterCardWidth(containerWidth, columns = POSTER_COLUMNS, gap = POSTER_GAP) {
  return (containerWidth - gap * (columns - 1)) / columns;
}

export default function PosterGrid({
  posters,
  onPosterPress,
  cardWidth,
  indexOffset = 0,
  totalCount,
  loadMoreThresholdRows = 2,
  onLoadMore,
}) {
  const itemRefs = useRef([]);
  const visiblePosters = posters.filter((item) => item?.id != null);
  const resolvedTotal = totalCount ?? indexOffset + visiblePosters.length;
  const loadMoreRowThreshold = Math.max(0, POSTER_COLUMNS * loadMoreThresholdRows);

  useEffect(() => {
    itemRefs.current.length = visiblePosters.length;
  }, [visiblePosters.length]);

  const getHandle = (index) => {
    if (index < 0 || index >= visiblePosters.length) {
      return undefined;
    }

    return findNodeHandle(itemRefs.current[index]) ?? undefined;
  };

  const maybeLoadMore = (globalIndex) => {
    if (!onLoadMore) {
      return;
    }

    if (globalIndex + loadMoreRowThreshold >= resolvedTotal) {
      onLoadMore();
    }
  };

  if (!visiblePosters.length) {
    return null;
  }

  return (
    <View style={styles.posterGrid}>
      {visiblePosters.map((item, index) => (
        <PosterCard
          key={`movie-${item.id}`}
          ref={(node) => {
            itemRefs.current[index] = node;
          }}
          item={item}
          style={{ width: cardWidth }}
          onPress={() => onPosterPress?.(item)}
          onPosterFocus={() => maybeLoadMore(indexOffset + index)}
          nextFocusLeft={index % POSTER_COLUMNS > 0 ? getHandle(index - 1) : undefined}
          nextFocusRight={
            index % POSTER_COLUMNS < POSTER_COLUMNS - 1 && index + 1 < visiblePosters.length
              ? getHandle(index + 1)
              : undefined
          }
          nextFocusUp={index >= POSTER_COLUMNS ? getHandle(index - POSTER_COLUMNS) : undefined}
          nextFocusDown={
            index + POSTER_COLUMNS < visiblePosters.length
              ? getHandle(index + POSTER_COLUMNS)
              : undefined
          }
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  posterGrid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: POSTER_GAP,
  },
});
