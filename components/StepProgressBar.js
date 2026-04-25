import React from "react";
import { StyleSheet, View } from "react-native";

export default function StepProgressBar({ totalSteps, currentStep }) {
  return (
    <View style={styles.track}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isActive = index < currentStep;
        return (
          <View
            // eslint-disable-next-line react/no-array-index-key
            key={`step-${index}`}
            style={[styles.segment, isActive ? styles.segmentActive : null]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 54,
    height: 6,
    borderRadius: 10,
    backgroundColor: "rgba(223, 222, 232, 0.12)",
    flexDirection: "row",
    overflow: "hidden",
  },
  segment: {
    width: 18,
    height: 6,
    backgroundColor: "transparent",
  },
  segmentActive: {
    backgroundColor: "#E71809",
  },
});
