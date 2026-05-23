import React from "react";
import { StyleSheet, View } from "react-native";

const TRACK_WIDTH = 54;
const SEGMENT_WIDTH = 18;
const TRACK_HEIGHT = 6;

export default function StepProgressBar({ totalSteps, currentStep }) {
  return (
    <View style={styles.track} focusable={false} accessible={false}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isActive = index === currentStep - 1;
        return (
          <View
            // eslint-disable-next-line react/no-array-index-key
            key={`step-${index}`}
            focusable={false}
            accessible={false}
            style={[styles.segment, isActive ? styles.segmentActive : null]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: 10,
    backgroundColor: "rgba(223, 222, 232, 0.12)",
    flexDirection: "row",
    overflow: "hidden",
    opacity: 1,
  },
  segment: {
    width: SEGMENT_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: 10,
  },
  segmentActive: {
    backgroundColor: "#E71809",
    borderRadius: 10,
    opacity: 1,
  },
});
