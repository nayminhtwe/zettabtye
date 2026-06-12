import React, { useRef } from "react";
import { findNodeHandle, StyleSheet, View } from "react-native";
import PosterCard from "./PosterCard";

export const POSTER_COLUMNS = 4;
export const POSTER_GAP = 8;

export function getPosterCardWidth(containerWidth, columns = POSTER_COLUMNS, gap = POSTER_GAP) {
  return (containerWidth - gap * (columns - 1)) / columns;
}

export default function PosterGrid({ posters, onPosterPress, cardWidth }) {
  const itemRefs = useRef([]);

  const getHandle = (index) => findNodeHandle(itemRefs.current[index]) ?? undefined;

  return (
    <View style={styles.posterGrid}>
      {posters.map((item, index) => (
        <PosterCard
          key={item.id}
          ref={(node) => {
            itemRefs.current[index] = node;
          }}
          item={item}
          style={{ width: cardWidth }}
          onPress={() => onPosterPress?.(item)}
          nextFocusLeft={index % POSTER_COLUMNS > 0 ? getHandle(index - 1) : undefined}
          nextFocusRight={
            index % POSTER_COLUMNS < POSTER_COLUMNS - 1 && index + 1 < posters.length
              ? getHandle(index + 1)
              : undefined
          }
          nextFocusUp={index >= POSTER_COLUMNS ? getHandle(index - POSTER_COLUMNS) : undefined}
          nextFocusDown={
            index + POSTER_COLUMNS < posters.length ? getHandle(index + POSTER_COLUMNS) : undefined
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
